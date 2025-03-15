// src/components/config/ScenarioSettings.jsx
import React from 'react';
import { Typography, Form, Input, Card, Button, Row, Col, DatePicker, Select, Alert } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ScenarioSettings = () => {
  const { parameters, updateModuleParameters, currentScenario, selectedLocation } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters) {
    return <div>Loading parameters...</div>;
  }

  // Get scenario data if available
  const scenarioData = parameters.scenario || {
    name: currentScenario?.name || 'New Scenario',
    description: currentScenario?.description || '',
    location: selectedLocation?.countryCode || '',
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
                <Select placeholder="Select a location" disabled={!!selectedLocation}>
                  <Option value="">Not specified</Option>
                  <Option value="us">United States</Option>
                  <Option value="uk">United Kingdom</Option>
                  <Option value="de">Germany</Option>
                  <Option value="fr">France</Option>
                  <Option value="es">Spain</Option>
                  <Option value="custom">Custom Location</Option>
                </Select>
              </Form.Item>
              {selectedLocation && (
                <p style={{ marginTop: -20, marginBottom: 10, color: 'rgba(0, 0, 0, 0.45)' }}>
                  Location is set from Project Settings
                </p>
              )}
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