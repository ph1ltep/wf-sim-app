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
import { useSimulation } from '../../contexts/SimulationContext';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = ({ collapsed, toggle }) => {
  const { 
    runFullSimulation, 
    saveCurrentScenario, 
    loadDefaultParameters,
    currentScenario,
    loading
  } = useSimulation();
  
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [loadModalVisible, setLoadModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await saveCurrentScenario(values.name, values.description);
      setSaveModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleOpenSaveModal = () => {
    if (currentScenario) {
      form.setFieldsValue({
        name: currentScenario.name,
        description: currentScenario.description || ''
      });
    }
    setSaveModalVisible(true);
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
            onClick={runFullSimulation}
            loading={loading}
          >
            Run Simulation
          </Button>
          <Button 
            icon={<SaveOutlined />} 
            onClick={handleOpenSaveModal}
            disabled={loading}
          >
            Save Scenario
          </Button>
          <Button 
            icon={<UploadOutlined />}
            onClick={() => setLoadModalVisible(true)}
            disabled={loading}
          >
            Load Scenario
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadDefaultParameters}
            disabled={loading}
          >
            Reset
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

      {/* Load Modal placeholder - to be implemented with scenario listing */}
      <Modal
        title="Load Scenario"
        open={loadModalVisible}
        onCancel={() => setLoadModalVisible(false)}
        footer={null}
      >
        <p>Scenario list will be loaded here...</p>
        {loading && <Spin />}
      </Modal>
    </>
  );
};

export default Header;