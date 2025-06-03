// src/utils/cashflow/transformers/contractTransformer.js - Updated to new signature
import { contractsToAnnualCostsTotal } from '../contractUtils';

/**
 * Transform OEM contracts to annual cost data (uses centralized logic)
 * @param {Array} dataSource - Primary data: oemContracts array
 * @param {Object} dataReferences - Reference data: {reference: {}, global: {projectLife, numWTGs, currency}, context: {}}
 * @param {Object} sourceConfig - Source configuration from registry
 * @returns {Array} Array of DataPointSchema objects
 */
export const contractsToAnnualCosts = (dataSource, dataReferences, sourceConfig) => {
    const oemContracts = dataSource;
    const { projectLife, numWTGs } = dataReferences.global;

    if (!Array.isArray(oemContracts)) {
        console.warn('contractsToAnnualCosts: Expected array of contracts, got:', typeof oemContracts);
        return [];
    }

    // Create context object for the utility function
    const context = { projectLife, numWTGs };

    // Use the centralized logic that matches ContractScopeChart's fee-total calculation
    const result = contractsToAnnualCostsTotal(oemContracts, sourceConfig, context);

    if (result.length > 0) {
        const totalFees = result.reduce((sum, item) => sum + item.value, 0);
        console.log(`📋 Contract fees: ${result.length} years, total ${totalFees.toLocaleString()}`);
    }

    return result;
};

// Keep legacy function for reference but update its signature
export const contractsToAnnualCostsLegacy = (dataSource, dataReferences, sourceConfig) => {
    const oemContracts = dataSource;
    const { numWTGs } = dataReferences.global;

    if (!Array.isArray(oemContracts)) {
        console.warn('contractsToAnnualCostsLegacy: Expected array of contracts, got:', typeof oemContracts);
        return [];
    }

    const annualCosts = new Map();

    oemContracts.forEach(contract => {
        // Handle time-series contracts (fixedFeeTimeSeries)
        if (contract.fixedFeeTimeSeries && Array.isArray(contract.fixedFeeTimeSeries)) {
            contract.fixedFeeTimeSeries.forEach(dataPoint => {
                if (dataPoint.year && typeof dataPoint.value === 'number') {
                    const currentCost = annualCosts.get(dataPoint.year) || 0;

                    let contractCost = dataPoint.value;
                    if (contract.isPerTurbine) {
                        contractCost = contractCost * numWTGs;
                    }

                    annualCosts.set(dataPoint.year, currentCost + contractCost);
                }
            });
        }
        // Handle fixed annual fee with years array
        else if (contract.years && Array.isArray(contract.years) && contract.fixedFee) {
            contract.years.forEach(year => {
                const currentCost = annualCosts.get(year) || 0;

                let contractCost = contract.fixedFee || 0;
                if (contract.isPerTurbine) {
                    contractCost = contractCost * numWTGs;
                }

                annualCosts.set(year, currentCost + contractCost);
            });
        }
    });

    // Convert Map to DataPointSchema array
    return Array.from(annualCosts.entries())
        .map(([year, value]) => ({
            year: parseInt(year),
            value: value
        }))
        .sort((a, b) => a.year - b.year);
};