// frontend/src/components/cards/DriverExplorerCard.jsx
// Created from scratch using actual existing functions

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Alert, Empty, Select, Row, Col, Space, Typography, Spin, Divider } from 'antd';
import { BarChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useCashflow } from '../../contexts/CashflowContext';
import { useScenario } from '../../contexts/ScenarioContext';
import SensitivityRangeSelector from '../results/cashflow/components/SensitivityRangeSelector';
import InsightsPanel from './components/InsightsPanel';
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
    const { cashflowData, loading, transformError, sourceRegistry } = useCashflow();
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

    // Prepare tornado chart data
    const tornadoChartData = useMemo(() => {
        if (!sensitivityResults.length || !metricConfig) {
            return null;
        }

        return prepareTornadoChartData({
            sensitivityResults,
            targetMetric,
            highlightedDriver,
            metricConfig,
            options: {
                showVariableCount: true,
                includeConfidenceInTitle: true
            }
        });
    }, [sensitivityResults, targetMetric, highlightedDriver, metricConfig]);

    // Handle variable selection
    const handleVariableSelect = useCallback((variableId) => {
        setHighlightedDriver(variableId === highlightedDriver ? null : variableId);
    }, [highlightedDriver]);

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

    // Create metric selector options
    const metricOptions = useMemo(() => {
        return createMetricSelectorOptions();
    }, []);

    // Error handling - follow established patterns
    if (transformError) {
        return (
            <Card title={title} extra={icon} {...cardProps}>
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
            <Card title={title} extra={icon} {...cardProps}>
                <Empty description="No cashflow data available" />
            </Card>
        );
    }

    if (!distributionAnalysis) {
        return (
            <Card title={title} extra={icon} {...cardProps}>
                <Alert
                    message="No Distribution Data"
                    description="No simulation distribution analysis found. Please run distributions first."
                    type="warning"
                    showIcon
                />
            </Card>
        );
    }

    if (variables.length === 0) {
        return (
            <Card title={title} extra={icon} {...cardProps}>
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
            title={title}
            extra={icon}
            {...cardProps}
            style={{ height: '100%', ...cardProps.style }}
        >
            {/* Controls Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Target Metric</Text>
                        <Select
                            value={targetMetric}
                            onChange={handleMetricChange}
                            style={{ width: '100%' }}
                            options={metricOptions}
                            disabled={loading}
                        />
                    </Space>
                </Col>
                <Col span={16}>
                    <SensitivityRangeSelector
                        getValueByPath={getValueByPath}
                        lowerPercentile={lowerPercentile}
                        upperPercentile={upperPercentile}
                        primaryPercentile={basePercentile}
                        onRangeChange={handlePercentileRangeChange}
                        disabled={loading}
                    />
                </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            {/* Chart Section */}
            <div style={{ position: 'relative', minHeight: 400 }}>
                <Spin spinning={loading} size="large">
                    {tornadoChartData ? (
                        <Plot
                            data={tornadoChartData.data}
                            layout={tornadoChartData.layout}
                            config={tornadoChartData.config}
                            style={{ width: '100%' }}
                            onClick={createTornadoClickHandler(handleVariableSelect)}
                        />
                    ) : (
                        <Empty description="No sensitivity data available" />
                    )}
                </Spin>
            </div>

            {/* Insights Panel */}
            {showInsights && sensitivityResults.length > 0 && (
                <>
                    <Divider style={{ margin: '16px 0' }} />
                    <InsightsPanel
                        sensitivityResults={sensitivityResults}
                        metricConfig={metricConfig}
                        targetMetric={targetMetric}
                        highlightedDriver={highlightedDriver}
                        confidenceLevel={upperPercentile - lowerPercentile}
                    />
                </>
            )}

            {/* Footer Information */}
            <div style={{
                marginTop: 16,
                padding: 8,
                background: '#f6f8fa',
                borderRadius: 4,
                fontSize: '12px'
            }}>
                <Row justify="space-between">
                    <Col>
                        <Space>
                            <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            <Text type="secondary">
                                {createDriverAnalysisFooter({
                                    confidenceInterval: upperPercentile - lowerPercentile,
                                    variableCount: sensitivityResults.length
                                }).left}
                            </Text>
                        </Space>
                    </Col>
                    <Col>
                        <Text type="secondary">
                            {createDriverAnalysisFooter({
                                confidenceInterval: upperPercentile - lowerPercentile,
                                variableCount: sensitivityResults.length
                            }).right}
                        </Text>
                    </Col>
                </Row>
            </div>

            {/* Debug info (development only) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    marginTop: 8,
                    padding: 8,
                    background: '#fff1f0',
                    borderRadius: 4,
                    fontSize: '11px'
                }}>
                    <Text type="secondary">
                        Debug: {variables.length} variables discovered, {sensitivityResults.length} results calculated,
                        P{basePercentile} base case, {targetMetric} target metric
                    </Text>
                    {variables.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            <Text type="secondary">
                                Variables: {variables.map(v => v.label || v.id).join(', ')}
                            </Text>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default DriverExplorerCard;