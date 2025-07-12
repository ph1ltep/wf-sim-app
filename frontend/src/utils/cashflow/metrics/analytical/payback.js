// frontend/src/utils/cashflow/metrics/analytical/payback.js
import { applyAggregationStrategy } from '../processor.js';

/**
 * Calculate Payback Period
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculatePaybackPeriod = (input) => {
    const { cashflowData, aggregations, options = {} } = input;

    try {
        // Get net cashflow data
        let netCashflowData;

        if (aggregations?.netCashflow) {
            netCashflowData = aggregations.netCashflow;
        } else if (cashflowData?.aggregations?.netCashflow) {
            netCashflowData = cashflowData.aggregations.netCashflow.data;
        } else {
            return {
                value: null,
                error: 'No net cashflow data available for payback calculation',
                metadata: { hasData: false }
            };
        }

        if (!Array.isArray(netCashflowData) || netCashflowData.length === 0) {
            return {
                value: null,
                error: 'Invalid cashflow data for payback calculation',
                metadata: { hasData: false }
            };
        }

        // Sort by year to ensure proper order
        const sortedCashflows = [...netCashflowData].sort((a, b) => a.year - b.year);

        // Calculate cumulative cash flow
        let cumulativeCashflow = 0;
        let paybackYear = null;

        for (let i = 0; i < sortedCashflows.length; i++) {
            const { year, value } = sortedCashflows[i];
            cumulativeCashflow += value;

            // Payback occurs when cumulative cash flow becomes positive
            if (cumulativeCashflow >= 0 && paybackYear === null) {
                if (i === 0) {
                    // Payback occurs in first year
                    paybackYear = year;
                } else {
                    // Interpolate to find exact payback point
                    const previousCumulative = cumulativeCashflow - value;
                    const fraction = Math.abs(previousCumulative) / value;
                    const previousYear = sortedCashflows[i - 1].year;
                    paybackYear = previousYear + fraction;
                }
                break;
            }
        }

        // If never reached positive cumulative cash flow
        if (paybackYear === null) {
            return {
                value: null,
                error: 'Project never reaches positive cumulative cash flow',
                metadata: {
                    hasData: true,
                    validForPayback: false,
                    finalCumulativeCashflow: cumulativeCashflow
                }
            };
        }

        return {
            value: paybackYear,
            error: null,
            metadata: {
                hasData: true,
                validForPayback: true,
                totalYears: sortedCashflows.length,
                finalCumulativeCashflow: cumulativeCashflow
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `Payback calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format Payback Period value for display
 * @param {number} value - Payback period in years
 * @param {Object} options - Formatting options
 * @returns {string} Formatted payback period
 */
export const formatPaybackPeriod = (value, options = {}) => {
    const { precision = 1, showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    const formatted = value.toFixed(precision);
    return showUnit ? `${formatted} years` : formatted;
};

/**
 * Format Payback Period impact for sensitivity analysis
 * @param {number} impact - Impact value in years
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatPaybackImpact = (impact, options = {}) => {
    const { precision = 1, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}${formatted} years`;
};

