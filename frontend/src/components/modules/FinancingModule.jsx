// src/components/modules/FinancingModule.jsx
import React from 'react';
import { Typography, Alert, Tabs, Statistic, Row, Col, Card } from 'antd';
import { BankOutlined, LineChartOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

// Import context field components
import {
  FormSection,
  NumberField,
  SelectField,
  PercentageField,
  ResponsiveFieldRow,
  CompactFieldGroup
} from '../contextFields';

const { Title } = Typography;

const FinancingModule = () => {
  // Define base path for financing module
  const basePath = ['settings', 'modules', 'financing'];

  // Get scenario data and context functions
  const { scenarioData, getValueByPath } = useScenario();

  // Helper function to check if we have valid scenario
  const hasValidScenario = () => scenarioData && scenarioData.settings?.modules?.financing;

  // Get WACC from metrics (calculated by metricsUtils)
  const wacc = getValueByPath(['settings', 'metrics', 'wacc'], 0);

  if (!hasValidScenario()) {
    return (
      <div>
        <Title level={2}>Financing Module</Title>
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
      key: "financing",
      label: (
        <span>
          <BankOutlined /> Financing Structure
        </span>
      ),
      children: (
        <>
          {/* WACC Summary Card */}
          <Card
            size="small"
            style={{ marginBottom: 24, backgroundColor: '#fafafa' }}
            title={
              <span>
                <CalculatorOutlined style={{ marginRight: 8 }} />
                Weighted Average Cost of Capital
              </span>
            }
          >
            <Row justify="center">
              <Col>
                <Statistic
                  title="WACC"
                  value={wacc}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#1890ff', fontSize: '2em' }}
                />
              </Col>
            </Row>
          </Card>

          <FormSection title="Financing Structure" style={{ marginBottom: 24 }}>
            <ResponsiveFieldRow layout="twoColumn">
              <SelectField
                path={[...basePath, 'model']}
                label="Financing Model"
                tooltip="Determines how the project will be financed"
                options={[
                  { value: 'Balance-Sheet', label: 'Balance-Sheet (Corporate)' },
                  { value: 'Project-Finance', label: 'Project-Finance (Non-Recourse)' }
                ]}
              />
              <NumberField
                path={[...basePath, 'loanDuration']}
                label="Loan Duration / Tenor"
                tooltip="Duration of the loan in years"
                min={1}
                max={30}
                step={1}
                addonAfter="years"
              />
            </ResponsiveFieldRow>
          </FormSection>

          <FormSection title="Debt Parameters" style={{ marginBottom: 24 }}>
            <CompactFieldGroup direction="vertical" size="middle">
              <PercentageField
                path={[...basePath, 'debtRatio']}
                label="Debt Ratio"
                tooltip="Percentage of total project financing from debt"
                min={0}
                max={100}
                step={1}
                precision={2}
                affectedMetrics={['wacc', 'debtToEquityRatio']}
              />
              <PercentageField
                path={[...basePath, 'costOfConstructionDebt']}
                label="Construction Debt Interest Rate"
                tooltip="Annual interest rate for construction phase debt"
                min={0}
                max={20}
                step={0.1}
                precision={2}
              />
              <PercentageField
                path={[...basePath, 'costOfOperationalDebt']}
                label="Operational Debt Interest Rate"
                tooltip="Annual interest rate for operational phase debt"
                min={0}
                max={20}
                step={0.1}
                precision={2}
                affectedMetrics={['wacc']}
              />
            </CompactFieldGroup>
          </FormSection>

          <FormSection title="Equity & Tax Parameters" style={{ marginBottom: 24 }}>
            <CompactFieldGroup direction="vertical" size="middle">
              <PercentageField
                path={[...basePath, 'costOfEquity']}
                label="Cost of Equity"
                tooltip="Required return rate for equity investors"
                min={0}
                max={30}
                step={0.1}
                precision={2}
                affectedMetrics={['wacc']}
              />
              <PercentageField
                path={[...basePath, 'effectiveTaxRate']}
                label="Effective Corporate Tax Rate"
                tooltip="Combined corporate tax rate affecting debt tax shield"
                min={0}
                max={50}
                step={0.5}
                precision={2}
                affectedMetrics={['wacc']}
              />
            </CompactFieldGroup>
          </FormSection>

          <FormSection title="Debt Service Requirements" style={{ marginBottom: 24 }}>
            <ResponsiveFieldRow layout="twoColumn">
              <NumberField
                path={[...basePath, 'minimumDSCR']}
                label="Minimum DSCR"
                tooltip="Minimum Debt Service Coverage Ratio required by lenders"
                min={1}
                step={0.05}
                precision={2}
              />
              <NumberField
                path={[...basePath, 'gracePeriod']}
                label="Grace Period"
                tooltip="Period before debt service payments begin"
                min={0}
                max={5}
                step={0.5}
                precision={1}
                addonAfter="years"
              />
            </ResponsiveFieldRow>
          </FormSection>
        </>
      )
    },
    {
      key: "returns",
      label: (
        <span>
          <LineChartOutlined /> Return Targets
        </span>
      ),
      children: (
        <FormSection title="Return Targets" style={{ marginBottom: 24 }}>
          <ResponsiveFieldRow layout="twoColumn">
            <PercentageField
              path={[...basePath, 'equityIRRTarget']}
              label="Equity IRR Target"
              tooltip="Target Internal Rate of Return for equity investors"
              min={0}
              max={30}
              step={0.5}
              precision={2}
            />
            <PercentageField
              path={[...basePath, 'projectIRRTarget']}
              label="Project IRR Target"
              tooltip="Target Internal Rate of Return for the overall project"
              min={0}
              max={20}
              step={0.5}
              precision={2}
            />
          </ResponsiveFieldRow>

          <ResponsiveFieldRow layout="oneColumn">
            <NumberField
              path={[...basePath, 'targetPaybackPeriod']}
              label="Target Payback Period"
              tooltip="Target number of years to recoup the initial investment"
              min={1}
              max={30}
              step={0.5}
              precision={1}
              addonAfter="years"
            />
          </ResponsiveFieldRow>
        </FormSection>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Financing Module</Title>
      <p>Configure investment parameters and financing structure for your wind farm project.</p>

      <Tabs defaultActiveKey="financing" items={tabItems} type="card" />
    </div>
  );
};

export default FinancingModule;