// src/components/general/SimulationSettings.jsx
import React from 'react';
import { Typography, Alert, InputNumber, Input } from 'antd';
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

// Import our table components
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

// Define percentile columns outside the component
const percentileColumns = [
  createTextColumn('description', 'Description'),
  createTextColumn('value', 'Value'),
  createTextColumn(null, 'Percentile Label', {
    key: 'label',
    render: (_, record) => `P${record.value}`
  })
];

// Define form schema outside the component
const percentileFormSchema = [
  {
    name: 'value',
    label: 'Percentile Value',
    rules: [{ required: true, message: 'Please enter a percentile value' }],
    render: () => (
      <InputNumber 
        min={1} 
        max={99} 
        style={{ width: '100%' }}
      />
    )
  },
  {
    name: 'description',
    label: 'Description',
    rules: [{ required: true, message: 'Please enter a description' }],
    render: () => (
      <Input style={{ width: '100%' }} />
    )
  }
];

const SimulationSettings = () => {
  // Use our custom form hook with a hardcoded formId to prevent registration issues
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
    formId: 'simulation-settings', // Add this explicit formId
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
          
          {/* Use a simplified version of the EditableTable */}
          <EditableTable
            columns={percentileColumns}
            path={['settings', 'simulation', 'percentiles']}
            formSchema={percentileFormSchema}
            itemName="Percentile"
          />
          
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
            style={{ marginTop: 16, marginBottom: 16 }}
          />
        </FormSection>
          
        {/* Form Actions */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <FormButtons
            onSubmit={onSubmitForm}
            onReset={() => reset}
            isDirty={isDirty}
          />
        </div>
      </Form>
    </div>
  );
};

export default SimulationSettings;