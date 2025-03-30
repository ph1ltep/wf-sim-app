// src/components/modules/CostModule.jsx
import React, { useState } from 'react';
import { Typography, Alert, Button, Tabs } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

// Import our new form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  CurrencyField,
  PercentageField,
  SelectField,
  FormDivider
} from '../../components/forms';
import FormButtons from '../../components/forms/FormButtons';
import UnsavedChangesIndicator from '../forms/UnsavedChangesIndicator';

const { Title } = Typography;
const { TabPane } = Tabs;

// Define validation schema
const costSchema = yup.object({
  annualBaseOM: yup.number()
    .required('Annual base O&M cost is required')
    .min(0, 'Must be positive'),

  escalationRate: yup.number()
    .required('Escalation rate is required')
    .min(0, 'Must be positive')
    .max(10, 'Must be less than 10%'),

  escalationDistribution: yup.string()
    .required('Escalation distribution is required')
    .oneOf(['Normal', 'Lognormal', 'Triangular', 'Uniform'], 'Invalid distribution type'),

  oemTerm: yup.number()
    .required('OEM term is required')
    .min(0, 'Must be positive')
    .integer('Must be an integer'),

  fixedOMFee: yup.number()
    .required('Fixed O&M fee is required')
    .min(0, 'Must be positive'),

  failureEventProbability: yup.number()
    .required('Failure event probability is required')
    .min(0, 'Must be positive')
    .max(100, 'Must be less than 100%'),

  failureEventCost: yup.number()
    .required('Failure event cost is required')
    .min(0, 'Must be positive')
}).required();

const CostModule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('routine');

  // Use our custom form hook
  const {
    control,
    formState: { errors },
    onSubmitForm,
    isDirty,
    reset
  } = useScenarioForm({
    validationSchema: costSchema,
    moduleName: 'cost',
    showSuccessMessage: true,
    successMessage: 'Cost settings saved successfully'
  });

  // Navigate to OEM Contracts page
  const goToOEMContracts = () => {
    navigate('/config/scenario/oemcontracts');
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div>
      <Title level={2}>Cost Module Configuration
        <UnsavedChangesIndicator isDirty={isDirty} onSave={onSubmitForm} />
      </Title>
      <p>Configure the cost parameters for the wind farm simulation.</p>

      {/* Custom Form component without built-in buttons */}
      <Form
        onSubmit={null}
        submitButtons={false}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          {/* Routine O&M Tab */}
          <TabPane tab="Routine O&M" key="routine">
            <FormSection title="Base O&M Costs">
              <FormRow>
                <FormCol span={12}>
                  <CurrencyField
                    name="annualBaseOM"
                    label="Annual Base O&M Cost (USD/year)"
                    control={control}
                    error={errors.annualBaseOM?.message}
                    tooltip="Annual baseline operation and maintenance cost"
                    min={0}
                    step={100000}
                    style={{ width: 200 }}
                  />
                </FormCol>
              </FormRow>

              <FormRow>
                <FormCol span={12}>
                  <PercentageField
                    name="escalationRate"
                    label="O&M Cost Escalation Rate (%/year)"
                    control={control}
                    error={errors.escalationRate?.message}
                    tooltip="Annual rate at which O&M costs increase"
                    min={0}
                    max={10}
                    step={0.1}
                    precision={1}
                    style={{ width: 130 }}
                  />
                </FormCol>
                <FormCol span={12}>
                  <SelectField
                    name="escalationDistribution"
                    label="Escalation Distribution"
                    control={control}
                    error={errors.escalationDistribution?.message}
                    tooltip="Distribution type for the escalation rate uncertainty"
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Lognormal', label: 'Lognormal' },
                      { value: 'Triangular', label: 'Triangular' },
                      { value: 'Uniform', label: 'Uniform' }
                    ]}
                    style={{ width: 150 }}
                  />
                </FormCol>
              </FormRow>
            </FormSection>
          </TabPane>

          {/* OEM Contract Tab */}
          <TabPane tab="OEM Contract" key="oem">
            <FormSection
              title={
                <span>
                  <ToolOutlined style={{ marginRight: 8 }} />
                  OEM Contract Settings
                </span>
              }
              extra={
                <Button type="primary" onClick={goToOEMContracts}>
                  Manage OEM Contracts
                </Button>
              }
            >
              <p>Select an OEM contract to use for this scenario. OEM contracts define scope and cost during the warranty period.</p>

              <FormRow>
                <FormCol span={12}>
                  <NumberField
                    name="oemTerm"
                    label="OEM Term (Years)"
                    control={control}
                    error={errors.oemTerm?.message}
                    tooltip="Duration of the OEM warranty period"
                    min={0}
                    max={30}
                    step={1}
                    style={{ width: 120 }}
                  />
                </FormCol>
                <FormCol span={12}>
                  <CurrencyField
                    name="fixedOMFee"
                    label="Fixed O&M Fee during OEM Term"
                    control={control}
                    error={errors.fixedOMFee?.message}
                    tooltip="Annual fee paid to OEM during warranty period"
                    min={0}
                    step={50000}
                    style={{ width: 200 }}
                  />
                </FormCol>
              </FormRow>

              <FormDivider dashed />

              <p style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.45)' }}>
                To create or edit OEM contracts, click the "Manage OEM Contracts" button above.
              </p>
            </FormSection>
          </TabPane>

          {/* Failures Tab */}
          <TabPane tab="Failures" key="failures">
            <FormSection title="Failure Events">
              <FormRow>
                <FormCol span={12}>
                  <PercentageField
                    name="failureEventProbability"
                    label="Failure Event Probability (%/year)"
                    control={control}
                    error={errors.failureEventProbability?.message}
                    tooltip="Annual probability of a failure event occurring"
                    min={0}
                    max={100}
                    step={0.5}
                    precision={1}
                    style={{ width: 130 }}
                  />
                </FormCol>
                <FormCol span={12}>
                  <CurrencyField
                    name="failureEventCost"
                    label="Failure Event Cost (USD per event)"
                    control={control}
                    error={errors.failureEventCost?.message}
                    tooltip="Average cost of each failure event"
                    min={0}
                    step={10000}
                    style={{ width: 200 }}
                  />
                </FormCol>
              </FormRow>
            </FormSection>
          </TabPane>

          {/* Major Repairs Tab */}
          <TabPane tab="Major Repairs" key="major">
            <FormSection title="Major Repairs / Overhauls">
              <Alert
                message="Feature Available in Future Version"
                description="Configuration of deterministic or probabilistic major cost events (e.g., blade or gearbox replacements) will be added in an upcoming release."
                type="info"
                showIcon
              />
            </FormSection>
          </TabPane>
        </Tabs>

        {/* Form Actions - Single set of buttons for all tabs */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <FormButtons
            onSubmit={onSubmitForm}
            onReset={reset}
            isDirty={isDirty}
          />
        </div>
      </Form>
    </div>
  );
};

export default CostModule;