// utils/cube/sensitivity/transformers/index.js

// Dynamic registry creation for sensitivity transformer functions
import * as tornado from './tornado.js';
import * as correlation from './correlation.js';

/**
 * Registry of all available sensitivity transformer functions
 */
export const SENSITIVITY_TRANSFORMER_REGISTRY = {
    ...tornado,
    ...correlation
};

/**
 * Get sensitivity transformer function by name
 * @param {string} transformerName - Name of the transformer
 * @returns {Function|null} Transformer function or null if not found
 */
export const getSensitivityTransformer = (transformerName) => {
    return SENSITIVITY_TRANSFORMER_REGISTRY[transformerName] || null;
};

// Re-export everything from all transformer modules
export * from './tornado.js';
export * from './correlation.js';