// frontend/src/utils/cashflow/metrics/calculations/irr.js
import { applyAggregationStrategy } from '../processor.js';
import { evaluateMetricThresholds } from '../registry.js';

/**
 * Calculate Internal Rate of Return using Newton-Raphson method
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateIRR = (input) => {
    const { cashflowData, aggregations, options = {} } = input;

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
                error: 'No net cashflow data available for IRR calculation',
                metadata: { hasData: false }
            };
        }

        if (!Array.isArray(cashflowTimeSeries) || cashflowTimeSeries.length === 0) {
            return {
                value: null,
                error: 'Invalid cashflow data for IRR calculation',
                metadata: { hasData: false }
            };
        }

        // Check for both negative and positive cash flows
        const hasNegative = cashflowTimeSeries.some(cf => cf.value < 0);
        const hasPositive = cashflowTimeSeries.some(cf => cf.value > 0);

        if (!hasNegative || !hasPositive) {
            return {
                value: 0,
                error: 'Need both positive and negative cash flows for IRR calculation',
                metadata: { hasData: true, validForIRR: false }
            };
        }

        // Newton-Raphson IRR calculation
        let irr = 0.1; // Initial guess: 10%
        const tolerance = 0.0001;
        const maxIterations = 100;

        for (let i = 0; i < maxIterations; i++) {
            let npv = 0;
            let dnpv = 0;

            cashflowTimeSeries.forEach(({ year, value }) => {
                const factor = Math.pow(1 + irr, year);
                npv += value / factor;
                dnpv -= (year * value) / (factor * (1 + irr));
            });

            if (Math.abs(dnpv) < tolerance) break;

            const newIrr = irr - npv / dnpv;

            if (Math.abs(newIrr - irr) < tolerance) {
                irr = newIrr;
                break;
            }

            irr = newIrr;

            // Bound IRR to reasonable range
            if (irr < -0.99) irr = -0.99;
            if (irr > 10) irr = 10;
        }

        const irrPercentage = irr * 100;

        return {
            value: irrPercentage,
            error: null,
            metadata: {
                hasData: true,
                validForIRR: true,
                iterations: maxIterations,
                cashflowPeriods: cashflowTimeSeries.length
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `IRR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format IRR value for display
 * @param {number} value - IRR value as percentage
 * @param {Object} options - Formatting options
 * @returns {string} Formatted IRR
 */
export const formatIRR = (value, options = {}) => {
    const { precision = 1, showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    const formatted = value.toFixed(precision);
    return showUnit ? `${formatted}%` : formatted;
};

/**
 * Format IRR impact for sensitivity analysis
 * @param {number} impact - Impact value in percentage points
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatIRRImpact = (impact, options = {}) => {
    const { precision = 1, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}${formatted}pp`;
};

