// src/components/general/SimulationSettings.jsx
import React, { useState } from 'react';
import { Typography, Alert, Button, Space } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import EditableTable from '../../components/tables/EditableTable';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  TextField,
  PercentileField
} from '../contextFields';

const { Title } = Typography;

// Define percentile columns
const percentileColumns = [
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Percentile',
    dataIndex: 'value',
    key: 'value',
    render: (value) => `P${value}`  // Format the display with P prefix
  },
  {
    title: 'Type',
    key: 'type',
    dataIndex: 'description',
    render: (description) => description.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  }
];

// Define form fields for percentiles using context field components
const percentileFormFields = [
  <PercentileField
    path={['value']}
    label="Percentile Value"
    min={1}
    max={99}
    step={1}
    tooltip="Enter a value between 1 and 99"
  />,
  <TextField
    path={['description']}
    label="Description"
    placeholder="E.g., primary, upper_bound"
    tooltip="Used to identify the role of this percentile in visualizations"
  />
];

const SimulationSettings = () => {
  // Define base path for simulation settings
  const basePath = ['settings', 'simulation'];
  
  // Get scenario data
  const { scenarioData, updateByPath } = useScenario();
  const [isModified, setIsModified] = useState(false);

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

  // Handle saving changes
  const handleSaveChanges = () => {
    // Actual saving is handled by the context fields directly
    setIsModified(false);
  };

  return (
    <div>
      <Title level={2}>
        Simulation Settings
        {isModified && (
          <Button 
            type="primary" 
            size="small" 
            style={{ marginLeft: 16 }} 
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        )}
      </Title>
      <p>Configure simulation parameters and probability levels for visualization.</p>

      <FormSection title="Monte Carlo Simulation Settings" style={{ marginBottom: 24 }}>
        <FormRow>
          <FormCol span={12}>
            <NumberField
              path={[...basePath, 'iterations']}
              label="Number of Monte Carlo Iterations"
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
              path={[...basePath, 'seed']}
              label="Random Seed"
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
        
        {/* EditableTable component for percentiles */}
        <EditableTable
          columns={percentileColumns}
          path={[...basePath, 'percentiles']}
          formFields={percentileFormFields}
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
    </div>
  );
};

export default SimulationSettings;