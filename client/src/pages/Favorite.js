import '../App.css';
import React from 'react';
import axios from "axios";
import { DatePicker, Space, ConfigProvider , Button, Divider, Radio, Upload, message , Input, Card, Col, Row , notification, Spin, Select, Tooltip ,Empty  } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import locale from 'antd/locale/ko_KR';
import '../index.css';

import { useState , useEffect } from 'react';

export default function Favorite(props_) {
  const { Search } = Input;

  const [api, contextHolder] = notification.useNotification();
  const [result, setResult] = useState([]);
  const [errorSheetList, setErrorSheetList] = useState([]);

  const [errorFileList, setErrorFileList] = useState([]);

  const [headerInfo, setHeaderInfo] = useState([]);
  const [searchFlag, setSearchFlag] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [selectedFileList, setSelectedFileList] = useState([]);

  const [selectedSheetList, setSelectedSheetList] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const [searchSheetList, setSearchSheetList] = useState([]);

    const [starSheet, setStarSheet] = useState([
        {
            file : '9 CJ.xlsx',
            key : '상온(당면,분가공,장류,유지류)', 
            label: '상온(당면,분가공,장류,유지류)', 
            value : '상온(당면,분가공,장류,유지류)'
        }
    ]);

    const [starFile, setStarFile] = useState([
        {
            label: '9 CJ.xlsx     시트명 : 중단공지, 25년2학기 신상품, 냉동,냉장,두부,묵,어묵,치즈,면,떡 등, 소스, FC(프렌차이즈 브랜드), 밀키트(세트), 수산물, 후식류, 자연드림, 상온(당면,분가공,장류,유지류), 25년09월 학교가', 
            sheet: (11)['중단공지', '25년2학기 신상품', '냉동,냉장,두부,묵,어묵,치즈,면,떡 등', '소스', 'FC(프렌차이즈 브랜드)', '밀키트(세트)', '수산물', '후식류', '자연드림', '상온(당면,분가공,장류,유지류)', '25년09월 학교가'],
            value: '9 CJ.xlsx'
        }
    ]);


  useEffect(() => {
    setSearchFlag(true);
    getFileList();
    getHeaderList();

    onSearch();
  }, [])

  useEffect(() => {

    if (errorFileList.length <= 0) return;
    openErrorNotification("top", errorFileList);

  }, [errorFileList])

  useEffect(() => {

    if (errorSheetList.length <= 0) return;
    openNotification("top", errorSheetList);

  }, [errorSheetList])

  const openNotification = (placement, content) => {

    api.warning({
      message: `일부 파일 검색 실패`,
      description: (
        <div>
          {
            content.map((data) => {
              return <div>{data}</div>
            })
          }
          <div>
          에서 문제가 발생하여 불러오는데 실패 하였습니다.
          </div>
          
        </div>
      ),
      placement,
      // duration: 0,
    });

  };


  const openErrorNotification = (placement, content) => {
    api.error({
      message: `일부 파일 문제 발견`,
      description: (
        <div>
          {
            content.map((data) => {
              return <div>★{data}</div>
            })
          }
          <div>
          에서 문제가 발생하여 불러오는데 실패 하였습니다.
          </div>
          
        </div>
      ),
      placement,
      duration: null,
    });
  };


  function resetFileList() {
    axios.post('http://localhost:5000/resetFileList')
    .then(response => {
      setSearchFlag(true);
      getFileList();
      getHeaderList();
    })
    .catch(error => {
      console.error(error);
    });
  }

  function openFile(sheetName) {
    const parameter = {
      sheetName: sheetName,
    };
  
    axios.post('http://localhost:5000/runBatchFile', parameter)
    .then(response => {
      let res = response.data;
      let result = [];
    })
    .catch(error => {
      console.error(error);
    });

  }

  function getFileList() {
    axios.post('http://localhost:5000/fileList')
    .then(response => {
      let successFiles = response.data.successFiles;
      let errorFiles = response.data.errorFiles;
      let result = [];

      successFiles.forEach((data) => {
        result.push({value : data.fileName, label : data.fileName + "     시트명 : " + data.sheetList.join(', '), sheet : data.sheetList})    
      })      

      setFileList(result);
      setErrorFileList(errorFiles);
    })
    .catch(error => {
      console.error(error);
    });

  }
  
  function getHeaderList() {
    axios.post('http://localhost:5000/searchHeader', "")
    .then(response => {
      let tt = response.data;
      setHeaderInfo(tt);
      setSearchFlag(false);
    })
    .catch(error => {
      console.error(error);
    });

  }

  const handleChange = (value, array) => {
    setSelectedFileList(array);
    
    let newArray = [];
    array.map(obj => {
      obj.sheet.map((item) => {
        newArray.push({key : item, label : item, file : obj.value, value : item })
      })
    });

    setSelectedSheetList(newArray);

    searchSheetList.filter((obj) => {
      return  obj.file 
    })

    const filteredSearchSheetList = searchSheetList.filter((item) => {
      return array.some((obj) => obj.value === item.file);
    });

    setSearchSheetList(filteredSearchSheetList)
  };

  const handleChange2 = (value, array) => {
    setSearchSheetList(array);
  };

  // here!!
  const onSearch = (value) => {
    setSearchFlag(true);
    setSearchValue(value);

    console.log(headerInfo);
    
    const parameter = {
      keyword: "백설 하얀설탕",
      fileName: "9 CJ.xlsx",
      sheetName: "상온(당면,분가공,장류,유지류)",
    };

    axios.post('http://localhost:5000/searchFavorite', parameter)
      .then(response => {
      
        let tt = response.data.searchResult;
        console.log(tt)
        setResult(tt);
        setErrorSheetList(response.data.errorSheetList);
        setSearchFlag(false);
      })
      .catch(error => {
        console.error(error);
      });

  }

  return (
    <div className='main-container' >
      <Spin spinning={searchFlag} size="large">
        <ConfigProvider locale={locale}>

          {/* <div className='title'>
            <Space className='sub-item' direction="vertical">
            </Space>

            <div>
              <Divider style={{ color: "white", borderColor: "#C9A7EB" }} orientation="right" orientationMargin={20}>
                업체 단가 SEARCH 사이트
                <span style={{ fontSize: "3px", marginLeft: "5px" }}>
                  by @seryeon
                </span>
              </Divider>
            </div>

            <Search
              className='sub-item'
              placeholder="input search text"
              allowClear
              enterButton="Search"
              size="large"
              onSearch={onSearch}
            />

            <Select
              className='sub-item'
              mode="multiple"
              style={{
                width: '100%',
              }}
              placeholder="Select FileName"
              onChange={handleChange}
              options={fileList}
              allowClear={true}
              filterOption={(input, option) =>
                option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            />

            <Select
              className='sub-item'
              mode="multiple"
              style={{
                width: '100%',
              }}
              placeholder="Select Sheet"
              onChange={handleChange2}
              options={selectedSheetList}
              allowClear={true}
              value={searchSheetList}
            />

            <div style={{ textAlign: "right" }}>
              <Button className='sub-item2' danger onClick={resetFileList}>RESET FILE LIST</Button>
            </div>
          </div> */}


          <div className='title'>
            <Space className='sub-item' direction="vertical">
            </Space>

            <div>
              <Divider style={{ color: "white", borderColor: "#C9A7EB" }} orientation="right" orientationMargin={20}>
                즐겨찾기
                <span style={{ fontSize: "3px", marginLeft: "5px" }}>
                  by @seryeon
                </span>
              </Divider>
            </div>
          </div>

          <div>
            {contextHolder}

            <div style={{ width: "100px" }}>
            </div>

            {!searchFlag && result.length > 0 && headerInfo.length > 0 ?
             <div style={{ width : "100%"}}>
                <div style={ { padding : "10px"}}>
                    <div>💛</div>
                    <div> 파일명 : CJ </div>
                    <div> 시트명 : 분가공 </div>
                    <div> 품목명 : 하얀설탕 </div>

                </div>
              <Row gutter={16}>
                {
                  !searchFlag && result.length > 0 && headerInfo.length > 0 &&
                  result.map((data) => {
                    return (
                      <Col span={4}>
                        <Card title={"파일명 : " + data.file + " 시트명 : " + data.sheetName} bordered={false} style={{ margin: "10px" }}>
                          <Tooltip
                            title={
                              <div>
                                <div>{"파일명 : " + data.file}</div>
                                <br></br>
                                <div>{"시트명 : " + data.sheetName}</div>
                              </div>
                            }
                          >
                            <div>
                              <div>
                                <Button className='sub-item3' danger onClick={() => { openFile(data.file) }}>OPEN FILE</Button>
                              </div>

                              <div style={{ background: "#FEF2F4" }}>
                                <span style={{ marginRight: "3px" }}>
                                  시트명 :
                                </span>
                                {data.sheetName}
                              </div>

                              <div style={{ background: "#FEF2F4" }}>
                                <span style={{ marginRight: "3px" }}>
                                  셀 위치 :
                                </span>
                                {data.cell}
                              </div>

                              <br />
                              {
                                data.value.split('\n').map((material) => {
                                  return <p style={{ margin: "0px", background: "lavender" }}>{material}</p>
                                })
                              }
                            </div>
                          </Tooltip>

                          <br></br>

                          <div>
                            {
                              data.list.map((material, index) => {
                                const test = headerInfo.find((elem) => elem.sheetInfo.fileName === data.file && elem.sheetInfo.sheetName === data.sheetName)

                                return (
                                  <p style={{ margin: "4px" }}>
                                    {
                                      test !== undefined && test.headerCell !== undefined && test.headerCell[index] !== undefined ?
                                        <span style={{ marginRight: "5px", fontWeight: "600" }}> {test.headerCell[index]} : </span>
                                        :
                                        ""
                                    }
                                    {material}
                                  </p>
                                )
                              })
                            }
                          </div>
                        </Card>
                      </Col>
                    )
                  })
                }
              </Row>
              </div>
              :
              <Empty className='blank' description={false} />
            }
          </div>
        </ConfigProvider>
      </Spin>
    </div>
  )
}
