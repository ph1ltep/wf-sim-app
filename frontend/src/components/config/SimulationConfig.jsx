// src/components/config/SimulationConfig.jsx
import React from 'react';
import { Typography, Form, InputNumber, Card, Button, Row, Col, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const SimulationConfig = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters || !parameters.simulation) {
    return <div>Loading parameters...</div>;
  }

  const handleValuesChange = (changedValues, allValues) => {
    // Update simulation parameters
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('simulation', allValues);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Title level={2}>Simulation Configuration</Title>
      <p>Configure the Monte Carlo simulation settings.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={parameters.simulation}
        onValuesChange={handleValuesChange}
      >
        <Card title="Monte Carlo Settings" style={{ marginBottom: 24 }}>
          <Form.Item
            label={
              <span>
                Number of Monte Carlo Iterations
                <Tooltip title="Higher values provide more statistical accuracy at the cost of longer computation time">
                  <InfoCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </span>
            }
            name="iterations"
            rules={[{ required: true, message: 'Please input number of iterations!' }]}
          >
            <InputNumber min={100} max={100000} step={1000} />
          </Form.Item>

          <Form.Item
            label={
              <span>
                Random Seed
                <Tooltip title="Using the same seed ensures reproducible results">
                  <InfoCircleOutlined style={{ marginLeft: 8 }} />
                </Tooltip>
              </span>
            }
            name="seed"
            rules={[{ required: true, message: 'Please input random seed!' }]}
          >
            <InputNumber min={1} />
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

export default SimulationConfig;