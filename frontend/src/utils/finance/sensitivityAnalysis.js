// frontend/src/utils/finance/sensitivityAnalysis.js
// Complete simplified sensitivity analysis

import { SUPPORTED_METRICS } from './sensitivityMetrics';
import { aggregateTimeSeries, getAggregationMethod, getAggregationOptions } from '../timeSeries/aggregation';
import { discoverAllSensitivityVariables } from '../../contexts/SensitivityRegistry';
import { getSensitivityRangeFromSimulation } from './percentileUtils';

/**
 * Find percentile result from distribution analysis
 */
const findPercentileResult = (results, targetPercentile) => {
    if (!Array.isArray(results)) return null;

    return results.find(result => {
        const percentile = result.percentile?.value || result.percentile;
        return percentile === targetPercentile;
    });
};

/**
 * Get distribution data for a variable
 */
const getDistributionData = (variable, distributionAnalysis) => {
    const variableKey = variable.path[variable.path.length - 1];
    return distributionAnalysis?.[variableKey] || null;
};

/**
 * Apply multipliers to time-series data
 * CRITICAL: This must happen BEFORE aggregation for accurate impact calculation
 */
const applyMultipliers = (timeSeries, multipliers, getValueByPath) => {
    if (!multipliers?.length || !timeSeries?.length) return timeSeries;

    return timeSeries.map(dataPoint => {
        let adjustedValue = dataPoint.value;

        multipliers.forEach(multiplier => {
            const multiplierValue = getValueByPath(multiplier.path);
            if (multiplierValue == null) return;

            switch (multiplier.operation) {
                case 'multiply':
                    adjustedValue *= multiplierValue;
                    break;
                case 'compound':
                    adjustedValue *= Math.pow(1 + multiplierValue, dataPoint.year);
                    break;
                case 'add':
                    adjustedValue += multiplierValue;
                    break;
                default:
                    console.warn(`Unknown multiplier operation: ${multiplier.operation}`);
            }
        });

        return { ...dataPoint, value: adjustedValue };
    });
};

/**
 * Get time-series data for a variable at specific percentile
 */
const getTimeSeriesAtPercentile = (variable, percentile, distributionAnalysis, getValueByPath) => {
    // For non-percentile variables, use static value
    if (!variable.hasPercentiles) {
        const baseValue = getValueByPath(variable.path);
        if (baseValue == null) return null;

        return Array.from({ length: 26 }, (_, index) => ({ year: index, value: baseValue }));
    }

    // For percentile variables, get distribution data
    const varData = getDistributionData(variable, distributionAnalysis);
    if (!varData?.results) return null;

    const percentileResult = findPercentileResult(varData.results, percentile);
    if (!percentileResult) return null;

    // Handle time-series data
    if (percentileResult.data && Array.isArray(percentileResult.data)) {
        return percentileResult.data.map((value, index) => ({ year: index, value }));
    }

    // Handle single value - expand to time-series
    const value = percentileResult.data?.[0]?.value || percentileResult.value || percentileResult;
    if (typeof value === 'number') {
        return Array.from({ length: 26 }, (_, index) => ({ year: index, value }));
    }

    return null;
};

/**
 * Calculate impact for a single variable
 */
const calculateVariableImpact = (variable, targetMetric, percentileRange, distributionAnalysis, getValueByPath) => {
    const { lower, upper, base } = percentileRange;
    const metricConfig = SUPPORTED_METRICS[targetMetric];

    if (!metricConfig) {
        console.warn(`Unknown metric: ${targetMetric}`);
        return null;
    }

    const aggregationMethod = getAggregationMethod(targetMetric);
    const aggregationOptions = getAggregationOptions(targetMetric);

    try {
        // Get time-series for each percentile case
        const baseTimeSeries = getTimeSeriesAtPercentile(variable, base, distributionAnalysis, getValueByPath);
        const lowTimeSeries = getTimeSeriesAtPercentile(variable, lower, distributionAnalysis, getValueByPath);
        const highTimeSeries = getTimeSeriesAtPercentile(variable, upper, distributionAnalysis, getValueByPath);

        if (!baseTimeSeries || !lowTimeSeries || !highTimeSeries) {
            return null;
        }

        // Apply multipliers FIRST (critical for accurate calculations)
        const baseWithMultipliers = applyMultipliers(baseTimeSeries, variable.multipliers, getValueByPath);
        const lowWithMultipliers = applyMultipliers(lowTimeSeries, variable.multipliers, getValueByPath);
        const highWithMultipliers = applyMultipliers(highTimeSeries, variable.multipliers, getValueByPath);

        // Then aggregate to get final metric values
        const baseValue = aggregateTimeSeries(baseWithMultipliers, aggregationMethod, aggregationOptions);
        const lowValue = aggregateTimeSeries(lowWithMultipliers, aggregationMethod, aggregationOptions);
        const highValue = aggregateTimeSeries(highWithMultipliers, aggregationMethod, aggregationOptions);

        if (baseValue == null || lowValue == null || highValue == null) {
            return null;
        }

        return {
            variableId: variable.id,
            variable: variable.label || variable.id,
            category: variable.category,
            displayCategory: variable.displayCategory || variable.category,
            source: variable.source,
            variableType: variable.variableType,

            // Values
            baseValue,
            lowValue,
            highValue,
            impact: Math.abs(highValue - lowValue),

            // Metadata
            percentileRange: {
                lower,
                base,
                upper,
                confidenceInterval: upper - lower
            },
            variableValues: {
                low: lowTimeSeries[0]?.value || 'N/A',
                base: baseTimeSeries[0]?.value || 'N/A',
                high: highTimeSeries[0]?.value || 'N/A'
            }
        };
    } catch (error) {
        console.error(`Error calculating impact for ${variable.id}:`, error);
        return null;
    }
};

/**
 * Main sensitivity analysis function - SIMPLIFIED
 * @param {Object} params - Analysis parameters
 * @param {Object} params.cashflowRegistry - CASHFLOW_SOURCE_REGISTRY
 * @param {Object} params.sensitivityRegistry - SENSITIVITY_SOURCE_REGISTRY
 * @param {string} params.targetMetric - Target metric key (npv, irr, etc.)
 * @param {Object} params.simulationConfig - simulation config with percentiles array and primaryPercentile
 * @param {Object} params.distributionAnalysis - Distribution analysis data
 * @param {Function} params.getValueByPath - Path resolver function
 * @returns {Array} Sensitivity results sorted by impact magnitude
 */
export const calculateSensitivityAnalysis = ({
    cashflowRegistry,
    sensitivityRegistry,
    targetMetric,
    simulationConfig,
    distributionAnalysis,
    getValueByPath
}) => {
    // Input validation
    if (!SUPPORTED_METRICS[targetMetric]) {
        console.error(`Unsupported target metric: ${targetMetric}`);
        return [];
    }

    if (!distributionAnalysis || !getValueByPath) {
        console.error('Missing required analysis data');
        return [];
    }

    // Get percentile range using utility function - pass the whole simulation config
    const percentileRange = getSensitivityRangeFromSimulation(simulationConfig);

    // Discover all variables from both registries
    const variables = discoverAllSensitivityVariables(cashflowRegistry, sensitivityRegistry);

    if (variables.length === 0) {
        console.warn('No variables found for sensitivity analysis');
        return [];
    }

    // Calculate impact for each variable
    const results = variables
        .map(variable => calculateVariableImpact(variable, targetMetric, percentileRange, distributionAnalysis, getValueByPath))
        .filter(Boolean) // Remove null results
        .sort((a, b) => b.impact - a.impact); // Sort by impact magnitude

    return results;
};

/**
 * Calculate sensitivity for multiple metrics
 */
export const calculateMultiMetricSensitivity = ({ targetMetrics, ...params }) => {
    const results = {};

    targetMetrics.forEach(metric => {
        try {
            results[metric] = calculateSensitivityAnalysis({ ...params, targetMetric: metric });
        } catch (error) {
            console.error(`Error calculating sensitivity for ${metric}:`, error);
            results[metric] = [];
        }
    });

    return results;
};

/**
 * Utility functions
 */
export const filterByImpact = (results, minImpact = 0) => {
    return results.filter(result => result.impact >= minImpact);
};

export const getTopVariables = (results, count = 5) => {
    return results.slice(0, count);
};

export const groupByCategory = (results) => {
    return results.reduce((groups, result) => {
        const category = result.displayCategory;
        if (!groups[category]) groups[category] = [];
        groups[category].push(result);
        return groups;
    }, {});
};