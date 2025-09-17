// frontend/src/pages/scenario/environment/SiteConditions.jsx
import React from 'react';
import { Typography, Alert } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
    FormSection,
    FormRow,
    FormCol,
    NumberField,
    SelectField
} from 'components/contextFields';

const { Title } = Typography;

/**
 * SiteConditions component for managing site-specific environmental parameters
 * that affect wind turbine performance and reliability.
 *
 * Includes parameters for:
 * - Turbulence intensity (distribution)
 * - Surface roughness
 * - Kaimal scale parameter
 * - Air density
 * - Wind shear exponent
 * - Salinity level
 * - Start/stop cycles per year
 */
const SiteConditions = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Site Conditions</Title>
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
            <Title level={2}>Site Conditions</Title>
            <p>Configure site-specific environmental parameters that affect turbine performance, reliability, and operational costs.</p>

            <FormSection title="Atmospheric Conditions" style={{ marginBottom: 24 }}>
                <p>Configure atmospheric parameters that directly impact wind turbine loads and performance.</p>
                <FormRow>
                    <FormCol span={12}>
                        <DistributionFieldV3
                            path={['settings', 'project', 'environment', 'siteConditions', 'turbulenceIntensity']}
                            tooltip="Statistical distribution for turbulence intensity affecting wind turbine loads and fatigue"
                            showVisualization={true}
                            addonAfter="%"
                            step={0.1}
                            valueType="number"
                            valueName="Turbulence Intensity"
                            showInfoBox={true}
                            options={[
                                { value: 'fixed', label: 'Fixed Value' },
                                { value: 'normal', label: 'Normal Distribution' },
                                { value: 'lognormal', label: 'Log-Normal Distribution' }
                            ]}
                        />
                    </FormCol>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'siteConditions', 'airDensity']}
                            label="Air Density"
                            tooltip="Air density affecting wind energy capture and turbine performance"
                            addonAfter="kg/m³"
                            step={0.001}
                            precision={3}
                            min={0.5}
                            max={2.0}
                            defaultValue={1.225}
                        />
                    </FormCol>
                </FormRow>
                <FormRow>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'siteConditions', 'surfaceRoughness']}
                            label="Surface Roughness"
                            tooltip="Surface roughness length affecting wind shear and turbulence"
                            addonAfter="m"
                            step={0.001}
                            precision={3}
                            min={0.0001}
                            max={1.0}
                            defaultValue={0.03}
                        />
                    </FormCol>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'siteConditions', 'windShearExponent']}
                            label="Wind Shear Exponent"
                            tooltip="Power law exponent describing wind speed variation with height"
                            step={0.01}
                            precision={2}
                            min={0.0}
                            max={0.5}
                            defaultValue={0.14}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>

            <FormSection title="Wind Modeling Parameters" style={{ marginBottom: 24 }}>
                <p>Configure parameters for wind turbulence modeling and spectral analysis.</p>
                <FormRow>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'siteConditions', 'kaimalScale']}
                            label="Kaimal Scale"
                            tooltip="Kaimal spectral scale parameter for wind turbulence modeling"
                            step={0.1}
                            precision={1}
                            min={0.1}
                            max={10.0}
                            defaultValue={3.0}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>

            <FormSection title="Environmental Stressors" style={{ marginBottom: 24 }}>
                <p>Configure environmental factors that affect component degradation and maintenance requirements.</p>
                <FormRow>
                    <FormCol span={12}>
                        <SelectField
                            path={['settings', 'project', 'environment', 'siteConditions', 'salinityLevel']}
                            label="Salinity Level"
                            tooltip="Atmospheric salinity level affecting corrosion rates and maintenance requirements"
                            defaultValue="moderate"
                            options={[
                                { value: 'low', label: 'Low (Inland)' },
                                { value: 'moderate', label: 'Moderate (Coastal)' },
                                { value: 'high', label: 'High (Near Shore)' },
                                { value: 'marine', label: 'Marine (Offshore)' }
                            ]}
                        />
                    </FormCol>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'siteConditions', 'startStopCyclesPerYear']}
                            label="Start/Stop Cycles per Year"
                            tooltip="Annual number of turbine start/stop cycles affecting component fatigue"
                            step={1}
                            min={0}
                            max={1000}
                            defaultValue={200}
                        />
                    </FormCol>
                </FormRow>
            </FormSection>
        </div>
    );
};

export default SiteConditions;