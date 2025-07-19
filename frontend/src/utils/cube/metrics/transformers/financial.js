// utils/cube/metrics/transformers/financial.js
import { extractSourcePercentileData, extractMetricValue, calculateIRR, calculateNPV, buildMetricResults } from './common.js';

/**
 * Calculate Project IRR from net cashflow and initial investment
 * @param {Object} dependencies - Resolved dependencies
 * @param {Object} context - Simplified transformer context
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculateProjectIRR = (dependencies, context) => {
    const { availablePercentiles, addAuditEntry } = context;

    return availablePercentiles.map(percentile => {
        // ✅ Direct access to sources
        const netCashflowData = dependencies.sources.netCashflow[percentile].data;
        const totalCapexData = dependencies.sources.totalCapex[percentile].data;

        // ✅ Direct access to references
        const minimumIRR = dependencies.references.financing?.minimumIRR || 0;

        // Get initial investment from total CAPEX
        const initialInvestment = totalCapexData.find(d => d.year === 0)?.value || 0;

        // Build cashflow array starting with negative investment
        const cashflows = [
            { year: 0, value: -initialInvestment },
            ...netCashflowData.filter(d => d.year > 0)
        ];

        // Calculate IRR using helper function
        const irr = calculateIRR(cashflows);

        addAuditEntry('irr_calculation',
            `calculated IRR ${irr.toFixed(2)}% for percentile ${percentile}`,
            ['netCashflow', 'totalCapex']);

        return {
            percentile: { value: percentile },
            value: Math.max(irr, minimumIRR), // Apply minimum IRR constraint
            stats: {}
        };
    });
};

/**
 * Calculate Equity IRR from net cashflow minus debt service
 * @param {Object} dependencies - Resolved dependencies
 * @param {Object} context - Transformer context
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculateEquityIRR = (dependencies, context) => {
    const { availablePercentiles, allReferences, addAuditEntry } = context;

    // For each percentile:
    // 1. Extract net cashflow and debt service data
    // 2. Calculate equity investment from totalCapex and financing.debtFinancingRatio
    // 3. Build equity cashflow array (net cashflow - debt service, starting with negative equity investment)
    // 4. Calculate IRR using common.calculateIRR()
    // 5. Add audit entry
    // Return buildMetricResults(equityIrrValue, availablePercentiles)
};

/**
 * Calculate NPV using cost of equity as discount rate
 * @param {Object} dependencies - Resolved dependencies
 * @param {Object} context - Transformer context
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculateNPV = (dependencies, context) => {
    const { availablePercentiles, allReferences, addAuditEntry } = context;

    // For each percentile:
    // 1. Extract net cashflow data
    // 2. Get discount rate from allReferences.financing.costOfEquity (convert % to decimal)
    // 3. Calculate NPV using common.calculateNPV()
    // 4. Add audit entry
    // Return buildMetricResults(npvValue, availablePercentiles)
};

// Add to utils/cube/metrics/transformers/financial.js

/**
 * Calculate payback period from cumulative cashflow
 * @param {Object} dependencies - Resolved dependencies { sources: {}, metrics: {}, references: {} }
 * @param {Object} context - Transformer context { availablePercentiles, allReferences, processedData, aggregationResults, customPercentile, addAuditEntry }
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculatePaybackPeriod = (dependencies, context) => {
    const { availablePercentiles, addAuditEntry } = context;

    // Validate that we have cumulative cashflow source
    if (!dependencies.sources.cumulativeCashflow) {
        throw new Error('Payback period calculation requires cumulativeCashflow source dependency');
    }

    addAuditEntry('payback_period_start',
        'calculating payback period from cumulative cashflow data',
        ['cumulativeCashflow']);

    const results = [];

    // Process each percentile separately
    availablePercentiles.forEach(percentile => {
        const cumulativeCashflowData = dependencies.sources.cumulativeCashflow[percentile];

        if (!cumulativeCashflowData || !cumulativeCashflowData.data) {
            console.warn(`⚠️ No cumulative cashflow data for percentile ${percentile}`);
            results.push({
                percentile: { value: percentile },
                value: dependencies.references.projectLife || 25, // ✅ Direct access
                stats: {}
            });
            return;
        }

        const timeSeriesData = cumulativeCashflowData.data;
        const sortedData = [...timeSeriesData].sort((a, b) => a.year - b.year);

        let paybackPeriod = dependencies.references.projectLife || 25; // ✅ Direct access

        // Find first year where cumulative cashflow becomes positive
        for (let i = 0; i < sortedData.length; i++) {
            const currentDataPoint = sortedData[i];

            if (currentDataPoint.value > 0) {
                if (i === 0) {
                    // First year is already positive
                    paybackPeriod = currentDataPoint.year;
                } else {
                    // Linear interpolation for more precise payback period
                    const prevDataPoint = sortedData[i - 1];

                    if (prevDataPoint.value < 0) {
                        // Interpolate between negative and positive cashflow
                        const fraction = Math.abs(prevDataPoint.value) /
                            (currentDataPoint.value - prevDataPoint.value);
                        paybackPeriod = prevDataPoint.year + fraction;
                    } else {
                        // Previous year was also positive, use current year
                        paybackPeriod = currentDataPoint.year;
                    }
                }
                break;
            }
        }

        // Round to reasonable precision (e.g., 2 decimal places)
        paybackPeriod = Math.round(paybackPeriod * 100) / 100;

        results.push({
            percentile: { value: percentile },
            value: paybackPeriod,
            stats: {}
        });

        addAuditEntry('payback_period_calculated',
            `calculated payback period ${paybackPeriod} years for percentile ${percentile}`,
            ['cumulativeCashflow']);
    });


    console.log(`💰 calculatePaybackPeriod: Processed ${results.length} percentiles`);

    return results;
};

/**
 * Calculate Levelized Cost of Energy (LCOE)
 * @param {Object} dependencies - Resolved dependencies
 * @param {Object} context - Transformer context
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculateLCOE = (dependencies, context) => {
    const { availablePercentiles, allReferences, addAuditEntry } = context;

    // For each percentile:
    // 1. Extract total cost and energy revenue data
    // 2. Get discount rate from allReferences.financing.costOfEquity
    // 3. Calculate NPV of total costs
    // 4. Calculate NPV of energy production (derive MWh from revenue/price)
    // 5. LCOE = NPV of costs / NPV of energy production
    // 6. Add audit entry
    // Return buildMetricResults(lcoeValue, availablePercentiles)
};