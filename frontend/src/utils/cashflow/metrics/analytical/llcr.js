// frontend/src/utils/cashflow/metrics/analytical/llcr.js
import { applyAggregationStrategy } from '../processor.js';

/**
 * Calculate Loan Life Coverage Ratio (LLCR)
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateLLCR = (input) => {
    const { cashflowData, aggregations, scenarioData, options = {} } = input;

    try {
        // Get net cashflow and outstanding debt data
        let netCashflowData, outstandingDebtData;

        if (aggregations?.netCashflow) {
            netCashflowData = aggregations.netCashflow;
        } else if (cashflowData?.aggregations?.netCashflow) {
            netCashflowData = cashflowData.aggregations.netCashflow.data;
        }

        if (aggregations?.outstandingDebt) {
            outstandingDebtData = aggregations.outstandingDebt;
        } else if (cashflowData?.financeMetrics?.outstandingDebt) {
            outstandingDebtData = cashflowData.financeMetrics.outstandingDebt.data;
        } else {
            // Estimate from financing settings
            const financing = scenarioData?.settings?.modules?.financing;
            const totalDebt = financing?.debtAmount || 0;
            if (totalDebt > 0) {
                outstandingDebtData = [{ year: 0, value: totalDebt }];
            }
        }

        if (!netCashflowData || !outstandingDebtData) {
            return {
                value: null,
                error: 'Missing cashflow or debt data for LLCR calculation',
                metadata: { hasData: false }
            };
        }

        // Get discount rate
        let discountRate = options.discountRate;
        if (!discountRate || discountRate === 'auto') {
            const financing = scenarioData?.settings?.modules?.financing;
            discountRate = (financing?.costOfDebt || 6) / 100;
        }

        // Filter to operational years for cash flow available for debt service
        const operationalCashflows = netCashflowData.filter(cf => cf.year > 0);

        // Calculate NPV of cash flows available for debt service
        const npvCashflows = operationalCashflows.reduce((npv, point) => {
            const presentValue = point.value / Math.pow(1 + discountRate, point.year);
            return npv + presentValue;
        }, 0);

        // Get initial outstanding debt amount
        const initialDebt = outstandingDebtData.length > 0 ? outstandingDebtData[0].value : 0;

        if (initialDebt === 0) {
            return {
                value: null,
                error: 'Zero debt amount - LLCR not applicable',
                metadata: { hasData: true, validForLLCR: false }
            };
        }

        const llcr = npvCashflows / initialDebt;

        return {
            value: llcr,
            error: null,
            metadata: {
                hasData: true,
                validForLLCR: true,
                npvCashflows,
                initialDebt,
                discountRate: discountRate * 100,
                operationalYears: operationalCashflows.length
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `LLCR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format LLCR value for display
 * @param {number} value - LLCR value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted LLCR
 */
export const formatLLCR = (value, options = {}) => {
    const { precision = 2, showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    const formatted = value.toFixed(precision);
    return showUnit ? `${formatted}x` : formatted;
};

/**
 * Format LLCR impact for sensitivity analysis
 * @param {number} impact - Impact value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatLLCRImpact = (impact, options = {}) => {
    const { precision = 2, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}${formatted}x`;
};

