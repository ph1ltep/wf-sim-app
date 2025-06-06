// src/components/tables/shared/TableTheme.js - Simplified CSS classes approach
import { theme } from 'antd';
import { BASE_TABLE_THEMES, getBaseTheme } from './TableThemes';

const { useToken } = theme;

/**
 * Hook to get table theme configuration with CSS classes
 * @param {string|Object} themeSource - Theme name from BASE_TABLE_THEMES or custom theme object
 * @returns {Object} Theme configuration with CSS classes and utilities
 */
export const useTableTheme = (themeSource = 'standard') => {
    const { token } = useToken();

    // Determine if themeSource is a theme name or theme object
    const themeConfig = typeof themeSource === 'string'
        ? getBaseTheme(themeSource)
        : themeSource;

    // Inject Ant Design token values into CSS rules if needed
    const processedCssRules = themeConfig.cssRules.replace(
        /var\(--primary-color\)/g,
        token.colorPrimary || '#1677ff'
    );

    return {
        theme: themeConfig,
        containerClass: themeConfig.containerClass,
        tableClass: themeConfig.tableClass,
        tableProps: themeConfig.table,
        cssRules: processedCssRules,
        token,

        // Utility functions for dynamic styling
        getSelectionStyle: (isSelected, isPrimary = false) => {
            const primaryColor = token.colorPrimary || '#1677ff';
            return {
                ...(isSelected && {
                    backgroundColor: `rgba(${hexToRgb(primaryColor)}, 0.08)`,
                    borderLeft: '0px',
                    borderRight: '0px'
                }),
                ...(isPrimary && { fontWeight: 600 })
            };
        },

        getHeaderStyle: (isSelected, isPrimary = false) => {
            const primaryColor = token.colorPrimary || '#1677ff';
            return {
                ...(isSelected && {
                    backgroundColor: `rgba(${hexToRgb(primaryColor)}, 0.15)`,
                    borderColor: `rgba(${hexToRgb(primaryColor)}, 0.4)`,
                    borderWidth: '2px'
                }),
                ...(isPrimary && { fontWeight: 700 })
            };
        }
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
 * Compose multiple themes together (for card-level overrides)
 * @param {Object} baseTheme - Base theme object
 * @param {Object} overrides - Override styles and classes
 * @returns {Object} Composed theme
 */
export const composeTheme = (baseTheme, overrides = {}) => {
    return {
        ...baseTheme,
        containerClass: `${baseTheme.containerClass} ${overrides.containerClass || ''}`.trim(),
        tableClass: `${baseTheme.tableClass} ${overrides.tableClass || ''}`.trim(),
        cssRules: `${baseTheme.cssRules}\n${overrides.additionalCSS || ''}`,
        table: {
            ...baseTheme.table,
            ...overrides.table
        }
    };
};

/**
 * Generate theme-aware styles for external use
 * @param {Object} themeConfig - Theme configuration object
 * @returns {Object} Style utilities
 */
export const generateTableStyles = (themeConfig) => {
    return {
        container: {
            className: themeConfig.containerClass
        },
        table: {
            className: themeConfig.tableClass,
            ...themeConfig.table
        }
    };
};