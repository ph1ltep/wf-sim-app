// frontend/src/utils/charts/sensitivity/index.js
// Main exports for sensitivity analysis charts

// Registry and validation
export {
    SENSITIVITY_CHART_TYPES,
    getOptimalChartType,
    getChartConfig,
    validateChartConfig,
    getSuitableChartTypes
} from './registry';

// Tornado chart
export {
    prepareTornadoChartData,
    createTornadoClickHandler
} from './tornado';

// Color utilities
export {
    generateSmartColors,
    getSensitivityColorPalette,
    generateHighlightOpacity,
    generateImpactColors
} from './colors';

// Common utilities
export {
    getBaseChartConfig,
    formatSensitivityData,
    generateSensitivityHoverTemplate,
    validateSensitivityData,
    calculateChartDimensions
} from './common';

// Future chart types (placeholder exports)
// export { prepareHeatmapChartData } from './heatmap';
// export { prepareScatterChartData } from './scatter';