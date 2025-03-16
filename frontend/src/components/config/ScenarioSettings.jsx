// src/components/config/ScenarioSettings.jsx
import React from 'react';
import { Typography, Form, Input, Card, Button, Row, Col, Select, Alert } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ScenarioSettings = () => {
  const { scenarioData, settings, updateModuleParameters, selectedLocation } = useScenario();
  const [form] = Form.useForm();

  // Only render if settings are loaded
  if (!settings) {
    return <div>Loading settings...</div>;
  }

  // Get scenario data
  const initialValues = {
    name: scenarioData?.name || 'New Scenario',
    description: scenarioData?.description || '',
    scenarioType: settings.project?.scenarioType || 'base'
  };

  const handleValuesChange = (changedValues, allValues) => {
    // Update scenario parameters
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('scenario', allValues);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Title level={2}>Scenario Settings</Title>
      <p>Configure the high-level parameters for your wind farm scenario.</p>

      {selectedLocation && (
        <Alert
          message="Location Selected"
          description={`Using location defaults from ${selectedLocation.country} (${selectedLocation.countryCode.toUpperCase()}) - ${selectedLocation.currency}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Card title="Basic Scenario Information" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Scenario Name"
            name="name"
            rules={[{ required: true, message: 'Please input scenario name!' }]}
          >
            <Input placeholder="e.g., Base Case 2025" />
          </Form.Item>
          
          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea 
              rows={4} 
              placeholder="Provide a brief description of this scenario"
            />
          </Form.Item>
        </Card>
        
        <Card title="Scenario Details" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Scenario Type"
            name="scenarioType"
          >
            <Select>
              <Option value="base">Base Case</Option>
              <Option value="optimistic">Optimistic</Option>
              <Option value="conservative">Conservative</Option>
              <Option value="stress">Stress Test</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>
        </Card>

        <Row justify="end">
          <Col>
            <Button onClick={handleReset} style={{ marginRight: 8 }}>Reset</Button>
            <Button type="primary">Save Scenario</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ScenarioSettings;