// frontend/src/utils/cashflow/metrics/registry.js - Updated with dynamic threshold system
import * as irrCalculations from './calculations/irr.js';
import * as npvCalculations from './calculations/npv.js';
import * as dscrCalculations from './calculations/dscr.js';
import * as lcoeCalculations from './calculations/lcoe.js';
import * as equityIrrCalculations from './calculations/equityIrr.js';
import * as llcrCalculations from './calculations/llcr.js';
import * as icrCalculations from './calculations/icr.js';
import * as paybackCalculations from './calculations/payback.js';
import { getFinancialColorScheme, getSemanticColor } from '../../charts/colors.js';

/**
 * Unified Cashflow Metrics Registry with dynamic threshold system
 */
export const CASHFLOW_METRICS_REGISTRY = {
    npv: {
        calculate: npvCalculations.calculateNPV,
        format: npvCalculations.formatNPV,
        formatImpact: npvCalculations.formatNPVImpact,
        thresholds: [
            {
                field: 'npv_positive',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('good') } :
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 },
                priority: 10,
                description: 'NPV positive/negative indicator'
            }
        ],
        metadata: {
            displayName: 'Net Present Value',
            displayUnits: 'USD',
            description: 'Present value of all future cash flows discounted at cost of equity',
            calculationMethod: 'DCF with project-specific discount rate'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 1,
        cubeConfig: {
            aggregation: {
                method: 'npv',
                options: { discountRate: 'auto', filter: 'all' }
            },
            dependsOn: ['netCashflow'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    irr: {
        calculate: irrCalculations.calculateIRR,
        format: irrCalculations.formatIRR,
        formatImpact: irrCalculations.formatIRRImpact,
        thresholds: [
            {
                field: 'target_irr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 8,
                description: 'Project IRR below target'
            },
            {
                field: 'target_irr_high',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'Project IRR significantly above target'
            }
        ],
        metadata: {
            displayName: 'Project IRR',
            displayUnits: '%',
            description: 'Internal rate of return for total project investment',
            calculationMethod: 'Newton-Raphson method on net cash flows'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity', 'comparative'],
        priority: 2,
        cubeConfig: {
            aggregation: {
                method: 'npv',
                options: { discountRate: 'irr_solve', filter: 'all' }
            },
            dependsOn: ['netCashflow'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    dscr: {
        calculate: dscrCalculations.calculateDSCR,
        format: dscrCalculations.formatDSCR,
        formatImpact: dscrCalculations.formatDSCRImpact,
        thresholds: [
            {
                field: 'covenantThreshold',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 10,
                description: 'DSCR below covenant threshold'
            }
        ],
        metadata: {
            displayName: 'Debt Service Coverage Ratio',
            displayUnits: 'x',
            description: 'Net operating cash flow divided by debt service payments',
            calculationMethod: 'Annual CFADS / Annual Debt Service'
        },
        category: 'risk',
        usage: ['financeability'],
        priority: 3,
        cubeConfig: {
            aggregation: {
                method: 'first',
                options: { filter: 'operational' }
            },
            dependsOn: ['netCashflow', 'debtService'],
            preCompute: false,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'time_series'
            }
        }
    },

    avgDscr: {
        calculate: dscrCalculations.calculateAvgDSCR,
        format: dscrCalculations.formatDSCR,
        formatImpact: dscrCalculations.formatDSCRImpact,
        thresholds: [
            {
                field: 'covenantThreshold',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 8,
                description: 'Average DSCR below covenant threshold'
            }
        ],
        metadata: {
            displayName: 'Average DSCR',
            displayUnits: 'x',
            description: 'Average debt service coverage ratio over operational period',
            calculationMethod: 'Mean of operational year DSCR values'
        },
        category: 'risk',
        usage: ['financeability', 'sensitivity'],
        priority: 4,
        cubeConfig: {
            aggregation: {
                method: 'mean',
                options: { filter: 'operational' }
            },
            dependsOn: ['netCashflow', 'debtService'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    minDscr: {
        calculate: dscrCalculations.calculateMinDSCR,
        format: dscrCalculations.formatDSCR,
        formatImpact: dscrCalculations.formatDSCRImpact,
        thresholds: [
            {
                field: 'covenantThreshold',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 10,
                description: 'Minimum DSCR below covenant threshold'
            }
        ],
        metadata: {
            displayName: 'Minimum DSCR',
            displayUnits: 'x',
            description: 'Minimum debt service coverage ratio over project life',
            calculationMethod: 'Minimum of all operational year DSCR values'
        },
        category: 'risk',
        usage: ['financeability', 'sensitivity'],
        priority: 5,
        cubeConfig: {
            aggregation: {
                method: 'min',
                options: { filter: 'operational' }
            },
            dependsOn: ['netCashflow', 'debtService'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    equityIrr: {
        calculate: equityIrrCalculations.calculateEquityIRR,
        format: equityIrrCalculations.formatEquityIRR,
        formatImpact: equityIrrCalculations.formatEquityIRRImpact,
        thresholds: [
            {
                field: 'target_equity_irr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 8,
                description: 'Equity IRR below target'
            },
            {
                field: 'target_equity_irr_high',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('excellent') } : null,
                priority: 5,
                description: 'Equity IRR significantly above target'
            }
        ],
        metadata: {
            displayName: 'Equity IRR',
            displayUnits: '%',
            description: 'Internal rate of return on equity investment',
            calculationMethod: 'IRR on equity cash flows (after debt service)'
        },
        category: 'financial',
        usage: ['financeability', 'sensitivity'],
        priority: 6,
        cubeConfig: {
            aggregation: {
                method: 'npv',
                options: { discountRate: 'irr_solve', filter: 'all' }
            },
            dependsOn: ['netCashflow', 'debtService', 'equityInvestment'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    llcr: {
        calculate: llcrCalculations.calculateLLCR,
        format: llcrCalculations.formatLLCR,
        formatImpact: llcrCalculations.formatLLCRImpact,
        thresholds: [
            {
                field: 'min_llcr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 7,
                description: 'LLCR below minimum threshold'
            }
        ],
        metadata: {
            displayName: 'Loan Life Coverage Ratio',
            displayUnits: 'x',
            description: 'NPV of cash flows available for debt service divided by outstanding debt',
            calculationMethod: 'NPV(CFADS) / Outstanding Debt Balance'
        },
        category: 'risk',
        usage: ['financeability'],
        priority: 7,
        cubeConfig: {
            aggregation: {
                method: 'npv',
                options: { discountRate: 'auto', filter: 'operational' }
            },
            dependsOn: ['netCashflow', 'outstandingDebt'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    icr: {
        calculate: icrCalculations.calculateICR,
        format: icrCalculations.formatICR,
        formatImpact: icrCalculations.formatICRImpact,
        thresholds: [
            {
                field: 'min_icr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 6,
                description: 'ICR below minimum threshold'
            }
        ],
        metadata: {
            displayName: 'Interest Coverage Ratio',
            displayUnits: 'x',
            description: 'Operating cash flow divided by interest payments',
            calculationMethod: 'EBITDA / Interest Payments'
        },
        category: 'risk',
        usage: ['financeability'],
        priority: 8,
        cubeConfig: {
            aggregation: {
                method: 'first',
                options: { filter: 'operational' }
            },
            dependsOn: ['netCashflow', 'interestPayments'],
            preCompute: false,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'time_series'
            }
        }
    },

    lcoe: {
        calculate: lcoeCalculations.calculateLCOE,
        format: lcoeCalculations.formatLCOE,
        formatImpact: lcoeCalculations.formatLCOEImpact,
        thresholds: [
            {
                field: 'max_lcoe',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 5,
                description: 'LCOE above maximum threshold'
            }
        ],
        metadata: {
            displayName: 'Levelized Cost of Energy',
            displayUnits: '$/MWh',
            description: 'Present value of costs divided by present value of energy production',
            calculationMethod: 'NPV(costs) / NPV(energy) with wind industry standards'
        },
        category: 'operational',
        usage: ['sensitivity', 'comparative'],
        priority: 9,
        cubeConfig: {
            aggregation: {
                method: 'npv',
                options: { discountRate: 'auto', filter: 'all' }
            },
            dependsOn: ['totalCosts', 'energyProduction'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    },

    paybackPeriod: {
        calculate: paybackCalculations.calculatePaybackPeriod,
        format: paybackCalculations.formatPaybackPeriod,
        formatImpact: paybackCalculations.formatPaybackImpact,
        thresholds: [
            {
                field: 'max_payback',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 4,
                description: 'Payback period exceeds maximum threshold'
            }
        ],
        metadata: {
            displayName: 'Payback Period',
            displayUnits: 'years',
            description: 'Time required to recover initial investment',
            calculationMethod: 'Years to cumulative positive cash flow'
        },
        category: 'financial',
        usage: ['sensitivity', 'comparative'],
        priority: 10,
        cubeConfig: {
            aggregation: {
                method: 'first',
                options: { filter: 'all' }
            },
            dependsOn: ['netCashflow'],
            preCompute: true,
            sensitivityRelevant: true,
            cubeMetadata: {
                timeSeriesRequired: true,
                percentileDependent: true,
                aggregatesTo: 'single_value'
            }
        }
    }
};

/**
 * Apply threshold evaluation to metric value
 * @param {number} value - Metric value to evaluate
 * @param {Array} thresholds - Array of threshold configurations
 * @param {Object} rowData - Row data containing threshold reference values
 * @returns {Object} Style object with color, fontWeight, etc.
 */
export const evaluateMetricThresholds = (value, thresholds, rowData) => {
    if (!thresholds || thresholds.length === 0 || value === null || value === undefined) {
        return {};
    }

    // Sort thresholds by priority (higher priority first)
    const sortedThresholds = [...thresholds].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const threshold of sortedThresholds) {
        const { field, comparison, colorRule } = threshold;

        if (!rowData || !rowData.hasOwnProperty(field)) {
            continue;
        }

        const thresholdValue = rowData[field];
        if (thresholdValue === null || thresholdValue === undefined) {
            continue;
        }

        let conditionMet = false;
        switch (comparison) {
            case 'below':
                conditionMet = value < thresholdValue;
                break;
            case 'above':
                conditionMet = value > thresholdValue;
                break;
            case 'equals':
                conditionMet = Math.abs(value - thresholdValue) < 0.001;
                break;
            default:
                console.warn(`Unknown comparison operator: ${comparison}`);
                continue;
        }

        if (conditionMet && typeof colorRule === 'function') {
            const result = colorRule(value, thresholdValue);
            if (result) {
                return result;
            }
        }
    }

    return {};
};

// Rest of the existing functions remain the same...
export const getMetricsByUsage = (usage) => {
    return Object.fromEntries(
        Object.entries(CASHFLOW_METRICS_REGISTRY)
            .filter(([_, config]) => config.usage.includes(usage))
    );
};

export const getAggregationStrategy = (metricKey) => {
    const config = CASHFLOW_METRICS_REGISTRY[metricKey];
    return config?.cubeConfig?.aggregation || null;
};

export const getMetricConfig = (metricKey) => {
    return CASHFLOW_METRICS_REGISTRY[metricKey] || null;
};

export const getMetricKeys = () => {
    return Object.entries(CASHFLOW_METRICS_REGISTRY)
        .sort(([, a], [, b]) => a.priority - b.priority)
        .map(([key, _]) => key);
};

export const migrateFromWindIndustryAggregations = (oldMetricKey) => {
    const strategy = getAggregationStrategy(oldMetricKey);
    if (!strategy) {
        console.warn(`No registry strategy found for metric: ${oldMetricKey}`);
        return null;
    }
    return strategy;
};