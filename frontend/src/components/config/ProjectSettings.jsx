// src/components/config/ProjectSettings.jsx
import React from 'react';
import { Typography, Form, InputNumber, Card, Button, Row, Col } from 'antd';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const ProjectSettings = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters || !parameters.general) {
    return <div>Loading parameters...</div>;
  }

  const handleValuesChange = (changedValues, allValues) => {
    // Update general parameters
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('general', allValues);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Title level={2}>Project Timeline Settings</Title>
      <p>Configure the timeline parameters for your wind farm project.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={parameters.general}
        onValuesChange={handleValuesChange}
      >
        <Card title="Project Timeline" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Project Life (Years)"
            name="projectLife"
            rules={[{ required: true, message: 'Please input project life!' }]}
            tooltip="The total operational lifetime of the wind farm project"
          >
            <InputNumber min={1} max={50} />
          </Form.Item>

          <Form.Item
            label="Loan Duration / Loan Tenor (Years)"
            name="loanDuration"
            rules={[{ required: true, message: 'Please input loan duration!' }]}
            tooltip="Duration over which the loan is repaid"
          >
            <InputNumber min={1} max={30} />
          </Form.Item>
        </Card>

        <Row justify="end">
          <Col>
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ProjectSettings;