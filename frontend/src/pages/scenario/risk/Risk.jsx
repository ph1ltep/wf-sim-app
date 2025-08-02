// frontend/src/pages/scenario/risk/Risk.jsx
import React from 'react';
import { Typography, Alert, Card, Tabs, Switch } from 'antd';
import { SafetyOutlined, InsuranceOutlined, BankOutlined } from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  CurrencyField,
  SwitchField,
  PercentageField,
  FormDivider
} from 'components/contextFields';

const { Title } = Typography;
const { TabPane } = Tabs;

const RiskModule = () => {
  // Define base path for risk module
  const basePath = ['settings', 'modules', 'risk'];

  // Get scenario data and context functions
  const { scenarioData, getValueByPath } = useScenario();

  // Get insurance enabled state for conditional rendering
  const insuranceEnabled = getValueByPath([...basePath, 'insuranceEnabled'], false);

  // Helper function to check if we have valid scenario
  const hasValidScenario = () => scenarioData && scenarioData.settings?.modules?.risk;

  if (!hasValidScenario()) {
    return (
      <div>
        <Title level={2}>Risk Mitigation</Title>
        <Alert
          message="No Active Scenario"
          description="Please create or load a scenario first."
          type="warning"
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Risk Mitigation</Title>
      <p>Configure risk mitigation strategies including insurance and reserve funds.</p>

      <Tabs defaultActiveKey="insurance" type="card">
        <TabPane
          tab={
            <span>
              <InsuranceOutlined /> Insurance
            </span>
          }
          key="insurance"
        >
          <FormSection title="Insurance Coverage" style={{ marginBottom: 24 }}>
            <FormRow>
              <FormCol>
                <SwitchField
                  path={[...basePath, 'insuranceEnabled']}
                  label="Enable Insurance"
                  tooltip="Enable or disable insurance coverage for the project"
                />
              </FormCol>
            </FormRow>

            {insuranceEnabled && (
              <>
                <FormDivider orientation="left">Insurance Parameters</FormDivider>

                <FormRow>
                  <FormCol>
                    <CurrencyField
                      path={[...basePath, 'insurancePremium']}
                      label="Insurance Premium"
                      tooltip="Annual insurance premium cost"
                      min={0}
                      step={10000}
                    />
                  </FormCol>
                  <FormCol>
                    <CurrencyField
                      path={[...basePath, 'insuranceDeductible']}
                      label="Insurance Deductible"
                      tooltip="Insurance deductible per event"
                      min={0}
                      step={1000}
                    />
                  </FormCol>
                </FormRow>

                <FormRow>
                  <FormCol>
                    <PercentageField
                      path={[...basePath, 'coverageLimit']}
                      label="Coverage Limit (%)"
                      tooltip="Maximum percentage of costs covered by insurance"
                      min={0}
                      max={100}
                      step={5}
                    />
                  </FormCol>
                  <FormCol>
                    <CurrencyField
                      path={[...basePath, 'annualCoverageCap']}
                      label="Annual Coverage Cap"
                      tooltip="Maximum insurance payout per year"
                      min={0}
                      step={100000}
                    />
                  </FormCol>
                </FormRow>
              </>
            )}
          </FormSection>
        </TabPane>

        <TabPane
          tab={
            <span>
              <BankOutlined /> Reserve Funds
            </span>
          }
          key="reserves"
        >
          <FormSection title="Reserve Funds" style={{ marginBottom: 24 }}>
            <FormRow>
              <FormCol>
                <CurrencyField
                  path={[...basePath, 'reserveFunds']}
                  label="Initial Reserve Funds"
                  tooltip="Initial allocation for reserve funds"
                  min={0}
                  step={100000}
                />
              </FormCol>
              <FormCol>
                <PercentageField
                  path={[...basePath, 'annualContribution']}
                  label="Annual Contribution (%)"
                  tooltip="Percentage of revenue allocated to reserve funds each year"
                  min={0}
                  max={20}
                  step={0.5}
                  precision={2}
                />
              </FormCol>
            </FormRow>

            <FormRow>
              <FormCol>
                <CurrencyField
                  path={[...basePath, 'targetReserveLevel']}
                  label="Target Reserve Level"
                  tooltip="Target level for reserve funds"
                  min={0}
                  step={100000}
                />
              </FormCol>
              <FormCol>
                <NumberField
                  path={[...basePath, 'minimumReserveCoverage']}
                  label="Minimum Coverage (months)"
                  tooltip="Minimum number of months of O&M costs covered by reserves"
                  min={0}
                  step={1}
                  addonAfter="months"
                />
              </FormCol>
            </FormRow>
          </FormSection>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SafetyOutlined /> Other Mitigations
            </span>
          }
          key="other"
        >
          <FormSection title="Other Risk Mitigations" style={{ marginBottom: 24 }}>
            <FormRow>
              <FormCol>
                <SwitchField
                  path={[...basePath, 'performanceGuarantees']}
                  label="Performance Guarantees"
                  tooltip="Enable or disable performance guarantees"
                />
              </FormCol>
              <FormCol>
                <SwitchField
                  path={[...basePath, 'contingencyBudget']}
                  label="Contingency Budget"
                  tooltip="Enable or disable contingency budget"
                />
              </FormCol>
            </FormRow>

            <FormRow>
              <FormCol>
                <PercentageField
                  path={[...basePath, 'contingencyPercentage']}
                  label="Contingency Percentage"
                  tooltip="Percentage of total costs allocated as contingency"
                  min={0}
                  max={30}
                  step={0.5}
                  precision={1}
                />
              </FormCol>
            </FormRow>
          </FormSection>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RiskModule;