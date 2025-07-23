
import { filterCubeSourceData, aggregateCubeSourceData, normalizeIntoSimResults, extractPercentileData, trimSourceDataValues } from './common.js';


/**
 * Calculate Interest During Construction (IDC)
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for IDC
 */
export const interestDuringConstruction = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, allReferences, processedData } = context;
    const availablePercentiles = percentileInfo.available;

    // Get financing data from references
    const financing = allReferences.financing;
    if (!financing) {
        console.warn('⚠️ interestDuringConstruction: No financing data available in references');
        return [];
    }

    // Check if IDC should be capitalized
    const shouldCapitalize = financing.idcCapitalization !== false; // Default to true
    if (!shouldCapitalize) {
        console.log('⚠️ interestDuringConstruction: IDC not capitalized - returning empty array');
        return [];
    }

    // Get already calculated debt drawdown data
    const debtDrawdownSources = filterCubeSourceData(processedData, {
        sourceId: 'debtDrawdown'
    });

    if (debtDrawdownSources.length === 0) {
        console.warn('⚠️ interestDuringConstruction: No debt drawdown data found in processed sources');
        return [];
    }

    const debtDrawdownSource = debtDrawdownSources[0];
    const constructionDebtRate = (financing.costOfConstructionDebt || financing.costOfDebt || 5) / 100;

    // Process each percentile separately and create one SimResultsSchema per percentile
    const result = [];

    // Get all effective percentiles (including custom percentile 0 if applicable)
    const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
        ? [...availablePercentiles, 0]
        : availablePercentiles;

    effectivePercentiles.forEach(percentile => {
        // Extract debt drawdown data for this percentile
        const debtDrawdownData = extractPercentileData(debtDrawdownSource.percentileSource, percentile);

        if (debtDrawdownData.length === 0) {
            return; // Skip if no data for this percentile
        }

        // Calculate cumulative debt and IDC for this percentile
        const idcData = [];
        let cumulativeDebt = 0;

        // Sort by year for cumulative calculation
        const sortedDebtData = [...debtDrawdownData].sort((a, b) => a.year - b.year);

        sortedDebtData.forEach(({ year, value: yearlyDebtDrawdown }) => {
            // Add this year's drawdown to cumulative debt
            cumulativeDebt += yearlyDebtDrawdown;

            // Calculate interest on cumulative debt
            const yearlyIDC = cumulativeDebt * constructionDebtRate;

            if (yearlyIDC > 0) {
                idcData.push({
                    year,
                    value: yearlyIDC
                });
            }
        });

        // Create one SimResultsSchema for this percentile
        result.push({
            name: 'interestDuringConstruction',
            data: idcData, // Array of DataPointSchema
            percentile: { value: percentile }
        });
    });

    const totalIDC = result.reduce((sum, simResult) =>
        sum + simResult.data.reduce((dataSum, dataPoint) => dataSum + dataPoint.value, 0), 0
    );
    console.log(`🏗️ interestDuringConstruction: ${result.length} percentiles, $${(totalIDC / availablePercentiles.length).toLocaleString()} Avg total IDC/percentile (${constructionDebtRate * 100}% rate)`);

    addAuditEntry(
        'apply_idc_transformation',
        'calculating Interest During Construction from debt drawdown data',
        ['financing', 'debtDrawdown'],
        result,
        'transform',
        'complex'
    );

    return result;
};

/**
 * Calculate operational interest payments (interest portion of debt service)
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for operational interest payments
 */
export const operationalInterest = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, allReferences, processedData } = context;
    const availablePercentiles = percentileInfo.available;

    // Get financing data from references
    const financing = allReferences.financing;
    if (!financing) {
        console.warn('⚠️ operationalInterest: No financing data available in references');
        return [];
    }

    // Get project life from references
    const projectLife = allReferences.projectLife || 20;

    // Get already calculated operational principal data
    const principalSources = filterCubeSourceData(processedData, {
        sourceId: 'operationalPrincipal'
    });

    if (principalSources.length === 0) {
        console.warn('⚠️ operationalInterest: No operational principal data found in processed sources');
        return [];
    }

    const principalSource = principalSources[0];

    // Get financing parameters
    const operationalRate = (financing.costOfOperationalDebt || 5) / 100;

    // Process each percentile separately
    const result = [];

    // Get all effective percentiles
    const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
        ? [...availablePercentiles, 0]
        : availablePercentiles;

    effectivePercentiles.forEach(percentile => {
        // Extract principal payment data for this percentile
        const principalData = extractPercentileData(principalSource.percentileSource, percentile);

        if (principalData.length === 0) {
            return; // Skip if no principal data
        }

        // Calculate total debt principal from principal payments
        const totalDebtPrincipal = principalData.reduce((sum, { value }) => sum + value, 0);

        if (totalDebtPrincipal <= 0) {
            return; // Skip if no debt
        }

        // Calculate interest payments by working backwards from principal schedule
        const interestPayments = [];
        let remainingPrincipal = totalDebtPrincipal;

        // Sort principal payments by year (reverse to work backwards)
        const sortedPrincipalData = [...principalData].sort((a, b) => b.year - a.year);

        // Work backwards to calculate remaining principal for each year
        sortedPrincipalData.forEach(({ year, value: principalPayment }) => {
            const interestPayment = remainingPrincipal * operationalRate;
            interestPayments.push({ year, value: interestPayment });
            remainingPrincipal += principalPayment; // Add back since we're going backwards
        });

        // Sort interest payments by year (forward)
        interestPayments.sort((a, b) => a.year - b.year);

        // Create one SimResultsSchema for this percentile
        result.push({
            name: 'operationalInterest',
            data: interestPayments, // Array of DataPointSchema
            percentile: { value: percentile }
        });
    });

    const totalInterest = result.reduce((sum, simResult) =>
        sum + simResult.data.reduce((dataSum, dataPoint) => dataSum + dataPoint.value, 0), 0
    );
    console.log(`💰 operationalInterest: ${result.length} percentiles, $${(totalInterest / availablePercentiles.length).toLocaleString()} Avg total interest (${operationalRate * 100}% rate)`);

    addAuditEntry(
        'apply_operational_interest_transformation',
        'calculating operational interest payments from principal payment schedule',
        ['financing', 'projectLife', 'operationalPrincipal'],
        result,
        'transform',
        'complex'
    );

    return result;
};

/**
 * Calculate operational principal payments (principal portion of debt service)
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for operational principal payments
 */
export const operationalPrincipal = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, allReferences, processedData } = context;
    const availablePercentiles = percentileInfo.available;

    // Get financing data from references
    const financing = allReferences.financing;
    if (!financing) {
        console.warn('⚠️ operationalPrincipal: No financing data available in references');
        return [];
    }

    // Get project life from references
    const projectLife = allReferences.projectLife || 20;

    // Get already calculated debt drawdown and IDC data
    const debtDrawdownSources = filterCubeSourceData(processedData, {
        sourceId: 'debtDrawdown'
    });

    const idcSources = filterCubeSourceData(processedData, {
        sourceId: 'interestDuringConstruction'
    });

    if (debtDrawdownSources.length === 0) {
        console.warn('⚠️ operationalPrincipal: No debt drawdown data found in processed sources');
        return [];
    }

    if (idcSources.length === 0) {
        console.warn('⚠️ operationalPrincipal: No IDC data found in processed sources');
        return [];
    }

    const debtDrawdownSource = debtDrawdownSources[0];
    const idcSource = idcSources[0];

    // Get financing parameters
    const operationalRate = (financing.costOfOperationalDebt || 5) / 100;
    const loanDuration = financing.loanDuration || 15;
    const gracePeriod = financing.gracePeriod || 1;
    const amortizationType = financing.amortizationType || 'amortizing';

    // Process each percentile separately
    const result = [];

    // Get all effective percentiles
    const effectivePercentiles = customPercentile !== null && customPercentile !== undefined
        ? [...availablePercentiles, 0]
        : availablePercentiles;

    effectivePercentiles.forEach(percentile => {
        // Extract debt drawdown and IDC data for this percentile
        const debtDrawdownData = extractPercentileData(debtDrawdownSource.percentileSource, percentile);
        const idcData = extractPercentileData(idcSource.percentileSource, percentile);

        if (debtDrawdownData.length === 0) {
            return; // Skip if no debt drawdown data
        }

        // Calculate total debt principal (debt drawdown + IDC)
        const totalDebtDrawn = debtDrawdownData.reduce((sum, { value }) => sum + value, 0);
        const totalIDC = idcData.reduce((sum, { value }) => sum + value, 0);
        const totalDebtPrincipal = totalDebtDrawn + totalIDC;

        if (totalDebtPrincipal <= 0) {
            return; // Skip if no debt principal
        }

        // Calculate principal payments schedule
        const principalPayments = [];
        const paymentStartYear = 1 + gracePeriod;

        if (amortizationType === 'bullet') {
            // Bullet loan: principal at maturity
            principalPayments.push({
                year: Math.min(loanDuration, projectLife),
                value: totalDebtPrincipal
            });
        } else {
            // Amortizing loan: calculate principal portion
            let remainingPrincipal = totalDebtPrincipal;
            const annualPayment = totalDebtPrincipal *
                (operationalRate * Math.pow(1 + operationalRate, loanDuration)) /
                (Math.pow(1 + operationalRate, loanDuration) - 1);

            for (let year = paymentStartYear; year <= projectLife && year <= (paymentStartYear + loanDuration - 1); year++) {
                const interestPayment = remainingPrincipal * operationalRate;
                const principalPayment = annualPayment - interestPayment;

                principalPayments.push({ year, value: principalPayment });
                remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
            }
        }

        // Create one SimResultsSchema for this percentile
        result.push({
            name: 'operationalPrincipal',
            data: principalPayments, // Array of DataPointSchema
            percentile: { value: percentile }
        });
    });

    const totalPrincipal = result.reduce((sum, simResult) =>
        sum + simResult.data.reduce((dataSum, dataPoint) => dataSum + dataPoint.value, 0), 0
    );
    console.log(`💰 operationalPrincipal: ${result.length} percentiles, $${(totalPrincipal / availablePercentiles.length).toLocaleString()} Avg total principal (${amortizationType} loan)`);

    addAuditEntry(
        'apply_operational_principal_transformation',
        'calculating operational principal payments from debt drawdown and IDC data',
        ['financing', 'projectLife', 'debtDrawdown', 'interestDuringConstruction'],
        result,
        'transform',
        'complex'
    );

    return result;
};

/**
 * Calculate total debt service (interest + principal payments)
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for debt service
 */
export const debtService = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, processedData } = context;
    const availablePercentiles = percentileInfo.available;

    // Get already calculated operational interest and principal data
    const interestSources = filterCubeSourceData(processedData, { sourceId: 'operationalInterest' });
    const principalSources = filterCubeSourceData(processedData, { sourceId: 'operationalPrincipal' });

    if (interestSources.length === 0 || principalSources.length === 0) {
        console.warn(`⚠️ Missing sources for debtService: operationalInterest(${interestSources.length}), operationalPrincipal(${principalSources.length})`);
        return [];
    }

    // Combine interest and principal sources
    const combinedSources = [interestSources[0], principalSources[0]];

    // Aggregate with sum operation (interest + principal = total debt service)
    const result = aggregateCubeSourceData(combinedSources, availablePercentiles, {
        operation: 'sum',
        customPercentile
    }, addAuditEntry);

    const totalDebtService = result.reduce((sum, simResult) =>
        sum + simResult.data.reduce((dataSum, dataPoint) => dataSum + dataPoint.value, 0), 0
    );
    console.log(`💰 debtService: ${result.length} percentiles, $${totalDebtService.toLocaleString()} total debt service`);

    addAuditEntry(
        'apply_debt_service_transformation',
        'calculating debt service: operationalInterest + operationalPrincipal',
        ['operationalInterest', 'operationalPrincipal'],
        result,
        'transform',
        'complex'
    );

    return result;
};

/**
 * Calculate DSCR time series from net cashflow and debt service
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects for DSCR by year
 */
export const dscr = (sourceData, context) => {
    const { addAuditEntry, percentileInfo, customPercentile, processedData, allReferences } = context;
    const availablePercentiles = percentileInfo.available;

    // Get net cashflow and debt service sources
    const netCashflowSources = filterCubeSourceData(processedData, { sourceId: 'netCashflow' });
    const debtServiceSources = filterCubeSourceData(processedData, { sourceId: 'debtService' });

    // Get financing data from references
    const financing = allReferences.financing;
    if (!financing) {
        console.warn('⚠️ DSCR: No financing data available in references');
        return [];
    }

    if (netCashflowSources.length === 0 || debtServiceSources.length === 0) {
        console.warn(`⚠️ Missing sources for DSCR: netCashflow(${netCashflowSources.length}), debtService(${debtServiceSources.length})`);
        return [];
    }

    console.log('📊 Calculating DSCR: netCashflow / debtService');

    // Track dependencies for audit trail
    const dependencies = ['netCashflow', 'debtService'];

    if (addAuditEntry) {
        addAuditEntry(
            'apply_dscr_calculation',
            'calculating DSCR: netCashflow / debtService',
            dependencies
        );
    }

    // Get single sources (since sourceId filtering returns max 1 item)
    const netCashflow = netCashflowSources[0];
    const debtService = debtServiceSources[0];

    // Combine revenue (positive) and cost (negative) sources
    const combinedSources = [netCashflow, debtService];

    // Aggregate with sum operation (revenue + (-cost) = revenue - cost)
    let result = aggregateCubeSourceData(combinedSources, availablePercentiles, {
        operation: 'divide',
        customPercentile
    }, addAuditEntry);

    result = trimSourceDataValues(result, (year, value, options) => year < options.loanStart || year > options.loanEnd, { loanStart: (1 + financing.gracePeriod), loanEnd: financing.loanDuration || 10 }, addAuditEntry);

    console.log(`✅ netCashflow calculated for ${result.length} data points`);

    return result;
};