// frontend/src/utils/cashflow/metrics/foundational/totalCosts.js
import { CASHFLOW_SOURCE_REGISTRY } from '../../../../contexts/CashflowContext.jsx';
import { extractDataForScenario } from '../foundationalUtils.js';

/**
 * Calculate total costs by aggregating cost sources using registry paths
 * @param {Object} input - MetricInputSchema
 * @returns {Object} MetricResult with cost time-series data
 */
export const calculate = (input) => {
    const { rawData, options = {} } = input;
    const { computationScenario, getValueByPath } = rawData;

    try {
        // Get cost sources from registry
        const costSources = CASHFLOW_SOURCE_REGISTRY.costs || [];

        if (costSources.length === 0) {
            return {
                value: [],
                formatted: "No Data",
                error: 'No cost sources found in registry',
                metadata: { calculationMethod: 'totalCosts', hasData: false }
            };
        }

        // Process each cost source using registry-based extraction
        const allYears = new Set();
        const sourceResults = new Map();

        costSources.forEach(sourceConfig => {
            try {
                const baseData = extractDataForScenario(sourceConfig, computationScenario, getValueByPath);

                sourceResults.set(sourceConfig.id, baseData || []);
                baseData.forEach(point => {
                    if (point && typeof point.year === 'number') {
                        allYears.add(point.year);
                    }
                });

            } catch (error) {
                console.warn(`Failed to process cost source ${sourceConfig.id}:`, error.message);
                sourceResults.set(sourceConfig.id, []);
            }
        });

        // Aggregate all cost sources by year
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
                calculationMethod: 'totalCosts',
                hasData: true,
                periods: aggregatedData.length,
                sourceCount: costSources.length,
                inputSources: costSources.map(s => s.id)
            }
        };

    } catch (error) {
        return {
            value: [],
            formatted: "Error",
            error: `Total costs calculation failed: ${error.message}`,
            metadata: { calculationMethod: 'totalCosts', hasData: false }
        };
    }
};

export const format = (value) => {
    if (!Array.isArray(value) || value.length === 0) return 'No Data';
    return 'Time Series';
};

export const formatImpact = (impact) => 'N/A';

export const metadata = {
    name: 'Total Costs',
    shortName: 'Costs',
    description: 'Aggregated costs from all cost sources using registry paths',
    units: 'timeSeries',
    displayUnits: 'USD',
    windIndustryStandard: true,
    calculationComplexity: 'medium'
};