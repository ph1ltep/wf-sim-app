// src/utils/cashflow/transformers/index.js - Updated transformer registry with new signatures
import { contractsToAnnualCosts } from './contractTransformer';
import { distributionToTimeSeries } from './distributionTransformer';
import { extractPercentileData, extractFixedData } from './simulationTransformer';
import {
    majorRepairsToAnnualCosts,
    fixedCostToTimeSeries,
    reserveFundsToProvision,
    capexDrawdownToAnnualCosts
} from './costTransformer';
import {
    debtDrawdownToAnnualCosts,
    interestDuringConstruction,
    operationalDebtService
} from './financingTransformer';

/**
 * Registry of available transformers with standardized signatures
 * All transformers now use: (dataSource, dataReferences, sourceConfig)
 * 
 * Where:
 * - dataSource: Primary data from sourceConfig.path
 * - dataReferences: {reference: {}, global: {}, context: {}}
 * - sourceConfig: Registry configuration object
 */
export const TRANSFORMER_REGISTRY = {
    'contractsToAnnualCosts': contractsToAnnualCosts,
    'contractsToAnnualCostsTotal': contractsToAnnualCosts, // Alias for clarity
    'distributionToTimeSeries': distributionToTimeSeries,
    'extractPercentileData': extractPercentileData,
    'extractFixedData': extractFixedData,
    'majorRepairsToAnnualCosts': majorRepairsToAnnualCosts,
    'fixedCostToTimeSeries': fixedCostToTimeSeries,
    'reserveFundsToProvision': reserveFundsToProvision,
    'capexDrawdownToAnnualCosts': capexDrawdownToAnnualCosts,
    'debtDrawdownToAnnualCosts': debtDrawdownToAnnualCosts,
    'interestDuringConstruction': interestDuringConstruction,
    'operationalDebtService': operationalDebtService
};

/**
 * Apply transformer to source data with new signature
 * @param {string} transformerName - Name of transformer function
 * @param {any} dataSource - Primary data from sourceConfig.path
 * @param {Object} dataReferences - Reference data: {reference: {}, global: {}, context: {}}
 * @param {Object} sourceConfig - Registry configuration object
 * @returns {Array} Transformed data as DataPointSchema array
 */
export const applyTransformer = (transformerName, dataSource, dataReferences, sourceConfig) => {
    const transformer = TRANSFORMER_REGISTRY[transformerName];

    if (!transformer) {
        console.warn(`Transformer '${transformerName}' not found`);
        return dataSource;
    }

    try {
        return transformer(dataSource, dataReferences, sourceConfig);
    } catch (error) {
        console.error(`Error applying transformer '${transformerName}':`, error);
        return dataSource;
    }
};

// Export individual transformers with updated signatures
export {
    contractsToAnnualCosts,
    distributionToTimeSeries,
    extractPercentileData,
    extractFixedData,
    majorRepairsToAnnualCosts,
    fixedCostToTimeSeries,
    reserveFundsToProvision,
    capexDrawdownToAnnualCosts,
    debtDrawdownToAnnualCosts,
    interestDuringConstruction,
    operationalDebtService
};