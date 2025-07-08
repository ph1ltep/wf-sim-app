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
        cashflowGroup: 'cost'
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
        cashflowGroup: 'cost',
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

    // Aggregate all CAPEX sources with audit trail
    return aggregateCubeSourceData(allCapexSources, availablePercentiles, {
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
    const { processedData, availablePercentiles, customPercentile } = context;

    // Filter to revenue sources only
    const revenueSources = filterCubeSourceData(processedData, {
        cashflowGroup: 'revenue'
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
    });
};

/**
 * Transform OEM contracts to annual contract fees
 * @param {Array} sourceData - OEM contracts array
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for contract fees
 */
export const contractFees = (sourceData, context) => {
    const { addAuditEntry, availablePercentiles, customPercentile, allReferences } = context;

    // Get global references
    const projectLife = allReferences.projectLife || 20;
    const numWTGs = allReferences.numWTGs || 1;

    addAuditEntry(
        'apply_contract_fees_transformation',
        `transforming ${sourceData.length} OEM contracts to annual fees`,
        ['projectLife', 'numWTGs']
    );

    // Calculate annual contract fees
    const annualCosts = new Map();
    let totalContractFees = 0;

    sourceData.forEach(contract => {
        const { name, years, fixedFee, fixedFeeTimeSeries, isPerTurbine } = contract;

        // Handle time-series contracts (fixedFeeTimeSeries)
        if (fixedFeeTimeSeries && fixedFeeTimeSeries.length > 0) {
            fixedFeeTimeSeries.forEach(({ year, value }) => {
                const contractCost = isPerTurbine ? value * numWTGs : value;
                annualCosts.set(year, (annualCosts.get(year) || 0) + contractCost);
                totalContractFees += contractCost;
            });
        }
        // Handle fixed annual fee with years array
        else if (years && years.length > 0 && fixedFee) {
            years.forEach(year => {
                const contractCost = isPerTurbine ? fixedFee * numWTGs : fixedFee;
                annualCosts.set(year, (annualCosts.get(year) || 0) + contractCost);
                totalContractFees += contractCost;
            });
        }
    });

    // Convert to DataPointSchema array
    const contractFeesData = Array.from(annualCosts.entries())
        .map(([year, amount]) => ({
            year: parseInt(year),
            value: amount
        }))
        .sort((a, b) => a.year - b.year);

    console.log(`📋 contractFees: ${contractFeesData.length} years, $${totalContractFees.toLocaleString()}`);

    // Transform to SimResultsSchema array using helper
    return normalizeIntoSimResults(contractFeesData, availablePercentiles, 'contractFees', customPercentile);
};