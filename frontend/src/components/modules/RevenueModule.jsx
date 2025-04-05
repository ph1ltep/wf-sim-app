// src/components/modules/RevenueModule.jsx
import React from 'react';
import { Typography, Alert, Tabs } from 'antd';
import {
  LineChartOutlined,
  DollarOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

// Import context field components
import {
  TextField,
  NumberField,
  CurrencyField,
  PercentageField,
  SelectField,
  SwitchField,
  DistributionField,
  FormSection,
  FormRow,
  FormCol,
  FormDivider
} from '../contextFields';

const { Title } = Typography;

const RevenueModule = () => {
  // Get scenario data directly from context
  const { scenarioData } = useScenario();

  // Define base path for revenue module
  const basePath = ['settings', 'modules', 'revenue'];

  // Get values from context for conditional rendering
  const electricityPriceType = scenarioData?.settings?.modules?.revenue?.electricityPrice?.type || 'fixed';
  const windVariabilityMethod = scenarioData?.settings?.modules?.revenue?.windVariabilityMethod || 'Default';

  // Get the currency from scenario
  const currency = scenarioData?.settings?.project?.currency?.local || 'USD';

  // Check if we have an active scenario
  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Revenue Module</Title>
        <Alert
          message="No Active Scenario"
          description="Please create or load a scenario first."
          type="warning"
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: "production",
      label: (
        <span>
          <LineChartOutlined /> Energy Production
        </span>
      ),
      children: (
        <FormSection title="Energy Production" style={{ marginBottom: 24 }}>
          <p>Configure the annual energy production and its variability.</p>

          <DistributionField
            path={[...basePath, 'energyProduction']}
            label="Energy Production"
            tooltip="Statistical distribution of the annual energy production"
            options={[
              { value: 'Normal', label: 'Normal' },
              { value: 'Lognormal', label: 'Lognormal' },
              { value: 'Triangular', label: 'Triangular' },
              { value: 'Uniform', label: 'Uniform' }
            ]}
          />
        </FormSection>
      )
    },
    {
      key: "price",
      label: (
        <span>
          <DollarOutlined /> Electricity Price
        </span>
      ),
      children: (
        <FormSection title="Electricity Price" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <SelectField
                path={[...basePath, 'electricityPrice', 'type']}
                label="Price Type"
                tooltip="Method for setting electricity price"
                options={[
                  { value: 'fixed', label: 'Fixed Price' },
                  { value: 'variable', label: 'Variable Price' }
                ]}
              />
            </FormCol>
          </FormRow>

          {electricityPriceType === 'fixed' && (
            <FormRow>
              <FormCol span={12}>
                <CurrencyField
                  path={[...basePath, 'electricityPrice', 'value']}
                  label="Fixed Price per MWh"
                  tooltip="Fixed electricity price under PPA or other agreement"
                  min={0}
                  step={1}
                  currencyOverride={currency}
                />
              </FormCol>
            </FormRow>
          )}

          {electricityPriceType === 'variable' && (
            <DistributionField
              path={[...basePath, 'electricityPrice', 'distribution']}
              label="Price Distribution"
              tooltip="Statistical distribution for electricity price variability"
              options={[
                { value: 'Normal', label: 'Normal' },
                { value: 'Lognormal', label: 'Lognormal' },
                { value: 'Triangular', label: 'Triangular' },
                { value: 'Uniform', label: 'Uniform' }
              ]}
            />
          )}

          <FormRow>
            <FormCol span={12}>
              <PercentageField
                path={[...basePath, 'revenueDegradationRate']}
                label="Annual Revenue Degradation Rate"
                tooltip="Annual percentage decrease in energy production due to equipment aging"
                min={0}
                max={10}
                step={0.1}
              />
            </FormCol>
          </FormRow>
        </FormSection>
      )
    },
    {
      key: "downtime",
      label: (
        <span>
          <FieldTimeOutlined /> Downtime
        </span>
      ),
      children: (
        <FormSection title="Downtime Configuration" style={{ marginBottom: 24 }}>
          <p>Configure the statistical distribution for downtime duration per failure event.</p>

          <FormRow>
            <FormCol span={24}>
              <SelectField
                path={[...basePath, 'downtimePerEvent', 'distribution']}
                label="Downtime Distribution"
                tooltip="Statistical distribution for downtime duration"
                options={[
                  { value: 'Weibull', label: 'Weibull' },
                  { value: 'Lognormal', label: 'Lognormal' },
                  { value: 'Exponential', label: 'Exponential' }
                ]}
              />
            </FormCol>
          </FormRow>

          <FormRow>
            <FormCol span={12}>
              <NumberField
                path={[...basePath, 'downtimePerEvent', 'scale']}
                label="Scale Parameter"
                tooltip="Scale parameter for the downtime distribution"
                min={0}
                step={1}
              />
            </FormCol>
            <FormCol span={12}>
              <NumberField
                path={[...basePath, 'downtimePerEvent', 'shape']}
                label="Shape Parameter"
                tooltip="Shape parameter for the downtime distribution (only for Weibull)"
                min={0}
                step={0.1}
              />
            </FormCol>
          </FormRow>
        </FormSection>
      )
    },
    {
      key: "windVariability",
      label: (
        <span>
          <ThunderboltOutlined /> Wind Variability
        </span>
      ),
      children: (
        <FormSection title="Wind Variability Method" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <SelectField
                path={[...basePath, 'windVariabilityMethod']}
                label="Wind Variability Method"
                tooltip="Method for simulating wind resource variability"
                options={[
                  { value: 'Default', label: 'Default Simulation' },
                  { value: 'Kaimal', label: 'Kaimal/IEC 61400-1 (Industry Standard)' }
                ]}
              />
            </FormCol>
          </FormRow>

          {windVariabilityMethod === 'Kaimal' && (
            <>
              <FormDivider title="Industry Standard Parameters" />
              <p>Additional parameters required for the Kaimal spectral model (IEC 61400-1).</p>

              <FormRow>
                <FormCol span={8}>
                  <PercentageField
                    path={[...basePath, 'turbulenceIntensity']}
                    label="Turbulence Intensity"
                    tooltip="Turbulence intensity as percentage of mean wind speed"
                    min={0}
                    max={30}
                    step={0.5}
                  />
                </FormCol>
                <FormCol span={8}>
                  <NumberField
                    path={[...basePath, 'surfaceRoughness']}
                    label="Surface Roughness Length"
                    tooltip="Terrain roughness parameter (in meters)"
                    min={0}
                    max={10}
                    step={0.01}
                  />
                </FormCol>
                <FormCol span={8}>
                  <NumberField
                    path={[...basePath, 'kaimalScale']}
                    label="Kaimal Scale Parameter"
                    tooltip="Scale parameter for the Kaimal spectrum"
                    min={0}
                    step={0.1}
                  />
                </FormCol>
              </FormRow>
            </>
          )}
        </FormSection>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Revenue Module</Title>
      <p>Configure revenue parameters and energy production for your wind farm project.</p>

      <Tabs defaultActiveKey="production" items={tabItems} type="card" />
    </div>
  );
};

export default RevenueModule;