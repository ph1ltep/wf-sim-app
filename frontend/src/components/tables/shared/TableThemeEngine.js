// src/components/tables/shared/TableThemeEngine.js - Enhanced theme composition
import { theme } from 'antd';
import { objectToCss } from '../../../utils/tables/formatting';
import { BASE_TABLE_THEMES, createThemeStyles, getBaseTheme } from './TableThemes';

const { useToken } = theme;

/**
 * Hook to get table theme configuration with CSS-in-JS objects
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

        // Utility functions for dynamic styling
        getSelectionStyle: (isSelected, isPrimary = false) => {
            const style = {};

            if (isSelected && styles['.cell-selected']) {
                Object.assign(style, styles['.cell-selected']);
            }
            if (isPrimary && styles['.cell-primary']) {
                Object.assign(style, styles['.cell-primary']);
            }
            if (isPrimary && isSelected && styles['.cell-primary-selected']) {
                Object.assign(style, styles['.cell-primary-selected']);
            }

            return style;
        },

        getHeaderStyle: (isSelected, isPrimary = false) => {
            const style = {};

            if (isSelected && styles['.header-selected']) {
                Object.assign(style, styles['.header-selected']);
            }
            if (isPrimary && styles['.header-primary']) {
                Object.assign(style, styles['.header-primary']);
            }
            if (isPrimary && isSelected && styles['.header-primary-selected']) {
                Object.assign(style, styles['.header-primary-selected']);
            }

            return style;
        }
    };
};

/**
 * Enhanced theme composition with CSS-in-JS object support
 * @param {Object} baseTheme - Base theme object with styles
 * @param {Object} overrides - Override configuration
 * @returns {Object} Composed theme with merged styles
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
 * Merge multiple CSS-in-JS style objects
 * @param {...Object} styleObjects - Style objects to merge
 * @returns {Object} Merged style object
 */
export const mergeStyleObjects = (...styleObjects) => {
    const merged = {};

    styleObjects.forEach(styleObj => {
        if (!styleObj || typeof styleObj !== 'object') return;

        Object.keys(styleObj).forEach(selector => {
            if (merged[selector]) {
                // Merge properties for existing selectors
                merged[selector] = {
                    ...merged[selector],
                    ...styleObj[selector]
                };
            } else {
                // Add new selectors
                merged[selector] = { ...styleObj[selector] };
            }
        });
    });

    return merged;
};

/**
 * Validate theme configuration structure
 * @param {Object} themeConfig - Theme configuration to validate
 * @returns {Object} { isValid, errors, warnings }
 */
export const validateThemeConfig = (themeConfig) => {
    const errors = [];
    const warnings = [];

    if (!themeConfig || typeof themeConfig !== 'object') {
        errors.push('Theme configuration must be an object');
        return { isValid: false, errors, warnings };
    }

    // Required properties
    const requiredProps = ['name', 'containerClass', 'tableClass'];
    requiredProps.forEach(prop => {
        if (!themeConfig[prop]) {
            errors.push(`Missing required property: ${prop}`);
        }
    });

    // Validate table configuration
    if (themeConfig.table && typeof themeConfig.table !== 'object') {
        errors.push('Table configuration must be an object');
    }

    // Validate styles if present
    if (themeConfig.styles) {
        if (typeof themeConfig.styles !== 'object') {
            errors.push('Styles must be an object');
        } else {
            // Check for valid CSS selectors
            Object.keys(themeConfig.styles).forEach(selector => {
                if (!selector.startsWith('.') && !selector.startsWith('#') && !selector.includes(' ')) {
                    warnings.push(`Selector '${selector}' may not be a valid CSS selector`);
                }
            });
        }
    }

    // Validate class names
    if (themeConfig.containerClass && !/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(themeConfig.containerClass)) {
        warnings.push('Container class name should follow CSS class naming conventions');
    }

    if (themeConfig.tableClass && !/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(themeConfig.tableClass)) {
        warnings.push('Table class name should follow CSS class naming conventions');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Create theme debugging information
 * @param {Object} theme - Theme object to debug
 * @returns {Object} Debug information
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