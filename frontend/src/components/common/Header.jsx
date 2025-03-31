import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Modal, Spin, Table, Tooltip, message } from 'antd';
import PropTypes from 'prop-types';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  UploadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useScenarioForm } from '../../hooks/forms';
import { TextField } from '../forms/fields';
import { ConfirmationModal, FormModal } from '../modals';
import moment from 'moment';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

/**
 * Header component that contains main application actions and navigation controls
 * @param {Object} props
 * @param {boolean} props.collapsed - Whether the sidebar is collapsed
 * @param {function} props.toggle - Function to toggle sidebar collapse state
 */
const Header = ({ collapsed, toggle }) => {
  const {
    scenarioData,
    loading,
    initializeScenario,
    saveScenario,
    updateScenario,
    getAllScenarios,
    getScenario,
    updateScenarioMeta,
    hasUnsavedChanges,
    isNewScenario
  } = useScenario();

  // Modal visibility states
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [newConfirmVisible, setNewConfirmVisible] = useState(false);
  
  // Load modal state
  const [scenarioList, setScenarioList] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  // Save form using scenario form hook
  const {
    form: saveForm,
    onSubmitForm: handleSaveSubmit,
    isDirty: saveFormDirty,
    loading: saveLoading
  } = useScenarioForm({
    defaultValues: {
      name: scenarioData?.name || 'New Scenario',
      description: scenarioData?.description || ''
    },
    onSubmit: async (values) => {
      try {
        // Update metadata
        updateScenarioMeta(values);
        
        // Save or update
        const result = isNewScenario() ? 
          await saveScenario() : 
          await updateScenario();

        if (result) {
          setSaveModalVisible(false);
          return result;
        }
      } catch (error) {
        console.error('Error saving scenario:', error);
        throw error;
      }
    }
  });

  // Load modal columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            {record.settings?.general?.projectName || 'No project name'}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Project Size',
      key: 'totalMW',
      render: (_, record) => `${record.settings?.metrics?.totalMW || 0} MW`,
    },
    {
      title: 'Last Modified',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => moment(a.updatedAt).unix() - moment(b.updatedAt).unix(),
    },
  ];

  // Handle opening save modal
  const handleOpenSaveModal = () => {
    saveForm.reset({
      name: scenarioData?.name || 'New Scenario',
      description: scenarioData?.description || ''
    });
    setSaveModalVisible(true);
  };

  // Handle opening load modal
  const handleOpenLoadModal = async () => {
    try {
      setLoadingScenarios(true);
      const result = await getAllScenarios();
      
      if (result && result.scenarios) {
        setScenarioList(result.scenarios);
      } else {
        message.warning('No saved scenarios found');
        setScenarioList([]);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      message.error('Failed to load scenarios');
      setScenarioList([]);
    } finally {
      setLoadingScenarios(false);
      setLoadModalVisible(true);
    }
  };

  // Handle loading a scenario
  const handleLoadScenario = async () => {
    if (!selectedScenarioId) return;

    try {
      const loadedScenario = await getScenario(selectedScenarioId);
      
      if (loadedScenario) {
        setLoadModalVisible(false);
        setSelectedScenarioId(null);
        message.success('Scenario loaded successfully');
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
      message.error('Failed to load the selected scenario');
    }
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
      message.success('New scenario created');
      setNewConfirmVisible(false);
    } catch (error) {
      console.error('Error creating new scenario:', error);
      message.error('Failed to create new scenario');
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
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => {}} // To be implemented
            loading={loading}
          >
            Run Simulation
          </Button>
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
      <FormModal
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        title={isNewScenario() ? 'Save Scenario' : 'Save/Update Scenario'}
        form={saveForm}
        onSubmit={handleSaveSubmit}
        isDirty={saveFormDirty}
        loading={saveLoading}
      >
        <TextField
          name="name"
          label="Scenario Name"
          rules={[{ required: true, message: 'Please enter scenario name' }]}
        />
        <TextField
          name="description"
          label="Description"
          type="textarea"
          rows={4}
        />
      </FormModal>

      {/* Load Modal */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            Load Scenario
          </Space>
        }
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setLoadModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="load"
            type="primary"
            disabled={!selectedScenarioId}
            onClick={handleLoadScenario}
            loading={loading}
          >
            Load Selected
          </Button>
        ]}
      >
        {loadingScenarios ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '10px' }}>Loading scenarios...</div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={scenarioList}
            rowKey="_id"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedScenarioId ? [selectedScenarioId] : [],
              onChange: (selectedRowKeys) => setSelectedScenarioId(selectedRowKeys[0])
            }}
            onRow={(record) => ({
              onClick: () => setSelectedScenarioId(record._id),
              style: { cursor: 'pointer' }
            })}
            pagination={{ pageSize: 5 }}
          />
        )}
      </Modal>

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
    </>
  );
};

Header.propTypes = {
  /** Whether the sidebar is collapsed */
  collapsed: PropTypes.bool.isRequired,
  /** Function to toggle sidebar collapse state */
  toggle: PropTypes.func.isRequired
};

export default Header;