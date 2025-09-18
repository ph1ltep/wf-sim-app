// frontend/src/pages/scenario/economics/Revenue.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { RiseOutlined } from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
    FormSection,
    FormRow,
    FormCol
} from 'components/contextFields';

const { Title } = Typography;

const Revenue = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Revenue</Title>
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
            <Title level={2}>Revenue</Title>
            <p>Configure energy production and electricity pricing parameters for your wind farm project.</p>

            <FormSection title="Energy Production" style={{ marginBottom: 24 }}>
                <FormRow>
                    <FormCol>
                        <p>Configure the gross annual energy production and its variability. This is the gross AEP at the Primary Percentile (do not deduct losses, downtime, and contractual availability).</p>

                        <DistributionFieldV3
                            path={['settings', 'project', 'economics', 'revenue', 'energyProduction']}
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
                            path={['settings', 'project', 'economics', 'revenue', 'electricityPrice']}
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
        </div>
    );
};

export default Revenue;