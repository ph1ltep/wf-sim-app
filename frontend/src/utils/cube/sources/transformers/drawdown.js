import { filterCubeSourceData, aggregateCubeSourceData, normalizeIntoSimResults } from './common.js';

/**
 * Transform construction schedule to CAPEX drawdown schedule
 * @param {Array} sourceData - Construction cost sources array with drawdown schedules
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for CAPEX drawdown
 */
export const capexDrawdown = (sourceData, context) => {
    const { addAuditEntry, availablePercentiles, customPercentile } = context;

    addAuditEntry('apply_capex_drawdown_transformation', `transforming ${sourceData.length} construction cost sources`, []);

    // Aggregate drawdown by year
    const yearlyTotals = new Map();
    let totalCapex = 0;

    sourceData.forEach(({ name, totalAmount, drawdownSchedule }) => {
        if (!totalAmount) return;

        drawdownSchedule.forEach(({ year, value }) => {
            const yearlyAmount = (value / 100) * totalAmount;
            yearlyTotals.set(year, (yearlyTotals.get(year) || 0) + yearlyAmount);
            totalCapex += yearlyAmount;
        });
    });

    // ✅ FIXED: Convert to DataPointSchema array (one entry per year with summed amount)
    const annualCosts = Array.from(yearlyTotals.entries()).map(([year, amount]) => ({
        year: parseInt(year),
        value: amount
    })).sort((a, b) => a.year - b.year);

    console.log(`🏗️ capexDrawdown: ${yearlyTotals.size} years, $${totalCapex.toLocaleString()}`);

    return normalizeIntoSimResults(annualCosts, availablePercentiles, 'capexDrawdown', customPercentile, addAuditEntry);

};

/**
 * Transform construction schedule to debt drawdown schedule
 * @param {Array} sourceData - Construction cost sources array
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for debt drawdown
 */
export const debtDrawdown = (sourceData, context) => {
    const { addAuditEntry, availablePercentiles, customPercentile, allReferences } = context;

    // Get financing data from references
    const financing = allReferences.financing;
    if (!financing) {
        console.warn('⚠️ debtDrawdown: No financing data available in references');
        return [];
    }

    addAuditEntry(
        'apply_debt_drawdown_transformation',
        `transforming ${sourceData.length} construction cost sources to debt drawdown`,
        ['financing'], // References financing data
        sourceData,
        'transform',
        'complex'
    );

    // Get debt financing ratio (convert % to decimal)
    const debtFinancingRatio = (financing.debtFinancingRatio || 70) / 100;

    // Calculate debt drawdown by year
    const debtDrawdownByYear = new Map();
    let totalDebtDrawn = 0;

    sourceData.forEach(({ name, totalAmount, drawdownSchedule }) => {
        if (!totalAmount) return;

        drawdownSchedule.forEach(({ year, value }) => {
            const capexAmount = (value / 100) * totalAmount;
            const debtAmount = capexAmount * debtFinancingRatio;

            debtDrawdownByYear.set(year, (debtDrawdownByYear.get(year) || 0) + debtAmount);
            totalDebtDrawn += debtAmount;
        });
    });

    // Convert to DataPointSchema array
    const debtDrawdownData = Array.from(debtDrawdownByYear.entries())
        .map(([year, amount]) => ({
            year: parseInt(year),
            value: amount
        }))
        .sort((a, b) => a.year - b.year);

    console.log(`💰 debtDrawdown: ${debtDrawdownByYear.size} years, $${totalDebtDrawn.toLocaleString()} (${debtFinancingRatio * 100}% debt ratio)`);

    // Transform to SimResultsSchema array using helper
    return normalizeIntoSimResults(debtDrawdownData, availablePercentiles, 'debtDrawdown', customPercentile, addAuditEntry);
};