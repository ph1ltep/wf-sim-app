// frontend/src/components/common/LEPSim.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Switch, Select, Divider, Radio, Slider, InputNumber } from 'antd';
import { ExperimentOutlined, ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useScenario } from '../../contexts/ScenarioContext';
import {
    DEFAULT_PARAMETERS,
    calibrateLEPTypes,
    generateAEPLossOverTime,
    generateAEPLossPerMeterAtEndLife,
    getIEAReferenceLevels,
    getSimulationInputs,
    calculateTimeToIEALevels,
    LEP_SPECIFICATIONS
} from '../../utils/lepSimUtils';
import {
    FormSection,
    NumberField,
    ResponsiveFieldRow
} from '../contextFields';

const { Text } = Typography;
const { Option } = Select;

const LEPSim = () => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();

    // Get project lifetime from context
    const contextLifespan = getValueByPath(['settings', 'general', 'projectLife'], DEFAULT_PARAMETERS.lifespan);

    // Get equipment parameters from updated schema paths
    const contextTipSpeed = getValueByPath(['settings', 'project', 'equipment', 'blades', 'nominalTipSpeed'], DEFAULT_PARAMETERS.tipSpeed);
    const contextBladeLength = getValueByPath(['settings', 'project', 'equipment', 'blades', 'bladeLength'], DEFAULT_PARAMETERS.bladeLength);
    const contextVelocityExponent = getValueByPath(['settings', 'project', 'equipment', 'blades', 'velocityExponent'], 8.0);

    // Get LEP settings from context
    const selectedLEPType = getValueByPath(['settings', 'project', 'equipment', 'blades', 'lepType'], 'No LEP');
    const lepRepairEnabled = getValueByPath(['settings', 'project', 'equipment', 'blades', 'lepRepairEnabled'], false);
    const lepRepairInterval = getValueByPath(['settings', 'project', 'equipment', 'blades', 'lepRepairInterval'], 10);
    const lepRepairEffectiveness = getValueByPath(['settings', 'project', 'equipment', 'blades', 'lepRepairEffectiveness'], 90);
    const lepLength = getValueByPath(['settings', 'project', 'equipment', 'blades', 'lepLength'], 13);

    // State for per-LEP-type configurations
    const [lepConfigs, setLepConfigs] = useState(() => {
        const configs = {};
        Object.entries(LEP_SPECIFICATIONS).forEach(([name, spec]) => {
            configs[name] = {
                lepLength: name === selectedLEPType ? lepLength : spec.defaultConfig.lepLength,
                repairEnabled: lepRepairEnabled,
                repairInterval: lepRepairInterval,
                repairEffectiveness: lepRepairEffectiveness / 100
            };
        });
        return configs;
    });

    const [selectedPercentile, setSelectedPercentile] = useState(50);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Handle LEP type selection
    const handleLEPSelection = useCallback((lepType) => {
        const currentConfig = lepConfigs[lepType];
        updateByPath({
            'settings.project.equipment.blades.lepType': lepType,
            'settings.project.equipment.blades.lepLength': currentConfig.lepLength
        });
    }, [updateByPath, lepConfigs]);

    // Handle repair settings updates
    const handleRepairSettingsUpdate = useCallback((updates) => {
        const pathUpdates = {};

        if (updates.repairEnabled !== undefined) {
            pathUpdates['settings.project.equipment.blades.lepRepairEnabled'] = updates.repairEnabled;
        }
        if (updates.repairInterval !== undefined) {
            pathUpdates['settings.project.equipment.blades.lepRepairInterval'] = updates.repairInterval;
        }
        if (updates.repairEffectiveness !== undefined) {
            pathUpdates['settings.project.equipment.blades.lepRepairEffectiveness'] = updates.repairEffectiveness;
        }

        updateByPath(pathUpdates);
    }, [updateByPath]);

    // Handle LEP length updates
    const updateLepConfig = useCallback((lepType, key, value) => {
        setLepConfigs(prev => ({
            ...prev,
            [lepType]: { ...prev[lepType], [key]: value }
        }));

        // If updating the selected LEP type's length, save to context
        if (lepType === selectedLEPType && key === 'lepLength') {
            updateByPath({
                'settings.project.equipment.blades.lepLength': value
            });
        }

        setForceUpdate(Date.now());
    }, [selectedLEPType, updateByPath]);

    // Sync context changes to local state
    useEffect(() => {
        setLepConfigs(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(name => {
                updated[name] = {
                    ...updated[name],
                    lepLength: name === selectedLEPType ? lepLength : updated[name].lepLength,
                    repairEnabled: lepRepairEnabled,
                    repairInterval: lepRepairInterval,
                    repairEffectiveness: lepRepairEffectiveness / 100
                };
            });
            return updated;
        });
        setForceUpdate(Date.now());
    }, [selectedLEPType, lepRepairEnabled, lepRepairInterval, lepRepairEffectiveness, lepLength]);

    // Get simulation inputs
    const simulationInputs = useMemo(() => {
        if (!scenarioData) return { rainfall: DEFAULT_PARAMETERS.annualRainfall, windSpeed: DEFAULT_PARAMETERS.meanWindSpeed };
        return getSimulationInputs(scenarioData, selectedPercentile);
    }, [scenarioData, selectedPercentile]);

    // Effective parameters for calculations using context values
    const effectiveParams = useMemo(() => ({
        tipSpeed: contextTipSpeed,
        bladeLength: contextBladeLength,
        velocityExponent: contextVelocityExponent,
        lifespan: contextLifespan,
        annualRainfall: simulationInputs.rainfall,
        meanWindSpeed: simulationInputs.windSpeed,
        _referenceSpeed: DEFAULT_PARAMETERS._referenceSpeed
    }), [contextTipSpeed, contextBladeLength, contextVelocityExponent, simulationInputs, contextLifespan]);

    // Available percentiles
    const availablePercentiles = useMemo(() => {
        if (!scenarioData?.simulation?.inputSim?.distributionAnalysis) return [50];

        const rainfallSim = scenarioData.simulation.inputSim.distributionAnalysis.rainfallAmount;
        const windSim = scenarioData.simulation.inputSim.distributionAnalysis.windVariability;

        const percentiles = new Set([50]);

        [rainfallSim, windSim].forEach(sim => {
            if (sim?.results) {
                sim.results.forEach(result => {
                    if (result.percentile?.value) {
                        percentiles.add(result.percentile.value);
                    }
                });
            }
        });

        return Array.from(percentiles).sort((a, b) => a - b);
    }, [scenarioData]);

    // Calculations
    const calibratedTypes = useMemo(() => {
        return calibrateLEPTypes(effectiveParams);
    }, [effectiveParams, forceUpdate]);

    const aepLossTimeData = useMemo(() => {
        return generateAEPLossOverTime(effectiveParams, calibratedTypes, lepConfigs);
    }, [effectiveParams, calibratedTypes, lepConfigs, forceUpdate]);

    const aepLossPerMeterData = useMemo(() => {
        return generateAEPLossPerMeterAtEndLife(effectiveParams, calibratedTypes, lepConfigs);
    }, [effectiveParams, calibratedTypes, lepConfigs, forceUpdate]);

    const ieaLevels = useMemo(() =>
        getIEAReferenceLevels(effectiveParams.meanWindSpeed),
        [effectiveParams.meanWindSpeed]
    );

    // Calculate LEP-adjusted IEA levels based on selected LEP type and length
    const adjustedIEALevels = useMemo(() => {
        if (!calibratedTypes[selectedLEPType] || selectedLEPType === 'No LEP') {
            return ieaLevels; // No adjustment for No LEP
        }

        // Get the selected LEP configuration
        const selectedConfig = lepConfigs[selectedLEPType];
        const selectedSpec = LEP_SPECIFICATIONS[selectedLEPType];

        if (!selectedConfig || !selectedSpec) return ieaLevels;

        // Calculate LEP impact based on actual LEP length
        const lepCoverage = selectedConfig.lepLength / effectiveParams.bladeLength; // Coverage ratio (0-1)

        // Different LEP types have different impact rates per meter
        const impactPerMeter = {
            'No LEP': 0,
            'LEP Tape': 0.01, // Lower impact per meter
            'LEP Shell': 0.015, // Medium impact per meter  
            'LEP Coating': 0.005, // Lowest impact per meter
            'Full Blade Protection': 0.02 // Highest impact per meter
        };

        const lepTypeImpact = impactPerMeter[selectedLEPType] || 0.01;
        const totalLEPImpact = selectedConfig.lepLength * lepTypeImpact; // Cumulative impact

        // Adjust IEA levels by adding the cumulative LEP impact
        return ieaLevels.map(level => ({
            ...level,
            value: level.value + totalLEPImpact,
            originalValue: level.value, // Keep track of original for display
            lepAdjustment: totalLEPImpact
        }));
    }, [ieaLevels, selectedLEPType, lepConfigs, effectiveParams.bladeLength, calibratedTypes]);

    const timeToIEALevels = useMemo(() => {
        // Use the LEP-adjusted IEA levels instead of the raw ones
        return calculateTimeToIEALevels(aepLossTimeData, adjustedIEALevels);
    }, [aepLossTimeData, adjustedIEALevels]); // Changed from ieaLevels to adjustedIEALevels

    // Chart data with LEP-adjusted IEA levels
    const timeChartData = useMemo(() => {
        const traces = Object.entries(aepLossTimeData).map(([name, data]) => {
            const coverage = data.lepLength > 0 ? (data.lepLength / effectiveParams.bladeLength * 100) : 0;
            const isSelected = name === selectedLEPType;

            return {
                x: data.years,
                y: data.aepLoss,
                type: 'scatter',
                mode: 'lines',
                name: `${name} (${coverage.toFixed(0)}% coverage)`,
                line: {
                    width: isSelected ? 3 : 2,
                    color: data.color
                }
            };
        });

        // Add LEP-adjusted IEA reference levels L2-L5
        const ieaLabels = ['L2', 'L3 (Repair)', 'L4', 'L5 (Critical)'];
        const ieaColors = ['#d9d9d9', '#faad14', '#d9d9d9', '#fa8c16']; // Orange for L5

        [1, 2, 3, 4].forEach((levelIndex, i) => {
            const level = adjustedIEALevels[levelIndex];
            traces.push({
                x: [1, effectiveParams.lifespan],
                y: [level.value, level.value],
                type: 'scatter',
                mode: 'lines',
                name: `${ieaLabels[i]} (Adj: +${(level.value - ieaLevels[levelIndex].value).toFixed(3)}%)`,
                line: {
                    dash: 'dash',
                    color: ieaColors[i],
                    width: 2
                },
                showlegend: false,
                hovertemplate: `${ieaLabels[i]}: %{y:.3f}%<br>LEP Adjustment: +${(level.value - ieaLevels[levelIndex].value).toFixed(3)}%<extra></extra>`
            });
        });

        return { traces, ieaLevels: adjustedIEALevels.slice(1, 5) };
    }, [aepLossTimeData, adjustedIEALevels, ieaLevels, effectiveParams, selectedLEPType]);

    const perMeterChartData = useMemo(() => {
        return Object.entries(aepLossPerMeterData).map(([name, data]) => {
            const isSelected = name === selectedLEPType;
            return {
                x: data.positions,
                y: data.contributions,
                type: 'scatter',
                mode: 'lines',
                name: name,
                line: {
                    width: isSelected ? 3 : 2,
                    color: LEP_SPECIFICATIONS[name].color
                }
            };
        });
    }, [aepLossPerMeterData, selectedLEPType]);

    return (
        <FormSection title="Blade Leading Edge Protection (LEP) Analysis" style={{ marginTop: 32 }}>
            {/* Analysis Setup */}
            <Card
                title={
                    <Space>
                        <InfoCircleOutlined />
                        <span>Analysis Setup</span>
                    </Space>
                }
                extra={
                    scenarioData && (
                        <Space>
                            <Text type="secondary">Data Source:</Text>
                            <Select
                                value={selectedPercentile}
                                onChange={setSelectedPercentile}
                                size="small"
                                style={{ width: 80 }}
                            >
                                {availablePercentiles.map(p => (
                                    <Option key={p} value={p}>P{p}</Option>
                                ))}
                            </Select>
                        </Space>
                    )
                }
                size="small"
                style={{ marginBottom: 16 }}
            >
                <Space split={<Divider type="vertical" />}>
                    <Text><strong>Project Life:</strong> {effectiveParams.lifespan} years</Text>
                    <Text><strong>Rainfall:</strong> {effectiveParams.annualRainfall.toFixed(0)} mm/year</Text>
                    <Text><strong>Wind Speed:</strong> {effectiveParams.meanWindSpeed.toFixed(1)} m/s</Text>
                    <Text><strong>Selected LEP:</strong> {selectedLEPType}</Text>
                </Space>
            </Card>

            {/* Turbine Configuration using ContextFields */}
            <Card title={<><ExperimentOutlined /> Turbine Configuration</>} size="small" style={{ marginBottom: 16 }}>
                <ResponsiveFieldRow layout="threeColumn">
                    <NumberField
                        path={['settings', 'project', 'equipment', 'blades', 'bladeLength']}
                        label="Blade Length (m)"
                        tooltip="Length of the turbine blade from hub center to tip"
                        min={10}
                        max={150}
                        step={0.5}
                        precision={1}
                        required
                    />
                    <NumberField
                        path={['settings', 'project', 'equipment', 'blades', 'nominalTipSpeed']}
                        label="Nominal Tip Speed (m/s)"
                        tooltip="The linear speed of the blade tip at nominal operating conditions"
                        min={50}
                        max={120}
                        step={1}
                        precision={1}
                        required
                    />
                    <NumberField
                        path={['settings', 'project', 'equipment', 'blades', 'velocityExponent']}
                        label="Velocity Exponent"
                        tooltip="Wind shear exponent used in power law wind profile calculations"
                        min={6}
                        max={10}
                        step={0.1}
                        precision={1}
                        required
                    />
                </ResponsiveFieldRow>
            </Card>

            {/* LEP Type Selection */}
            <Card title={<><ToolOutlined /> LEP Protection Selection</>} size="small" style={{ marginBottom: 16 }}>
                <Radio.Group
                    value={selectedLEPType}
                    onChange={(e) => handleLEPSelection(e.target.value)}
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        {Object.entries(LEP_SPECIFICATIONS).map(([name, spec]) => {
                            const config = lepConfigs[name];
                            const coverage = config.lepLength > 0 ? (config.lepLength / effectiveParams.bladeLength * 100) : 0;
                            const timeData = aepLossTimeData[name];
                            const ieaData = timeToIEALevels[name];
                            const isSelected = name === selectedLEPType;

                            return (
                                <div
                                    key={name}
                                    style={{
                                        border: `2px solid ${isSelected ? spec.color : '#f0f0f0'}`,
                                        borderRadius: 6,
                                        padding: 12,
                                        backgroundColor: isSelected ? `${spec.color}08` : '#fafafa'
                                    }}
                                >
                                    <Row align="middle" gutter={16}>
                                        <Col flex="none">
                                            <Radio value={name} />
                                        </Col>
                                        <Col flex="none">
                                            <div style={{
                                                width: 16,
                                                height: 16,
                                                backgroundColor: spec.color,
                                                borderRadius: 3
                                            }} />
                                        </Col>
                                        <Col flex="120px">
                                            <Text strong style={{ fontSize: '14px' }}>{name}</Text>
                                        </Col>
                                        <Col flex="auto">
                                            <Row gutter={24}>
                                                <Col>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: spec.color }}>
                                                            {timeData?.cumulativeAverage?.toFixed(3)}%
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>Avg AEP Loss</div>
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: spec.color }}>
                                                            {ieaData?.timeToL2 || 'N/A'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>Years to L2</div>
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: spec.color }}>
                                                            {ieaData?.timeToL5 || 'N/A'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>Years to L5</div>
                                                    </div>
                                                </Col>
                                                <Col>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                                            {coverage.toFixed(0)}% coverage
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#888' }}>
                                                            {calibratedTypes[name]?.P?.toFixed(0)}x protection
                                                        </div>
                                                    </div>
                                                </Col>
                                                {name !== 'No LEP' && (
                                                    <Col flex="120px">
                                                        <div style={{ fontSize: '11px', color: '#666', marginBottom: 4 }}>
                                                            LEP Length: {config.lepLength}m
                                                        </div>
                                                        <Slider
                                                            value={config.lepLength}
                                                            onChange={(value) => updateLepConfig(name, 'lepLength', value)}
                                                            min={0}
                                                            max={Math.floor(effectiveParams.bladeLength * 0.8)}
                                                            step={1}
                                                            size="small"
                                                            style={{ margin: 0 }}
                                                        />
                                                    </Col>
                                                )}
                                            </Row>
                                        </Col>
                                    </Row>
                                </div>
                            );
                        })}
                    </Space>
                </Radio.Group>
            </Card>

            {/* Global Repair Settings */}
            <Card title="Repair Settings" size="small" style={{ marginBottom: 24 }}>
                <Row gutter={16} align="middle">
                    <Col>
                        <Space>
                            <Switch
                                checked={lepRepairEnabled}
                                onChange={(checked) => handleRepairSettingsUpdate({ repairEnabled: checked })}
                            />
                            <Text>Enable LEP Repairs</Text>
                        </Space>
                    </Col>
                    {lepRepairEnabled && (
                        <>
                            <Col>
                                <Space>
                                    <Text>Repair Interval:</Text>
                                    <InputNumber
                                        value={lepRepairInterval}
                                        onChange={(value) => handleRepairSettingsUpdate({ repairInterval: value })}
                                        min={5}
                                        max={15}
                                        step={1}
                                        size="small"
                                        addonAfter="years"
                                        style={{ width: 100 }}
                                    />
                                </Space>
                            </Col>
                            <Col>
                                <Space>
                                    <Text>Repair Effectiveness:</Text>
                                    <InputNumber
                                        value={lepRepairEffectiveness}
                                        onChange={(value) => handleRepairSettingsUpdate({ repairEffectiveness: value })}
                                        min={0}
                                        max={95}
                                        step={5}
                                        size="small"
                                        addonAfter="%"
                                        style={{ width: 80 }}
                                    />
                                </Space>
                            </Col>
                        </>
                    )}
                </Row>
            </Card>

            {/* Charts with LEP-Adjusted IEA Levels */}
            <Row gutter={[24, 24]}>
                <Col xs={24} xl={12}>
                    <Card title="AEP Loss Over Project Lifetime" size="small">
                        <Plot
                            data={timeChartData.traces}
                            layout={{
                                title: 'AEP Loss Timeline with IEA Thresholds',
                                xaxis: {
                                    title: 'Project Year',
                                    showgrid: true
                                },
                                yaxis: {
                                    title: 'AEP Loss (%)',
                                    showgrid: true
                                },
                                legend: {
                                    orientation: 'h',
                                    y: -0.25,
                                    x: 0
                                },
                                annotations: timeChartData.ieaLevels.map((level, i) => ({
                                    x: effectiveParams.lifespan * 0.95, // Position on right side
                                    y: level.value,
                                    text: ['L2', 'L3', 'L4', 'L5'][i],
                                    showarrow: false,
                                    xanchor: 'left',
                                    yanchor: 'middle',
                                    font: { size: 10, color: '#666' },
                                    bgcolor: 'rgba(255,255,255,0.8)',
                                    bordercolor: '#ddd',
                                    borderwidth: 1
                                })),
                                height: 350,
                                margin: { l: 60, r: 40, t: 40, b: 100 }
                            }}
                            config={{ displayModeBar: false, responsive: true }}
                            style={{ width: '100%' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} xl={12}>
                    <Card title="AEP Loss Per Meter (End of Life)" size="small">
                        <Plot
                            data={perMeterChartData}
                            layout={{
                                title: 'Blade Position Impact Analysis',
                                xaxis: {
                                    title: 'Blade Position from Root (m)',
                                    showgrid: true,
                                    range: [0, effectiveParams.bladeLength]
                                },
                                yaxis: {
                                    title: 'AEP Loss Contribution (%/m)',
                                    showgrid: true
                                },
                                legend: {
                                    orientation: 'h',
                                    y: -0.25,
                                    x: 0
                                },
                                height: 350,
                                margin: { l: 60, r: 40, t: 40, b: 100 }
                            }}
                            config={{ displayModeBar: false, responsive: true }}
                            style={{ width: '100%' }}
                        />
                    </Card>
                </Col>
            </Row>
        </FormSection>
    );
};

export default LEPSim;