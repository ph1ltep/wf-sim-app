// frontend/src/pages/config/scenario/ScenarioSettings.jsx
import React from 'react';
import { Typography, Alert, Input } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  TextField,
  SelectField,
  TextAreaField,
  CompactFieldGroup,
  ResponsiveFieldRow
} from 'components/contextFields';

const { Title } = Typography;

const ScenarioSettings = () => {
  // Base paths for scenario settings
  const scenarioPath = ['settings', 'scenario'];

  // Get scenario context
  const { scenarioData, selectedLocation } = useScenario();

  // Scenario type options
  const scenarioTypeOptions = [
    { value: 'base', label: 'Base Case' },
    { value: 'optimistic', label: 'Optimistic' },
    { value: 'conservative', label: 'Conservative' },
    { value: 'stress', label: 'Stress Test' },
    { value: 'custom', label: 'Custom' }
  ];

  // Check if there's an active scenario
  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Scenario Settings</Title>
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
      <Title level={2}>Scenario Settings</Title>
      <p>Configure the high-level parameters for your wind farm scenario.</p>

      {selectedLocation && (
        <Alert
          message="Location Selected"
          description={`Using location defaults from ${selectedLocation.country} (${selectedLocation.countryCode.toUpperCase()}) - ${selectedLocation.currency}`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <FormSection title="Basic Scenario Information">
        <ResponsiveFieldRow layout="twoColumn">
          <CompactFieldGroup direction="vertical" size="middle">
            <TextField
              path={[...scenarioPath, 'name']}
              label="Scenario Name"
              placeholder="e.g., Base Case 2025"
              tooltip="Unique name for this scenario"
              required
            />
            <TextAreaField
              path={[...scenarioPath, 'description']}
              label="Description"
              placeholder="Provide a brief description of this scenario"
              rows={4}
            />
          </CompactFieldGroup>
        </ResponsiveFieldRow>
      </FormSection>

      {/* <FormSection title="Scenario Details">
        <FormRow>
          <FormCol>
            <SelectField
              path={[...scenarioPath, 'scenarioType']}
              label="Scenario Type"
              options={scenarioTypeOptions}
              tooltip="Classification of this scenario"
            />
          </FormCol>
        </FormRow>
      </FormSection> */}
    </div>
  );
};

export default ScenarioSettings;