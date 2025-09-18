// src/components/charts/PercentileChart.jsx

import React, { useMemo } from 'react';
import { Divider, Empty, Table } from 'antd';
import Plot from 'react-plotly.js';
import { hexToRgb } from '../../utils/charts';
import { formatNumber, formatCompactNumber } from '../../utils/formatUtils';
import {
    generatePercentileTableData,
    prepareSummaryData,
    preparePercentileChartData
} from '../../utils/chartUtils';

const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };



// Component for rendering percentile chart and table
/**
 * Renders a percentile chart with bands and optional table for simulation results.
 * @param {Object} props - Component props
 * @param {Object} props.simulationInfo - SimulationInfoSchema object with results
 * @param {number} props.primaryPercentile - Primary percentile value (e.g., 50)
 * @param {string} props.color - Chart color
 * @param {string} props.units - Units for display (e.g., 'MWh')
 * @param {number|null} props.precision - Decimal precision (null for Plotly default)
 * @param {number} props.height - Chart height
 * @param {Object} props.extraLayoutOptions - Additional Plotly layout options
 * @param {boolean} props.dataTableVisible - Whether to show the data table
 * @param {Function} props.toggleTableVisibility - Toggles table visibility
 * @param {boolean} [props.decimalStorage=false] - Whether data is stored as decimals but should display as percentages
 * @returns {JSX.Element} Percentile chart and table
 */
const PercentileChart = React.memo(({
    simulationInfo,
    primaryPercentile,
    color,
    units,
    precision,
    height,
    extraLayoutOptions,
    dataTableVisible,
    toggleTableVisibility,
    decimalStorage = false
}) => {
    // Extract results and check validity
    const results = simulationInfo?.results || [];
    const hasResults = results.length > 0;

    // Prepare summary data for the right-hand column
    const summaryData = useMemo(() => {
        if (!hasResults) return [];
        const rawSummaryData = prepareSummaryData(results, primaryPercentile, precision, simulationInfo?.distribution?.parameters?.value, decimalStorage);
        return rawSummaryData;
    }, [hasResults, results, primaryPercentile, precision, simulationInfo, units, decimalStorage]);

    // Compute chart data for percentiles with bands
    const percentileChartData = useMemo(() => {
        if (!hasResults) return { data: [], layout: {}, config: PLOTLY_CONFIG };
        const chartData = preparePercentileChartData(results, primaryPercentile, color, precision, simulationInfo, units, decimalStorage);
        const enhancedData = chartData.data.map(trace => ({
            ...trace,
            hovertemplate: trace.name.includes('-')
                ? `Year: %{x}<br>Range: ${trace.name} <br>Value: %{y:.2f}${units ? ` ${units}` : ''}<extra></extra>`
                : `Year: %{x}<br>${trace.name}: %{y:.2f}${units ? ` ${units}` : ''}<extra></extra>`
        }));
        return {
            data: enhancedData,
            layout: chartData.layout,
            config: PLOTLY_CONFIG
        };
    }, [hasResults, results, primaryPercentile, color, precision, units, simulationInfo, decimalStorage]);

    // Lazily prepare table data for percentiles only when visible
    const { columns: percentileColumns, data: percentileTableData } = useMemo(() => {
        if (!hasResults || !dataTableVisible) return { columns: [], data: [] };
        const tableInfo = generatePercentileTableData(results, primaryPercentile, color, precision, decimalStorage);
        const formattedColumns = tableInfo.columns.map(column => {
            if (column.dataIndex !== 'year') {
                return {
                    ...column,
                    render: (text) => {
                        const displayValue = decimalStorage ? text * 100 : text;
                        const formattedValue = formatNumber(displayValue, precision || 2);
                        return units ? `${formattedValue} ${units}` : formattedValue;
                    }
                };
            }
            return column;
        });
        return { columns: formattedColumns, data: tableInfo.data };
    }, [hasResults, dataTableVisible, results, primaryPercentile, color, precision, units, decimalStorage]);

    // Customize Plotly layout
    const customizedLayout = useMemo(() => ({
        ...percentileChartData.layout,
        height,
        yaxis: {
            ...(percentileChartData.layout.yaxis || {}),
            title: units ? `${units}` : '',
            hoverformat: decimalStorage ? `,.${precision || 2}f` : (precision !== null && Number.isInteger(precision) && precision >= 0 ? `,.${precision}f` : undefined),
            tickformat: decimalStorage ? `,.${precision || 2}f` : (precision !== null && Number.isInteger(precision) && precision >= 0 ? `,.${precision}f` : ',~s')
        },
        xaxis: {
            ...(percentileChartData.layout.xaxis || {}),
            tickformat: ',d',
            hoverformat: ',d'
        },
        margin: {
            ...(percentileChartData.layout.margin || {}),
            r: 100
        },
        ...extraLayoutOptions
    }), [percentileChartData.layout, height, units, precision, extraLayoutOptions]);

    // Handle empty results
    if (!hasResults) {
        return <Empty description="No simulation results available" style={{ padding: '40px 0' }} />;
    }

    return (
        <>
            <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                    <Plot
                        data={percentileChartData.data}
                        layout={customizedLayout}
                        config={percentileChartData.config}
                        style={{ width: '100%' }}
                    />
                </div>
                {summaryData.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        right: -10, // Adjusted to prevent overlap
                        top: 40,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        background: 'rgba(255,255,255,0.85)',
                        padding: '6px 4px',
                        borderRadius: '4px',
                        boxShadow: '0 0 4px rgba(0,0,0,0.1)',
                        fontSize: '10px'
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
                                    fontWeight: 'bold',
                                    width: '24px',
                                    color: summary.isPrimary ? color : '#666'
                                }}>
                                    P{summary.percentile}
                                </div>
                                <div style={{
                                    fontWeight: summary.isPrimary ? 'bold' : 'normal',
                                    color: summary.isPrimary ? color : '#333'
                                }}>
                                    {formatCompactNumber(decimalStorage ? summary.mean * 100 : summary.mean, precision || 2)}
                                    {units && <span style={{ marginLeft: '2px' }}>{units}</span>}
                                </div>
                            </div>
                        ))}
                        {summaryData[0]?.t0Value !== undefined && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px 4px',
                                borderRadius: '3px'
                            }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    width: '24px',
                                    color: '#666'
                                }}>
                                    T=0
                                </div>
                                <div style={{ color: '#333' }}>
                                    {formatCompactNumber(decimalStorage ? summaryData[0].t0Value * 100 : summaryData[0].t0Value, precision || 2)}
                                    {units && <span style={{ marginLeft: '2px' }}>{units}</span>}
                                </div>
                            </div>
                        )}
                        <div style={{
                            color: '#999',
                            textAlign: 'center',
                            marginTop: '2px'
                        }}>
                            mean
                        </div>
                    </div>
                )}
            </div>
            {dataTableVisible && (
                <>
                    <Divider style={{ margin: '12px 0 8px 0' }} />
                    <Table
                        columns={percentileColumns}
                        dataSource={percentileTableData}
                        size="small"
                        pagination={false}
                        scroll={{ x: 'max-content', y: 300 }}
                        bordered
                    />
                </>
            )}
        </>
    );
});

export default PercentileChart;
