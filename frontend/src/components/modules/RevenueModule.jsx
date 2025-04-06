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
  PercentageField,
  DistributionFieldV2,
  FormSection,
  FormRow,
  FormCol
} from '../contextFields';

const { Title } = Typography;

const RevenueModule = () => {
  // Get scenario data directly from context
  const { scenarioData } = useScenario();

  // Define base path for revenue module
  const basePath = ['settings', 'modules', 'revenue'];

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
          <FormRow>
            <FormCol >
              <p>Configure the annual energy production and its variability.</p>

              <DistributionFieldV2
                path={[...basePath, 'energyProduction', 'distribution']}
                defaultValuePath={['settings', 'metrics', 'netAEP']}
                tooltip="Statistical distribution of the annual energy production"
                showVisualization={true}
                valueType="number"
                addonAfter="GWh/year"
                step={1000.0}
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'normal', label: 'Normal Distribution' },
                  { value: 'triangular', label: 'Triangular Distribution' },
                  { value: 'uniform', label: 'Uniform Distribution' }
                ]}
              />
            </FormCol>
          </FormRow>
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
            <FormCol >
              <DistributionFieldV2
                path={[...basePath, 'electricityPrice', 'distribution']}
                label="Fixed Price per MWh"
                tooltip="Fixed electricity price under PPA or other agreement"
                addonAfter="/MWh"
                valueType="currency"
                showVisualization={true}
                step={1.0}
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'normal', label: 'Normal Distribution' },
                  { value: 'lognormal', label: 'Lognormal Distribution' },
                  { value: 'uniform', label: 'Uniform Distribution' }
                ]}
                showTitle={false}
              />
            </FormCol>
          </FormRow>

          <FormRow>
            <FormCol >
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
          <FormRow>
            <FormCol >
              <p>Configure the statistical distribution for downtime duration per failure event.</p>
              <DistributionFieldV2
                path={[...basePath, 'downtimePerEvent', 'distribution']}
                tooltip="Statistical distribution for downtime duration"
                addonAfter="hours"
                valueType="number"
                showVisualization={true}
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'weibull', label: 'Weibull Distribution' },
                  { value: 'lognormal', label: 'Lognormal Distribution' },
                  { value: 'exponential', label: 'Exponential Distribution' }
                ]}
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
            <FormCol >
              <p>Configure the statistical distribution for wind variability.</p>
              <DistributionFieldV2
                path={[...basePath, 'windVariability', 'distribution']}
                tooltip="Method for simulating wind resource variability"
                showVisualization={true}
                addonAfter="m/s"
                step={0.1}
                valueType="number"
                valueName="Avg Wind Speed"
                showInfoBox={true}
                infoBoxTitle="Wind Variability Distribution"
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'weibull', label: 'Weibull Distribution' },
                  { value: 'kaimal', label: 'Kaimal/IEC 61400-1 (Industry Standard)' }
                ]}
              />
            </FormCol>
          </FormRow>
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