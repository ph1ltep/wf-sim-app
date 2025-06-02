// src/utils/cashflow/transformers/costTransformer.js - Cost-specific transformations

/**
 * Transform major repair events to annual costs
 * @param {Array} majorRepairEvents - Array of repair event objects
 * @param {Object} sourceConfig - Source configuration
 * @param {Object} context - Transformation context
 * @returns {Array} Array of DataPointSchema objects
 */
export const majorRepairsToAnnualCosts = (majorRepairEvents, sourceConfig, context = {}) => {
    if (!Array.isArray(majorRepairEvents)) {
        console.warn('majorRepairsToAnnualCosts: Expected array of repair events');
        return [];
    }

    const annualCosts = [];

    majorRepairEvents.forEach(event => {
        if (event.year && typeof event.cost === 'number') {
            // Apply probability if specified
            const adjustedCost = event.probability
                ? event.cost * (event.probability / 100)
                : event.cost;

            annualCosts.push({
                year: event.year,
                value: adjustedCost
            });
        }
    });

    return annualCosts.sort((a, b) => a.year - b.year);
};

/**
 * Transform fixed cost value to time series
 * @param {number} fixedCost - Fixed annual cost
 * @param {Object} sourceConfig - Source configuration
 * @param {Object} context - Transformation context
 * @returns {Array} Array of DataPointSchema objects
 */
export const fixedCostToTimeSeries = (fixedCost, sourceConfig, context = {}) => {
    if (typeof fixedCost !== 'number') {
        console.warn('fixedCostToTimeSeries: Expected number, got:', typeof fixedCost);
        return [];
    }

    const { projectLife = 20 } = context;
    const timeSeries = [];

    for (let year = 1; year <= projectLife; year++) {
        timeSeries.push({ year, value: fixedCost });
    }

    return timeSeries;
};

/**
 * Transform reserve funds to provision schedule
 * @param {number} reserveFunds - Total reserve fund amount
 * @param {Object} sourceConfig - Source configuration
 * @param {Object} context - Transformation context
 * @returns {Array} Array of DataPointSchema objects
 */
export const reserveFundsToProvision = (reserveFunds, sourceConfig, context = {}) => {
    if (typeof reserveFunds !== 'number' || reserveFunds <= 0) {
        console.warn('reserveFundsToProvision: Invalid reserve funds amount');
        return [];
    }

    const { projectLife = 20 } = context;

    // Option 1: Spread provision over first 5 years
    const provisionYears = Math.min(5, projectLife);
    const annualProvision = reserveFunds / provisionYears;

    const timeSeries = [];
    for (let year = 1; year <= provisionYears; year++) {
        timeSeries.push({
            year,
            value: annualProvision,
            metadata: {
                type: 'provision',
                note: 'Reserve fund allocation (not immediate cash outflow)'
            }
        });
    }

    return timeSeries;
};

/**
 * Transform CAPEX drawdown schedule to annual costs
 * @param {Array} costSources - Array of cost source objects with drawdown schedules
 * @param {Object} sourceConfig - Source configuration
 * @param {Object} context - Transformation context
 * @returns {Array} Array of DataPointSchema objects
 */
export const capexDrawdownToAnnualCosts = (costSources, sourceConfig, context = {}) => {
    if (!Array.isArray(costSources)) {
        console.warn('capexDrawdownToAnnualCosts: Expected array of cost sources');
        return [];
    }

    const annualCosts = [];
    const yearlyTotals = new Map();

    costSources.forEach(source => {
        const schedule = source.drawdownSchedule || [];
        const totalAmount = source.totalAmount || 0;

        schedule.forEach(item => {
            if (typeof item.year === 'number' && typeof item.value === 'number') {
                const yearAmount = (item.value / 100) * totalAmount;
                const currentTotal = yearlyTotals.get(item.year) || 0;
                yearlyTotals.set(item.year, currentTotal + yearAmount);
            }
        });
    });

    // Convert to DataPointSchema array
    Array.from(yearlyTotals.entries()).forEach(([year, amount]) => {
        annualCosts.push({
            year: parseInt(year),
            value: amount
        });
    });

    return annualCosts.sort((a, b) => a.year - b.year);
};