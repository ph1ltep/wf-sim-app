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
  FormSection,
  FormRow,
  FormCol
} from '../contextFields';
import { DistributionFieldV3 } from 'components/distributionFields';

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

              <DistributionFieldV3
                path={[...basePath, 'energyProduction']}
                defaultValuePath={['settings', 'metrics', 'netAEP']}
                tooltip="Statistical distribution of the annual energy production"
                showVisualization={true}
                showInfoBox={true}
                valueType="number"
                valueName="Net AEP (mean)"
                addonAfter="GWh/year"
                step={1000.0}
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'normal', label: 'Normal Distribution' },
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
              <DistributionFieldV3
                path={[...basePath, 'electricityPrice']}
                label="Fixed Price per MWh"
                tooltip="Fixed electricity price under PPA or other agreement"
                addonAfter="/MWh"
                valueType="currency"
                valueName="Electricity Price (mean)"
                showVisualization={true}
                showInfoBox={true}
                step={1.0}
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'normal', label: 'Normal Distribution' },
                  //{ value: 'lognormal', label: 'Lognormal Distribution' },
                  { value: 'uniform', label: 'Uniform Distribution' },
                  { value: 'gbm', label: 'Geometric Brownian Motion' }
                ]}
                showTitle={false}
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
              <DistributionFieldV3
                path={[...basePath, 'downtimePerEvent']}
                tooltip="Statistical distribution for downtime duration"
                addonAfter="days/event"
                valueType="number"
                valueName="Downtime Duration (median)"
                showVisualization={true}
                showInfoBox={true}
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'weibull', label: 'Weibull Distribution' },
                  { value: 'lognormal', label: 'Lognormal Distribution' },
                  { value: 'gamma', label: 'Gamma Distribution' }
                  //{ value: 'exponential', label: 'Exponential Distribution' }
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
              <DistributionFieldV3
                path={[...basePath, 'windVariability']}
                tooltip="Method for simulating wind resource variability"
                showVisualization={true}
                addonAfter="m/s"
                step={0.1}
                valueType="number"
                valueName="Wind Speed (mean)"
                showInfoBox={true}
                //infoBoxTitle="Wind Variability Distribution"
                options={[
                  { value: 'fixed', label: 'Fixed Value' },
                  { value: 'weibull', label: 'Weibull Distribution' },
                  //{ value: 'kaimal', label: 'Kaimal/IEC 61400-1 (Industry Standard)' }
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