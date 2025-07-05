import { filterCubeSourceData, aggregateCubeSourceData } from './common.js';

/**
 * Calculate total costs by aggregating all cost sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalCost = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile } = context;

    // Filter to cost sources only
    const costSources = filterCubeSourceData(processedData, {
        cashflowGroup: 'cost'
    });

    if (costSources.length === 0) {
        console.warn('⚠️ No cost sources found for totalCost calculation');
        return [];
    }

    console.log(`📊 Aggregating ${costSources.length} cost sources for totalCost`);

    // Aggregate all cost sources
    return aggregateCubeSourceData(costSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    });
};

/**
 * Calculate total debt by aggregating debt-related sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalDebt = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile } = context;

    // Filter to debt sources (liability cashflow group or financing category)
    const debtSources = filterCubeSourceData(processedData, {
        metadata: {
            cashflowGroup: 'liability'
        }
    });

    // Also include financing-related cost sources
    const financingCosts = filterCubeSourceData(processedData, {
        cashflowGroup: 'cost',
        category: 'financing'
    });

    const allDebtSources = [...debtSources, ...financingCosts];

    if (allDebtSources.length === 0) {
        console.warn('⚠️ No debt sources found for totalDebt calculation');
        return [];
    }

    console.log(`📊 Aggregating ${allDebtSources.length} debt sources for totalDebt`);

    // Aggregate all debt-related sources
    return aggregateCubeSourceData(allDebtSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    });
};

/**
 * Calculate total CAPEX by aggregating construction and capital-related sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalCapex = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile } = context;

    // Filter to construction category sources
    const constructionSources = filterCubeSourceData(processedData, {
        category: 'construction'
    });

    // Also include asset cashflow group sources
    const assetSources = filterCubeSourceData(processedData, {
        cashflowGroup: 'asset'
    });

    const allCapexSources = [...constructionSources, ...assetSources];

    if (allCapexSources.length === 0) {
        console.warn('⚠️ No CAPEX sources found for totalCapex calculation');
        return [];
    }

    console.log(`📊 Aggregating ${allCapexSources.length} CAPEX sources for totalCapex`);

    // Aggregate all CAPEX sources
    return aggregateCubeSourceData(allCapexSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    });
};