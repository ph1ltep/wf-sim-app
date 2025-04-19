// src/utils/chartUtils.js

import { organizePercentiles, hexToRgb } from './plotUtils';
import { formatNumber } from './formatUtils';
import { DistributionUtils } from './distributions';

/**
 * Generates table data for percentile charts.
 * @param {Array} results - Array of SimResultsSchema objects
 * @param {number} primaryPercentile - Primary percentile value
 * @param {string} color - Chart color
 * @param {number|null} precision - Decimal precision (null for default)
 * @returns {Object} Table columns and data
 */
export function generatePercentileTableData(results, primaryPercentile, color, precision) {
    if (!results || !results.length) return { columns: [], data: [] };

    // Sort results by percentile value
    const sortedResults = [...results].sort((a, b) => a.percentile.value - b.percentile.value);

    // Define columns: year and one for each percentile
    const columns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            fixed: 'left',
            width: 80,
            onHeaderCell: () => ({
                style: {
                    backgroundColor: '#f0f0f0',
                    fontWeight: 'bold'
                }
            }),
            onCell: () => ({
                style: {
                    backgroundColor: '#f0f0f0',
                    fontWeight: 'bold'
                }
            })
        },
        ...sortedResults.map(result => ({
            title: `P${result.percentile.value} `,
            dataIndex: `P${result.percentile.value} `,
            key: `P${result.percentile.value} `,
            render: (text) => formatNumber(text, precision),
            onHeaderCell: () => result.percentile.value === primaryPercentile
                ? { style: { backgroundColor: `rgba(${hexToRgb(color)}, 0.2)` } }
                : {}
        }))
    ];

    // Generate table data: one row per year
    const years = [...new Set(sortedResults.flatMap(result => result.data.map(point => point.year)))].sort((a, b) => a - b);
    const data = years.map((year, index) => {
        const row = { key: index, year };
        sortedResults.forEach(result => {
            const point = result.data.find(p => p.year === year);
            row[`P${result.percentile.value} `] = point ? point.value : null;
        });
        return row;
    });

    return { columns, data };
}

/**
 * Generates table data for statistics box plots.
 * @param {Object} statistics - Statistics object with mean, stdDev, etc.
 * @param {string} color - Chart color
 * @param {number|null} precision - Decimal precision (null for default)
 * @returns {Object} Table columns and data
 */
export function generateStatisticsTableData(statistics, color, precision) {
    if (!statistics || !Object.keys(statistics).length) return { columns: [], data: [] };

    const columns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            fixed: 'left',
            width: 80,
            onHeaderCell: () => ({
                style: {
                    backgroundColor: '#f0f0f0',
                    fontWeight: 'bold'
                }
            }),
            onCell: () => ({
                style: {
                    backgroundColor: '#f0f0f0',
                    fontWeight: 'bold'
                }
            })
        },
        { title: 'Mean', dataIndex: 'mean', key: 'mean' },
        { title: 'σ (Std Dev)', dataIndex: 'stdDev', key: 'stdDev' },
        { title: 'Min', dataIndex: 'min', key: 'min' },
        { title: 'Max', dataIndex: 'max', key: 'max' },
        { title: 'Skewness', dataIndex: 'skewness', key: 'skewness' },
        { title: 'Kurtosis', dataIndex: 'kurtosis', key: 'kurtosis' }
    ];

    const data = statistics.mean.map((point, index) => ({
        key: index,
        year: point.year,
        mean: point.value,
        stdDev: statistics.stdDev[index]?.value ?? null,
        min: statistics.min[index]?.value ?? null,
        max: statistics.max[index]?.value ?? null,
        skewness: statistics.skewness[index]?.value ?? null,
        kurtosis: statistics.kurtosis[index]?.value ?? null
    }));

    return { columns, data };
}

/**
 * Prepares summary data for percentile charts.
 * @param {Array} results - Array of SimResultsSchema objects
 * @param {number} primaryPercentile - Primary percentile value
 * @param {number|null} precision - Decimal precision (null for default)
 * @param {number} [t0Value] - T=0 value from distribution parameters
 * @returns {Array} Summary data for display
 */
export function prepareSummaryData(results, primaryPercentile, precision, t0Value) {
    if (!results || !results.length) return [];

    return results.map(result => {
        const mean = result.data.reduce((sum, point) => sum + point.value, 0) / (result.data.length || 1);
        return {
            percentile: result.percentile.value,
            mean,
            isPrimary: result.percentile.value === primaryPercentile,
            t0Value
        };
    });
}

/**
 * Prepares chart data for percentile charts with bands.
 * @param {Array} results - Array of SimResultsSchema objects
 * @param {number} primaryPercentile - Primary percentile value
 * @param {string} color - Chart color
 * @param {number|null} precision - Decimal precision (null for default)
 * @param {Object} simulationInfo - SimulationInfoSchema object for distribution parameters
 * @returns {Object} Plotly chart data and layout
 */
export function preparePercentileChartData(results, primaryPercentile, color, precision, simulationInfo) {
    if (!results || !results.length) return { data: [], layout: {}, config: {} };

    // Organize percentiles into bands
    const organized = organizePercentiles(results, primaryPercentile);
    const data = [];

    // Add band traces (filled areas between pairs)
    const pairs = organized.percentilePairs || [];
    pairs.forEach(pair => {
        if (pair.lower && pair.upper) {
            const lower = pair.lower.data.map(point => point.value);
            const upper = pair.upper.data.map(point => point.value);
            // Upper trace
            data.push({
                x: pair.upper.data.map(point => point.year),
                y: upper,
                type: 'scatter',
                mode: 'lines',
                line: { color: 'transparent' },
                name: pair.name,
                showlegend: false
            });
            // Lower trace with fill to previous
            data.push({
                x: pair.lower.data.map(point => point.year),
                y: lower,
                type: 'scatter',
                mode: 'lines',
                fill: 'tonexty',
                fillcolor: `${color}${Math.round(pair.opacity * 255).toString(16).padStart(2, '0')} `,
                line: { color: 'transparent' },
                name: `P${pair.lower.percentile.value} `,
                showlegend: false
            });
        }
    });

    // Add primary percentile trace with markers
    const primary = organized.primary;
    if (primary) {
        data.push({
            x: primary.data.map(point => point.year),
            y: primary.data.map(point => point.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: `P${primary.percentile.value} `,
            line: { color, width: 2 },
            marker: { size: 6, color },
            showlegend: false
        });
    }

    // Add single percentile traces
    const singles = organized.singles || [];
    singles.forEach(single => {
        data.push({
            x: single.data.map(point => point.year),
            y: single.data.map(point => point.value),
            type: 'scatter',
            mode: 'lines',
            name: `P${single.percentile.value} `,
            line: { color: `${color} 80`, width: 1 },
            showlegend: false
        });
    });

    // Add T=0 value line
    if (simulationInfo?.distribution?.parameters?.value !== undefined) {
        const t0Value = simulationInfo.distribution.parameters.value;
        const years = results[0].data.map(point => point.year);
        data.push({
            x: years,
            y: Array(years.length).fill(t0Value),
            type: 'scatter',
            mode: 'lines',
            name: 'T=0',
            line: { color: `${color} 40`, width: 1, dash: 'dash' },
            showlegend: false
        });
    }

    const layout = {
        xaxis: { title: 'Year', dtick: 1 },
        yaxis: { title: '' },
        showlegend: true,
        margin: { t: 40, b: 40, l: 40, r: 100 }
    };

    return { data, layout, config: { responsive: true } };
}

/**
 * Prepares chart data for statistics box plots.
 * @param {Object} statistics - Statistics object with mean, stdDev, etc.
 * @param {string} color - Chart color
 * @param {number|null} precision - Decimal precision (null for default)
 * @param {string} units - Units for display
 * @returns {Object} Plotly chart data and layout
 */
export function prepareStatisticsBoxPlotData(statistics, color, precision, units) {
    if (!statistics || !Object.keys(statistics).length) return { data: [], layout: {}, config: {} };

    const data = statistics.mean.map((meanPoint, index) => ({
        y: [
            statistics.min[index]?.value ?? meanPoint.value,
            meanPoint.value - (statistics.stdDev[index]?.value ?? 0),
            meanPoint.value,
            meanPoint.value + (statistics.stdDev[index]?.value ?? 0),
            statistics.max[index]?.value ?? meanPoint.value
        ],
        type: 'box',
        name: `Year ${meanPoint.year} `,
        boxpoints: false,
        marker: { color },
        line: { color }
    }));

    const layout = {
        xaxis: { title: 'Year', dtick: 1 },
        yaxis: { title: units },
        showlegend: false,
        margin: { t: 40, b: 40, l: 40, r: 100 }
    };

    return { data, layout, config: { responsive: true } };
}

/**
 * Generates metadata for a distribution based on DistributionTypeSchema.
 * @param {Object} distribution - DistributionTypeSchema object
 * @returns {Object} Metadata with name and applicable parameters
 */
export function generateDistributionMetadata(distribution) {
    if (!distribution || !distribution.type) return { name: 'Unknown', parameters: {} };

    const metadata = DistributionUtils.getMetadata(distribution.type) || { parameters: [] };
    const parameters = {};

    metadata.parameters?.forEach(param => {
        if (distribution.parameters && distribution.parameters[param.name] !== undefined) {
            parameters[param.name] = distribution.parameters[param.name];
        }
    });

    return {
        name: metadata.name || distribution.type.charAt(0).toUpperCase() + distribution.type.slice(1),
        parameters
    };
}
