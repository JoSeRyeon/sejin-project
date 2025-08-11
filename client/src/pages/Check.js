import React, { useRef, useEffect, useContext, useState } from 'react';
import { ConfigProvider, Menu, Layout, Spin, theme, Button, notification, Table, Collapse, Space, Tag, Tooltip, Tabs, Divider, Card, Row, Col } from 'antd';
import { UploadOutlined, DatabaseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import '../index.css';
import '../App.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import locale from 'antd/locale/ko_KR';
import * as XLSX from 'xlsx';
import axios from "axios";

export default function Check(props_) {

    const { Content, Sider } = Layout;

    const [searchFlag, setSearchFlag] = useState(false);
    const [current, setCurrent] = useState('register');
    const [selectedTab, setSelectedTab] = useState('menu')

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const items = [
        {
            label: '파일 업로드',
            key: 'format',
            icon: <UploadOutlined />,
        },
        {
            label: '데이터베이스',
            key: 'register',
            icon: <DatabaseOutlined />,
        },

        {
            label: '식재료 포함 여부',
            key: 'foodCheck',
            icon: <CheckCircleOutlined />,
        },
    ];

    const tabItems = [
        {
            key: 'menu',
            label: '식단표',
            children: <DataTable category={"menu"} setSearchFlag={setSearchFlag} />,
        },
        {
            key: 'ingredients',
            label: '식재료 품의내역',
            children: <DataTable category={"ingredients"} setSearchFlag={setSearchFlag} />,
        },
        {
            key: 'myFood',
            label: '내 요리',
            children: <DataTable category={"myFood"} setSearchFlag={setSearchFlag} />,
        },
    ];

    const onChangeTab = key => {
        setSelectedTab(key);
    };

    const onClick = (e) => {
        setCurrent(e.key);
    };

    return (
        <div className='main-container'>
            <Spin spinning={searchFlag} size="large">
                <ConfigProvider
                    locale={locale}
                    theme={{
                        components: {
                            Table: {
                                footerBg: "#FFF2F2"
                            },
                        },
                    }}
                >
                    <Layout>
                        <div style={{ padding: '16px 24px' }}>
                            <Layout
                                style={{
                                    padding: '7px 3px',
                                    minHeight: 'calc(100vh - 100px)',
                                    background: colorBgContainer,
                                    borderRadius: borderRadiusLG,
                                }}
                            >
                                <Sider width={200} style={{ background: colorBgContainer }} >
                                    <Menu
                                        mode="inline"
                                        defaultSelectedKeys={[current]}
                                        style={{ height: '100%' }}
                                        onClick={onClick}
                                        items={items}
                                    />
                                </Sider>

                                <Content
                                    style={{
                                        padding: '0 24px',
                                        minHeight: 280,
                                    }}
                                >
                                    <div>
                                        <div>
                                            {
                                                current === 'format' ?
                                                    <div>

                                                        <div style={{marginTop : "10px"}} className='check-container'>
                                                            <div className='check-title'>
                                                                식단표
                                                            </div>
                                                            <ExcelUpload category={"menu"} setSearchFlag={setSearchFlag} />
                                                        </div>

                                                        <Divider />

                                                        <div className='check-container'>
                                                            <div className='check-title'>
                                                                식재료 품의내역 업로드
                                                            </div>
                                                            <ExcelUpload category={"ingredients"} setSearchFlag={setSearchFlag} />
                                                        </div>

                                                        <Divider />

                                                        <div className='check-container'>
                                                            <div className='check-title'>
                                                                내 요리 업로드
                                                            </div>
                                                            <ExcelUpload category={"myFood"} setSearchFlag={setSearchFlag} />
                                                        </div>

                                                    </div>
                                                    :
                                                    current === 'register' ?
                                                        <Tabs defaultActiveKey="menu" items={tabItems} onChange={onChangeTab} />
                                                        :
                                                        current === "foodCheck" ?
                                                            <div>
                                                                <FoodInputCheck category={"menu"} setSearchFlag={setSearchFlag} />
                                                            </div>
                                                            :
                                                            ""
                                            }

                                        </div>
                                    </div>
                                </Content>
                            </Layout>
                        </div>
                    </Layout>
                </ConfigProvider>
            </Spin>
        </div>
    )
}


const ExcelUpload = ({ category, setSearchFlag }) => {
    const [excelData, setExcelData] = useState({ header: [], data: [] });
    const [api, contextHolder] = notification.useNotification();

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const arrayBuffer = new Uint8Array(event.target.result);
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // 2차원 배열

            if (jsonData.length === 0) return;

            const [header, ...rows] = jsonData;

            setExcelData({
                header,
                data: rows,
            });
        };

        reader.readAsArrayBuffer(file);
    };


    function saveExcelData() {
        const parameter = {
            folderName: 'db',
            fileName: `${category}.json`,
            data: excelData,
        };

        setSearchFlag(true);

        axios.post('http://localhost:5000/setFileData', parameter)
            .then(response => {
                setSearchFlag(false);
                openNotification();
            })
            .catch(error => {
                console.error(error);
                setSearchFlag(false);
                openNotification(false);
            });
    }

    const openNotification = (isSuccess = true) => {
        api.success({
            message: isSuccess ? '저장 완료' : '저장 실패',
            description:
                isSuccess ? '저장이 완료되었습니다.' : '저장에 실패했습니다.',
            placement: 'top',
            duration: 2,
        });
    };

    return (
        <div>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
            <div>
                <span>
                    데이터 업로드 개수: {excelData.data.length}
                </span>
            </div>
            <div style={{ marginTop: "10px" }}>
                <Button type="primary" onClick={saveExcelData}>저장</Button>
            </div>

            {contextHolder}
        </div>
    );
};


const DataTable = ({ category, setSearchFlag }) => {
    const [excelData, setExcelData] = useState({ header: [], data: [] });
    const [api, contextHolder] = notification.useNotification();

    const [dataSource, setDataSource] = useState([]);
    const [columns, setColumns] = useState([]);

    useEffect(() => {
        getFormat();
    }, [])

    function saveExcelData() {
        const parameter = {
            folderName: 'db',
            fileName: `${category}.json`,
            data: excelData,
        };

        setSearchFlag(true);

        axios.post('http://localhost:5000/setFileData', parameter)
            .then(response => {
                setSearchFlag(false);
                openNotification();
            })
            .catch(error => {
                console.error(error);
                setSearchFlag(false);
                openNotification(false);
            });
    }

    const getFormat = () => {
        const parameter = {
            folderName: 'db',
            fileName: `${category}.json`
        };

        setSearchFlag(true);

        axios.post('http://localhost:5000/getFileData', parameter)
            .then(res => {
                setSearchFlag(false);

                const excelJson = res.data;

                setColumns(excelJson.header.map((title, index) => ({
                    title,
                    dataIndex: `col_${index}`,
                    key: `col_${index}`,
                })));

                setDataSource(excelJson.data.map((row, rowIndex) => {
                    const rowObject = { key: rowIndex };
                    row.forEach((value, colIndex) => {
                        rowObject[`col_${colIndex}`] = value;
                    });
                    return rowObject;
                }));

            })
            .catch(error => {
                console.error(error);
                setDataSource([]);
                setSearchFlag(false);
            });

    }

    const openNotification = (isSuccess = true) => {
        api.success({
            message: isSuccess ? '저장 완료' : '저장 실패',
            description:
                isSuccess ? '저장이 완료되었습니다.' : '저장에 실패했습니다.',
            placement: 'top',
            duration: 2,
        });
    };

    return (
        <div>
            <Table columns={columns} dataSource={dataSource} />
            {contextHolder}

        </div>
    );
};

const FoodInputCheck = ({ category, setSearchFlag }) => {
    const [excelData, setExcelData] = useState({ header: [], data: [] });
    const [api, contextHolder] = notification.useNotification();

    const [dataSource, setDataSource] = useState([]);
    const [myFoodData, setMyFoodData] = useState([]);
    const [ingredients, setIngredients] = useState([]);

    useEffect(() => {
        getFormat();
        getFormat2("myFood", setMyFoodData);
        getFormat2("ingredients", setIngredients);
    }, [])

    function saveExcelData() {
        const parameter = {
            folderName: 'db',
            fileName: `${category}.json`,
            data: excelData,
        };

        setSearchFlag(true);

        axios.post('http://localhost:5000/setFileData', parameter)
            .then(response => {
                setSearchFlag(false);
                openNotification();
            })
            .catch(error => {
                console.error(error);
                setSearchFlag(false);
                openNotification(false);
            });
    }


    const getFormat = () => {
        const parameter = {
            folderName: 'db',
            fileName: `${category}.json`
        };

        setSearchFlag(true);

        axios.post('http://localhost:5000/getFileData', parameter)
            .then(res => {
                setSearchFlag(false);

                const excelJson = res.data;
                const grouped = {};

                excelJson.data.forEach(row => {
                    const [date, dish] = row;

                    if (!grouped[date]) {
                        grouped[date] = [];
                    }

                    if (dish) {
                        grouped[date].push(dish);
                    }
                });

                const result = Object.entries(grouped).map(([date, items]) => ({
                    date,
                    items
                }));

                setDataSource(result);
            })
            .catch(error => {
                console.error(error);
                setDataSource([]);
                setSearchFlag(false);
            });

    }

    const getFormat2 = (fileName, setData) => {
        const parameter = {
            folderName: 'db',
            fileName: `${fileName}.json`
        };

        setSearchFlag(true);

        axios.post('http://localhost:5000/getFileData', parameter)
            .then(res => {
                setSearchFlag(false);
                const excelJson = res.data;

                setData(excelJson);

            })
            .catch(error => {
                console.error(error);
                setData([]);
                setSearchFlag(false);
            });

    }

    const openNotification = (isSuccess = true) => {
        api.success({
            message: isSuccess ? '저장 완료' : '저장 실패',
            description:
                isSuccess ? '저장이 완료되었습니다.' : '저장에 실패했습니다.',
            placement: 'top',
            duration: 2,
        });
    };

    const checkFoodInput = () => {
        const toDateString = (d) => new Date(d).toDateString();

        const results = dataSource.map((elm) => {
            const { items: menuList, date } = elm;
            const targetDateStr = toDateString(date);

            const check = menuList.map((menu) => {
                // 1. 해당 메뉴에 해당하는 row 중 '필수'만 추출
                const menuMatchedRows = myFoodData.data.filter(row => row[2] === menu);
                const requiredIngredients = menuMatchedRows
                    .filter(row => row[10] === '필수')
                    .map(row => row[6]); // 7번째 값 (식재료 이름)

                // 2. 해당 날짜의 식재료 사용 내역 추출
                const ingredientsForDate = ingredients.data.filter(row => toDateString(row[1]) === targetDateStr);

                // 3. 실제 포함된 식재료 이름 집합
                const includedSet = new Set(ingredientsForDate.map(row => row[5]));

                // 4. 포함 여부 판단
                const notIncluded = requiredIngredients.filter(item => !includedSet.has(item));
                const includedNames = requiredIngredients.filter(item => includedSet.has(item));
                const includedRows = ingredientsForDate.filter(row => includedNames.includes(row[5]));

                return {
                    result: notIncluded.length === 0,
                    notIncluded,
                    included: includedRows,
                };
            });

            return { ...elm, check };
        });

        setDataSource(results);
    };


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: "10px" }}>
                <Button type="primary" onClick={checkFoodInput}>체크하기</Button>
            </div>
            <CardList dataSource={dataSource} />
        </div>

    );
};



const CardList = ({ dataSource }) => {

    return (
        <div>
            <Row gutter={[16, 24]}>
                {
                    dataSource.map((elm) => {
                        return (
                            <Col span={6}>
                                <Card title={elm.date}>
                                    {
                                        elm.items.map((item, index) => {
                                            return (
                                                <div key={`${elm.data}-${index}`}>
                                                    {
                                                        elm.check && elm.check[index] && elm.check[index].included ?
                                                            <Tooltip title={
                                                                <div>
                                                                    {
                                                                        elm.check[index].included.length > 0 ?
                                                                            elm.check[index].included.map((obj, idx) => (
                                                                                <div key={idx}>
                                                                                    {obj[5]} : {obj[8]}{obj[9]}
                                                                                </div>
                                                                            ))
                                                                            : "❗필수지정없음"
                                                                    }

                                                                </div>
                                                            }>
                                                                <span className={elm.check && elm.check[index] && !elm.check[index].result ? "fail-highlight" : ""}>{item}</span>
                                                            </Tooltip>
                                                            :
                                                            <span className={elm.check && elm.check[index] && !elm.check[index].result ? "fail-highlight" : ""}>{item}</span>
                                                    }

                                                    <span>
                                                        {
                                                            elm.check && elm.check[index] &&
                                                            <span className={elm.check[index].result ? "success" : "fail"} style={{ margin: "0 10px" }}>
                                                                {elm.check[index].result ? "OK" : "CHECK!"}
                                                            </span>
                                                        }
                                                    </span>

                                                    {
                                                        elm.check && elm.check[index] && !elm.check[index].result &&
                                                        <div style={{ padding: "4px 12px", border: "1px solid gray", borderRadius: "5px" }}>
                                                            <div>🚨 포함되지 않은 항목</div>
                                                            <div style={{ paddingLeft: "10px" }}>
                                                                : {elm.check[index].notIncluded.join(', ')}
                                                            </div>

                                                        </div>
                                                    }
                                                </div>
                                            )
                                        })
                                    }
                                </Card>
                            </Col>
                        )
                    })
                }

            </Row>
        </div>
    );
};



