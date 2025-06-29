// frontend/src/utils/cashflow/metrics/foundational/totalRevenue.js
// Total Revenue foundational metric - replaces .aggregations.totalRevenue

/**
 * Calculate total revenue time series by aggregating all revenue sources
 * @param {Object} input - MetricInput with rawData from CASHFLOW_SOURCE_REGISTRY
 * @returns {Object} MetricResult with time series data
 */
export const calculate = (input) => {
    try {
        const { rawData } = input;

        if (!rawData?.sources) {
            return {
                value: [],
                error: 'No source data available for revenue aggregation',
                metadata: { hasData: false }
            };
        }

        // Aggregate all revenue sources (positive values)
        const revenueSources = {};
        const revenueYears = new Set();

        // Identify revenue sources (typically positive cashflows)
        Object.entries(rawData.sources).forEach(([sourceKey, sourceData]) => {
            if (Array.isArray(sourceData) && sourceData.length > 0) {
                // Check if this is likely a revenue source (positive values, revenue-like name)
                const isRevenueSource = sourceKey.toLowerCase().includes('revenue') ||
                    sourceKey.toLowerCase().includes('income') ||
                    sourceData.some(d => d.value > 0);

                if (isRevenueSource) {
                    revenueSources[sourceKey] = sourceData;
                    sourceData.forEach(d => revenueYears.add(d.year));
                }
            }
        });

        // Create aggregated time series
        const totalRevenueData = [];
        const sortedYears = Array.from(revenueYears).sort((a, b) => a - b);

        sortedYears.forEach(year => {
            let yearTotal = 0;

            Object.values(revenueSources).forEach(sourceData => {
                const yearData = sourceData.find(d => d.year === year);
                if (yearData && yearData.value > 0) { // Only positive revenues
                    yearTotal += yearData.value;
                }
            });

            totalRevenueData.push({
                year,
                value: yearTotal
            });
        });

        return {
            value: totalRevenueData,
            error: null,
            metadata: {
                hasData: totalRevenueData.length > 0,
                sourceCount: Object.keys(revenueSources).length,
                totalYears: totalRevenueData.length,
                sources: Object.keys(revenueSources),
                calculationMethod: 'aggregation'
            }
        };

    } catch (error) {
        return {
            value: [],
            error: `Total revenue calculation failed: ${error.message}`,
            metadata: { hasData: false }
        };
    }
};

/**
 * Format total revenue for display
 * @param {Array} value - Time series array
 * @returns {string} Formatted display value
 */
export const format = (value) => {
    if (!Array.isArray(value) || value.length === 0) return 'No Data';
    return `Revenue Time Series (${value.length} years)`;
};

/**
 * Metadata for total revenue metric
 */
export const metadata = {
    units: 'timeSeries',
    description: 'Aggregated revenue time series from all revenue sources',
    windIndustryStandard: 'Project revenue aggregation'
};