// frontend/src/utils/cashflow/metrics/analytical/equityIrr.js
import { calculateIRR } from './irr.js';

/**
 * Calculate Equity IRR
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateEquityIRR = (input) => {
    const { cashflowData, aggregations, options = {} } = input;

    try {
        // Get net cashflow, debt service, and equity investment data
        let netCashflowData, debtServiceData, equityInvestmentData;

        if (aggregations?.netCashflow) {
            netCashflowData = aggregations.netCashflow;
        } else if (cashflowData?.aggregations?.netCashflow) {
            netCashflowData = cashflowData.aggregations.netCashflow.data;
        }

        if (aggregations?.debtService) {
            debtServiceData = aggregations.debtService;
        } else if (cashflowData?.financeMetrics?.debtService) {
            debtServiceData = cashflowData.financeMetrics.debtService.data;
        }

        if (aggregations?.equityInvestment) {
            equityInvestmentData = aggregations.equityInvestment;
        } else {
            // Look for CAPEX drawdown as proxy for equity investment
            const capexDrawdown = cashflowData?.lineItems?.find(item => item.id === 'capexDrawdown');
            if (capexDrawdown?.data) {
                equityInvestmentData = capexDrawdown.data;
            }
        }

        if (!netCashflowData || !debtServiceData || !equityInvestmentData) {
            return {
                value: null,
                error: 'Missing required data for Equity IRR calculation',
                metadata: { hasData: false }
            };
        }

        // Create lookup maps
        const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));
        const equityInvestmentMap = new Map(equityInvestmentData.map(d => [d.year, d.value]));

        // Calculate equity cash flows
        const equityCashflows = [];
        netCashflowData.forEach(cashflowPoint => {
            const { year, value: netCashflow } = cashflowPoint;
            const debtService = debtServiceMap.get(year) || 0;
            const equityInvestment = equityInvestmentMap.get(year) || 0;

            // Equity cash flow = Net cash flow - Debt service - Equity investment
            const equityCashflow = netCashflow - debtService - equityInvestment;

            equityCashflows.push({
                year,
                value: equityCashflow
            });
        });

        // Use standard IRR calculation on equity cash flows
        const irrResult = calculateIRR({
            aggregations: { netCashflow: equityCashflows },
            options
        });

        return {
            value: irrResult.value,
            error: irrResult.error,
            metadata: {
                ...irrResult.metadata,
                calculationType: 'equity',
                equityPeriods: equityCashflows.length
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `Equity IRR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format Equity IRR value for display
 * @param {number} value - Equity IRR value as percentage
 * @param {Object} options - Formatting options
 * @returns {string} Formatted Equity IRR
 */
export const formatEquityIRR = (value, options = {}) => {
    const { precision = 1, showUnit = true } = options;

    if (value === null || value === undefined) return 'N/A';

    const formatted = value.toFixed(precision);
    return showUnit ? `${formatted}%` : formatted;
};

/**
 * Format Equity IRR impact for sensitivity analysis
 * @param {number} impact - Impact value in percentage points
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatEquityIRRImpact = (impact, options = {}) => {
    const { precision = 1, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}${formatted}pp`;
};

