// src/components/modules/RevenueModule.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Button, Alert } from 'antd';
import { PercentageOutlined } from '@ant-design/icons';
import * as yup from 'yup';

// Import our new form components and hooks
import { useScenarioForm } from '../../hooks/forms';
import {
  Form,
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  RadioGroupField,
  PercentageField,
  SelectField
} from '../../components/forms';
import FormButtons from '../../components/forms/FormButtons';
import UnsavedChangesIndicator from '../forms/UnsavedChangesIndicator';

const { Title } = Typography;
const { TabPane } = Tabs;

// Define validation schema
const revenueSchema = yup.object({
  // Energy Production
  energyProduction: yup.object({
    distribution: yup
      .string()
      .required('Distribution type is required')
      .oneOf(['Fixed', 'Normal', 'Triangular', 'Uniform'], 'Invalid distribution type'),

    mean: yup
      .number()
      .required('Mean energy production is required')
      .min(0, 'Must be positive'),

    std: yup
      .number()
      .when('distribution', {
        is: 'Normal',
        then: schema => schema.required('Standard deviation is required').min(0, 'Must be positive')
      }),

    min: yup
      .number()
      .when('distribution', {
        is: (dist) => ['Triangular', 'Uniform'].includes(dist),
        then: schema => schema.required('Minimum value is required').min(0, 'Must be positive')
      }),

    max: yup
      .number()
      .when('distribution', {
        is: (dist) => ['Triangular', 'Uniform'].includes(dist),
        then: schema => schema.required('Maximum value is required').min(0, 'Must be positive')
      })
  }),

  // Electricity Price
  electricityPrice: yup.object({
    type: yup
      .string()
      .required('Price type is required')
      .oneOf(['fixed', 'variable'], 'Invalid price type'),

    value: yup
      .number()
      .when('type', {
        is: 'fixed',
        then: schema => schema.required('Price value is required').min(0, 'Must be positive')
      }),

    distribution: yup
      .string()
      .when('type', {
        is: 'variable',
        then: schema => schema.required('Distribution type is required')
          .oneOf(['Normal', 'Lognormal', 'Triangular', 'Uniform'], 'Invalid distribution type')
      })
  }),

  // Revenue Degradation
  revenueDegradationRate: yup
    .number()
    .required('Revenue degradation rate is required')
    .min(0, 'Must be positive')
    .max(10, 'Must be less than 10%'),

  // Downtime
  downtimePerEvent: yup.object({
    distribution: yup
      .string()
      .required('Downtime distribution is required')
      .oneOf(['Weibull', 'Lognormal', 'Exponential'], 'Invalid distribution type'),

    scale: yup
      .number()
      .required('Scale parameter is required')
      .min(0, 'Must be positive'),

    shape: yup
      .number()
      .when('distribution', {
        is: (dist) => ['Weibull', 'Lognormal'].includes(dist),
        then: schema => schema.required('Shape parameter is required').min(0, 'Must be positive')
      })
  }),

  // Wind Variability
  windVariabilityMethod: yup
    .string()
    .required('Wind variability method is required')
    .oneOf(['Default', 'Kaimal'], 'Invalid wind variability method'),

  turbulenceIntensity: yup
    .number()
    .when('windVariabilityMethod', {
      is: 'Kaimal',
      then: schema => schema.required('Turbulence intensity is required').min(0, 'Must be positive').max(30, 'Must be less than 30%')
    }),

  surfaceRoughness: yup
    .number()
    .when('windVariabilityMethod', {
      is: 'Kaimal',
      then: schema => schema.required('Surface roughness is required').min(0.001, 'Must be positive').max(1, 'Must be less than 1')
    }),

  kaimalScale: yup
    .number()
    .when('windVariabilityMethod', {
      is: 'Kaimal',
      then: schema => schema.required('Kaimal scale is required').min(1, 'Must be at least 1').max(20, 'Must be less than 20')
    })
}).required();

const RevenueModule = () => {
  const [activeTab, setActiveTab] = useState('production');

  // Use our custom form hook
  const {
    control,
    watch,
    formState: { errors },
    onSubmitForm,
    isDirty,
    reset
  } = useScenarioForm({
    validationSchema: revenueSchema,
    moduleName: 'revenue',
    showSuccessMessage: true,
    successMessage: 'Revenue settings saved successfully'
  });

  // Watch values for conditional rendering
  const energyDistribution = watch('energyProduction.distribution');
  const priceType = watch('electricityPrice.type');
  const downtimeDistribution = watch('downtimePerEvent.distribution');
  const windMethod = watch('windVariabilityMethod');

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div>
      <Title level={2}>Revenue Module Configuration
        <UnsavedChangesIndicator isDirty={isDirty} onSave={onSubmitForm} />
      </Title>
      <p>Configure the revenue parameters for the wind farm simulation.</p>

      {/* Custom Form component without built-in buttons */}
      <Form
        onSubmit={null}
        submitButtons={false}
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          {/* Energy Production Tab */}
          <TabPane tab="Energy Production" key="production">
            <FormSection title="Energy Production Parameters">
              <FormRow>
                <FormCol span={12}>
                  <SelectField
                    name="energyProduction.distribution"
                    label="Energy Production Distribution"
                    control={control}
                    error={errors.energyProduction?.distribution?.message}
                    tooltip="The statistical distribution used to model energy production variability"
                    options={[
                      { value: 'Fixed', label: 'Fixed' },
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Triangular', label: 'Triangular' },
                      { value: 'Uniform', label: 'Uniform' }
                    ]}
                    style={{ width: 150 }}
                  />
                </FormCol>
              </FormRow>

              <FormRow>
                <FormCol span={12}>
                  <NumberField
                    name="energyProduction.mean"
                    label="Mean Energy Production (MWh/year)"
                    control={control}
                    error={errors.energyProduction?.mean?.message}
                    tooltip="Expected average annual energy production"
                    min={0}
                    step={100}
                    style={{ width: 200 }}
                  />
                </FormCol>
              </FormRow>

              {/* Conditional fields based on distribution type */}
              {energyDistribution === 'Normal' && (
                <FormRow>
                  <FormCol span={12}>
                    <NumberField
                      name="energyProduction.std"
                      label="Standard Deviation (MWh/year)"
                      control={control}
                      error={errors.energyProduction?.std?.message}
                      tooltip="Standard deviation for Normal distribution"
                      min={0}
                      step={10}
                      style={{ width: 200 }}
                    />
                  </FormCol>
                </FormRow>
              )}

              {['Triangular', 'Uniform'].includes(energyDistribution) && (
                <FormRow>
                  <FormCol span={12}>
                    <NumberField
                      name="energyProduction.min"
                      label="Minimum (MWh/year)"
                      control={control}
                      error={errors.energyProduction?.min?.message}
                      tooltip="Minimum possible energy production"
                      min={0}
                      step={100}
                      style={{ width: 200 }}
                    />
                  </FormCol>
                  <FormCol span={12}>
                    <NumberField
                      name="energyProduction.max"
                      label="Maximum (MWh/year)"
                      control={control}
                      error={errors.energyProduction?.max?.message}
                      tooltip="Maximum possible energy production"
                      min={0}
                      step={100}
                      style={{ width: 200 }}
                    />
                  </FormCol>
                </FormRow>
              )}

              <FormRow>
                <FormCol span={12}>
                  <PercentageField
                    name="revenueDegradationRate"
                    label="Revenue Degradation Rate (%/year)"
                    control={control}
                    error={errors.revenueDegradationRate?.message}
                    tooltip="Annual rate at which revenue decreases due to aging equipment"
                    min={0}
                    max={10}
                    step={0.1}
                    precision={1}
                    style={{ width: 130 }}
                  />
                </FormCol>
              </FormRow>
            </FormSection>
          </TabPane>

          {/* Electricity Price Tab */}
          <TabPane tab="Electricity Price" key="price">
            <FormSection title="Electricity Price Parameters">
              <FormRow>
                <FormCol span={24}>
                  <RadioGroupField
                    name="electricityPrice.type"
                    label="Price Type"
                    control={control}
                    error={errors.electricityPrice?.type?.message}
                    options={[
                      { value: 'fixed', label: 'Fixed (PPA)' },
                      { value: 'variable', label: 'Variable (Market)' }
                    ]}
                  />
                </FormCol>
              </FormRow>

              {/* Conditional fields based on price type */}
              {priceType === 'fixed' && (
                <FormRow>
                  <FormCol span={12}>
                    <NumberField
                      name="electricityPrice.value"
                      label="Electricity Price (USD/MWh)"
                      control={control}
                      error={errors.electricityPrice?.value?.message}
                      tooltip="Fixed price per MWh of electricity"
                      min={0}
                      step={1}
                      addonBefore="$"
                      style={{ width: 150 }}
                    />
                  </FormCol>
                </FormRow>
              )}

              {priceType === 'variable' && (
                <FormRow>
                  <FormCol span={12}>
                    <SelectField
                      name="electricityPrice.distribution"
                      label="Price Distribution"
                      control={control}
                      error={errors.electricityPrice?.distribution?.message}
                      tooltip="Statistical distribution for variable electricity prices"
                      options={[
                        { value: 'Normal', label: 'Normal' },
                        { value: 'Lognormal', label: 'Lognormal' },
                        { value: 'Triangular', label: 'Triangular' },
                        { value: 'Uniform', label: 'Uniform' }
                      ]}
                      style={{ width: 150 }}
                    />
                  </FormCol>
                  <FormCol span={12}>
                    <Alert
                      message="Feature in Development"
                      description="Additional distribution parameters will be available in a future version."
                      type="info"
                      showIcon
                    />
                  </FormCol>
                </FormRow>
              )}
            </FormSection>
          </TabPane>

          {/* Downtime Tab */}
          <TabPane tab="Downtime" key="downtime">
            <FormSection title="Downtime Parameters">
              <FormRow>
                <FormCol span={12}>
                  <SelectField
                    name="downtimePerEvent.distribution"
                    label="Downtime Distribution"
                    control={control}
                    error={errors.downtimePerEvent?.distribution?.message}
                    tooltip="Statistical distribution for downtime duration"
                    options={[
                      { value: 'Weibull', label: 'Weibull' },
                      { value: 'Lognormal', label: 'Lognormal' },
                      { value: 'Exponential', label: 'Exponential' }
                    ]}
                    style={{ width: 150 }}
                  />
                </FormCol>
              </FormRow>

              <FormRow>
                <FormCol span={12}>
                  <NumberField
                    name="downtimePerEvent.scale"
                    label="Scale Parameter (hours)"
                    control={control}
                    error={errors.downtimePerEvent?.scale?.message}
                    tooltip={`For Weibull: Scale parameter; For Lognormal: Median value; For Exponential: Mean value`}
                    min={0}
                    step={1}
                    style={{ width: 150 }}
                  />
                </FormCol>

                {/* Shape parameter only for Weibull and Lognormal */}
                {['Weibull', 'Lognormal'].includes(downtimeDistribution) && (
                  <FormCol span={12}>
                    <NumberField
                      name="downtimePerEvent.shape"
                      label="Shape Parameter"
                      control={control}
                      error={errors.downtimePerEvent?.shape?.message}
                      tooltip={`For Weibull: Shape parameter; For Lognormal: Sigma parameter`}
                      min={0}
                      step={0.1}
                      precision={1}
                      style={{ width: 150 }}
                    />
                  </FormCol>
                )}
              </FormRow>
            </FormSection>
          </TabPane>

          {/* Wind Variability Tab */}
          <TabPane tab="Wind Variability" key="wind">
            <FormSection title="Wind Variability Simulation Method">
              <FormRow>
                <FormCol span={24}>
                  <RadioGroupField
                    name="windVariabilityMethod"
                    label="Method"
                    control={control}
                    error={errors.windVariabilityMethod?.message}
                    options={[
                      { value: 'Default', label: 'Default' },
                      { value: 'Kaimal', label: 'Industry Standard (Kaimal/IEC 61400-1)' }
                    ]}
                  />
                </FormCol>
              </FormRow>

              {/* Kaimal-specific parameters */}
              {windMethod === 'Kaimal' && (
                <>
                  <FormRow>
                    <FormCol span={12}>
                      <PercentageField
                        name="turbulenceIntensity"
                        label="Turbulence Intensity (%)"
                        control={control}
                        error={errors.turbulenceIntensity?.message}
                        tooltip="Percentage of mean wind speed"
                        min={0}
                        max={30}
                        step={1}
                        precision={1}
                        style={{ width: 130 }}
                      />
                    </FormCol>
                  </FormRow>

                  <FormRow>
                    <FormCol span={12}>
                      <NumberField
                        name="surfaceRoughness"
                        label="Surface Roughness Length (m)"
                        control={control}
                        error={errors.surfaceRoughness?.message}
                        tooltip="Characteristic of the terrain"
                        min={0.001}
                        max={1}
                        step={0.01}
                        precision={3}
                        style={{ width: 150 }}
                      />
                    </FormCol>
                    <FormCol span={12}>
                      <NumberField
                        name="kaimalScale"
                        label="Kaimal Scale Parameter (m)"
                        control={control}
                        error={errors.kaimalScale?.message}
                        tooltip="Scale parameter for the Kaimal spectral model"
                        min={1}
                        max={20}
                        step={0.1}
                        precision={1}
                        style={{ width: 150 }}
                      />
                    </FormCol>
                  </FormRow>
                </>
              )}
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

export default RevenueModule;