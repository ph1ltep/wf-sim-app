// src/components/config/GeneralConfig.jsx
import React from 'react';
import { Typography, Form, InputNumber, Card, Button, Row, Col, Tooltip, Divider } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';

const { Title } = Typography;

const GeneralConfig = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();

  // Only render if parameters are loaded
  if (!parameters) {
    return <div>Loading parameters...</div>;
  }

  // Make sure simulation exists in parameters
  const simulation = parameters.simulation || { iterations: 10000, seed: 42 };
  
  // Make sure probability settings exist
  const probabilities = parameters.probabilities || { 
    primary: 50, 
    upperBound: 75, 
    lowerBound: 25 
  };

  const initialValues = {
    ...simulation,
    ...probabilities
  };

  const handleValuesChange = (changedValues, allValues) => {
    // Split the values between simulation and probabilities
    const simulationParams = {};
    const probabilityParams = {};
    
    if ('iterations' in allValues) simulationParams.iterations = allValues.iterations;
    if ('seed' in allValues) simulationParams.seed = allValues.seed;
    
    if ('primary' in allValues) probabilityParams.primary = allValues.primary;
    if ('upperBound' in allValues) probabilityParams.upperBound = allValues.upperBound;
    if ('lowerBound' in allValues) probabilityParams.lowerBound = allValues.lowerBound;
    
    // Update simulation parameters if they've changed
    if (Object.keys(simulationParams).length > 0) {
      updateModuleParameters('simulation', simulationParams);
    }
    
    // Update probability parameters if they've changed
    if (Object.keys(probabilityParams).length > 0) {
      updateModuleParameters('probabilities', probabilityParams);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Title level={2}>General Configuration</Title>
      <p>Configure general simulation parameters and probability levels for visualization.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <Card title="Monte Carlo Simulation Settings" style={{ marginBottom: 24 }}>
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

        <Card title="Probability Levels for Visualization" style={{ marginBottom: 24 }}>
          <p>Configure which probability levels (P-values) to display in charts and results.</p>
          
          <Form.Item
            label="Primary Probability (P-value)"
            name="primary"
            rules={[{ required: true, message: 'Please input primary probability!' }]}
            tooltip="The main probability level to display (e.g., P50 for median values)"
          >
            <InputNumber min={1} max={99} step={1} formatter={value => `P${value}`} parser={value => value.replace('P', '')} />
          </Form.Item>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Lower Bound Probability"
                name="lowerBound"
                rules={[{ required: true, message: 'Please input lower bound!' }]}
                tooltip="Lower percentile for uncertainty bands (e.g., P25)"
              >
                <InputNumber min={1} max={49} step={5} formatter={value => `P${value}`} parser={value => value.replace('P', '')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Upper Bound Probability"
                name="upperBound"
                rules={[{ required: true, message: 'Please input upper bound!' }]}
                tooltip="Upper percentile for uncertainty bands (e.g., P75)"
              >
                <InputNumber min={51} max={99} step={5} formatter={value => `P${value}`} parser={value => value.replace('P', '')} />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider dashed />
          
          <p style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.45)' }}>
            Note: P50 represents the median value, where 50% of simulation outcomes fall below this value. 
            Lower values (e.g., P10) represent optimistic scenarios, while higher values (e.g., P90) represent conservative scenarios.
          </p>
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

export default GeneralConfig;