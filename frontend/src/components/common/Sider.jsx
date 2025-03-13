// src/components/common/Sider.jsx
import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
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

const Sider = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openKeys, setOpenKeys] = useState(['config']);

  // Extract the root path for default selection
  const selectedKey = location.pathname;
  
  // Handle submenu open/close
  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // Handle menu item click
  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  // Define menu items using the new format
  const items = [
    {
      key: 'config',
      icon: <SettingOutlined />,
      label: 'Configuration',
      children: [
        {
          key: '/config/general',
          label: 'General Settings'
        },
        {
          key: '/config/simulation',
          label: 'Simulation Settings'
        }
      ]
    },
    {
      key: 'input',
      icon: <FormOutlined />,
      label: 'Input Simulation',
      children: [
        {
          key: '/input/financing',
          icon: <DollarOutlined />,
          label: 'Financing Module'
        },
        {
          key: '/input/cost',
          icon: <DollarOutlined />,
          label: 'Cost Module'
        },
        {
          key: '/input/revenue',
          icon: <RiseOutlined />,
          label: 'Revenue Module'
        },
        {
          key: '/input/risk',
          icon: <SafetyOutlined />,
          label: 'Risk Mitigation'
        }
      ]
    },
    {
      key: 'results',
      icon: <BarChartOutlined />,
      label: 'Results',
      children: [
        {
          key: '/results/overview',
          label: 'Dashboard Overview'
        },
        {
          key: '/results/cost',
          icon: <BarChartOutlined />,
          label: 'Cost Analysis'
        },
        {
          key: '/results/revenue',
          icon: <LineChartOutlined />,
          label: 'Revenue Analysis'
        },
        {
          key: '/results/cashflow',
          icon: <BarChartOutlined />,
          label: 'Cash Flow'
        },
        {
          key: '/results/irr',
          icon: <LineChartOutlined />,
          label: 'IRR Distribution'
        },
        {
          key: '/results/scenarios',
          icon: <BarChartOutlined />,
          label: 'Scenario Comparison'
        }
      ]
    }
  ];

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
        onClick={handleMenuClick}
        defaultSelectedKeys={['/config/general']}
        items={items}
        style={{ height: '100%', borderRight: 0 }}
      />
    </AntSider>
  );
};

export default Sider;