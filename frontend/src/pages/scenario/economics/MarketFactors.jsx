// frontend/src/pages/scenario/economics/MarketFactors.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { AreaChartOutlined } from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
    FormSection,
    FormRow,
    FormCol
} from 'components/contextFields';

const { Title } = Typography;

const MarketFactors = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Market Factors</Title>
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
            <Title level={2}>Market Factors</Title>
            <p>Configure market-driven factors including cost escalation and wind resource variability.</p>

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
        </div>
    );
};

export default MarketFactors;