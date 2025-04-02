// src/components/common/Header.jsx
import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Modal, Spin, Table, Tooltip, message } from 'antd';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  UploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { Form, TextField } from '../forms';
import { ConfirmationModal } from '../modals';
import moment from 'moment';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = ({ collapsed, toggle }) => {
  const {
    scenarioData,
    loading,
    initializeScenario,
    saveScenario,
    updateScenario,
    getAllScenarios,
    getScenario,
    hasUnsavedChanges,
    isNewScenario,
    submitAllForms
  } = useScenario();

  // Modal visibility states
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [newConfirmVisible, setNewConfirmVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load modal state
  const [scenarioList, setScenarioList] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  // Initialize save form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      name: scenarioData?.name || 'New Scenario',
      description: scenarioData?.description || ''
    }
  });

  // Handle save as (create new)
  const handleSaveAs = async (data) => {
    try {
      setIsSaving(true);

      // Simply call saveScenario with the metadata
      const result = await saveScenario({
        name: data.name,
        description: data.description
      });

      if (result) {
        // Refresh scenario list
        const listResult = await getAllScenarios(1, 50);
        if (listResult?.scenarios) {
          setScenarioList(listResult.scenarios);
        }

        setSaveModalVisible(false);
        reset();
      }
    } catch (error) {
      console.error('Error creating new scenario:', error);
      message.error('Failed to create new scenario');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update existing
  const handleUpdate = async (data) => {
    try {
      setIsSaving(true);

      // First, submit all dirty forms to apply changes to context
      if (hasUnsavedChanges) {
        console.log("Submitting all forms before update");
        await submitAllForms();
      }

      // Update with the new metadata
      const result = await updateScenario({
        name: data.name,
        description: data.description
      });

      if (result) {
        setSaveModalVisible(false);
        reset();
        message.success('Scenario updated successfully');
      } else {
        message.error('Failed to update scenario');
      }
    } catch (error) {
      console.error('Error updating scenario:', error);
      message.error('Failed to update scenario');
    } finally {
      setIsSaving(false);
    }
  };

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
    reset({
      name: scenarioData?.name || 'New Scenario',
      description: scenarioData?.description || ''
    });
    setSaveModalVisible(true);
  };

  // Handle opening load modal
  const handleOpenLoadModal = async () => {
    try {
      setLoadingScenarios(true);
      const result = await getAllScenarios(1, 50); // Fetch more scenarios per page

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
            onClick={() => { }} // To be implemented
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
      <Modal
        title="Save Scenario"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        footer={null}
      >
        <Form
          onSubmit={null}
          submitButtons={false}
        >
          <TextField
            name="name"
            label="Scenario Name"
            control={control}
            error={errors.name?.message}
            rules={{ required: 'Please enter a scenario name' }}
          />
          <TextField
            name="description"
            label="Description"
            control={control}
            error={errors.description?.message}
            type="textarea"
            rows={4}
          />

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSaveModalVisible(false)}>
                Cancel
              </Button>
              {!isNewScenario() && (
                <Button
                  type="primary"
                  onClick={handleSubmit(handleUpdate)}
                  loading={isSubmitting || isSaving}
                >
                  Save
                </Button>
              )}
              <Button
                type="primary"
                onClick={handleSubmit(handleSaveAs)}
                loading={isSubmitting || isSaving}
              >
                Save as New
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

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
            size="small"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedScenarioId ? [selectedScenarioId] : [],
              onChange: (selectedRowKeys) => setSelectedScenarioId(selectedRowKeys[0])
            }}
            onRow={(record) => ({
              onClick: () => setSelectedScenarioId(record._id),
              style: { cursor: 'pointer' }
            })}
            pagination={{
              pageSize: 10,
              total: scenarioList.length,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} scenarios`
            }}
            style={{
              marginTop: '12px',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}
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