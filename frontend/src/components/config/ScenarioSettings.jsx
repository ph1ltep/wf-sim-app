// src/components/config/ScenarioSettings.jsx
import React from 'react';
import { Typography, Form, Input, Card, Button, Row, Col, DatePicker, Select } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ScenarioSettings = () => {
  const { parameters, updateModuleParameters, currentScenario } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters) {
    return <div>Loading parameters...</div>;
  }

  // Get scenario data if available
  const scenarioData = parameters.scenario || {
    name: currentScenario?.name || 'New Scenario',
    description: currentScenario?.description || '',
    location: '',
    startDate: null,
    scenarioType: 'base'
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

      <Form
        form={form}
        layout="vertical"
        initialValues={scenarioData}
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
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Project Location"
                name="location"
                tooltip="Select the country where the wind farm is located"
              >
                <Select placeholder="Select a location">
                  <Option value="">Not specified</Option>
                  <Option value="us">United States</Option>
                  <Option value="uk">United Kingdom</Option>
                  <Option value="de">Germany</Option>
                  <Option value="fr">France</Option>
                  <Option value="es">Spain</Option>
                  <Option value="custom">Custom Location</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Project Start Date"
                name="startDate"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
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