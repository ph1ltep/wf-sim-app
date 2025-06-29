// frontend/src/utils/cashflow/metrics/foundational/totalRevenue.js
import { CASHFLOW_SOURCE_REGISTRY } from '../../../../contexts/CashflowContext.jsx';
import { extractDataForScenario } from '../foundationalUtils.js';

/**
 * Calculate total revenue by aggregating revenue sources using registry paths
 * @param {Object} input - MetricInputSchema object:
 *   @param {Object} input.rawData - Registry-based data extraction context:
 *     @param {Object} input.rawData.computationScenario - Scenario definition:
 *       @param {string} computationScenario.key - Scenario key: 'p10', 'p25', 'p50', 'p75', 'p90', 'perSource'
 *       @param {string} computationScenario.type - Scenario type: 'unified' | 'perSource'
 *       @param {number} [computationScenario.percentile] - Percentile value for unified scenarios (e.g., 50)
 *       @param {Object} [computationScenario.sourcePercentiles] - Source-specific percentiles for perSource: {sourceId: percentile}
 *     @param {Function} input.rawData.getValueByPath - Data extraction function: (path: string[]) => any
 *   @param {Object} [input.foundationalMetrics] - Dependency results (not used for totalRevenue)
 *   @param {Object} [input.options] - Additional options:
 *     @param {Object} input.options.scenario - Full scenario context for complex calculations
 * @returns {Object} MetricResult with revenue time-series data
 */
export const calculate = (input) => {
    const { rawData, options = {} } = input;
    const { computationScenario, getValueByPath } = rawData;

    try {
        // Get revenue sources from registry
        const revenueSources = CASHFLOW_SOURCE_REGISTRY.revenues || [];

        if (revenueSources.length === 0) {
            return {
                value: [],
                formatted: "No Data",
                error: 'No revenue sources found in registry',
                metadata: { calculationMethod: 'totalRevenue', hasData: false }
            };
        }

        // Process each revenue source using registry-based extraction
        const allYears = new Set();
        const sourceResults = new Map();

        revenueSources.forEach(sourceConfig => {
            try {
                // Extract data using registry path and computation scenario
                const baseData = extractDataForScenario(sourceConfig, computationScenario, getValueByPath);

                sourceResults.set(sourceConfig.id, baseData || []);
                baseData.forEach(point => {
                    if (point && typeof point.year === 'number') {
                        allYears.add(point.year);
                    }
                });

            } catch (error) {
                console.warn(`Failed to process revenue source ${sourceConfig.id}:`, error.message);
                sourceResults.set(sourceConfig.id, []);
            }
        });

        // Aggregate all revenue sources by year
        const aggregatedData = Array.from(allYears).map(year => {
            const total = Array.from(sourceResults.values()).reduce((sum, sourceData) => {
                const dataPoint = sourceData.find(d => d && d.year === year);
                return sum + (dataPoint ? (dataPoint.value || 0) : 0);
            }, 0);

            return { year, value: total };
        }).sort((a, b) => a.year - b.year);

        return {
            value: aggregatedData,
            formatted: "Time Series",
            error: null,
            metadata: {
                calculationMethod: 'totalRevenue',
                hasData: true,
                periods: aggregatedData.length,
                sourceCount: revenueSources.length,
                inputSources: revenueSources.map(s => s.id)
            }
        };

    } catch (error) {
        return {
            value: [],
            formatted: "Error",
            error: `Total revenue calculation failed: ${error.message}`,
            metadata: { calculationMethod: 'totalRevenue', hasData: false }
        };
    }
};

export const format = (value) => {
    if (!Array.isArray(value) || value.length === 0) return 'No Data';
    return 'Time Series';
};

export const formatImpact = (impact) => 'N/A';

export const metadata = {
    name: 'Total Revenue',
    shortName: 'Revenue',
    description: 'Aggregated revenue from all revenue sources using registry paths',
    units: 'timeSeries',
    displayUnits: 'USD',
    windIndustryStandard: true,
    calculationComplexity: 'medium'
};