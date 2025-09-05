// src/components/common/Header.jsx
import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
  SaveOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { ConfirmationModal, LoadScenarioModal, SaveScenarioModal } from '../modals';
import ContextBrowser from '../AuditTrail/ContextBrowser';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = ({ collapsed, toggle }) => {
  const {
    scenarioData,
    loading,
    initializeScenario,
    hasUnsavedChanges,
    isNewScenario
  } = useScenario();

  // Modal visibility states
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [newConfirmVisible, setNewConfirmVisible] = useState(false);
  const [contextBrowserVisible, setContextBrowserVisible] = useState(false);

  // Handle opening save modal
  const handleOpenSaveModal = () => {
    setSaveModalVisible(true);
  };

  // Handle opening load modal
  const handleOpenLoadModal = () => {
    setLoadModalVisible(true);
  };

  // Handle opening context browser
  const handleOpenContextBrowser = () => {
    setContextBrowserVisible(true);
  };

  // Handle new scenario
  const handleNewScenario = () => {
    if (hasUnsavedChanges) {
      setNewConfirmVisible(true);
    } else {
      createNewScenario();
    }
  };

  // Handle actual scenario creation
  const createNewScenario = async () => {
    try {
      await initializeScenario();
      setNewConfirmVisible(false);
    } catch (error) {
      console.error('Error creating new scenario:', error);
    }
  };

  return (
    <>
      <AntHeader style={{ display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggle}
            style={{ color: 'white', fontSize: '16px', marginRight: '16px' }}
          />
          <Title level={4} style={{ margin: 0, color: 'white' }}>
            Wind Farm Risk Analysis Tool
          </Title>
        </div>
        <Space>
          <Tooltip title="Debug scenario context structure and values">
            <Button
              type="primary"
              icon={<BugOutlined />}
              onClick={handleOpenContextBrowser}
              loading={loading}
              disabled={!scenarioData}
            >
              Debug Context
            </Button>
          </Tooltip>
          <Tooltip title={isNewScenario() ? "Save scenario" : "Save or update scenario"}>
            <Button
              icon={<SaveOutlined />}
              onClick={handleOpenSaveModal}
              disabled={loading || !scenarioData}
            >
              Save
            </Button>
          </Tooltip>
          <Button
            icon={<UploadOutlined />}
            onClick={handleOpenLoadModal}
            disabled={loading}
          >
            Load
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleNewScenario}
            disabled={loading}
          >
            New
          </Button>
        </Space>
      </AntHeader>

      {/* Save Modal */}
      <SaveScenarioModal
        visible={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
      />

      {/* Load Modal */}
      <LoadScenarioModal
        visible={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        onLoad={() => setLoadModalVisible(false)}
      />

      {/* New Scenario Confirmation */}
      <ConfirmationModal
        open={newConfirmVisible}
        onConfirm={createNewScenario}
        onCancel={() => setNewConfirmVisible(false)}
        title="Create New Scenario"
        content="You have unsaved changes that will be lost. Are you sure you want to create a new scenario?"
        confirmText="Create New"
        loading={loading}
        type="warning"
      />

      {/* Context Browser */}
      <ContextBrowser
        visible={contextBrowserVisible}
        onClose={() => setContextBrowserVisible(false)}
        title="Context Debug Browser"
      />
    </>
  );
};

export default Header;