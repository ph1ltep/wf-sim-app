// src/utils/cashflow/contractUtils.js - Simplified based on heatmap logic

/**
 * Transform contracts to annual costs using heatmap-style logic
 * Based on transformContractsToHeatmapData from ContractScopeChart
 * @param {Array} oemContracts - Array of contract objects
 * @param {number} projectLife - Project duration in years
 * @param {number} numWTGs - Number of turbines
 * @returns {Array} Array of {year, value} objects with total costs per year
 */
export const transformContractsToAnnualCosts = (oemContracts, projectLife, numWTGs) => {
    if (!Array.isArray(oemContracts) || oemContracts.length === 0) {
        return [];
    }

    const years = Array.from({ length: projectLife }, (_, i) => i + 1);
    const annualCosts = [];

    // For each year, calculate total fees from all contracts (same as heatmap summation row)
    years.forEach(year => {
        let yearTotal = 0;

        // Sum all contract values for this year (same logic as heatmap)
        oemContracts.forEach(contract => {
            // Check if contract is active in this year
            if (!contract.years?.includes(year)) return;

            // Calculate fee (normalize to total, not per-unit)
            const baseFee = contract.fixedFee || 0;
            const totalFee = contract.isPerTurbine ? baseFee * numWTGs : baseFee;

            yearTotal += totalFee;
        });

        // Only add years with actual costs
        if (yearTotal > 0) {
            annualCosts.push({ year, value: yearTotal });
        }
    });

    return annualCosts.sort((a, b) => a.year - b.year);
};

/**
 * Updated contractsToAnnualCostsTotal using heatmap logic
 */
export const contractsToAnnualCostsTotal = (oemContracts, sourceConfig, context = {}) => {
    const { projectLife = 20, numWTGs = 1 } = context;

    if (!Array.isArray(oemContracts) || oemContracts.length === 0) {
        return [];
    }

    const result = transformContractsToAnnualCosts(oemContracts, projectLife, numWTGs);

    if (result.length > 0) {
        console.log(`📋 Contract fees: ${result.length} years, total ${result.reduce((sum, item) => sum + item.value, 0).toLocaleString()}`);
    }

    return result;
};