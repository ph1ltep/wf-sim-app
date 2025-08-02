// utils/cube/metrics/transformers/financial.js
import { extractSourcePercentileData, extractMetricValue, calculateIRR, calculateNPV, buildMetricResults } from './common.js';

/**
 * Calculate Project IRR using pre-computed project cashflow source
 * @param {Object} dependencies - Resolved dependencies
 * @param {Object} context - Transformer context
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculateProjectIRR = (dependencies, context) => {
    const { availablePercentiles, addAuditEntry } = context;

    const results = [];

    availablePercentiles.forEach(percentile => {
        // Get pre-computed project cashflow data directly from source
        const projectCashflowData = dependencies.sources.projectCashflow[percentile]?.data || [];

        if (projectCashflowData.length === 0) {
            console.warn(`⚠️ No project cashflow data for Project IRR at P${percentile}`);
            results.push({
                percentile: { value: percentile },
                value: 0,
                stats: { error: 'no_cashflow_data' }
            });
            return;
        }

        // Calculate IRR directly from pre-computed cashflows
        const irr = calculateIRR(projectCashflowData);

        // Extract stats from cashflow data
        const initialInvestment = Math.abs(projectCashflowData.find(d => d.year === 0)?.value || 0);
        const totalInflows = projectCashflowData.filter(d => d.year > 0 && d.value > 0)
            .reduce((sum, d) => sum + d.value, 0);
        const totalOutflows = projectCashflowData.filter(d => d.value < 0)
            .reduce((sum, d) => sum + Math.abs(d.value), 0);

        results.push({
            percentile: { value: percentile },
            value: irr,
            stats: {
                initialInvestment,
                totalInflows,
                totalOutflows,
                cashflowYears: projectCashflowData.length - 1, // Exclude year 0
                paybackIndicator: totalInflows / initialInvestment
            }
        });

        addAuditEntry('project_irr_calculated',
            `calculated Project IRR ${irr.toFixed(2)}% for percentile ${percentile}`,
            ['projectCashflow']);
    });

    console.log(`💰 calculateProjectIRR: Processed ${results.length} percentiles`);
    return results;
};

/**
 * Calculate Equity IRR using pre-computed equity cashflow source
 * @param {Object} dependencies - Resolved dependencies
 * @param {Object} context - Transformer context
 * @returns {Array} Array of CubeMetricResultSchema objects
 */
export const calculateEquityIRR = (dependencies, context) => {
    const { availablePercentiles, addAuditEntry } = context;

    const results = [];

    availablePercentiles.forEach(percentile => {
        // Get pre-computed equity cashflow data directly from source
        const equityCashflowData = dependencies.sources.equityCashflow[percentile]?.data || [];

        if (equityCashflowData.length === 0) {
            console.warn(`⚠️ No equity cashflow data for Equity IRR at P${percentile}`);
            results.push({
                percentile: { value: percentile },
                value: 0,
                stats: { error: 'no_cashflow_data' }
            });
            return;
        }

        // Calculate Equity IRR directly from pre-computed cashflows
        const equityIRR = calculateIRR(equityCashflowData);

        // Extract stats from cashflow data
        const equityInvestment = Math.abs(equityCashflowData.find(d => d.year === 0)?.value || 0);
        const totalEquityInflows = equityCashflowData.filter(d => d.year > 0 && d.value > 0)
            .reduce((sum, d) => sum + d.value, 0);
        const totalEquityOutflows = equityCashflowData.filter(d => d.value < 0)
            .reduce((sum, d) => sum + Math.abs(d.value), 0);

        // Calculate returns multiples
        const cashOnCashReturn = totalEquityInflows / equityInvestment;

        results.push({
            percentile: { value: percentile },
            value: equityIRR,
            stats: {
                equityInvestment,
                totalEquityInflows,
                totalEquityOutflows,
                cashOnCashReturn,
                cashflowYears: equityCashflowData.length - 1 // Exclude year 0
            }
        });

        addAuditEntry('equity_irr_calculated',
            `calculated Equity IRR ${equityIRR.toFixed(2)}% for percentile ${percentile}`,
            ['equityCashflow']);
    });

    console.log(`💰 calculateEquityIRR: Processed ${results.length} percentiles`);
    return results;
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