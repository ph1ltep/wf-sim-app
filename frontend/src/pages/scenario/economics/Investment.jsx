// frontend/src/pages/scenario/economics/Investment.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import CapexDrawdownCard from 'components/cards/CapexDrawdownCard';

// Import context field components
import {
    CurrencyField,
    FormSection,
    ResponsiveFieldRow
} from 'components/contextFields';

const { Title } = Typography;

const Investment = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Get the currency from scenario
    const currency = scenarioData?.settings?.project?.currency?.local || 'USD';

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Investment</Title>
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
            <Title level={2}>Investment</Title>
            <p>Configure construction phase investment costs and CAPEX drawdown schedule.</p>

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
        </div>
    );
};

export default Investment;