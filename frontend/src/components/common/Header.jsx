// src/components/common/Header.jsx
import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Modal, Input, Form, Spin } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  PlayCircleOutlined,
  SaveOutlined, 
  UploadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = ({ collapsed, toggle }) => {
  const { 
    scenarioData,
    loading,
    initializeScenario,
    updateScenario,
    getAllScenarios
  } = useScenario();
  
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [scenarioList, setScenarioList] = useState([]);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
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
      
      // Update the scenario with new name and description
      await updateScenario(scenarioData._id, {
        name: values.name,
        description: values.description
      });
      
      setSaveModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
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

  // Handle running a simulation
  const handleRunSimulation = async () => {
    // This would call an API to run the simulation
    // For now, we'll just log to console
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

      {/* Load Modal - would be improved with a proper scenario selector component */}
      <Modal
        title="Load Scenario"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={null}
      >
        {loadingScenarios ? (
          <Spin />
        ) : (
          <div>
            {scenarioList.length > 0 ? (
              <ul>
                {scenarioList.map(scenario => (
                  <li key={scenario._id}>
                    <Button 
                      type="link" 
                      onClick={() => {
                        // This would load the selected scenario
                        setLoadModalVisible(false);
                      }}
                    >
                      {scenario.name}
                    </Button>
                    {scenario.description && <p>{scenario.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No saved scenarios found.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default Header;