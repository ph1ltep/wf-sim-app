// src/utils/marketFactors/helpers.js - Market factor helper functions for cost category access

/**
 * Get the market factor ID assigned to a specific cost category
 * @param {Object} scenarioData - Complete scenario data object
 * @param {string} costCategory - Cost category key (material, labor, tooling, crane, contractsLocal, contractsForeign, other)
 * @returns {string|null} Market factor ID or null if not found
 * 
 * @example
 * const factorId = getMarketFactorIdForCostCategory(scenarioData, 'material');
 * // Returns: 'customMaterialFactor' or 'baseEscalationRate'
 */
export const getMarketFactorIdForCostCategory = (scenarioData, costCategory) => {
    if (!scenarioData || typeof costCategory !== 'string') {
        console.warn('getMarketFactorIdForCostCategory: Invalid parameters provided');
        return null;
    }

    try {
        // Default cost category mappings
        const defaultMappings = {
            material: 'baseEscalationRate',
            labor: 'baseEscalationRate',
            tooling: 'baseEscalationRate',
            crane: 'baseEscalationRate',
            contractsLocal: 'baseEscalationRate',
            contractsForeign: 'baseEscalationRate',
            other: 'baseEscalationRate'
        };

        // Get current mappings from scenario data
        const costCategoryFactors = scenarioData?.settings?.project?.equipment?.failureRates?.costCategoryFactors;
        
        if (costCategoryFactors && typeof costCategoryFactors === 'object') {
            return costCategoryFactors[costCategory] || defaultMappings[costCategory];
        }

        return defaultMappings[costCategory] || null;
    } catch (error) {
        console.error('Error getting market factor ID for cost category:', error);
        return null;
    }
};

/**
 * Get market factor simulation results for a specific cost category
 * @param {Object} scenarioData - Complete scenario data object
 * @param {string} costCategory - Cost category key
 * @param {number} percentile - Percentile to retrieve (e.g., 50 for median)
 * @returns {Object|null} Market factor data with structure { data: [{year, value}], metadata: {} }
 * 
 * @example
 * const materialFactorData = getMarketFactorForCostCategory(scenarioData, 'material', 50);
 * // Returns: { data: [{year: 1, value: 1.02}, {year: 2, value: 1.04}], metadata: {...} }
 */
export const getMarketFactorForCostCategory = (scenarioData, costCategory, percentile) => {
    if (!scenarioData || typeof costCategory !== 'string' || typeof percentile !== 'number') {
        console.warn('getMarketFactorForCostCategory: Invalid parameters provided');
        return null;
    }

    try {
        const factorId = getMarketFactorIdForCostCategory(scenarioData, costCategory);
        if (!factorId) {
            console.warn(`No market factor ID found for cost category: ${costCategory}`);
            return null;
        }

        // Check if cube data is available for market factors
        const cubeData = scenarioData?.simulation?.results?.marketFactors;
        if (!cubeData || !Array.isArray(cubeData)) {
            console.warn('Market factor simulation results not available in cube data');
            return null;
        }

        // Find the specific factor results
        const factorResults = cubeData.find(factor => factor.id === factorId);
        if (!factorResults) {
            console.warn(`No simulation results found for market factor: ${factorId}`);
            return null;
        }

        // Find the percentile data
        const percentileData = factorResults.percentileSource?.find(
            ps => ps.percentile?.value === percentile
        );
        
        if (!percentileData) {
            console.warn(`No data found for percentile ${percentile} in market factor ${factorId}`);
            return null;
        }

        return {
            data: percentileData.data || [],
            metadata: {
                factorId,
                costCategory,
                percentile,
                factorName: factorResults.metadata?.name || factorId,
                ...factorResults.metadata
            }
        };
    } catch (error) {
        console.error('Error getting market factor for cost category:', error);
        return null;
    }
};

/**
 * Get the market factor definition/configuration for a specific cost category
 * @param {Object} scenarioData - Complete scenario data object
 * @param {string} costCategory - Cost category key
 * @returns {Object|null} Market factor configuration object
 * 
 * @example
 * const factorDef = getMarketFactorDefinitionForCostCategory(scenarioData, 'material');
 * // Returns: { id: 'customMaterialFactor', name: 'Material Cost Factor', distribution: {...} }
 */
export const getMarketFactorDefinitionForCostCategory = (scenarioData, costCategory) => {
    if (!scenarioData || typeof costCategory !== 'string') {
        console.warn('getMarketFactorDefinitionForCostCategory: Invalid parameters provided');
        return null;
    }

    try {
        const factorId = getMarketFactorIdForCostCategory(scenarioData, costCategory);
        if (!factorId) {
            return null;
        }

        // Get market factors array from settings
        const marketFactors = scenarioData?.settings?.marketFactors?.factors;
        if (!Array.isArray(marketFactors)) {
            console.warn('Market factors not found in scenario settings');
            return null;
        }

        // Find the specific factor definition
        const factorDef = marketFactors.find(factor => factor.id === factorId);
        if (!factorDef) {
            console.warn(`Market factor definition not found for ID: ${factorId}`);
            return null;
        }

        return {
            ...factorDef,
            assignedToCostCategory: costCategory
        };
    } catch (error) {
        console.error('Error getting market factor definition for cost category:', error);
        return null;
    }
};

/**
 * Get complete mapping of all cost categories to their assigned market factors
 * @param {Object} scenarioData - Complete scenario data object
 * @returns {Object} Object with cost category keys and market factor ID values
 * 
 * @example
 * const mappings = getAllCostCategoryMappings(scenarioData);
 * // Returns: { material: 'materialFactor', labor: 'baseEscalationRate', ... }
 */
export const getAllCostCategoryMappings = (scenarioData) => {
    if (!scenarioData) {
        console.warn('getAllCostCategoryMappings: No scenario data provided');
        return {};
    }

    try {
        const costCategories = ['material', 'labor', 'tooling', 'crane', 'contractsLocal', 'contractsForeign', 'other'];
        const mappings = {};

        costCategories.forEach(category => {
            const factorId = getMarketFactorIdForCostCategory(scenarioData, category);
            if (factorId) {
                mappings[category] = factorId;
            }
        });

        return mappings;
    } catch (error) {
        console.error('Error getting all cost category mappings:', error);
        return {};
    }
};

/**
 * Get market factor multiplier for a specific cost category, year, and percentile
 * @param {Object} scenarioData - Complete scenario data object
 * @param {string} costCategory - Cost category key
 * @param {number} year - Year to get multiplier for
 * @param {number} percentile - Percentile value (e.g., 50)
 * @returns {number} Market factor multiplier value, defaults to 1.0 if not found
 * 
 * @example
 * const multiplier = getMarketFactorMultiplier(scenarioData, 'material', 5, 50);
 * // Returns: 1.08 (8% escalation by year 5)
 */
export const getMarketFactorMultiplier = (scenarioData, costCategory, year, percentile) => {
    if (!scenarioData || typeof costCategory !== 'string' || typeof year !== 'number' || typeof percentile !== 'number') {
        console.warn('getMarketFactorMultiplier: Invalid parameters provided');
        return 1.0;
    }

    try {
        const factorData = getMarketFactorForCostCategory(scenarioData, costCategory, percentile);
        if (!factorData || !Array.isArray(factorData.data)) {
            // Fallback: try to get from distribution parameters
            const factorDef = getMarketFactorDefinitionForCostCategory(scenarioData, costCategory);
            if (factorDef?.distribution?.parameters) {
                const baseValue = factorDef.distribution.parameters.value || 1.0;
                const drift = (factorDef.distribution.parameters.drift || 0) / 100; // Convert percentage to decimal
                
                if (drift !== 0) {
                    // Apply compound growth: value * (1 + drift)^year
                    return baseValue * Math.pow(1 + drift, year);
                }
                
                return baseValue;
            }
            
            console.warn(`No market factor data found for category ${costCategory}, year ${year}, percentile ${percentile}`);
            return 1.0;
        }

        // Find the specific year data
        const yearData = factorData.data.find(d => d.year === year);
        if (yearData) {
            return yearData.value || 1.0;
        }

        // If exact year not found, try interpolation or use nearest year
        const sortedData = factorData.data.sort((a, b) => a.year - b.year);
        
        if (year < sortedData[0]?.year) {
            return sortedData[0]?.value || 1.0;
        }
        
        if (year > sortedData[sortedData.length - 1]?.year) {
            return sortedData[sortedData.length - 1]?.value || 1.0;
        }

        // Linear interpolation between two years
        for (let i = 0; i < sortedData.length - 1; i++) {
            const current = sortedData[i];
            const next = sortedData[i + 1];
            
            if (year >= current.year && year <= next.year) {
                const factor = (year - current.year) / (next.year - current.year);
                return current.value + factor * (next.value - current.value);
            }
        }

        console.warn(`Could not find or interpolate market factor for year ${year}`);
        return 1.0;
    } catch (error) {
        console.error('Error getting market factor multiplier:', error);
        return 1.0;
    }
};

/**
 * Apply market factors to a cost breakdown by cost category
 * @param {Object} baseCostData - Base cost data structure with {year, value} arrays
 * @param {Object} costCategoryBreakdown - Breakdown of costs by category for each year
 * @param {Object} scenarioData - Complete scenario data object
 * @param {number} percentile - Percentile to use for market factor application
 * @returns {Object} Cost data with market factors applied
 * 
 * @example
 * const adjustedCosts = applyCostCategoryMarketFactors(
 *   baseCostData,
 *   { material: 0.4, labor: 0.3, crane: 0.3 }, // percentage breakdown
 *   scenarioData,
 *   50
 * );
 */
export const applyCostCategoryMarketFactors = (baseCostData, costCategoryBreakdown, scenarioData, percentile) => {
    if (!baseCostData || !costCategoryBreakdown || !scenarioData || typeof percentile !== 'number') {
        console.warn('applyCostCategoryMarketFactors: Invalid parameters provided');
        return baseCostData;
    }

    try {
        // Validate cost category breakdown percentages sum to 1.0
        const breakdownSum = Object.values(costCategoryBreakdown).reduce((sum, pct) => sum + (pct || 0), 0);
        if (Math.abs(breakdownSum - 1.0) > 0.01) {
            console.warn(`Cost category breakdown doesn't sum to 1.0 (sum: ${breakdownSum})`);
        }

        // Create adjusted cost data
        const adjustedCosts = {};

        Object.keys(baseCostData).forEach(costSourceKey => {
            const baseCosts = baseCostData[costSourceKey];
            if (!Array.isArray(baseCosts)) {
                adjustedCosts[costSourceKey] = baseCosts;
                return;
            }

            // Apply market factors to each year's cost
            adjustedCosts[costSourceKey] = baseCosts.map(costPoint => {
                let adjustedValue = 0;

                // Apply market factor for each cost category
                Object.entries(costCategoryBreakdown).forEach(([category, percentage]) => {
                    if (percentage > 0) {
                        const multiplier = getMarketFactorMultiplier(scenarioData, category, costPoint.year, percentile);
                        const categoryValue = costPoint.value * percentage * multiplier;
                        adjustedValue += categoryValue;
                    }
                });

                return {
                    year: costPoint.year,
                    value: adjustedValue,
                    originalValue: costPoint.value,
                    marketFactorAdjustment: adjustedValue - costPoint.value
                };
            });
        });

        return adjustedCosts;
    } catch (error) {
        console.error('Error applying cost category market factors:', error);
        return baseCostData;
    }
};

/**
 * Get market factor time series data for a cost category (all years)
 * @param {Object} scenarioData - Complete scenario data object  
 * @param {string} costCategory - Cost category key
 * @param {number} percentile - Percentile value
 * @returns {Array} Array of {year, value} objects representing the factor over time
 * 
 * @example
 * const timeSeries = getMarketFactorTimeSeries(scenarioData, 'material', 50);
 * // Returns: [{year: 1, value: 1.02}, {year: 2, value: 1.04}, ...]
 */
export const getMarketFactorTimeSeries = (scenarioData, costCategory, percentile) => {
    const factorData = getMarketFactorForCostCategory(scenarioData, costCategory, percentile);
    
    if (!factorData || !Array.isArray(factorData.data)) {
        return [];
    }
    
    return factorData.data.sort((a, b) => a.year - b.year);
};

/**
 * Check if market factors are configured and available for simulation
 * @param {Object} scenarioData - Complete scenario data object
 * @returns {Object} Status object with availability and issues
 * 
 * @example
 * const status = validateMarketFactorAvailability(scenarioData);
 * // Returns: { available: true, factors: 3, issues: [] }
 */
export const validateMarketFactorAvailability = (scenarioData) => {
    const result = {
        available: false,
        factors: 0,
        mappings: 0,
        issues: []
    };

    if (!scenarioData) {
        result.issues.push('No scenario data provided');
        return result;
    }

    try {
        // Check market factors configuration
        const marketFactors = scenarioData?.settings?.marketFactors?.factors;
        if (!Array.isArray(marketFactors) || marketFactors.length === 0) {
            result.issues.push('No market factors configured');
        } else {
            result.factors = marketFactors.length;
            
            // Validate each factor has required fields
            marketFactors.forEach((factor, index) => {
                if (!factor.id) {
                    result.issues.push(`Market factor ${index} missing ID`);
                }
                if (!factor.distribution) {
                    result.issues.push(`Market factor ${factor.id || index} missing distribution`);
                }
            });
        }

        // Check cost category mappings
        const mappings = getAllCostCategoryMappings(scenarioData);
        const mappingCount = Object.keys(mappings).length;
        result.mappings = mappingCount;
        
        if (mappingCount < 7) {
            result.issues.push(`Only ${mappingCount}/7 cost categories have market factor mappings`);
        }

        // Check if simulation results are available
        const cubeData = scenarioData?.simulation?.results?.marketFactors;
        if (!cubeData) {
            result.issues.push('Market factor simulation results not available - run simulation first');
        }

        result.available = result.issues.length === 0 && result.factors > 0;

    } catch (error) {
        result.issues.push(`Validation error: ${error.message}`);
    }

    return result;
};

/**
 * Get market factor summary statistics for a cost category across percentiles
 * @param {Object} scenarioData - Complete scenario data object
 * @param {string} costCategory - Cost category key  
 * @param {number} year - Year to analyze
 * @param {Array} percentiles - Array of percentiles to include (defaults to [10, 25, 50, 75, 90])
 * @returns {Object} Summary statistics object
 * 
 * @example
 * const stats = getMarketFactorSummaryStats(scenarioData, 'material', 5, [25, 50, 75]);
 * // Returns: { P25: 1.06, P50: 1.08, P75: 1.11, mean: 1.083, range: 0.05 }
 */
export const getMarketFactorSummaryStats = (scenarioData, costCategory, year, percentiles = [10, 25, 50, 75, 90]) => {
    if (!scenarioData || !costCategory || typeof year !== 'number') {
        console.warn('getMarketFactorSummaryStats: Invalid parameters');
        return {};
    }

    try {
        const stats = {};
        const values = [];

        // Get multiplier for each percentile
        percentiles.forEach(p => {
            const multiplier = getMarketFactorMultiplier(scenarioData, costCategory, year, p);
            if (multiplier !== 1.0) { // Only include if we got actual data
                stats[`P${p}`] = multiplier;
                values.push(multiplier);
            }
        });

        // Calculate additional statistics if we have values
        if (values.length > 1) {
            stats.mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            stats.min = Math.min(...values);
            stats.max = Math.max(...values);
            stats.range = stats.max - stats.min;
            stats.std = Math.sqrt(
                values.reduce((sum, val) => sum + Math.pow(val - stats.mean, 2), 0) / values.length
            );
        }

        return stats;
    } catch (error) {
        console.error('Error calculating market factor summary stats:', error);
        return {};
    }
};