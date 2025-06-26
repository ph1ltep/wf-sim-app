// frontend/src/components/cards/DriverExplorerCard.jsx
// Update with all necessary imports and structural changes

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Alert, Empty, Select, Row, Col, Space, Typography } from 'antd';
import { BarChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useCashflow } from '../../contexts/CashflowContext';
import { useScenario } from '../../contexts/ScenarioContext';
import SensitivityRangeSelector from '../results/cashflow/components/SensitivityRangeSelector';
import InsightsPanel from './components/InsightsPanel';
import TargetMetricRangeVisualizer from './components/TargetMetricRangeVisualizer'; // ADD THIS IMPORT
import { SENSITIVITY_SOURCE_REGISTRY, discoverAllSensitivityVariables } from '../../contexts/SensitivityRegistry';
import { SUPPORTED_METRICS, createMetricSelectorOptions } from '../../utils/finance/sensitivityMetrics';
import { calculateSensitivityAnalysis } from '../../utils/finance/sensitivityAnalysis';
import { prepareTornadoChartData, createTornadoClickHandler } from '../../utils/charts/sensitivity';
import { createDriverAnalysisFooter } from './configs/DriverExplorerConfig';

const { Text } = Typography;

const DriverExplorerCard = ({
    title = "Value Driver Analysis",
    icon = <BarChartOutlined />,
    cardProps = {},
    defaultMetric = 'npv',
    showInsights = true
}) => {
    const { cashflowData, sensitivityData, loading, transformError, sourceRegistry } = useCashflow();
    const { getValueByPath, scenarioData } = useScenario();

    // State management
    const [targetMetric, setTargetMetric] = useState(defaultMetric);
    const [highlightedDriver, setHighlightedDriver] = useState(null);
    const [lowerPercentile, setLowerPercentile] = useState(25);
    const [upperPercentile, setUpperPercentile] = useState(75);

    // Get base percentile from cashflow context
    const basePercentile = useMemo(() => {
        return cashflowData?.metadata?.primaryPercentile || 50;
    }, [cashflowData?.metadata?.primaryPercentile]);

    // Get metric configuration
    const metricConfig = useMemo(() => {
        return SUPPORTED_METRICS[targetMetric];
    }, [targetMetric]);

    // Get distribution analysis from scenario data
    const distributionAnalysis = useMemo(() => {
        return getValueByPath(['simulation', 'inputSim', 'distributionAnalysis']);
    }, [getValueByPath]);

    // Discover all variables for sensitivity analysis
    const variables = useMemo(() => {
        if (!scenarioData || !sourceRegistry) return [];

        try {
            return discoverAllSensitivityVariables(sourceRegistry, SENSITIVITY_SOURCE_REGISTRY);
        } catch (error) {
            console.error('Error discovering variables:', error);
            return [];
        }
    }, [scenarioData, sourceRegistry]);

    // Calculate sensitivity analysis using the real function
    const sensitivityResults = useMemo(() => {
        if (!variables.length || !distributionAnalysis || !metricConfig) {
            return [];
        }

        try {
            // Create simulation config object with percentiles
            const simulationConfig = {
                percentiles: [
                    { value: lowerPercentile },
                    { value: basePercentile },
                    { value: upperPercentile }
                ],
                primaryPercentile: basePercentile
            };

            return calculateSensitivityAnalysis({
                cashflowRegistry: sourceRegistry,
                sensitivityRegistry: SENSITIVITY_SOURCE_REGISTRY,
                targetMetric,
                simulationConfig,
                distributionAnalysis,
                getValueByPath
            });
        } catch (error) {
            console.error('Error calculating sensitivity:', error);
            return [];
        }
    }, [variables, distributionAnalysis, targetMetric, lowerPercentile, upperPercentile, basePercentile, metricConfig, sourceRegistry, getValueByPath]);

    // Handle highlighted driver variable ID
    const highlightedVariableId = useMemo(() => {
        return highlightedDriver && sensitivityResults.length > 0 ?
            sensitivityResults.find(r => r.variable === highlightedDriver)?.variableId : null;
    }, [highlightedDriver, sensitivityResults]);

    // Handle percentile range changes
    const handlePercentileRangeChange = useCallback((lower, upper) => {
        setLowerPercentile(lower);
        setUpperPercentile(upper);
    }, []);

    // Handle metric change
    const handleMetricChange = useCallback((newMetric) => {
        setTargetMetric(newMetric);
        setHighlightedDriver(null); // Reset highlighting when metric changes
    }, []);

    // ADD: Handle driver selection from insights panel
    const handleDriverSelect = useCallback((variableId) => {
        const newHighlighted = variableId === highlightedDriver ? null : variableId;
        setHighlightedDriver(newHighlighted);
    }, [highlightedDriver]);

    // Create metric selector options
    const metricOptions = useMemo(() => {
        return createMetricSelectorOptions();
    }, []);

    // Chart data preparation
    const chartData = useMemo(() => {
        if (!sensitivityResults.length || !metricConfig) return null;

        return prepareTornadoChartData({
            sensitivityResults,
            targetMetric,
            highlightedDriver: highlightedVariableId,
            metricConfig,
            options: {
                showVariableCount: true
            }
        });
    }, [sensitivityResults, targetMetric, highlightedVariableId, metricConfig]);

    // Chart click handler
    const handleChartClick = useMemo(() => {
        return createTornadoClickHandler(setHighlightedDriver);
    }, []);

    // Error handling - follow established patterns
    if (transformError) {
        return (
            <Card
                title={
                    <Space>
                        {icon}
                        {title}
                    </Space>
                }
                {...cardProps}
            >
                <Alert
                    message="Data Transform Error"
                    description={transformError}
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    if (!cashflowData) {
        return (
            <Card
                title={
                    <Space>
                        {icon}
                        {title}
                    </Space>
                }
                {...cardProps}
            >
                <Empty description="No cashflow data available" />
            </Card>
        );
    }

    if (!distributionAnalysis) {
        return (
            <Card
                title={
                    <Space>
                        {icon}
                        {title}
                    </Space>
                }
                {...cardProps}
            >
                <Alert
                    message="No Distribution Data"
                    description="No simulation distribution analysis found. Please run distributions first."
                    type="warning"
                    showIcon
                />
            </Card>
        );
    }

    if (sensitivityResults.length === 0) {
        return (
            <Card
                title={
                    <Space>
                        {icon}
                        {title}
                    </Space>
                }
                {...cardProps}
            >
                <Alert
                    message="No Variables Available"
                    description="No variables with distribution data found for sensitivity analysis."
                    type="warning"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <Card
            title={
                <Space>
                    {icon}
                    {title}
                </Space>
            }
            {...cardProps}
        >
            {/* Controls Row - Remove visualizer from here */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Target Metric</Text>
                        <Select
                            value={targetMetric}
                            onChange={handleMetricChange}
                            style={{ width: '100%' }}
                            options={metricOptions}
                        />
                    </Space>
                </Col>
                <Col span={18}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Sensitivity Range</Text>
                        <SensitivityRangeSelector
                            getValueByPath={getValueByPath}
                            lowerPercentile={lowerPercentile}
                            upperPercentile={upperPercentile}
                            primaryPercentile={basePercentile}
                            onRangeChange={handlePercentileRangeChange}
                            disabled={loading}
                        />
                        {/* Visualizer removed from here */}
                    </Space>
                </Col>
            </Row>
            {/* NEW: Visualizer above chart */}
            <TargetMetricRangeVisualizer
                sensitivityResults={sensitivityResults}
                metricConfig={metricConfig}
                selectedRange={{ lower: lowerPercentile, upper: upperPercentile }}
                getValueByPath={getValueByPath}
            />

            {/* Main Content - Chart only */}
            <Row>
                <Col span={24}>
                    <div style={{ height: 400 }}>
                        {chartData ? (
                            <Plot
                                data={chartData.data}
                                layout={chartData.layout}
                                config={chartData.config}
                                onClick={handleChartClick}
                                style={{ width: '100%', height: '100%' }}
                            />
                        ) : (
                            <Empty description="No chart data available" />
                        )}
                    </div>
                </Col>
            </Row>
            {/* Insights Panel - Full width at bottom */}
            {showInsights && (
                <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <InsightsPanel
                            sensitivityResults={sensitivityResults}
                            metricConfig={metricConfig}
                            targetMetric={targetMetric}
                            highlightedDriver={highlightedDriver}
                            confidenceLevel={upperPercentile - lowerPercentile}
                            onDriverSelect={handleDriverSelect}
                            layout="horizontal" // Add this prop
                        />
                    </Col>
                </Row>
            )}

            {/* Footer with methodology - REMOVE UNNECESSARY INFO */}
            <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                <Row gutter={[16, 8]}>
                    <Col span={12}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <InfoCircleOutlined style={{ marginRight: 4 }} />
                            {sensitivityResults.length} variables analyzed
                        </Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Target: {metricConfig?.label}
                        </Text>
                    </Col>
                </Row>
            </div>
        </Card>
    );
};

export default DriverExplorerCard;