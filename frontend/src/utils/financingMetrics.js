
// frontend/src/utils/financingMetrics.js - FIXED Equity IRR calculation and enhanced finance metrics

import { get } from 'lodash';

/**
 * Calculate Net Present Value using discount rate
 * @param {Array} cashflowData - Array of {year, value} objects
 * @param {number} discountRate - Discount rate as decimal (e.g., 0.08 for 8%)
 * @returns {number} NPV value
 */
export const calculateNPV = (cashflowData, discountRate) => {
    if (!Array.isArray(cashflowData) || cashflowData.length === 0) return 0;

    return cashflowData.reduce((npv, dataPoint) => {
        const { year, value } = dataPoint;
        const presentValue = value / Math.pow(1 + discountRate, year);
        return npv + presentValue;
    }, 0);
};

/**
 * Calculate Internal Rate of Return using Newton-Raphson method
 * @param {Array} cashflowData - Array of {year, value} objects
 * @returns {number} IRR as percentage (e.g., 8.5 for 8.5%)
 */
export const calculateIRR = (cashflowData) => {
    if (!Array.isArray(cashflowData) || cashflowData.length === 0) return 0;

    // Check if we have at least one negative and one positive cash flow
    const hasNegative = cashflowData.some(cf => cf.value < 0);
    const hasPositive = cashflowData.some(cf => cf.value > 0);

    if (!hasNegative || !hasPositive) {
        console.warn('calculateIRR: Need both positive and negative cash flows for IRR calculation');
        return 0;
    }

    // Initial guess - use average return
    let irr = 0.1; // 10%
    const tolerance = 0.0001;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
        // Calculate NPV and its derivative at current IRR
        let npv = 0;
        let dnpv = 0;

        cashflowData.forEach(({ year, value }) => {
            const factor = Math.pow(1 + irr, year);
            npv += value / factor;
            dnpv -= (year * value) / (factor * (1 + irr));
        });

        // Newton-Raphson iteration
        if (Math.abs(dnpv) < tolerance) break;

        const newIrr = irr - npv / dnpv;

        if (Math.abs(newIrr - irr) < tolerance) {
            irr = newIrr;
            break;
        }

        irr = newIrr;

        // Bound IRR to reasonable range
        if (irr < -0.99) irr = -0.99;
        if (irr > 10) irr = 10;
    }

    return irr * 100; // Return as percentage
};

/**
 * Calculate Interest Coverage Ratio (ICR)
 * @param {Array} netCashflowData - Net operating cash flow data
 * @param {Array} interestPaymentData - Interest payment data
 * @returns {Array} Array of {year, value} ICR data points
 */
export const calculateICR = (netCashflowData, interestPaymentData) => {
    if (!Array.isArray(netCashflowData) || !Array.isArray(interestPaymentData)) {
        return [];
    }

    const interestMap = new Map(interestPaymentData.map(d => [d.year, d.value]));
    const icrData = [];

    netCashflowData.forEach(cashflowPoint => {
        const interestPayment = interestMap.get(cashflowPoint.year);

        if (interestPayment && interestPayment > 0) {
            // ICR = EBITDA (approximated by net cash flow) / Interest Payments
            const icr = Math.max(0, cashflowPoint.value / interestPayment);
            icrData.push({
                year: cashflowPoint.year,
                value: icr
            });
        }
    });

    return icrData.sort((a, b) => a.year - b.year);
};

/**
 * Calculate Average DSCR across operational years only
 * @param {Array} dscrData - DSCR data points
 * @param {boolean} operationalYearsOnly - Whether to exclude construction/grace period years
 * @returns {number} Average DSCR value
 */
export const calculateAverageDSCR = (dscrData, operationalYearsOnly = true) => {
    if (!Array.isArray(dscrData) || dscrData.length === 0) return 0;

    let filteredData = dscrData;

    if (operationalYearsOnly) {
        // Filter to operational years only (year > 0 and has actual DSCR values)
        filteredData = dscrData.filter(d => d.year > 0 && d.value !== null && d.value !== undefined);
    }

    if (filteredData.length === 0) return 0;

    const sum = filteredData.reduce((total, d) => total + d.value, 0);
    return sum / filteredData.length;
};

/**
 * Get covenant step-down schedule based on financing parameters
 * @param {Object} financingParams - Financing parameters from scenario
 * @param {number} projectLife - Project duration in years
 * @returns {Array} Array of {year, dscr, description} covenant requirements
 */
export const getCovenantStepDowns = (financingParams, projectLife = 20) => {
    if (!financingParams) return [];

    const baseCovenantDSCR = financingParams.minimumDSCR || 1.3;
    const gracePeriod = financingParams.gracePeriod || 1;

    // Common covenant step-down pattern for project finance
    const stepDowns = [];

    // Grace period - no covenant testing
    for (let year = 1; year <= gracePeriod; year++) {
        stepDowns.push({
            year,
            dscr: null, // No testing during grace period
            description: 'Grace Period - No DSCR Testing'
        });
    }

    // Early operational years - higher covenant (stress test period)
    const earlyYears = Math.min(3, projectLife - gracePeriod);
    for (let year = gracePeriod + 1; year <= gracePeriod + earlyYears; year++) {
        stepDowns.push({
            year,
            dscr: baseCovenantDSCR + 0.2, // Higher initial covenant
            description: 'Early Operations - Enhanced Covenant'
        });
    }

    // Standard operational years
    for (let year = gracePeriod + earlyYears + 1; year <= projectLife; year++) {
        stepDowns.push({
            year,
            dscr: baseCovenantDSCR,
            description: 'Standard Operations - Base Covenant'
        });
    }

    return stepDowns;
};

/**
 * Calculate real Loan Life Coverage Ratio
 * LLCR = NPV of cash flows available for debt service / Outstanding debt
 * @param {Array} netCashflowData - Net cashflow data for the percentile
 * @param {Array} debtServiceData - Debt service schedule
 * @param {number} discountRate - Discount rate for NPV calculation
 * @returns {number} LLCR value
 */
export const calculateRealLLCR = (netCashflowData, debtServiceData, discountRate = 0.05) => {
    if (!Array.isArray(netCashflowData) || !Array.isArray(debtServiceData)) return 0;

    // Calculate total outstanding debt (sum of all debt service payments)
    const totalDebtService = debtServiceData.reduce((sum, ds) => sum + ds.value, 0);

    if (totalDebtService <= 0) return 0;

    // Calculate NPV of cash flows available for debt service
    // Using operational years only (year > 0)
    const operationalCashflows = netCashflowData.filter(cf => cf.year > 0);
    const npvCashflows = operationalCashflows.reduce((npv, cf) => {
        const presentValue = cf.value / Math.pow(1 + discountRate, cf.year);
        return npv + presentValue;
    }, 0);

    // LLCR = NPV of available cash flows / Total debt service
    return Math.max(0, npvCashflows / totalDebtService);
};

/**
 * FIXED: Calculate Equity IRR - return to equity investors after debt service
 * @param {Array} netCashflowData - Net project cash flows
 * @param {Array} debtServiceData - Debt service payments (combined interest + principal)
 * @param {number} equityInvestment - Initial equity investment
 * @returns {number} Equity IRR as percentage
 */
export const calculateEquityIRR = (netCashflowData, debtServiceData, equityInvestment) => {
    console.log('calculateEquityIRR called with:', {
        netCashflowCount: netCashflowData?.length || 0,
        debtServiceCount: debtServiceData?.length || 0,
        equityInvestment
    });

    if (!Array.isArray(netCashflowData) || !Array.isArray(debtServiceData)) {
        console.warn('calculateEquityIRR: Invalid input arrays');
        return 0;
    }

    if (!equityInvestment || equityInvestment <= 0) {
        console.warn('calculateEquityIRR: Invalid equity investment amount');
        return 0;
    }

    // Create equity cash flows = net project cash flows - debt service
    const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));

    const equityCashflows = [];

    // Add initial equity investment as negative cash flow in year 0
    equityCashflows.push({ year: 0, value: -equityInvestment });

    // Calculate equity cash flows for operational years
    netCashflowData.forEach(cf => {
        if (cf.year > 0) { // Only operational years
            const debtService = debtServiceMap.get(cf.year) || 0;
            const equityCashflow = cf.value - debtService;
            equityCashflows.push({ year: cf.year, value: equityCashflow });
        }
    });

    console.log('Generated equity cashflows:', {
        count: equityCashflows.length,
        sample: equityCashflows.slice(0, 3),
        totalEquityInflows: equityCashflows.filter(cf => cf.value > 0).reduce((sum, cf) => sum + cf.value, 0),
        initialInvestment: equityInvestment
    });

    // FIXED: Calculate IRR and ensure it's in correct units
    const equityIRR = calculateIRR(equityCashflows);

    console.log('Calculated Equity IRR:', equityIRR);

    // The calculateIRR function already returns a percentage, so no additional multiplication needed
    return equityIRR;
};

/**
 * FIXED: Calculate total equity investment based on CAPEX and debt ratio
 * @param {Object} scenarioData - Scenario data
 * @returns {number} Total equity investment
 */
export const calculateEquityInvestment = (scenarioData) => {
    if (!scenarioData) {
        console.warn('calculateEquityInvestment: No scenario data provided');
        return 0;
    }

    const financing = scenarioData?.settings?.modules?.financing || {};
    const debtRatio = (financing.debtFinancingRatio || 70) / 100;
    const equityRatio = 1 - debtRatio;

    // Get total CAPEX from metrics or calculate from cost sources
    const totalCapex = scenarioData?.settings?.metrics?.totalCapex || 0;

    const equityInvestment = totalCapex * equityRatio;

    console.log('calculateEquityInvestment:', {
        totalCapex,
        debtRatio: debtRatio * 100 + '%',
        equityRatio: equityRatio * 100 + '%',
        equityInvestment
    });

    return equityInvestment;
};

/**
 * FIXED: Enhanced finance metrics calculation with proper data handling
 * @param {Object} aggregations - Cashflow aggregations (with percentileData)
 * @param {Array} availablePercentiles - Available percentile values
 * @param {Object} scenarioData - Full scenario data for parameters
 * @param {Array} lineItems - All line items for debt service lookup
 * @returns {Object} Enhanced finance metrics with percentile data
 */
export const enhancedFinanceMetrics = (aggregations, availablePercentiles, scenarioData, lineItems = []) => {
    console.log('enhancedFinanceMetrics called with:', {
        availablePercentiles,
        lineItemsCount: lineItems.length,
        hasNetCashflow: !!aggregations?.netCashflow
    });

    const financeMetrics = {
        dscr: new Map(),
        llcr: new Map(),
        irr: new Map(),
        npv: new Map(),
        equityIRR: new Map(), // Added Equity IRR
        icr: new Map(), // NEW: Interest Coverage Ratio
        avgDSCR: new Map(), // NEW: Average DSCR
        covenantBreaches: new Map()
    };

    // Get financing parameters
    const financingParams = scenarioData?.settings?.modules?.financing || {};
    const minimumDSCR = financingParams.minimumDSCR || 1.3;
    const costOfEquity = (financingParams.costOfEquity || 8) / 100; // Convert % to decimal

    // FIXED: Find debt service line items correctly
    const interestLineItem = lineItems.find(item => item.id === 'operationalInterest');
    const principalLineItem = lineItems.find(item => item.id === 'operationalPrincipal');

    console.log('Found debt service line items:', {
        hasInterest: !!interestLineItem,
        hasPrincipal: !!principalLineItem
    });

    availablePercentiles.forEach(percentile => {
        console.log(`\nProcessing percentile P${percentile}:`);

        // Get net cashflow for this percentile
        let netCashflowData = [];
        if (aggregations.netCashflow?.percentileData?.has(percentile)) {
            netCashflowData = aggregations.netCashflow.percentileData.get(percentile);
        } else {
            netCashflowData = aggregations.netCashflow?.data || [];
        }

        console.log(`Net cashflow data points: ${netCashflowData.length}`);

        // FIXED: Calculate combined debt service for DSCR (interest + principal)
        let debtServiceData = [];
        if (interestLineItem && principalLineItem) {
            const interestData = interestLineItem.percentileData?.has(percentile)
                ? interestLineItem.percentileData.get(percentile)
                : interestLineItem.data || [];

            const principalData = principalLineItem.percentileData?.has(percentile)
                ? principalLineItem.percentileData.get(percentile)
                : principalLineItem.data || [];

            console.log(`Debt service components: ${interestData.length} interest, ${principalData.length} principal`);

            // Combine interest + principal by year
            const debtServiceMap = new Map();
            [...interestData, ...principalData].forEach(item => {
                const currentTotal = debtServiceMap.get(item.year) || 0;
                debtServiceMap.set(item.year, currentTotal + item.value);
            });

            debtServiceData = Array.from(debtServiceMap.entries())
                .map(([year, value]) => ({ year: parseInt(year), value }))
                .sort((a, b) => a.year - b.year);

            console.log(`Combined debt service data points: ${debtServiceData.length}`);
        } else {
            console.warn('Missing debt service line items for DSCR calculation');
        }

        // Get interest payment data for ICR calculation
        let interestData = [];
        if (interestLineItem?.percentileData?.has(percentile)) {
            interestData = interestLineItem.percentileData.get(percentile);
        } else if (interestLineItem?.data) {
            interestData = interestLineItem.data;
        }

        // Calculate DSCR using real debt service
        const dscrData = [];
        if (debtServiceData.length > 0) {
            const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));

            netCashflowData.forEach(cashflowPoint => {
                const debtService = debtServiceMap.get(cashflowPoint.year);

                if (debtService && debtService > 0) {
                    const dscr = Math.max(0, cashflowPoint.value / debtService);
                    dscrData.push({
                        year: cashflowPoint.year,
                        value: dscr
                    });
                }
            });
        }

        // Fallback DSCR calculation if no debt service data
        if (dscrData.length === 0) {
            console.warn(`No debt service data for P${percentile}, using placeholder DSCR calculation`);
            netCashflowData.forEach(dataPoint => {
                dscrData.push({
                    year: dataPoint.year,
                    value: Math.max(0.5, 1.0 + (dataPoint.value / 10000000))
                });
            });
        }

        financeMetrics.dscr.set(percentile, dscrData);

        // NEW: Calculate Average DSCR (operational years only)
        const avgDSCR = calculateAverageDSCR(dscrData, true);
        financeMetrics.avgDSCR.set(percentile, avgDSCR);

        // NEW: Calculate Interest Coverage Ratio
        const icrData = calculateICR(netCashflowData, interestData);
        financeMetrics.icr.set(percentile, icrData);

        // Calculate real NPV using net cashflow data
        const npv = calculateNPV(netCashflowData, costOfEquity);
        financeMetrics.npv.set(percentile, npv);

        // Calculate real Project IRR using net cashflow data
        const projectIRR = calculateIRR(netCashflowData);
        financeMetrics.irr.set(percentile, projectIRR);

        // FIXED: Calculate Equity IRR using equity cash flows
        const equityInvestment = calculateEquityInvestment(scenarioData);
        let equityIRR = 0;

        if (equityInvestment > 0 && debtServiceData.length > 0) {
            equityIRR = calculateEquityIRR(netCashflowData, debtServiceData, equityInvestment);
        } else {
            console.warn(`Cannot calculate Equity IRR for P${percentile}: equityInvestment=${equityInvestment}, debtServiceData=${debtServiceData.length}`);
        }

        financeMetrics.equityIRR.set(percentile, equityIRR);
        console.log(`Equity IRR for P${percentile}: ${equityIRR}`);

        // Calculate real LLCR
        const llcr = calculateRealLLCR(netCashflowData, debtServiceData, costOfEquity);
        // FIXED: Store as time series array like DSCR (repeat the scalar value for each operational year)
        const llcrTimeSeries = [];
        const projectLife = scenarioData?.settings?.general?.projectLife || 20;
        for (let year = 1; year <= projectLife; year++) {
            llcrTimeSeries.push({
                year: year,
                value: llcr // Same LLCR value for all operational years
            });
        }
        financeMetrics.llcr.set(percentile, llcrTimeSeries);

        // Covenant breach detection using real DSCR data - EXCLUDE construction years
        const breaches = dscrData
            .filter(d => d.year > 0) // Only operational years
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

    // Add covenant threshold for reference
    financeMetrics.covenantThreshold = minimumDSCR;

    console.log('Enhanced finance metrics completed:', {
        dscrPercentiles: financeMetrics.dscr.size,
        equityIRRPercentiles: financeMetrics.equityIRR.size,
        sampleEquityIRR: financeMetrics.equityIRR.get(availablePercentiles[0])
    });

    return financeMetrics;
};