// src/utils/finance/analysis.js - Finance-specific analysis and risk assessment utilities

/**
 * Get bankability risk level based on breach probability and min DSCR
 * @param {number} breachProbability - Percentage probability of covenant breaches
 * @param {number} minDSCR - Minimum DSCR across scenarios
 * @returns {Object} Risk level and color
 */
export const getBankabilityRiskLevel = (breachProbability, minDSCR) => {
    let riskLevel = 'low';
    let riskColor = '#52c41a'; // Green

    if (breachProbability > 15 || minDSCR < 1.2) {
        riskLevel = 'high';
        riskColor = '#ff4d4f'; // Red
    } else if (breachProbability > 5 || minDSCR < 1.4) {
        riskLevel = 'medium';
        riskColor = '#faad14'; // Yellow
    }

    return { riskLevel, riskColor };
};

/**
 * Calculate covenant breach analysis for bankability assessment - Exclude construction years
 * @param {Object} financingData - Finance metrics data
 * @param {Object} confidenceIntervals - Calculated confidence intervals
 * @param {Array} availablePercentiles - Available percentiles from scenario
 * @returns {Object} Covenant analysis with risk assessment
 */
export const calculateCovenantAnalysis = (financingData, confidenceIntervals, availablePercentiles) => {
    let totalScenarios = 0;
    let scenariosWithBreaches = 0;
    let worstCaseBreaches = [];

    availablePercentiles.forEach(p => {
        const breaches = financingData.covenantBreaches.get(p);
        totalScenarios++;

        if (Array.isArray(breaches) && breaches.length > 0) {
            // FILTER OUT negative years (construction phase) and year 0
            const operationalBreaches = breaches.filter(breach => breach.year > 0);

            if (operationalBreaches.length > 0) {
                scenariosWithBreaches++;
                worstCaseBreaches = worstCaseBreaches.concat(operationalBreaches);
            }
        }
    });

    const breachProbability = totalScenarios > 0 ? (scenariosWithBreaches / totalScenarios) * 100 : 0;

    // Risk assessment based on min DSCR and breach probability
    const minPercentile = Math.min(...availablePercentiles);
    const minDSCR = confidenceIntervals?.minDSCR?.[`P${minPercentile}`] || financingData.covenantThreshold;

    const { riskLevel, riskColor } = getBankabilityRiskLevel(breachProbability, minDSCR);

    return {
        breachProbability: Math.round(breachProbability),
        totalBreachYears: worstCaseBreaches.length, // Now only counts operational years
        riskLevel,
        riskColor,
        threshold: financingData.covenantThreshold,
        percentileCount: availablePercentiles.length
    };
};

/**
 * Calculate confidence intervals for financial metrics using scenario percentiles
 * @param {Object} financingData - Finance metrics data
 * @param {Array} availablePercentiles - Available percentiles from scenario
 * @param {Object} selectedPercentiles - Selected percentile strategy
 * @returns {Object} Confidence intervals with percentile info
 */
export const calculateConfidenceIntervals = (financingData, availablePercentiles, selectedPercentiles) => {
    const primaryPercentile = selectedPercentiles?.unified || 50;

    // Use min/max from available percentiles, plus primary
    const minPercentile = Math.min(...availablePercentiles);
    const maxPercentile = Math.max(...availablePercentiles);
    const percentilesToUse = [minPercentile, primaryPercentile, maxPercentile];

    // Remove duplicates and sort
    const uniquePercentiles = [...new Set(percentilesToUse)].sort((a, b) => a - b);

    const intervals = {};

    // IRR intervals
    if (financingData.irr) {
        intervals.irr = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.irr.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // Equity IRR intervals
    if (financingData.equityIRR) {
        intervals.equityIRR = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.equityIRR.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // NPV intervals  
    if (financingData.npv) {
        intervals.npv = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.npv.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // LLCR intervals
    if (financingData.llcr) {
        intervals.llcr = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.llcr.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // Min DSCR intervals
    if (financingData.dscr) {
        intervals.minDSCR = uniquePercentiles.reduce((acc, p) => {
            const dscrData = financingData.dscr.get(p);
            if (Array.isArray(dscrData) && dscrData.length > 0) {
                const minValue = Math.min(...dscrData.map(d => d.value));
                acc[`P${p}`] = minValue;
            }
            return acc;
        }, {});
    }

    // Store percentile info for display
    intervals._percentileInfo = {
        min: minPercentile,
        primary: primaryPercentile,
        max: maxPercentile,
        all: uniquePercentiles
    };

    return intervals;
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
 * Assess project financeability based on key metrics
 * @param {Object} financialMetrics - Calculated financial metrics
 * @param {Object} thresholds - Financeability thresholds
 * @returns {Object} Financeability assessment
 */
export const assessProjectFinanceability = (financialMetrics, thresholds = {}) => {
    const {
        minDSCR = 1.3,
        minLLCR = 1.4,
        maxDebtRatio = 80,
        minProjectIRR = 8,
        minEquityIRR = 12
    } = thresholds;

    const assessment = {
        overall: 'pass',
        issues: [],
        warnings: [],
        strengths: []
    };

    // DSCR assessment
    if (financialMetrics.minDSCR < minDSCR) {
        assessment.issues.push(`Minimum DSCR (${financialMetrics.minDSCR.toFixed(2)}) below threshold (${minDSCR})`);
        assessment.overall = 'fail';
    } else if (financialMetrics.minDSCR < minDSCR + 0.2) {
        assessment.warnings.push(`Minimum DSCR (${financialMetrics.minDSCR.toFixed(2)}) close to threshold`);
    } else {
        assessment.strengths.push(`Strong DSCR coverage (${financialMetrics.minDSCR.toFixed(2)})`);
    }

    // LLCR assessment
    if (financialMetrics.llcr < minLLCR) {
        assessment.issues.push(`LLCR (${financialMetrics.llcr.toFixed(2)}) below threshold (${minLLCR})`);
        assessment.overall = 'fail';
    } else {
        assessment.strengths.push(`Adequate LLCR (${financialMetrics.llcr.toFixed(2)})`);
    }

    // IRR assessments
    if (financialMetrics.projectIRR < minProjectIRR) {
        assessment.warnings.push(`Project IRR (${financialMetrics.projectIRR.toFixed(1)}%) below target (${minProjectIRR}%)`);
    } else {
        assessment.strengths.push(`Strong project returns (${financialMetrics.projectIRR.toFixed(1)}% IRR)`);
    }

    if (financialMetrics.equityIRR < minEquityIRR) {
        assessment.warnings.push(`Equity IRR (${financialMetrics.equityIRR.toFixed(1)}%) below target (${minEquityIRR}%)`);
    } else {
        assessment.strengths.push(`Strong equity returns (${financialMetrics.equityIRR.toFixed(1)}% IRR)`);
    }

    // Overall assessment
    if (assessment.issues.length === 0 && assessment.warnings.length <= 1) {
        assessment.overall = 'strong';
    } else if (assessment.issues.length === 0) {
        assessment.overall = 'acceptable';
    }

    assessment.score = Math.max(0, 100 - (assessment.issues.length * 30) - (assessment.warnings.length * 10));

    return assessment;
};

/**
 * Create financing sensitivity analysis
 * @param {Object} baseScenario - Base scenario parameters
 * @param {Array} sensitivityParams - Parameters to vary
 * @param {Function} calculateMetrics - Function to calculate metrics
 * @returns {Object} Sensitivity analysis results
 */
export const createFinancingSensitivityAnalysis = (baseScenario, sensitivityParams, calculateMetrics) => {
    const results = {};

    sensitivityParams.forEach(param => {
        const { name, values, path } = param;
        results[name] = [];

        values.forEach(value => {
            // Create modified scenario
            const modifiedScenario = JSON.parse(JSON.stringify(baseScenario));
            setNestedValue(modifiedScenario, path, value);

            // Calculate metrics
            const metrics = calculateMetrics(modifiedScenario);

            results[name].push({
                parameterValue: value,
                metrics
            });
        });
    });

    return results;
};

/**
 * Helper function to set nested object values
 * @param {Object} obj - Object to modify
 * @param {Array} path - Path array
 * @param {any} value - Value to set
 */
const setNestedValue = (obj, path, value) => {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
};

/**
 * Generate financing recommendations based on analysis
 * @param {Object} financialMetrics - Financial metrics
 * @param {Object} covenantAnalysis - Covenant analysis
 * @param {Object} assessment - Financeability assessment
 * @returns {Array} Array of recommendation objects
 */
export const generateFinancingRecommendations = (financialMetrics, covenantAnalysis, assessment) => {
    const recommendations = [];

    // DSCR-based recommendations
    if (financialMetrics.minDSCR < 1.3) {
        recommendations.push({
            type: 'critical',
            category: 'debt_structure',
            title: 'Improve Debt Service Coverage',
            description: 'Consider reducing debt level, extending loan term, or incorporating a grace period to improve DSCR.',
            impact: 'high'
        });
    }

    // Breach probability recommendations
    if (covenantAnalysis.breachProbability > 10) {
        recommendations.push({
            type: 'warning',
            category: 'risk_management',
            title: 'High Covenant Breach Risk',
            description: 'Consider debt service reserves or lower leverage to reduce covenant breach probability.',
            impact: 'medium'
        });
    }

    // Return optimization
    if (financialMetrics.equityIRR < 12) {
        recommendations.push({
            type: 'opportunity',
            category: 'returns',
            title: 'Optimize Equity Returns',
            description: 'Evaluate opportunities to increase leverage or improve operational efficiency.',
            impact: 'medium'
        });
    }

    // Risk mitigation
    if (financialMetrics.llcr < 1.5) {
        recommendations.push({
            type: 'warning',
            category: 'debt_structure',
            title: 'Strengthen Loan Coverage',
            description: 'Consider improving cash flow profile or reducing total debt to enhance LLCR.',
            impact: 'medium'
        });
    }

    return recommendations;
};