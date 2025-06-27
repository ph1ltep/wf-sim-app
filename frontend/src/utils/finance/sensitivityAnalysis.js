// frontend/src/utils/finance/sensitivityAnalysis.js
// SIMPLIFIED - Use actual schema structure and fix double-wrapping issue

import { SUPPORTED_METRICS } from './sensitivityMetrics';
import { aggregateTimeSeries, getAggregationMethod, getAggregationOptions } from '../timeSeries/aggregation';
import { discoverAllSensitivityVariables } from '../../contexts/SensitivityRegistry';
import { getSensitivityRangeFromSimulation } from './percentileUtils';
import { formatLargeNumber } from '../../utils/tables/formatting';

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
 * SIMPLIFIED - Use actual schema structure from SimulationInfoSchema
 */
const getTimeSeriesAtPercentile = (variable, percentile, distributionAnalysis, getValueByPath) => {
    const variableName = variable.path[variable.path.length - 1];

    // Get the SimulationInfoSchema for this variable
    const simulationInfo = distributionAnalysis?.[variableName];

    if (!simulationInfo) {
        // No distribution exists - check for fixed value
        const fixedValue = getValueByPath(variable.path);
        if (fixedValue == null) {
            //console.log(`Skipping variable ${variableName}: no distribution and no fixed value found`);
            return null;
        }

        // Return marker for fixed value - handle upstream
        return { isFixed: true, value: fixedValue };
    }

    // Find the percentile result in the results array
    const percentileResult = simulationInfo.results?.find(result =>
        result.percentile.value === percentile
    );

    if (!percentileResult) {
        console.log(`Skipping variable ${variableName}: percentile ${percentile} not found`);
        return null;
    }

    // Return the DataPointSchema array directly - it's already {year, value}[]
    // NO double-wrapping needed!
    return percentileResult.data;
};

/**
 * Calculate impact for a single variable - OPTIMIZED for new structure
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
        // Get time-series for each percentile
        const baseTimeSeries = getTimeSeriesAtPercentile(variable, base, distributionAnalysis, getValueByPath);
        const lowTimeSeries = getTimeSeriesAtPercentile(variable, lower, distributionAnalysis, getValueByPath);
        const highTimeSeries = getTimeSeriesAtPercentile(variable, upper, distributionAnalysis, getValueByPath);

        // Skip if any are null
        if (!baseTimeSeries || !lowTimeSeries || !highTimeSeries) {
            return null;
        }

        // Skip if dealing with fixed values
        if (baseTimeSeries.isFixed || lowTimeSeries.isFixed || highTimeSeries.isFixed) {
            console.log(`Skipping variable ${variable.id}: contains fixed values`);
            return null;
        }

        // Apply multipliers FIRST (critical for accurate calculations)
        const baseWithMultipliers = applyMultipliers(baseTimeSeries, variable.multipliers, getValueByPath);
        const lowWithMultipliers = applyMultipliers(lowTimeSeries, variable.multipliers, getValueByPath);
        const highWithMultipliers = applyMultipliers(highTimeSeries, variable.multipliers, getValueByPath);

        // Aggregate to get final metric values
        const baseValue = aggregateTimeSeries(baseWithMultipliers, aggregationMethod, aggregationOptions);
        const lowValue = aggregateTimeSeries(lowWithMultipliers, aggregationMethod, aggregationOptions);
        const highValue = aggregateTimeSeries(highWithMultipliers, aggregationMethod, aggregationOptions);

        if (baseValue == null || lowValue == null || highValue == null) {
            console.warn(`Failed to aggregate values for variable ${variable.id}`);
            return null;
        }

        // Calculate percentage deviations
        let leftPercent = 0;
        let rightPercent = 0;

        if (Math.abs(baseValue) > 0.001) {
            leftPercent = ((lowValue - baseValue) / Math.abs(baseValue)) * 100;
            rightPercent = ((highValue - baseValue) / Math.abs(baseValue)) * 100;
        }

        const totalSpread = Math.abs(leftPercent) + Math.abs(rightPercent);

        // ✅ FIXED: Use displayName consistently, clean return structure
        return {
            // Core identification
            id: variable.id,
            displayName: variable.displayName, // ✅ Always string from discovery
            category: variable.category,
            source: variable.source,

            // Values (clean numeric)
            baseValue,
            lowValue,
            highValue,
            impact: Math.abs(highValue - lowValue),

            // Tornado chart data (clean numeric)
            leftPercent,
            rightPercent,
            totalSpread,

            // Deltas (clean numeric, no "WithUnits")
            leftDelta: lowValue - baseValue,
            rightDelta: highValue - baseValue,

            // Formatted display values (simple strings)
            lowValueFormatted: formatLargeNumber(lowValue, { currency: metricConfig.units === 'currency', precision: 1 }),
            highValueFormatted: formatLargeNumber(highValue, { currency: metricConfig.units === 'currency', precision: 1 }),
            variableRange: `${formatLargeNumber(Number(lowTimeSeries[0]?.value || 0), { precision: 1 })} → ${formatLargeNumber(Number(highTimeSeries[0]?.value || 0), { precision: 1 })}`,

            // Metadata
            percentileRange: {
                lower,
                base,
                upper,
                confidenceInterval: upper - lower
            },

            // ✅ NEW: Include affects for indirect variables
            affects: variable.affects || []
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
 * @param {Object} params.distributionAnalysis - Distribution analysis data from InputSimSchema
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

    // Get percentile range using utility function
    const percentileRange = getSensitivityRangeFromSimulation(simulationConfig);

    // Discover all variables from both registries
    const variables = discoverAllSensitivityVariables(cashflowRegistry, sensitivityRegistry);

    if (variables.length === 0) {
        console.warn('No variables found for sensitivity analysis');
        return [];
    }

    console.log(`Starting sensitivity analysis for ${variables.length} variables using ${targetMetric} metric`);

    // Calculate impact for each variable
    const results = variables
        .map(variable => calculateVariableImpact(variable, targetMetric, percentileRange, distributionAnalysis, getValueByPath))
        .filter(Boolean) // Remove null results
        .sort((a, b) => b.totalSpread - a.totalSpread); // Sort by total percentage spread

    console.log(`Sensitivity analysis complete: ${results.length} variables with valid results`);

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