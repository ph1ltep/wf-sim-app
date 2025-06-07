// src/components/tables/shared/TableThemes.js - Enhanced with consolidated classes
import { hexToRgb } from '../../../utils/charts/colors';

/**
 * Base table theme definitions
 */
export const BASE_TABLE_THEMES = {
    // Standard Ant Design theme with minimal customization
    standard: {
        name: 'Standard',
        description: 'Default Ant Design table styling',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: {
            size: 'middle',
            bordered: false,
            pagination: false
        }
    },

    // Compact theme for data entry and editing
    compact: {
        name: 'Compact',
        description: 'Dense, space-efficient table for data entry',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        }
    },

    // Metrics theme for financial data
    metrics: {
        name: 'Metrics',
        description: 'Optimized for numerical data and metrics display',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        }
    },

    // Timeline theme for project phases and milestones
    timeline: {
        name: 'Timeline',
        description: 'Optimized for timeline data with year markers and construction phases',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        }
    }
};

/**
 * Create theme-specific CSS styles - consolidated and enhanced
 */
export const createThemeStyles = (themeName, token) => {
    const primaryColor = token.colorPrimary || '#1677ff';
    const primaryRgb = hexToRgb(primaryColor);

    const themeStyles = {
        // Standard theme - minimal overrides, mostly Ant Design defaults
        standard: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },
            // Basic cell and header states
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderLeft: `2px solid rgba(${primaryRgb}, 0.6)`,
                borderRight: `2px solid rgba(${primaryRgb}, 0.6)`
            },
            '.cell-primary': {
                fontWeight: 600
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderColor: `rgba(${primaryRgb}, 0.4)`,
                borderWidth: '2px'
            },
            '.header-primary': {
                fontWeight: 700,
                color: primaryColor
            },
            '.header-clickable': {
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            },
            // Timeline classes - basic implementation
            '.timeline-cell': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                textAlign: 'center',
                fontWeight: 500,
                fontSize: '13px'
            },
            '.timeline-header': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px'
            },
            '.timeline-text': {
                fontWeight: 600,
                fontSize: '13px'
            },
            // Generic layout classes
            '.cell-icon': {
                fontSize: '12px',
                color: '#999'
            },
            '.cell-tag': {
                fontSize: '10px',
                lineHeight: '16px',
                margin: '0 2px'
            },
            '.cell-numerical': {
                fontSize: '14px',
                lineHeight: '22px',
                fontWeight: 400,
                textAlign: 'right'
            }
        },

        // Compact theme - tight spacing for data entry
        compact: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },
            '.ant-table-thead > tr > th': {
                padding: '4px 8px',
                backgroundColor: '#fafafa',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center'
            },
            '.ant-table-tbody > tr > td': {
                padding: '6px 8px',
                fontSize: '12px'
            },
            // Selection states for compact
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderLeft: `2px solid rgba(${primaryRgb}, 0.6)`,
                borderRight: `2px solid rgba(${primaryRgb}, 0.6)`
            },
            '.cell-primary': {
                fontWeight: 600
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderColor: `rgba(${primaryRgb}, 0.4)`,
                borderWidth: '2px'
            },
            '.header-primary': {
                fontWeight: 700,
                color: primaryColor
            },
            '.header-clickable': {
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            },
            // Timeline classes optimized for compact editing
            '.timeline-cell': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 5px',
                borderRadius: '4px',
                margin: '2px 0',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px'
            },
            '.timeline-header': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '4px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '12px'
            },
            '.timeline-text': {
                fontWeight: 600,
                fontSize: '13px'
            },
            // Generic layout classes - compact sizing
            '.cell-icon': {
                fontSize: '12px',
                color: '#999'
            },
            '.cell-tag': {
                fontSize: '9px',
                lineHeight: '14px',
                margin: '0 2px'
            },
            '.cell-numerical': {
                fontSize: '13px',
                lineHeight: '20px',
                fontWeight: 400,
                textAlign: 'center'
            },
            // Marker support for compact
            '.marker-cell': {
                '--marker-color': primaryColor
            },
            '.marker-type-milestone': {
                borderLeft: '3px solid var(--marker-color)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 5%, transparent)'
            },
            '.marker-type-phase': {
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 8%, transparent)',
                borderTop: '2px solid color-mix(in srgb, var(--marker-color) 30%, transparent)'
            }
        },

        // Metrics theme - center-aligned numerical display
        metrics: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },
            '.ant-table-thead > tr > th': {
                padding: '8px 10px',
                backgroundColor: '#fafafa',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center'
            },
            '.ant-table-tbody > tr > td': {
                padding: '10px 12px',
                fontSize: '13px',
                textAlign: 'center'
            },
            // Selection states for metrics - rounded styling
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderRadius: '4px'
            },
            '.cell-primary': {
                fontWeight: 600
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderRadius: '4px 4px 0 0',
                boxShadow: `0 2px 0px rgba(${primaryRgb}, 0.2)`
            },
            '.header-primary': {
                fontWeight: 700,
                color: primaryColor
            },
            '.header-clickable': {
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '6px 5px',
                borderRadius: '4px'
            },
            // Timeline classes for metrics - center-aligned
            '.timeline-cell': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '4px'
            },
            '.timeline-header': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '6px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '4px'
            },
            '.timeline-text': {
                fontWeight: 600,
                fontSize: '13px'
            },
            // Generic layout classes - metrics optimized
            '.cell-icon': {
                fontSize: '12px',
                color: '#999'
            },
            '.cell-tag': {
                fontSize: '10px',
                lineHeight: '16px',
                margin: '0 2px'
            },
            '.cell-numerical': {
                fontSize: '14px',
                lineHeight: '22px',
                fontWeight: 400,
                textAlign: 'center',
                transition: 'all 0.2s ease'
            },
            // Enhanced marker support for metrics
            '.marker-cell': {
                '--marker-color': primaryColor
            },
            '.marker-type-milestone': {
                borderLeft: '3px solid var(--marker-color)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 5%, transparent)'
            }
        },

        // Timeline theme - enhanced timeline marker support
        timeline: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },
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
            // Selection states for timeline
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                borderLeft: `2px solid rgba(${primaryRgb}, 0.6)`,
                borderRight: `2px solid rgba(${primaryRgb}, 0.6)`
            },
            '.cell-primary': {
                fontWeight: 600
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderColor: `rgba(${primaryRgb}, 0.4)`,
                borderWidth: '2px'
            },
            '.header-primary': {
                fontWeight: 700,
                color: primaryColor
            },
            '.header-clickable': {
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            },
            // Enhanced timeline classes
            '.timeline-cell': {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 5px',
                borderRadius: '4px',
                margin: '2px 0',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px'
            },
            '.timeline-header': {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '4px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '12px'
            },
            '.timeline-text': {
                fontWeight: 600,
                fontSize: '13px'
            },
            // Generic layout classes
            '.cell-icon': {
                fontSize: '12px',
                color: '#999'
            },
            '.cell-tag': {
                fontSize: '9px',
                lineHeight: '14px',
                margin: '0 2px'
            },
            '.cell-numerical': {
                fontSize: '13px',
                lineHeight: '20px',
                fontWeight: 400,
                textAlign: 'center'
            },
            // Enhanced marker support for timeline
            '.marker-cell': {
                '--marker-color': primaryColor
            },
            '.marker-type-milestone': {
                borderLeft: '3px solid var(--marker-color)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 5%, transparent)'
            },
            '.marker-type-phase': {
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 8%, transparent)',
                borderTop: '2px solid color-mix(in srgb, var(--marker-color) 30%, transparent)'
            },
            '.marker-type-construction': {
                backgroundColor: 'rgba(255, 59, 48, 0.05)',
                borderLeft: '3px solid #ff3b30'
            },
            '.timeline-marker-row': {
                backgroundColor: `rgba(${primaryRgb}, 0.02)`
            }
        }
    };

    const normalizedThemeName = themeName.toLowerCase();
    return themeStyles[normalizedThemeName] || themeStyles.standard;
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

    return {
        name: customName,
        description: `Custom theme based on ${baseTheme.name}`,
        containerClass: baseTheme.containerClass,
        tableClass: baseTheme.tableClass,
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