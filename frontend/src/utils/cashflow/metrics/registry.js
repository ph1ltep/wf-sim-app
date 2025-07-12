// frontend/src/utils/cashflow/metrics/registry.js
import * as irrCalculations from './analytical/irr.js';
import * as npvCalculations from './analytical/npv.js';
import * as dscrCalculations from './analytical/dscr.js';
import * as lcoeCalculations from './analytical/lcoe.js';
import * as equityIrrCalculations from './analytical/equityIrr.js';
import * as llcrCalculations from './analytical/llcr.js';
import * as icrCalculations from './analytical/icr.js';
import * as paybackCalculations from './analytical/payback.js';
import { getFinancialColorScheme } from '../../charts/colors.js';
import { FOUNDATIONAL_METRICS_REGISTRY } from './foundational/index.js';

/**
 * Analytical Metrics Registry (Tier 2) - Priority 10+
 */
export const ANALYTICAL_METRICS_REGISTRY = {
    npv: {
        ...npvCalculations,
        thresholds: [{
            field: 'npv_positive', comparison: 'above', value: 0,
            colorRule: (value, threshold) => value > threshold ?
                { color: getFinancialColorScheme('good') } :
                { color: getFinancialColorScheme('poor'), fontWeight: 600 },
            priority: 10, description: 'NPV positive/negative indicator'
        }],
        metadata: {
            name: 'Net Present Value', shortName: 'NPV',
            description: 'Present value of all future cash flows discounted at cost of equity',
            units: 'currency', displayUnits: 'USD',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 11,
        dependsOn: ['netCashflow'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'npv', options: { discountRate: 'auto', filter: 'all' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    irr: {
        ...irrCalculations,
        thresholds: [{
            field: 'target_irr', comparison: 'below', value: 8,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                { color: getFinancialColorScheme('good') },
            priority: 5, description: 'IRR vs target return threshold'
        }],
        metadata: {
            name: 'Internal Rate of Return', shortName: 'IRR',
            description: 'Discount rate that makes NPV equal to zero',
            units: 'percentage', displayUnits: '%',
            windIndustryStandard: true, calculationComplexity: 'high'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 10,
        dependsOn: ['netCashflow'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'irr', options: { filter: 'all' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    dscr: {
        ...dscrCalculations,
        thresholds: [
            {
                field: 'minimum_dscr', comparison: 'below', value: 1.3,
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                    { color: getFinancialColorScheme('good') },
                priority: 1, description: 'DSCR covenant threshold'
            },
            {
                field: 'strong_dscr', comparison: 'above', value: 1.5,
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } :
                    { color: getFinancialColorScheme('good') },
                priority: 2, description: 'Strong DSCR indicator'
            }
        ],
        metadata: {
            name: 'Debt Service Coverage Ratio', shortName: 'DSCR',
            description: 'Operational cash flow divided by debt service',
            units: 'ratio', displayUnits: 'x',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 12,
        dependsOn: ['netCashflow', 'debtService'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'min', options: { filter: 'operational' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    lcoe: {
        ...lcoeCalculations,
        thresholds: [{
            field: 'competitive_lcoe', comparison: 'above', value: 60,
            colorRule: (value, threshold) => value > threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                { color: getFinancialColorScheme('good') },
            priority: 1, description: 'Competitive LCOE threshold'
        }],
        metadata: {
            name: 'Levelized Cost of Energy', shortName: 'LCOE',
            description: 'Total lifecycle costs divided by total energy production',
            units: 'currency_per_mwh', displayUnits: '$/MWh',
            windIndustryStandard: true, calculationComplexity: 'high'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 13,
        dependsOn: ['netCashflow', 'totalRevenue'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'lcoe', options: { filter: 'all' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    equityIrr: {
        ...equityIrrCalculations,
        thresholds: [{
            field: 'target_equity_irr', comparison: 'below', value: 12,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                { color: getFinancialColorScheme('good') },
            priority: 5, description: 'Equity IRR vs target threshold'
        }],
        metadata: {
            name: 'Equity Internal Rate of Return', shortName: 'Equity IRR',
            description: 'IRR calculated on equity cash flows after debt service',
            units: 'percentage', displayUnits: '%',
            windIndustryStandard: true, calculationComplexity: 'high'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 14,
        dependsOn: ['netCashflow', 'debtService'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'irr', options: { filter: 'equity' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    llcr: {
        ...llcrCalculations,
        thresholds: [{
            field: 'minimum_llcr', comparison: 'below', value: 1.2,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                { color: getFinancialColorScheme('good') },
            priority: 1, description: 'LLCR covenant threshold'
        }],
        metadata: {
            name: 'Loan Life Coverage Ratio', shortName: 'LLCR',
            description: 'NPV of cash flows over remaining loan life divided by outstanding debt',
            units: 'ratio', displayUnits: 'x',
            windIndustryStandard: true, calculationComplexity: 'high'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 15,
        dependsOn: ['netCashflow', 'debtService'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'llcr', options: { filter: 'operational' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    icr: {
        ...icrCalculations,
        thresholds: [{
            field: 'minimum_icr', comparison: 'below', value: 2.0,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                { color: getFinancialColorScheme('good') },
            priority: 1, description: 'Interest Coverage Ratio minimum'
        }],
        metadata: {
            name: 'Interest Coverage Ratio', shortName: 'ICR',
            description: 'EBITDA divided by interest payments',
            units: 'ratio', displayUnits: 'x',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 16,
        dependsOn: ['netCashflow', 'interestPayments'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'min', options: { filter: 'operational' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    payback: {
        ...paybackCalculations,
        thresholds: [{
            field: 'acceptable_payback', comparison: 'above', value: 15,
            colorRule: (value, threshold) => value > threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } :
                { color: getFinancialColorScheme('good') },
            priority: 1, description: 'Acceptable payback period threshold'
        }],
        metadata: {
            name: 'Payback Period', shortName: 'Payback',
            description: 'Time required for cumulative cash flows to become positive',
            units: 'years', displayUnits: 'years',
            windIndustryStandard: true, calculationComplexity: 'low'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 17,
        dependsOn: ['netCashflow'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'payback', options: { filter: 'all' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    }
};

/**
 * Unified Metrics Registry - Combines foundational and analytical metrics
 */
export const CASHFLOW_METRICS_REGISTRY = {
    // Foundational metrics (priority 1-9) - PRD §5.2
    ...FOUNDATIONAL_METRICS_REGISTRY,

    // Analytical metrics (priority 10+) - PRD §5.2 
    ...ANALYTICAL_METRICS_REGISTRY
};

/**
 * Get metrics by usage type for card filtering
 * @param {string} usageType - Usage type ('financeability', 'sensitivity', 'comparative', 'internal')
 * @returns {Object} Filtered metrics registry
 */
export const getMetricsByUsage = (usageType) => {
    const filteredMetrics = {};

    Object.entries(CASHFLOW_METRICS_REGISTRY).forEach(([key, config]) => {
        if (config.usage && config.usage.includes(usageType)) {
            filteredMetrics[key] = config;
        }
    });

    return filteredMetrics;
};

/**
 * Get metric configuration
 * @param {string} metricKey - Metric key to lookup
 * @returns {Object|null} Metric configuration or null if not found
 */
export const getMetricConfig = (metricKey) => {
    return CASHFLOW_METRICS_REGISTRY[metricKey] || null;
};