// src/components/charts/StatisticsChart.jsx

import React, { useMemo } from 'react';
import { Divider, Empty, Table } from 'antd';
import Plot from 'react-plotly.js';
import { formatNumber, formatCompactNumber } from '../../utils/formatUtils';
import { generateStatisticsTableData, prepareStatisticsBoxPlotData } from '../../utils/chartUtils';

const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };

/**
 * Converts decimal values to display values based on units.
 * When units="%", multiplies values by 100 for proper percentage display.
 * @param {number|null|undefined} value - The value to convert
 * @param {string} units - The units (e.g., "%", "MWh")
 * @returns {number|null|undefined} Converted value for display
 */
const convertValueForDisplay = (value, units) => {
    return units === "%" ? (value != null ? value * 100 : value) : value;
};

// Component for rendering statistics box plot and table
/**
 * Renders a statistics box plot and optional table for simulation results.
 * @param {Object} props - Component props
 * @param {Object} props.simulationInfo - SimulationInfoSchema object with statistics
 * @param {number} props.primaryPercentile - Primary percentile value (ignored)
 * @param {string} props.color - Chart color
 * @param {string} props.units - Units for display (e.g., 'MWh')
 * @param {number|null} props.precision - Decimal precision (null for Plotly default)
 * @param {number} props.height - Chart height
 * @param {Object} props.extraLayoutOptions - Additional Plotly layout options
 * @param {boolean} props.dataTableVisible - Whether to show the data table
 * @param {Function} props.toggleTableVisibility - Toggles table visibility
 * @returns {JSX.Element} Statistics box plot and table
 */
const StatisticsChart = React.memo(({
    simulationInfo,
    primaryPercentile,
    color,
    units,
    precision,
    height,
    extraLayoutOptions,
    dataTableVisible,
    toggleTableVisibility
}) => {
    // Extract statistics and check validity
    const statistics = simulationInfo?.statistics || {};
    const hasResults = simulationInfo?.results?.length > 0 && Object.keys(statistics).length > 0;

    // Compute box plot data for statistics
    const statsChartData = useMemo(() => {
        if (!hasResults) return { data: [], layout: {}, config: PLOTLY_CONFIG };
        const chartData = prepareStatisticsBoxPlotData(statistics, color, precision, units);
        // Convert y values for percentage display in box plot data
        const convertedData = chartData.data.map(trace => ({
            ...trace,
            y: trace.y ? trace.y.map(value => convertValueForDisplay(value, units)) : trace.y
        }));
        return {
            ...chartData,
            data: convertedData
        };
    }, [hasResults, statistics, color, precision, units]);

    // Lazily prepare table data for statistics only when visible
    const { columns: statsColumns, data: statsTableData } = useMemo(() => {
        if (!hasResults || !dataTableVisible) return { columns: [], data: [] };
        const tableInfo = generateStatisticsTableData(statistics, color, precision);
        const formattedColumns = tableInfo.columns.map(column => ({
            ...column,
            render: (text) => {
                const convertedValue = convertValueForDisplay(text, units);
                return formatNumber(convertedValue, precision);
            }
        }));
        // Convert table data values for percentage display
        const convertedTableData = tableInfo.data.map(row => {
            const convertedRow = { ...row };
            Object.keys(convertedRow).forEach(key => {
                if (key !== 'year' && key !== 'key') {
                    convertedRow[key] = convertValueForDisplay(convertedRow[key], units);
                }
            });
            return convertedRow;
        });
        return { columns: formattedColumns, data: convertedTableData };
    }, [hasResults, dataTableVisible, statistics, color, precision, units]);

    // Compute summary statistics for right-side box
    const summaryStats = useMemo(() => {
        if (!hasResults) return null;
        const stats = {
            mean: statistics.mean.reduce((sum, point) => sum + point.value, 0) / (statistics.mean.length || 1),
            stdDev: statistics.stdDev.reduce((sum, point) => sum + point.value, 0) / (statistics.stdDev.length || 1),
            min: statistics.min.reduce((min, point) => Math.min(min, point.value), Infinity),
            max: statistics.max.reduce((max, point) => Math.max(max, point.value), -Infinity)
        };
        // Convert values for percentage display
        return {
            mean: convertValueForDisplay(stats.mean, units),
            stdDev: convertValueForDisplay(stats.stdDev, units),
            min: convertValueForDisplay(stats.min, units),
            max: convertValueForDisplay(stats.max, units)
        };
    }, [hasResults, statistics, units]);

    // Customize Plotly layout
    const customizedLayout = useMemo(() => ({
        ...statsChartData.layout,
        height,
        yaxis: {
            ...(statsChartData.layout.yaxis || {}),
            title: units,
            hoverformat: precision !== null && Number.isInteger(precision) && precision >= 0 ? `,.${precision}f` : undefined,
            tickformat: precision !== null && Number.isInteger(precision) && precision >= 0 ? `,.${precision}f` : ',~s'
        },
        xaxis: {
            ...(statsChartData.layout.xaxis || {}),
            tickformat: ',d',
            hoverformat: ',d'
        },
        margin: {
            ...(statsChartData.layout.margin || {}),
            r: 100
        },
        ...extraLayoutOptions
    }), [statsChartData.layout, height, units, precision, extraLayoutOptions]);

    // Handle empty statistics
    if (!hasResults) {
        return <Empty description="No simulation results available" style={{ padding: '40px 0' }} />;
    }

    return (
        <>
            <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                    <Plot
                        data={statsChartData.data}
                        layout={customizedLayout}
                        config={statsChartData.config}
                        style={{ width: '100%' }}
                    />
                </div>
                {summaryStats && (
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
                        {[
                            { label: 'Mean', value: summaryStats.mean },
                            { label: 'σ', value: summaryStats.stdDev },
                            { label: 'Min', value: summaryStats.min },
                            { label: 'Max', value: summaryStats.max }
                        ].map(stat => (
                            <div key={stat.label} style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px 4px',
                                borderRadius: '3px'
                            }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    width: '28px',
                                    color: '#666'
                                }}>
                                    {stat.label}
                                </div>
                                <div style={{ color: '#333' }}>
                                    {formatCompactNumber(stat.value, precision || 2)}
                                    {units && <span style={{ marginLeft: '2px' }}>{units}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {dataTableVisible && (
                <>
                    <Divider style={{ margin: '12px 0 8px 0' }} />
                    <Table
                        columns={statsColumns}
                        dataSource={statsTableData}
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

export default StatisticsChart;