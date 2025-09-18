// frontend/src/pages/scenario/environment/Weather.jsx
import React from 'react';
import { Typography, Alert, Card } from 'antd';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';

// Import context field components
import {
    FormRow,
    FormCol,
    NumberField
} from 'components/contextFields';

const { Title } = Typography;

/**
 * Weather component for managing weather-related parameters that affect
 * wind farm operations and performance.
 *
 * Includes parameters for:
 * - Wind variability (distribution)
 * - Temperature range
 * - Daily temperature swing
 * - Relative humidity
 * - Rainfall amount (distribution)
 */
const Weather = () => {
    // Get scenario data directly from context
    const { scenarioData } = useScenario();

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Weather Conditions</Title>
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
            <Title level={2}>Weather Conditions</Title>
            <p>Configure weather-related parameters affecting wind farm operations, maintenance requirements, and performance variability.</p>

            <Card title="Wind Resource Variability" style={{ marginBottom: 24 }}>
                <p>Configure the statistical modeling of wind resource variability for Monte Carlo simulations.</p>
                <FormRow>
                    <FormCol span={24}>
                        <DistributionFieldV3
                            path={['settings', 'project', 'environment', 'weather', 'windVariability']}
                            tooltip="Statistical distribution for modeling wind resource variability affecting energy production"
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
            </Card>

            <Card title="Temperature Conditions" style={{ marginBottom: 24 }}>
                <p>Configure temperature parameters that affect component thermal stress and performance.</p>
                <FormRow>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'weather', 'temperatureRange']}
                            label="Annual Temperature Range"
                            tooltip="Annual temperature variation range affecting component thermal stress and performance"
                            addonAfter="°C"
                            step={1}
                            min={0}
                            max={150}
                            defaultValue={60}
                        />
                    </FormCol>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'weather', 'dailyTempSwing']}
                            label="Daily Temperature Swing"
                            tooltip="Daily temperature variation affecting thermal cycling stress on components"
                            addonAfter="°C"
                            step={1}
                            min={0}
                            max={50}
                            defaultValue={15}
                        />
                    </FormCol>
                </FormRow>
            </Card>

            <Card title="Atmospheric Conditions" style={{ marginBottom: 24 }}>
                <p>Configure atmospheric parameters affecting component degradation and operational efficiency.</p>
                <FormRow>
                    <FormCol span={12}>
                        <NumberField
                            path={['settings', 'project', 'environment', 'weather', 'relativeHumidity']}
                            label="Relative Humidity"
                            tooltip="Average relative humidity affecting corrosion rates and electrical component degradation"
                            addonAfter="%"
                            step={0.01}
                            precision={2}
                            min={0}
                            max={1}
                            defaultValue={0.65}
                            formatter={value => value != null ? `${(value * 100).toFixed(0)}` : ''}
                            parser={value => {
                                const num = parseFloat(value ? value.replace('%', '') : '');
                                return isNaN(num) ? null : num / 100;
                            }}
                        />
                    </FormCol>
                </FormRow>
            </Card>

            <Card title="Precipitation" style={{ marginBottom: 24 }}>
                <p>Configure precipitation parameters for modeling weather-related impacts on operations and maintenance.</p>
                <FormRow>
                    <FormCol span={24}>
                        <DistributionFieldV3
                            path={['settings', 'project', 'environment', 'weather', 'rainfallAmount']}
                            tooltip="Annual rainfall amount distribution for modeling weather-related impacts on operations and maintenance"
                            showVisualization={true}
                            addonAfter="mm"
                            step={1}
                            valueType="number"
                            valueName="Annual Rainfall"
                            showInfoBox={true}
                            options={[
                                { value: 'fixed', label: 'Fixed Value' },
                                { value: 'normal', label: 'Normal Distribution' },
                                { value: 'gamma', label: 'Gamma Distribution' }
                            ]}
                        />
                    </FormCol>
                </FormRow>
            </Card>
        </div>
    );
};

export default Weather;