// frontend/src/pages/scenario/economics/Environment.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
    FormSection,
    FormRow,
    FormCol
} from 'components/contextFields';

const { Title } = Typography;

const Environment = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Environment</Title>
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
            <Title level={2}>Environment</Title>
            <p>Configure environmental factors affecting wind farm operations including wind resources and weather conditions.</p>

            <FormSection title="Wind Variability" style={{ marginBottom: 24 }}>
                <FormRow>
                    <FormCol>
                        <p>Configure the statistical distribution for wind resource variability.</p>
                        <DistributionFieldV3
                            path={['settings', 'project', 'environment', 'windVariability']}
                            tooltip="Method for simulating wind resource variability"
                            showVisualization={true}
                            addonAfter="m/s"
                            step={0.1}
                            valueType="number"
                            valueName="Wind Speed (mean)"
                            showInfoBox={true}
                            options={[
                                { value: 'fixed', label: 'Fixed Value' },
                                { value: 'weibull', label: 'Weibull Distribution' },
                                { value: 'normal', label: 'Normal Distribution' }
                            ]}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>

            <FormSection title="Rainfall Amount" style={{ marginBottom: 24 }}>
                <FormRow>
                    <FormCol>
                        <p>Configure the statistical distribution for rainfall amounts affecting wind farm operations.</p>
                        <DistributionFieldV3
                            path={['settings', 'project', 'environment', 'rainfallAmount']}
                            tooltip="Annual rainfall amount distribution for modeling weather-related impacts on operations"
                            showVisualization={true}
                            addonAfter="mm"
                            step={1}
                            valueType="number"
                            valueName="Mean Rainfall"
                            showInfoBox={true}
                            options={[
                                { value: 'fixed', label: 'Fixed Value' },
                                { value: 'normal', label: 'Normal Distribution' },
                                { value: 'gamma', label: 'Gamma Distribution' }
                            ]}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>
        </div>
    );
};

export default Environment;