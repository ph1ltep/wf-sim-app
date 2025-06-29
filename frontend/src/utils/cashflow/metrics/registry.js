// frontend/src/utils/cashflow/metrics/registry.js
import * as irrCalculations from './calculations/irr.js';
import * as npvCalculations from './calculations/npv.js';
import * as dscrCalculations from './calculations/dscr.js';
import * as lcoeCalculations from './calculations/lcoe.js';
import * as equityIrrCalculations from './calculations/equityIrr.js';
import * as llcrCalculations from './calculations/llcr.js';
import * as icrCalculations from './calculations/icr.js';
import * as paybackCalculations from './calculations/payback.js';
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
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 8, description: 'Project IRR below target'
        }],
        metadata: {
            name: 'Internal Rate of Return', shortName: 'IRR',
            description: 'Internal rate of return on project investment',
            units: 'percentage', displayUnits: '%',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 12,
        dependsOn: ['netCashflow'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'irr', options: { filter: 'all' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    dscr: {
        ...dscrCalculations,
        thresholds: [{
            field: 'dscr_covenant', comparison: 'below', value: 1.2,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 9, description: 'DSCR below covenant level'
        }],
        metadata: {
            name: 'Debt Service Coverage Ratio', shortName: 'DSCR',
            description: 'Ability to service debt payments from operating cash flows',
            units: 'ratio', displayUnits: 'x',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 13,
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
            field: 'market_lcoe', comparison: 'above', value: 80,
            colorRule: (value, threshold) => value > threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 7, description: 'LCOE above market benchmark'
        }],
        metadata: {
            name: 'Levelized Cost of Energy', shortName: 'LCOE',
            description: 'Levelized cost of energy production over project lifetime',
            units: 'currency_per_mwh', displayUnits: '$/MWh',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 14,
        dependsOn: ['netCashflow', 'totalRevenue'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'lcoe', options: { filter: 'operational' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    equityIrr: {
        ...equityIrrCalculations,
        thresholds: [{
            field: 'target_equity_irr', comparison: 'below', value: 12,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 6, description: 'Equity IRR below target'
        }],
        metadata: {
            name: 'Equity Internal Rate of Return', shortName: 'Equity IRR',
            description: 'Internal rate of return on equity investment after debt service',
            units: 'percentage', displayUnits: '%',
            windIndustryStandard: true, calculationComplexity: 'high'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity'],
        priority: 15,
        dependsOn: ['netCashflow', 'debtService'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'equity_irr', options: { filter: 'operational' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    llcr: {
        ...llcrCalculations,
        thresholds: [{
            field: 'llcr_covenant', comparison: 'below', value: 1.15,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 8, description: 'LLCR below covenant level'
        }],
        metadata: {
            name: 'Loan Life Coverage Ratio', shortName: 'LLCR',
            description: 'Present value of cash flows relative to outstanding debt',
            units: 'ratio', displayUnits: 'x',
            windIndustryStandard: true, calculationComplexity: 'high'
        },
        category: 'financial',
        usage: ['financeability'],
        priority: 16,
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
            field: 'icr_covenant', comparison: 'below', value: 2.0,
            colorRule: (value, threshold) => value < threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 7, description: 'ICR below covenant level'
        }],
        metadata: {
            name: 'Interest Coverage Ratio', shortName: 'ICR',
            description: 'Coverage of interest payments from operating cash flows',
            units: 'ratio', displayUnits: 'x',
            windIndustryStandard: true, calculationComplexity: 'medium'
        },
        category: 'financial',
        usage: ['financeability'],
        priority: 17,
        dependsOn: ['netCashflow'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'min', options: { filter: 'operational' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    },

    payback: {
        ...paybackCalculations,
        thresholds: [{
            field: 'max_payback', comparison: 'above', value: 10,
            colorRule: (value, threshold) => value > threshold ?
                { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
            priority: 5, description: 'Payback period too long'
        }],
        metadata: {
            name: 'Payback Period', shortName: 'Payback',
            description: 'Time to recover initial investment from cash flows',
            units: 'years', displayUnits: 'years',
            windIndustryStandard: true, calculationComplexity: 'simple'
        },
        category: 'financial',
        usage: ['comparative'],
        priority: 18,
        dependsOn: ['netCashflow'],
        inputStrategy: 'foundational',
        cubeConfig: {
            aggregation: { method: 'payback', options: { filter: 'all' } },
            timeSeriesRequired: true, percentileDependent: true, aggregatesTo: 'single_value'
        }
    }
};

/**
 * Unified Cashflow Metrics Registry - Two-Tier Architecture
 * Foundational (1-9) → Analytical (10+)
 */
export const CASHFLOW_METRICS_REGISTRY = {
    ...FOUNDATIONAL_METRICS_REGISTRY,
    ...ANALYTICAL_METRICS_REGISTRY
};

// Export utility functions (keeping the same as before)
export const getMetricConfig = (metricKey) => CASHFLOW_METRICS_REGISTRY[metricKey] || null;

export const getMetricsByUsage = (usageType) => {
    const filtered = {};
    Object.entries(CASHFLOW_METRICS_REGISTRY).forEach(([key, config]) => {
        if (config.usage && config.usage.includes(usageType)) {
            filtered[key] = config;
        }
    });
    return filtered;
};

export const getMetricsByCategory = (category) => {
    const filtered = {};
    Object.entries(CASHFLOW_METRICS_REGISTRY).forEach(([key, config]) => {
        if (config.category === category) {
            filtered[key] = config;
        }
    });
    return filtered;
};

export const getMetricsByPriority = () => {
    return Object.entries(CASHFLOW_METRICS_REGISTRY)
        .sort(([, a], [, b]) => a.priority - b.priority);
};

export const resolveDependencies = (metricKeys = null) => {
    const keysToResolve = metricKeys || Object.keys(CASHFLOW_METRICS_REGISTRY);
    const resolved = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (metricKey) => {
        if (visited.has(metricKey)) return;
        if (visiting.has(metricKey)) {
            throw new Error(`Circular dependency detected involving ${metricKey}`);
        }

        visiting.add(metricKey);
        const metric = CASHFLOW_METRICS_REGISTRY[metricKey];
        if (metric && metric.dependsOn) {
            metric.dependsOn.forEach(depKey => {
                if (CASHFLOW_METRICS_REGISTRY[depKey]) visit(depKey);
            });
        }
        visiting.delete(metricKey);
        visited.add(metricKey);
        resolved.push(metricKey);
    };

    keysToResolve.forEach(visit);
    return resolved;
};

export const validateRegistry = () => {
    const errors = [];
    Object.entries(CASHFLOW_METRICS_REGISTRY).forEach(([key, config]) => {
        if (!config.calculate || typeof config.calculate !== 'function') {
            errors.push(`${key}: Missing or invalid calculate function`);
        }
        if (!config.format || typeof config.format !== 'function') {
            errors.push(`${key}: Missing or invalid format function`);
        }
        if (!config.formatImpact || typeof config.formatImpact !== 'function') {
            errors.push(`${key}: Missing or invalid formatImpact function`);
        }
        if (!config.metadata || !config.metadata.name) {
            errors.push(`${key}: Missing metadata.name`);
        }
        if (config.dependsOn) {
            config.dependsOn.forEach(depKey => {
                if (!CASHFLOW_METRICS_REGISTRY[depKey]) {
                    errors.push(`${key}: Dependency '${depKey}' not found in registry`);
                }
            });
        }
        if (typeof config.priority !== 'number') {
            errors.push(`${key}: Missing or invalid priority number`);
        }
    });

    try {
        resolveDependencies();
    } catch (error) {
        errors.push(`Circular dependency detected: ${error.message}`);
    }

    return { isValid: errors.length === 0, errors };
};

export { FOUNDATIONAL_METRICS_REGISTRY, ANALYTICAL_METRICS_REGISTRY };