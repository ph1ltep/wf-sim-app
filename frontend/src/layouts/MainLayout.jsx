// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Sider from '../components/common/Sider';
//import { useBeforeUnloadProtection } from '../hooks/useNavigationProtection';

const { Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  // Use the beforeUnload protection
  //useBeforeUnloadProtection();

  const toggleSider = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header collapsed={collapsed} toggle={toggleSider} />
      <Layout>
        <Sider collapsed={collapsed} />
        <Layout className="site-layout" style={{ padding: '0 24px 24px' }}>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: '16px 0',
              minHeight: 280,
              background: '#fff',
              borderRadius: 4,
              position: 'relative',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;