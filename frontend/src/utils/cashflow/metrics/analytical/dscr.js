// frontend/src/utils/cashflow/metrics//dscr.js
import { applyAggregationStrategy } from '../processor.js';

/**
 * Calculate DSCR time series
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateDSCR = (input) => {
    const { cashflowData, aggregations, options = {} } = input;

    try {
        // Get net cashflow and debt service data
        let netCashflowData, debtServiceData;

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

        if (!netCashflowData || !debtServiceData) {
            return {
                value: [],
                error: 'Missing cashflow or debt service data for DSCR calculation',
                metadata: { hasData: false }
            };
        }

        // Create debt service lookup map
        const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));

        // Calculate DSCR for each year
        const dscrData = [];
        netCashflowData.forEach(cashflowPoint => {
            const debtService = debtServiceMap.get(cashflowPoint.year);

            if (debtService && debtService > 0) {
                const dscr = Math.max(0, cashflowPoint.value / debtService);
                dscrData.push({
                    year: cashflowPoint.year,
                    value: dscr
                });
            }
        });

        return {
            value: dscrData.sort((a, b) => a.year - b.year),
            error: null,
            metadata: {
                hasData: true,
                operationalYears: dscrData.filter(d => d.year > 0).length,
                totalYears: dscrData.length
            }
        };

    } catch (error) {
        return {
            value: [],
            error: `DSCR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Calculate Average DSCR (operational years only)
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateAvgDSCR = (input) => {
    const dscrResult = calculateDSCR(input);

    if (dscrResult.error || !dscrResult.value) {
        return dscrResult;
    }

    try {
        const operationalDSCR = dscrResult.value.filter(d => d.year > 0);

        if (operationalDSCR.length === 0) {
            return {
                value: 0,
                error: 'No operational years found for average DSCR',
                metadata: { hasData: false }
            };
        }

        const sum = operationalDSCR.reduce((total, d) => total + d.value, 0);
        const average = sum / operationalDSCR.length;

        return {
            value: average,
            error: null,
            metadata: {
                hasData: true,
                operationalYears: operationalDSCR.length,
                calculationMethod: 'mean'
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `Average DSCR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Calculate Minimum DSCR (operational years only)
 * @param {Object} input - MetricInput object
 * @returns {Object} MetricResult
 */
export const calculateMinDSCR = (input) => {
    const dscrResult = calculateDSCR(input);

    if (dscrResult.error || !dscrResult.value) {
        return dscrResult;
    }

    try {
        const operationalDSCR = dscrResult.value.filter(d => d.year > 0);

        if (operationalDSCR.length === 0) {
            return {
                value: 0,
                error: 'No operational years found for minimum DSCR',
                metadata: { hasData: false }
            };
        }

        const minimum = Math.min(...operationalDSCR.map(d => d.value));

        return {
            value: minimum,
            error: null,
            metadata: {
                hasData: true,
                operationalYears: operationalDSCR.length,
                calculationMethod: 'minimum'
            }
        };

    } catch (error) {
        return {
            value: null,
            error: `Minimum DSCR calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format DSCR value for display
 * @param {number|Array} value - DSCR value or time series
 * @param {Object} options - Formatting options
 * @returns {string} Formatted DSCR
 */
export const formatDSCR = (value, options = {}) => {
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
 * Format DSCR impact for sensitivity analysis
 * @param {number} impact - Impact value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted impact
 */
export const formatDSCRImpact = (impact, options = {}) => {
    const { precision = 2, showSign = true } = options;

    if (impact === null || impact === undefined) return 'N/A';

    const sign = showSign && impact > 0 ? '+' : '';
    const formatted = impact.toFixed(precision);
    return `${sign}${formatted}x`;
};

