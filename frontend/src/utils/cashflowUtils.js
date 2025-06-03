// src/utils/cashflowUtils.js - Core cashflow utilities
import { get } from 'lodash';

/**
 * Extract all sources that have percentiles from the registry
 * @param {Object} registry - CASHFLOW_SOURCE_REGISTRY
 * @returns {Array} Array of {id, category} objects for sources with percentiles
 */
export const getPercentileSourcesFromRegistry = (registry) => {
    const sources = [];

    // Add multipliers with percentiles
    registry.multipliers?.forEach(source => {
        if (source.hasPercentiles) {
            sources.push({ id: source.id, category: 'multipliers' });
        }
    });

    // Add costs with percentiles
    registry.costs?.forEach(source => {
        if (source.hasPercentiles) {
            sources.push({ id: source.id, category: 'costs' });
        }
    });

    // Add revenues with percentiles
    registry.revenues?.forEach(source => {
        if (source.hasPercentiles) {
            sources.push({ id: source.id, category: 'revenues' });
        }
    });

    return sources;
};

/**
 * Create default per-source percentile selection
 * @param {Array} percentileSources - Array of source objects with percentiles
 * @param {number} primaryPercentile - Default percentile value
 * @returns {Object} Object mapping sourceId to percentile value
 */
export const createPerSourceDefaults = (percentileSources, primaryPercentile) => {
    const perSourceDefaults = {};
    percentileSources.forEach(source => {
        perSourceDefaults[source.id] = primaryPercentile;
    });
    return perSourceDefaults;
};

/**
 * Validate percentile selection against available percentiles
 * @param {Object} selection - Percentile selection object
 * @param {Array} availablePercentiles - Available percentile values
 * @param {string} strategy - PERCENTILE_STRATEGIES value
 * @returns {boolean} True if selection is valid
 */
export const validatePercentileStrategy = (selection, availablePercentiles, strategy) => {
    if (availablePercentiles.length === 0) return true;

    if (strategy === 'unified') {
        return availablePercentiles.includes(selection.unified);
    } else if (strategy === 'perSource') {
        return Object.values(selection.perSource).every(p => availablePercentiles.includes(p));
    }
    return true;
};

/**
 * Get percentile value for a specific source based on current strategy
 * @param {string} sourceId - Source identifier
 * @param {Object} selectedPercentiles - Current percentile selection
 * @param {number} primaryPercentile - Fallback percentile
 * @returns {number} Percentile value for the source
 */
export const getPercentileForSource = (sourceId, selectedPercentiles, primaryPercentile) => {
    if (selectedPercentiles.strategy === 'unified') {
        return selectedPercentiles.unified;
    } else if (selectedPercentiles.strategy === 'perSource') {
        return selectedPercentiles.perSource[sourceId] || primaryPercentile;
    }
    return primaryPercentile;
};

/**
 * Aggregate line items into totals
 * @param {Array} lineItems - Array of CashflowLineItem objects
 * @param {string} category - 'cost' or 'revenue'
 * @param {Array} availablePercentiles - Available percentile values
 * @returns {Object} Aggregated data with percentile and fixed components
 */
export const aggregateLineItems = (lineItems, category, availablePercentiles) => {
    const categoryItems = lineItems.filter(item => item.category === category);

    const aggregation = {
        percentileData: new Map(),
        fixedData: []
    };

    // Aggregate percentile data
    availablePercentiles.forEach(percentile => {
        const yearlyTotals = new Map();

        categoryItems.forEach(item => {
            if (item.hasPercentileVariation && item.percentileData.has(percentile)) {
                const itemData = item.percentileData.get(percentile);
                itemData.forEach(dataPoint => {
                    const currentTotal = yearlyTotals.get(dataPoint.year) || 0;
                    yearlyTotals.set(dataPoint.year, currentTotal + dataPoint.value);
                });
            }
        });

        // Convert to array and sort by year
        const aggregatedData = Array.from(yearlyTotals.entries())
            .map(([year, value]) => ({ year: parseInt(year), value }))
            .sort((a, b) => a.year - b.year);

        aggregation.percentileData.set(percentile, aggregatedData);
    });

    // Aggregate fixed data
    const fixedYearlyTotals = new Map();
    categoryItems.forEach(item => {
        if (!item.hasPercentileVariation && item.fixedData.length > 0) {
            item.fixedData.forEach(dataPoint => {
                const currentTotal = fixedYearlyTotals.get(dataPoint.year) || 0;
                fixedYearlyTotals.set(dataPoint.year, currentTotal + dataPoint.value);
            });
        }
    });

    aggregation.fixedData = Array.from(fixedYearlyTotals.entries())
        .map(([year, value]) => ({ year: parseInt(year), value }))
        .sort((a, b) => a.year - b.year);

    return aggregation;
};

/**
 * Calculate enhanced finance metrics with real debt service
 * @param {Object} aggregations - Cashflow aggregations
 * @param {Array} availablePercentiles - Available percentile values
 * @param {Object} scenarioData - Full scenario data for parameters
 * @param {Array} lineItems - All line items for debt service lookup
 * @returns {Object} Finance metrics with percentile data
 */
export const calculateFinanceMetrics = (aggregations, availablePercentiles, scenarioData, lineItems = []) => {
    const financeMetrics = {
        dscr: new Map(),
        llcr: new Map(),
        irr: new Map(),
        npv: new Map(),
        covenantBreaches: new Map()
    };

    // Get financing parameters
    const financingParams = scenarioData?.settings?.modules?.financing || {};
    const minimumDSCR = financingParams.minimumDSCR || 1.3;

    availablePercentiles.forEach(percentile => {
        const netCashflowData = aggregations.netCashflow.data || [];

        // Find operational debt service line item
        const debtServiceLineItem = lineItems.find(item => item.id === 'operationalDebtService');
        const debtServiceData = debtServiceLineItem?.data || [];

        // Calculate DSCR using real debt service
        const dscrData = [];

        if (debtServiceData.length > 0) {
            // Create map for efficient lookup
            const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));

            netCashflowData.forEach(cashflowPoint => {
                const debtService = debtServiceMap.get(cashflowPoint.year);

                if (debtService && debtService > 0) {
                    // DSCR = Net Operating Cash Flow / Debt Service
                    const dscr = Math.max(0, cashflowPoint.value / debtService);
                    dscrData.push({
                        year: cashflowPoint.year,
                        value: dscr
                    });
                }
            });
        }

        // If no debt service data, fall back to placeholder calculation
        if (dscrData.length === 0) {
            console.warn('No debt service data found, using placeholder DSCR calculation');
            netCashflowData.forEach(dataPoint => {
                dscrData.push({
                    year: dataPoint.year,
                    value: Math.max(0.5, 1.0 + (dataPoint.value / 10000000)) // Placeholder formula
                });
            });
        }

        financeMetrics.dscr.set(percentile, dscrData);

        // Placeholder values for other metrics (to be enhanced later)
        financeMetrics.irr.set(percentile, 8.5 + (percentile - 50) * 0.1);
        financeMetrics.npv.set(percentile, 50000000 + (percentile - 50) * 1000000);
        financeMetrics.llcr.set(percentile, 1.2 + (percentile - 50) * 0.01);

        // Covenant breach detection using real DSCR data
        const breaches = dscrData
            .filter(d => d.value < minimumDSCR)
            .map(d => ({
                year: d.year,
                dscr: d.value,
                threshold: minimumDSCR,
                margin: minimumDSCR - d.value,
                severity: d.value < 1.0 ? 'severe' : d.value < 1.2 ? 'moderate' : 'minor'
            }));

        financeMetrics.covenantBreaches.set(percentile, breaches);
    });

    return financeMetrics;
};