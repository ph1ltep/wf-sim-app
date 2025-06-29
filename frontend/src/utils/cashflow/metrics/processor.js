// frontend/src/utils/cashflow/metrics/processor.js - Registry-based two-tier computation
import { CASHFLOW_METRICS_REGISTRY, resolveDependencies } from './registry.js';

/**
 * Compute all metrics for all available percentiles using registry-based data extraction
 * @param {Array} availablePercentiles - Array of PercentileSchema objects: [{value: 10, description: 'extreme_lower'}, ...]
 * @param {Object} perSourcePercentiles - Object mapping sourceId to percentile value: {electricityPrice: 75, escalationRate: 25, ...}
 * @param {Function} getValueByPath - Data extraction function: (path: string[]) => any
 * @returns {Promise<Map>} AllMetricsDataSchema as Map<metricKey, Array<[percentileKey, MetricResult]>>
 */
export const computeAllMetrics = async (availablePercentiles, perSourcePercentiles, getValueByPath) => {
    const startTime = performance.now();
    console.log('🚀 Starting registry-based two-tier computation...');

    // Extract percentile values from PercentileSchema objects
    const percentileValues = availablePercentiles.map(p => p.value);
    console.log(`📊 Available percentiles: ${percentileValues.join(', ')}`);

    // Build computation scenarios: all available percentiles + perSource
    const computationScenarios = [
        // Standard percentile scenarios - unified mode
        ...percentileValues.map(percentile => ({
            key: `p${percentile}`,
            type: 'unified',
            percentile
        })),
        // Per-source scenario - mixed percentiles per source
        {
            key: 'perSource',
            type: 'perSource',
            sourcePercentiles: perSourcePercentiles
        }
    ];

    console.log(`📊 Computing ${computationScenarios.length} scenarios: ${computationScenarios.map(s => s.key).join(', ')}`);

    // Get computation order with dependencies resolved
    const computationOrder = resolveDependencies();
    console.log(`🔗 Computation order: ${computationOrder.join(', ')}`);

    // AllMetricsDataSchema structure: Map<metricKey, Array<[percentileKey, MetricResult]>>
    const computedMetrics = new Map();

    // Initialize each metric with empty percentile collections
    computationOrder.forEach(metricKey => {
        computedMetrics.set(metricKey, []);
    });

    // Compute each scenario
    for (const computationScenario of computationScenarios) {
        console.log(`📊 Computing scenario: ${computationScenario.key}`);
        const scenarioResults = new Map();

        // Compute metrics in dependency order for this scenario
        for (const metricKey of computationOrder) {
            const config = CASHFLOW_METRICS_REGISTRY[metricKey];

            try {
                // Create input for metric calculation using registry-based approach
                const input = createMetricInput(metricKey, config, computationScenario, scenarioResults, getValueByPath);

                // Calculate metric
                const result = config.calculate(input);

                // Store MetricResult with minimal metadata
                scenarioResults.set(metricKey, {
                    value: result.value,
                    formatted: result.formatted || config.format(result.value),
                    error: result.error || null,
                    metadata: {
                        calculationMethod: metricKey,
                        hasData: result.metadata?.hasData !== false,
                        // Only essential metadata - no heavy objects
                        ...(result.metadata && {
                            periods: result.metadata.periods,
                            sourceCount: result.metadata.sourceCount,
                            inputSources: result.metadata.inputSources
                        })
                    }
                });

                if (result.error) {
                    console.warn(`⚠️ ${metricKey} (${computationScenario.key}): ${result.error}`);
                } else {
                    const formatted = result.formatted || config.format(result.value);
                    console.log(`✅ ${metricKey} (${computationScenario.key}): ${formatted}`);
                }

            } catch (error) {
                console.error(`❌ ${metricKey} (${computationScenario.key}):`, error.message);
                scenarioResults.set(metricKey, {
                    value: null,
                    formatted: 'Error',
                    error: error.message,
                    metadata: { calculationMethod: metricKey, hasData: false }
                });
            }
        }

        // Add scenario results to final structure
        scenarioResults.forEach((result, metricKey) => {
            const metricPercentileCollection = computedMetrics.get(metricKey);
            metricPercentileCollection.push([computationScenario.key, result]);
        });
    }

    const endTime = performance.now();
    console.log(`✅ Registry-based computation complete: ${computedMetrics.size} metrics, ${(endTime - startTime).toFixed(2)}ms`);

    return computedMetrics;
};

/**
 * Create MetricInputSchema structure for metric calculation
 * This function adapts the computation scenario and dependencies into the standardized
 * input format that all metric calculate() functions expect
 * 
 * @param {string} metricKey - Metric identifier from registry
 * @param {Object} config - MetricConfigSchema object from registry  
 * @param {Object} computationScenario - Scenario definition: {key, type, percentile|sourcePercentiles}
 * @param {Map} scenarioResults - Already computed metrics for this scenario (for dependencies)
 * @param {Function} getValueByPath - Data extraction function: (path: string[]) => any
 * @returns {Object} MetricInputSchema structure
 */
const createMetricInput = (metricKey, config, computationScenario, scenarioResults, getValueByPath) => {
    // MetricInputSchema structure
    const input = {
        rawData: null,
        foundationalMetrics: null,
        scenarioData: null, // Not used - registry paths handle data extraction
        percentile: computationScenario.percentile, // For unified scenarios only
        options: {
            scenario: computationScenario // Full scenario context for complex calculations
        }
    };

    // For foundational metrics: provide registry-based data extraction context
    if (config.category === 'foundational') {
        input.rawData = {
            computationScenario,  // Contains type, percentile, or sourcePercentiles
            getValueByPath       // Function to extract data using registry paths
        };

        // Add foundational dependencies if needed
        if (config.dependsOn?.length > 0) {
            input.foundationalMetrics = {};
            config.dependsOn.forEach(depKey => {
                const depResult = scenarioResults.get(depKey);
                if (depResult) input.foundationalMetrics[depKey] = depResult;
            });
        }
    }
    // For analytical metrics: only foundational dependencies
    else {
        if (config.dependsOn?.length > 0) {
            input.foundationalMetrics = {};
            config.dependsOn.forEach(depKey => {
                const depResult = scenarioResults.get(depKey);
                if (depResult) input.foundationalMetrics[depKey] = depResult;
            });
        }
    }

    return input;
};