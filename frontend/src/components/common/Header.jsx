// src/components/common/Header.jsx
import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Modal, Input, Form, Spin, List, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  UploadOutlined,
  ReloadOutlined,
  FileOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

const Header = ({ collapsed, toggle }) => {
  const {
    scenarioData,
    loading,
    initializeScenario,
    saveScenario,
    getAllScenarios,
    getScenario,
    updateScenarioMeta
  } = useScenario();

  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [scenarioList, setScenarioList] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [form] = Form.useForm();

  // Handle opening the save modal
  const handleOpenSaveModal = () => {
    if (scenarioData) {
      form.setFieldsValue({
        name: scenarioData.name,
        description: scenarioData.description || ''
      });
    }
    setSaveModalVisible(true);
  };

  // Handle saving the scenario
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // First update the scenario metadata
      updateScenarioMeta({
        name: values.name,
        description: values.description
      });

      // Then save to the database
      const result = await saveScenario();

      if (result) {
        setSaveModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  // Handle opening the load modal
  const handleOpenLoadModal = async () => {
    setLoadingScenarios(true);
    const result = await getAllScenarios();
    if (result && result.scenarios) {
      setScenarioList(result.scenarios);
    }
    setLoadingScenarios(false);
    setLoadModalVisible(true);
  };

  // Handle loading a scenario
  const handleLoadScenario = async (id) => {
    await getScenario(id);
    setLoadModalVisible(false);
    setSelectedScenarioId(null);
  };

  // Handle running a simulation
  const handleRunSimulation = async () => {
    // This would call an API to run the simulation
    console.log('Running simulation with scenario:', scenarioData);
    // In a real implementation, you would call your simulation API here
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
            onClick={handleRunSimulation}
            loading={loading}
          >
            Run Simulation
          </Button>
          <Button
            icon={<SaveOutlined />}
            onClick={handleOpenSaveModal}
            disabled={loading || !scenarioData}
          >
            Save Scenario
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={handleOpenLoadModal}
            disabled={loading}
          >
            Load Scenario
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={initializeScenario}
            disabled={loading}
          >
            New Scenario
          </Button>
        </Space>
      </AntHeader>

      {/* Save Modal */}
      <Modal
        title="Save Scenario"
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Scenario Name"
            rules={[{ required: true, message: 'Please enter a name for the scenario' }]}
          >
            <Input placeholder="e.g., Base Case" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea
              placeholder="Optional description"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Load Modal - improved with a proper scenario selector component */}
      <Modal
        title="Load Scenario"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setLoadModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="load" 
            type="primary" 
            disabled={!selectedScenarioId}
            onClick={() => handleLoadScenario(selectedScenarioId)}
            loading={loading}
          >
            Load Selected
          </Button>
        ]}
      >
        {loadingScenarios ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
            <div style={{ marginTop: '10px' }}>Loading scenarios...</div>
          </div>
        ) : (
          <div>
            {scenarioList.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={scenarioList}
                renderItem={scenario => (
                  <List.Item 
                    onClick={() => setSelectedScenarioId(scenario._id)}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '8px', 
                      backgroundColor: selectedScenarioId === scenario._id ? '#f0f8ff' : 'transparent',
                      border: selectedScenarioId === scenario._id ? '1px solid #1890ff' : '1px solid transparent',
                      borderRadius: '4px'
                    }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<FileOutlined />} />}
                      title={scenario.name}
                      description={
                        <div>
                          {scenario.description && <Text>{scenario.description}</Text>}
                          <div>
                            <Text type="secondary">
                              Last updated: {new Date(scenario.updatedAt).toLocaleString()}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>No saved scenarios found.</p>
                <Button type="primary" onClick={initializeScenario}>Create New Scenario</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default Header;