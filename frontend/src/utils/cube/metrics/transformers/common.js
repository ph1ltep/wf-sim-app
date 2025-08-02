// frontend/src/utils/cube/metrics/transformers/common.js

/**
 * Extract specific percentile metric result from CubeMetricDataSchema object
 * @param {Object} metricData - CubeMetricDataSchema object
 * @param {number} percentile - Percentile to extract
 * @returns {Object|null} CubeMetricResultSchema object for the percentile, or null if not found
 */
export const extractPercentileMetric = (metricData, percentile) => {
    if (!metricData || !Array.isArray(metricData.percentileMetrics)) return null;

    // Find the metric result for the specific percentile
    const percentileResult = metricData.percentileMetrics.find(item =>
        item.percentile && item.percentile.value === percentile
    );

    return percentileResult || null;
};

/**
 * Calculate Internal Rate of Return using Newton-Raphson method
 * Optimized for cube metrics system with better performance and error handling
 * @param {Array} cashflows - Array of {year, value} objects
 * @returns {number} IRR as percentage (e.g., 8.5 for 8.5%)
 */
export const calculateIRR = (cashflows) => {
    if (!Array.isArray(cashflows) || cashflows.length === 0) return 0;

    // Validate and clean cashflow structure
    const validCashflows = cashflows
        .filter(cf => cf && typeof cf.year === 'number' && typeof cf.value === 'number' && !isNaN(cf.value))
        .sort((a, b) => a.year - b.year); // Ensure sorted by year

    if (validCashflows.length < 2) return 0;

    // Check if we have at least one negative and one positive cash flow
    const hasNegative = validCashflows.some(cf => cf.value < 0);
    const hasPositive = validCashflows.some(cf => cf.value > 0);

    if (!hasNegative || !hasPositive) {
        console.warn('calculateIRR: Need both positive and negative cash flows for IRR calculation');
        return 0;
    }

    // Calculate improved initial guess based on simple metrics
    const totalOutflows = Math.abs(validCashflows.filter(cf => cf.value < 0).reduce((sum, cf) => sum + cf.value, 0));
    const totalInflows = validCashflows.filter(cf => cf.value > 0).reduce((sum, cf) => sum + cf.value, 0);
    const averageYear = validCashflows.filter(cf => cf.value > 0).reduce((sum, cf, _, arr) => sum + cf.year / arr.length, 0);

    // Simple approximation: (total return / investment) ^ (1/years) - 1
    const simpleReturn = totalOutflows > 0 ? (totalInflows / totalOutflows) : 1;
    const initialGuess = averageYear > 0 ? Math.pow(simpleReturn, 1 / averageYear) - 1 : 0.1;

    // Bound initial guess to reasonable range
    let irr = Math.max(0.001, Math.min(0.8, initialGuess)); // 0.1% to 80%

    const tolerance = 0.000001; // Higher precision
    const maxIterations = 150; // More iterations for better convergence

    let lastNpv = Infinity;
    let oscillationCount = 0;

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let dnpv = 0;

        // Calculate NPV and derivative more efficiently
        for (const { year, value } of validCashflows) {
            if (year === 0) {
                npv += value;
                // Derivative is 0 for year 0
            } else {
                const factor = Math.pow(1 + irr, year);
                npv += value / factor;
                dnpv -= (year * value) / (factor * (1 + irr));
            }
        }

        // Check for convergence
        if (Math.abs(npv) < tolerance) break;

        // Detect oscillation and dampen
        if (Math.abs(npv) > Math.abs(lastNpv)) {
            oscillationCount++;
            if (oscillationCount > 3) {
                // Apply dampening factor
                const dampening = 0.5;
                const adjustment = (npv / dnpv) * dampening;
                irr = irr - adjustment;
            }
        } else {
            oscillationCount = 0;
        }
        lastNpv = npv;

        // Avoid division by zero or very small derivatives
        if (Math.abs(dnpv) < tolerance) {
            console.warn('calculateIRR: Derivative too small, stopping iteration');
            break;
        }

        const adjustment = npv / dnpv;
        const newIrr = irr - adjustment;

        // Check for convergence in IRR
        if (Math.abs(adjustment) < tolerance) {
            irr = newIrr;
            break;
        }

        irr = newIrr;

        // Adaptive bounds - tighten as we iterate
        const maxBound = Math.max(2.0, 5.0 - (i * 0.03)); // Start at 500%, reduce to 200%
        const minBound = Math.min(-0.99, -0.95 + (i * 0.001)); // Start at -95%, approach -99%

        irr = Math.max(minBound, Math.min(maxBound, irr));
    }

    // Return as percentage, with reasonable bounds
    const irrPercent = irr * 100;

    // Final sanity check - extreme values likely indicate calculation issues
    if (irrPercent < -95 || irrPercent > 1000) {
        console.warn(`calculateIRR: Extreme IRR value ${irrPercent.toFixed(2)}% - possible calculation issue`);
        return Math.max(-95, Math.min(1000, irrPercent));
    }

    return irrPercent;
};