import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import { SearchOutlined, CalculatorOutlined } from '@ant-design/icons';

const { Header, Content, Footer, Sider } = Layout;

function LayoutContainer() {
    const navigate = useNavigate();

    const [current, setCurrent] = useState('check');

    const items = [
        {
            label: 'Search',
            key: 'search',
            icon: <SearchOutlined />,
        },
        {
            label: 'Favorite',
            key: 'favorite',
            icon: <CalculatorOutlined />,
        },
        {
            label: 'Check',
            key: 'check',
            icon: <CalculatorOutlined />,
        },
    ];

    const onClick = (e) => {
        setCurrent(e.key);
        navigate(`/${e.key}`);
    };

    return (

        <Layout>
            <Header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 999

                }}
            >
                <Menu
                    theme="dark"
                    mode="horizontal"
                    onClick={onClick}
                    selectedKeys={[current]}
                    items={items}
                    style={{
                        flex: 1,
                        minWidth: 0,
                    }}
                />
            </Header>

            <div className="content">
                <Outlet /> {/* 여기에 페이지별 콘텐츠가 표시됨 */}
            </div>
        </Layout>
    );
}

export default LayoutContainer;

