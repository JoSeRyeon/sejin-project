const express = require('express');
const path = require('path');
const bodyParser = require('body-parser')
const app = express();
const port = 5000; // 포트 넘버 설정 
const cors = require('cors');
const { exec, spawn } = require('child_process');
const xlsx = require('xlsx');
const fileUpload = require('express-fileupload');

app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(fileUpload());

const fs = require('fs');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    cb(null, uploadPath); // 파일 업로드 경로
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
});

app.use(cors());


let fileList = [];
const directoryPath = path.join(__dirname, 'uploads');

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  fileList = files;
});


app.post('/api', (req, res) => {
  console.log(req.body)
  res.send({ test: "hi" });
});

app.post('/runBatchFile2', (req, res) => {

  const fileInfo = req.body.fileInfo;

  console.log(fileInfo.index)


  exec(path.join(__dirname, 'file' + fileInfo.index + ".bat"), (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });

  res.send({});
});

app.post('/runBatchFile', (req, res) => {

  const { fileName, sheetName, cellAddress } = req.body;

  if (!fileName || !sheetName || !cellAddress) {
    return res.status(400).send({ error: 'fileName, sheetName, cellAddress are required.' });
  }

  const vbsPath = path.join(__dirname, 'openExcel.vbs');
  const filePath = path.join(__dirname, 'uploads', fileName);
  const cmd = `"cscript" //nologo "${vbsPath}" "${filePath}" "${sheetName}" "${cellAddress}"`;

  exec(cmd, (error, stdout, stderr) => {
    console.log('exec callback fired');
    if (error) {
      console.error('Error:', error);
      console.error('stderr:', stderr);
      return res.status(500).send({ error: 'Failed to open Excel via VBS script.' });
    }
    console.log('stdout:', stdout);
    return res.send({ success: true });
  });

})

app.post('/resetFileList', (req, res) => {

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }

    fileList = files;
  });

  res.send({});
});

app.post('/fileList', async (req, res) => {

  try {
    let fileListResult = [];

    let errorFileList = [];

    // 각 파일에서 시트명 추출
    const sheetNames = [];

    let workbook = "";
    fileList.forEach((file) => {
      let filesSheets = [];
      try {
        workbook = xlsx.readFile(path.join(__dirname, 'uploads', file));

        sheetNames.push(...workbook.SheetNames);
        filesSheets.push(...workbook.SheetNames)

        fileListResult.push({ fileName: path.basename(file), sheetList: filesSheets })

      } catch (err) {
        errorFileList.push(path.basename(file));
      }

    });

    res.send({ successFiles: fileListResult, errorFiles: errorFileList });

  } catch (error) {
    res.send('Error: ');
  }

})


app.post('/viewExcel', (req, res) => {
  const fileName = '6월 CJ.xlsx'; // 로컬에 저장된 엑셀 파일명
  const filePath = path.join(__dirname, 'uploads', fileName); // 엑셀 파일 경로

  try {
    const workbook = xlsx.readFile(filePath); // 엑셀 파일 읽기
    const sheetName = workbook.SheetNames[0]; // 첫 번째 시트 이름 가져오기
    const worksheet = workbook.Sheets[sheetName]; // 첫 번째 시트 가져오기

    // 엑셀 데이터를 2차원 배열로 변환하기
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const data = rows.map(row => row.map(cell => ({ value: cell })));

    res.send(data)
  } catch (error) {
    res.send('Error: ' + error.message);
  }
});



app.post('/searchHeader', async (req, res) => {

  let headerCellList = [];

  try {

    let fileTest = [];
    fileList.map((data) => {
      fileTest.push(path.join(__dirname, 'uploads', data))
    })



    const files = fileTest;
    let errorSheetList = [];

    // let headerCellList = [];
    const searchKeyword = ["학교가", "행사가", "단위", "제품명", "품명", "규격", "유통기한"]

    for (const file of files) {
      const workbook = xlsx.readFile(file);
      const sheetNames = workbook.SheetNames;

      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        let range = null;

        try {
          range = xlsx.utils.decode_range(worksheet['!ref']);
        } catch (e) {
          // console.log(`${path.basename(file)} - ${sheetName} `);
          errorSheetList.push(`${path.basename(file)} - ${sheetName} `)
          continue;
        }

        let headerCell = [];
        let sheetInfo = {};

        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = { c: C, r: R + 1 };
            const cellRef = xlsx.utils.encode_cell(cellAddress);
            const cell = worksheet[cellRef];

            if (cell && cell?.v && typeof (cell?.v) === 'string' && searchKeyword.includes(cell.v.toString().replace(/\s/g, ''))) {
              const rowNumber = R;
              const row = [];

              for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef1 = xlsx.utils.encode_cell({ c: C, r: rowNumber + 1 });
                const cell1 = worksheet[cellRef1];
                if (cell1) {
                  row.push(cell1.v);
                }
              }
              headerCell = row;
              sheetInfo = { fileName: path.basename(file), sheetName: sheetName };
            }
          }
        }

        headerCellList.push({ headerCell: headerCell, sheetInfo: sheetInfo });
      }
    }

    return res.send(headerCellList);

  } catch (err) {
    // console.log(err)
    return res.send(headerCellList);
  }

});


// app.post('/searchHeader', async (req, res) => {


//   let fileTest = [];
//   fileList.map((data) => {
//     fileTest.push(path.join(__dirname, 'uploads', data))
//   })



//   const files = fileTest;


//   let headerCellList = [];
//   const searchKeyword = ["학교가", "행사가", "단위", "제품명", "품명", "규격", "유통기한"]

//   files.forEach(file => {
//     const workbook = xlsx.readFile(file);
//     const sheetNames = workbook.SheetNames;

//     sheetNames.forEach(async (sheetName) => {
//       const worksheet = workbook.Sheets[sheetName];
//       const range = xlsx.utils.decode_range(worksheet['!ref']);



//       let headerCell = [];
//       let sheetInfo = {};


//       for (let R = range.s.r; R <= range.e.r; ++R) {
//         for (let C = range.s.c; C <= range.e.c; ++C) {
//           const cellAddress = { c: C, r: R + 1 };
//           const cellRef = xlsx.utils.encode_cell(cellAddress);
//           const cell = worksheet[cellRef];

//           if (cell && searchKeyword.includes(cell.v.toString().replace(/\s/g, ''))) {

//             const rowNumber = R; // 가져올 행 번호
//             const row = [];

//             for (let C = range.s.c; C <= range.e.c; ++C) {
//               const cellRef1 = xlsx.utils.encode_cell({ c: C, r: rowNumber + 1 });
//               const cell1 = worksheet[cellRef1];
//               if (cell1) {
//                 row.push(cell1.v);
//               }
//             }
//             headerCell = row;
//             sheetInfo = { fileName: path.basename(file), sheetName: sheetName }

//           }
//         }
//       }


//       headerCellList.push({ headerCell: headerCell, sheetInfo: sheetInfo });

//     })
//   })


//   return res.send(headerCellList);

// });



app.post('/search', async (req, res) => {

  let fileTest = [];
  // fileList.map((data) => {
  //   fileTest.push(path.join(__dirname, 'uploads', data))
  // });


  // if(req.body.selectedFileList){
  //   console.log(req.body.selectedFileList)
  // }

  const selectedSheetList = req.body.selectedSheetList;

  if (req.body.selectedFileList?.length > 0) {
    let selectedFileList = req.body.selectedFileList;
    selectedFileList.map((data) => {
      fileTest.push(path.join(__dirname, 'uploads', data.value))
    })
  } else {

    fileList.map((data) => {
      fileTest.push(path.join(__dirname, 'uploads', data))
    });
  }

  const files = fileTest;

  // const searchKeyword = req.body.keyword;

  const searchKeyword = req.body.keyword.toString().replace(/\s/g, '');

  let results = [];
  let searchList = [];
  let errorSheetList = [];

  for (const file of files) {
    const workbook = xlsx.readFile(file);
    const sheetNames = workbook.SheetNames;


    for (const sheetName of sheetNames) {

      let foundSheetName = false; // sheetName을 찾았는지 여부를 저장하는 변수

      if (selectedSheetList.length > 0) {

        selectedSheetList.forEach((obj) => {
          if (obj.key === sheetName) {
            foundSheetName = true;
          }
        });

        if (!foundSheetName) {
          // sheetName을 찾지 못한 경우, 다음 시트로 넘어갑니다.
          continue;
        }

      }

      const worksheet = workbook.Sheets[sheetName];
      // const range = xlsx.utils.decode_range(worksheet['!ref']);
      let range = null;

      try {
        range = xlsx.utils.decode_range(worksheet['!ref']);
      } catch (e) {
        errorSheetList.push(`${path.basename(file)} - ${sheetName} `)
        console.error(`Error decoding range for sheet "${sheetName}" in file "${file}":`, e);
        continue;
      }

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { c: C, r: R + 1 };
          const cellRef = xlsx.utils.encode_cell(cellAddress);
          const cell = worksheet[cellRef];

          if (cell && cell?.v && typeof (cell?.v) === 'string' && cell.v.toString().includes(searchKeyword)) {

            const rowNumber = R; // 가져올 행 번호
            const row = [];

            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellRef1 = xlsx.utils.encode_cell({ c: C, r: rowNumber + 1 });
              const cell1 = worksheet[cellRef1];
              if (cell1) {
                row.push(cell1.v);
              } else {
                row.push("")
              }
            }

            results.push({ file: path.basename(file), sheetName, cellAddress, value: cell.v, cell: cellRef, list: row });
          }
        }
      }
    }
  }

  searchList.push({ searchResult: results, errorSheetList: errorSheetList })
  return res.send(searchList);
});

app.listen(port, () => console.log(port));




// -----------------------------------------------------------------
// ----------------------------계산기 API----------------------------
// -----------------------------------------------------------------
app.post('/getMultiFileData', (req, res) => {
  const folderName = req.body.folderName;
  const fileArray = req.body.fileArray;
  const selectedDate = req.body.selectedDate;
  const year = Number(req.body.quarter);

  let fileDatas = [];

  fileArray.forEach((file) => {
    const filePath = path.join(__dirname, folderName, file.fileName);
    const dbData = readDataFromFile(filePath);
    const selectedDateDbData = dbData.find((obj) => obj.key === selectedDate) || null

    // ex) '2025-02'부터 '2026-01'까지의 key 리스트 만들기
    const targetKeys = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(year, 1 + i); // 1 = 2월
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      targetKeys.push(`${yyyy}-${mm}`);
    }

    // dbData를 분기별로 필터링
    const quarterDbData = dbData.filter(item => targetKeys.includes(item.key));

    // fileDatas.push({key : file.key, label : file.label, dbData : selectedDateDbData, allDbData : dbData, quarterDbData : quarterDbData});
    fileDatas.push({key : file.key, label : file.label, dbData : selectedDateDbData, allDbData : quarterDbData});
  })

  res.send(fileDatas);
});

app.post('/getFileData', (req, res) => {
  const folderName = req.body.folderName;
  const fileName = req.body.fileName;
  const filePath = path.join(__dirname, folderName, fileName);
  const data = readDataFromFile(filePath);

  res.send(data);
});

app.post('/setFileData', (req, res) => {
  const folderName = req.body.folderName;
  const fileName = req.body.fileName;
  const data = req.body.data;
  const filePath = path.join(__dirname, folderName, fileName);
  writeDataToFile(data, filePath)

  res.send({});
});

// 파일을 읽는 함수
const readDataFromFile = (filePath) => {
  const rawData = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(rawData);
};

const writeDataToFile = (data, filePath) => {
  const dirPath = path.dirname(filePath); // 파일이 저장될 디렉터리 경로

  // 디렉터리가 없으면 생성 (recursive: true로 중첩된 폴더도 생성 가능)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // 데이터를 JSON 문자열로 변환하고 저장
  const updatedData = JSON.stringify(data, null, 2); // 포맷팅해서 저장
  fs.writeFileSync(filePath, updatedData, 'utf8');
};