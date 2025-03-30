// src/components/general/SimulationSettings.jsx
import React, { useMemo, useCallback } from 'react';
import { Typography, Alert, Table, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import * as yup from 'yup';

// Import our form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField
} from '../../components/forms';
import FormButtons from '../../components/forms/FormButtons';
import UnsavedChangesIndicator from '../forms/UnsavedChangesIndicator';

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
  
  percentiles: yup
    .array()
    .of(
      yup.object({
        value: yup
          .number()
          .required('Percentile value is required')
          .min(1, 'Minimum 1')
          .max(99, 'Maximum 99')
          .integer('Must be an integer'),
        description: yup
          .string()
          .required('Description is required')
          .oneOf(['primary', 'upper_bound', 'lower_bound', 'extreme_upper', 'extreme_lower'], 
            'Invalid description')
      })
    )
    .required('At least one percentile is required')
    .test(
      'has-primary',
      'Must have exactly one primary percentile',
      percentiles => percentiles && percentiles.filter(p => p.description === 'primary').length === 1
    )
    .test(
      'percentiles-order',
      'Percentiles must follow logical order (extreme_lower < lower_bound < primary < upper_bound < extreme_upper)',
      percentiles => {
        if (!percentiles || percentiles.length < 5) return true;
        
        // Extract values by description
        const byDesc = percentiles.reduce((acc, p) => {
          acc[p.description] = p.value;
          return acc;
        }, {});
        
        // Check order
        return (
          (!byDesc.extreme_lower || !byDesc.lower_bound || byDesc.extreme_lower < byDesc.lower_bound) &&
          (!byDesc.lower_bound || !byDesc.primary || byDesc.lower_bound < byDesc.primary) &&
          (!byDesc.primary || !byDesc.upper_bound || byDesc.primary < byDesc.upper_bound) &&
          (!byDesc.upper_bound || !byDesc.extreme_upper || byDesc.upper_bound < byDesc.extreme_upper)
        );
      }
    )
}).required();

const SimulationSettings = () => {
  // Use our custom form hook with modulePath for simulation settings
  const formMethods = useScenarioForm({
    validationSchema: simulationSchema,
    modulePath: ['settings', 'simulation'],
    showSuccessMessage: true,
    successMessage: 'Simulation settings saved successfully'
  });
  
  const { 
    control, 
    formState: { errors },
    onSubmitForm,
    isDirty,
    scenarioData
  } = formMethods;
  
  // Extract reset separately and wrap with useCallback to maintain stable reference
  const handleReset = useCallback(() => {
    if (typeof formMethods.reset === 'function') {
      formMethods.reset();
    }
  }, [formMethods]);
  
  // Get percentiles data but don't use watch to avoid triggering renders
  // Instead, access it directly from the form values
  const percentiles = formMethods.getValues()?.percentiles || [];
  
  // Define description options for drop-down
  const descriptionOptions = useMemo(() => [
    { value: 'primary', label: 'Primary (e.g., P50)' },
    { value: 'upper_bound', label: 'Upper Bound (e.g., P75)' },
    { value: 'lower_bound', label: 'Lower Bound (e.g., P25)' },
    { value: 'extreme_upper', label: 'Extreme Upper (e.g., P90)' },
    { value: 'extreme_lower', label: 'Extreme Lower (e.g., P10)' }
  ], []);

  // Define columns for percentiles table
  const percentileColumns = useMemo(() => [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => {
        const option = descriptionOptions.find(opt => opt.value === text);
        return option ? option.label : text;
      }
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value) => `P${value}`
    },
    {
      title: 'Percentile Label',
      key: 'label',
      render: (_, record) => `P${record.value}`
    }
  ], [descriptionOptions]);
  
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
      <Title level={2}>
        Simulation Settings
        <UnsavedChangesIndicator isDirty={isDirty} onSave={onSubmitForm} />
      </Title>
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

        <FormSection title="Percentiles for Visualization" style={{ marginBottom: 24 }}>
          <p>Configure which percentiles (P-values) to display in charts and results.</p>
          
          {/* Display error message if there is an array-level validation error */}
          {errors.percentiles && typeof errors.percentiles.message === 'string' && (
            <Alert 
              message="Percentile Configuration Error" 
              description={errors.percentiles.message}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          {/* Percentiles table */}
          {Array.isArray(percentiles) && percentiles.length > 0 && (
            <Table 
              dataSource={percentiles} 
              columns={percentileColumns}
              rowKey={(record, index) => `percentile-${index}`}
              pagination={false}
              size="small"
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Alert
            message="Percentile Definitions"
            description={
              <ul>
                <li><strong>Primary:</strong> The main P-value for charts (typically P50)</li>
                <li><strong>Upper/Lower Bound:</strong> Middle confidence interval (typically P75/P25)</li>
                <li><strong>Extreme Upper/Lower:</strong> Wider confidence interval (typically P90/P10)</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </FormSection>
          
        {/* Form Actions */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <FormButtons
            onSubmit={onSubmitForm}
            onReset={handleReset}
            isDirty={isDirty}
          />
        </div>
      </Form>
    </div>
  );
};

export default SimulationSettings;