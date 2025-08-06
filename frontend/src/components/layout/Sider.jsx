// src/components/common/Sider.jsx
import React, { useState } from 'react';
import { Layout, Menu, Modal, Button, Space, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  SettingOutlined,
  DollarOutlined,
  RiseOutlined,
  SafetyOutlined,
  GlobalOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
  FieldTimeOutlined,
  AreaChartOutlined,
  FundProjectionScreenOutlined,
  FundOutlined, // Added this import
  DotChartOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ProjectOutlined,
  BankOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  ControlOutlined,
  BugOutlined,
  BuildOutlined,
  SecurityScanOutlined,
  LockOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Sider: AntSider } = Layout;

const Sider = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { submitAllForms, updateFormDirtyState } = useScenario();
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
        //setModalVisible(false);
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
      //setModalVisible(false);
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
    navigate(targetPath);
  };

  // Define menu items - WITH UNIQUE ICONS
  const items = [
    {
      key: 'config',
      icon: <SettingOutlined />,
      label: 'Configuration',
      children: [
        {
          key: '/config/app-settings',
          icon: <AppstoreOutlined />,
          label: 'App Settings'
        },
        {
          key: 'config-defaults',
          icon: <DatabaseOutlined />,
          label: 'Defaults',
          children: [
            {
              key: '/config/defaults/locations',
              icon: <GlobalOutlined />,
              label: 'Locations'
            },
            {
              key: '/config/defaults/omscopes',
              icon: <ToolOutlined />,
              label: 'O&M Scopes'
            }
          ]
        },
        {
          key: '/config/project-settings',
          icon: <ProjectOutlined />,
          label: 'Project Settings'
        },
        {
          key: '/config/scenario-settings',
          icon: <ControlOutlined />,
          label: 'Scenario Settings'
        }
      ]
    },
    {
      key: 'scenario',
      icon: <FileTextOutlined />,
      label: 'Scenario',
      children: [
        {
          key: 'scenario-equipment',
          icon: <ToolOutlined />,
          label: 'Equipment',
          children: [
            {
              key: '/scenario/equipment/specifications',
              icon: <SettingOutlined />,
              label: 'Specifications'
            },
            {
              key: '/scenario/equipment/leading-edge',
              icon: <ThunderboltOutlined />,
              label: 'Leading Edge'
            },
            {
              key: '/scenario/equipment/failure-rates',
              icon: <ExclamationCircleOutlined />,
              label: 'Failure Rates'
            }
          ]
        },
        {
          key: 'scenario-economics',
          icon: <DollarOutlined />,
          label: 'Economics',
          children: [
            {
              key: '/scenario/economics/investment',
              icon: <BuildOutlined />,
              label: 'Investment'
            },
            {
              key: '/scenario/economics/revenue',
              icon: <RiseOutlined />,
              label: 'Revenue'
            },
            {
              key: '/scenario/economics/market-factors',
              icon: <AreaChartOutlined />,
              label: 'Market Factors'
            }
          ]
        },
        {
          key: 'scenario-operations',
          icon: <ThunderboltOutlined />,
          label: 'Operations',
          children: [
            {
              key: '/scenario/operations/service-contracts',
              icon: <BankOutlined />,
              label: 'Service Contracts'
            },
            {
              key: '/scenario/operations/operating-costs',
              icon: <ShoppingCartOutlined />,
              label: 'Operating Costs'
            },
            {
              key: '/scenario/operations/performance',
              icon: <ThunderboltOutlined />,
              label: 'Performance'
            }
          ]
        },
        {
          key: '/scenario/financing',
          icon: <FundOutlined />,
          label: 'Financing'
        },
        {
          key: 'scenario-risk',
          icon: <SafetyOutlined />,
          label: 'Risk',
          children: [
            {
              key: '/scenario/risk/mitigations',
              icon: <LockOutlined />,
              label: 'Mitigations'
            },
            {
              key: '/scenario/risk/warranties',
              icon: <SafetyCertificateOutlined />,
              label: 'Warranties'
            }
          ]
        },
      ]
    },
    {
      key: 'simulations',
      icon: <ExperimentOutlined />,
      label: 'Simulations',
      children: [
        {
          key: '/simulations/external-factors',
          icon: <AreaChartOutlined />,
          label: 'External Factors'
        },
        {
          key: '/simulations/operational-risks',
          icon: <BugOutlined />,
          label: 'Operational Risks'
        }
      ]
    },
    {
      key: 'analyses',
      icon: <FundProjectionScreenOutlined />,
      label: 'Analyses',
      children: [
        {
          key: '/analyses/cashflow',
          icon: <FundOutlined />,
          label: 'Cashflow'
        },
        {
          key: '/analyses/sensitivity',
          icon: <DotChartOutlined />,
          label: 'Sensitivity'
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
          defaultSelectedKeys={['/config/app-settings']}
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