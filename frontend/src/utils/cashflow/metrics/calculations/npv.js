// frontend/src/utils/cashflow/metrics/calculations/npv.js
import { applyAggregationStrategy } from '../processor.js';

/**
 * Calculate Net Present Value using discount rate
 * @param {Object} input - MetricInput object  
 * @returns {Object} MetricResult
 */
export const calculateNPV = (input) => {
    const { cashflowData, aggregations, scenarioData, options = {} } = input;

    try {
        // Get net cashflow data
        let cashflowTimeSeries;
        if (aggregations?.netCashflow) {
            cashflowTimeSeries = aggregations.netCashflow;
        } else if (cashflowData?.aggregations?.netCashflow) {
            cashflowTimeSeries = cashflowData.aggregations.netCashflow.data;
        } else {
            return {
                value: null,
                error: 'No net cashflow data available for NPV calculation',
                metadata: { hasData: false }
            };
        }

        if (!Array.isArray(cashflowTimeSeries) || cashflowTimeSeries.length === 0) {
            return {
                value: null,
                error: 'Invalid cashflow data for NPV calculation',
                metadata: { hasData: false }
            };
        }

        // Get discount rate
        let discountRate = options.discountRate;
        if (!discountRate || discountRate === 'auto') {
            // Get from scenario financing settings
            const financing = scenarioData?.settings?.modules?.financing;
            discountRate = (financing?.costOfEquity || 8) / 100;
        }

        // Calculate NPV
        const npv = cashflowTimeSeries.reduce((accumulator, dataPoint) => {
            const { year, value } = dataPoint;
            const presentValue = value / Math.pow(1 + discountRate, year);
            return accumulator + presentValue;
        }, 0);

        return {
            value: npv,
            error: null,
            metadata: {
                hasData: true,
                discountRate: discountRate * 100,
                cashflowPeriods: cashflowTimeSeries.length
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `NPV calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format NPV value for display
 * @param {number} value - NPV value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted NPV
 */
export const formatNPV = (value, options = {}) => {
    const { precision = 0, currency = 'USD', showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    let formatted;
    if (absValue >= 1000000000) {
        formatted = `${sign}$${(absValue / 1000000000).toFixed(1)}B`;
    } else if (absValue >= 1000000) {
        formatted = `${sign}$${(absValue / 1000000).toFixed(precision)}M`;
    } else if (absValue >= 1000) {
        formatted = `${sign}$${(absValue / 1000).toFixed(precision)}K`;
    } else {
        formatted = `${sign}$${absValue.toFixed(precision)}`;
    }

    return formatted;
};

/**
 * Format NPV impact for sensitivity analysis
 * @param {number} impact - Impact value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatNPVImpact = (impact, options = {}) => {
    const { precision = 1, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const absImpact = Math.abs(impact);

    let formatted;
    if (absImpact >= 1000000) {
        formatted = `${sign}$${(impact / 1000000).toFixed(precision)}M`;
    } else if (absImpact >= 1000) {
        formatted = `${sign}$${(impact / 1000).toFixed(precision)}K`;
    } else {
        formatted = `${sign}$${impact.toFixed(0)}`;
    }

    return formatted;
};

