// src/components/modules/RiskModule.jsx
import React from 'react';
import { Typography, Button } from 'antd';
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
  SwitchField
} from '../../components/forms';

const { Title } = Typography;

// Define validation schema
const riskSchema = yup.object({
  insuranceEnabled: yup
    .boolean()
    .required('Insurance enabled selection is required'),
  
  insurancePremium: yup
    .number()
    .when('insuranceEnabled', {
      is: true,
      then: schema => schema.required('Insurance premium is required').min(0, 'Must be positive')
    }),
  
  insuranceDeductible: yup
    .number()
    .when('insuranceEnabled', {
      is: true,
      then: schema => schema.required('Insurance deductible is required').min(0, 'Must be positive')
    }),
  
  reserveFunds: yup
    .number()
    .required('Reserve funds amount is required')
    .min(0, 'Must be positive')
}).required();

const RiskModule = () => {
  // Use our custom form hook
  const { 
    control, 
    watch,
    formState: { errors },
    onSubmitForm,
    isDirty,
    reset
  } = useScenarioForm({
    validationSchema: riskSchema,
    moduleName: 'risk',
    showSuccessMessage: true,
    successMessage: 'Risk mitigation settings saved successfully'
  });
  
  // Watch insurance enabled for conditional rendering
  const insuranceEnabled = watch('insuranceEnabled');

  return (
    <div>
      <Title level={2}>Risk Mitigation Configuration</Title>
      <p>Configure risk mitigation strategies for the wind farm project.</p>

      {/* Custom Form component without built-in buttons */}
      <Form 
        onSubmit={null} 
        submitButtons={false}
      >
        <FormSection title="Insurance Coverage" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <SwitchField
                name="insuranceEnabled"
                label="Enable Insurance Coverage"
                control={control}
                error={errors.insuranceEnabled?.message}
                tooltip="Toggle insurance coverage on/off"
              />
            </FormCol>
          </FormRow>
          
          {insuranceEnabled && (
            <FormRow>
              <FormCol span={12}>
                <CurrencyField
                  name="insurancePremium"
                  label="Insurance Premium (USD/year)"
                  control={control}
                  error={errors.insurancePremium?.message}
                  tooltip="Annual cost of insurance coverage"
                  min={0}
                  step={10000}
                  style={{ width: 200 }}
                />
              </FormCol>
              <FormCol span={12}>
                <CurrencyField
                  name="insuranceDeductible"
                  label="Insurance Deductible per Event (USD)"
                  control={control}
                  error={errors.insuranceDeductible?.message}
                  tooltip="Only costs exceeding the deductible are covered by insurance"
                  min={0}
                  step={5000}
                  style={{ width: 200 }}
                />
              </FormCol>
            </FormRow>
          )}
        </FormSection>

        <FormSection title="Reserve Funds">
          <FormRow>
            <FormCol span={12}>
              <CurrencyField
                name="reserveFunds"
                label="Reserve Funds (USD)"
                control={control}
                error={errors.reserveFunds?.message}
                tooltip="Cash reserves to smooth out adverse cash flow events"
                min={0}
                step={100000}
                style={{ width: 200 }}
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

export default RiskModule;