// Enhanced frontend/src/utils/finance/sensitivityMetrics.js
// Complete SUPPORTED_METRICS configuration with impactFormat and thresholds

import { getFinancialColorScheme } from '../charts/colors';
import { evaluateThresholds } from '../../components/tables/metrics/TableConfiguration';

/**
 * Complete metrics configuration for Driver Explorer Card
 * Each metric includes formatting, aggregation, and threshold rules
 */
export const SUPPORTED_METRICS = {
    npv: {
        label: 'NPV',
        format: 'currency',
        path: ['npv'],
        aggregation: 'value',
        units: '$',
        description: 'Net Present Value of project cash flows',
        impactFormat: (value) => `$${(Math.abs(value) / 1000000).toFixed(1)}M`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'minNPV'],
                comparison: 'below',
                transform: (value) => value * 1000000,
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 4,
                description: 'NPV below minimum target'
            }
        ]
    },

    irr: {
        label: 'Project IRR',
        format: 'percentage',
        path: ['irr'],
        aggregation: 'value',
        units: '%',
        description: 'Internal Rate of Return for project',
        impactFormat: (value) => `${(Math.abs(value) * 100).toFixed(1)}%`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'minIRR'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 5,
                description: 'IRR below minimum target'
            }
        ]
    },

    equityIRR: {
        label: 'Equity IRR',
        format: 'percentage',
        path: ['equityIRR'],
        aggregation: 'value',
        units: '%',
        description: 'Internal Rate of Return for equity investors',
        impactFormat: (value) => `${(Math.abs(value) * 100).toFixed(1)}%`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'minEquityIRR'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 4,
                description: 'Equity IRR below minimum target'
            }
        ]
    },

    minDSCR: {
        label: 'Minimum DSCR',
        format: 'ratio',
        path: ['dscr'],
        aggregation: 'min',
        aggregationOptions: { filter: 'operational' },
        units: 'x',
        description: 'Lowest Debt Service Coverage Ratio during operations',
        impactFormat: (value) => `${Math.abs(value).toFixed(2)}x`,
        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'dscr', 'covenant'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('covenant'), fontWeight: 600 } : null,
                priority: 6,
                description: 'DSCR breaches debt covenant'
            }
        ]
    },

    avgDSCR: {
        label: 'Average DSCR',
        format: 'ratio',
        path: ['dscr'],
        aggregation: 'mean',
        aggregationOptions: { filter: 'operational' },
        units: 'x',
        description: 'Average Debt Service Coverage Ratio during operations',
        impactFormat: (value) => `${Math.abs(value).toFixed(2)}x`,
        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'dscr', 'target'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('caution'), fontWeight: 600 } : null,
                priority: 3,
                description: 'Average DSCR below target'
            }
        ]
    },

    llcr: {
        label: 'LLCR',
        format: 'ratio',
        path: ['llcr'],
        aggregation: 'value',
        units: 'x',
        description: 'Loan Life Coverage Ratio',
        impactFormat: (value) => `${Math.abs(value).toFixed(2)}x`,
        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'llcr', 'target'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('caution'), fontWeight: 600 } : null,
                priority: 3,
                description: 'LLCR below target'
            }
        ]
    },

    paybackPeriod: {
        label: 'Payback Period',
        format: 'years',
        path: ['paybackPeriod'],
        aggregation: 'value',
        units: 'years',
        description: 'Time to recover initial investment',
        impactFormat: (value) => `${Math.abs(value).toFixed(1)} years`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'maxPayback'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 2,
                description: 'Payback period exceeds maximum target'
            }
        ]
    },

    lcoe: {
        label: 'LCOE',
        format: 'currency',
        path: ['lcoe'],
        aggregation: 'value',
        units: '$/MWh',
        description: 'Levelized Cost of Energy',
        impactFormat: (value) => `$${Math.abs(value).toFixed(2)}/MWh`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'maxLCOE'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 3,
                description: 'LCOE exceeds maximum target'
            }
        ]
    },

    totalCashflow: {
        label: 'Total Cash Flow',
        format: 'currency',
        path: ['cashflow'],
        aggregation: 'sum',
        aggregationOptions: { filter: 'operational' },
        units: '$',
        description: 'Total operational cash flows',
        impactFormat: (value) => `$${(Math.abs(value) / 1000000).toFixed(1)}M`,
        thresholds: [] // No specific thresholds for total cashflow
    },

    breakEvenYear: {
        label: 'Break Even Year',
        format: 'years',
        path: ['breakEvenYear'],
        aggregation: 'value',
        units: 'years',
        description: 'Year when cumulative cash flow turns positive',
        impactFormat: (value) => `Year ${Math.abs(value).toFixed(0)}`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'maxBreakEven'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 2,
                description: 'Break-even year exceeds maximum target'
            }
        ]
    }
};

/**
 * Create metric selector options for UI components
 * @returns {Array} Options array for Select components
 */
export const createMetricSelectorOptions = () => {
    return Object.entries(SUPPORTED_METRICS).map(([key, config]) => ({
        value: key,
        label: config.label,
        description: config.description
    }));
};

/**
 * Extract metric value from calculation results
 * @param {Object} results - Calculation results
 * @param {string} targetMetric - Target metric key
 * @returns {number|null} Extracted value
 */
export const extractMetricValue = (results, targetMetric) => {
    const metricConfig = SUPPORTED_METRICS[targetMetric];
    if (!metricConfig || !results) return null;

    // Navigate the path to get the value
    let value = results;
    for (const pathSegment of metricConfig.path) {
        if (value && typeof value === 'object') {
            value = value[pathSegment];
        } else {
            return null;
        }
    }

    return typeof value === 'number' ? value : null;
};

/**
 * Evaluate metric thresholds for sensitivity analysis
 * Uses existing threshold evaluation pattern from TableConfiguration.js
 * @param {number} value - Metric value
 * @param {Object} metricConfig - Configuration from SUPPORTED_METRICS
 * @param {Function} getValueByPath - Function to get threshold values
 * @returns {Object|null} Style object with color and fontWeight
 */
export const evaluateMetricThresholds = (value, metricConfig, getValueByPath) => {
    if (!metricConfig.thresholds || metricConfig.thresholds.length === 0 || value == null) {
        return null;
    }

    // Convert to format expected by existing evaluateThresholds
    const evaluationThresholds = metricConfig.thresholds.map(threshold => {
        let thresholdValue;

        if (threshold.path) {
            const contextValue = getValueByPath(threshold.path);
            thresholdValue = threshold.transform ?
                threshold.transform(contextValue) : contextValue;
        } else {
            thresholdValue = threshold.threshold;
        }

        return {
            field: 'value',
            comparison: threshold.comparison,
            colorRule: (val) => threshold.colorRule(val, thresholdValue),
            priority: threshold.priority,
            description: threshold.description
        };
    });

    // Use existing pattern from TableConfiguration.js
    const evaluationData = { value: value };
    return evaluateThresholds(evaluationData, evaluationThresholds, value);
};
