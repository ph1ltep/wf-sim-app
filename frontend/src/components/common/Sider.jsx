// src/components/common/Sider.jsx
import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  SettingOutlined,
  FormOutlined,
  BarChartOutlined,
  DollarOutlined,
  LineChartOutlined,
  RiseOutlined,
  SafetyOutlined
} from '@ant-design/icons';

const { Sider: AntSider } = Layout;
const { SubMenu } = Menu;

const Sider = ({ collapsed }) => {
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState(['config']);

  // Extract the root path for default selection
  const selectedKey = location.pathname;
  const rootPath = '/' + (location.pathname.split('/')[1] || '');

  // Handle submenu open/close
  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <AntSider 
      width={240} 
      collapsed={collapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        defaultSelectedKeys={['/config/general']}
        style={{ height: '100%', borderRight: 0 }}
      >
        <SubMenu key="config" icon={<SettingOutlined />} title="Configuration">
          <Menu.Item key="/config/general">
            <Link to="/config/general">General Settings</Link>
          </Menu.Item>
          <Menu.Item key="/config/simulation">
            <Link to="/config/simulation">Simulation Settings</Link>
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="input" icon={<FormOutlined />} title="Input Simulation">
          <Menu.Item key="/input/financing" icon={<DollarOutlined />}>
            <Link to="/input/financing">Financing Module</Link>
          </Menu.Item>
          <Menu.Item key="/input/cost" icon={<DollarOutlined />}>
            <Link to="/input/cost">Cost Module</Link>
          </Menu.Item>
          <Menu.Item key="/input/revenue" icon={<RiseOutlined />}>
            <Link to="/input/revenue">Revenue Module</Link>
          </Menu.Item>
          <Menu.Item key="/input/risk" icon={<SafetyOutlined />}>
            <Link to="/input/risk">Risk Mitigation</Link>
          </Menu.Item>
        </SubMenu>
        
        <SubMenu key="results" icon={<BarChartOutlined />} title="Results">
          <Menu.Item key="/results/overview">
            <Link to="/results/overview">Dashboard Overview</Link>
          </Menu.Item>
          <Menu.Item key="/results/cost" icon={<BarChartOutlined />}>
            <Link to="/results/cost">Cost Analysis</Link>
          </Menu.Item>
          <Menu.Item key="/results/revenue" icon={<LineChartOutlined />}>
            <Link to="/results/revenue">Revenue Analysis</Link>
          </Menu.Item>
          <Menu.Item key="/results/cashflow" icon={<BarChartOutlined />}>
            <Link to="/results/cashflow">Cash Flow</Link>
          </Menu.Item>
          <Menu.Item key="/results/irr" icon={<LineChartOutlined />}>
            <Link to="/results/irr">IRR Distribution</Link>
          </Menu.Item>
          <Menu.Item key="/results/scenarios" icon={<BarChartOutlined />}>
            <Link to="/results/scenarios">Scenario Comparison</Link>
          </Menu.Item>
        </SubMenu>
      </Menu>
    </AntSider>
  );
};

export default Sider;