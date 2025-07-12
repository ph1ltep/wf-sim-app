import { filterCubeSourceData, aggregateCubeSourceData, normalizeIntoSimResults } from './common.js';

/**
 * Calculate total costs by aggregating all cost sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context with addAuditEntry
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalCost = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile, addAuditEntry } = context;

    // Filter to cost sources only
    const costSources = filterCubeSourceData(processedData, {
        cashflowType: 'outflow',
    });


    if (costSources.length === 0) {
        console.warn('⚠️ No cost sources found for totalCost calculation');
        return [];
    }

    console.log(`📊 Aggregating ${costSources.length} cost sources for totalCost`);

    // Aggregate all cost sources with audit trail
    return aggregateCubeSourceData(costSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);
};

/**
 * Calculate total debt by aggregating debt-related sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context with addAuditEntry
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalDebt = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile, addAuditEntry } = context;

    // Filter to debt sources (liability cashflow group or financing category)
    const debtSources = filterCubeSourceData(processedData, {
        metadata: {
            cashflowGroup: 'liability'
        }
    });

    // Also include financing-related cost sources
    const financingCosts = filterCubeSourceData(processedData, {
        cashflowType: 'outflow',
        category: 'financing'
    });

    const allDebtSources = [...debtSources, ...financingCosts];

    if (allDebtSources.length === 0) {
        console.warn('⚠️ No debt sources found for totalDebt calculation');
        return [];
    }

    console.log(`📊 Aggregating ${allDebtSources.length} debt sources for totalDebt`);

    // Aggregate all debt-related sources with audit trail
    return aggregateCubeSourceData(allDebtSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);
};

/**
 * Calculate total CAPEX by aggregating construction and capital-related sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context with addAuditEntry
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalCapex = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile, addAuditEntry } = context;

    // Filter to construction category sources
    const constructionSources = filterCubeSourceData(processedData, {
        accountingClass: "capex"
    });

    if (constructionSources.length === 0) {
        console.warn('⚠️ No CAPEX sources found for totalCapex calculation');
        return [];
    }

    console.log(`📊 Aggregating ${constructionSources.length} CAPEX sources for totalCapex`);

    // Aggregate all CAPEX sources with audit trail
    return aggregateCubeSourceData(constructionSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);
};

/**
 * Calculate total revenue by aggregating all revenue sources
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects
 */
export const totalRevenue = (sourceData, context) => {
    const { processedData, availablePercentiles, customPercentile, addAuditEntry } = context;

    // Filter to revenue sources only
    const revenueSources = filterCubeSourceData(processedData, {
        cashflowType: "inflow"
    });

    if (revenueSources.length === 0) {
        console.warn('⚠️ No revenue sources found for totalRevenue calculation');
        return [];
    }

    console.log(`📊 Aggregating ${revenueSources.length} revenue sources for totalRevenue`);

    // Aggregate all revenue sources
    return aggregateCubeSourceData(revenueSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);
};

