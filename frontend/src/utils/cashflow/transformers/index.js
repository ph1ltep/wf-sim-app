// src/utils/cashflow/transformers/index.js - Updated transformer registry
import { contractsToAnnualCosts } from './contractTransformer';
import { distributionToTimeSeries } from './distributionTransformer';
import { extractPercentileData, extractFixedData } from './simulationTransformer';
import {
    majorRepairsToAnnualCosts,
    fixedCostToTimeSeries,
    reserveFundsToProvision,
    capexDrawdownToAnnualCosts
} from './costTransformer';

/**
 * Registry of available transformers
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
    'capexDrawdownToAnnualCosts': capexDrawdownToAnnualCosts
};

/**
 * Apply transformer to source data
 */
export const applyTransformer = (transformerName, sourceData, sourceConfig, context) => {
    const transformer = TRANSFORMER_REGISTRY[transformerName];

    if (!transformer) {
        console.warn(`Transformer '${transformerName}' not found`);
        return sourceData;
    }

    try {
        return transformer(sourceData, sourceConfig, context);
    } catch (error) {
        console.error(`Error applying transformer '${transformerName}':`, error);
        return sourceData;
    }
};

export {
    contractsToAnnualCosts,
    distributionToTimeSeries,
    extractPercentileData,
    extractFixedData,
    majorRepairsToAnnualCosts,
    fixedCostToTimeSeries,
    reserveFundsToProvision,
    capexDrawdownToAnnualCosts
};