// frontend/src/pages/scenario/operations/Performance.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import {
    FieldTimeOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
    FormSection,
    FormRow,
    FormCol
} from 'components/contextFields';

const { Title } = Typography;

const Performance = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Define base path for revenue module
    const basePath = ['settings', 'modules', 'revenue'];

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Performance</Title>
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
            <Title level={2}>Performance</Title>
            <p>Configure performance parameters and downtime characteristics for your wind farm project.</p>

            <FormSection title="Downtime Configuration" style={{ marginBottom: 24 }}>
                <FormRow>
                    <FormCol>
                        <p>Configure the statistical distribution for downtime duration per failure event.</p>
                        <DistributionFieldV3
                            path={[...basePath, 'downtimePerEvent']}
                            tooltip="Statistical distribution for downtime duration"
                            addonAfter="days/event"
                            valueType="number"
                            valueName="Downtime Duration (median)"
                            showVisualization={true}
                            showInfoBox={true}
                            options={[
                                { value: 'fixed', label: 'Fixed Value' },
                                { value: 'weibull', label: 'Weibull Distribution' },
                                { value: 'lognormal', label: 'Lognormal Distribution' },
                                { value: 'gamma', label: 'Gamma Distribution' }
                            ]}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>

            <FormSection title="Performance Degradation" style={{ marginBottom: 24 }}>
                <FormRow>
                    <FormCol>
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <ThunderboltOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
                            <Title level={4} style={{ color: '#999', margin: '0 0 8px 0' }}>
                                Performance Degradation - Coming Soon
                            </Title>
                            <p style={{ color: '#999', margin: 0 }}>
                                Performance degradation modeling capabilities will be available here, including:
                            </p>
                            <ul style={{ color: '#999', textAlign: 'left', maxWidth: '400px', margin: '16px auto' }}>
                                <li>Annual performance degradation rates</li>
                                <li>Component-specific degradation curves</li>
                                <li>Environmental impact factors</li>
                                <li>Maintenance impact on performance</li>
                            </ul>
                        </div>
                    </FormCol>
                </FormRow>
            </FormSection>
        </div>
    );
};

export default Performance;