// src/components/modules/FinancingModule.jsx
import React from 'react';
import { Typography, Alert, Tabs } from 'antd';
import { DollarOutlined, BankOutlined, LineChartOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  CurrencyField,
  SelectField,
  RadioGroupField,
  SwitchField,
  PercentageField,
  FormDivider
} from '../contextFields';

const { Title } = Typography;

const FinancingModule = () => {
  // Define base path for financing module
  const basePath = ['settings', 'modules', 'financing'];

  // Get scenario data and context functions
  const { scenarioData, getValueByPath } = useScenario();

  // Get financing model type for conditional rendering
  const financingModel = getValueByPath([...basePath, 'model'], 'Balance-Sheet');

  // Helper function to check if we have valid scenario
  const hasValidScenario = () => scenarioData && scenarioData.settings?.modules?.financing;

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
      key: "investment",
      label: (
        <span>
          <DollarOutlined /> Investment
        </span>
      ),
      children: (
        <FormSection title="Capital & Development Investment" style={{ marginBottom: 24 }}>
          <FormRow>
            <FormCol span={12}>
              <CurrencyField
                path={[...basePath, 'capex']}
                label="CAPEX Investment"
                tooltip="Total capital expenditure for plant construction"
                min={0}
                step={1000000}
              />
            </FormCol>
            <FormCol span={12}>
              <CurrencyField
                path={[...basePath, 'devex']}
                label="DEVEX Investment"
                tooltip="Development expenditure incurred prior to construction"
                min={0}
                step={100000}
              />
            </FormCol>
          </FormRow>
        </FormSection>
      )
    },
    {
      key: "financing",
      label: (
        <span>
          <BankOutlined /> Financing Structure
        </span>
      ),
      children: (
        <>
          <FormSection title="Financing Model" style={{ marginBottom: 24 }}>
            <FormRow>
              <FormCol span={12}>
                <SelectField
                  path={[...basePath, 'model']}
                  label="Financing Model"
                  tooltip="Determines how the project will be financed"
                  options={[
                    { value: 'Balance-Sheet', label: 'Balance-Sheet (Corporate)' },
                    { value: 'Project-Finance', label: 'Project-Finance (Non-Recourse)' }
                  ]}
                />
              </FormCol>
              <FormCol span={12}>
                <NumberField
                  path={[...basePath, 'loanDuration']}
                  label="Loan Duration / Tenor"
                  tooltip="Duration of the loan in years"
                  min={1}
                  max={30}
                  step={1}
                  addonAfter="years"
                />
              </FormCol>
            </FormRow>

            <FormDivider orientation="left">Financing Ratios</FormDivider>

            {financingModel === 'Balance-Sheet' ? (
              <FormRow>
                <FormCol span={12}>
                  <NumberField
                    path={[...basePath, 'debtToEquityRatio']}
                    label="Debt-to-Equity Ratio"
                    tooltip="Ratio of debt to equity financing"
                    min={0}
                    step={0.1}
                    precision={2}
                  />
                </FormCol>
                <FormCol span={12}>
                  <PercentageField
                    path={[...basePath, 'loanInterestRateBS']}
                    label="Loan Interest Rate"
                    tooltip="Annual interest rate for the loan"
                    min={0}
                    max={20}
                    step={0.1}
                    precision={2}
                  />
                </FormCol>
              </FormRow>
            ) : (
              <FormRow>
                <FormCol span={12}>
                  <NumberField
                    path={[...basePath, 'debtToCapexRatio']}
                    label="Debt-to-CAPEX Ratio"
                    tooltip="Ratio of debt to total CAPEX"
                    min={0}
                    max={1}
                    step={0.05}
                    precision={2}
                  />
                </FormCol>
                <FormCol span={12}>
                  <PercentageField
                    path={[...basePath, 'loanInterestRatePF']}
                    label="Loan Interest Rate"
                    tooltip="Annual interest rate for the loan"
                    min={0}
                    max={20}
                    step={0.1}
                    precision={2}
                  />
                </FormCol>
              </FormRow>
            )}
          </FormSection>

          <FormSection title="Debt Service Requirements" style={{ marginBottom: 24 }}>
            <FormRow>
              <FormCol span={12}>
                <NumberField
                  path={[...basePath, 'minimumDSCR']}
                  label="Minimum DSCR"
                  tooltip="Minimum Debt Service Coverage Ratio required by lenders"
                  min={1}
                  step={0.05}
                  precision={2}
                />
              </FormCol>
            </FormRow>
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
          <FormRow>
            <FormCol span={12}>
              <PercentageField
                path={[...basePath, 'equityIRRTarget']}
                label="Equity IRR Target"
                tooltip="Target Internal Rate of Return for equity investors"
                min={0}
                max={30}
                step={0.5}
                precision={1}
              />
            </FormCol>
            <FormCol span={12}>
              <PercentageField
                path={[...basePath, 'projectIRRTarget']}
                label="Project IRR Target"
                tooltip="Target Internal Rate of Return for the overall project"
                min={0}
                max={20}
                step={0.5}
                precision={1}
              />
            </FormCol>
          </FormRow>

          <FormRow>
            <FormCol span={12}>
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
            </FormCol>
          </FormRow>
        </FormSection>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Financing Module</Title>
      <p>Configure investment parameters and financing structure for your wind farm project.</p>

      <Tabs defaultActiveKey="investment" items={tabItems} type="card" />
    </div>
  );
};

export default FinancingModule;