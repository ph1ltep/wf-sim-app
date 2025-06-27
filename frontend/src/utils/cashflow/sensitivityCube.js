// File: frontend/src/utils/cashflow/sensitivityCube.js
// Updated to be SUPPORTED_METRICS-driven with unified extraction

import { CASHFLOW_SOURCE_REGISTRY } from '../../contexts/CashflowContext';
import { SENSITIVITY_SOURCE_REGISTRY, discoverAllSensitivityVariables } from '../../contexts/SensitivityRegistry';
import { SUPPORTED_METRICS, extractMetricValue } from '../finance/sensitivityMetrics';

/**
 * Compute sensitivity cube using SUPPORTED_METRICS
 * @param {Object} params - Computation parameters
 * @returns {Object} Sensitivity cube with pre-computed impacts
 */
export const computeSensitivityCube = async ({
    aggregations,
    financeMetrics,
    availablePercentiles,
    scenarioData,
    getValueByPath
}) => {
    console.log('🧮 Building sensitivity cube using SUPPORTED_METRICS...');

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

    // ✅ USE SUPPORTED_METRICS instead of hardcoded list
    const targetMetrics = Object.keys(SUPPORTED_METRICS);
    console.log(`Target metrics from SUPPORTED_METRICS: [${targetMetrics.join(', ')}]`);

    // ✅ VALIDATE that financeMetrics contains required metrics
    const availableMetrics = Object.keys(financeMetrics).filter(key =>
        financeMetrics[key] instanceof Map && financeMetrics[key].size > 0
    );

    const missingMetrics = targetMetrics.filter(metric => !availableMetrics.includes(metric));

    if (missingMetrics.length > 0) {
        console.warn(`⚠️ Missing metrics in financeMetrics: [${missingMetrics.join(', ')}]`);
        console.warn(`Available metrics: [${availableMetrics.join(', ')}]`);
    }

    // ✅ USE AVAILABLE METRICS (graceful degradation)
    const validMetrics = targetMetrics.filter(metric => availableMetrics.includes(metric));
    console.log(`Proceeding with ${validMetrics.length}/${targetMetrics.length} available metrics: [${validMetrics.join(', ')}]`);

    // Initialize cube structure
    validMetrics.forEach(metric => {
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

        // Calculate sensitivity for each available metric
        for (const targetMetric of validMetrics) {
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
    sensitivityCube.metadata.metricCount = validMetrics.length;
    sensitivityCube.metadata.totalComputations = processedCount * validMetrics.length;
    sensitivityCube.metadata.availableMetrics = validMetrics;
    sensitivityCube.metadata.missingMetrics = missingMetrics;

    console.log(`✅ Sensitivity cube computed: ${variables.length} variables x ${validMetrics.length} metrics = ${sensitivityCube.metadata.totalComputations} computations`);

    if (missingMetrics.length > 0) {
        console.log(`⚠️ Note: ${missingMetrics.length} metrics were skipped due to missing data`);
    }
    return sensitivityCube;
};

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
        // ✅ USE UNIFIED extractMetricValue from sensitivityMetrics.js
        const basePercentile = 50;
        const baseValue = extractMetricValue(financeMetrics, targetMetric, basePercentile);
        if (baseValue === null || baseValue === undefined) {
            console.warn(`No base value found for metric ${targetMetric}`);
            return null;
        }

        // Calculate impact for all percentiles
        const impacts = new Map();

        for (const percentile of availablePercentiles) {
            const metricValue = extractMetricValue(financeMetrics, targetMetric, percentile);
            impacts.set(percentile, metricValue || baseValue);
        }

        return {
            baseValue,
            impacts,
            variable: variable.id,
            metric: targetMetric,
            computedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Error calculating sensitivity for ${variable.id}(${targetMetric}):, error`);
        return null;
    }
};