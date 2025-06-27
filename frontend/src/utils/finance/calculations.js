// src/utils/finance/calculations.js - Finance-specific calculation utilities
import { SUPPORTED_METRICS } from './sensitivityMetrics';

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
 * Calculate real Loan Life Coverage Ratio
 * LLCR = NPV of cash flows available for debt service / Outstanding debt
 * @param {Array} netCashflowData - Net cashflow data for the percentile
 * @param {Array} debtServiceData - Debt service schedule
 * @param {number} discountRate - Discount rate for NPV calculation
 * @returns {number} LLCR value
 */
export const calculateLLCR = (netCashflowData, debtServiceData, discountRate = 0.05) => {
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
 * Calculate Equity IRR - return to equity investors after debt service
 * @param {Array} netCashflowData - Net project cash flows
 * @param {Array} debtServiceData - Debt service payments
 * @param {number} equityInvestment - Initial equity investment
 * @returns {number} Equity IRR as percentage
 */
export const calculateEquityIRR = (netCashflowData, debtServiceData, equityInvestment) => {
    if (!Array.isArray(netCashflowData) || !Array.isArray(debtServiceData)) return 0;
    if (!equityInvestment || equityInvestment <= 0) return 0;

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

    return calculateIRR(equityCashflows);
};

/**
 * Calculate minimum DSCR from time series
 * @param {Array} dscrTimeSeries - DSCR time series data
 * @returns {number} Minimum DSCR value
 */
export const calculateMinDSCR = (dscrTimeSeries) => {
    if (!Array.isArray(dscrTimeSeries) || dscrTimeSeries.length === 0) return 0;

    const operationalDSCR = dscrTimeSeries.filter(d => d && d.year > 0 && typeof d.value === 'number');
    return operationalDSCR.length > 0 ? Math.min(...operationalDSCR.map(d => d.value)) : 0;
};

/**
 * Calculate average DSCR from time series
 * @param {Array} dscrTimeSeries - DSCR time series data
 * @returns {number} Average DSCR value
 */
export const calculateAvgDSCR = (dscrTimeSeries) => {
    if (!Array.isArray(dscrTimeSeries) || dscrTimeSeries.length === 0) return 0;

    const operationalDSCR = dscrTimeSeries.filter(d => d && d.year > 0 && typeof d.value === 'number');
    return operationalDSCR.length > 0 ?
        operationalDSCR.reduce((sum, d) => sum + d.value, 0) / operationalDSCR.length : 0;
};

/**
 * Extract cashflow data for a specific percentile
 * @param {Object} aggregations - Aggregations with percentileData
 * @param {string} dataType - Type of data ('netCashflow', 'totalCosts', etc.)
 * @param {number} percentile - Target percentile
 * @returns {Array} Cashflow data for the percentile
 */
export const extractPercentileCashflow = (aggregations, dataType, percentile) => {
    const dataSource = aggregations[dataType];

    if (!dataSource) return [];

    if (dataSource.percentileData?.has(percentile)) {
        return dataSource.percentileData.get(percentile);
    }

    return dataSource.data || [];
};

/**
 * Calculate equity investment based on scenario data
 * @param {Object} scenarioData - Scenario data
 * @returns {number} Total equity investment
 */
export const calculateEquityInvestment = (scenarioData) => {
    if (!scenarioData) return 0;

    const financing = scenarioData?.settings?.modules?.financing || {};
    const debtRatio = (financing.debtFinancingRatio || 70) / 100;
    const equityRatio = 1 - debtRatio;
    const totalCapex = scenarioData?.settings?.metrics?.totalCapex || 0;

    return totalCapex * equityRatio;
};

/**
 * Calculate Weighted Average Cost of Capital (WACC)
 * WACC = (E/V * Re) + ((D/V * Rd) * (1 - Tc))
 * @param {Object} financingParams - Financing parameters from scenario
 * @param {Object} options - Additional options
 * @returns {number} WACC as percentage
 */
export const calculateWACC = (financingParams, options = {}) => {
    if (!financingParams) return 0;

    const {
        debtRatio = 70,
        costOfEquity = 8,
        costOfOperationalDebt = 5,
        effectiveTaxRate = 25
    } = financingParams;

    // Convert percentages to decimals
    const debtWeight = debtRatio / 100;
    const equityWeight = 1 - debtWeight;
    const costOfDebt = costOfOperationalDebt / 100;
    const costOfEquityDecimal = costOfEquity / 100;
    const taxRate = effectiveTaxRate / 100;

    // WACC formula
    const equityComponent = equityWeight * costOfEquityDecimal;
    const debtComponent = debtWeight * costOfDebt * (1 - taxRate);
    const wacc = (equityComponent + debtComponent) * 100;

    return Math.round(wacc * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate debt-to-equity ratio from debt ratio
 * @param {Object} financingParams - Financing parameters
 * @returns {number} Debt-to-equity ratio
 */
export const calculateDebtToEquityRatio = (financingParams) => {
    if (!financingParams) return 0;

    const { debtRatio = 70 } = financingParams;
    const debtWeight = debtRatio / 100;
    const equityWeight = 1 - debtWeight;

    if (equityWeight === 0) return 0;

    return Math.round((debtWeight / equityWeight) * 100) / 100;
};

/**
 * Calculate break-even analysis metrics
 * @param {Array} cashflowData - Cashflow data points
 * @param {Object} options - Analysis options
 * @returns {Object} Break-even analysis results
 */
export const calculateBreakEvenAnalysis = (cashflowData, options = {}) => {
    const { includeNegativeYears = false } = options;

    if (!Array.isArray(cashflowData) || cashflowData.length === 0) {
        return { breakEvenYear: null, cumulativeBreakEven: null, paybackPeriod: null };
    }

    let cumulativeCashflow = 0;
    let breakEvenYear = null;
    let paybackPeriod = null;

    const sortedData = cashflowData
        .filter(d => includeNegativeYears || d.year >= 0)
        .sort((a, b) => a.year - b.year);

    for (let i = 0; i < sortedData.length; i++) {
        const dataPoint = sortedData[i];
        cumulativeCashflow += dataPoint.value;

        // First year where cumulative becomes positive
        if (cumulativeCashflow >= 0 && breakEvenYear === null) {
            breakEvenYear = dataPoint.year;

            // Calculate more precise payback period with interpolation
            if (i > 0) {
                const prevCumulative = cumulativeCashflow - dataPoint.value;
                const interpolation = Math.abs(prevCumulative) / dataPoint.value;
                paybackPeriod = sortedData[i - 1].year + interpolation;
            } else {
                paybackPeriod = dataPoint.year;
            }
            break;
        }
    }

    return {
        breakEvenYear,
        cumulativeBreakEven: cumulativeCashflow,
        paybackPeriod,
        finalCumulativeCashflow: cumulativeCashflow
    };
};

/**
 * Calculate financial ratios and metrics summary
 * @param {Object} financialData - Financial data including cash flows, debt service, etc.
 * @param {Object} scenarioData - Scenario data for parameters
 * @returns {Object} Comprehensive financial metrics
 */
export const calculateFinancialMetrics = (financialData, scenarioData) => {
    const {
        netCashflow = [],
        debtService = [],
        interestPayments = [],
        equityInvestment
    } = financialData;

    const financing = scenarioData?.settings?.modules?.financing || {};
    const costOfEquity = (financing.costOfEquity || 8) / 100;

    // Core metrics
    const projectIRR = calculateIRR(netCashflow);
    const npv = calculateNPV(netCashflow, costOfEquity);
    const equityIRR = calculateEquityIRR(netCashflow, debtService, equityInvestment);
    const wacc = calculateWACC(financing);

    // Coverage ratios
    const llcr = calculateLLCR(netCashflow, debtService, costOfEquity);
    const icr = calculateICR(netCashflow, interestPayments);

    // DSCR calculation
    const dscrData = [];
    if (debtService.length > 0) {
        const debtServiceMap = new Map(debtService.map(d => [d.year, d.value]));
        netCashflow.forEach(cf => {
            const ds = debtServiceMap.get(cf.year);
            if (ds && ds > 0) {
                dscrData.push({
                    year: cf.year,
                    value: Math.max(0, cf.value / ds)
                });
            }
        });
    }

    const avgDSCR = calculateAverageDSCR(dscrData);
    const minDSCR = dscrData.length > 0 ? Math.min(...dscrData.map(d => d.value)) : 0;

    // Break-even analysis
    const breakEvenAnalysis = calculateBreakEvenAnalysis(netCashflow);

    // Risk metrics
    const debtToEquityRatio = calculateDebtToEquityRatio(financing);

    return {
        // Return metrics
        projectIRR,
        equityIRR,
        npv,
        wacc,

        // Coverage metrics
        llcr,
        avgDSCR,
        minDSCR,
        icr,

        // Risk metrics
        debtToEquityRatio,

        // Analysis
        breakEvenAnalysis,

        // Raw data for charts
        dscrData,
        icrData: icr
    };
};



/**
 * Calculate payback period from cash flow data
 * @param {Array} netCashflows - Array of {year, value} objects
 * @param {number} initialInvestment - Initial investment amount (optional)
 * @returns {number|null} Payback period in years, null if never pays back
 */
export const calculatePaybackPeriod = (netCashflows, initialInvestment = null) => {
    if (!Array.isArray(netCashflows) || netCashflows.length === 0) {
        return null;
    }

    // Sort by year to ensure proper order
    const sortedCashflows = [...netCashflows].sort((a, b) => a.year - b.year);

    let cumulativeCashflow = 0;
    let lastNegativeYear = null;

    for (let i = 0; i < sortedCashflows.length; i++) {
        const yearData = sortedCashflows[i];
        cumulativeCashflow += yearData.value;

        if (cumulativeCashflow < 0) {
            lastNegativeYear = i;
        } else if (cumulativeCashflow >= 0 && lastNegativeYear !== null) {
            // Found payback year - use linear interpolation
            const prevCumulative = cumulativeCashflow - yearData.value;
            const fraction = Math.abs(prevCumulative) / yearData.value;
            return yearData.year - 1 + fraction;
        }
    }

    return null; // Never pays back
};

/**
 * Enhanced calculateAllMetrics to include payback period
 * @param {Object} cashflowData - Complete cashflow data structure
 * @param {Object} options - Calculation options
 * @returns {Object} All calculated metrics including payback period
 */
export const calculateAllMetricsWithPayback = (cashflowData, options = {}) => {
    // Get existing metrics from the current calculateFinancialMetrics function
    const existingMetrics = calculateFinancialMetrics(cashflowData, options);

    // Add payback period calculation
    const netCashflows = cashflowData?.aggregations?.netCashflow?.data || [];
    const paybackPeriod = calculatePaybackPeriod(netCashflows);

    return {
        ...existingMetrics,
        paybackPeriod
    };
};

/**
 * Calculate Levelized Cost of Energy (LCOE)
 * @param {Array} costs - Annual cost time-series with {year, value} structure
 * @param {Array} energy - Annual energy production time-series with {year, value} structure  
 * @param {number} discountRate - Discount rate for NPV calculations
 * @returns {number|null} LCOE in $/MWh
 */
export const calculateLCOE = (costs, energy, discountRate) => {
    if (!Array.isArray(costs) || !Array.isArray(energy) || costs.length === 0 || energy.length === 0) {
        return null;
    }

    if (discountRate < 0 || discountRate > 1) {
        console.warn('Discount rate should be between 0 and 1');
        return null;
    }

    // Calculate present value of costs
    const pvCosts = costs.reduce((pv, costPoint) => {
        const discountFactor = Math.pow(1 + discountRate, -costPoint.year);
        return pv + (costPoint.value * discountFactor);
    }, 0);

    // Calculate present value of energy production
    const pvEnergy = energy.reduce((pv, energyPoint) => {
        const discountFactor = Math.pow(1 + discountRate, -energyPoint.year);
        return pv + (energyPoint.value * discountFactor);
    }, 0);

    // LCOE = PV(Costs) / PV(Energy)
    if (pvEnergy === 0) {
        console.warn('Total energy production is zero, cannot calculate LCOE');
        return null;
    }

    return pvCosts / pvEnergy;
};

/**
 * Calculate LCOE from cash flow data
 * @param {Object} cashflowData - Cash flow data with costs and energy production
 * @param {number} discountRate - Discount rate
 * @returns {number|null} LCOE value
 */
export const calculateLCOEFromCashflow = (cashflowData, discountRate = 0.08) => {
    if (!cashflowData?.costs || !cashflowData?.energy) {
        console.warn('Missing cost or energy data for LCOE calculation');
        return null;
    }

    // Extract cost time-series (sum all cost categories)
    const costTimeSeries = [];
    const energyTimeSeries = cashflowData.energy;

    // Aggregate all cost categories by year
    Object.values(cashflowData.costs).forEach(costCategory => {
        if (Array.isArray(costCategory)) {
            costCategory.forEach(costPoint => {
                const existingYear = costTimeSeries.find(c => c.year === costPoint.year);
                if (existingYear) {
                    existingYear.value += costPoint.value;
                } else {
                    costTimeSeries.push({ year: costPoint.year, value: costPoint.value });
                }
            });
        }
    });

    return calculateLCOE(costTimeSeries, energyTimeSeries, discountRate);
};

/**
 * Calculate all SUPPORTED_METRICS for a given percentile
 * @param {Object} aggregations - Cashflow aggregations
 * @param {number} percentile - Target percentile  
 * @param {Object} scenarioData - Scenario data
 * @param {Array} lineItems - Line items for debt service
 * @returns {Object} All metrics for this percentile
 */
export const calculateMetricsForPercentile = (aggregations, percentile, scenarioData, lineItems = []) => {
    const metrics = {};

    // Extract cashflow data for this percentile
    const netCashflowData = extractPercentileCashflow(aggregations, 'netCashflow', percentile);
    const costData = extractPercentileCashflow(aggregations, 'totalCosts', percentile);
    const revenueData = extractPercentileCashflow(aggregations, 'totalRevenue', percentile);

    // Get financing parameters
    const financing = scenarioData?.settings?.modules?.financing || {};
    const costOfEquity = (financing.costOfEquity || 8) / 100;
    const minimumDSCR = financing.minimumDSCR || 1.3;

    // Find debt service data
    const interestLineItem = lineItems.find(item => item.id === 'operationalInterest');
    const principalLineItem = lineItems.find(item => item.id === 'operationalPrincipal');

    // Extract debt service for this percentile
    const interestData = interestLineItem?.percentileData?.has(percentile)
        ? interestLineItem.percentileData.get(percentile)
        : interestLineItem?.data || [];
    const principalData = principalLineItem?.percentileData?.has(percentile)
        ? principalLineItem.percentileData.get(percentile)
        : principalLineItem?.data || [];

    // Combine debt service (interest + principal)
    const debtServiceData = combineDebtService(interestData, principalData);

    // Calculate all metrics that are in SUPPORTED_METRICS
    if (SUPPORTED_METRICS.irr) {
        metrics.irr = calculateIRR(netCashflowData);
    }

    if (SUPPORTED_METRICS.npv) {
        metrics.npv = calculateNPV(netCashflowData, costOfEquity);
    }

    if (SUPPORTED_METRICS.equityIRR) {
        const equityInvestment = calculateEquityInvestment(scenarioData);
        metrics.equityIRR = calculateEquityIRR(netCashflowData, debtServiceData, equityInvestment);
    }

    if (SUPPORTED_METRICS.dscr) {
        metrics.dscr = calculateDSCRTimeSeries(netCashflowData, debtServiceData);
    }

    if (SUPPORTED_METRICS.minDSCR && metrics.dscr) {
        metrics.minDSCR = calculateMinDSCR(metrics.dscr);
    }

    if (SUPPORTED_METRICS.avgDSCR && metrics.dscr) {
        metrics.avgDSCR = calculateAvgDSCR(metrics.dscr);
    }

    if (SUPPORTED_METRICS.llcr) {
        const llcrValue = calculateLLCR(netCashflowData, debtServiceData, costOfEquity);
        // Convert to time series format for consistency
        const projectLife = scenarioData?.settings?.general?.projectLife || 20;
        metrics.llcr = Array.from({ length: projectLife }, (_, i) => ({
            year: i + 1,
            value: llcrValue
        }));
    }

    if (SUPPORTED_METRICS.lcoe) {
        metrics.lcoe = calculateLCOEFromCashflow({ costs: costData, energy: revenueData }, costOfEquity);
    }

    return metrics;
};

// ===== HELPER FUNCTIONS =====

/**
 * Combine interest and principal into debt service
 * @param {Array} interestData - Interest payment data
 * @param {Array} principalData - Principal payment data  
 * @returns {Array} Combined debt service data
 */
export const combineDebtService = (interestData, principalData) => {
    if (!Array.isArray(interestData) || !Array.isArray(principalData)) return [];

    const allYears = new Set([
        ...interestData.map(d => d.year),
        ...principalData.map(d => d.year)
    ]);

    return Array.from(allYears).map(year => {
        const interest = interestData.find(d => d.year === year)?.value || 0;
        const principal = principalData.find(d => d.year === year)?.value || 0;
        return { year, value: interest + principal };
    }).sort((a, b) => a.year - b.year);
};

/**
 * Calculate DSCR time series
 * @param {Array} netCashflowData - Net cashflow data
 * @param {Array} debtServiceData - Debt service data
 * @returns {Array} DSCR time series
 */
export const calculateDSCRTimeSeries = (netCashflowData, debtServiceData) => {
    if (!Array.isArray(netCashflowData) || !Array.isArray(debtServiceData)) return [];

    const debtServiceMap = new Map(debtServiceData.map(d => [d.year, d.value]));

    return netCashflowData.map(cf => {
        const debtService = debtServiceMap.get(cf.year) || 0;
        const dscr = debtService > 0 ? cf.value / debtService : 0;
        return { year: cf.year, value: Math.max(0, dscr) };
    }).sort((a, b) => a.year - b.year);
};
