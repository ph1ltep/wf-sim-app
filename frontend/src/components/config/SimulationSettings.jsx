// src/components/config/SimulationSettings.jsx
import React from 'react';
import { Typography, Form, InputNumber, Card, Button, Row, Col, Tooltip, Divider, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

const { Title } = Typography;

const SimulationSettings = () => {
  const { settings, updateModuleParameters } = useScenario();
  const [form] = Form.useForm();

  // Only render if settings are loaded
  if (!settings) {
    return <div>Loading settings...</div>;
  }

  // Get simulation settings or use defaults
  const simulation = settings.simulation || { 
    iterations: 10000, 
    seed: 42,
    probabilities: {
      primary: 50, 
      upperBound: 75, 
      lowerBound: 25,
      extremeUpper: 90,
      extremeLower: 10
    }
  };

  const initialValues = {
    ...simulation,
    ...simulation.probabilities
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
    if ('extremeUpper' in allValues) probabilityParams.extremeUpper = allValues.extremeUpper;
    if ('extremeLower' in allValues) probabilityParams.extremeLower = allValues.extremeLower;
    
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
      <Title level={2}>Simulation Settings</Title>
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
          
          <Alert
            message="Probability Level Guidance"
            description="P50 represents the median outcome. Lower values (e.g., P10) represent optimistic scenarios, while higher values (e.g., P90) represent conservative scenarios."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Primary Probability (P-value)"
                name="primary"
                rules={[
                  { required: true, message: 'Please input primary probability!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const lowerBound = getFieldValue('lowerBound');
                      const upperBound = getFieldValue('upperBound');
                      if (value > lowerBound && value < upperBound) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Primary must be between Lower and Upper Bound!'));
                    },
                  }),
                ]}
                tooltip="The main probability level to display (e.g., P50 for median values)"
              >
                <InputNumber 
                  min={1} 
                  max={99} 
                  step={1} 
                  formatter={value => `P${value}`} 
                  parser={value => value.replace('P', '')} 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Lower Bound Probability"
                name="lowerBound"
                rules={[
                  { required: true, message: 'Please input lower bound!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const extremeLower = getFieldValue('extremeLower');
                      const primary = getFieldValue('primary');
                      if (value > extremeLower && value < primary) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Lower Bound must be between Extreme Lower and Primary!'));
                    },
                  }),
                ]}
                tooltip="Middle lower percentile for uncertainty bands (e.g., P25)"
              >
                <InputNumber 
                  min={2} 
                  max={49} 
                  step={5} 
                  formatter={value => `P${value}`} 
                  parser={value => value.replace('P', '')} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Upper Bound Probability"
                name="upperBound"
                rules={[
                  { required: true, message: 'Please input upper bound!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const primary = getFieldValue('primary');
                      const extremeUpper = getFieldValue('extremeUpper');
                      if (value > primary && value < extremeUpper) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Upper Bound must be between Primary and Extreme Upper!'));
                    },
                  }),
                ]}
                tooltip="Middle upper percentile for uncertainty bands (e.g., P75)"
              >
                <InputNumber 
                  min={51} 
                  max={98} 
                  step={5} 
                  formatter={value => `P${value}`} 
                  parser={value => value.replace('P', '')} 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Extreme Lower Probability"
                name="extremeLower"
                rules={[
                  { required: true, message: 'Please input extreme lower bound!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const lowerBound = getFieldValue('lowerBound');
                      if (value < lowerBound) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Extreme Lower must be less than Lower Bound!'));
                    },
                  }),
                ]}
                tooltip="Extreme lower percentile for optimistic scenarios (e.g., P10)"
              >
                <InputNumber 
                  min={1} 
                  max={20} 
                  step={5} 
                  formatter={value => `P${value}`} 
                  parser={value => value.replace('P', '')} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Extreme Upper Probability"
                name="extremeUpper"
                rules={[
                  { required: true, message: 'Please input extreme upper bound!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const upperBound = getFieldValue('upperBound');
                      if (value > upperBound) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Extreme Upper must be greater than Upper Bound!'));
                    },
                  }),
                ]}
                tooltip="Extreme upper percentile for conservative scenarios (e.g., P90)"
              >
                <InputNumber 
                  min={80} 
                  max={99} 
                  step={5} 
                  formatter={value => `P${value}`} 
                  parser={value => value.replace('P', '')} 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider dashed />
          
          <p style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.45)' }}>
            Note: P-values represent percentiles of the simulated outcomes. The primary P-value (typically P50) 
            represents the median value. Lower P-values represent more optimistic outcomes, while higher 
            P-values represent more conservative outcomes. These values will be used throughout all charts 
            and result displays.
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

export default SimulationSettings;