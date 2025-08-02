// src/components/tables/shared/TableThemeEngine.js - v3.0 FIXED: Remove circular import
import { theme } from 'antd';
import { objectToCss } from '../../../utils/tables/formatting';
import { BASE_TABLE_THEMES, createThemeStyles, getBaseTheme } from './TableThemes';

const { useToken } = theme;

/**
 * Detect cell position based on indices and totals
 * PROPERLY CORRECTED: Real header vs subheader based on orientation
 */
export const detectCellPosition = (position, styleOptions = {}) => {
    const {
        rowIndex,
        colIndex,
        totalRows,
        totalCols,
        isHeaderRow,
        isHeaderCol,
        orientation
    } = position;

    // Ensure defaults for all styleOptions properties
    const {
        header = true,
        subHeader = true,
        summary = false,
        totals = false
    } = styleOptions;

    const isLastRow = rowIndex === totalRows - 1;
    const isLastCol = colIndex === totalCols - 1;

    const detected = {
        isCell: false,
        isHeader: false,
        isSubheader: false,
        isSummary: false,
        isTotals: false
    };

    // Header detection (if enabled)
    if (header && isHeaderRow) {
        detected.isHeader = true;
    }

    // Subheader detection (if enabled and not already a header)
    if (subHeader && !detected.isHeader && isHeaderCol) {
        detected.isSubheader = true;
    }

    // Summary and totals can only be applied if NOT a header or subheader
    if (!detected.isHeader && !detected.isSubheader) {
        // Summary detection (if enabled)
        if (summary) {
            if (orientation === 'horizontal' && isLastCol) detected.isSummary = true;
            if (orientation === 'vertical' && isLastRow) detected.isSummary = true;
        }

        // Totals detection (if enabled)
        if (totals) {
            if (orientation === 'horizontal' && isLastRow) detected.isTotals = true;
            if (orientation === 'vertical' && isLastCol) detected.isTotals = true;
        }
    }

    // isCell is true only if none of the special types are detected
    detected.isCell = !detected.isHeader && !detected.isSubheader && !detected.isSummary && !detected.isTotals;

    return detected;
};

/**
 * Generate content type classes with CORRECTED hierarchy
 * CORRECTED: subheader and header are mutually exclusive
 */
export const getContentClasses = (detected) => {
    const classes = ['content'];

    // Add cell/row/col classes
    classes.push('content-cell');

    if (detected.isHeader) classes.push('content-header');
    if (detected.isSubheader) classes.push('content-subheader');
    if (detected.isSummary) classes.push('content-summary');
    if (detected.isTotals) classes.push('content-totals');

    // Note: regular cells just get content-cell, content-row/col

    return classes;
};

/**
 * Generate row classes for <tr> elements
 */
export const getRowClasses = (orientation = 'horizontal') => {
    const classes = [];

    if (orientation === 'horizontal') {
        classes.push('content-row');
    }

    return classes.join(' ');
};

/**
 * Generate column classes for <col> elements  
 */
export const getColumnClasses = (orientation = 'horizontal') => {
    const classes = [];

    if (orientation === 'vertical') {
        classes.push('content-col');
    }

    return classes.join(' ');
};

/**
 * Generate marker classes - separate class names to be concatenated
 */
export const getMarkerClasses = (marker) => {
    if (!marker || !marker.type) return [];

    const classes = [`marker-${marker.type}`];

    if (marker.key) {
        classes.push(`marker-${marker.type}-${marker.key}`);
    }

    return classes;
};

/**
 * Generate state classes with CORRECTED position detection
 */
export const getStateClasses = (states = {}, position = {}) => {
    const classes = [];

    if (states.selected) {
        classes.push('state-selected');
        if (position.isHeader) classes.push('state-header-selected');
        if (position.isSubheader) classes.push('state-subheader-selected');
        if (position.isSummary) classes.push('state-summary-selected');
        if (position.isTotals) classes.push('state-totals-selected');
    }

    if (states.primary) {
        classes.push('state-primary');
        if (position.isHeader) classes.push('state-header-primary');
        if (position.isSubheader) classes.push('state-subheader-primary');
        if (position.isSummary) classes.push('state-summary-primary');
        if (position.isTotals) classes.push('state-totals-primary');
    }

    return classes;
};
/**
 * Master function: Generate complete cell classes as concatenated string
 */
export const getCellClasses = (config) => {
    const {
        position,
        states = {},
        marker = null,
        orientation = 'horizontal',
        styleOptions = {}
    } = config;


    // Ensure defaults for all styleOptions properties
    const completeStyleOptions = {
        header: true,
        subHeader: true,
        summary: false,
        totals: false,
        ...styleOptions
    };

    const detected = detectCellPosition(position, completeStyleOptions);

    // Use existing helper functions
    const contentClasses = getContentClasses(detected);
    const markerClasses = getMarkerClasses(marker);
    const stateClasses = getStateClasses(states, detected);

    // Combine all classes
    const classes = [
        ...contentClasses,
        ...markerClasses,
        ...stateClasses
    ].filter(Boolean);

    return classes.join(' ');
};

/**
 * Generate marker styles for CSS custom properties
 */
export const getMarkerStyles = (marker) => {
    if (!marker) return {};

    const styles = {};

    if (marker.color) {
        styles['--marker-color'] = marker.color;
    }

    return styles;
};

/**
 * Hook for table theme configuration with v3.0 class concatenation system
 */
export const useTableTheme = (themeSource = 'standard') => {
    const { token } = useToken();

    // Get base theme configuration
    const themeConfig = typeof themeSource === 'string'
        ? getBaseTheme(themeSource)
        : themeSource;

    // Create CSS-in-JS styles with token integration
    const styles = createThemeStyles(themeConfig.name, token);

    // Convert to CSS string for injection
    const cssRules = objectToCss(styles, themeConfig.containerClass);

    return {
        theme: themeConfig,
        styles,
        containerClass: themeConfig.containerClass,
        tableClass: themeConfig.tableClass,
        tableProps: themeConfig.table,
        cssRules,
        token,

        // v3.0 Class concatenation utilities
        getCellClasses,
        getStateClasses,
        getMarkerClasses,
        getMarkerStyles,
        detectCellPosition,
        getContentClasses
    };
};

/**
 * Merge CSS-in-JS style objects with deep merging for nested selectors
 */
const mergeStyleObjects = (base, override) => {
    const merged = { ...base };

    Object.keys(override).forEach(selector => {
        if (merged[selector] && typeof merged[selector] === 'object' && typeof override[selector] === 'object') {
            merged[selector] = { ...merged[selector], ...override[selector] };
        } else {
            merged[selector] = override[selector];
        }
    });

    return merged;
};

/**
 * Enhanced theme composition with CSS-in-JS object support
 * FIXED: Implement here instead of circular import
 */
export const composeTheme = (baseTheme, overrides = {}) => {
    try {
        // Validate base theme
        if (!baseTheme || typeof baseTheme !== 'object') {
            console.error('composeTheme: baseTheme must be a valid theme object');
            return baseTheme || {};
        }

        // Start with base theme styles
        let composedStyles = { ...baseTheme.styles };

        // Merge CSS-in-JS object overrides
        if (overrides.additionalStyles && typeof overrides.additionalStyles === 'object') {
            composedStyles = mergeStyleObjects(composedStyles, overrides.additionalStyles);
        }

        // Handle legacy string CSS conversion
        let additionalCssRules = '';
        if (overrides.additionalCSS && typeof overrides.additionalCSS === 'string') {
            additionalCssRules = overrides.additionalCSS;
        }

        // Compose container and table classes
        const containerClass = [
            baseTheme.containerClass,
            overrides.containerClass
        ].filter(Boolean).join(' ');

        const tableClass = [
            baseTheme.tableClass,
            overrides.tableClass
        ].filter(Boolean).join(' ');

        // Generate final CSS rules
        const baseCSS = objectToCss(composedStyles, baseTheme.containerClass);
        const finalCssRules = [baseCSS, additionalCssRules].filter(Boolean).join('\n\n');

        return {
            ...baseTheme,
            styles: composedStyles,
            containerClass,
            tableClass,
            cssRules: finalCssRules,
            table: {
                ...baseTheme.table,
                ...overrides.table
            },
            // Store override metadata for debugging
            _overrides: {
                hasAdditionalStyles: !!overrides.additionalStyles,
                hasAdditionalCSS: !!overrides.additionalCSS,
                hasContainerClass: !!overrides.containerClass,
                hasTableClass: !!overrides.tableClass
            }
        };
    } catch (error) {
        console.error('composeTheme: Error composing theme:', error);
        return baseTheme;
    }
};

/**
 * Validate theme configuration
 */
export const validateThemeConfig = (themeConfig) => {
    const errors = [];
    const warnings = [];

    if (!themeConfig) {
        errors.push('Theme configuration is required');
        return { isValid: false, errors, warnings };
    }

    // Required properties
    if (!themeConfig.name) errors.push('Theme name is required');
    if (!themeConfig.containerClass) errors.push('Container class is required');
    if (!themeConfig.tableClass) errors.push('Table class is required');

    // Type validation
    if (themeConfig.table && typeof themeConfig.table !== 'object') {
        errors.push('Table configuration must be an object');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Create theme debugging information
 */
export const createThemeDebugInfo = (theme) => {
    if (!theme) return { error: 'No theme provided' };

    return {
        name: theme.theme?.name || 'Unknown',
        containerClass: theme.containerClass,
        tableClass: theme.tableClass,
        hasStyles: !!theme.styles,
        styleSelectors: theme.styles ? Object.keys(theme.styles) : [],
        hasCssRules: !!theme.cssRules,
        cssRulesLength: theme.cssRules?.length || 0,
        overrides: theme._overrides || {},
        validation: validateThemeConfig(theme.theme || theme)
    };
};

/**
 * Generate theme-aware styles for external use
 */
export const generateTableStyles = (themeConfig) => {
    try {
        return {
            container: {
                className: themeConfig.containerClass
            },
            table: {
                className: themeConfig.tableClass,
                ...themeConfig.table
            }
        };
    } catch (error) {
        console.error('generateTableStyles: Error generating styles:', error);
        return {
            container: { className: '' },
            table: { className: '' }
        };
    }
};

/**
 * Utility for migrating from old class patterns to new concatenation system
 */
export const migrateToSemanticClasses = (oldConfig = {}) => {
    const {
        isSelected = false,
        isPrimary = false,
        marker = null,
        rowIndex = 0,
        colIndex = 0,
        totalRows = 1,
        totalCols = 1,
        isHeader = false
    } = oldConfig;

    return {
        position: {
            rowIndex,
            colIndex,
            totalRows,
            totalCols,
            isHeaderRow: isHeader,
            isHeaderCol: isHeader
        },
        states: {
            selected: isSelected,
            primary: isPrimary
        },
        marker
    };
};

/**
 * Debug function to verify position detection
 * Add this temporarily to debug subheader detection
 */
export const debugCellPosition = (position, orientation = 'horizontal') => {
    const detected = detectCellPosition({ ...position, orientation });
    const classes = getCellClasses({ position, orientation });

    console.log('=== CELL POSITION DEBUG ===');
    console.log('Input position:', position);
    console.log('Orientation:', orientation);
    console.log('Detected:', detected);
    console.log('Generated classes:', classes);
    console.log('==========================');

    return { detected, classes };
};