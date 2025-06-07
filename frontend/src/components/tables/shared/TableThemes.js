// src/components/tables/shared/TableThemes.js - Theme definitions and CSS-in-JS styles
import { hexToRgb } from '../../../utils/charts/colors';

/**
 * Base table theme definitions
 */
export const BASE_TABLE_THEMES = {
    // Standard Ant Design theme with minimal customization
    standard: {
        name: 'Standard',
        description: 'Default Ant Design table styling',
        containerClass: 'table-theme-standard',
        tableClass: 'table-standard',
        table: {
            size: 'middle',
            bordered: false,
            pagination: false
        }
    },

    // Compact theme matching InlineEditTable/CapexDrawdownCard style
    compact: {
        name: 'Compact',
        description: 'Dense, space-efficient table for data entry',
        containerClass: 'table-theme-compact',
        tableClass: 'table-compact',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        }
    },

    // Dense theme for metrics and financial data
    metrics: {
        name: 'Metrics',
        description: 'Optimized for numerical data and metrics display',
        containerClass: 'table-theme-metrics',
        tableClass: 'table-metrics',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        }
    },

    // Timeline-specific theme for timeline markers and year displays
    timeline: {
        name: 'Timeline',
        description: 'Optimized for timeline data with year markers',
        containerClass: 'table-theme-timeline',
        tableClass: 'table-timeline',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        }
    }
};

/**
 * Create CSS-in-JS styles based on theme name and tokens
 */
export const createThemeStyles = (themeName, token) => {
    console.log('🎨 Creating theme styles for:', themeName, 'with token:', token);

    const primaryColor = token.colorPrimary || '#1677ff';
    const primaryRgb = hexToRgb(primaryColor);

    console.log('🎨 Primary color:', primaryColor, 'RGB:', primaryRgb);

    const baseStyles = {
        // Standard theme - minimal overrides
        standard: {},

        // Compact theme - dense data entry
        compact: {
            '.ant-table-thead > tr > th': {
                padding: '4px 8px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                fontSize: '12px',
                fontWeight: 600
            },
            '.ant-table-tbody > tr > td': {
                padding: '6px 8px',
                fontSize: '13px'
            },
            '.ant-table-thead > tr > th::before': {
                display: 'none'
            },
            '.ant-table-container': {
                borderTop: 'none'
            },
            '.ant-table-thead': {
                background: '#fafafa'
            },
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderLeft: `2px solid rgba(${primaryRgb}, 0.6)`,
                borderRight: `2px solid rgba(${primaryRgb}, 0.6)`
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderColor: `rgba(${primaryRgb}, 0.4)`,
                borderWidth: '2px'
            }
        },

        // Metrics theme - financial data display
        metrics: {
            '.ant-table-thead > tr > th': {
                padding: '0px 0px',
                backgroundColor: '#fafafa',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center'
            },
            '.ant-table-tbody > tr > td': {
                backgroundColor: '#fafafa',
                padding: '0px 0px',
                fontSize: '14px',
                textAlign: 'center'
            },
            '.ant-table-thead': {
                backgroundColor: '#fafafa'
            },
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderLeft: `0px solid rgba(${primaryRgb}, 0.6)`,
                borderRight: `0px solid rgba(${primaryRgb}, 0.6)`
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                border: `0px solid rgba(${primaryRgb}, 0.6)`,
                borderRadius: '4px 4px 0 0',
                boxShadow: `0 2px 0px rgba(${primaryRgb}, 0.2)`
            },
            '.cell-primary': {
                fontWeight: 600
            },
            '.header-primary': {
                fontWeight: 700,
                color: primaryColor
            },
            '.cell-primary-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.12)`,
                fontWeight: 600
            },
            '.header-primary-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.2)`,
                border: `0px solid ${primaryColor}`,
                fontWeight: 700,
                color: primaryColor
            }
        },

        // Timeline theme - timeline data with markers  
        timeline: {
            '.ant-table-thead > tr > th': {
                padding: '6px 8px',
                backgroundColor: '#fafafa',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center'
            },
            '.ant-table-tbody > tr > td': {
                padding: '8px 10px',
                fontSize: '13px'
            },
            '.timeline-marker-column': {
                backgroundColor: 'rgba(250, 173, 20, 0.08)',
                borderColor: 'rgba(250, 173, 20, 0.4)'
            },
            '.timeline-marker-row': {
                position: 'relative',
                transition: 'all 0.2s ease'
            },
            '.timeline-marker-cod': {
                backgroundColor: 'rgba(52, 199, 89, 0.05)',
                borderLeft: '3px solid #34c759'
            },
            '.timeline-marker-ntp': {
                backgroundColor: 'rgba(255, 149, 0, 0.05)',
                borderLeft: '3px solid #ff9500'
            },
            '.timeline-marker-dev': {
                backgroundColor: 'rgba(0, 122, 255, 0.05)',
                borderLeft: '3px solid #007aff'
            },
            '.timeline-marker-construction': {
                backgroundColor: 'rgba(255, 59, 48, 0.05)',
                borderLeft: '3px solid #ff3b30'
            },
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderLeft: `2px solid rgba(${primaryRgb}, 0.6)`,
                borderRight: `2px solid rgba(${primaryRgb}, 0.6)`
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderColor: `rgba(${primaryRgb}, 0.4)`,
                borderWidth: '2px'
            }
        }
    };

    // FIX: Normalize theme name to lowercase for lookup
    const normalizedThemeName = themeName.toLowerCase();
    const styles = baseStyles[normalizedThemeName] || baseStyles.standard;

    console.log('🎨 Normalized theme name:', normalizedThemeName);
    console.log('🎨 Generated styles:', styles);

    return styles;
};

/**
 * Create a custom theme by extending a base theme
 */
export const createCustomTheme = (baseThemeName, overrides = {}, customName = 'Custom') => {
    const baseTheme = BASE_TABLE_THEMES[baseThemeName];
    if (!baseTheme) {
        console.warn(`Base theme '${baseThemeName}' not found, using 'standard'`);
        return createCustomTheme('standard', overrides, customName);
    }

    const customContainerClass = `table-theme-${customName.toLowerCase().replace(/\s+/g, '-')}`;
    const customTableClass = `table-${customName.toLowerCase().replace(/\s+/g, '-')}`;

    return {
        name: customName,
        description: `Custom theme based on ${baseTheme.name}`,
        containerClass: customContainerClass,
        tableClass: customTableClass,
        table: {
            ...baseTheme.table,
            ...overrides.table
        }
    };
};

/**
 * Get base theme by name with fallback
 */
export const getBaseTheme = (themeName) => {
    return BASE_TABLE_THEMES[themeName] || BASE_TABLE_THEMES.standard;
};

/**
 * Available base theme names for easy reference
 */
export const THEME_NAMES = Object.keys(BASE_TABLE_THEMES);