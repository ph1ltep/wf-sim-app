// src/utils/cashflow/transformers/contractTransformer.js - Updated with centralized logic
import { contractsToAnnualCostsTotal } from '../contractUtils';

/**
 * Transform OEM contracts to annual cost data (uses centralized logic)
 * @param {Array} oemContracts - Array of contract objects
 * @param {Object} sourceConfig - Source configuration from registry
 * @param {Object} context - Transformation context {projectLife, numWTGs, etc.}
 * @returns {Array} Array of DataPointSchema objects
 */
export const contractsToAnnualCosts = (oemContracts, sourceConfig, context = {}) => {
    // Use the centralized logic that matches ContractScopeChart's fee-total calculation
    return contractsToAnnualCostsTotal(oemContracts, sourceConfig, context);
};

// Legacy function kept for backward compatibility (if needed)
export const contractsToAnnualCostsLegacy = (oemContracts, sourceConfig, context = {}) => {
    if (!Array.isArray(oemContracts)) {
        console.warn('contractsToAnnualCosts: Expected array of contracts');
        return [];
    }

    const annualCosts = new Map();
    const { numWTGs = 1 } = context;

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