// frontend/src/utils/charts/sensitivity/common.js
// Shared utilities for sensitivity analysis charts

/**
 * Prepare base chart configuration common to all sensitivity charts
 * @param {Object} metricConfig - Metric configuration
 * @param {Object} options - Chart options
 * @returns {Object} Base chart configuration
 */
export const getBaseChartConfig = (metricConfig, options = {}) => {
    const {
        responsive = true,
        displayModeBar = true,
        displaylogo = false,
        fileName = 'sensitivity_analysis'
    } = options;

    return {
        responsive,
        displayModeBar,
        displaylogo,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: fileName,
            width: 800,
            scale: 2
        }
    };
};

/**
 * Format sensitivity data for chart consumption
 * @param {Array} sensitivityResults - Raw sensitivity results
 * @param {Object} options - Formatting options
 * @returns {Array} Formatted data
 */
export const formatSensitivityData = (sensitivityResults, options = {}) => {
    const {
        sortByImpact = true,
        reverseOrder = false,
        maxVariables = null
    } = options;

    let formattedData = [...sensitivityResults];

    if (sortByImpact) {
        formattedData.sort((a, b) => reverseOrder ? a.impact - b.impact : b.impact - a.impact);
    }

    if (maxVariables && formattedData.length > maxVariables) {
        formattedData = formattedData.slice(0, maxVariables);
    }

    return formattedData;
};

/**
 * Generate common hover template for sensitivity charts
 * @param {Object} metricConfig - Metric configuration
 * @param {Object} options - Template options
 * @returns {string} Hover template string
 */
export const generateSensitivityHoverTemplate = (metricConfig, options = {}) => {
    const {
        includeVariableRange = true,
        includeConfidence = true,
        includeSource = true,
        customFields = []
    } = options;

    let template =
        '<b>%{y}</b><br>' +
        `${metricConfig.label} Impact: <b>%{text}</b><br>` +
        '<br>' +
        'Base Case (P%{customdata.percentileRange.base}): %{customdata.baseValue}<br>' +
        'Low Scenario (P%{customdata.percentileRange.lower}): %{customdata.lowValue}<br>' +
        'High Scenario (P%{customdata.percentileRange.upper}): %{customdata.highValue}<br>';

    if (includeVariableRange) {
        template += '<br>Variable Range: %{customdata.variableValues.low} → %{customdata.variableValues.high}<br>';
    }

    if (includeConfidence) {
        template += 'Confidence Level: %{customdata.percentileRange.confidenceInterval}%<br>';
    }

    template += 'Category: %{customdata.displayCategory}<br>';

    if (includeSource) {
        template += 'Source: %{customdata.source}<br>';
    }

    // Add custom fields
    customFields.forEach(field => {
        template += `${field.label}: %{customdata.${field.key}}<br>`;
    });

    template += '<extra></extra>';

    return template;
};

/**
 * Validate sensitivity data before chart preparation
 * @param {Array} sensitivityResults - Sensitivity results
 * @param {Object} metricConfig - Metric configuration
 * @returns {Object} Validation result
 */
export const validateSensitivityData = (sensitivityResults, metricConfig) => {
    if (!sensitivityResults || !Array.isArray(sensitivityResults)) {
        return {
            isValid: false,
            message: 'Sensitivity results must be an array'
        };
    }

    if (sensitivityResults.length === 0) {
        return {
            isValid: false,
            message: 'No sensitivity data available'
        };
    }

    if (!metricConfig) {
        return {
            isValid: false,
            message: 'Metric configuration is required'
        };
    }

    // Check required fields in each result
    const requiredFields = ['variableId', 'variable', 'impact'];
    for (const result of sensitivityResults) {
        for (const field of requiredFields) {
            if (!(field in result)) {
                return {
                    isValid: false,
                    message: `Missing required field: ${field}`
                };
            }
        }
    }

    return { isValid: true, message: '' };
};

/**
 * Calculate chart dimensions based on data and display options
 * @param {number} variableCount - Number of variables
 * @param {Object} options - Dimension options
 * @returns {Object} Chart dimensions
 */
export const calculateChartDimensions = (variableCount, options = {}) => {
    const {
        minHeight = 400,
        maxHeight = 800,
        variableHeight = 45,
        baseHeight = 120,
        aspectRatio = null
    } = options;

    const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, variableCount * variableHeight + baseHeight));

    const dimensions = {
        height: calculatedHeight,
        width: aspectRatio ? calculatedHeight * aspectRatio : null
    };

    return dimensions;
};