// src/components/tables/shared/index.js - Shared table utilities exports

// Theme system
export { useTableTheme, generateTableStyles, applyThemeStyles } from './TableTheme';
export {
    BASE_TABLE_THEMES,
    createCustomTheme,
    getBaseTheme,
    THEME_NAMES
} from './TableThemes';

// Data operations
export {
    validateTableData,
    ensureUniqueKeys,
    transformTimeSeriesForTable,
    transformPercentileMapForTable,
    createYearColumn,
    createValueColumn,
    createPercentileColumns,
    formatValue,
    detectValueType,
    filterTableData,
    sortTableData
} from './TableDataOps';

// Validation utilities
export {
    validateCellValue,
    validateTableStructure,
    validatePercentageSum,
    validateUniqueYears
} from './TableValidation';

// Re-export everything for convenience
export * from './TableTheme';
export * from './TableThemes';
export * from './TableDataOps';
export * from './TableValidation';