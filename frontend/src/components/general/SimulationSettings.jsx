// src/components/general/SimulationSettings.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import * as yup from 'yup';

// Import custom form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  TextField,
  PercentileField  // Import the new PercentileField
} from '../../components/forms';
import FormButtons from '../../components/forms/FormButtons';
import UnsavedChangesIndicator from '../forms/UnsavedChangesIndicator';

// Import EditableTable and column helpers
import { EditableTable, createTextColumn } from '../../components/tables';

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
    .integer('Must be an integer')
}).required();

// Define validation schema for percentiles
const percentileSchema = yup.object({
  value: yup
    .number()
    .required('Percentile value is required')
    .min(1, 'Must be at least 1')
    .max(99, 'Must be at most 99')
    .integer('Must be an integer'),
  
  description: yup
    .string()
    .required('Description is required')
}).required();

// Define percentile columns
const percentileColumns = [
  createTextColumn('description', 'Description'),
  createTextColumn('value', 'Percentile', {
    render: (value) => `P${value}`  // Format the display with P prefix
  }),
  createTextColumn(null, 'Type', {
    key: 'description',
    render: (_, record) => record.description.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  })
];

// Define form fields for percentiles using custom components
const percentileFormFields = [
  <PercentileField
    name="value"
    label="Percentile Value"
    min={1}
    max={99}
    step={1}
    tooltip="Enter a value between 1 and 99"
  />,
  <TextField
    name="description"
    label="Description"
    placeholder="E.g., primary, upper_bound"
    tooltip="Used to identify the role of this percentile in visualizations"
  />
];

const SimulationSettings = () => {
  // Use our custom form hook
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
    formId: 'simulation-settings',
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
      <Title level={2}>
        Simulation Settings
        <UnsavedChangesIndicator isDirty={isDirty} onSave={onSubmitForm} />
      </Title>
      <p>Configure simulation parameters and probability levels for visualization.</p>

      <Form 
        onSubmit={null} 
        submitButtons={false}
      >
        <FormSection title="Monte Carlo Simulation Settings" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="iterations"
                label="Number of Monte Carlo Iterations"
                control={control}
                error={errors.iterations?.message}
                min={100}
                max={100000}
                step={1000}
                style={{ width: 200 }}
                tooltip="Higher values provide more statistical accuracy at the cost of longer computation time"
              />
            </FormCol>
          </FormRow>

          <FormRow>
            <FormCol span={12}>
              <NumberField
                name="seed"
                label="Random Seed"
                control={control}
                error={errors.seed?.message}
                min={1}
                step={1}
                style={{ width: 120 }}
                tooltip="Using the same seed ensures reproducible results"
              />
            </FormCol>
          </FormRow>
        </FormSection>

        <FormSection 
          title="Percentiles for Visualization" 
          style={{ marginBottom: 24 }}
        >
          <p>Configure which percentiles (P-values) to display in charts and results.</p>
          
          {/* Updated EditableTable component with our new PercentileField */}
          <EditableTable
            columns={percentileColumns}
            path={['settings', 'simulation', 'percentiles']}
            formFields={percentileFormFields}
            validationSchema={percentileSchema}
            keyField="value"
            itemName="Percentile"
          />
          
          <Alert
            message="Percentile Definitions"
            description={
              <ul>
                <li><strong>Primary (P50):</strong> The main P-value for charts (typically median)</li>
                <li><strong>Upper/Lower Bound (P75/P25):</strong> Middle confidence interval</li>
                <li><strong>Extreme Upper/Lower (P90/P10):</strong> Wider confidence interval</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </FormSection>
          
        {/* Form Actions */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <FormButtons
            onSubmit={onSubmitForm}
            onReset={() => reset()}
            isDirty={isDirty}
          />
        </div>
      </Form>
    </div>
  );
};

export default SimulationSettings;