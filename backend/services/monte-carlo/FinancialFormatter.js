// backend/services/monte-carlo/FinancialFormatter.js
const ResultFormatter = require('./ResultFormatter');

/**
 * Specialized formatter for financial metrics
 */
class FinancialFormatter {
  /**
   * Format IRR (Internal Rate of Return) results
   * 
   * @param {Array<number>} irrValues - Array of IRR values from iterations
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted IRR results
   */
  static formatIRR(irrValues, percentiles) {
    // Convert IRR to percentage values
    const percentageValues = irrValues.map(value => value * 100);
    return ResultFormatter.formatPercentiles(percentageValues, percentiles);
  }

  /**
   * Format NPV (Net Present Value) results
   * 
   * @param {Array<number>} npvValues - Array of NPV values from iterations
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted NPV results
   */
  static formatNPV(npvValues, percentiles) {
    return ResultFormatter.formatPercentiles(npvValues, percentiles);
  }

  /**
   * Format payback period results
   * 
   * @param {Array<number>} paybackValues - Array of payback period values
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted payback period results
   */
  static formatPayback(paybackValues, percentiles) {
    return ResultFormatter.formatPercentiles(paybackValues, percentiles);
  }

  /**
   * Format DSCR (Debt Service Coverage Ratio) results
   * 
   * @param {Array<Array<number>>} dscrTimeSeries - DSCR time series from iterations
   * @param {Array<number>} minDscrValues - Minimum DSCR values from iterations
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted DSCR results
   */
  static formatDSCR(dscrTimeSeries, minDscrValues, percentiles) {
    return {
      timeSeries: ResultFormatter.formatTimeSeries(dscrTimeSeries, percentiles),
      minimum: ResultFormatter.formatPercentiles(minDscrValues, percentiles),
      probabilityBelow1: minDscrValues.filter(value => value < 1).length / minDscrValues.length
    };
  }

  /**
   * Format cash flow results
   * 
   * @param {Array<Array<number>>} cashFlowTimeSeries - Cash flow time series from iterations
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted cash flow results
   */
  static formatCashFlow(cashFlowTimeSeries, percentiles) {
    return ResultFormatter.formatTimeSeries(cashFlowTimeSeries, percentiles);
  }
}

module.exports = FinancialFormatter;