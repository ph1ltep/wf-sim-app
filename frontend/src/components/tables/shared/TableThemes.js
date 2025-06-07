// src/components/tables/shared/TableThemes.js - Simple theme-specific overrides only
import { size } from 'lodash';
import { hexToRgb } from '../../../utils/charts/colors';

/**
 * Base table theme definitions - standardized classes, specific styling per theme
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
 * Create theme-specific CSS styles - each theme gets exactly what it needs
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
                // Let Ant Design handle everything else
            },
            // Selection states
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`
            },
            '.cell-primary': {
                fontWeight: 600
            },
            '.header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`
            },
            '.header-primary': {
                fontWeight: 700,
                color: primaryColor
            },
            '.header-clickable': {
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            },
            // Basic marker support
            '.marker-cell': {
                '--marker-color': primaryColor
            },
            '.marker-type-milestone': {
                borderLeft: '3px solid var(--marker-color)'
            }
        },

        // Compact theme - tight spacing, clear borders, edit-focused
        compact: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
                // Ant Design handles base table styling
            },
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
            },
            '.year-column': {
                textAlign: 'center',
                fontWeight: 500,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 5px',
                borderRadius: '4px',
                margin: '2px 0'
            },
            '.year-header': {
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '4px'
            },
            '.contract-name': {
                fontWeight: 500,
                padding: '4px 0'
            },
            '.year-label': {
                fontWeight: 600,
                fontSize: '13px'
            }
        },

        // Metrics theme - center-aligned, financial data optimized
        metrics: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
                // Ant Design handles base table styling
            },
            '.ant-table-thead > tr > th': {
                padding: '8px 4px',
                backgroundColor: '#fafafa',
                fontSize: '13px',
                fontWeight: 600,
                textAlign: 'center'
            },
            '.ant-table-tbody > tr > td': {
                padding: '8px 4px',
                fontSize: '14px',
                textAlign: 'center'
            },
            '.ant-table-thead': {
                backgroundColor: '#fafafa'
            },
            // Selection states for metrics (different style)
            '.cell-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`
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
                transition: 'all 0.2s ease'
            },
            // Marker support for metrics
            '.marker-cell': {
                '--marker-color': primaryColor
            },
            '.marker-type-milestone': {
                borderLeft: '3px solid var(--marker-color)'
            },
            '.metric-label': {
                fontWeight: 500,
                fontSize: '13px'
            },
            '.metric-label-content': {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap'
            },
            '.metric-label-text': {
                fontSize: '13px'
            },
            '.metric-tooltip-icon': {
                fontSize: '12px',
                color: '#999'
            },
            '.metric-value': {
                fontSize: '14px',
                lineHeight: '22px',
                fontWeight: 400,
                transition: 'all 0.2s ease'
            },
            '.metric-column-header': {
                textAlign: 'center',
                padding: '6px 5px',
                borderRadius: '4px'
            },
            '.metric-column-header-content': {
                fontSize: '13px'
            },
            '.primary-indicator': {
                fontSize: '9px',
                marginLeft: '4px',
                fontWeight: 600
            }
        },

        // Add this to the themeStyles object in createThemeStyles function
        timeline: {
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
                // Ant Design handles base table styling
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
            '.ant-table-thead': {
                backgroundColor: '#fafafa'
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
            // Enhanced marker support for timeline features
            '.marker-cell': {
                '--marker-color': primaryColor
            },
            '.marker-type-milestone': {
                borderLeft: '3px solid var(--marker-color)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 5%, transparent)'
            },
            '.marker-type-phase': {
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 8%, transparent)',
                borderTop: '2px solid color-mix(in srgb, var(--marker-color) 30%, transparent)',
                borderBottom: '1px solid color-mix(in srgb, var(--marker-color) 20%, transparent)'
            },
            '.marker-tag': {
                fontSize: '10px',
                lineHeight: '14px',
                margin: '0 2px',
                padding: '0 4px'
            },
            '.marker-type-event': {
                borderRadius: '4px',
                backgroundColor: 'color-mix(in srgb, var(--marker-color) 10%, transparent)'
            },
            // Timeline-specific marker classes (legacy support)
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
            '.year-column': {
                textAlign: 'center',
                fontWeight: 500,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 5px',
                borderRadius: '4px',
                margin: '2px 0'
            },
            '.year-header': {
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '4px'
            },
            '.year-label': {
                fontWeight: 600,
                fontSize: '13px'
            },
            '.contract-name': {
                fontWeight: 500,
                padding: '4px 0'
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