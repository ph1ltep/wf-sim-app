// src/utils/chartUtils.js

import { organizePercentiles } from './plotUtils';
import { hexToRgb } from './charts';
import { formatNumber } from './formatUtils';
import { DistributionUtils } from './distributions';

/**
 * Generates table data for percentile charts.
 * @param {Array} results - Array of SimResultsSchema objects
 * @param {number} primaryPercentile - Primary percentile value
 * @param {string} color - Chart color
 * @param {number|null} precision - Decimal precision (null for default)
 * @param {boolean} [decimalStorage=false] - Whether data is stored as decimals but should display as percentages
 * @returns {Object} Table columns and data
 */
export function generatePercentileTableData(results, primaryPercentile, color, precision, decimalStorage = false) {
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
            const rawValue = point ? point.value : null;
            // Apply decimal storage conversion if needed
            row[`P${result.percentile.value} `] = rawValue !== null && decimalStorage ? rawValue * 100 : rawValue;
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
 * @param {boolean} [decimalStorage=false] - Whether data is stored as decimals but should display as percentages
 * @returns {Object} Table columns and data
 */
export function generateStatisticsTableData(statistics, color, precision, decimalStorage = false) {
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

    const data = statistics.mean.map((point, index) => {
        // Apply decimal storage conversion if needed
        const convertValue = (val) => val !== null && decimalStorage ? val * 100 : val;
        
        return {
            key: index,
            year: point.year,
            mean: convertValue(point.value),
            stdDev: convertValue(statistics.stdDev[index]?.value ?? null),
            min: convertValue(statistics.min[index]?.value ?? null),
            max: convertValue(statistics.max[index]?.value ?? null),
            skewness: convertValue(statistics.skewness[index]?.value ?? null),
            kurtosis: convertValue(statistics.kurtosis[index]?.value ?? null)
        };
    });

    return { columns, data };
}

/**
 * Prepares summary data for percentile charts.
 * @param {Array} results - Array of SimResultsSchema objects
 * @param {number} primaryPercentile - Primary percentile value
 * @param {number|null} precision - Decimal precision (null for default)
 * @param {number} [t0Value] - T=0 value from distribution parameters
 * @param {boolean} [decimalStorage=false] - Whether data is stored as decimals but should display as percentages
 * @returns {Array} Summary data for display
 */
export function prepareSummaryData(results, primaryPercentile, precision, t0Value, decimalStorage = false) {
    if (!results || !results.length) return [];

    // Calculate mean for each result and sort by actual result values (lowest to highest)
    const resultsWithMeans = results.map(result => {
        const rawMean = result.data.reduce((sum, point) => sum + point.value, 0) / (result.data.length || 1);
        return {
            percentile: result.percentile.value,
            mean: rawMean, // Keep raw values for internal calculations
            isPrimary: result.percentile.value === primaryPercentile,
            t0Value: t0Value // Keep raw t0Value for internal calculations
        };
    });

    // Sort by mean value (ascending)
    return resultsWithMeans.sort((a, b) => b.mean - a.mean); // switch a and b to sort descending
}

/**
 * Prepares chart data for percentile charts with bands.
 * @param {Array} results - Array of SimResultsSchema objects
 * @param {number} primaryPercentile - Primary percentile value
 * @param {string} color - Chart color
 * @param {number|null} precision - Decimal precision (null for default)
 * @param {Object} simulationInfo - SimulationInfoSchema object for distribution parameters
 * @param {string} units - Units for display
 * @param {boolean} [decimalStorage=false] - Whether data is stored as decimals but should display as percentages
 * @returns {Object} Plotly chart data and layout
 */
export function preparePercentileChartData(results, primaryPercentile, color, precision, simulationInfo, units, decimalStorage = false) {
    if (!results || !results.length) return { data: [], layout: {}, config: {} };

    // Organize percentiles into bands
    const organized = organizePercentiles(results, primaryPercentile);
    const data = [];

    // Add band traces (filled areas between pairs)
    const pairs = organized.percentilePairs || [];
    pairs.forEach(pair => {
        if (pair.lower && pair.upper) {
            const lower = pair.lower.data.map(point => decimalStorage ? point.value * 100 : point.value);
            const upper = pair.upper.data.map(point => decimalStorage ? point.value * 100 : point.value);
            // Upper trace
            data.push({
                x: pair.upper.data.map(point => point.year),
                y: upper,
                type: 'scatter',
                mode: 'lines',
                line: { color: 'transparent' },
                name: pair.name,
                showlegend: false,
                hovertemplate: units ? '%{y:.2f}%<extra></extra>' : '%{y}<extra></extra>'
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
                showlegend: false,
                hovertemplate: units ? '%{y:.2f}%<extra></extra>' : '%{y}<extra></extra>'
            });
        }
    });

    // Add primary percentile trace with markers
    const primary = organized.primary;
    if (primary) {
        data.push({
            x: primary.data.map(point => point.year),
            y: primary.data.map(point => decimalStorage ? point.value * 100 : point.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: `P${primary.percentile.value} `,
            line: { color, width: 2 },
            marker: { size: 6, color },
            showlegend: false,
            hovertemplate: units ? '%{y:.2f}%<extra></extra>' : '%{y}<extra></extra>'
        });
    }

    // Add single percentile traces
    const singles = organized.singles || [];
    singles.forEach(single => {
        data.push({
            x: single.data.map(point => point.year),
            y: single.data.map(point => decimalStorage ? point.value * 100 : point.value),
            type: 'scatter',
            mode: 'lines',
            name: `P${single.percentile.value} `,
            line: { color: `${color} 80`, width: 1 },
            showlegend: false,
            hovertemplate: units ? '%{y:.2f}%<extra></extra>' : '%{y}<extra></extra>'
        });
    });

    // Add T=0 value line
    if (simulationInfo?.distribution?.parameters?.value !== undefined) {
        const t0Value = simulationInfo.distribution.parameters.value;
        const displayT0Value = decimalStorage ? t0Value * 100 : t0Value;
        const years = results[0].data.map(point => point.year);
        data.push({
            x: years,
            y: Array(years.length).fill(displayT0Value),
            type: 'scatter',
            mode: 'lines',
            name: 'T=0',
            line: { color: `${color} 40`, width: 1, dash: 'dash' },
            showlegend: false,
            hovertemplate: units ? '%{y:.2f}%<extra></extra>' : '%{y}<extra></extra>'
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
 * @param {boolean} [decimalStorage=false] - Whether data is stored as decimals but should display as percentages
 * @returns {Object} Plotly chart data and layout
 */
export function prepareStatisticsBoxPlotData(statistics, color, precision, units, decimalStorage = false) {
    if (!statistics || !Object.keys(statistics).length) return { data: [], layout: {}, config: {} };

    const data = statistics.mean.map((meanPoint, index) => {
        // Apply decimal storage conversion if needed
        const convertValue = (val) => decimalStorage ? val * 100 : val;
        
        return {
            y: [
                convertValue(statistics.min[index]?.value ?? meanPoint.value),
                convertValue(meanPoint.value - (statistics.stdDev[index]?.value ?? 0)),
                convertValue(meanPoint.value),
                convertValue(meanPoint.value + (statistics.stdDev[index]?.value ?? 0)),
                convertValue(statistics.max[index]?.value ?? meanPoint.value)
            ],
            type: 'box',
            name: `Year ${meanPoint.year} `,
            boxpoints: false,
            marker: { color },
            line: { color },
            hovertemplate: units ? '%{y:.2f}%<extra></extra>' : '%{y}<extra></extra>'
        };
    });

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
