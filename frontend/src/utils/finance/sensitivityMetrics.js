// frontend/src/utils/finance/sensitivityMetrics.js - Simplified threshold structure

import { getFinancialColorScheme } from '../charts/colors';

export const SUPPORTED_METRICS = {
    npv: {
        label: 'Net Present Value',
        units: 'currency',
        formatValue: (value, currency = '$') => `${currency}${(value / 1000000).toFixed(1)}M`,
        impactFormat: (impact, currency = '$') => `±${currency}${(Math.abs(impact) / 1000000).toFixed(1)}M`,
        description: 'Total value creation from project cash flows',
        calculationPath: 'npv',
        chartColor: 'npv',

        thresholds: [
            {
                path: ['settings', 'metrics', 'totalMW'], // Will be transformed to NPV threshold
                comparison: 'above',
                transform: (totalMW) => totalMW * 500000, // $500k per MW baseline for "good"
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'NPV above baseline ($500k/MW)'
            },
            {
                path: null, // Fixed threshold
                comparison: 'above',
                threshold: 0, // Break-even
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('good') } :
                    { color: getFinancialColorScheme('concerning') },
                priority: 10,
                description: 'NPV positive/negative'
            }
        ]
    },

    irr: {
        label: 'Project IRR',
        units: 'percentage',
        formatValue: (value) => `${value.toFixed(1)}%`,
        impactFormat: (impact) => `±${Math.abs(impact).toFixed(1)}%`,
        description: 'Internal rate of return for total project investment',
        calculationPath: 'irr',
        chartColor: 'irr',

        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'projectIRRTarget'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('concerning') } : null,
                priority: 8,
                description: 'Project IRR below target'
            },
            {
                path: ['settings', 'modules', 'financing', 'projectIRRTarget'],
                comparison: 'above',
                transform: (target) => target * 1.2, // 20% above target for excellent
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'Project IRR excellent performance'
            }
        ]
    },

    equityIRR: {
        label: 'Equity IRR',
        units: 'percentage',
        formatValue: (value) => `${value.toFixed(1)}%`,
        impactFormat: (impact) => `±${Math.abs(impact).toFixed(1)}%`,
        description: 'Internal rate of return for equity investors after debt service',
        calculationPath: 'equityIRR',
        chartColor: 'equityIRR',

        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'equityIRRTarget'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('concerning') } : null,
                priority: 8,
                description: 'Equity IRR below target'
            },
            {
                path: ['settings', 'modules', 'financing', 'equityIRRTarget'],
                comparison: 'above',
                transform: (target) => target * 1.15, // 15% above target for excellent
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'Equity IRR excellent performance'
            }
        ]
    },

    dscr: {
        label: 'Minimum DSCR',
        units: 'ratio',
        formatValue: (value) => value.toFixed(2),
        impactFormat: (impact) => `±${Math.abs(impact).toFixed(2)}`,
        description: 'Lowest debt service coverage ratio during operational period',
        calculationPath: 'dscr.minimum',
        chartColor: 'dscr',

        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'covenantThreshold'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('concerning'), fontWeight: 600 } : null,
                priority: 10,
                description: 'DSCR below covenant threshold'
            },
            {
                path: ['settings', 'modules', 'financing', 'covenantThreshold'],
                comparison: 'above',
                transform: (covenant) => covenant * 1.15, // 15% above covenant for excellent
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'DSCR excellent coverage'
            }
        ]
    },

    paybackPeriod: {
        label: 'Payback Period',
        units: 'years',
        formatValue: (value) => `${value.toFixed(1)} years`,
        impactFormat: (impact) => `±${Math.abs(impact).toFixed(1)} years`,
        description: 'Time to recover initial investment from cumulative cash flows',
        calculationPath: 'paybackPeriod',
        chartColor: 'paybackPeriod',

        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'targetPaybackPeriod'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('concerning') } : null,
                priority: 8,
                description: 'Payback period above target'
            },
            {
                path: ['settings', 'modules', 'financing', 'targetPaybackPeriod'],
                comparison: 'below',
                transform: (target) => target * 0.8, // 20% better than target for excellent
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'Excellent payback performance'
            },
            {
                path: null, // Fixed industry threshold
                comparison: 'above',
                threshold: 12, // Industry concerning threshold
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('concerning'), fontWeight: 600 } : null,
                priority: 6,
                description: 'Payback exceeds industry benchmark'
            }
        ]
    }
};

/**
 * Get metric classification using existing threshold evaluation patterns
 * @param {string} metricKey - Metric key
 * @param {number} value - Metric value
 * @param {Function} getValueByPath - Function to read from scenario
 * @returns {Object} { color, fontWeight, appliedRules } or {}
 */
export const getMetricClassification = (metricKey, value, getValueByPath) => {
    const metric = SUPPORTED_METRICS[metricKey];

    if (!metric?.thresholds || value === null || value === undefined) {
        return {};
    }

    // Build evaluation thresholds following existing pattern
    const evaluationThresholds = metric.thresholds.map(threshold => {
        let thresholdValue;

        if (threshold.path) {
            // Read from context
            const contextValue = getValueByPath(threshold.path, 0);
            thresholdValue = threshold.transform ? threshold.transform(contextValue) : contextValue;
        } else {
            // Use fixed threshold
            thresholdValue = threshold.threshold;
        }

        return {
            field: 'value', // We'll pass the metric value as 'value' field
            comparison: threshold.comparison,
            colorRule: (val, thresh) => threshold.colorRule(val, thresholdValue),
            priority: threshold.priority,
            description: threshold.description
        };
    });

    // Use existing threshold evaluation (same as TableConfiguration.js)
    const evaluationData = { value: value };
    const appliedStyle = evaluateThresholds(evaluationData, evaluationThresholds, value);

    return appliedStyle;
};

/**
 * Use existing evaluateThresholds pattern (simplified)
 * @param {Object} rowData - Row data
 * @param {Array} thresholds - Threshold configurations
 * @param {number} cellValue - Cell value
 * @returns {Object} Applied styles
 */
const evaluateThresholds = (rowData, thresholds = [], cellValue) => {
    if (!thresholds || thresholds.length === 0) return {};

    const sortedThresholds = [...thresholds].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    let appliedStyle = {};
    let appliedRules = [];

    sortedThresholds.forEach(threshold => {
        const { comparison, colorRule, priority = 0, description } = threshold;

        let conditionMet = false;

        switch (comparison) {
            case 'below':
            case 'less_than':
                conditionMet = cellValue < 0; // Will be set by colorRule
                break;
            case 'above':
            case 'greater_than':
                conditionMet = cellValue > 0; // Will be set by colorRule
                break;
            default:
                return;
        }

        if (colorRule) {
            const result = colorRule(cellValue, 0); // Threshold handled inside colorRule

            if (result && priority >= (appliedStyle._priority || 0)) {
                appliedStyle = {
                    ...appliedStyle,
                    ...result,
                    _priority: priority
                };
                appliedRules.push(description);
            }
        }
    });

    appliedStyle._appliedRules = appliedRules;
    return appliedStyle;
};

/**
 * Extract metric value from cashflow results
 */
export const extractMetricValue = (cashflowResults, metricKey) => {
    const metric = SUPPORTED_METRICS[metricKey];
    if (!metric || !cashflowResults) return null;

    const path = metric.calculationPath.split('.');
    let value = cashflowResults;

    for (const key of path) {
        if (value && typeof value === 'object') {
            value = value[key];
        } else {
            return null;
        }
    }

    return typeof value === 'number' ? value : null;
};

/**
 * Get all supported metric keys
 */
export const getSupportedMetricKeys = () => {
    return Object.keys(SUPPORTED_METRICS);
};

/**
 * Get metric configuration
 */
export const getMetricConfig = (metricKey) => {
    return SUPPORTED_METRICS[metricKey] || null;
};

/**
 * Create options for metric selector
 */
export const createMetricSelectorOptions = (excludeMetrics = []) => {
    return Object.entries(SUPPORTED_METRICS)
        .filter(([key]) => !excludeMetrics.includes(key))
        .map(([key, metric]) => ({
            value: key,
            label: metric.label,
            description: metric.description,
            key: `metric-${key}`
        }));
};