// frontend/src/utils/cashflow/metrics/foundational/netCashflow.js
/**
 * Calculate net cashflow from foundational revenue and costs metrics
 * @param {Object} input - MetricInputSchema
 * @returns {Object} MetricResult with net cashflow time-series
 */
export const calculate = (input) => {
    const { foundationalMetrics, options = {} } = input;

    try {
        const revenueMetric = foundationalMetrics?.totalRevenue;
        const costsMetric = foundationalMetrics?.totalCosts;

        if (!revenueMetric?.value || !costsMetric?.value) {
            return {
                value: [],
                formatted: "No Data",
                error: 'Missing revenue or costs data for net cashflow calculation',
                metadata: { calculationMethod: 'netCashflow', hasData: false }
            };
        }

        const revenueData = revenueMetric.value;
        const costsData = costsMetric.value;

        if (!Array.isArray(revenueData) || !Array.isArray(costsData)) {
            return {
                value: [],
                formatted: "No Data",
                error: 'Invalid data format for net cashflow calculation',
                metadata: { calculationMethod: 'netCashflow', hasData: false }
            };
        }

        // Create year-based lookup for costs
        const costsMap = new Map(costsData.map(item => [item.year, item.value]));

        // Calculate net cashflow for each revenue period
        const netCashflowData = revenueData.map(revItem => ({
            year: revItem.year,
            value: revItem.value - (costsMap.get(revItem.year) || 0)
        }));

        return {
            value: netCashflowData,
            formatted: "Time Series",
            error: null,
            metadata: {
                calculationMethod: 'netCashflow',
                hasData: true,
                periods: netCashflowData.length,
                inputSources: ['totalRevenue', 'totalCosts']
            }
        };

    } catch (error) {
        return {
            value: [],
            formatted: "Error",
            error: `Net cashflow calculation failed: ${error.message}`,
            metadata: { calculationMethod: 'netCashflow', hasData: false }
        };
    }
};

export const format = (value) => {
    if (!Array.isArray(value) || value.length === 0) return 'No Data';
    return 'Time Series';
};

export const formatImpact = (impact) => 'N/A';

export const metadata = {
    name: 'Net Cashflow',
    shortName: 'NetCF',
    description: 'Net operating cashflow (revenue minus costs)',
    units: 'timeSeries',
    displayUnits: 'USD',
    windIndustryStandard: true,
    calculationComplexity: 'simple'
};