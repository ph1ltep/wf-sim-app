// frontend/src/pages/scenario/economics/Environment.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';

// Import context field components
import {
    FormSection,
    FormRow,
    FormCol,
    NumberField
} from 'components/contextFields';

const { Title } = Typography;

/**
 * Economics Environment component focused on environmental factors that have direct economic impacts.
 * Physical environmental parameters are configured in the dedicated Environment section.
 *
 * This component handles:
 * - Environmental costs and economic adjustments
 * - Weather-related operational cost impacts
 * - Environmental compliance costs
 */
const Environment = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Environmental Economics</Title>
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
            <Title level={2}>Environmental Economics</Title>
            <p>Configure economic impacts of environmental factors, including weather-related operational costs and environmental compliance expenses.</p>

            <FormSection title="Weather-Related Operational Costs" style={{ marginBottom: 24 }}>
                <p>Configure economic impacts of weather conditions on operations and maintenance costs.</p>
                <FormRow>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'economics', 'environmental', 'weatherMaintenanceMultiplier']}
                            label="Weather Maintenance Cost Multiplier"
                            tooltip="Multiplier for maintenance costs due to adverse weather conditions"
                            step={0.01}
                            precision={2}
                            min={1.0}
                            max={3.0}
                            defaultValue={1.15}
                        />
                    </FormCol>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'economics', 'environmental', 'weatherDowntimeMultiplier']}
                            label="Weather Downtime Cost Multiplier"
                            tooltip="Multiplier for lost revenue due to weather-related downtime"
                            step={0.01}
                            precision={2}
                            min={1.0}
                            max={2.0}
                            defaultValue={1.05}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>

            <FormSection title="Environmental Compliance" style={{ marginBottom: 24 }}>
                <p>Configure costs related to environmental compliance and mitigation measures.</p>
                <FormRow>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'economics', 'environmental', 'environmentalComplianceCostPerMW']}
                            label="Environmental Compliance Cost"
                            tooltip="Annual environmental compliance cost per MW of installed capacity"
                            addonAfter="$/MW/year"
                            step={100}
                            min={0}
                            max={10000}
                            defaultValue={1000}
                        />
                    </FormCol>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'economics', 'environmental', 'carbonOffsetCostPerTonne']}
                            label="Carbon Offset Cost"
                            tooltip="Cost per tonne of CO2 for carbon offset programs (if applicable)"
                            addonAfter="$/tonne CO2"
                            step={1}
                            min={0}
                            max={200}
                            defaultValue={25}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>
        </div>
    );
};

export default Environment;