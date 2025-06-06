// src/utils/charts/index.js - Generic chart utilities exports

// Color utilities
export {
    hexToRgb,
    generateColorPalette,
    getSemanticColor,
    createColorWithOpacity,
    adjustColorBrightness
} from './colors';

// Annotation utilities
export {
    addRefinancingAnnotations,
    addCovenantAnnotations,
    addTimelineMilestones,
    addRangeHighlight,
    addBreakEvenAnnotation,
    addBenchmarkBands
} from './annotations';

// Re-export everything for convenience
export * from './colors';
export * from './annotations';