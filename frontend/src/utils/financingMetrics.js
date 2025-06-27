// File: frontend/src/utils/financingMetrics.js
// OPTIMIZED: Complete SUPPORTED_METRICS-driven computation

import {
    calculateIRR,
    calculateNPV,
    calculateEquityIRR,
    calculateEquityInvestment,
    calculateLLCR,
    calculateLCOE,
    calculateICR,
    calculateDSCRTimeSeries,
    combineDebtService,
    calculateMinDSCR,
    calculateAvgDSCR,
    calculatePaybackPeriod,
    calculateBreakEvenAnalysis
} from './finance/calculations';
import { SUPPORTED_METRICS } from './finance/sensitivityMetrics';

/**
 * ENHANCED: Compute ALL metrics defined in SUPPORTED_METRICS
 * @param {Object} aggregations - Cashflow aggregations (with percentileData)
 * @param {Array} availablePercentiles - Available percentile values
 * @param {Object} scenarioData - Full scenario data for parameters
 * @param {Array} lineItems - All line items for debt service lookup
 * @returns {Object} Enhanced finance metrics with ALL SUPPORTED_METRICS computed
 */
export const enhancedFinanceMetrics = (aggregations, availablePercentiles, scenarioData, lineItems = []) => {
    console.log('🧮 Computing ALL SUPPORTED_METRICS for sensitivity cube...');

    // Initialize metrics structure using SUPPORTED_METRICS keys
    const financeMetrics = {};
    Object.keys(SUPPORTED_METRICS).forEach(metricKey => {
        financeMetrics[metricKey] = new Map();
    });

    // Get financing parameters
    const financingParams = scenarioData?.settings?.modules?.financing || {};
    const minimumDSCR = financingParams.minimumDSCR || 1.3;
    const costOfEquity = (financingParams.costOfEquity || 8) / 100;

    // Find debt service line items
    const interestLineItem = lineItems.find(item => item.id === 'operationalInterest');
    const principalLineItem = lineItems.find(item => item.id === 'operationalPrincipal');

    console.log(`Processing ${availablePercentiles.length} percentiles for ${Object.keys(SUPPORTED_METRICS).length} metrics...`);

    // Process each percentile
    availablePercentiles.forEach(percentile => {
        console.log(`\nProcessing percentile P${percentile}:`);

        // ===== EXTRACT CASHFLOW DATA FOR THIS PERCENTILE =====
        const netCashflowData = extractPercentileCashflow(aggregations, 'netCashflow', percentile);
        const costData = extractPercentileCashflow(aggregations, 'totalCosts', percentile);
        const revenueData = extractPercentileCashflow(aggregations, 'totalRevenue', percentile);

        // Extract debt service for this percentile
        const interestData = interestLineItem?.percentileData?.has(percentile)
            ? interestLineItem.percentileData.get(percentile)
            : interestLineItem?.data || [];
        const principalData = principalLineItem?.percentileData?.has(percentile)
            ? principalLineItem.percentileData.get(percentile)
            : principalLineItem?.data || [];

        // Combine debt service (interest + principal)
        const debtServiceData = combineDebtService(interestData, principalData);

        // ===== COMPUTE ALL METRICS THAT ARE IN SUPPORTED_METRICS =====

        // 1. IRR (Project IRR)
        if (SUPPORTED_METRICS.irr) {
            const projectIRR = calculateIRR(netCashflowData);
            financeMetrics.irr.set(percentile, projectIRR);
            console.log(`  ✅ irr: ${projectIRR.toFixed(2)}%`);
        }

        // 2. NPV 
        if (SUPPORTED_METRICS.npv) {
            const npv = calculateNPV(netCashflowData, costOfEquity);
            financeMetrics.npv.set(percentile, npv);
            console.log(`  ✅ npv: $${(npv / 1000000).toFixed(1)}M`);
        }

        // 3. Equity IRR
        if (SUPPORTED_METRICS.equityIRR) {
            const equityInvestment = calculateEquityInvestment(scenarioData);
            const equityIRR = calculateEquityIRR(netCashflowData, debtServiceData, equityInvestment);
            financeMetrics.equityIRR.set(percentile, equityIRR);
            console.log(`  ✅ equityIRR: ${equityIRR.toFixed(2)}%`);
        }

        // 4. DSCR (time series) 
        if (SUPPORTED_METRICS.dscr) {
            const dscrData = calculateDSCRTimeSeries(netCashflowData, debtServiceData);
            financeMetrics.dscr.set(percentile, dscrData);
            console.log(`  ✅ dscr: ${dscrData.length} data points`);

            // 5. DERIVED: minDSCR (NEW - was missing!)
            if (SUPPORTED_METRICS.minDSCR) {
                const minDSCR = calculateMinDSCR(dscrData);
                financeMetrics.minDSCR.set(percentile, minDSCR);
                console.log(`  ✅ minDSCR: ${minDSCR.toFixed(2)}`);
            }

            // 6. DERIVED: avgDSCR (NEW - was missing!)
            if (SUPPORTED_METRICS.avgDSCR) {
                const avgDSCR = calculateAvgDSCR(dscrData);
                financeMetrics.avgDSCR.set(percentile, avgDSCR);
                console.log(`  ✅ avgDSCR: ${avgDSCR.toFixed(2)}`);
            }
        }

        // 7. LLCR (existing logic)
        if (SUPPORTED_METRICS.llcr) {
            const llcrValue = calculateLLCR(netCashflowData, debtServiceData, costOfEquity);
            const projectLife = scenarioData?.settings?.general?.projectLife || 20;
            const llcrTimeSeries = Array.from({ length: projectLife }, (_, i) => ({
                year: i + 1,
                value: llcrValue
            }));
            financeMetrics.llcr.set(percentile, llcrTimeSeries);
            console.log(`  ✅ llcr: ${llcrValue.toFixed(2)}`);
        }

        // 8. LCOE (NEW - was missing!)
        if (SUPPORTED_METRICS.lcoe) {
            const lcoe = calculateLCOEForPercentile(costData, revenueData, costOfEquity);
            financeMetrics.lcoe.set(percentile, lcoe);
            console.log(`  ✅ lcoe: ${lcoe ? lcoe.toFixed(2) : 'null'} $/MWh`);
        }

        // 9. Payback Period (NEW - was missing!)
        if (SUPPORTED_METRICS.paybackPeriod) {
            const paybackPeriod = calculatePaybackPeriod(netCashflowData);
            financeMetrics.paybackPeriod.set(percentile, paybackPeriod);
            console.log(`  ✅ paybackPeriod: ${paybackPeriod ? paybackPeriod.toFixed(1) : 'null'} years`);
        }

        // 10. Total Cashflow (NEW - was missing!)
        if (SUPPORTED_METRICS.totalCashflow) {
            const totalCashflow = netCashflowData.reduce((sum, cf) => sum + cf.value, 0);
            financeMetrics.totalCashflow.set(percentile, totalCashflow);
            console.log(`  ✅ totalCashflow: $${(totalCashflow / 1000000).toFixed(1)}M`);
        }

        // 11. Break Even Year (NEW - was missing!)
        if (SUPPORTED_METRICS.breakEvenYear) {
            const breakEvenAnalysis = calculateBreakEvenAnalysis(netCashflowData);
            financeMetrics.breakEvenYear.set(percentile, breakEvenAnalysis.breakEvenYear);
            console.log(`  ✅ breakEvenYear: ${breakEvenAnalysis.breakEvenYear || 'null'}`);
        }

        // 12. ICR (if in SUPPORTED_METRICS)
        if (SUPPORTED_METRICS.icr) {
            const icrData = calculateICR(netCashflowData, interestData);
            financeMetrics.icr.set(percentile, icrData);
            console.log(`  ✅ icr: ${icrData.length} data points`);
        }

        // 13. Covenant breaches (existing)
        if (SUPPORTED_METRICS.covenantBreaches && financeMetrics.dscr?.has(percentile)) {
            const dscrData = financeMetrics.dscr.get(percentile);
            const breaches = dscrData
                .filter(d => d.year > 0)
                .filter(d => d.value < minimumDSCR)
                .map(d => ({
                    year: d.year,
                    dscr: d.value,
                    threshold: minimumDSCR,
                    margin: minimumDSCR - d.value,
                    severity: d.value < 1.0 ? 'severe' : d.value < 1.2 ? 'moderate' : 'minor'
                }));

            financeMetrics.covenantBreaches.set(percentile, breaches);
            console.log(`  ✅ covenantBreaches: ${breaches.length} breaches`);
        }
    });

    // Add covenant threshold for reference
    financeMetrics.covenantThreshold = minimumDSCR;

    // ✅ ENHANCED COMPLETION STATUS LOG
    const computedMetrics = Object.keys(financeMetrics).filter(key =>
        financeMetrics[key] instanceof Map && financeMetrics[key].size > 0
    );
    const missingMetrics = Object.keys(SUPPORTED_METRICS).filter(key => !computedMetrics.includes(key));

    console.log('✅ Enhanced finance metrics completed:', {
        supportedMetricsCount: Object.keys(SUPPORTED_METRICS).length,
        computedMetricsCount: computedMetrics.length,
        computedMetrics: computedMetrics,
        missingMetrics: missingMetrics.length > 0 ? missingMetrics : 'None',
        percentileCount: availablePercentiles.length
    });

    if (missingMetrics.length > 0) {
        console.warn(`⚠️ Missing metrics: ${missingMetrics.join(', ')}`);
        console.warn('These metrics are defined in SUPPORTED_METRICS but not computed');
    }

    return financeMetrics;
};

/**
 * IMPROVED: Calculate LCOE for a specific percentile with better error handling
 */
const calculateLCOEForPercentile = (costData, revenueData, discountRate) => {
    try {
        if (!costData || !revenueData || costData.length === 0 || revenueData.length === 0) {
            console.warn('Missing cost or revenue data for LCOE calculation');
            return 0;
        }

        // For wind projects, estimate energy from revenue
        // Assume average electricity price of $50/MWh for energy estimation
        const energyData = revenueData.map(r => ({
            year: r.year,
            value: r.value / 50 // Convert revenue to estimated energy production
        }));

        const lcoe = calculateLCOE(costData, energyData, discountRate);
        return lcoe || 0;
    } catch (error) {
        console.warn('Error calculating LCOE:', error);
        return 0;
    }
};

/**
 * HELPER: Extract cashflow data for a specific percentile 
 */
const extractPercentileCashflow = (aggregations, dataType, percentile) => {
    const dataSource = aggregations[dataType];

    if (!dataSource) return [];

    if (dataSource.percentileData?.has(percentile)) {
        return dataSource.percentileData.get(percentile);
    }

    return dataSource.data || [];
};

// ===== BACKWARD COMPATIBILITY EXPORTS =====
export {
    calculateEquityInvestment,
    calculateBreakEvenAnalysis,
    calculateDebtToEquityRatio,
    calculateNPV,
    calculateIRR,
    calculateLLCR,
    calculateWACC
} from './finance/calculations';