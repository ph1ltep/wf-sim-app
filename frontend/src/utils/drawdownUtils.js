// src/utils/drawdownUtils.js
/**
 * Default construction phase configuration
 * These can be easily modified without touching the schema
 */
export const CONSTRUCTION_PHASE_DEFAULTS = {
    costSources: [
        {
            id: 'devex',
            name: 'Development (DEVEX)',
            totalAmount: 10000000,
            defaultSchedule: [
                { yearOffset: -5, value: 40 }, // 5 years before COD
                { yearOffset: -4, value: 30 }, // 4 years before COD
                { yearOffset: -3, value: 30 }  // 3 years before COD
            ]
        },
        {
            id: 'bop',
            name: 'Balance of Plant',
            totalAmount: 12000000,
            defaultSchedule: [
                { yearOffset: -3, value: 30 },
                { yearOffset: -2, value: 70 }
            ]
        },
        {
            id: 'wtg',
            name: 'Wind Turbine Generators',
            totalAmount: 35000000,
            defaultSchedule: [
                { yearOffset: -3, value: 10 },
                { yearOffset: -2, value: 40 },
                { yearOffset: -1, value: 45 },
                { yearOffset: 0, value: 5 }
            ]
        },
        {
            id: 'other',
            name: 'Other Costs',
            totalAmount: 3000000,
            defaultSchedule: [
                { yearOffset: 0, value: 100 }
            ]
        }
    ]
};

/**
 * Generate cost sources with actual year values based on COD date
 * @param {Date} codDate - Commercial Operation Date
 * @returns {Array} Cost sources with populated drawdown schedules
 */
export const generateConstructionCostSources = (codDate) => {
    return CONSTRUCTION_PHASE_DEFAULTS.costSources.map(source => ({
        ...source,
        drawdownSchedule: source.defaultSchedule.map(item => ({
            year: item.yearOffset, // Keep relative to COD
            value: item.value
        }))
    }));
};

/**
 * Calculate timeline years relative to COD
 * @param {Date} codDate - Commercial Operation Date
 * @param {Date} ntpDate - Notice to Proceed Date
 * @param {Date} devDate - Development Start Date
 * @returns {Object} Timeline years relative to COD
 */
export const calculateTimelineYears = (codDate, ntpDate, devDate) => {
    if (!codDate) {
        return {
            developmentStartYear: -5,
            ntpYear: -3
        };
    }

    const codYear = codDate.getFullYear();

    const developmentStartYear = devDate
        ? devDate.getFullYear() - codYear
        : -5;

    const ntpYear = ntpDate
        ? ntpDate.getFullYear() - codYear
        : -3;

    return {
        developmentStartYear,
        ntpYear
    };
};

/**
 * Initialize construction cost sources if they don't exist
 * @param {Array} existingCostSources - Current cost sources array
 * @returns {Array} Cost sources with defaults applied if needed
 */
export const initializeConstructionCostSources = (existingCostSources = []) => {
    if (existingCostSources.length > 0) {
        return existingCostSources; // Already initialized
    }

    return generateConstructionCostSources();
};