// src/components/tables/shared/TableThemes.js - v3.0 FINAL: Separate Class Definitions

import { min } from "lodash";

// Keep existing BASE_TABLE_THEMES configuration
export const BASE_TABLE_THEMES = {
    standard: {
        name: 'Standard',
        description: 'Clean styling close to Ant Design defaults',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: { size: 'middle', bordered: false }
    },
    compact: {
        name: 'Compact',
        description: 'Dense data entry and editing with clear boundaries',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: { size: 'small', bordered: true }
    },
    metrics: {
        name: 'Metrics',
        description: 'Financial and numerical data display with emphasis on hierarchy',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: { size: 'small', bordered: true }
    },
    timeline: {
        name: 'Timeline',
        description: 'Timeline data with construction phases and enhanced markers',
        containerClass: 'table-theme-container',
        tableClass: 'table-base',
        table: { size: 'small', bordered: true }
    }
};

/**
 * Create separate class definitions that get concatenated in HTML
 * Each class is defined independently - NO nested selectors
 * Hierarchy achieved through CSS specificity and source order
 * @param {string} themeName - Theme name
 * @param {Object} token - Ant Design token
 * @returns {Object} CSS-in-JS styles object with separate class definitions
 */
// src/components/tables/shared/TableThemes.js - v3.0 UPDATED: New content hierarchy + timeline column sizing

export const createThemeStyles = (themeName, token) => {
    const primaryColor = token?.colorPrimary || '#1677ff';
    const primaryColorActive = token?.colorPrimaryActive || '#16ccff';
    const primaryRgb = primaryColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '22, 119, 255';
    const primaryRgbActive = primaryColorActive.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') || '22, 119, 255';

    const themeStyles = {
        standard: {
            // Container classes
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },

            // Content hierarchy - minimal overrides
            '.content': {},
            '.content-cell': {},
            '.content-row': {},
            '.content-col': {},
            '.content-subheader': {
                fontWeight: 500,
                backgroundColor: '#f9f9f9'
            },
            '.content-header': {
                fontWeight: 600,
                backgroundColor: '#fafafa'
            },
            '.content-summary': {
                borderTop: '1px solid #d9d9d9',
                backgroundColor: '#fafafa'
            },
            '.content-totals': {
                borderLeft: '1px solid #d9d9d9',
                backgroundColor: '#fafafa'
            },

            // Marker classes
            '.marker-milestone': {
                borderLeft: '3px solid var(--marker-color, #52c41a)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color, #52c41a) 5%, transparent)'
            },

            // State classes
            '.state-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.06)`
            },
            '.state-primary': {
                color: primaryColor,
                fontWeight: 600
            },

            // State-position combinations
            '.state-header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                borderBottom: `2px solid rgba(${primaryRgb}, 0.3)`
            },
            '.state-header-primary': {
                color: primaryColor,
                fontWeight: 700
            },
            '.state-subheader-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`
            },
            '.state-summary-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`
            },
            '.state-totals-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`
            },

            // Content tag classes
            '.content-tag': {
                fontSize: '10px',
                lineHeight: '14px',
                margin: '0 2px',
                padding: '0 4px',
                borderRadius: '2px'
            }
        },

        compact: {
            // Container classes
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },

            // Content hierarchy - compact theme
            '.content': {
                fontSize: '13px',
                lineHeight: '18px'
            },
            '.content-cell': {
                padding: '4px 8px'
            },
            '.content-row': {},
            '.content-col': {},
            '.content-subheader': {
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: '#f5f5f5'
            },
            '.content-header': {
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#fafafa'
            },
            '.content-summary': {
                padding: '4px 8px',
                borderTop: '1px solid #d9d9d9',
                backgroundColor: '#f0f0f0'
            },
            '.content-totals': {
                padding: '4px 8px',
                borderLeft: '1px solid #d9d9d9',
                backgroundColor: '#f0f0f0'
            },

            // Marker classes
            '.marker-milestone': {
                borderLeft: '3px solid var(--marker-color, #52c41a)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color, #52c41a) 8%, transparent)'
            },

            // State classes
            '.state-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08)`,
                border: `1px solid rgba(${primaryRgb}, 0.25)`
            },
            '.state-primary': {
                color: primaryColor,
                fontWeight: 600
            },

            // State-position combinations
            '.state-header-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                borderBottom: `2px solid ${primaryColor}`
            },
            '.state-header-primary': {
                color: primaryColor,
                fontWeight: 700
            },
            '.state-subheader-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.12)`
            },

            // Content tag classes
            '.content-tag': {
                fontSize: '9px',
                lineHeight: '12px',
                margin: '0 1px',
                padding: '0 3px',
                borderRadius: '2px'
            }
        },

        metrics: {
            // Container classes
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },
            '.ant-table-tbody > tr:hover > td': {
                backgroundColor: 'color-mix(in srgb, currentColor 5%, var(--marker-color, transparent) 10%) !important'
            },
            '.ant-table-tbody > tr:hover > td.state-selected': {
                //backgroundColor: `rgba(${primaryRgb}, 0.08) !important`
            },
            // Content hierarchy - metrics theme
            '.content': {
                textAlign: 'center'
            },
            '.content-cell': {
                padding: '8px 10px'
            },
            '.content-row': {},
            '.content-col': {},
            '.content-subheader': {},
            '.content-header': {
                minWidth: '100px',
                padding: '8px 10px',
                fontWeight: 600,
                backgroundColor: '#fafafa'
            },
            '.content-header.marker-primary': {
                //borderBottom: '2px solid var(--marker-color, #52c41a)',
                //backgroundColor: 'color-mix(in srgb, var(--marker-color, #52c41a) 10%, transparent)',
            },
            // Marker classes
            '.marker-primary': {
                borderBottom: '2px solid var(--marker-color, #52c41a)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color, #52c41a) 5%, transparent)',
                position: 'relative'
            },
            // State classes
            '.state-selected': {
                //backgroundColor: `rgba(${primaryRgb}, 0.12)`,
                borderRadius: '4px'
            },
            // State-position combinations
            '.state-header-selected': {
                //backgroundColor: `rgba(${primaryRgb}, 0.12)`,
                borderRadius: '4px 4px 0 0',
                //boxShadow: `0 2px 0px rgba(${primaryRgbActive}, 0.2)`,
                boxShadow: `0px 2px 0px #ff0000`,
                borderBottom: `2px solid rgba(${primaryRgb}, 0.2)`
            },
            '.state-header-primary': {
                color: primaryColor,
                fontWeight: 700
            },

            // Content tag classes
            '.content-tag': {
                fontSize: '9px',
                lineHeight: '14px',
                margin: '0 2px',
                padding: '1px 4px',
                borderRadius: '6px',
                display: 'inline-block'
            }
        },

        timeline: {
            // Container classes
            '.table-theme-container': {
                position: 'relative',
                width: '100%'
            },
            '.table-base': {
                width: '100%'
            },
            '.ant-table-tbody > tr:hover > td': {
                backgroundColor: 'color-mix(in srgb, currentColor 5%, var(--marker-color, transparent)) !important'
            },
            '.ant-table-tbody > tr:hover > td.state-selected': {
                backgroundColor: `rgba(${primaryRgb}, 0.08) !important`
            },
            // Content hierarchy - timeline theme with column spreading
            '.content': {},
            '.content-cell': {},
            '.content-row': {},
            '.content-col': {},
            '.content-subheader': {
                fontWeight: 500,
            },
            '.content-header': {
                minWidth: '100px',
                padding: '8px 10px',
                fontWeight: 600,
                backgroundColor: '#fafafa'
            },
            '.content-header.marker-milestone': {
                borderBottom: '2px solid var(--marker-color, #52c41a)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color, #52c41a) 20%, transparent)',
            },

            // Enhanced marker classes
            '.marker-milestone': {
                borderBottom: '2px solid var(--marker-color, #52c41a)',
                backgroundColor: 'color-mix(in srgb, var(--marker-color, #52c41a) 10%, transparent)',
                position: 'relative'
            },
            '.content-inner': {},
            // Content tag classes
            '.content-tag': {
                fontSize: '9px',
                lineHeight: '14px',
                padding: '1px 4px',
                margin: '0 0 0 6px',
                borderRadius: '5px',
                display: 'inline-block'
            }
        }
    };

    const normalizedThemeName = themeName.toLowerCase();
    return themeStyles[normalizedThemeName] || themeStyles.standard;
};

// Keep existing utility functions unchanged
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

export const getBaseTheme = (themeName) => {
    return BASE_TABLE_THEMES[themeName] || BASE_TABLE_THEMES.standard;
};

export const THEME_NAMES = Object.keys(BASE_TABLE_THEMES);