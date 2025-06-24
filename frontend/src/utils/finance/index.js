// src/utils/finance/index.js - Finance domain utilities exports

// Calculation utilities
export {
    calculateNPV,
    calculateIRR,
    calculateICR,
    calculateAverageDSCR,
    calculateLLCR,
    calculateEquityIRR,
    calculateEquityInvestment,
    calculateWACC,
    calculateDebtToEquityRatio,
    calculateBreakEvenAnalysis,
    calculateFinancialMetrics
} from './calculations';

// Analysis utilities
export {
    getBankabilityRiskLevel,
    calculateCovenantAnalysis,
    calculateConfidenceIntervals,
    getCovenantStepDowns,
    assessProjectFinanceability,
    createFinancingSensitivityAnalysis,
    generateFinancingRecommendations
} from './analysis';

export {
    discoverPercentiles,
    getDefaultSensitivityRange,
    createPercentileOptions,
} from './percentileUtils';

export {
    calculateDynamicSensitivity,
    calculateMultiMetricSensitivity,
} from './sensitivityAnalysis';

export {
    SUPPORTED_METRICS,
    extractMetricValue,
    createMetricSelectorOptions,
} from './sensitivityMetrics';

// Re-export everything for convenience
export * from './calculations';
export * from './analysis';