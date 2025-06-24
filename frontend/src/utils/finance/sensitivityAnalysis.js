// frontend/src/utils/finance/sensitivityAnalysis.js - Dynamic sensitivity calculation

import { SUPPORTED_METRICS, extractMetricValue } from './sensitivityMetrics';
import { calculateAllMetricsWithPayback } from './calculations';

/**
 * Find percentile result from distribution analysis results
 * @param {Array} results - Distribution results array
 * @param {number} targetPercentile - Target percentile value
 * @returns {Object|null} Percentile result object
 */
const findPercentileResult = (results, targetPercentile) => {
    if (!Array.isArray(results)) return null;

    return results.find(result => {
        if (result.percentile?.value === targetPercentile) return true;
        if (result.percentile === targetPercentile) return true;
        return false;
    });
};

/**
 * Get distribution data for a variable from scenario analysis
 * @param {Object} variable - Variable configuration from registry
 * @param {Object} distributionAnalysis - Distribution analysis data
 * @returns {Object|null} Distribution data
 */
const getDistributionData = (variable, distributionAnalysis) => {
    // Extract the variable key from the path
    // Path format: ['simulation', 'inputSim', 'distributionAnalysis', 'variableKey']
    const variableKey = variable.path[variable.path.length - 1];

    return distributionAnalysis[variableKey] || null;
};

/**
 * Create base scenario with all variables at specified percentile
 * @param {Array} variables - All variables from registry
 * @param {Object} distributionAnalysis - Distribution analysis data
 * @param {number} percentile - Target percentile
 * @returns {Object} Base scenario configuration
 */
const createBaseScenario = (variables, distributionAnalysis, percentile) => {
    const baseScenario = {};

    variables.forEach(variable => {
        if (variable.hasPercentiles) {
            const varData = getDistributionData(variable, distributionAnalysis);
            if (varData?.results) {
                const percentileResult = findPercentileResult(varData.results, percentile);
                if (percentileResult) {
                    baseScenario[variable.id] = percentileResult;
                }
            }
        }
    });

    return baseScenario;
};

/**
 * Calculate dynamic sensitivity analysis using real distribution percentiles
 * @param {Object} params - Calculation parameters
 * @param {Array} params.variables - Variables from discoverVariablesFromRegistry
 * @param {Object} params.distributionAnalysis - Distribution analysis data
 * @param {Function} params.cashflowEngine - Function to calculate cashflow metrics
 * @param {number} params.basePercentile - Base case percentile (usually primary)
 * @param {number} params.lowerPercentile - Lower bound percentile
 * @param {number} params.upperPercentile - Upper bound percentile
 * @param {string} params.targetMetric - Target metric to analyze
 * @returns {Array} Sensitivity analysis results
 */
export const calculateDynamicSensitivity = ({
    variables,
    distributionAnalysis,
    cashflowEngine,
    basePercentile,
    lowerPercentile,
    upperPercentile,
    targetMetric
}) => {
    const metric = SUPPORTED_METRICS[targetMetric];
    if (!metric) {
        throw new Error(`Unsupported metric: ${targetMetric}`);
    }

    // Create base scenario with all variables at base percentile
    const baseScenario = createBaseScenario(variables, distributionAnalysis, basePercentile);

    // Calculate base case metrics
    const baseResults = cashflowEngine(baseScenario);
    const baseValue = extractMetricValue(baseResults, targetMetric);

    if (baseValue === null) {
        console.warn(`Could not extract ${targetMetric} from base case results`);
        return [];
    }

    // Calculate sensitivity for each variable
    const sensitivityResults = variables
        .filter(variable => variable.hasPercentiles)
        .map(variable => {
            try {
                const varData = getDistributionData(variable, distributionAnalysis);

                if (!varData?.results) {
                    console.warn(`No distribution data for variable: ${variable.id}`);
                    return null;
                }

                // Get percentile results
                const basePct = findPercentileResult(varData.results, basePercentile);
                const lowPct = findPercentileResult(varData.results, lowerPercentile);
                const highPct = findPercentileResult(varData.results, upperPercentile);

                if (!basePct || !lowPct || !highPct) {
                    console.warn(`Missing percentile data for variable: ${variable.id}`);
                    return null;
                }

                // Calculate low case (variable at lower percentile, others at base)
                const lowScenario = { ...baseScenario, [variable.id]: lowPct };
                const lowResults = cashflowEngine(lowScenario);
                const lowValue = extractMetricValue(lowResults, targetMetric);

                // Calculate high case (variable at upper percentile, others at base)
                const highScenario = { ...baseScenario, [variable.id]: highPct };
                const highResults = cashflowEngine(highScenario);
                const highValue = extractMetricValue(highResults, targetMetric);

                if (lowValue === null || highValue === null) {
                    console.warn(`Could not calculate ${targetMetric} for variable: ${variable.id}`);
                    return null;
                }

                return {
                    variable: variable.label || variable.id,
                    variableId: variable.id,
                    category: variable.category,
                    metric: targetMetric,
                    baseValue,
                    lowValue,
                    highValue,
                    impact: Math.abs(highValue - lowValue),
                    // Store percentile info for communication
                    percentileRange: {
                        lower: lowerPercentile,
                        base: basePercentile,
                        upper: upperPercentile,
                        confidenceInterval: upperPercentile - lowerPercentile
                    },
                    // Store actual variable values for tooltip
                    variableValues: {
                        low: lowPct.data?.[0]?.value || 'N/A',
                        base: basePct.data?.[0]?.value || 'N/A',
                        high: highPct.data?.[0]?.value || 'N/A'
                    },
                    // Distribution metadata
                    distributionInfo: {
                        type: varData.distribution?.type || 'Unknown',
                        hasTimeSeriesData: Array.isArray(basePct.data) && basePct.data.length > 1
                    }
                };
            } catch (error) {
                console.error(`Error calculating sensitivity for ${variable.id}:`, error);
                return null;
            }
        })
        .filter(Boolean) // Remove null results
        .sort((a, b) => b.impact - a.impact); // Sort by impact magnitude

    return sensitivityResults;
};

/**
 * Calculate sensitivity for multiple metrics simultaneously
 * @param {Object} params - Same as calculateDynamicSensitivity
 * @param {Array} params.targetMetrics - Array of target metric keys
 * @returns {Object} Results keyed by metric
 */
export const calculateMultiMetricSensitivity = ({ targetMetrics, ...params }) => {
    const results = {};

    targetMetrics.forEach(metric => {
        try {
            results[metric] = calculateDynamicSensitivity({
                ...params,
                targetMetric: metric
            });
        } catch (error) {
            console.error(`Error calculating sensitivity for metric ${metric}:`, error);
            results[metric] = [];
        }
    });

    return results;
};