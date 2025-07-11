import { filterCubeSourceData, aggregateCubeSourceData, normalizeIntoSimResults } from './common.js';

const Yup = require('yup');

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
    return normalizeIntoSimResults(contractFeesData, availablePercentiles, 'contractFees', customPercentile, addAuditEntry);
};

/**
 * Transform major repair events to annual costs
 * @param {Array} sourceData - Major repair events array
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for major repair costs
 */
export const majorRepairs = (sourceData, context) => {
    const { addAuditEntry, availablePercentiles, customPercentile } = context;

    // Validate input - Major repair events schema
    const MajorRepairEventsSchema = Yup.array().of(Yup.object().shape({
        year: Yup.number().required(),
        cost: Yup.number().required(),
        probability: Yup.number().min(0).max(100)
    }));

    try {
        MajorRepairEventsSchema.validateSync(sourceData);
    } catch (error) {
        console.warn('⚠️ majorRepairs: Invalid major repair events data:', error.message);
        return [];
    }

    addAuditEntry(
        'apply_major_repairs_transformation',
        `transforming ${sourceData.length} major repair events to annual costs`,
        []
    );

    // Calculate annual repair costs with probability adjustment
    const annualCosts = [];
    let totalRepairCosts = 0;

    sourceData.forEach(event => {
        const { year, cost, probability } = event;

        // Apply probability if specified (convert percentage to decimal)
        const adjustedCost = probability !== undefined
            ? cost * (probability / 100)
            : cost;

        annualCosts.push({
            year,
            value: adjustedCost
        });

        totalRepairCosts += adjustedCost;
    });

    // Sort by year
    annualCosts.sort((a, b) => a.year - b.year);

    console.log(`🔧 majorRepairs: ${annualCosts.length} events, $${totalRepairCosts.toLocaleString()}`);

    // Transform to SimResultsSchema array using helper
    return normalizeIntoSimResults(annualCosts, availablePercentiles, 'majorRepairs', customPercentile, addAuditEntry);
};

/**
 * Transform reserve funds to provision schedule
 * @param {number} sourceData - Reserve funds amount
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for reserve fund provisions
 */
export const reserveFunds = (sourceData, context) => {
    const { addAuditEntry, availablePercentiles, customPercentile, allReferences } = context;

    // Get project life from references
    const projectLife = allReferences.projectLife || 20;

    addAuditEntry(
        'apply_reserve_funds_transformation',
        `transforming reserve funds $${sourceData.toLocaleString()} to provision schedule`,
        ['projectLife']
    );

    // Spread provision over first 5 years (or project life if shorter)
    const provisionYears = Math.min(5, projectLife);
    const annualProvision = sourceData / provisionYears;

    // Create provision schedule
    const provisionData = [];
    for (let year = 1; year <= provisionYears; year++) {
        provisionData.push({
            year,
            value: annualProvision
        });
    }

    console.log(`💰 reserveFunds: ${provisionData.length} years, $${sourceData.toLocaleString()} total provision`);

    // Transform to SimResultsSchema array using helper
    return normalizeIntoSimResults(provisionData, availablePercentiles, 'reserveFunds', customPercentile, addAuditEntry);
};