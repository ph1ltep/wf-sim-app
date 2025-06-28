// frontend/src/utils/cashflow/metrics/calculations/icr.js
import { applyAggregationStrategy } from '../processor.js';

/**
 * Calculate Interest Coverage Ratio (ICR)
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateICR = (input) => {
    const { cashflowData, aggregations, options = {} } = input;

    try {
        // Get net cashflow and interest payment data
        let netCashflowData, interestPaymentData;

        if (aggregations?.netCashflow) {
            netCashflowData = aggregations.netCashflow;
        } else if (cashflowData?.aggregations?.netCashflow) {
            netCashflowData = cashflowData.aggregations.netCashflow.data;
        }

        if (aggregations?.interestPayments) {
            interestPaymentData = aggregations.interestPayments;
        } else if (cashflowData?.financeMetrics?.interestPayments) {
            interestPaymentData = cashflowData.financeMetrics.interestPayments.data;
        }

        if (!netCashflowData || !interestPaymentData) {
            return {
                value: [],
                error: 'Missing cashflow or interest payment data for ICR calculation',
                metadata: { hasData: false }
            };
        }

        // Create interest payment lookup map
        const interestMap = new Map(interestPaymentData.map(d => [d.year, d.value]));

        // Calculate ICR for each year
        const icrData = [];
        netCashflowData.forEach(cashflowPoint => {
            const interestPayment = interestMap.get(cashflowPoint.year);

            if (interestPayment && interestPayment > 0) {
                // ICR = EBITDA (approximated by net cash flow) / Interest Payments
                const icr = Math.max(0, cashflowPoint.value / interestPayment);
                icrData.push({
                    year: cashflowPoint.year,
                    value: icr
                });
            }
        });

        return {
            value: icrData.sort((a, b) => a.year - b.year),
            error: null,
            metadata: {
                hasData: true,
                operationalYears: icrData.filter(d => d.year > 0).length,
                totalYears: icrData.length
            }
        };

    } catch (error) {
        return {
            value: [],
            error: `ICR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format ICR value for display
 * @param {number|Array} value - ICR value or time series
 * @param {Object} options - Formatting options
 * @returns {string} Formatted ICR
 */
export const formatICR = (value, options = {}) => {
    const { precision = 2, showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    // Handle time series data
    if (Array.isArray(value)) {
        return `${value.length} data points`;
    }

    const formatted = value.toFixed(precision);
    return showUnit ? `${formatted}x` : formatted;
};

/**
 * Format ICR impact for sensitivity analysis
 * @param {number} impact - Impact value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatICRImpact = (impact, options = {}) => {
    const { precision = 2, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}${formatted}x`;
};

