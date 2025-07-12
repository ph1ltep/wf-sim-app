// frontend/src/utils/cashflow/metrics/analytical/lcoe.js
import { applyAggregationStrategy } from '../processor.js';

/**
 * Calculate Levelized Cost of Energy (LCOE)
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateLCOE = (input) => {
    const { cashflowData, aggregations, scenarioData, options = {} } = input;

    try {
        // Get costs and energy production data
        let totalCostsData, energyProductionData;

        if (aggregations?.totalCosts) {
            totalCostsData = aggregations.totalCosts;
        } else if (cashflowData?.aggregations?.totalCosts) {
            totalCostsData = cashflowData.aggregations.totalCosts.data;
        }

        if (aggregations?.energyProduction) {
            energyProductionData = aggregations.energyProduction;
        } else {
            // Look for energy revenue and derive production
            const energyRevenue = cashflowData?.lineItems?.find(item => item.id === 'energyRevenue');
            if (energyRevenue?.data) {
                // Simple estimation: assume $50/MWh average price
                const estimatedPrice = 50;
                energyProductionData = energyRevenue.data.map(point => ({
                    year: point.year,
                    value: point.value / estimatedPrice
                }));
            }
        }

        if (!totalCostsData || !energyProductionData) {
            return {
                value: null,
                error: 'Missing cost or energy production data for LCOE calculation',
                metadata: { hasData: false }
            };
        }

        // Get discount rate
        let discountRate = options.discountRate;
        if (!discountRate || discountRate === 'auto') {
            const financing = scenarioData?.settings?.modules?.financing;
            discountRate = (financing?.costOfEquity || 8) / 100;
        }

        // Calculate NPV of costs
        const npvCosts = totalCostsData.reduce((npv, point) => {
            const presentValue = point.value / Math.pow(1 + discountRate, point.year);
            return npv + presentValue;
        }, 0);

        // Calculate NPV of energy production
        const npvEnergy = energyProductionData.reduce((npv, point) => {
            const presentValue = point.value / Math.pow(1 + discountRate, point.year);
            return npv + presentValue;
        }, 0);

        if (npvEnergy === 0) {
            return {
                value: null,
                error: 'Zero energy production - cannot calculate LCOE',
                metadata: { hasData: true, validForLCOE: false }
            };
        }

        const lcoe = npvCosts / npvEnergy;

        return {
            value: lcoe,
            error: null,
            metadata: {
                hasData: true,
                validForLCOE: true,
                npvCosts,
                npvEnergy,
                discountRate: discountRate * 100
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `LCOE calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format LCOE value for display
 * @param {number} value - LCOE value in $/MWh
 * @param {Object} options - Formatting options
 * @returns {string} Formatted LCOE
 */
export const formatLCOE = (value, options = {}) => {
    const { precision = 1, showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    const formatted = value.toFixed(precision);
    return showUnit ? `$${formatted}/MWh` : formatted;
};

/**
 * Format LCOE impact for sensitivity analysis
 * @param {number} impact - Impact value in $/MWh
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatLCOEImpact = (impact, options = {}) => {
    const { precision = 1, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}$${formatted}/MWh`;
};

