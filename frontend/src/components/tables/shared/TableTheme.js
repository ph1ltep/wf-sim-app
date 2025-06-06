// src/components/tables/shared/TableTheme.js - Theming utilities and hooks
import { theme } from 'antd';
import { BASE_TABLE_THEMES, getBaseTheme } from './TableThemes';

const { useToken } = theme;

/**
 * Hook to get table theme configuration and styling utilities
 * @param {string|Object} themeSource - Theme name from BASE_TABLE_THEMES or custom theme object
 * @returns {Object} Theme configuration and styling utilities
 */
export const useTableTheme = (themeSource = 'standard') => {
    const { token } = useToken();

    // Determine if themeSource is a theme name or theme object
    const themeConfig = typeof themeSource === 'string'
        ? getBaseTheme(themeSource)
        : themeSource;

    // Build dynamic styles with Ant Design tokens
    const getDynamicStyles = () => {
        const baseStyles = themeConfig.styles.container || {};

        // Inject Ant Design token values into styles
        const processedStyles = { ...baseStyles };

        // Add primary color variations for selection states
        const primaryColor = token.colorPrimary || '#1677ff';
        const primaryColorRgb = hexToRgb(primaryColor);

        return {
            ...processedStyles,
            // Override with token-based colors if needed
            '.selected-column-header': {
                backgroundColor: `rgba(${primaryColorRgb}, 0.15)`,
                borderColor: `rgba(${primaryColorRgb}, 0.4)`,
                ...themeConfig.styles.selectedColumnHeader
            },
            '.selected-column-cell': {
                backgroundColor: `rgba(${primaryColorRgb}, 0.08)`,
                ...themeConfig.styles.selectedColumn
            }
        };
    };

    return {
        theme: themeConfig,
        tableProps: themeConfig.table,
        styles: getDynamicStyles(),
        token,
        // Utility functions
        getSelectionStyle: (isSelected, isPrimary = false) => ({
            ...(isSelected && themeConfig.styles.selectedColumn),
            ...(isPrimary && { fontWeight: 600 })
        }),
        getHeaderStyle: (isSelected, isPrimary = false) => ({
            ...(isSelected && themeConfig.styles.selectedColumnHeader),
            ...(isPrimary && { fontWeight: 700 })
        })
    };
};

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color code
 * @returns {string} RGB values as "r, g, b"
 */
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '22, 119, 255'; // Default blue

    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ].join(', ');
};

/**
 * Generate CSS-in-JS styles for table container
 * @param {Object} styles - Style object from theme
 * @returns {Object} CSS-in-JS object
 */
export const generateTableStyles = (styles) => {
    const cssInJs = {};

    Object.entries(styles).forEach(([selector, rules]) => {
        if (selector.startsWith('.')) {
            // Convert CSS selector to CSS-in-JS format
            cssInJs[selector] = rules;
        } else {
            // Direct style properties
            Object.assign(cssInJs, { [selector]: rules });
        }
    });

    return cssInJs;
};

/**
 * Apply theme styles to a component using CSS-in-JS
 * @param {Object} themeConfig - Theme configuration object
 * @param {Object} token - Ant Design token object
 * @returns {Object} Styled JSX styles
 */
export const applyThemeStyles = (themeConfig, token) => {
    const containerStyles = themeConfig.styles.container || {};

    // Convert styles to CSS string for styled-jsx
    const cssRules = Object.entries(containerStyles)
        .map(([selector, rules]) => {
            const ruleString = Object.entries(rules)
                .map(([prop, value]) => `${prop}: ${value}`)
                .join('; ');
            return `${selector} { ${ruleString} }`;
        })
        .join('\n');

    return cssRules;
};