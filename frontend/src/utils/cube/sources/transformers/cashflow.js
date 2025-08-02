import { filterCubeSourceData, aggregateCubeSourceData, adjustSourceDataValues, extractPercentileData } from './common.js';

/**
 * Calculate net cashflow by subtracting total costs from total revenue
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context with addAuditEntry
 * @returns {Array} Array of SimResultsSchema objects
 */
export const netCashflow = (sourceData, context) => {
    const { processedData, percentileInfo, customPercentile, addAuditEntry } = context;
    const availablePercentiles = percentileInfo.available;

    // Find totalRevenue and totalCost sources
    const totalRevenueSources = filterCubeSourceData(processedData, { sourceId: 'totalRevenue' });
    const totalCostSources = filterCubeSourceData(processedData, { sourceId: 'totalCost' });

    if (totalRevenueSources.length === 0 || totalCostSources.length === 0) {
        console.warn(`⚠️ Missing sources for netCashflow: totalRevenue(${totalRevenueSources.length}), totalCost(${totalCostSources.length})`);
        return [];
    }

    console.log('📊 Calculating netCashflow: totalRevenue - totalCost');

    // Track dependencies for audit trail
    const dependencies = ['totalRevenue', 'totalCost'];

    if (addAuditEntry) {
        addAuditEntry(
            'apply_netcashflow_calculation',
            'calculating netCashflow: totalRevenue - totalCost',
            dependencies
        );
    }

    // Get single sources (since sourceId filtering returns max 1 item)
    const revenueSource = totalRevenueSources[0];
    const costSource = totalCostSources[0];

    // Multiply cost values by -1 to convert to negative
    const negativeCostSource = adjustSourceDataValues(costSource, (percentile, year, value) => value * -1, addAuditEntry);

    // Combine revenue (positive) and cost (negative) sources
    const combinedSources = [revenueSource, negativeCostSource];

    // Aggregate with sum operation (revenue + (-cost) = revenue - cost)
    const result = aggregateCubeSourceData(combinedSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);

    console.log(`✅ netCashflow calculated for ${result.length} data points`);

    return result;
};

/**
 * Calculate cumulative cashflow over project life
 * @param {null} sourceData - Not used for virtual sources  
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for cumulative cashflow
 */
export const cumulativeCashflow = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, processedData } = context;

    // Get net cashflow source
    const netCashflowSources = filterCubeSourceData(processedData, { sourceId: 'netCashflow' });

    if (netCashflowSources.length === 0) {
        console.warn(`⚠️ Missing source for cumulativeCashflow: netCashflow(${netCashflowSources.length})`);
        return [];
    }

    console.log('📊 Calculating cumulativeCashflow: netCashflow++');

    // Track dependencies for audit trail
    const dependencies = ['netCashflow'];

    if (addAuditEntry) {
        addAuditEntry(
            'apply_cumulativecashflow_calculation',
            'calculating cumulativeCashflow: netCashflow++',
            dependencies
        );
    }

    // Get single sources (since sourceId filtering returns max 1 item)
    const netCashflow = netCashflowSources[0];

    // Multiply cost values by -1 to convert to negative
    const result = adjustSourceDataValues(netCashflow, (percentile, year, value, previousValue = null) => value + (previousValue || 0), addAuditEntry);

    console.log(`✅ cumulativeCashflow calculated for ${result.percentileSource.length} data points`);

    return result.percentileSource;
};

/**
 * Calculate project cashflow for IRR calculation (CAPEX + net cashflow)
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for project cashflow
 */
export const projectCashflow = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, processedData, allReferences } = context;
    const availablePercentiles = percentileInfo.available;

    // Get required sources
    const netCashflowSources = filterCubeSourceData(processedData, { sourceId: 'netCashflow' });
    const totalCapexSources = filterCubeSourceData(processedData, { sourceId: 'totalCapex' });

    if (netCashflowSources.length === 0 || totalCapexSources.length === 0) {
        console.warn(`⚠️ Missing sources for projectCashflow: netCashflow(${netCashflowSources.length}), totalCapex(${totalCapexSources.length})`);
        return [];
    }

    console.log('📊 Calculating projectCashflow: -totalCapex(year 0) + netCashflow(years 1+)');

    // Track dependencies for audit trail
    const dependencies = ['netCashflow', 'totalCapex'];
    addAuditEntry(
        'apply_project_cashflow_calculation',
        'building project cashflow: -totalCapex(year 0) + netCashflow(years 1+)',
        dependencies
    );

    const netCashflow = netCashflowSources[0];
    const totalCapex = totalCapexSources[0];

    // Process each percentile separately
    const result = [];

    // Get all effective percentiles
    // const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
    //     ? [...availablePercentiles, 0]
    //     : availablePercentiles;

    availablePercentiles.forEach(percentile => {
        // Extract data for this percentile
        const netCashflowData = extractPercentileData(netCashflow.percentileSource, percentile);
        const totalCapexData = extractPercentileData(totalCapex.percentileSource, percentile);

        if (netCashflowData.length === 0 || totalCapexData.length === 0) {
            return; // Skip if no data
        }

        // Calculate total CAPEX (sum all construction years)
        const totalCapexAmount = totalCapexData.reduce((sum, dataPoint) => sum + dataPoint.value, 0);

        // Build project cashflow array
        const projectCashflowData = [
            // Initial investment (negative CAPEX at year 0)
            { year: 0, value: -totalCapexAmount },
            // Net cashflows for operational years (filter to positive years only)
            ...netCashflowData.filter(dataPoint => dataPoint.year > 0)
        ];

        // Sort by year to ensure proper order
        projectCashflowData.sort((a, b) => a.year - b.year);

        // Create SimResultsSchema for this percentile
        result.push({
            name: 'projectCashflow',
            data: projectCashflowData,
            percentile: { value: percentile }
        });
    });

    const avgTotalCapex = result.reduce((sum, simResult) =>
        sum + Math.abs(simResult.data.find(d => d.year === 0)?.value || 0), 0
    ) / result.length;

    console.log(`💰 projectCashflow: ${result.length} percentiles, $${avgTotalCapex.toLocaleString()} avg initial investment`);

    return result;
};

/**
 * Calculate equity cashflow for Equity IRR calculation (equity investment + net cashflow - debt service)
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for equity cashflow
 */
export const equityCashflow = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, processedData, allReferences } = context;
    const availablePercentiles = percentileInfo.available;

    // Get financing parameters
    const financing = allReferences.financing;
    if (!financing) {
        console.warn('⚠️ equityCashflow: No financing data available in references');
        return [];
    }

    const debtRatio = (financing.debtFinancingRatio || 70) / 100;
    const equityRatio = 1 - debtRatio;

    // Get required sources
    const netCashflowSources = filterCubeSourceData(processedData, { sourceId: 'netCashflow' });
    const debtServiceSources = filterCubeSourceData(processedData, { sourceId: 'debtService' });
    const totalCapexSources = filterCubeSourceData(processedData, { sourceId: 'totalCapex' });

    if (netCashflowSources.length === 0 || debtServiceSources.length === 0 || totalCapexSources.length === 0) {
        console.warn(`⚠️ Missing sources for equityCashflow: netCashflow(${netCashflowSources.length}), debtService(${debtServiceSources.length}), totalCapex(${totalCapexSources.length})`);
        return [];
    }

    console.log(`📊 Calculating equityCashflow: -equity(${equityRatio * 100}% of CAPEX) + (netCashflow - debtService)`);

    // Track dependencies for audit trail
    const dependencies = ['netCashflow', 'debtService', 'totalCapex', 'financing'];
    addAuditEntry(
        'apply_equity_cashflow_calculation',
        `building equity cashflow: -equity(${equityRatio * 100}% of CAPEX) + (netCashflow - debtService)`,
        dependencies
    );

    const netCashflow = netCashflowSources[0];
    const debtService = debtServiceSources[0];
    const totalCapex = totalCapexSources[0];

    // Process each percentile separately
    const result = [];

    // Get all effective percentiles
    // const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
    //     ? [...availablePercentiles, 0]
    //     : availablePercentiles;

    availablePercentiles.forEach(percentile => {
        // Extract data for this percentile
        const netCashflowData = extractPercentileData(netCashflow.percentileSource, percentile);
        const debtServiceData = extractPercentileData(debtService.percentileSource, percentile);
        const totalCapexData = extractPercentileData(totalCapex.percentileSource, percentile);

        if (netCashflowData.length === 0 || totalCapexData.length === 0) {
            return; // Skip if no data
        }

        // Calculate equity investment
        const totalCapexAmount = totalCapexData.reduce((sum, dataPoint) => sum + dataPoint.value, 0);
        const equityInvestment = totalCapexAmount * equityRatio;

        // Create debt service lookup map for efficiency
        const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));

        // Build equity cashflow array
        const equityCashflowData = [
            // Initial equity investment (negative at year 0)
            { year: 0, value: -equityInvestment },
            // Equity cashflows = net cashflow - debt service for operational years
            ...netCashflowData
                .filter(dataPoint => dataPoint.year > 0)
                .map(cf => ({
                    year: cf.year,
                    value: cf.value - (debtServiceMap.get(cf.year) || 0)
                }))
        ];

        // Sort by year to ensure proper order
        equityCashflowData.sort((a, b) => a.year - b.year);

        // Create SimResultsSchema for this percentile
        result.push({
            name: 'equityCashflow',
            data: equityCashflowData,
            percentile: { value: percentile }
        });
    });

    const avgEquityInvestment = result.reduce((sum, simResult) =>
        sum + Math.abs(simResult.data.find(d => d.year === 0)?.value || 0), 0
    ) / result.length;

    console.log(`💰 equityCashflow: ${result.length} percentiles, $${avgEquityInvestment.toLocaleString()} avg equity investment (${equityRatio * 100}% ratio)`);

    return result;
};