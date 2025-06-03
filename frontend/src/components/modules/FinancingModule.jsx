// src/components/modules/FinancingModule.jsx
import React from 'react';
import { Typography, Alert, Tabs, Statistic, Row, Col, Card } from 'antd';
import { BankOutlined, LineChartOutlined, CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

// Import context field components
import {
  FormSection,
  NumberField,
  SelectField,
  PercentageField,
  ResponsiveFieldRow,
  CompactFieldGroup,
  SwitchField
} from '../contextFields';

const { Title, Paragraph } = Typography;

const FinancingModule = () => {
  // Define base path for financing module
  const basePath = ['settings', 'modules', 'financing'];

  // Get scenario data and context functions
  const { scenarioData, getValueByPath } = useScenario();

  // Helper function to check if we have valid scenario
  const hasValidScenario = () => scenarioData && scenarioData.settings?.modules?.financing;

  // Get WACC from metrics (calculated by metricsUtils)
  const wacc = getValueByPath(['settings', 'metrics', 'wacc'], 0);
  const debtToEquityRatio = getValueByPath(['settings', 'metrics', 'debtToEquityRatio'], 0);

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
                Financing Metrics
              </span>
            }
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="WACC"
                  value={wacc}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: '#1890ff', fontSize: '1.5em' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Debt-to-Equity Ratio"
                  value={debtToEquityRatio}
                  precision={2}
                  suffix=":1"
                  valueStyle={{ color: '#52c41a', fontSize: '1.5em' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Debt Financing"
                  value={getValueByPath([...basePath, 'debtFinancingRatio'], 70)}
                  precision={0}
                  suffix="% of CAPEX"
                  valueStyle={{ color: '#722ed1', fontSize: '1.5em' }}
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
                path={[...basePath, 'debtFinancingRatio']}
                label="Debt Financing Ratio"
                tooltip="Percentage of total CAPEX financed with debt. Remainder is equity contribution."
                min={0}
                max={100}
                step={1}
                precision={2}
                affectedMetrics={['wacc', 'debtToEquityRatio']}
              />
              <PercentageField
                path={[...basePath, 'costOfConstructionDebt']}
                label="Construction Debt Interest Rate"
                tooltip="Annual interest rate for debt drawn during construction phase. Used to calculate Interest During Construction (IDC)."
                min={0}
                max={20}
                step={0.1}
                precision={2}
              />
              <PercentageField
                path={[...basePath, 'costOfOperationalDebt']}
                label="Operational Debt Interest Rate"
                tooltip="Annual interest rate for debt during operational phase. Used for debt service calculations and WACC."
                min={0}
                max={20}
                step={0.1}
                precision={2}
                affectedMetrics={['wacc']}
              />
              <SelectField
                path={[...basePath, 'amortizationType']}
                label="Debt Amortization Type"
                tooltip="How the debt principal is repaid over the loan term"
                options={[
                  { value: 'amortizing', label: 'Amortizing (Equal annual payments)' },
                  { value: 'bullet', label: 'Bullet (Principal at maturity)' }
                ]}
              />
            </CompactFieldGroup>
          </FormSection>

          <FormSection title="Construction Financing" style={{ marginBottom: 24 }}>
            <CompactFieldGroup direction="vertical" size="middle">
              <SwitchField
                path={[...basePath, 'idcCapitalization']}
                label="Capitalize Interest During Construction"
                tooltip="Whether interest paid during construction is added to project cost or expensed immediately"
              />
              <SelectField
                path={[...basePath, 'equityTiming']}
                label="Equity Contribution Timing"
                tooltip="When equity investors contribute their capital to the project"
                options={[
                  { value: 'upfront', label: 'Upfront (All equity at financial close)' },
                  { value: 'progressive', label: 'Progressive (Follows construction spending)' },
                  { value: 'atCOD', label: 'At COD (All equity at commercial operation)' }
                ]}
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
                tooltip="Period after COD before debt service payments begin"
                min={0}
                max={5}
                step={0.5}
                precision={1}
                addonAfter="years"
              />
            </ResponsiveFieldRow>
          </FormSection>

          {/* Info Box */}
          <Card
            size="small"
            style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
            title={
              <span>
                <InfoCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                Construction Financing Details
              </span>
            }
          >
            <Paragraph style={{ margin: 0, fontSize: '13px' }}>
              <strong>Debt Financing Ratio:</strong> Determines what percentage of total CAPEX is funded through debt.
              The remainder is funded through equity contributions.<br />
              <strong>Interest During Construction (IDC):</strong> When capitalized, interest paid on drawn debt during
              construction is added to the total project cost rather than expensed immediately.<br />
              <strong>Equity Timing:</strong> Controls when equity investors contribute capital - either all upfront,
              progressively following construction spending, or as a lump sum at COD.
            </Paragraph>
          </Card>
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