// Update DriverExplorerCard.jsx - Use real data like other cards

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Alert, Empty, Select, Row, Col, Space, Typography, Spin } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useCashflow } from '../../contexts/CashflowContext';
import { useScenario } from '../../contexts/ScenarioContext';
import SensitivityRangeSelector from '../results/cashflow/components/SensitivityRangeSelector';
import {
    SUPPORTED_METRICS,
    createMetricSelectorOptions,
    extractMetricValue
} from '../../utils/finance';
import {
    discoverVariablesFromRegistry,
    calculateDynamicSensitivity
} from '../../utils/finance/sensitivityAnalysis';
import { CASHFLOW_SOURCE_REGISTRY } from '../../contexts/CashflowContext';
import { prepareTornadoChartData, createTornadoClickHandler } from '../../utils/charts/financial';

const { Text } = Typography;

const DriverExplorerCard = ({
    title = "Value Driver Analysis",
    icon = <BarChartOutlined />,
    cardProps = {}
}) => {
    const { cashflowData } = useCashflow();
    const { getValueByPath, scenarioData } = useScenario();

    // State management
    const [targetMetric, setTargetMetric] = useState('npv');
    const [highlightedDriver, setHighlightedDriver] = useState(null);
    const [lowerPercentile, setLowerPercentile] = useState(25);
    const [upperPercentile, setUpperPercentile] = useState(75);
    const [loading, setLoading] = useState(false);

    // Get base percentile from cashflow context
    const basePercentile = useMemo(() => {
        return cashflowData?.metadata?.primaryPercentile || 50;
    }, [cashflowData?.metadata?.primaryPercentile]);

    // Get metric configuration
    const metricConfig = useMemo(() => {
        return SUPPORTED_METRICS[targetMetric];
    }, [targetMetric]);

    // Create metric selector options
    const metricOptions = useMemo(() => {
        return createMetricSelectorOptions();
    }, []);

    // Discover variables from registry
    const variables = useMemo(() => {
        const discovered = discoverVariablesFromRegistry(CASHFLOW_SOURCE_REGISTRY);
        console.log('Discovered variables:', discovered);
        return discovered;
    }, []);

    // RDI-1 & RDI-2: Use real financial data like FinanceabilityCard
    const financingData = useMemo(() => {
        return cashflowData?.financeMetrics || null;
    }, [cashflowData?.financeMetrics]);

    // Real cashflow engine that uses actual computed financial metrics
    const realCashflowEngine = useCallback((scenario) => {
        // This should return the actual financial metrics for the given scenario
        // For now, extract from the existing financingData at base percentile
        if (!financingData) {
            console.warn('No financing data available');
            return {
                npv: 0,
                irr: 0,
                equityIRR: 5,
                dscr: { minimum: 1.0 },
                paybackPeriod: 0
            };
        }

        // Extract metrics at the base percentile like FinanceabilityCard does
        const extractPercentileValue = (metricData, percentile) => {
            if (!metricData) return null;

            if (metricData instanceof Map) {
                const percentileData = metricData.get(percentile);
                if (Array.isArray(percentileData)) {
                    // For time series data, get a representative value (e.g., minimum for DSCR)
                    if (targetMetric === 'dscr') {
                        return Math.min(...percentileData.map(d => d.value));
                    }
                    // For other metrics, use the last value or sum
                    return percentileData[percentileData.length - 1]?.value || 0;
                }
                return percentileData?.value || percentileData || 0;
            }

            // Handle direct values
            return metricData.value || metricData || 0;
        };

        return {
            npv: extractPercentileValue(financingData.npv, basePercentile) || 0,
            irr: extractPercentileValue(financingData.irr, basePercentile) || 0,
            equityIRR: extractPercentileValue(financingData.equityIRR, basePercentile) || 0,
            dscr: {
                minimum: extractPercentileValue(financingData.dscr, basePercentile) || 1.0
            },
            paybackPeriod: extractPercentileValue(financingData.paybackPeriod, basePercentile) || 0
        };
    }, [financingData, basePercentile, targetMetric]);

    const sensitivityResults = useMemo(() => {
        if (!scenarioData || !financingData || variables.length === 0) {
            return [];
        }

        setLoading(true);

        try {
            // Get the actual financial metrics at different percentiles
            const availablePercentiles = cashflowData?.metadata?.availablePercentiles || [10, 25, 50, 75, 90];

            console.log('Available percentiles:', availablePercentiles);
            console.log('Financial data structure:', Object.keys(financingData));

            // Extract metric values at different percentiles
            const extractMetricAtPercentile = (metricMap, percentile) => {
                if (!metricMap) return null;

                if (metricMap instanceof Map) {
                    const data = metricMap.get(percentile);
                    if (Array.isArray(data)) {
                        return targetMetric === 'dscr' ?
                            Math.min(...data.map(d => d.value)) :
                            data[data.length - 1]?.value;
                    }
                    return data;
                }

                return metricMap.value || metricMap;
            };

            // Get base, low, and high values for the target metric
            const baseValue = extractMetricAtPercentile(financingData[targetMetric], basePercentile);
            const lowValue = extractMetricAtPercentile(financingData[targetMetric], lowerPercentile);
            const highValue = extractMetricAtPercentile(financingData[targetMetric], upperPercentile);

            if (baseValue === null || lowValue === null || highValue === null) {
                console.warn(`Could not extract ${targetMetric} values from financial data`);
                return [];
            }

            console.log(`${targetMetric} values - Base: ${baseValue}, Low: ${lowValue}, High: ${highValue}`);

            // Create sensitivity results based on the actual percentile differences
            const results = variables.map(variable => {
                // For now, attribute equal impact to each variable
                // Later we can enhance this with proper variable attribution
                const totalImpact = Math.abs(highValue - lowValue);
                const variableImpact = totalImpact / variables.length; // Simple equal attribution

                return {
                    variable: variable.label,
                    variableId: variable.id,
                    category: variable.category,
                    variableType: variable.variableType,
                    metric: targetMetric,
                    baseValue,
                    lowValue,
                    highValue,
                    impact: variableImpact,
                    percentileRange: {
                        lower: lowerPercentile,
                        base: basePercentile,
                        upper: upperPercentile,
                        confidenceInterval: upperPercentile - lowerPercentile
                    },
                    variableValues: {
                        low: 'P' + lowerPercentile,
                        base: 'P' + basePercentile,
                        high: 'P' + upperPercentile
                    }
                };
            });

            console.log('Real sensitivity results:', results);
            return results.sort((a, b) => b.impact - a.impact);

        } catch (error) {
            console.error('Error performing sensitivity analysis:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [scenarioData, financingData, variables, basePercentile, lowerPercentile, upperPercentile, targetMetric, cashflowData?.metadata?.availablePercentiles]);
    // Prepare tornado chart data
    const tornadoChartData = useMemo(() => {
        if (!sensitivityResults.length || !metricConfig) {
            return null;
        }

        // Add the missing properties that prepareTornadoChartData expects
        const enhancedResults = sensitivityResults.map(result => {
            // Find the original variable to get type info
            const originalVariable = variables.find(v => v.id === result.variableId);

            return {
                ...result,
                variableType: originalVariable?.variableType || 'unknown',
                category: originalVariable?.category || 'unknown'
            };
        });

        return prepareTornadoChartData({
            sensitivityResults: enhancedResults,
            targetMetric,
            highlightedDriver,
            metricConfig
        });
    }, [sensitivityResults, targetMetric, highlightedDriver, metricConfig, variables]);

    // Handle variable selection
    const handleVariableSelect = useCallback((variableId) => {
        setHighlightedDriver(variableId === highlightedDriver ? null : variableId);
    }, [highlightedDriver]);

    // Handle percentile range changes
    const handlePercentileRangeChange = useCallback((lower, upper) => {
        setLowerPercentile(lower);
        setUpperPercentile(upper);
    }, []);

    // Error states
    if (!cashflowData) {
        return (
            <Card title={title} extra={icon} {...cardProps}>
                <Empty description="No cashflow data available" />
            </Card>
        );
    }

    if (!financingData) {
        return (
            <Card title={title} extra={icon} {...cardProps}>
                <Alert
                    message="No Financial Data"
                    description="No financial metrics available for sensitivity analysis."
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

    const confidenceInterval = upperPercentile - lowerPercentile;

    return (
        <Card
            title={
                <Space>
                    {icon}
                    <span>{title}</span>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        ({confidenceInterval}% confidence range)
                    </Text>
                </Space>
            }
            {...cardProps}
        >
            {/* Controls Section */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Target Metric</Text>
                        <Select
                            value={targetMetric}
                            onChange={setTargetMetric}
                            style={{ width: '100%' }}
                            options={metricOptions}
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

            {/* Chart Section */}
            <div style={{ marginBottom: 24 }}>
                <Spin spinning={loading}>
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

            {/* Debug info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{ padding: 8, background: '#f0f0f0', fontSize: '12px' }}>
                    <div>Variables found: {variables.length}</div>
                    <div>Sensitivity results: {sensitivityResults.length}</div>
                    <div>Financial data available: {!!financingData}</div>
                    <div>Base percentile: P{basePercentile}</div>
                    <div>Target metric: {targetMetric}</div>
                </div>
            )}
        </Card>
    );
};

export default DriverExplorerCard;