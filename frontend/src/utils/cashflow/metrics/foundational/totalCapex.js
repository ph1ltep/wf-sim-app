// frontend/src/utils/cashflow/metrics/foundational/totalCapex.js
import { CASHFLOW_SOURCE_REGISTRY } from '../../../../contexts/CashflowContext.jsx';
import { extractDataForScenario } from '../foundationalUtils.js';

/**
 * Calculate total capex by aggregating construction and development sources
 * @param {Object} input - MetricInputSchema
 * @returns {Object} MetricResult with capex time-series data
 */
export const calculate = (input) => {
    const { rawData, options = {} } = input;
    const { computationScenario, getValueByPath } = rawData;

    try {
        // Get capex sources (costs category with construction subcategory)
        const costSources = CASHFLOW_SOURCE_REGISTRY.costs || [];
        const capexSources = costSources.filter(source =>
            source.category === 'construction' ||
            source.id.includes('capex') ||
            source.id.includes('drawdown')
        );

        if (capexSources.length === 0) {
            return {
                value: [],
                formatted: "No Data",
                error: 'No capex sources found in registry',
                metadata: { calculationMethod: 'totalCapex', hasData: false }
            };
        }

        // Process each capex source using registry-based extraction
        const allYears = new Set();
        const sourceResults = new Map();

        capexSources.forEach(sourceConfig => {
            try {
                const baseData = extractDataForScenario(sourceConfig, computationScenario, getValueByPath);

                sourceResults.set(sourceConfig.id, baseData || []);
                baseData.forEach(point => {
                    if (point && typeof point.year === 'number') {
                        allYears.add(point.year);
                    }
                });

            } catch (error) {
                console.warn(`Failed to process capex source ${sourceConfig.id}:`, error.message);
                sourceResults.set(sourceConfig.id, []);
            }
        });

        // Aggregate all capex sources by year
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
                calculationMethod: 'totalCapex',
                hasData: true,
                periods: aggregatedData.length,
                sourceCount: capexSources.length,
                inputSources: capexSources.map(s => s.id)
            }
        };

    } catch (error) {
        return {
            value: [],
            formatted: "Error",
            error: `Total capex calculation failed: ${error.message}`,
            metadata: { calculationMethod: 'totalCapex', hasData: false }
        };
    }
};

export const format = (value) => {
    if (!Array.isArray(value) || value.length === 0) return 'No Data';
    return 'Time Series';
};

export const formatImpact = (impact) => 'N/A';

export const metadata = {
    name: 'Total Capex',
    shortName: 'Capex',
    description: 'Aggregated capital expenditures from construction and development sources',
    units: 'timeSeries',
    displayUnits: 'USD',
    windIndustryStandard: true,
    calculationComplexity: 'medium'
};