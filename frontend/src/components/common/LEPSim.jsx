// frontend/src/components/analyses/LEPSim.jsx (FIXED AND IMPROVED)
import React, { useState, useMemo, useCallback } from 'react';
import { Card, Row, Col, InputNumber, Typography, Space, Switch, Slider, Select, Tag, Descriptions, Divider } from 'antd';
import { ExperimentOutlined, ToolOutlined, PercentageOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
    FormSection
} from '../contextFields';

const { Text } = Typography;
const { Option } = Select;

const LEPSim = () => {
    const { scenarioData, getValueByPath } = useScenario();

    // Get project lifetime from context
    const contextLifespan = getValueByPath(['settings', 'general', 'projectLife'], DEFAULT_PARAMETERS.lifespan);

    // State for global parameters
    const [globalParams, setGlobalParams] = useState({
        tipSpeed: DEFAULT_PARAMETERS.tipSpeed,
        bladeLength: DEFAULT_PARAMETERS.bladeLength,
        velocityExponent: DEFAULT_PARAMETERS.velocityExponent
    });

    // State for per-LEP-type configurations
    const [lepConfigs, setLepConfigs] = useState(() => {
        const configs = {};
        Object.entries(LEP_SPECIFICATIONS).forEach(([name, spec]) => {
            configs[name] = {
                lepLength: spec.defaultConfig.lepLength,
                repairEnabled: spec.defaultConfig.repairEffectiveness > 0,
                repairInterval: spec.defaultConfig.repairInterval,
                repairEffectiveness: spec.defaultConfig.repairEffectiveness
            };
        });
        return configs;
    });

    const [selectedPercentile, setSelectedPercentile] = useState(50);
    const [forceUpdate, setForceUpdate] = useState(0);

    // Get simulation inputs
    const simulationInputs = useMemo(() => {
        if (!scenarioData) return { rainfall: DEFAULT_PARAMETERS.annualRainfall, windSpeed: DEFAULT_PARAMETERS.meanWindSpeed };
        return getSimulationInputs(scenarioData, selectedPercentile);
    }, [scenarioData, selectedPercentile]);

    // Effective parameters for calculations
    const effectiveParams = useMemo(() => ({
        ...globalParams,
        lifespan: contextLifespan,
        annualRainfall: simulationInputs.rainfall,
        meanWindSpeed: simulationInputs.windSpeed,
        _referenceSpeed: DEFAULT_PARAMETERS._referenceSpeed
    }), [globalParams, simulationInputs, contextLifespan]);

    // Update handlers
    const updateGlobalParam = useCallback((key, value) => {
        setGlobalParams(prev => ({ ...prev, [key]: value }));
        if (['tipSpeed', 'bladeLength', 'velocityExponent'].includes(key)) {
            setForceUpdate(Date.now());
        }
    }, []);

    const updateLepConfig = useCallback((lepType, key, value) => {
        setLepConfigs(prev => ({
            ...prev,
            [lepType]: { ...prev[lepType], [key]: value }
        }));
        setForceUpdate(Date.now());
    }, []);

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
        console.log('Generating per-meter data with lepConfigs:', lepConfigs);
        return generateAEPLossPerMeterAtEndLife(effectiveParams, calibratedTypes, lepConfigs);
    }, [effectiveParams, calibratedTypes, lepConfigs, forceUpdate]);

    const ieaLevels = useMemo(() =>
        getIEAReferenceLevels(effectiveParams.meanWindSpeed),
        [effectiveParams.meanWindSpeed]
    );

    const timeToIEALevels = useMemo(() =>
        calculateTimeToIEALevels(aepLossTimeData, ieaLevels),
        [aepLossTimeData, ieaLevels]
    );

    // Chart data with IEA levels
    const timeChartData = useMemo(() => {
        const traces = Object.entries(aepLossTimeData).map(([name, data]) => {
            const coverage = data.lepLength > 0 ? (data.lepLength / effectiveParams.bladeLength * 100) : 0;

            return {
                x: data.years,
                y: data.aepLoss,
                type: 'scatter',
                mode: 'lines',
                name: `${name} (${coverage.toFixed(0)}% coverage)`,
                line: { width: 3, color: data.color }
            };
        });

        // Add IEA reference levels L2-L5
        const ieaLabels = ['L2', 'L3 (Repair)', 'L4', 'L5 (Critical)'];
        const ieaColors = ['#d9d9d9', '#faad14', '#d9d9d9', '#ff4d4f'];

        [1, 2, 3, 4].forEach((levelIndex, i) => {
            const level = ieaLevels[levelIndex];
            traces.push({
                x: [1, effectiveParams.lifespan],
                y: [level.value, level.value],
                type: 'scatter',
                mode: 'lines',
                name: ieaLabels[i],
                line: {
                    dash: 'dash',
                    color: ieaColors[i],
                    width: 1
                },
                showlegend: false,
                hoverinfo: 'skip'
            });
        });

        return { traces, ieaLevels: ieaLevels.slice(1, 5) };
    }, [aepLossTimeData, ieaLevels, effectiveParams]);

    const perMeterChartData = useMemo(() => {
        console.log('Per-meter chart data:', Object.entries(aepLossPerMeterData).map(([name, data]) => ({
            name,
            lepLength: data.lepLength,
            maxContribution: data.maxContribution,
            pointsCount: data.contributions?.length
        })));

        return Object.entries(aepLossPerMeterData).map(([name, data]) => ({
            x: data.positions,
            y: data.contributions,
            type: 'scatter',
            mode: 'lines',
            name: name,
            line: { width: 3, color: LEP_SPECIFICATIONS[name].color }
        }));
    }, [aepLossPerMeterData]);

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
                </Space>
            </Card>

            {/* Global Parameters */}
            <Card title={<><ExperimentOutlined /> Turbine Configuration</>} size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 8]}>
                    <Col xs={24} sm={8}>
                        <Text>Blade Length (m)</Text>
                        <InputNumber
                            value={globalParams.bladeLength}
                            onChange={(value) => updateGlobalParam('bladeLength', value)}
                            min={30}
                            max={200}
                            step={5}
                            size="small"
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Text>Tip Speed (m/s)</Text>
                        <InputNumber
                            value={globalParams.tipSpeed}
                            onChange={(value) => updateGlobalParam('tipSpeed', value)}
                            min={60}
                            max={120}
                            step={1}
                            size="small"
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Text>Velocity Exponent</Text>
                        <InputNumber
                            value={globalParams.velocityExponent}
                            onChange={(value) => updateGlobalParam('velocityExponent', value)}
                            min={5}
                            max={10}
                            step={0.1}
                            precision={1}
                            size="small"
                            style={{ width: '100%' }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* LEP Type Configurations */}
            <Card title={<><ToolOutlined /> LEP Protection Configurations</>} size="small" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    {Object.entries(LEP_SPECIFICATIONS).map(([name, spec]) => {
                        const config = lepConfigs[name];
                        const coverage = config.lepLength > 0 ? (config.lepLength / globalParams.bladeLength * 100) : 0;
                        const timeData = aepLossTimeData[name];
                        const ieaData = timeToIEALevels[name];
                        const isNoLEP = name === 'No LEP';

                        return (
                            <Col xs={24} lg={8} key={name}>
                                <Card
                                    size="small"
                                    style={{
                                        height: '100%',
                                        borderColor: spec.color,
                                        borderWidth: 2
                                    }}
                                    title={
                                        <Space>
                                            <div style={{
                                                width: 12,
                                                height: 12,
                                                backgroundColor: spec.color,
                                                borderRadius: 2
                                            }} />
                                            <span>{name}</span>
                                        </Space>
                                    }
                                >
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        {/* LEP Length - disabled for No LEP */}
                                        {!isNoLEP && (
                                            <div>
                                                <Text style={{ fontSize: '12px' }}>LEP Length: {config.lepLength}m</Text>
                                                <Slider
                                                    value={config.lepLength}
                                                    onChange={(value) => updateLepConfig(name, 'lepLength', value)}
                                                    min={0}
                                                    max={Math.floor(globalParams.bladeLength * 0.8)}
                                                    step={1}
                                                    size="small"
                                                    style={{ margin: '4px 0' }}
                                                />
                                            </div>
                                        )}

                                        {/* Repair Configuration */}
                                        <div>
                                            <Space style={{ marginBottom: 4 }}>
                                                <Switch
                                                    checked={config.repairEnabled}
                                                    onChange={(checked) => updateLepConfig(name, 'repairEnabled', checked)}
                                                    size="small"
                                                />
                                                <Text style={{ fontSize: '12px' }}>Repairs</Text>
                                            </Space>

                                            {config.repairEnabled && (
                                                <Row gutter={8}>
                                                    <Col span={12}>
                                                        <Text style={{ fontSize: '11px' }}>Interval (yr)</Text>
                                                        <InputNumber
                                                            value={config.repairInterval}
                                                            onChange={(value) => updateLepConfig(name, 'repairInterval', value)}
                                                            min={5}
                                                            max={15}
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Col>
                                                    <Col span={12}>
                                                        <Text style={{ fontSize: '11px' }}>Effectiveness</Text>
                                                        <Slider
                                                            value={config.repairEffectiveness * 100}
                                                            onChange={(value) => updateLepConfig(name, 'repairEffectiveness', value / 100)}
                                                            min={0}
                                                            max={95}
                                                            step={5}
                                                            size="small"
                                                            tooltip={{ formatter: value => `${value}%` }}
                                                        />
                                                    </Col>
                                                </Row>
                                            )}
                                        </div>

                                        {/* Performance Summary */}
                                        <div style={{
                                            background: '#fafafa',
                                            padding: 8,
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}>
                                            <Row gutter={8}>
                                                <Col span={8}>
                                                    <div><strong>{coverage.toFixed(0)}%</strong></div>
                                                    <div style={{ color: '#666' }}>Coverage</div>
                                                </Col>
                                                <Col span={8}>
                                                    <div><strong>{timeData?.cumulativeAverage?.toFixed(3)}%</strong></div>
                                                    <div style={{ color: '#666' }}>Avg Loss</div>
                                                </Col>
                                                <Col span={8}>
                                                    <div><strong>{calibratedTypes[name]?.P?.toFixed(0)}x</strong></div>
                                                    <div style={{ color: '#666' }}>Protection</div>
                                                </Col>
                                            </Row>
                                            <Divider style={{ margin: '6px 0' }} />
                                            <Row gutter={8}>
                                                <Col span={12}>
                                                    <div><strong>{ieaData?.timeToL2}</strong></div>
                                                    <div style={{ color: '#666' }}>Time to L2</div>
                                                </Col>
                                                <Col span={12}>
                                                    <div><strong>{ieaData?.timeToL5}</strong></div>
                                                    <div style={{ color: '#666' }}>Time to L5</div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Space>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </Card>

            {/* Charts with IEA Levels */}
            <Row gutter={[24, 24]}>
                <Col xs={24} xl={12}>
                    <Card title="AEP Loss Over Project Lifetime" size="small">
                        <Plot
                            data={timeChartData.traces}
                            layout={{
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
                                    x: 1,
                                    y: level.value,
                                    text: ['L2', 'L3', 'L4', 'L5'][i],
                                    showarrow: false,
                                    xanchor: 'left',
                                    yanchor: 'bottom',
                                    font: { size: 10, color: '#666' },
                                    bgcolor: 'white',
                                    bordercolor: '#ddd',
                                    borderwidth: 1
                                })),
                                height: 350,
                                margin: { l: 50, r: 20, t: 20, b: 100 }
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
                                xaxis: {
                                    title: 'Blade Position (m)',
                                    showgrid: true,
                                    range: [0, effectiveParams.bladeLength]
                                },
                                yaxis: {
                                    title: 'AEP Loss (%/m)',
                                    showgrid: true
                                },
                                legend: {
                                    orientation: 'h',
                                    y: -0.25,
                                    x: 0
                                },
                                height: 350,
                                margin: { l: 50, r: 20, t: 20, b: 100 }
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