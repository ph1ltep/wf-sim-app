// frontend/src/pages/scenario/economics/Economics.jsx
import React from 'react';
import { Typography, Alert, Tabs } from 'antd';
import {
    DollarOutlined,
    RiseOutlined,
    AreaChartOutlined
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';
import CapexDrawdownCard from 'components/cards/CapexDrawdownCard';

// Import context field components
import {
    CurrencyField,
    FormSection,
    FormRow,
    FormCol,
    ResponsiveFieldRow
} from 'components/contextFields';

const { Title } = Typography;

const EconomicsModule = () => {
    // Get scenario data directly from context
    const { scenarioData, getValueByPath } = useScenario();

    // Get the currency from scenario
    const currency = scenarioData?.settings?.project?.currency?.local || 'USD';

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Economics</Title>
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
                <>
                    <FormSection title="Construction Phase Investment" style={{ marginBottom: 24 }}>
                        <ResponsiveFieldRow layout="fourColumn">
                            <CurrencyField
                                path={['settings', 'modules', 'cost', 'constructionPhase', 'costSources', 0, 'totalAmount']}
                                label="Development (DEVEX)"
                                tooltip="Development expenditure (permits, studies, etc.)"
                                min={0}
                                step={100000}
                                currencyOverride={currency}
                                affectedMetrics={['totalCapex']}
                            />
                            <CurrencyField
                                path={['settings', 'modules', 'cost', 'constructionPhase', 'costSources', 1, 'totalAmount']}
                                label="Balance of Plant"
                                tooltip="Balance of Plant costs (foundations, electrical, roads, etc.)"
                                min={0}
                                step={1000000}
                                currencyOverride={currency}
                                affectedMetrics={['totalCapex']}
                            />
                            <CurrencyField
                                path={['settings', 'modules', 'cost', 'constructionPhase', 'costSources', 2, 'totalAmount']}
                                label="Wind Turbine Generators"
                                tooltip="Total cost for Wind Turbine Generators"
                                min={0}
                                step={1000000}
                                currencyOverride={currency}
                                affectedMetrics={['totalCapex']}
                            />
                            <CurrencyField
                                path={['settings', 'modules', 'cost', 'constructionPhase', 'costSources', 3, 'totalAmount']}
                                label="Other Costs"
                                tooltip="Other construction costs (contingency, soft costs, etc.)"
                                min={0}
                                step={100000}
                                currencyOverride={currency}
                                affectedMetrics={['totalCapex']}
                            />
                        </ResponsiveFieldRow>
                    </FormSection>

                    <CapexDrawdownCard style={{ marginBottom: 24 }} />
                </>
            )
        },
        {
            key: "revenue",
            label: (
                <span>
                    <RiseOutlined /> Revenue
                </span>
            ),
            children: (
                <>
                    <FormSection title="Energy Production" style={{ marginBottom: 24 }}>
                        <FormRow>
                            <FormCol>
                                <p>Configure the gross annual energy production and its variability. This is the gross AEP at the Primary Percentile (do not deduct losses, downtime, and contractual availability).</p>

                                <DistributionFieldV3
                                    path={['settings', 'modules', 'revenue', 'energyProduction']}
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

                    <FormSection title="Electricity Price" style={{ marginBottom: 24 }}>
                        <FormRow>
                            <FormCol>
                                <DistributionFieldV3
                                    path={['settings', 'modules', 'revenue', 'electricityPrice']}
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
                                        { value: 'uniform', label: 'Uniform Distribution' },
                                        { value: 'gbm', label: 'Geometric Brownian Motion' }
                                    ]}
                                    showTitle={false}
                                />
                            </FormCol>
                        </FormRow>
                    </FormSection>
                </>
            )
        },
        {
            key: "market",
            label: (
                <span>
                    <AreaChartOutlined /> Market Factors
                </span>
            ),
            children: (
                <>
                    <FormSection title="Cost Escalation" style={{ marginBottom: 24 }}>
                        <FormRow>
                            <FormCol>
                                <DistributionFieldV3
                                    path={['settings', 'modules', 'cost', 'escalationRate']}
                                    tooltip="Annual rate of increase in O&M costs"
                                    showVisualization={true}
                                    showInfoBox={true}
                                    valueType="percent"
                                    valueName="Index (starting value)"
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

                    <FormSection title="Wind Variability" style={{ marginBottom: 24 }}>
                        <FormRow>
                            <FormCol>
                                <p>Configure the statistical distribution for wind resource variability.</p>
                                <DistributionFieldV3
                                    path={['settings', 'modules', 'revenue', 'windVariability']}
                                    tooltip="Method for simulating wind resource variability"
                                    showVisualization={true}
                                    addonAfter="m/s"
                                    step={0.1}
                                    valueType="number"
                                    valueName="Wind Speed (mean)"
                                    showInfoBox={true}
                                    options={[
                                        { value: 'fixed', label: 'Fixed Value' },
                                        { value: 'weibull', label: 'Weibull Distribution' }
                                    ]}
                                />
                            </FormCol>
                        </FormRow>
                    </FormSection>
                </>
            )
        }
    ];

    return (
        <div>
            <Title level={2}>Economics</Title>
            <p>Configure investment costs, revenue parameters, and market factors for your wind farm project.</p>

            <Tabs defaultActiveKey="investment" items={tabItems} type="card" />
        </div>
    );
};

export default EconomicsModule;