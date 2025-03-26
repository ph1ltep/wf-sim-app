// src/components/modules/FinancingModuleRefactored.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Alert } from 'antd';
import { DollarOutlined, PercentageOutlined } from '@ant-design/icons';
import * as yup from 'yup';

// Import our new form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import { Validation } from '../../utils/validation';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  CurrencyField,
  PercentageField,
  RadioGroupField
} from '../../components/forms';

const { Title } = Typography;

// Define validation schema using our helper
const financingSchema = yup.object({
  capex: yup.number().required('CAPEX is required').min(0, 'Must be positive'),
  devex: yup.number().required('DEVEX is required').min(0, 'Must be positive'),
  model: yup.string().required('Financing model is required')
    .oneOf(['Balance-Sheet', 'Project-Finance'], 'Invalid financing model'),
  loanDuration: yup.number().required('Loan duration is required')
    .min(1, 'Must be at least 1 year')
    .max(30, 'Must be less than 30 years')
    .integer('Must be an integer'),
  debtToEquityRatio: yup.number()
    .when('model', {
      is: 'Balance-Sheet',
      then: (schema) => schema.required('Debt-to-Equity ratio is required').min(0, 'Must be positive'),
      otherwise: (schema) => schema.notRequired()
    }),
  debtToCapexRatio: yup.number()
    .when('model', {
      is: 'Project-Finance',
      then: (schema) => schema.required('Debt-to-CAPEX ratio is required').min(0, 'Must be positive').max(1, 'Must be less than or equal to 1'),
      otherwise: (schema) => schema.notRequired()
    }),
  loanInterestRateBS: yup.number()
    .when('model', {
      is: 'Balance-Sheet',
      then: (schema) => schema.required('Loan interest rate is required').min(0, 'Must be positive').max(20, 'Must be less than 20%'),
      otherwise: (schema) => schema.notRequired()
    }),
  loanInterestRatePF: yup.number()
    .when('model', {
      is: 'Project-Finance',
      then: (schema) => schema.required('Loan interest rate is required').min(0, 'Must be positive').max(20, 'Must be less than 20%'),
      otherwise: (schema) => schema.notRequired()
    }),
  minimumDSCR: yup.number().required('Minimum DSCR is required').min(1, 'Must be at least 1')
}).required();

const FinancingModule = () => {
  // Use our custom form hook
  const { 
    control, 
    handleSubmit, 
    watch, 
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
    onSubmitForm,
    moduleData
  } = useScenarioForm({
    validationSchema: financingSchema,
    moduleName: 'financing',
    showSuccessMessage: true,
    successMessage: 'Financing settings saved successfully'
  });
  
  // Watch fields for conditional rendering
  const financingModel = watch('model');
  
  return (
    <div>
      <Title level={2}>Financing Module Configuration</Title>
      <p>Configure the financial parameters and investment structure for the wind farm project.</p>

      <Form onSubmit={onSubmitForm}>
        {/* Investment Section */}
        <FormSection title="Investment Parameters">
          <FormRow>
            <FormCol span={12}>
              <CurrencyField
                name="capex"
                label="CAPEX Investment (USD)"
                control={control}
                error={errors.capex?.message}
                tooltip="Upfront capital expenditure required for plant construction"
                min={0}
                step={1000000}
                prefix={<DollarOutlined />}
              />
            </FormCol>
            <FormCol span={12}>
              <CurrencyField
                name="devex"
                label="DEVEX Investment (USD)"
                control={control}
                error={errors.devex?.message}
                tooltip="Development expenditure incurred prior to construction"
                min={0}
                step={1000000}
                prefix={<DollarOutlined />}
              />
            </FormCol>
          </FormRow>
        </FormSection>

        {/* Loan Parameters */}
        <FormSection title="Loan Parameters">
          <NumberField
            name="loanDuration"
            label="Loan Duration / Loan Tenor (Years)"
            control={control}
            error={errors.loanDuration?.message}
            tooltip="Duration over which the loan is repaid"
            min={1}
            max={30}
          />
        </FormSection>

        {/* Financing Model Section */}
        <FormSection title="Financing Model">
          <RadioGroupField
            name="model"
            control={control}
            error={errors.model?.message}
            options={[
              { value: 'Balance-Sheet', label: 'Balance-Sheet' },
              { value: 'Project-Finance', label: 'Project-Finance (Non-Recourse)' }
            ]}
            optionType="button"
          />

          <Alert
            message={
              financingModel === 'Balance-Sheet' 
                ? "Balance-Sheet Model" 
                : "Project-Finance Model"
            }
            description={
              financingModel === 'Balance-Sheet'
                ? "Financing is typically on the sponsor's balance sheet, with inputs such as Debt-to-Equity Ratio."
                : "Financing is based on project cash flows, using a Debt-to-CAPEX Ratio with stricter DSCR requirements."
            }
            type="info"
            showIcon
            style={{ marginBottom: 16, marginTop: 16 }}
          />
          
          {/* Balance Sheet Model Fields - show only when Balance-Sheet is selected */}
          {financingModel === 'Balance-Sheet' && (
            <FormRow>
              <FormCol span={12}>
                <NumberField
                  name="debtToEquityRatio"
                  label="Debt-to-Equity Ratio"
                  control={control}
                  error={errors.debtToEquityRatio?.message}
                  min={0}
                  step={0.1}
                />
              </FormCol>
              <FormCol span={12}>
                <PercentageField
                  name="loanInterestRateBS"
                  label="Loan Interest Rate"
                  control={control}
                  error={errors.loanInterestRateBS?.message}
                  min={0}
                  max={20}
                  step={0.25}
                  prefix={<PercentageOutlined />}
                />
              </FormCol>
            </FormRow>
          )}

          {/* Project Finance Model Fields - show only when Project-Finance is selected */}
          {financingModel === 'Project-Finance' && (
            <FormRow>
              <FormCol span={12}>
                <NumberField
                  name="debtToCapexRatio"
                  label="Debt-to-CAPEX Ratio"
                  control={control}
                  error={errors.debtToCapexRatio?.message}
                  min={0}
                  max={1}
                  step={0.05}
                />
              </FormCol>
              <FormCol span={12}>
                <PercentageField
                  name="loanInterestRatePF"
                  label="Loan Interest Rate"
                  control={control}
                  error={errors.loanInterestRatePF?.message}
                  min={0}
                  max={20}
                  step={0.25}
                  prefix={<PercentageOutlined />}
                />
              </FormCol>
            </FormRow>
          )}
        </FormSection>

        {/* DSCR Requirements */}
        <FormSection title="Debt Service Requirements">
          <NumberField
            name="minimumDSCR"
            label="Minimum DSCR (Debt Service Coverage Ratio)"
            control={control}
            error={errors.minimumDSCR?.message}
            tooltip="Minimum acceptable ratio of cash flow to debt service"
            min={1}
            step={0.05}
          />
        </FormSection>
      </Form>
    </div>
  );
};

export default FinancingModule;