// Enhanced DriverExplorerCard.jsx with proper colors and advanced features
import React, { useMemo, useState, useCallback } from 'react';
import { Card, Alert, Select, Row, Col, Space, Typography, Slider, Divider, Switch, Tooltip, Tag } from 'antd';
import { BarChartOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { theme } from 'antd';
import { useCube } from '../../contexts/CubeContext';
import { useCubeSensitivity } from '../../hooks/useCubeSensitivity';
import { useScenario } from '../../contexts/ScenarioContext';
import { METRICS_REGISTRY } from '../../utils/cube/metrics/registry';
import { getSemanticColor } from '../../utils/charts/colors';
import TornadoInsightsPanel from './components/TornadoInsightsPanel'

const { Text, Title } = Typography;
const { Option } = Select;
const { useToken } = theme;


const DriverExplorerCard = ({
    title = "Value Driver Analysis",
    icon = <BarChartOutlined />,
    cardProps = {},
    defaultMetric = 'projectIRR',
    showInsights = true
}) => {
    const { token } = useToken();

    // Cube and sensitivity hooks
    const { getPercentileData, setSelectedPercentile } = useCube();
    const {
        getSensitivity,
        getTornadoAnalysis,
        isLoading,
        isDataAvailable,
        availablePercentiles
    } = useCubeSensitivity();

    const { getValueByPath } = useScenario();
    const percentileInfo = getPercentileData();

    // Local state
    const [targetMetric, setTargetMetric] = useState(defaultMetric);
    const [highlightedDriver, setHighlightedDriver] = useState(null);
    const [useSlider, setUseSlider] = useState(false);
    const [sliderValue, setSliderValue] = useState(null);
    const [maxResults, setMaxResults] = useState(10);
    const [showNegativeOnly, setShowNegativeOnly] = useState(false);
    const [correlationThreshold, setCorrelationThreshold] = useState(0.1);

    // Get sensitivity-enabled metrics for target selection
    const sensitivityMetrics = useMemo(() => {
        if (!METRICS_REGISTRY?.metrics) return [];

        return METRICS_REGISTRY.metrics
            .filter(metric => metric.sensitivity?.enabled === true)
            .map(metric => ({
                id: metric.id,
                name: metric.metadata?.name || metric.id,
                description: metric.metadata?.description || '',
                group: metric.metadata?.visualGroup || 'other',
                formatter: metric.metadata?.formatter
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    // Get target metric configuration
    const targetMetricConfig = useMemo(() => {
        if (!METRICS_REGISTRY?.metrics) return null;
        return METRICS_REGISTRY.metrics.find(m => m.id === targetMetric);
    }, [targetMetric]);

    // Calculate percentile range for analysis
    const analysisPercentiles = useMemo(() => {
        if (useSlider && sliderValue !== null) {
            return [percentileInfo.primary, sliderValue].sort((a, b) => a - b);
        } else {
            return [percentileInfo.primary, percentileInfo.selected].sort((a, b) => a - b);
        }
    }, [useSlider, sliderValue, percentileInfo]);

    // Get tornado analysis data
    const tornadoData = useMemo(() => {
        if (!isDataAvailable || !targetMetric || analysisPercentiles.length < 2) {
            return null;
        }

        try {
            console.log(`🌪️ DriverExplorerCard: Getting tornado data for ${targetMetric} between P${analysisPercentiles[0]} and P${analysisPercentiles[1]}`);

            return getTornadoAnalysis({
                percentiles: [analysisPercentiles[1]], // Analyze at the comparison percentile
                targetMetrics: [targetMetric],
                format: 'chart',
                parameters: {
                    maxResults: maxResults,
                    includeNegative: true,
                    rankingMethod: 'correlation',
                    impactThreshold: correlationThreshold
                }
            });
        } catch (error) {
            console.error('❌ DriverExplorerCard: Failed to get tornado analysis:', error);
            return { error: error.message };
        }
    }, [isDataAvailable, targetMetric, analysisPercentiles, getTornadoAnalysis, maxResults, correlationThreshold]);

    // Prepare chart data for Plotly with enhanced styling
    const plotlyData = useMemo(() => {
        if (!tornadoData?.chartData?.[0]?.data) {
            return { data: [], layout: {} };
        }

        let chartData = tornadoData.chartData[0].data;

        // Apply filters
        if (showNegativeOnly) {
            chartData = chartData.filter(item => item.value < 0);
        }

        // Filter by correlation threshold
        chartData = chartData.filter(item => Math.abs(item.value) >= correlationThreshold);

        // Sort by absolute correlation for tornado display
        const sortedData = [...chartData].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

        // Take top N results
        const displayData = sortedData.slice(0, maxResults);

        // Enhanced color scheme using token-aware colors
        const positiveColor = getSemanticColor('success', 6, token) || '#52c41a';
        const negativeColor = getSemanticColor('error', 6, token) || '#ff4d4f';
        const neutralColor = getSemanticColor('neutral', 4, token) || '#8c8c8c';

        // Prepare tornado bars
        const traces = [{
            type: 'bar',
            orientation: 'h',
            y: displayData.map(item => item.label),
            x: displayData.map(item => item.value),
            text: displayData.map(item => `${(Math.abs(item.value) * 100).toFixed(1)}%`),
            textposition: 'outside',
            textfont: { size: 11, color: token.colorText },
            marker: {
                color: displayData.map(item => {
                    if (item.label === highlightedDriver) {
                        return getSemanticColor('primary', 6, token) || '#1677ff';
                    }
                    return item.value >= 0 ? positiveColor : negativeColor;
                }),
                line: {
                    color: token.colorBorder || 'rgba(50, 50, 50, 0.8)',
                    width: highlightedDriver ? 2 : 1
                },
                opacity: displayData.map(item =>
                    item.label === highlightedDriver ? 1.0 : 0.8
                )
            },
            customdata: displayData.map(item => ({
                correlation: item.value,
                impact: item.impact,
                targetMetric: item.targetMetric,
                inputMetric: item.label
            })),
            hovertemplate:
                `<b>%{y}</b><br>` +
                `Correlation: %{x:.3f}<br>` +
                `Impact: %{customdata.impact:.2f}<br>` +
                `Range: P${analysisPercentiles[0]} → P${analysisPercentiles[1]}` +
                `<extra></extra>`,
            name: 'Correlation Impact'
        }];

        // Calculate dynamic height based on number of items
        const chartHeight = Math.max(300, displayData.length * 35 + 120);

        const layout = {
            title: {
                text: `Impact on ${targetMetricConfig?.metadata?.name || targetMetric}`,
                font: {
                    size: 16,
                    color: token.colorText,
                    family: token.fontFamily
                },
                x: 0.05,
                xanchor: 'left'
            },
            xaxis: {
                title: {
                    text: 'Correlation Coefficient',
                    font: { color: token.colorTextSecondary }
                },
                range: [-1, 1],
                tickformat: '.2f',
                zeroline: true,
                zerolinecolor: token.colorBorder || '#d9d9d9',
                zerolinewidth: 2,
                gridcolor: token.colorBorderSecondary || '#f0f0f0',
                tickfont: { color: token.colorTextSecondary }
            },
            yaxis: {
                title: {
                    text: 'Input Variables',
                    font: { color: token.colorTextSecondary }
                },
                automargin: true,
                tickfont: { color: token.colorText }
            },
            margin: {
                l: 140,
                r: 100,
                t: 80,
                b: 60
            },
            height: chartHeight,
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                family: token.fontFamily,
                color: token.colorText
            }
        };

        return { data: traces, layout };
    }, [tornadoData, targetMetricConfig, analysisPercentiles, highlightedDriver, maxResults, showNegativeOnly, correlationThreshold, token]);

    // Enhanced insights calculation  
    const insights = useMemo(() => {
        if (!tornadoData?.chartData?.[0]?.data?.length) return null;

        const data = tornadoData.chartData[0].data;
        const positiveCorrelations = data.filter(d => d.value > 0);
        const negativeCorrelations = data.filter(d => d.value < 0);
        const strongCorrelations = data.filter(d => Math.abs(d.value) >= 0.5);

        return {
            topDriver: data[0],
            totalVariables: data.length,
            positiveCount: positiveCorrelations.length,
            negativeCount: negativeCorrelations.length,
            strongCount: strongCorrelations.length,
            maxCorrelation: Math.max(...data.map(d => Math.abs(d.value))),
            averageCorrelation: data.reduce((sum, d) => sum + Math.abs(d.value), 0) / data.length
        };
    }, [tornadoData]);

    // Event handlers
    const handleMetricChange = useCallback((newMetric) => {
        setTargetMetric(newMetric);
        setHighlightedDriver(null);
    }, []);

    const handleChartClick = useCallback((event) => {
        if (event?.points?.[0]) {
            const clickedDriver = event.points[0].y;
            setHighlightedDriver(prev => prev === clickedDriver ? null : clickedDriver);
        }
    }, []);

    const handleSliderToggle = useCallback((checked) => {
        setUseSlider(checked);
        if (!checked) {
            setSliderValue(null);
        } else {
            const minP = Math.min(...availablePercentiles);
            const maxP = Math.max(...availablePercentiles);
            setSliderValue(Math.round((minP + maxP) / 2));
        }
    }, [availablePercentiles]);

    const handleSliderChange = useCallback((value) => {
        setSliderValue(value);
    }, []);

    // Render loading state
    if (isLoading) {
        return (
            <Card
                title={<Space>{icon}{title}</Space>}
                {...cardProps}
                loading={true}
            >
                <div style={{ height: 400 }} />
            </Card>
        );
    }

    // Render error state
    if (!isDataAvailable) {
        return (
            <Card
                title={<Space>{icon}{title}</Space>}
                {...cardProps}
            >
                <Alert
                    message="Sensitivity Data Not Available"
                    description="Sensitivity analysis data is not available. Please ensure the cube has been refreshed with sensitivity analysis enabled."
                    type="warning"
                    showIcon
                />
            </Card>
        );
    }

    // Render tornado error
    if (tornadoData?.error) {
        return (
            <Card
                title={<Space>{icon}{title}</Space>}
                {...cardProps}
            >
                <Alert
                    message="Tornado Analysis Error"
                    description={tornadoData.error}
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    // Render no data state
    if (!tornadoData?.chartData?.[0]?.data?.length) {
        return (
            <Card
                title={<Space>{icon}{title}</Space>}
                {...cardProps}
            >
                <Alert
                    message="No Analysis Data"
                    description={`No correlation data available for ${targetMetricConfig?.metadata?.name || targetMetric}. This may indicate insufficient variable relationships or data.`}
                    type="info"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <Card
            title={<Space>{icon}{title}</Space>}
            extra={
                <Space>
                    <Tooltip title="Chart Settings">
                        <SettingOutlined style={{ color: token.colorTextSecondary }} />
                    </Tooltip>
                </Space>
            }
            {...cardProps}
        >
            {/* Primary Controls */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Text strong>Target Metric</Text>
                        <Select
                            value={targetMetric}
                            onChange={handleMetricChange}
                            style={{ width: '100%' }}
                            placeholder="Select target metric"
                            showSearch
                            optionFilterProp="children"
                        >
                            {sensitivityMetrics.map(metric => (
                                <Option key={metric.id} value={metric.id}>
                                    <Space direction="vertical" size={0}>
                                        <Text>{metric.name}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {metric.group} • {metric.description}
                                        </Text>
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Space>
                </Col>

                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                            <Text strong>Analysis Range</Text>
                            <Switch
                                size="small"
                                checked={useSlider}
                                onChange={handleSliderToggle}
                                checkedChildren="Custom"
                                unCheckedChildren="Percentile"
                            />
                        </Space>
                        <Text>
                            <Tag color="blue">P{percentileInfo.primary}</Tag>
                            →
                            <Tag color={useSlider ? "orange" : "green"}>
                                {useSlider ? `P${sliderValue}` : `P${percentileInfo.selected}`}
                            </Tag>
                        </Text>
                        {useSlider && (
                            <Slider
                                min={Math.min(...availablePercentiles)}
                                max={Math.max(...availablePercentiles)}
                                value={sliderValue || percentileInfo.selected}
                                onChange={handleSliderChange}
                                marks={availablePercentiles.reduce((acc, p) => {
                                    acc[p] = { label: `P${p}`, style: { fontSize: '10px' } };
                                    return acc;
                                }, {})}
                                step={null}
                                tooltip={{ formatter: (value) => `P${value}` }}
                            />
                        )}
                    </Space>
                </Col>
            </Row>

            {/* Advanced Controls */}
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Max Results</Text>
                        <Select
                            value={maxResults}
                            onChange={setMaxResults}
                            size="small"
                            style={{ width: '100%' }}
                        >
                            <Option value={5}>Top 5</Option>
                            <Option value={10}>Top 10</Option>
                            <Option value={15}>Top 15</Option>
                            <Option value={20}>Top 20</Option>
                        </Select>
                    </Space>
                </Col>
                <Col span={6}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Min Correlation</Text>
                        <Select
                            value={correlationThreshold}
                            onChange={setCorrelationThreshold}
                            size="small"
                            style={{ width: '100%' }}
                        >
                            <Option value={0.05}>5%</Option>
                            <Option value={0.1}>10%</Option>
                            <Option value={0.2}>20%</Option>
                            <Option value={0.3}>30%</Option>
                        </Select>
                    </Space>
                </Col>
                <Col span={6}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Filter</Text>
                        <Switch
                            size="small"
                            checked={showNegativeOnly}
                            onChange={setShowNegativeOnly}
                            checkedChildren="Negative"
                            unCheckedChildren="All"
                        />
                    </Space>
                </Col>
                <Col span={6}>
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Highlighted</Text>
                        <Text style={{ fontSize: '11px' }}>
                            {highlightedDriver || 'None'}
                        </Text>
                    </Space>
                </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            {/* Enhanced Tornado Chart */}
            <div style={{ width: '100%', height: plotlyData.layout.height || 400 }}>
                <Plot
                    data={plotlyData.data}
                    layout={plotlyData.layout}
                    config={{
                        displayModeBar: false,
                        responsive: true,
                        scrollZoom: false,
                        doubleClick: false
                    }}
                    style={{ width: '100%', height: '100%' }}
                    onClick={handleChartClick}
                />
            </div>

            {/* Enhanced Insights Panel */}
            {showInsights && tornadoData && (
                <>
                    <Divider style={{ margin: '16px 0' }} />
                    <TornadoInsightsPanel
                        tornadoData={tornadoData}
                        targetMetricConfig={targetMetricConfig}
                        analysisPercentiles={analysisPercentiles}
                        correlationThreshold={correlationThreshold}
                    />
                </>
            )}
        </Card>
    );
};

export default DriverExplorerCard;