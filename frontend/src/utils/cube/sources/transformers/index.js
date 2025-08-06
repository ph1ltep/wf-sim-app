// frontend/src/utils/cube/sources/transformers/index.js

// Dynamic registry creation (optional - for runtime lookup)
import * as common from './common.js';
import * as financing from './financing.js';
import * as totals from './totals.js';
import * as cashflow from './cashflow.js';
import * as cost from './cost.js';
import * as drawdown from './drawdown.js';
import * as equipment from './equipment.js';

/**
 * Registry of all available transformer functions
 * Automatically includes all exports from transformer modules
 */
export const TRANSFORMER_REGISTRY = {
    ...common,
    ...financing,
    ...totals,
    ...cashflow
};

/**
 * Get transformer function by name
 * @param {string} transformerName - Name of the transformer
 * @returns {Function|null} Transformer function or null if not found
 */
export const getTransformer = (transformerName) => {
    return TRANSFORMER_REGISTRY[transformerName] || null;
};

/**
 * Validate transformer exists
 * @param {string} transformerName - Name of the transformer
 * @returns {boolean} True if transformer exists
 */
export const hasTransformer = (transformerName) => {
    return transformerName in TRANSFORMER_REGISTRY;
};

/**
 * Get list of available transformer names
 * @returns {string[]} Array of transformer names
 */
export const getAvailableTransformers = () => {
    return Object.keys(TRANSFORMER_REGISTRY);
};


// Re-export everything from all transformer modules
export * from './common.js';
export * from './financing.js';
export * from './totals.js';
export * from './cashflow.js';
export * from './cost.js';
export * from './drawdown.js';
export * from './equipment.js';