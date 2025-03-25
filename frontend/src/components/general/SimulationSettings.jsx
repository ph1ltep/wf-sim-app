// src/components/general/SimulationSettings.jsx
import React from 'react';
import { Typography, Card, Row, Col, Tooltip, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, InputNumber, Button } from 'antd';

const { Title } = Typography;

// Define validation schema
const simulationSchema = yup.object({
  iterations: yup
    .number()
    .required('Number of iterations is required')
    .min(100, 'Minimum 100 iterations')
    .max(100000, 'Maximum 100,000 iterations'),
  
  seed: yup
    .number()
    .required('Random seed is required')
    .integer('Must be an integer'),
  
  primary: yup
    .number()
    .required('Primary probability is required')
    .min(1, 'Minimum 1')
    .max(99, 'Maximum 99')
    .test('between-bounds', 'Primary must be between Lower and Upper Bound', 
      function(value) {
        const { lowerBound, upperBound } = this.parent;
        return !lowerBound || !upperBound || (value > lowerBound && value < upperBound);
      }),
  
  lowerBound: yup
    .number()
    .required('Lower bound is required')
    .min(1, 'Minimum 1')
    .max(49, 'Maximum 49')
    .test('between-extremes', 'Must be between Extreme Lower and Primary', 
      function(value) {
        const { extremeLower, primary } = this.parent;
        return !extremeLower || !primary || (value > extremeLower && value < primary);
      }),
  
  upperBound: yup
    .number()
    .required('Upper bound is required')
    .min(51, 'Minimum 51')
    .max(99, 'Maximum 99')
    .test('between-extremes', 'Must be between Primary and Extreme Upper', 
      function(value) {
        const { primary, extremeUpper } = this.parent;
        return !primary || !extremeUpper || (value > primary && value < extremeUpper);
      }),
  
  extremeLower: yup
    .number()
    .required('Extreme lower is required')
    .min(1, 'Minimum 1')
    .max(20, 'Maximum 20')
    .test('less-than-lower', 'Must be less than Lower Bound', 
      function(value) {
        const { lowerBound } = this.parent;
        return !lowerBound || value < lowerBound;
      }),
  
  extremeUpper: yup
    .number()
    .required('Extreme upper is required')
    .min(80, 'Minimum 80')
    .max(99, 'Maximum 99')
    .test('greater-than-upper', 'Must be greater than Upper Bound', 
      function(value) {
        const { upperBound } = this.parent;
        return !upperBound || value > upperBound;
      })
}).required();

const SimulationSettings = () => {
  // Use our enhanced context
  const { 
    scenarioData, 
    updateSettings,
    updateByPath,
    getValueByPath
  } = useScenario();
  
  // Extract simulation settings from the context
  const simulation = getValueByPath(['settings', 'simulation'], {});
  const probabilities = getValueByPath(['settings', 'simulation', 'probabilities'], {});
  
  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    reset
  } = useForm({
    resolver: yupResolver(simulationSchema),
    defaultValues: {
      iterations: simulation.iterations || 10000,
      seed: simulation.seed || 42,
      primary: probabilities.primary || 50,
      lowerBound: probabilities.lowerBound || 25,
      upperBound: probabilities.upperBound || 75,
      extremeLower: probabilities.extremeLower || 10,
      extremeUpper: probabilities.extremeUpper || 90
    }
  });
  
  // Form submission handler
  const onSubmit = (data) => {
    // Update simulation settings
    updateSettings('simulation', {
      iterations: data.iterations,
      seed: data.seed,
      probabilities: {
        primary: data.primary,
        lowerBound: data.lowerBound,
        upperBound: data.upperBound,
        extremeLower: data.extremeLower,
        extremeUpper: data.extremeUpper
      }
    });
  };
  
  // Check if we have an active scenario
  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Simulation Settings</Title>
        <Alert 
          message="No Active Scenario" 
          description="Please create or load a scenario first." 
          type="warning" 
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Simulation Settings</Title>
      <p>Configure simulation parameters and probability levels for visualization.</p>

      <form onSubmit={handleSubmit(onSubmit)}>
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
            validateStatus={errors.iterations ? 'error' : ''}
            help={errors.iterations?.message}
          >
            <Controller
              name="iterations"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  min={100}
                  max={100000}
                  step={1000}
                  style={{ width: '100%' }}
                />
              )}
            />
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
            validateStatus={errors.seed ? 'error' : ''}
            help={errors.seed?.message}
          >
            <Controller
              name="seed"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  min={1}
                  style={{ width: '100%' }}
                />
              )}
            />
          </Form.Item>
        </Card>

        <Card title="Probability Levels for Visualization" style={{ marginBottom: 24 }}>
          <p>Configure which probability levels (P-values) to display in charts and results.</p>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Primary Probability (P-value)"
                validateStatus={errors.primary ? 'error' : ''}
                help={errors.primary?.message}
                tooltip="The main probability level to display (e.g., P50 for median values)"
              >
                <Controller
                  name="primary"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={1} 
                      max={99} 
                      step={1} 
                      formatter={value => `P${value}`} 
                      parser={value => value.replace('P', '')} 
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Lower Bound Probability"
                validateStatus={errors.lowerBound ? 'error' : ''}
                help={errors.lowerBound?.message}
                tooltip="Middle lower percentile for uncertainty bands (e.g., P25)"
              >
                <Controller
                  name="lowerBound"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={2} 
                      max={49} 
                      step={5} 
                      formatter={value => `P${value}`} 
                      parser={value => value.replace('P', '')} 
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Upper Bound Probability"
                validateStatus={errors.upperBound ? 'error' : ''}
                help={errors.upperBound?.message}
                tooltip="Middle upper percentile for uncertainty bands (e.g., P75)"
              >
                <Controller
                  name="upperBound"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={51} 
                      max={98} 
                      step={5} 
                      formatter={value => `P${value}`} 
                      parser={value => value.replace('P', '')} 
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Extreme Lower Probability"
                validateStatus={errors.extremeLower ? 'error' : ''}
                help={errors.extremeLower?.message}
                tooltip="Extreme lower percentile for optimistic scenarios (e.g., P10)"
              >
                <Controller
                  name="extremeLower"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={1} 
                      max={20} 
                      step={5} 
                      formatter={value => `P${value}`} 
                      parser={value => value.replace('P', '')} 
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Extreme Upper Probability"
                validateStatus={errors.extremeUpper ? 'error' : ''}
                help={errors.extremeUpper?.message}
                tooltip="Extreme upper percentile for conservative scenarios (e.g., P90)"
              >
                <Controller
                  name="extremeUpper"
                  control={control}
                  render={({ field }) => (
                    <InputNumber 
                      {...field}
                      min={80} 
                      max={99} 
                      step={5} 
                      formatter={value => `P${value}`} 
                      parser={value => value.replace('P', '')} 
                      style={{ width: '100%' }}
                    />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button 
              onClick={() => reset()} 
              style={{ marginRight: 8 }}
              disabled={!isDirty}
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default SimulationSettings;