// frontend/src/components/cards/DriverExplorerCard.jsx
// BASED ON WORKING VERSION - MINIMAL CHANGES ONLY

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Alert, Empty, Select, Row, Col, Space, Typography } from 'antd';
import { BarChartOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useCashflow } from '../../contexts/CashflowContext';
import { useScenario } from '../../contexts/ScenarioContext'; // ✅ ADD: This was missing
import SensitivityRangeSelector from '../results/cashflow/components/SensitivityRangeSelector'; // ✅ ADD: This was missing
import InsightsPanel from './components/InsightsPanel';
import TargetMetricRangeVisualizer from './components/TargetMetricRangeVisualizer'; // ✅ ADD: This was missing
import { SUPPORTED_METRICS, createMetricSelectorOptions } from '../../utils/finance/sensitivityMetrics';
import { prepareTornadoChartData, createTornadoClickHandler } from '../../utils/charts/sensitivity';
import { extractSensitivityFromCube, validateSensitivityCube } from '../../utils/finance/sensitivityAnalysis';


const { Text } = Typography;

const DriverExplorerCard = ({
    title = "Value Driver Analysis",
    icon = <BarChartOutlined />,
    cardProps = {},
    defaultMetric = 'npv',
    showInsights = true
}) => {
    // ✅ WORKING: Keep the existing context usage
    const { cashflowData, sensitivityData, loading, transformError } = useCashflow();
    const { getValueByPath } = useScenario(); // ✅ ADD: This was missing

    // State management
    const [targetMetric, setTargetMetric] = useState(defaultMetric);
    const [highlightedDriver, setHighlightedDriver] = useState(null);
    const [lowerPercentile, setLowerPercentile] = useState(25);
    const [upperPercentile, setUpperPercentile] = useState(75);

    // ✅ ADD: This was missing
    const basePercentile = useMemo(() => {
        return cashflowData?.metadata?.primaryPercentile || 50;
    }, [cashflowData?.metadata?.primaryPercentile]);

    // Get metric configuration
    const metricConfig = useMemo(() => {
        return SUPPORTED_METRICS[targetMetric];
    }, [targetMetric]);

    const distributionAnalysis = useMemo(() => {
        return getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    }, [getValueByPath]);

    // Update the sensitivityResults calculation
    const sensitivityResults = useMemo(() => {
        if (!cashflowData) {
            return [];
        }

        // ✅ NEW: Use pre-computed sensitivity cube
        if (cashflowData.sensitivityCube) {
            console.log('Using pre-computed sensitivity cube');

            // Validate cube first
            const validation = validateSensitivityCube(cashflowData.sensitivityCube);
            if (!validation.valid) {
                console.error('Invalid sensitivity cube:', validation.error);
                return [];
            }

            // Extract results from cube
            return extractSensitivityFromCube(
                cashflowData.sensitivityCube,
                targetMetric,
                { lower: lowerPercentile, upper: upperPercentile, base: 50 }
            );
        }

        // ✅ FALLBACK: Use legacy calculation if cube not available
        console.warn('Sensitivity cube not available, using fallback calculation');

        if (!sensitivityData || !distributionAnalysis) {
            console.warn('No sensitivity data or distribution analysis available');
            return [];
        }

        // ... existing fallback logic (keep as-is) ...

    }, [cashflowData, targetMetric, lowerPercentile, upperPercentile, basePercentile, sensitivityData, distributionAnalysis, getValueByPath]);

    // Add cube status display for debugging
    const sensitivityCubeStatus = useMemo(() => {
        if (!cashflowData?.sensitivityCube) {
            return { available: false, message: 'Sensitivity cube not computed' };
        }

        const validation = validateSensitivityCube(cashflowData.sensitivityCube);
        return {
            available: validation.valid,
            message: validation.valid
                ? `Cube: ${validation.variables} variables × ${validation.metrics} metrics`
                : validation.error,
            computedAt: cashflowData.sensitivityCube.computedAt
        };
    }, [cashflowData?.sensitivityCube]);

    // ✅ WORKING: Keep the existing metric options logic - DON'T CHANGE THIS
    const metricOptions = useMemo(() => {
        return createMetricSelectorOptions();
    }, []);

    // Event handlers - KEEP EXISTING
    const handleMetricChange = useCallback((newMetric) => {
        setTargetMetric(newMetric);
        setHighlightedDriver(null);
    }, []);

    const handleDriverSelect = useCallback((driverId) => {
        setHighlightedDriver(prev => prev === driverId ? null : driverId);
    }, []);

    // ✅ ADD: This was missing
    const handlePercentileRangeChange = useCallback((range) => {
        setLowerPercentile(range.lower);
        setUpperPercentile(range.upper);
    }, []);

    // Chart data preparation - KEEP EXISTING
    const chartData = useMemo(() => {
        if (!sensitivityResults.length || !metricConfig) return null;

        return prepareTornadoChartData({
            sensitivityResults,
            targetMetric,
            highlightedDriver,
            metricConfig,
            options: {
                showVariableCount: true
            }
        });
    }, [sensitivityResults, targetMetric, highlightedDriver, metricConfig]);

    // Chart click handler - KEEP EXISTING
    const handleChartClick = useMemo(() => {
        return createTornadoClickHandler(handleDriverSelect);
    }, [handleDriverSelect]);

    // Error handling - KEEP ALL EXISTING ERROR HANDLING AS-IS
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

    if (loading) {
        return (
            <Card
                title={
                    <Space>
                        {icon}
                        {title}
                    </Space>
                }
                {...cardProps}
                loading={true}
            >
                <div style={{ height: 400 }} />
            </Card>
        );
    }

    if (!cashflowData || !sensitivityData) {
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
                    message="No Data Available"
                    description="No cashflow or sensitivity data available. Please run analysis first."
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
            {/* ✅ UPDATED: Controls Row with SensitivityRangeSelector */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={8}>
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
                <Col span={16}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <SensitivityRangeSelector
                            getValueByPath={getValueByPath}
                            lowerPercentile={lowerPercentile}
                            upperPercentile={upperPercentile}
                            primaryPercentile={basePercentile}
                            onRangeChange={handlePercentileRangeChange}
                            disabled={loading}
                        />
                    </Space>
                </Col>
            </Row>

            {/* ✅ ADD: TargetMetricRangeVisualizer */}
            <Row style={{ marginBottom: 16 }}>
                <Col span={24}>
                    <TargetMetricRangeVisualizer
                        sensitivityResults={sensitivityResults}
                        metricConfig={metricConfig}
                        selectedRange={{ lower: lowerPercentile, upper: upperPercentile }}
                        getValueByPath={getValueByPath}
                    />
                </Col>
            </Row>

            {/* Main Content - Chart */}
            <Row style={{ marginBottom: 16 }}>
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
            {process.env.NODE_ENV === 'development' && (
                <Row style={{ marginBottom: 8 }}>
                    <Col span={24}>
                        <Alert
                            message={sensitivityCubeStatus.message}
                            type={sensitivityCubeStatus.available ? 'success' : 'warning'}
                            size="small"
                            showIcon
                            style={{ fontSize: '11px' }}
                        />
                    </Col>
                </Row>
            )}
            {/* Insights Panel */}
            {showInsights && (
                <Row style={{ marginTop: 8 }}>
                    <Col span={24}>
                        <InsightsPanel
                            sensitivityResults={sensitivityResults}
                            metricConfig={metricConfig}
                            targetMetric={targetMetric}
                            highlightedDriver={highlightedDriver}
                            confidenceLevel={upperPercentile - lowerPercentile}
                            onDriverSelect={handleDriverSelect}
                        />
                    </Col>
                </Row>
            )}

            {/* Footer with methodology */}
            <div style={{ marginTop: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
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