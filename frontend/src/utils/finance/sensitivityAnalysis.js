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
 * Calculate impact for a single variable - ENHANCED with target metric values
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

        // Aggregate time-series to get final metric values
        const baseValue = aggregateTimeSeries(baseWithMultipliers, aggregationMethod, aggregationOptions);
        const lowValue = aggregateTimeSeries(lowWithMultipliers, aggregationMethod, aggregationOptions);
        const highValue = aggregateTimeSeries(highWithMultipliers, aggregationMethod, aggregationOptions);

        // Calculate percentage changes (for backward compatibility)
        const leftPercent = baseValue !== 0 ? ((lowValue - baseValue) / Math.abs(baseValue)) * 100 : 0;
        const rightPercent = baseValue !== 0 ? ((highValue - baseValue) / Math.abs(baseValue)) * 100 : 0;
        const totalSpread = Math.abs(rightPercent) + Math.abs(leftPercent);

        // Extract variable values for hover information
        const lowVariableValue = Number(lowTimeSeries[0]?.value || 0);
        const baseVariableValue = Number(baseTimeSeries[0]?.value || 0);
        const highVariableValue = Number(highTimeSeries[0]?.value || 0);

        return {
            // Basic identification
            variableId: variable.id,
            displayName: variable.displayName || variable.label || variable.id,
            displayCategory: variable.category || 'Other',

            // ✅ NEW: TARGET METRIC VALUES (for tornado chart)
            lowTargetValue: lowValue,
            baseTargetValue: baseValue,
            highTargetValue: highValue,

            // ✅ NEW: TARGET METRIC DELTAS
            lowTargetDelta: lowValue - baseValue,
            highTargetDelta: highValue - baseValue,
            totalTargetSpread: Math.abs(highValue - lowValue),

            // ✅ NEW: VARIABLE VALUES (for hover info)
            lowVariableValue,
            baseVariableValue,
            highVariableValue,

            // ✅ NEW: VARIABLE DELTAS (for hover info)
            lowVariableDelta: lowVariableValue - baseVariableValue,
            highVariableDelta: highVariableValue - baseVariableValue,

            // Legacy compatibility (keep existing)
            impact: Math.abs(highValue - lowValue),
            leftPercent,
            rightPercent,
            totalSpread,
            leftDelta: lowValue - baseValue,
            rightDelta: highValue - baseValue,

            // Formatted display values (simple strings)
            lowValueFormatted: formatLargeNumber(lowValue, { currency: metricConfig.units === 'currency', precision: 1 }),
            highValueFormatted: formatLargeNumber(highValue, { currency: metricConfig.units === 'currency', precision: 1 }),
            variableRange: `${formatLargeNumber(lowVariableValue, { precision: 1 })} → ${formatLargeNumber(highVariableValue, { precision: 1 })}`,

            // Metadata
            percentileRange: {
                lower,
                base,
                upper,
                confidenceInterval: upper - lower
            },

            // Include affects for indirect variables
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

/**
 * EFFICIENT: Extract sensitivity results from pre-computed cube
 * @param {Object} sensitivityCube - Pre-computed sensitivity cube
 * @param {string} targetMetric - Target metric (irr, npv, etc.)
 * @param {Object} percentileRange - Percentile range {lower, upper, base}
 * @returns {Array} Formatted sensitivity results for tornado chart
 */
export const extractSensitivityFromCube = (sensitivityCube, targetMetric, percentileRange) => {
    if (!sensitivityCube || !sensitivityCube.metrics || !sensitivityCube.metrics[targetMetric]) {
        console.warn(`No sensitivity data found for metric: ${targetMetric}`);
        return [];
    }

    const { lower, upper, base } = percentileRange;
    const metricCube = sensitivityCube.metrics[targetMetric];
    const results = [];

    console.log(`Extracting sensitivity for ${targetMetric} from cube with ${metricCube.size} variables`);

    metricCube.forEach((sensitivityData, variableId) => {
        const variableMetadata = sensitivityCube.variables.get(variableId);

        if (!variableMetadata) {
            console.warn(`No metadata found for variable: ${variableId}`);
            return;
        }

        const baseValue = sensitivityData.baseValue;
        const lowValue = sensitivityData.impacts.get(lower) || baseValue;
        const highValue = sensitivityData.impacts.get(upper) || baseValue;

        // Get variable values for hover information
        const lowVariableValue = getVariableValueFromCube(variableId, lower, sensitivityCube);
        const baseVariableValue = getVariableValueFromCube(variableId, base, sensitivityCube);
        const highVariableValue = getVariableValueFromCube(variableId, upper, sensitivityCube);

        results.push({
            // Basic identification
            variableId,
            displayName: variableMetadata.displayName,
            displayCategory: variableMetadata.displayCategory,
            category: variableMetadata.category,

            // ✅ TARGET METRIC VALUES (from cube)
            lowTargetValue: lowValue,
            baseTargetValue: baseValue,
            highTargetValue: highValue,

            // ✅ TARGET METRIC DELTAS
            lowTargetDelta: lowValue - baseValue,
            highTargetDelta: highValue - baseValue,
            totalTargetSpread: Math.abs(highValue - lowValue),

            // ✅ VARIABLE VALUES (for hover info)
            lowVariableValue,
            baseVariableValue,
            highVariableValue,

            // ✅ VARIABLE DELTAS (for hover info)
            lowVariableDelta: lowVariableValue - baseVariableValue,
            highVariableDelta: highVariableValue - baseVariableValue,

            // Legacy compatibility
            impact: Math.abs(highValue - lowValue),
            leftPercent: baseValue !== 0 ? ((lowValue - baseValue) / Math.abs(baseValue)) * 100 : 0,
            rightPercent: baseValue !== 0 ? ((highValue - baseValue) / Math.abs(baseValue)) * 100 : 0,

            // Formatted values
            lowValueFormatted: formatLargeNumber(lowValue, {
                currency: targetMetric === 'npv',
                precision: targetMetric.includes('irr') ? 1 : 2
            }),
            highValueFormatted: formatLargeNumber(highValue, {
                currency: targetMetric === 'npv',
                precision: targetMetric.includes('irr') ? 1 : 2
            }),
            variableRange: `${formatLargeNumber(lowVariableValue, { precision: 1 })} → ${formatLargeNumber(highVariableValue, { precision: 1 })}`,

            // Metadata
            percentileRange: { lower, upper, base },
            source: variableMetadata.source,
            variableType: variableMetadata.variableType,
            registryCategory: variableMetadata.registryCategory
        });
    });

    // Sort by total target metric spread (absolute impact)
    const sortedResults = results.sort((a, b) => b.totalTargetSpread - a.totalTargetSpread);

    console.log(`✅ Extracted ${sortedResults.length} sensitivity results for ${targetMetric}`);
    return sortedResults;
};

/**
 * Get variable value from cube (placeholder - would need actual implementation)
 */
const getVariableValueFromCube = (variableId, percentile, sensitivityCube) => {
    // This is a placeholder - in a real implementation, you'd store variable values too
    // For now, return a reasonable default
    return Math.random() * 100; // Replace with actual variable value lookup
};

/**
 * Validate sensitivity cube structure
 */
export const validateSensitivityCube = (sensitivityCube) => {
    if (!sensitivityCube) {
        return { valid: false, error: 'Sensitivity cube is null or undefined' };
    }

    if (!sensitivityCube.metrics || !sensitivityCube.variables) {
        return { valid: false, error: 'Sensitivity cube missing required properties' };
    }

    const metricCount = Object.keys(sensitivityCube.metrics).length;
    const variableCount = sensitivityCube.variables.size;

    if (metricCount === 0 || variableCount === 0) {
        return { valid: false, error: `Sensitivity cube is empty: ${metricCount} metrics, ${variableCount} variables` };
    }

    return {
        valid: true,
        metrics: metricCount,
        variables: variableCount,
        computedAt: sensitivityCube.computedAt
    };
};