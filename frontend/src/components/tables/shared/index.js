// src/components/tables/shared/index.js - Updated exports with split theme system

// Theme engine
export {
    useTableTheme,
    generateTableStyles,
    composeTheme
} from './TableThemeEngine';

// Theme definitions
export {
    BASE_TABLE_THEMES,
    createCustomTheme,
    getBaseTheme,
    THEME_NAMES
} from './TableThemes';

// Core data operations
export {
    validateTableData,
    ensureUniqueKeys,
    filterTableData,
    sortTableData
} from './TableDataOps';

// Time series operations
export {
    transformTimeSeriesForTable,
    transformPercentileMapForTable
} from './TimeSeriesOps';

// Column generators
export {
    createYearColumn,
    createValueColumn,
    createPercentileColumns
} from './ColumnGenerators';

// Formatting utilities
export {
    formatValue,
    detectValueType,
    formatProjectYear
} from './FormatUtils';

// Timeline utilities
export {
    getTimelineMarker,
    createTimelineYearColumn,
    applyTimelineMarkersToColumns
} from './TimelineUtils';

// Table configuration
export {
    generateTableConfiguration
} from './TableConfiguration';

// Validation utilities
export {
    validateCellValue,
    validateTableStructure,
    validatePercentageSum,
    validateUniqueYears,
    validateTimeSeriesStructure,
    validateYearRange,
    validateDataFieldOptions
} from './TableValidation';

// Re-export everything for convenience
export * from './TableThemeEngine';
export * from './TableThemes';
export * from './TableDataOps';
export * from './TimeSeriesOps';
export * from './ColumnGenerators';
export * from './FormatUtils';
export * from './TimelineUtils';
export * from './TableConfiguration';
export * from './TableValidation';