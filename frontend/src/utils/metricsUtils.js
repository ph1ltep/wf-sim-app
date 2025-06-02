// src/utils/metricsUtils.js

/**
 * Utility functions for calculating and managing project metrics
 * Designed to be expandable for future metric additions
 */

/**
 * Calculate Weighted Average Cost of Capital (WACC)
 * WACC = (E/V * Re) + ((D/V * Rd) * (1 - Tc))
 * Where:
 * E = Market value of equity, D = Market value of debt, V = E + D
 * Re = Cost of equity, Rd = Cost of debt, Tc = Tax rate
 * 
 * @param {Object} financingParams - Financing parameters from scenario
 * @param {Object} currencyParams - Currency parameters (optional, for future use)
 * @returns {number} WACC as percentage
 */
export const calculateWACC = (financingParams, currencyParams = null) => {
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
 * Calculate development start year relative to COD
 * @param {Object} windFarmParams - Wind farm parameters
 * @returns {number} Development start year relative to COD
 */
export const calculateDevelopmentStartYear = (windFarmParams) => {
    if (!windFarmParams) return -5;

    const { devDate, codDate } = windFarmParams;
    if (!devDate || !codDate) return -5;

    return devDate.getFullYear() - codDate.getFullYear();
};

/**
 * Calculate NTP year relative to COD
 * @param {Object} windFarmParams - Wind farm parameters
 * @returns {number} NTP year relative to COD
 */
export const calculateNtpYear = (windFarmParams) => {
    if (!windFarmParams) return -3;

    const { ntpDate, codDate } = windFarmParams;
    if (!ntpDate || !codDate) return -3;

    return ntpDate.getFullYear() - codDate.getFullYear();
};

/**
 * Calculate total CAPEX from construction cost sources
 * @param {Object} costParams - Cost module parameters
 * @returns {number} Total CAPEX amount
 */
export const calculateTotalCapex = (costParams) => {
    if (!costParams || !costParams.constructionPhase) return 0;

    const costSources = costParams.constructionPhase.costSources || [];
    return costSources.reduce((total, source) => total + (source.totalAmount || 0), 0);
};

/**
 * Calculate total project megawatts
 * @param {Object} windFarmParams - Wind farm parameters
 * @returns {number} Total MW capacity
 */
export const calculateTotalMW = (windFarmParams) => {
    if (!windFarmParams) return 0;

    const { numWTGs = 0, mwPerWTG = 0 } = windFarmParams;
    return numWTGs * mwPerWTG;
};

/**
 * Calculate Gross Annual Energy Production (AEP)
 * @param {Object} windFarmParams - Wind farm parameters
 * @returns {number} Gross AEP in MWh
 */
export const calculateGrossAEP = (windFarmParams) => {
    if (!windFarmParams) return 0;

    const totalMW = calculateTotalMW(windFarmParams);
    const { capacityFactor = 0 } = windFarmParams;

    return Math.round(totalMW * (capacityFactor / 100) * 8760);
};

/**
 * Calculate Net Annual Energy Production (AEP) after losses
 * @param {Object} windFarmParams - Wind farm parameters
 * @returns {number} Net AEP in MWh
 */
export const calculateNetAEP = (windFarmParams) => {
    if (!windFarmParams) return 0;

    const grossAEP = calculateGrossAEP(windFarmParams);
    const { curtailmentLosses = 0, electricalLosses = 0 } = windFarmParams;

    // Apply losses sequentially
    const afterCurtailment = grossAEP * (1 - curtailmentLosses / 100);
    const netAEP = afterCurtailment * (1 - electricalLosses / 100);

    return Math.round(netAEP);
};

/**
 * Calculate component quantities based on wind farm configuration
 * @param {Object} windFarmParams - Wind farm parameters
 * @returns {Object} Component quantities
 */
export const calculateComponentQuantities = (windFarmParams) => {
    if (!windFarmParams) return {};

    const { numWTGs = 0, wtgPlatformType = 'geared' } = windFarmParams;

    return {
        blades: numWTGs * 3,
        bladeBearings: numWTGs * 3,
        transformers: numWTGs,
        gearboxes: wtgPlatformType === 'geared' ? numWTGs : 0,
        generators: numWTGs,
        converters: numWTGs,
        mainBearings: numWTGs,
        yawSystems: numWTGs,
    };
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
 * Enhanced registry of all metric calculation functions with multiple dependencies and storage paths
 */
const METRIC_CALCULATORS = {
    wacc: {
        calculator: calculateWACC,
        dependencies: ['settings.modules.financing', 'settings.project.currency'],
        storePath: ['settings', 'metrics', 'wacc']
    },
    totalMW: {
        calculator: calculateTotalMW,
        dependencies: ['settings.project.windFarm'],
        storePath: ['settings', 'metrics', 'totalMW']
    },
    grossAEP: {
        calculator: calculateGrossAEP,
        dependencies: ['settings.project.windFarm'],
        storePath: ['settings', 'metrics', 'grossAEP']
    },
    netAEP: {
        calculator: calculateNetAEP,
        dependencies: ['settings.project.windFarm'],
        storePath: ['settings', 'metrics', 'netAEP']
    },
    componentQuantities: {
        calculator: calculateComponentQuantities,
        dependencies: ['settings.project.windFarm'],
        storePath: ['settings', 'metrics', 'componentQuantities']
    },
    debtToEquityRatio: {
        calculator: calculateDebtToEquityRatio,
        dependencies: ['settings.modules.financing'],
        storePath: ['settings', 'metrics', 'debtToEquityRatio']
    },
    developmentStartYear: {
        calculator: calculateDevelopmentStartYear,
        dependencies: ['settings.project.windFarm'],
        storePath: ['settings', 'metrics', 'developmentStartYear']
    },
    ntpYear: {
        calculator: calculateNtpYear,
        dependencies: ['settings.project.windFarm'],
        storePath: ['settings', 'metrics', 'ntpYear']
    },
    totalCapex: {
        calculator: calculateTotalCapex,
        dependencies: ['settings.modules.cost'],
        storePath: ['settings', 'metrics', 'totalCapex']
    }
};

// Global reference to ScenarioContext for when scenarioData is null
let _scenarioContext = null;

/**
 * Set the scenario context reference for use when scenarioData is null
 * This should be called by ScenarioContext during initialization
 * @param {Object} context - The scenario context object
 */
export const setScenarioContext = (context) => {
    _scenarioContext = context;
};

/**
 * Extract parameter values from scenario data based on dependency paths
 * @param {Array} dependencies - Array of dependency paths (e.g., ['settings.modules.financing', 'settings.project.windFarm'])
 * @param {Object} scenarioData - Scenario data object
 * @param {Object} prospectiveChanges - Pending changes to merge
 *   Format: { 'settings.modules.financing.debtRatio': 75, 'settings.project.windFarm.numWTGs': 25 }
 *   Note: Keys must be complete paths, values will be merged into dependency objects before calculation
 * @returns {Array} Array of parameter objects for the calculator
 */
const extractParameters = (dependencies, scenarioData, prospectiveChanges = {}) => {
    const parameters = [];

    dependencies.forEach(path => {
        const pathParts = path.split('.');
        let value = scenarioData;

        // Navigate to the dependency data
        for (const part of pathParts) {
            value = value?.[part];
        }

        // Clone the dependency object to avoid mutations
        let workingValue = value ? { ...value } : {};

        // Apply any prospective changes that affect this dependency
        Object.keys(prospectiveChanges).forEach(changeKey => {
            if (changeKey.startsWith(path + '.')) {
                const fieldPath = changeKey.replace(path + '.', '');
                workingValue[fieldPath] = prospectiveChanges[changeKey];
            }
        });

        parameters.push(workingValue);
    });

    return parameters;
};

/**
 * Calculate a specific metric with support for prospective state and context fallback
 * @param {string} metricName - Name of the metric to calculate
 * @param {Object|null} scenarioData - Scenario data (null to use context)
 * @param {Object} prospectiveChanges - Pending changes to apply before calculation
 *   DIRECT MODE: { 'settings.modules.financing.debtRatio': 75 }
 *   FORM MODE: { 'settings.modules.financing.debtRatio': 75, 'settings.modules.financing.costOfEquity': 8.5, ... }
 *   Note: In form mode, include ALL form fields so metrics calculate with complete prospective state
 * @returns {any} Calculated metric value
 */
export const calculateMetric = (metricName, scenarioData = null, prospectiveChanges = {}) => {
    const metricConfig = METRIC_CALCULATORS[metricName];
    if (!metricConfig) {
        console.warn(`Unknown metric: ${metricName}`);
        return null;
    }

    try {
        // Get scenario data from context if not provided
        let workingScenarioData = scenarioData;
        if (!workingScenarioData && _scenarioContext) {
            workingScenarioData = _scenarioContext.scenarioData;
        }

        if (!workingScenarioData) {
            console.warn(`No scenario data available for metric: ${metricName}`);
            return null;
        }

        // Extract parameters based on dependencies with prospective changes
        const parameters = extractParameters(
            metricConfig.dependencies,
            workingScenarioData,
            prospectiveChanges
        );

        // Call the calculator with extracted parameters
        return metricConfig.calculator(...parameters);
    } catch (error) {
        console.error(`Error calculating metric ${metricName}:`, error);
        return null;
    }
};

/**
 * Calculate multiple metrics and return as batch update object
 * @param {Array} metricNames - Array of metric names to calculate
 * @param {Object|null} scenarioData - Scenario data (null to use context)
 * @param {Object} prospectiveChanges - Pending changes to apply before calculation
 *   DIRECT MODE: { 'settings.modules.financing.debtRatio': 75 }
 *   FORM MODE: { 'settings.modules.financing.debtRatio': 75, 'settings.modules.financing.costOfEquity': 8.5, 'settings.project.windFarm.numWTGs': 30 }
 *   Note: Form mode should include ALL form field values for accurate metric calculation
 * @returns {Object} Batch update object with metric paths and values
 *   Returns: { 'settings.metrics.wacc': calculatedWACC, 'settings.metrics.totalMW': calculatedMW }
 */
export const calculateAffectedMetrics = (metricNames, scenarioData = null, prospectiveChanges = {}) => {
    if (!metricNames || metricNames.length === 0) return {};

    const updates = {};

    metricNames.forEach(metricName => {
        const metricConfig = METRIC_CALCULATORS[metricName];
        if (!metricConfig) {
            console.warn(`Unknown metric for batch calculation: ${metricName}`);
            return;
        }

        const calculatedValue = calculateMetric(metricName, scenarioData, prospectiveChanges);
        if (calculatedValue !== null) {
            const storePath = metricConfig.storePath.join('.');
            updates[storePath] = calculatedValue;
        }
    });

    return updates;
};

/**
 * Calculate all metrics and return them as an object
 * @param {Object|null} scenarioData - Scenario data (null to use context)
 * @param {Object} prospectiveChanges - Pending changes to apply before calculation
 *   Format: { 'settings.modules.financing.costOfEquity': 8.5, 'settings.project.windFarm.numWTGs': 30 }
 *   Note: In form mode, this should contain all form field values for comprehensive metric calculation
 * @returns {Object} All calculated metrics as batch update object
 *   Returns: { 'settings.metrics.wacc': value, 'settings.metrics.totalMW': value, ... }
 */
export const calculateAllMetrics = (scenarioData = null, prospectiveChanges = {}) => {
    const metricNames = Object.keys(METRIC_CALCULATORS);
    return calculateAffectedMetrics(metricNames, scenarioData, prospectiveChanges);
};

/**
 * Refresh all metrics in the scenario context using batch update
 * @param {Object|null} scenarioData - Current scenario data (null to use context)
 * @param {Function} updateByPath - Context update function
 * @returns {Object} Updated metrics object
 */
export const refreshAllMetrics = async (scenarioData = null, updateByPath) => {
    if (!updateByPath) {
        console.warn('Missing updateByPath function for metric refresh');
        return {};
    }

    try {
        // Calculate all metrics as batch update object
        const metricUpdates = calculateAllMetrics(scenarioData);

        if (Object.keys(metricUpdates).length === 0) {
            return {};
        }

        // Single batch updateByPath call
        const result = await updateByPath(metricUpdates);

        if (result.isValid) {
            console.log('Successfully refreshed metrics:', Object.keys(metricUpdates));
            return metricUpdates;
        } else {
            console.error('Failed to update metrics in context:', result.errors);
            return {};
        }
    } catch (error) {
        console.error('Error refreshing metrics:', error);
        return {};
    }
};

/**
 * Get list of available metrics
 * @returns {Array} Array of metric names
 */
export const getAvailableMetrics = () => {
    return Object.keys(METRIC_CALCULATORS);
};

/**
 * Get metric configuration including storage path
 * @param {string} metricName - Name of the metric
 * @returns {Object|null} Metric configuration or null if not found
 */
export const getMetricConfig = (metricName) => {
    return METRIC_CALCULATORS[metricName] || null;
};

/**
 * Add a new metric calculator (for future extensibility)
 * @param {string} name - Metric name
 * @param {Function} calculator - Calculator function
 * @param {Array} dependencies - Array of data paths this metric depends on
 * @param {Array} storePath - Path where the metric should be stored
 */
export const addMetricCalculator = (name, calculator, dependencies = [], storePath = []) => {
    METRIC_CALCULATORS[name] = {
        calculator,
        dependencies,
        storePath
    };
};