// src/utils/cashflow/multipliers/operations.js - Individual multiplier operations

/**
 * Multiplier operation functions
 */
export const MULTIPLIER_OPERATIONS = {
    /**
     * Simple multiplication: baseValue * multiplierValue
     * @param {number} baseValue - Original value
     * @param {number} multiplierValue - Multiplier to apply
     * @returns {number} Result
     */
    multiply: (baseValue, multiplierValue) => {
        return baseValue * multiplierValue;
    },

    /**
     * Compound growth: baseValue * (1 + rate)^(year - baseYear)
     * @param {number} baseValue - Original value
     * @param {number} rate - Annual growth rate (as percentage)
     * @param {number} year - Current year
     * @param {number} baseYear - Base year for calculation
     * @returns {number} Compounded value
     */
    compound: (baseValue, rate, year, baseYear = 1) => {
        const periods = year - baseYear;
        return baseValue * Math.pow(1 + (rate / 100), periods);
    },

    /**
     * Simple additive growth: baseValue * (1 + rate * (year - baseYear))
     * @param {number} baseValue - Original value  
     * @param {number} rate - Annual growth rate (as percentage)
     * @param {number} year - Current year
     * @param {number} baseYear - Base year for calculation
     * @returns {number} Calculated value
     */
    simple: (baseValue, rate, year, baseYear = 1) => {
        const periods = year - baseYear;
        return baseValue * (1 + (rate / 100) * periods);
    }
};