// src/components/common/Sider.jsx
import React, { useState } from 'react';
import { Layout, Menu, Modal, Button, Space, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  SettingOutlined,
  FormOutlined,
  BarChartOutlined,
  DollarOutlined,
  LineChartOutlined,
  RiseOutlined,
  SafetyOutlined,
  FundOutlined,
  WarningOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Sider: AntSider } = Layout;

const Sider = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasUnsavedChanges, submitAllForms, updateFormDirtyState } = useScenario();
  const [openKeys, setOpenKeys] = useState(['config']);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Extract the root path for default selection
  const selectedKey = location.pathname;
  
  // Handle submenu open/close
  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // Handle saving form changes and navigating
  const handleSaveAndNavigate = async () => {
    if (pendingNavigation) {
      console.log("Saving all form changes and navigating to:", pendingNavigation);
      setIsSaving(true);
      
      try {
        // Submit all dirty forms to apply their values to the context
        const result = await submitAllForms();
        
        if (result) {
          // Forms were successfully submitted
          message.success('Changes saved successfully');
        } else {
          // Something went wrong during form submission
          message.error('Some changes could not be saved');
        }
        
        // Navigate regardless (we've done our best to save)
        navigate(pendingNavigation);
      } catch (error) {
        console.error("Error saving forms:", error);
        message.error("Failed to save changes");
      } finally {
        setIsSaving(false);
        setModalVisible(false);
        setPendingNavigation(null);
      }
    }
  };

  // Handle discarding changes and navigation
  const handleDiscardAndNavigate = () => {
    if (pendingNavigation) {
      console.log("Discarding changes and navigating to:", pendingNavigation);
      
      // Clear all form dirty states
      updateFormDirtyState(false, 'all');
      
      message.info('Changes discarded');
      navigate(pendingNavigation);
      setModalVisible(false);
      setPendingNavigation(null);
    }
  };

  // Handle canceling navigation
  const handleCancelNavigation = () => {
    console.log("Navigation canceled");
    setModalVisible(false);
    setPendingNavigation(null);
  };

  // Handle menu item click
  const handleMenuClick = (e) => {
    const targetPath = e.key;
    
    console.log("=== MENU CLICK DEBUG ===");
    console.log("Target path:", targetPath);
    console.log("Current path:", location.pathname);
    console.log("hasUnsavedChanges:", hasUnsavedChanges);
    
    // Only do something if we're navigating to a different path
    if (targetPath !== location.pathname) {
      // Check if we have unsaved changes
      if (hasUnsavedChanges) {
        console.log("Showing custom confirmation modal");
        setPendingNavigation(targetPath);
        setModalVisible(true);
      } else {
        // No unsaved changes, navigate directly
        console.log("No unsaved changes, navigating directly to:", targetPath);
        navigate(targetPath);
      }
    }
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
          label: 'General Settings',
          children: [
            {
              key: '/config/general/simulation',
              icon: <SettingOutlined />,
              label: 'Simulation'
            },
            {
              key: '/config/general/locations',
              icon: <GlobalOutlined />,
              label: 'Location Defaults'
            },
            {
              key: '/config/general/oemscopes',
              icon: <ToolOutlined />,
              label: 'OEM Scopes'
            }
          ]
        },
        {
          key: '/config/project',
          label: 'Project Settings'
        },
        {
          key: '/config/scenario',
          label: 'Scenario Settings',
          children: [
            {
              key: '/config/scenario/settings',
              icon: <SettingOutlined />,
              label: 'General Settings'
            },
            {
              key: '/config/scenario/oemcontracts',
              icon: <ToolOutlined />,
              label: 'OEM Contracts'
            },
            {
              key: '/config/modules/financing',
              icon: <DollarOutlined />,
              label: 'Financing Module'
            },
            {
              key: '/config/modules/cost',
              icon: <DollarOutlined />,
              label: 'Cost Module'
            },
            {
              key: '/config/modules/revenue',
              icon: <RiseOutlined />,
              label: 'Revenue Module'
            },
            {
              key: '/config/modules/risk',
              icon: <SafetyOutlined />,
              label: 'Risk Mitigation'
            }
          ]
        }
      ]
    },
    {
      key: 'input',
      icon: <FormOutlined />,
      label: 'Input Simulation',
      children: [
        {
          key: '/input/cashflow',
          icon: <FundOutlined />,
          label: 'Cashflow Analysis'
        },
        {
          key: '/input/risk',
          icon: <WarningOutlined />,
          label: 'Risk Analysis'
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
    <>
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
          defaultSelectedKeys={['/config/general/simulation']}
          items={items}
          style={{ height: '100%', borderRight: 0 }}
        />
      </AntSider>

      {/* Custom confirmation dialog using controlled Modal */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
            Unsaved Changes
          </span>
        }
        open={modalVisible}
        onCancel={handleCancelNavigation}
        closable={true}
        maskClosable={false}
        footer={null}
        zIndex={1050} // Make sure it's above other elements
      >
        <p>You have unsaved changes that will be lost if you navigate away. What would you like to do?</p>
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancelNavigation}>
              Cancel
            </Button>
            <Button danger onClick={handleDiscardAndNavigate}>
              Discard Changes
            </Button>
            <Button type="primary" onClick={handleSaveAndNavigate} loading={isSaving}>
              Save & Continue
            </Button>
          </Space>
        </div>
      </Modal>
    </>
  );
};

export default Sider;