// src/components/general/SimulationSettings.jsx
import React from 'react';
import { Typography, Alert, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import * as yup from 'yup';

// Import our new form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField
} from '../../components/forms';

const { Title } = Typography;

// Define validation schema
const simulationSchema = yup.object({
  iterations: yup
    .number()
    .required('Number of iterations is required')
    .min(100, 'Minimum 100 iterations')
    .max(100000, 'Maximum 100,000 iterations')
    .integer('Must be an integer'),
  
  seed: yup
    .number()
    .required('Random seed is required')
    .integer('Must be an integer'),
  
  probabilities: yup.object({
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
  }).required()
}).required();

const SimulationSettings = () => {
  // Use our custom form hook with section="simulation" instead of moduleName
  // simulation settings are directly under settings, not under modules
  const { 
    control, 
    formState: { errors },
    onSubmitForm,
    isDirty,
    reset,
    scenarioData
  } = useScenarioForm({
    validationSchema: simulationSchema,
    modulePath: ['settings', 'simulation'],
    showSuccessMessage: true,
    successMessage: 'Simulation settings saved successfully'
  });
  
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

      {/* Custom Form component without built-in buttons */}
      <Form 
        onSubmit={null} 
        submitButtons={false}
      >
        <FormSection title="Monte Carlo Simulation Settings" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="iterations"
                label={
                  <span>
                    Number of Monte Carlo Iterations
                    <Tooltip title="Higher values provide more statistical accuracy at the cost of longer computation time">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                control={control}
                error={errors.iterations?.message}
                min={100}
                max={100000}
                step={1000}
                style={{ width: 200 }}
              />
            </FormCol>
          </FormRow>

          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="seed"
                label={
                  <span>
                    Random Seed
                    <Tooltip title="Using the same seed ensures reproducible results">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                control={control}
                error={errors.seed?.message}
                min={1}
                step={1}
                style={{ width: 120 }}
              />
            </FormCol>
          </FormRow>
        </FormSection>

        <FormSection title="Probability Levels for Visualization" style={{ marginBottom: 24 }}>
          <p>Configure which probability levels (P-values) to display in charts and results.</p>
          
          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="probabilities.primary"
                label="Primary Probability (P-value)"
                control={control}
                error={errors.probabilities?.primary?.message}
                tooltip="The main probability level to display (e.g., P50 for median values)"
                min={1}
                max={99}
                step={1}
                formatter={value => `P${value}`}
                parser={value => value?.replace('P', '')}
                style={{ width: 120 }}
              />
            </FormCol>
          </FormRow>
          
          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="probabilities.lowerBound"
                label="Lower Bound Probability"
                control={control}
                error={errors.probabilities?.lowerBound?.message}
                tooltip="Middle lower percentile for uncertainty bands (e.g., P25)"
                min={2}
                max={49}
                step={5}
                formatter={value => `P${value}`}
                parser={value => value?.replace('P', '')}
                style={{ width: 120 }}
              />
            </FormCol>
            <FormCol span={12}>
              <NumberField
                name="probabilities.upperBound"
                label="Upper Bound Probability"
                control={control}
                error={errors.probabilities?.upperBound?.message}
                tooltip="Middle upper percentile for uncertainty bands (e.g., P75)"
                min={51}
                max={98}
                step={5}
                formatter={value => `P${value}`}
                parser={value => value?.replace('P', '')}
                style={{ width: 120 }}
              />
            </FormCol>
          </FormRow>
          
          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="probabilities.extremeLower"
                label="Extreme Lower Probability"
                control={control}
                error={errors.probabilities?.extremeLower?.message}
                tooltip="Extreme lower percentile for optimistic scenarios (e.g., P10)"
                min={1}
                max={20}
                step={5}
                formatter={value => `P${value}`}
                parser={value => value?.replace('P', '')}
                style={{ width: 120 }}
              />
            </FormCol>
            <FormCol span={12}>
              <NumberField
                name="probabilities.extremeUpper"
                label="Extreme Upper Probability"
                control={control}
                error={errors.probabilities?.extremeUpper?.message}
                tooltip="Extreme upper percentile for conservative scenarios (e.g., P90)"
                min={80}
                max={99}
                step={5}
                formatter={value => `P${value}`}
                parser={value => value?.replace('P', '')}
                style={{ width: 120 }}
              />
            </FormCol>
          </FormRow>
        </FormSection>
          
        {/* Form Actions - Custom buttons */}
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
            onClick={onSubmitForm}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SimulationSettings;