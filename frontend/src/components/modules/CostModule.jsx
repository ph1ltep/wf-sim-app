// src/components/modules/CostModule.jsx
import React from 'react';
import { Typography, Alert, Tabs } from 'antd';
import {
  DollarOutlined,
  ToolOutlined,
  WarningOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
  TextField,
  NumberField,
  CurrencyField,
  PercentageField,
  SelectField,
  FormSection,
  FormRow,
  FormCol,
  EditableTable,
  ResponsiveFieldRow
} from '../contextFields';

const { Title } = Typography;

const CostModule = () => {
  // Get scenario data directly from context
  const { scenarioData } = useScenario();

  // Define base path for cost module
  const basePath = ['settings', 'modules', 'cost'];

  // Get values from context for conditional rendering
  const oemTerm = scenarioData?.settings?.modules?.cost?.oemTerm || 0;
  const projectLife = scenarioData?.settings?.general?.projectLife || 20;

  // Get the currency from scenario
  const currency = scenarioData?.settings?.project?.currency?.local || 'USD';

  // Check if we have an active scenario
  if (!scenarioData) {
    return (
      <div>
        <Title level={2}>Cost Module</Title>
        <Alert
          message="No Active Scenario"
          description="Please create or load a scenario first."
          type="warning"
        />
      </div>
    );
  }

  // Annual adjustment form fields for EditableTable
  const annualAdjustmentFields = [
    <NumberField
      key="year"
      label="Year"
      path="year"
      min={1}
      max={projectLife}
      required
    />,
    <CurrencyField
      key="additionalOM"
      label="Additional O&M Cost"
      path="additionalOM"
      currencyOverride={currency}
    />,
    <TextField
      key="description"
      label="Description"
      path="description"
      placeholder="Reason for adjustment"
    />
  ];

  // Annual adjustment table columns
  const annualAdjustmentColumns = [
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      sorter: (a, b) => a.year - b.year
    },
    {
      title: 'Additional Cost',
      dataIndex: 'additionalOM',
      key: 'additionalOM',
      render: value => `${currency} ${(value || 0).toLocaleString()}`
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    }
  ];

  // Major repair events table fields
  const majorRepairFields = [
    <NumberField
      key="year"
      label="Year"
      path="year"
      min={1}
      max={projectLife}
      required
    />,
    <CurrencyField
      key="cost"
      label="Cost"
      path="cost"
      currencyOverride={currency}
      required
    />,
    <PercentageField
      key="probability"
      label="Probability"
      path="probability"
      min={0}
      max={100}
      step={1}
    />
  ];

  // Major repair table columns
  const majorRepairColumns = [
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      sorter: (a, b) => a.year - b.year
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: value => `${currency} ${(value || 0).toLocaleString()}`
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: value => `${value}%`
    }
  ];

  const tabItems = [
    {
      key: "investment",
      label: (
        <span>
          <DollarOutlined /> Investment
        </span>
      ),
      children: (
        <FormSection title="Capital & Development Investment" style={{ marginBottom: 24 }}>
          <ResponsiveFieldRow layout="twoColumn">
            <CurrencyField
              path={[...basePath, 'capex']}
              label="CAPEX Investment"
              tooltip="Total capital expenditure for plant construction"
              min={0}
              step={1000000}
            />
            <CurrencyField
              path={[...basePath, 'devex']}
              label="DEVEX Investment"
              tooltip="Development expenditure incurred prior to construction"
              min={0}
              step={100000}
            />
          </ResponsiveFieldRow>
        </FormSection>
      )
    },
    {
      key: "escalation",
      label: (
        <span>
          <DollarOutlined /> Escalation
        </span>
      ),
      children: (
        <FormSection title="Cost Escalation" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol >
              <DistributionFieldV3
                path={[...basePath, 'escalationRate']}
                tooltip="Annual rate of increase in O&M costs"
                showVisualization={true}
                showInfoBox={true}
                valueType="percent"
                valueName="Index (starting value)"
                //addonAfter="GWh/year"
                step={0.1}
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
      key: "oemContract",
      label: (
        <span>
          <ToolOutlined /> OEM Contract
        </span>
      ),
      children: (
        <FormSection title="OEM Contract" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol>
              <NumberField
                path={[...basePath, 'oemTerm']}
                label="OEM Term (Years)"
                tooltip="Duration of OEM service contract"
                min={0}
                max={projectLife}
                step={1}
              />
            </FormCol>
          </FormRow>
          <FormRow>
            <FormCol>
              <CurrencyField
                path={[...basePath, 'fixedOMFee']}
                label="Fixed O&M Fee during OEM Term"
                tooltip="Annual fee paid during OEM contract period"
                min={0}
                step={10000}
                currencyOverride={currency}
                disabled={oemTerm <= 0}
              />
            </FormCol>
          </FormRow>
        </FormSection>
      )
    },
    {
      key: "failureEvents",
      label: (
        <span>
          <WarningOutlined /> Failure Events
        </span>
      ),
      children: (
        <FormSection title="Failure Events" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol>
              <PercentageField
                path={[...basePath, 'failureEventProbability']}
                label="Failure Event Probability"
                tooltip="Annual probability of a failure event occurring"
                min={0}
                max={100}
                step={0.1}
              />
            </FormCol>
            <FormCol>
              <CurrencyField
                path={[...basePath, 'failureEventCost']}
                label="Average Failure Event Cost"
                tooltip="Average cost per failure event"
                min={0}
                step={10000}
                currencyOverride={currency}
              />
            </FormCol>
          </FormRow>
        </FormSection>
      )
    },
    {
      key: "majorRepairs",
      label: (
        <span>
          <ScheduleOutlined /> Major Repairs
        </span>
      ),
      children: (
        <FormSection title="Major Repair Events" style={{ marginBottom: 24 }}>
          <p>Schedule major repair or replacement events at specific years of the project lifetime.</p>
          <EditableTable
            path={[...basePath, 'majorRepairEvents']}
            columns={majorRepairColumns}
            formFields={majorRepairFields}
            keyField="year"
            itemName="Major Repair Event"
          />
        </FormSection>
      )
    },
    {
      key: "adjustments",
      label: (
        <span>
          <DollarOutlined /> Annual Adjustments
        </span>
      ),
      children: (
        <FormSection title="Annual Cost Adjustments" style={{ marginBottom: 24 }}>
          <p>Add specific cost adjustments for individual years (e.g., midlife overhauls, equipment upgrades).</p>
          <EditableTable
            path={[...basePath, 'adjustments']}
            columns={annualAdjustmentColumns}
            formFields={annualAdjustmentFields}
            keyField="year"
            itemName="Annual Adjustment"
          />
        </FormSection>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Cost Module</Title>
      <p>Configure operation and maintenance costs for your wind farm project.</p>

      <Tabs defaultActiveKey="baseOM" items={tabItems} type="card" />
    </div>
  );
};

export default CostModule;