import { hexToRgb } from './plotUtils';

/**
 * Generate table data for statistics
 * @param {Object} statistics - Statistics object with mean, stdDev, min, max, skewness, kurtosis arrays
 * @param {string} color - Base color (hex)
 * @param {number} precision - Decimal precision
 * @returns {Object} Object with columns and data for the table
 */
export const generateStatisticsTableData = (statistics, color, precision) => {
    if (!statistics || !statistics.mean || !statistics.mean.length) {
        return { columns: [], data: [] };
    }

    // Get array of all years from mean data
    const allYears = statistics.mean.map(d => d.year);

    // Create columns for the table
    const columns = [
        {
            title: 'Year',
            dataIndex: 'year',
            key: 'year',
            fixed: 'left',
            width: 70
        },
        {
            title: 'Mean',
            dataIndex: 'mean',
            key: 'mean',
            render: (text) => text !== null ? Number(text).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }) : '-',
            onHeaderCell: () => ({ style: { fontWeight: 'bold', background: `rgba(${hexToRgb(color)}, 0.1)` } }),
            onCell: () => ({ style: { background: `rgba(${hexToRgb(color)}, 0.05)` } })
        },
        {
            title: 'Std Dev',
            dataIndex: 'stdDev',
            key: 'stdDev',
            render: (text) => text !== null ? Number(text).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }) : '-'
        },
        {
            title: 'Min',
            dataIndex: 'min',
            key: 'min',
            render: (text) => text !== null ? Number(text).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }) : '-'
        },
        {
            title: 'Max',
            dataIndex: 'max',
            key: 'max',
            render: (text) => text !== null ? Number(text).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }) : '-'
        },
        {
            title: 'Skewness',
            dataIndex: 'skewness',
            key: 'skewness',
            render: (text) => text !== null ? Number(text).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }) : '-'
        },
        {
            title: 'Kurtosis',
            dataIndex: 'kurtosis',
            key: 'kurtosis',
            render: (text) => text !== null ? Number(text).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }) : '-'
        }
    ];

    // Create data for the table
    const data = allYears.map(year => {
        const rowData = { key: year, year };

        // Add values for each statistic
        ['mean', 'stdDev', 'min', 'max', 'skewness', 'kurtosis'].forEach(stat => {
            const statData = statistics[stat].find(d => d.year === year);
            rowData[stat] = statData ? statData.value : null;
        });

        return rowData;
    });

    return { columns, data };
};

/**
 * Prepare Plotly chart data for statistics box plot
 * @param {Object} statistics - Statistics object with mean, stdDev, min, max, skewness, kurtosis arrays
 * @param {string} baseColor - Base color for the chart (hex)
 * @param {number} precision - Decimal precision for hover labels
 * @param {string} units - Units for y-axis (e.g., 'm/s')
 * @returns {Object} Plotly data, layout, and config
 */
export const prepareStatisticsBoxPlotData = (statistics, baseColor, precision = 2, units = '') => {
    if (!statistics || !statistics.mean || !statistics.mean.length) {
        return { data: [], layout: {}, config: {} };
    }

    const years = statistics.mean.map(d => d.year);
    const traces = [];

    // Create box plot trace for each year
    years.forEach(year => {
        const yearStats = {
            mean: statistics.mean.find(d => d.year === year)?.value || null,
            stdDev: statistics.stdDev.find(d => d.year === year)?.value || null,
            min: statistics.min.find(d => d.year === year)?.value || null,
            max: statistics.max.find(d => d.year === year)?.value || null
        };

        // Validate data
        if (yearStats.mean !== null && yearStats.stdDev !== null && yearStats.min !== null && yearStats.max !== null) {
            // Ensure valid box boundaries
            const q1 = Math.max(yearStats.min, yearStats.mean - yearStats.stdDev);
            const q3 = Math.min(yearStats.max, yearStats.mean + yearStats.stdDev);
            //const q1 = yearStats.min;
            //const q3 = yearStats.max;

            traces.push({
                x: [year],
                y: [yearStats.mean], // Use mean as the central value
                type: 'box',
                boxmean: 'sd', // Show mean and stdDev
                lowerfence: [yearStats.min],
                upperfence: [yearStats.max],
                q1: [q1],
                q3: [q3],
                median: [yearStats.mean],
                sd: [yearStats.stdDev],
                name: `Year ${year}`,
                boxpoints: false,
                line: { color: baseColor, width: 2 },
                fillcolor: `rgba(${hexToRgb(baseColor)}, 0.3)`,
                hovertemplate: `Year: ${year}<br>Mean: ${yearStats.mean.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision })} ${units}<br>StdDev: ${yearStats.stdDev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision })} ${units}<br>Min: ${yearStats.min.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision })} ${units}<br>Max: ${yearStats.max.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: precision })} ${units}<extra></extra>`
            });
        }
    });

    // Layout for the box plot
    const layout = {
        autosize: true,
        height: 300,
        margin: { l: 50, r: 80, t: 10, b: 40 },
        xaxis: {
            title: 'Year',
            showgrid: true,
            zeroline: false,
            tickformat: ',d'
        },
        yaxis: {
            title: units,
            showgrid: true,
            autorange: true, // Adapt to data range
            rangemode: 'tozero', // Start at 0 for non-negative distributions
            tickformat: `,.${precision}f`
        },
        showlegend: false, // No legend needed for per-year boxes
        hovermode: 'closest'
    };

    // Configuration options
    const config = {
        responsive: true,
        displayModeBar: false
    };
    console.log('Generated traces:', traces);
    return { data: traces, layout, config };
};

// Export utilities
export const PlotStatisticsUtils = {
    generateStatisticsTableData,
    prepareStatisticsBoxPlotData
};