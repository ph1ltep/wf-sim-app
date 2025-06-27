// frontend/src/utils/cashflow/sensitivityCube.js
// Efficient sensitivity cube computation using existing percentile data

import { CASHFLOW_SOURCE_REGISTRY } from '../../contexts/CashflowContext';
import { SENSITIVITY_SOURCE_REGISTRY, discoverAllSensitivityVariables } from '../../contexts/SensitivityRegistry';
import { SUPPORTED_METRICS } from '../finance/sensitivityMetrics';
import { formatLargeNumber } from '../tables/formatting';

/**
 * Compute sensitivity cube efficiently using existing percentile data
 * @param {Object} params - Computation parameters
 * @param {Object} params.aggregations - Existing aggregations with percentile data
 * @param {Object} params.financeMetrics - Existing finance metrics with percentile data
 * @param {Array} params.availablePercentiles - Available percentile values
 * @param {Object} params.scenarioData - Complete scenario data
 * @param {Function} params.getValueByPath - Path resolver function
 * @returns {Object} Sensitivity cube with pre-computed impacts
 */
export const computeSensitivityCube = async ({
    aggregations,
    financeMetrics,
    availablePercentiles,
    scenarioData,
    getValueByPath
}) => {
    console.log('🧮 Building sensitivity cube...');

    // Discover variables from both registries
    const variables = discoverAllSensitivityVariables(
        CASHFLOW_SOURCE_REGISTRY,
        SENSITIVITY_SOURCE_REGISTRY
    );

    console.log(`Found ${variables.length} variables for sensitivity analysis`);

    const sensitivityCube = {
        metrics: {},
        variables: new Map(),
        computedAt: new Date().toISOString(),
        metadata: {
            variableCount: variables.length,
            metricCount: 0,
            percentileCount: availablePercentiles.length
        }
    };

    // Target metrics to analyze
    const targetMetrics = ['irr', 'npv', 'lcoe', 'minDSCR', 'avgDSCR', 'llcr'];

    // Initialize cube structure
    targetMetrics.forEach(metric => {
        sensitivityCube.metrics[metric] = new Map();
    });

    // Process each variable
    let processedCount = 0;
    for (const variable of variables) {
        console.log(`Processing variable ${++processedCount}/${variables.length}: ${variable.id}`);

        // Store variable metadata
        sensitivityCube.variables.set(variable.id, {
            id: variable.id,
            displayName: variable.displayName || variable.label || variable.id,
            displayCategory: variable.category || 'Other',
            category: variable.category,
            units: variable.units || '',
            path: variable.path,
            source: variable.source,
            variableType: variable.variableType,
            registryCategory: variable.registryCategory
        });

        // Calculate sensitivity for each metric
        for (const targetMetric of targetMetrics) {
            const sensitivityData = await calculateVariableSensitivityEfficient(
                variable,
                targetMetric,
                aggregations,
                financeMetrics,
                availablePercentiles,
                scenarioData,
                getValueByPath
            );

            if (sensitivityData) {
                sensitivityCube.metrics[targetMetric].set(variable.id, sensitivityData);
            }
        }
    }

    // Update metadata
    sensitivityCube.metadata.metricCount = targetMetrics.length;
    sensitivityCube.metadata.totalComputations = processedCount * targetMetrics.length;

    console.log(`✅ Sensitivity cube computed: ${variables.length} variables x ${targetMetrics.length} metrics = ${sensitivityCube.metadata.totalComputations} computations`);
    return sensitivityCube;
};

/**
 * EFFICIENT: Calculate variable sensitivity using existing data structures
 * Instead of rebuilding entire model, leverage existing percentile data
 */
const calculateVariableSensitivityEfficient = async (
    variable,
    targetMetric,
    aggregations,
    financeMetrics,
    availablePercentiles,
    scenarioData,
    getValueByPath
) => {
    try {
        // Get base case metric value (P50)
        const basePercentile = 50;
        const baseValue = extractMetricValue(targetMetric, financeMetrics, basePercentile);

        if (baseValue === null || baseValue === undefined) {
            console.warn(`No base value found for metric ${targetMetric}`);
            return null;
        }

        // Calculate impact for all percentiles
        const impacts = new Map();

        for (const percentile of availablePercentiles) {
            let metricValue;

            if (variable.source === 'direct') {
                // For direct variables, use proportional impact calculation
                metricValue = await calculateDirectVariableImpact(
                    variable,
                    percentile,
                    targetMetric,
                    baseValue,
                    aggregations,
                    financeMetrics
                );
            } else {
                // For indirect variables, use approximation model
                metricValue = await calculateIndirectVariableImpact(
                    variable,
                    percentile,
                    targetMetric,
                    baseValue,
                    scenarioData,
                    getValueByPath
                );
            }

            impacts.set(percentile, metricValue);
        }

        return {
            baseValue,
            impacts,
            variable: variable.id,
            metric: targetMetric,
            computedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Error calculating sensitivity for ${variable.id} (${targetMetric}):`, error);
        return null;
    }
};

/**
 * EFFICIENT: Calculate direct variable impact using proportional scaling
 * This leverages existing percentile data without full model rebuild
 */
const calculateDirectVariableImpact = async (
    variable,
    percentile,
    targetMetric,
    baseValue,
    aggregations,
    financeMetrics
) => {
    try {
        // Special handling for metrics that are already computed per percentile
        if (financeMetrics[targetMetric] && financeMetrics[targetMetric].has && financeMetrics[targetMetric].has(percentile)) {
            return extractMetricValue(targetMetric, financeMetrics, percentile);
        }

        // Find the line item corresponding to this variable
        const lineItem = findLineItemByVariable(variable, aggregations);

        if (!lineItem || !lineItem.percentileData || !lineItem.percentileData.has(percentile)) {
            return baseValue; // Return base if no data
        }

        // Get proportional change in the underlying variable
        const baseData = lineItem.percentileData.get(50) || lineItem.data;
        const percentileData = lineItem.percentileData.get(percentile);

        if (!baseData || !percentileData || !baseData.length || !percentileData.length) {
            return baseValue;
        }

        // Calculate proportional impact
        const baseTotalValue = baseData.reduce((sum, d) => sum + Math.abs(d.value || 0), 0);
        const percentileTotalValue = percentileData.reduce((sum, d) => sum + Math.abs(d.value || 0), 0);

        if (baseTotalValue === 0) return baseValue;

        const proportionalChange = percentileTotalValue / baseTotalValue;

        // Apply proportional scaling to base metric value
        const estimatedValue = applyProportionalImpact(
            baseValue,
            proportionalChange,
            targetMetric,
            variable.category
        );

        return estimatedValue;

    } catch (error) {
        console.error(`Error in calculateDirectVariableImpact for ${variable.id}:`, error);
        return baseValue;
    }
};

/**
 * Calculate indirect variable impact using simpler approximation
 */
const calculateIndirectVariableImpact = async (
    variable,
    percentile,
    targetMetric,
    baseValue,
    scenarioData,
    getValueByPath
) => {
    try {
        // For indirect variables, use distribution data to estimate impact
        const distributionData = getValueByPath(variable.path);

        if (!distributionData || !distributionData.results) {
            return baseValue;
        }

        // Find percentile results
        const baseResult = distributionData.results.find(r => r.percentile.value === 50);
        const percentileResult = distributionData.results.find(r => r.percentile.value === percentile);

        if (!baseResult || !percentileResult) {
            return baseValue;
        }

        // Calculate proportional change
        const baseVariableValue = baseResult.data[0]?.value || 0;
        const percentileVariableValue = percentileResult.data[0]?.value || 0;

        if (baseVariableValue === 0) return baseValue;

        const proportionalChange = percentileVariableValue / baseVariableValue;

        // Apply impact based on variable type
        const estimatedValue = applyIndirectImpact(
            baseValue,
            proportionalChange,
            targetMetric,
            variable.impactType || 'multiplicative'
        );

        return estimatedValue;

    } catch (error) {
        console.error(`Error in calculateIndirectVariableImpact for ${variable.id}:`, error);
        return baseValue;
    }
};

/**
 * Apply proportional impact based on metric type and variable category
 */
const applyProportionalImpact = (baseValue, proportionalChange, targetMetric, variableCategory) => {
    const changeFactor = proportionalChange - 1; // Convert to change factor

    switch (targetMetric) {
        case 'irr':
            // IRR is non-linear, use conservative approximation
            const irrImpact = changeFactor * 0.6; // Damping factor for IRR
            if (variableCategory === 'cost') {
                return baseValue * (1 - irrImpact); // Inverse relationship for costs
            } else {
                return baseValue * (1 + irrImpact); // Direct relationship for revenues
            }

        case 'npv':
            // NPV is more linear with cash flows
            if (variableCategory === 'cost') {
                return baseValue * (2 - proportionalChange); // Inverse relationship
            } else {
                return baseValue * proportionalChange; // Direct relationship
            }

        case 'lcoe':
            // LCOE = costs / energy, so inverse relationship with energy
            if (variableCategory === 'cost') {
                return baseValue * proportionalChange;
            } else {
                return baseValue / proportionalChange;
            }

        case 'minDSCR':
        case 'avgDSCR':
            // DSCR = cashflow / debt service
            if (variableCategory === 'cost') {
                return baseValue * (2 - proportionalChange); // Costs reduce DSCR
            } else {
                return baseValue * proportionalChange; // Revenues increase DSCR
            }

        case 'llcr':
            // Similar to DSCR
            if (variableCategory === 'cost') {
                return baseValue * (2 - proportionalChange);
            } else {
                return baseValue * proportionalChange;
            }

        default:
            return baseValue * proportionalChange;
    }
};

/**
 * Apply indirect impact based on impact type
 */
const applyIndirectImpact = (baseValue, proportionalChange, targetMetric, impactType) => {
    switch (impactType) {
        case 'multiplicative':
            return applyProportionalImpact(baseValue, proportionalChange, targetMetric, 'revenue');

        case 'recalculation':
            // For variables that require recalculation, use conservative estimate
            const changeFactor = (proportionalChange - 1) * 0.3; // Conservative factor
            return baseValue * (1 + changeFactor);

        default:
            return baseValue;
    }
};

/**
 * Extract metric value from finance metrics
 */
const extractMetricValue = (targetMetric, financeMetrics, percentile) => {
    try {
        const metricData = financeMetrics[targetMetric];

        if (!metricData) {
            console.warn(`Metric ${targetMetric} not found in financeMetrics`);
            return null;
        }

        // Handle different data structures
        if (metricData.has && typeof metricData.has === 'function') {
            // It's a Map
            const value = metricData.get(percentile);

            if (Array.isArray(value)) {
                // Time series data (like DSCR) - return minimum for risk metrics
                if (targetMetric.includes('min')) {
                    return Math.min(...value.map(d => d.value));
                } else if (targetMetric.includes('avg')) {
                    return value.reduce((sum, d) => sum + d.value, 0) / value.length;
                } else {
                    return value[0]?.value || 0;
                }
            } else {
                return value;
            }
        } else if (typeof metricData === 'number') {
            // It's a direct value
            return metricData;
        } else if (Array.isArray(metricData)) {
            // It's an array
            return metricData[0]?.value || 0;
        }

        console.warn(`Unknown metric data structure for ${targetMetric}:`, typeof metricData);
        return null;

    } catch (error) {
        console.error(`Error extracting metric value for ${targetMetric}:`, error);
        return null;
    }
};

/**
 * Find line item by variable configuration
 */
const findLineItemByVariable = (variable, aggregations) => {
    // Try to find in aggregations first
    if (variable.category === 'cost' && aggregations.totalCosts) {
        return aggregations.totalCosts;
    } else if (variable.category === 'revenue' && aggregations.totalRevenue) {
        return aggregations.totalRevenue;
    }

    // If not found in aggregations, this might be an indirect variable
    return null;
};