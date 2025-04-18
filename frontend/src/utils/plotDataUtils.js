import { hexToRgb } from './plotUtils';

/**
 * Generate table data from simulation results
 * @param {Array<SimResultsSchema>} results - Array of simulation results conforming to SimResultsSchema
 * @param {number} primaryPercentile - Primary percentile value
 * @param {string} color - Base color (hex)
 * @param {number} precision - Decimal precision
 * @returns {Object} Object with columns and data for the table
 */
export const generateTableData = (results, primaryPercentile, color, precision) => {
    if (!results || !results.length) {
        return { columns: [], data: [] };
    }

    // Get array of all years from first result's data
    const allYears = results[0].data.map(d => d.year);

    // Sort results by percentile value (ascending)
    const sortedResults = [...results].sort((a, b) => a.percentile.value - b.percentile.value);

    // Create columns for the table
    const columns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            fixed: 'left',
            width: 70,
        },
        ...sortedResults.map(result => ({
            title: `P${result.percentile.value}`,
            dataIndex: `p${result.percentile.value}`,
            key: `p${result.percentile.value}`,
            render: (text) => text !== undefined ? Number(text).toFixed(precision) : '-',
            // Highlight the primary percentile
            onHeaderCell: () => ({
                style: result.percentile.value === primaryPercentile ?
                    { fontWeight: 'bold', background: `rgba(${hexToRgb(color)}, 0.1)` } : {}
            }),
            onCell: () => ({
                style: result.percentile.value === primaryPercentile ?
                    { fontWeight: 'bold', background: `rgba(${hexToRgb(color)}, 0.05)` } : {}
            })
        })),
        {
            title: 'Mean',
            dataIndex: 'mean',
            key: 'mean',
            fixed: 'right',
            width: 90,
            render: (text) => text !== undefined ? Number(text).toFixed(precision) : '-',
            onHeaderCell: () => ({
                style: { fontWeight: 'bold', background: '#f5f5f5' }
            }),
            onCell: () => ({
                style: { fontWeight: 'bold', background: '#f5f5f5' }
            })
        }
    ];

    // Create data for the table
    const data = allYears.map(year => {
        const rowData = { key: year, year };

        // Add value for each percentile
        sortedResults.forEach(result => {
            const dataPoint = result.data.find(d => d.year === year);
            rowData[`p${result.percentile.value}`] = dataPoint ? dataPoint.value : undefined;
        });

        // Calculate mean across percentiles for this year
        const validValues = Object.entries(rowData)
            .filter(([key, value]) => key.startsWith('p') && value !== undefined)
            .map(([key, value]) => value);

        const mean = validValues.length > 0 ?
            validValues.reduce((sum, value) => sum + value, 0) / validValues.length :
            undefined;

        rowData.mean = mean;

        return rowData;
    });

    return { columns, data };
};

/**
 * Prepare summary data for display
 * @param {Array<SimResultsSchema>} results - Array of simulation results conforming to SimResultsSchema
 * @param {number} primaryPercentile - Primary percentile value
 * @param {number} precision - Decimal precision
 * @returns {Array<Object>} Array of summary objects with percentile and mean values
 */
export const prepareSummaryData = (results, primaryPercentile, precision) => {
    if (!results || !results.length) {
        return [];
    }

    return results.map(result => {
        // Calculate mean of all data points for this percentile
        const data = result.data || [];
        const sum = data.reduce((acc, point) => acc + point.value, 0);
        const mean = data.length > 0 ? sum / data.length : null;

        return {
            percentile: result.percentile.value,
            isPrimary: result.percentile.value === primaryPercentile,
            mean: mean !== null ? Number(mean).toFixed(precision) : 'N/A',
            description: result.percentile.description || '',
            firstValue: data[0] ? Number(data[0].value).toFixed(precision) : 'N/A',
            lastValue: data.length ? Number(data[data.length - 1].value).toFixed(precision) : 'N/A'
        };
    });
};

/**
 * Prepare Plotly chart data specifically for percentile charts
 * @param {Array<SimResultsSchema>} results - Array of simulation results conforming to SimResultsSchema
 * @param {number} primaryPercentile - Primary percentile value
 * @param {string} baseColor - Base color for the chart (hex)
 * @param {number} precision - Decimal precision for hover labels
 * @returns {Object} Plotly data, layout and config
 */
export const preparePercentileChartData = (results, primaryPercentile, baseColor, precision = 2) => {
    if (!results || results.length === 0) return { data: [], layout: {} };

    // Use the organizePercentiles function to get primary, pairs, and singles
    const { primary, percentilePairs, singles } = organizePercentiles(results, primaryPercentile);
    if (!primary) return { data: [], layout: {} };

    // Format for hover templates with custom precision
    const hoverFormat = `.${precision}f`;
    const hoverTemplate = `Year: %{x}<br>Value: %{y:${hoverFormat}}<br>%{text}<extra></extra>`;

    // Plotly traces for each percentile
    const traces = [];

    // Add percentile pairs (shaded areas between percentiles)
    percentilePairs.forEach((pair, index) => {
        if (pair.lower && pair.upper) {
            // Lower bound
            traces.push({
                x: pair.lower.data.map(d => d.year),
                y: pair.lower.data.map(d => d.value),
                text: pair.lower.data.map(() => `P${pair.lower.percentile.value}`),
                name: `P${pair.lower.percentile.value}`,
                line: { color: baseColor, width: 0 },
                showlegend: false,
                hoverinfo: 'none',
            });

            // Upper bound with fill
            traces.push({
                x: pair.upper.data.map(d => d.year),
                y: pair.upper.data.map(d => d.value),
                text: pair.upper.data.map(() => `P${pair.upper.percentile.value}`),
                name: `${pair.name} Band`,
                fill: 'tonexty',
                fillcolor: `rgba(${hexToRgb(baseColor)}, ${pair.opacity})`,
                line: { color: baseColor, width: 0 },
                showlegend: true,
                hovertemplate: hoverTemplate,
            });
        }
    });

    // Add single percentile lines
    singles.forEach(result => {
        traces.push({
            x: result.data.map(d => d.year),
            y: result.data.map(d => d.value),
            text: result.data.map(() => `P${result.percentile.value}`),
            name: `P${result.percentile.value}`,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: baseColor,
                width: 1,
                dash: 'dot'
            },
            showlegend: true,
            hovertemplate: hoverTemplate,
        });
    });

    // Add primary percentile line
    traces.push({
        x: primary.data.map(d => d.year),
        y: primary.data.map(d => d.value),
        text: primary.data.map(() => `P${primary.percentile.value} (Primary)`),
        name: `P${primary.percentile.value} (Primary)`,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: baseColor, width: 3 },
        marker: { size: 6, color: baseColor },
        hovertemplate: hoverTemplate,
    });

    // Base layout for the plot
    const layout = {
        autosize: true,
        height: 300,
        margin: { l: 50, r: 30, t: 10, b: 40 },
        xaxis: {
            title: 'Year',
            showgrid: true,
            zeroline: false
        },
        yaxis: {
            zeroline: false,
            showgrid: true,
            tickformat: `.${precision}f`,
        },
        showlegend: true,
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: -0.2,
            xanchor: 'center',
            x: 0.5
        },
        hovermode: 'closest'
    };

    // Configuration options
    const config = {
        responsive: true,
        displayModeBar: false
    };

    return { data: traces, layout, config };
};

/**
 * Helper function for organizing percentiles
 */
function organizePercentiles(percentileResults, primaryPercentileValue) {
    if (!percentileResults || percentileResults.length === 0) {
        return {
            primary: null,
            percentilePairs: [],
            singles: []
        };
    }

    // Sort percentiles by value (ascending)
    const sorted = [...percentileResults].sort((a, b) => a.percentile.value - b.percentile.value);

    // Find the primary percentile
    const primaryIndex = sorted.findIndex(p => p.percentile.value === primaryPercentileValue);
    const primary = primaryIndex >= 0 ? sorted[primaryIndex] : sorted[Math.floor(sorted.length / 2)];

    // Determine the percentile pairs for visualization
    let percentilePairs = [];
    let singles = [];

    if (sorted.length <= 1) {
        if (sorted.length === 1) {
            singles = [sorted[0]];
        }
    } else if (sorted.length === 2) {
        if (sorted[0].percentile.value === primaryPercentileValue ||
            sorted[1].percentile.value === primaryPercentileValue) {
            percentilePairs = [{
                lower: primaryPercentileValue === sorted[0].percentile.value ? null : sorted[0],
                upper: primaryPercentileValue === sorted[1].percentile.value ? null : sorted[1],
                opacity: 0.3,
                name: `P${sorted[0].percentile.value}-P${sorted[1].percentile.value}`
            }];
        } else {
            singles = sorted;
        }
    } else {
        const withoutPrimary = sorted.filter(p => p.percentile.value !== primary.percentile.value);
        const below = withoutPrimary.filter(p => p.percentile.value < primary.percentile.value);
        const above = withoutPrimary.filter(p => p.percentile.value > primary.percentile.value);
        const maxPairs = Math.min(below.length, above.length);

        for (let i = 0; i < maxPairs; i++) {
            const lowerIndex = below.length - 1 - i;
            const upperIndex = i;
            percentilePairs.push({
                lower: below[lowerIndex],
                upper: above[upperIndex],
                opacity: 0.3 - (i * 0.1),
                name: `P${below[lowerIndex].percentile.value}-P${above[upperIndex].percentile.value}`
            });
        }

        if (below.length > maxPairs) {
            singles = singles.concat(below.slice(0, below.length - maxPairs));
        }
        if (above.length > maxPairs) {
            singles = singles.concat(above.slice(maxPairs));
        }
    }

    return {
        primary,
        percentilePairs,
        singles
    };
}

// Export utilities
export const PlotTableUtils = {
    generateTableData,
    prepareSummaryData,
    preparePercentileChartData
};