// src/utils/cashflow/transformers/costTransformer.js - Updated to new methodology

/**
 * Transform major repair events to annual costs
 * @param {Object} data - Object with majorRepairEvents and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const majorRepairsToAnnualCosts = (data, sourceConfig) => {
    const { majorRepairEvents, projectLife, numWTGs } = data;

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

    console.log(`🔧 Major repairs: ${annualCosts.length} events, total ${annualCosts.reduce((sum, item) => sum + item.value, 0).toLocaleString()}`);

    return annualCosts.sort((a, b) => a.year - b.year);
};

/**
 * Transform fixed cost value to time series
 * @param {Object} data - Object with insurancePremium and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const fixedCostToTimeSeries = (data, sourceConfig) => {
    const { insurancePremium, projectLife } = data;

    if (typeof insurancePremium !== 'number') {
        console.warn('fixedCostToTimeSeries: Expected number, got:', typeof insurancePremium);
        return [];
    }

    const timeSeries = [];

    for (let year = 1; year <= projectLife; year++) {
        timeSeries.push({ year, value: insurancePremium });
    }

    console.log(`🛡️ Insurance: ${timeSeries.length} years, annual ${insurancePremium.toLocaleString()}`);

    return timeSeries;
};

/**
 * Transform reserve funds to provision schedule
 * @param {Object} data - Object with reserveFunds and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const reserveFundsToProvision = (data, sourceConfig) => {
    const { reserveFunds, projectLife } = data;

    if (typeof reserveFunds !== 'number' || reserveFunds <= 0) {
        console.warn('reserveFundsToProvision: Invalid reserve funds amount');
        return [];
    }

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

    console.log(`💰 Reserve funds: ${timeSeries.length} years, total ${reserveFunds.toLocaleString()}`);

    return timeSeries;
};

/**
 * Transform CAPEX drawdown schedule to annual costs
 * @param {Object} data - Object with costSources and global data (projectLife, numWTGs, currency)
 * @param {Object} sourceConfig - Source configuration
 * @returns {Array} Array of DataPointSchema objects
 */
export const capexDrawdownToAnnualCosts = (data, sourceConfig) => {
    const { costSources, projectLife, numWTGs } = data;

    if (!Array.isArray(costSources)) {
        console.warn('capexDrawdownToAnnualCosts: Expected array of cost sources');
        return [];
    }

    const annualCosts = [];
    const yearlyTotals = new Map();

    costSources.forEach(source => {
        const schedule = source.drawdownSchedule || [];
        const totalAmount = source.totalAmount || 0;
        const sourceName = source.name || 'Unknown Source';

        if (totalAmount === 0) {
            console.warn(`🏗️ Source '${sourceName}' has zero amount`);
            return;
        }

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

    const totalCapex = annualCosts.reduce((sum, item) => sum + item.value, 0);
    console.log(`🏗️ CAPEX drawdown: ${annualCosts.length} years, total ${totalCapex.toLocaleString()}`);

    return annualCosts.sort((a, b) => a.year - b.year);
};