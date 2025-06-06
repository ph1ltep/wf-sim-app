// src/utils/tables/index.js - Generic table utilities exports

// Formatting utilities
export {
    formatTableValue,
    detectTableValueType,
    formatTableYear,
    formatConfidenceInterval,
    formatLargeNumber,
    formatDuration,
    formatPercentage
} from './formatting';

// Operation utilities
export {
    filterTableData,
    sortTableData,
    groupTableData,
    paginateTableData,
    calculateTableSummary,
    ensureUniqueTableKeys,
    transformToTreeData,
    flattenTreeData
} from './operations';

// Re-export everything for convenience
export * from './formatting';
export * from './operations';