// frontend/src/utils/charts/financial.js - Generic financial chart utilities
import { getFinancialColorScheme, getSemanticColor } from './colors';

/**
 * Prepare financial time-series chart data (generic utility)
 * @param {Object} params - Chart parameters  
 * @param {Array} params.timeSeriesData - Time-series financial data
 * @param {string} params.chartType - Chart type ('line', 'bar', 'area')
 * @param {Object} params.options - Chart options
 * @returns {Object} Plotly chart data and layout
 */
export const prepareFinancialTimeSeriesChart = ({
    timeSeriesData,
    chartType = 'line',
    options = {}
}) => {
    const {
        title = '',
        xAxisTitle = 'Year',
        yAxisTitle = 'Value',
        showGrid = true,
        colors = [],
        height = 400
    } = options;

    if (!timeSeriesData || !timeSeriesData.length) {
        return null;
    }

    const traces = timeSeriesData.map((series, index) => ({
        type: chartType === 'line' ? 'scatter' : chartType,
        mode: chartType === 'line' ? 'lines+markers' : undefined,
        x: series.data.map(d => d.year),
        y: series.data.map(d => d.value),
        name: series.name,
        line: chartType === 'line' ? {
            color: colors[index] || getFinancialColorScheme(series.category),
            width: 2
        } : undefined,
        marker: {
            color: colors[index] || getFinancialColorScheme(series.category),
            size: chartType === 'line' ? 6 : undefined
        }
    }));

    const layout = {
        title: title,
        xaxis: {
            title: xAxisTitle,
            showgrid: showGrid,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: yAxisTitle,
            showgrid: showGrid,
            gridcolor: '#f0f0f0'
        },
        height: height,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: '#ffffff',
        font: { family: 'Inter, -apple-system, sans-serif', size: 12 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };

    return { data: traces, layout, config };
};

/**
 * Format financial values for display
 * @param {number} value - Financial value
 * @param {string} units - Value units ('currency', 'percentage', 'ratio', 'number')
 * @param {Object} options - Formatting options
 * @returns {string} Formatted value
 */
export const formatFinancialValue = (value, units, options = {}) => {
    const {
        precision = 2,
        currency = 'USD',
        compact = false,
        locale = 'en-US'
    } = options;

    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }

    switch (units) {
        case 'currency':
            if (compact && Math.abs(value) >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
            }
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : precision
            }).format(value);

        case 'percentage':
            return `${(value * 100).toFixed(precision)}%`;

        case 'ratio':
            return `${value.toFixed(precision)}x`;

        case 'number':
            return new Intl.NumberFormat(locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            }).format(value);

        default:
            return value.toFixed(precision);
    }
};

/**
 * Create financial chart color scheme for multiple series
 * @param {Array} seriesNames - Array of series names/categories
 * @param {Object} options - Color options
 * @returns {Array} Array of colors
 */
export const createFinancialColorScheme = (seriesNames, options = {}) => {
    const { useSemanticColors = true } = options;

    if (useSemanticColors) {
        return seriesNames.map(name => {
            // Map common financial terms to semantic colors
            const colorMap = {
                revenue: getFinancialColorScheme('revenue'),
                cost: getFinancialColorScheme('cost'),
                profit: getFinancialColorScheme('profit'),
                loss: getFinancialColorScheme('loss'),
                cashflow: getSemanticColor('primary'),
                debt: getSemanticColor('warning'),
                equity: getSemanticColor('success')
            };

            const lowerName = name.toLowerCase();
            for (const [key, color] of Object.entries(colorMap)) {
                if (lowerName.includes(key)) {
                    return color;
                }
            }

            return getSemanticColor('neutral', 6);
        });
    }

    // Fallback to generic color generation
    return seriesNames.map((_, index) => {
        const colors = ['#1890ff', '#52c41a', '#fa541c', '#722ed1', '#13c2c2'];
        return colors[index % colors.length];
    });
};

/**
 * Prepare dual-axis financial chart (e.g., cash flow + ratios)
 * @param {Object} params - Chart parameters
 * @param {Array} params.primarySeries - Primary axis data
 * @param {Array} params.secondarySeries - Secondary axis data  
 * @param {Object} params.options - Chart options
 * @returns {Object} Plotly chart data and layout
 */
export const prepareDualAxisFinancialChart = ({
    primarySeries,
    secondarySeries,
    options = {}
}) => {
    const {
        primaryAxisTitle = 'Primary',
        secondaryAxisTitle = 'Secondary',
        height = 400,
        title = ''
    } = options;

    const primaryTraces = primarySeries.map(series => ({
        ...series,
        yaxis: 'y'
    }));

    const secondaryTraces = secondarySeries.map(series => ({
        ...series,
        yaxis: 'y2'
    }));

    const layout = {
        title: title,
        xaxis: { title: 'Year' },
        yaxis: {
            title: primaryAxisTitle,
            side: 'left'
        },
        yaxis2: {
            title: secondaryAxisTitle,
            side: 'right',
            overlaying: 'y'
        },
        height: height,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: '#ffffff'
    };

    return {
        data: [...primaryTraces, ...secondaryTraces],
        layout,
        config: {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        }
    };
};

/**
 * Calculate financial chart tick format based on value range
 * @param {Array} values - Array of values
 * @param {string} units - Value units
 * @returns {string} Plotly tick format string
 */
export const calculateFinancialTickFormat = (values, units) => {
    if (!values || !values.length) return '.2f';

    const maxValue = Math.max(...values.map(v => Math.abs(v)));

    switch (units) {
        case 'currency':
            if (maxValue >= 1e9) return '$,.0s';  // Billions
            if (maxValue >= 1e6) return '$,.1s';  // Millions  
            if (maxValue >= 1e3) return '$,.0f';  // Thousands
            return '$,.2f';

        case 'percentage':
            return '.1%';

        case 'ratio':
            return '.2f';

        default:
            if (maxValue >= 1e6) return ',.0s';
            if (maxValue >= 1e3) return ',.0f';
            return '.2f';
    }
};