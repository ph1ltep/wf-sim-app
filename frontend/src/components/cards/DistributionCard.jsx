import React, { useState, useMemo } from 'react';
import { Card, Space, Typography, Divider, Empty, Tooltip, Badge, Alert, Table, Button } from 'antd';
import { InfoCircleOutlined, ClockCircleOutlined, TableOutlined, SwapOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { hexToRgb, determineDecimalPrecision } from '../../utils/plotUtils';
import { generateTableData, prepareSummaryData, preparePercentileChartData } from '../../utils/plotDataUtils';
import { generateStatisticsTableData, prepareStatisticsBoxPlotData } from '../../utils/plotStatisticsUtils';

const { Text } = Typography;

/**
 * Reusable Distribution Card component for displaying distribution analysis charts
 * 
 * @param {Object} props Component props
 * @param {Object} props.simulationInfo SimulationInfoSchema object containing simulation results
 * @param {number} props.primaryPercentile Primary percentile value (e.g., 50 for P50)
 * @param {string} props.title Optional title override (defaults to distribution type name)
 * @param {React.ReactNode} props.icon Optional icon
 * @param {string} props.units Units to display (e.g., "MWh", "$")
 * @param {string} props.color Base color for the chart
 * @param {Object} props.cardProps Additional props for Card component
 * @param {number} props.height Chart height
 * @param {Object} props.extraLayoutOptions Additional Plotly layout options
 * @param {boolean} props.showMetadata Whether to show simulation metadata
 * @param {number} props.precision Number of decimal places to show (null for auto-detection)
 */
const DistributionCard = ({
    simulationInfo,
    primaryPercentile = 50,
    title,
    icon,
    units = '',
    color = '#1890ff',
    cardProps = {},
    height = 300,
    extraLayoutOptions = {},
    showMetadata = true,
    precision = null
}) => {
    // UI state
    const [dataTableVisible, setDataTableVisible] = useState(false);
    const [chartMode, setChartMode] = useState('percentiles'); // 'percentiles' or 'statistics'

    // Memoized extracted data from simulationInfo
    const distribution = useMemo(() => simulationInfo?.distribution || {}, [simulationInfo]);
    const iterations = useMemo(() => simulationInfo?.iterations || 0, [simulationInfo]);
    const timeElapsed = useMemo(() => simulationInfo?.timeElapsed || 0, [simulationInfo]);
    const results = useMemo(() => simulationInfo?.results || [], [simulationInfo]);
    const statistics = useMemo(() => simulationInfo?.statistics || {}, [simulationInfo]);
    const errors = useMemo(() => simulationInfo?.errors || [], [simulationInfo]);

    // Check for simulation errors
    const hasErrors = useMemo(() => errors.length > 0, [errors]);
    const hasResults = useMemo(() => results.length > 0, [results]);

    // Determine precision for numerical display (memoized)
    const actualPrecision = useMemo(() => {
        return precision !== null ? precision : determineDecimalPrecision(results);
    }, [results, precision]);

    // Prepare summary data (memoized)
    const summaryData = useMemo(() => {
        if (!hasResults) return [];
        return prepareSummaryData(results, primaryPercentile, actualPrecision);
    }, [hasResults, results, primaryPercentile, actualPrecision]);

    // Prepare percentile table data (memoized)
    const { columns: percentileColumns, data: percentileTableData } = useMemo(() => {
        if (!hasResults) return { columns: [], data: [] };

        // Get initial table data
        const tableInfo = generateTableData(results, primaryPercentile, color, actualPrecision);

        // Add comma formatting to the numeric columns without compact notation
        const formattedColumns = tableInfo.columns.map(column => {
            if (column.dataIndex !== 'year' && column.dataIndex !== 'percentile') {
                return {
                    ...column,
                    render: (text) => {
                        if (typeof text === 'number') {
                            return Number(text).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: actualPrecision
                            });
                        }
                        return text;
                    }
                };
            }
            return column;
        });

        return { columns: formattedColumns, data: tableInfo.data };
    }, [results, primaryPercentile, color, actualPrecision, hasResults]);

    // Prepare statistics table data (memoized)
    const { columns: statsColumns, data: statsTableData } = useMemo(() => {
        if (!hasResults || !statistics) return { columns: [], data: [] };
        return generateStatisticsTableData(statistics, color, actualPrecision);
    }, [hasResults, statistics, color, actualPrecision]);

    // Prepare percentile chart data (memoized)
    const percentileChartData = useMemo(() => {
        if (hasErrors || !hasResults) return { data: [], layout: {}, config: {} };

        const chartData = preparePercentileChartData(results, primaryPercentile, color, actualPrecision);
        const enhancedData = chartData.data.map(trace => ({
            ...trace,
            hovertemplate: trace.hovertemplate?.replace(
                '%{y}',
                '%{y:,.' + actualPrecision + 'f}'
            ) || `Year: %{x}<br>Value: %{y:,.${actualPrecision}f}${units ? ' ' + units : ''}<extra>%{fullData.name}</extra>`
        }));

        return {
            data: enhancedData,
            layout: chartData.layout,
            config: chartData.config
        };
    }, [hasErrors, results, primaryPercentile, color, actualPrecision, hasResults, units]);

    // Prepare statistics box plot data (memoized)
    const statsChartData = useMemo(() => {
        //console.log('hasResults:', hasResults);
        //console.log('statistics:', statistics);
        if (hasErrors || !hasResults || !statistics) return { data: [], layout: {}, config: {} };
        return prepareStatisticsBoxPlotData(statistics, color, actualPrecision, units);
    }, [hasErrors, hasResults, statistics, color, actualPrecision, units]);

    // Customize layout for the selected chart mode
    const customizedLayout = useMemo(() => {
        const baseLayout = chartMode === 'percentiles' ? percentileChartData.layout : statsChartData.layout;
        return {
            ...baseLayout,
            height: height,
            yaxis: {
                ...(baseLayout.yaxis || {}),
                title: units,
                hoverformat: `,.${actualPrecision}f`,
                tickformat: ",~s" // SI prefix for large numbers
            },
            xaxis: {
                ...(baseLayout.xaxis || {}),
                tickformat: ",d",
                hoverformat: ",d"
            },
            margin: {
                ...(baseLayout.margin || {}),
                r: 80 // Space for summary column
            },
            ...extraLayoutOptions
        };
    }, [chartMode, percentileChartData.layout, statsChartData.layout, height, units, actualPrecision, extraLayoutOptions]);

    // Use the provided title or get it from the distribution
    const cardTitle = useMemo(() => {
        return title || (distribution?.type
            ? `${distribution.type.charAt(0).toUpperCase() + distribution.type.slice(1)} Distribution`
            : "Distribution Analysis");
    }, [title, distribution]);

    // Create title content
    const titleContent = useMemo(() => {
        return (
            <Space>
                {icon}
                {cardTitle}
                {distribution?.type && !title && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        (Parameters: {Object.entries(distribution.parameters || {})
                            .filter(([key]) => key !== 'timeSeriesMode')
                            .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(actualPrecision) : value}`)
                            .join(', ')})
                    </Text>
                )}
            </Space>
        );
    }, [cardTitle, icon, distribution, title, actualPrecision]);

    // Card extra content with metadata, table toggle, and mode toggle
    const cardExtra = useMemo(() => {
        if (!simulationInfo) return null;

        return (
            <Space>
                {showMetadata && (
                    <Tooltip title={`${iterations.toLocaleString()} iterations, ${timeElapsed.toFixed(2)}ms execution time`}>
                        <Space>
                            <Badge count={hasErrors ? errors.length : 0} color="red" size="small">
                                <InfoCircleOutlined style={{ fontSize: '16px', cursor: 'pointer' }} />
                            </Badge>
                            <ClockCircleOutlined style={{ fontSize: '16px' }} />
                            {timeElapsed.toFixed(0)}ms
                        </Space>
                    </Tooltip>
                )}

                {hasResults && (
                    <Tooltip title={dataTableVisible ? "Hide data table" : "Show data table"}>
                        <Button
                            type="text"
                            icon={<TableOutlined
                                style={{
                                    color: dataTableVisible ? color : 'inherit',
                                    fontSize: '16px'
                                }}
                            />}
                            onClick={() => setDataTableVisible(!dataTableVisible)}
                            size="small"
                        />
                    </Tooltip>
                )}

                {hasResults && (
                    <Tooltip title={`Switch to ${chartMode === 'percentiles' ? 'Statistics' : 'Percentiles'} mode`}>
                        <Button
                            type="text"
                            icon={<SwapOutlined
                                style={{
                                    color: chartMode === 'percentiles' ? 'inherit' : color,
                                    fontSize: '16px'
                                }}
                            />}
                            onClick={() => setChartMode(chartMode === 'percentiles' ? 'statistics' : 'percentiles')}
                            size="small"
                        />
                    </Tooltip>
                )}
            </Space>
        );
    }, [showMetadata, iterations, timeElapsed, hasErrors, errors, hasResults, dataTableVisible, chartMode, color, simulationInfo]);

    // Early return if no simulation info
    if (!simulationInfo) {
        return (
            <Card
                title={title || "Distribution Analysis"}
                bordered={true}
                {...cardProps}
            >
                <Empty description="No simulation data available" />
            </Card>
        );
    }

    return (
        <Card
            title={titleContent}
            bordered={true}
            extra={cardExtra}
            {...cardProps}
        >
            {hasErrors ? (
                <Alert
                    message={`Simulation Error${errors.length > 1 ? 's' : ''}`}
                    description={
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {errors.map((error, i) => (
                                <li key={i}>{error}</li>
                            ))}
                        </ul>
                    }
                    type="error"
                    showIcon
                />
            ) : hasResults ? (
                <>
                    <div style={{ display: 'flex', position: 'relative' }}>
                        <div style={{ flex: 1 }}>
                            <Plot
                                data={chartMode === 'percentiles' ? percentileChartData.data : statsChartData.data}
                                layout={customizedLayout}
                                config={chartMode === 'percentiles' ? percentileChartData.config : statsChartData.config}
                                style={{ width: '100%' }}
                            />
                        </div>

                        {/* Summary column */}
                        {chartMode === 'percentiles' && (
                            <div style={{
                                position: 'absolute',
                                right: 10,
                                top: 40,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                background: 'rgba(255,255,255,0.85)',
                                padding: '8px 6px',
                                borderRadius: '4px',
                                boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                            }}>
                                {summaryData.map(summary => (
                                    <div key={summary.percentile} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '2px 4px',
                                        backgroundColor: summary.isPrimary ? `rgba(${hexToRgb(color)}, 0.2)` : 'transparent',
                                        borderRadius: '3px'
                                    }}>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            width: '26px',
                                            color: summary.isPrimary ? color : '#666'
                                        }}>
                                            P{summary.percentile}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: summary.isPrimary ? 'bold' : 'normal',
                                            color: summary.isPrimary ? color : '#333'
                                        }}>
                                            {Number(summary.mean).toLocaleString(undefined, {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: actualPrecision,
                                                notation: summary.mean > 9999 ? 'compact' : 'standard',
                                                compactDisplay: 'short'
                                            })}
                                            {units && <span style={{ marginLeft: '2px', fontSize: '10px' }}>{units}</span>}
                                        </div>
                                    </div>
                                ))}
                                <div style={{
                                    fontSize: '9px',
                                    color: '#999',
                                    textAlign: 'center',
                                    marginTop: '2px'
                                }}>
                                    mean
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table section */}
                    {dataTableVisible && (
                        <>
                            <Divider style={{ margin: '12px 0 8px 0' }} />
                            <div style={{ marginBottom: 16 }}>
                                <Table
                                    columns={chartMode === 'percentiles' ? percentileColumns : statsColumns}
                                    dataSource={chartMode === 'percentiles' ? percentileTableData : statsTableData}
                                    size="small"
                                    pagination={false}
                                    scroll={{ x: 'max-content', y: 300 }}
                                    bordered
                                />
                            </div>
                        </>
                    )}
                </>
            ) : (
                <Empty
                    description="No simulation results available"
                    style={{ padding: '40px 0' }}
                />
            )}
        </Card>
    );
};

export default DistributionCard;