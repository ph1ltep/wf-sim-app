// src/components/tables/shared/TableThemes.js - Theme definitions only

/**
 * Base table theme definitions - each theme provides complete styling configuration
 * These can be extended or modified by cards for specific use cases
 */
export const BASE_TABLE_THEMES = {
    // Standard Ant Design theme with minimal customization
    standard: {
        name: 'Standard',
        description: 'Default Ant Design table styling',
        table: {
            size: 'middle',
            bordered: false,
            pagination: false
        },
        styles: {
            // Minimal custom styles, rely on Ant Design defaults
            container: {},
            headerCell: {},
            bodyCell: {},
            selectedColumn: {},
            selectedColumnHeader: {},
            selectedRow: {}
        }
    },

    // Compact theme matching InlineEditTable/CapexDrawdownCard style
    compact: {
        name: 'Compact',
        description: 'Dense, space-efficient table for data entry',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        },
        styles: {
            container: {
                '.ant-table-thead > tr > th': {
                    padding: '4px 8px !important',
                    borderBottom: '1px solid #f0f0f0 !important',
                    backgroundColor: '#fafafa',
                    fontSize: '12px',
                    fontWeight: 600
                },
                '.ant-table-tbody > tr > td': {
                    padding: '6px 8px !important',
                    fontSize: '13px'
                },
                '.ant-table-thead > tr > th::before': {
                    display: 'none !important'
                },
                '.ant-table-container': {
                    borderTop: 'none !important'
                }
            },
            selectedColumn: {
                backgroundColor: 'rgba(22, 119, 255, 0.08)',
                borderLeft: '0px',
                borderRight: '0px'
            },
            selectedColumnHeader: {
                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                borderColor: 'rgba(22, 119, 255, 0.4)',
                borderWidth: '2px'
            }
        }
    },

    // Dense theme for metrics and financial data
    metrics: {
        name: 'Metrics',
        description: 'Optimized for numerical data and metrics display',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        },
        styles: {
            container: {
                '.ant-table-thead > tr > th': {
                    padding: '8px 12px !important',
                    backgroundColor: '#fafafa',
                    fontSize: '13px',
                    fontWeight: 600,
                    textAlign: 'center'
                },
                '.ant-table-tbody > tr > td': {
                    padding: '8px 12px !important',
                    fontSize: '14px',
                    textAlign: 'center'
                },
                '.ant-table-thead': {
                    backgroundColor: '#fafafa'
                }
            },
            selectedColumn: {
                backgroundColor: 'rgba(22, 119, 255, 0.08)',
                borderLeft: '0px',
                borderRight: '0px'
            },
            selectedColumnHeader: {
                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                borderColor: 'rgba(22, 119, 255, 0.4)',
                borderWidth: '2px'
            }
        }
    },

    // Timeline-specific theme for timeline markers and year displays
    timeline: {
        name: 'Timeline',
        description: 'Optimized for timeline data with year markers',
        table: {
            size: 'small',
            bordered: true,
            pagination: false
        },
        styles: {
            container: {
                '.ant-table-thead > tr > th': {
                    padding: '6px 8px !important',
                    backgroundColor: '#fafafa',
                    fontSize: '12px',
                    fontWeight: 600,
                    textAlign: 'center'
                },
                '.ant-table-tbody > tr > td': {
                    padding: '8px 10px !important',
                    fontSize: '13px'
                },
                // Timeline marker column styling
                '.timeline-marker-column': {
                    backgroundColor: 'rgba(250, 173, 20, 0.08)',
                    borderColor: 'rgba(250, 173, 20, 0.4)'
                }
            },
            selectedColumn: {
                backgroundColor: 'rgba(22, 119, 255, 0.08)',
                borderLeft: '0px',
                borderRight: '0px'
            },
            selectedColumnHeader: {
                backgroundColor: 'rgba(22, 119, 255, 0.15)',
                borderColor: 'rgba(22, 119, 255, 0.4)',
                borderWidth: '2px'
            }
        }
    }
};

/**
 * Create a custom theme by extending a base theme
 * @param {string} baseThemeName - Name of base theme to extend
 * @param {Object} overrides - Object with overrides for theme properties
 * @param {string} customName - Name for the custom theme
 * @returns {Object} New theme object
 */
export const createCustomTheme = (baseThemeName, overrides = {}, customName = 'Custom') => {
    const baseTheme = BASE_TABLE_THEMES[baseThemeName];
    if (!baseTheme) {
        console.warn(`Base theme '${baseThemeName}' not found, using 'standard'`);
        return createCustomTheme('standard', overrides, customName);
    }

    // Deep merge the base theme with overrides
    const customTheme = {
        name: customName,
        description: `Custom theme based on ${baseTheme.name}`,
        table: {
            ...baseTheme.table,
            ...overrides.table
        },
        styles: {
            container: {
                ...baseTheme.styles.container,
                ...overrides.styles?.container
            },
            headerCell: {
                ...baseTheme.styles.headerCell,
                ...overrides.styles?.headerCell
            },
            bodyCell: {
                ...baseTheme.styles.bodyCell,
                ...overrides.styles?.bodyCell
            },
            selectedColumn: {
                ...baseTheme.styles.selectedColumn,
                ...overrides.styles?.selectedColumn
            },
            selectedColumnHeader: {
                ...baseTheme.styles.selectedColumnHeader,
                ...overrides.styles?.selectedColumnHeader
            },
            selectedRow: {
                ...baseTheme.styles.selectedRow,
                ...overrides.styles?.selectedRow
            },
            // Allow additional custom style properties
            ...Object.fromEntries(
                Object.entries(overrides.styles || {}).filter(([key]) =>
                    !['container', 'headerCell', 'bodyCell', 'selectedColumn', 'selectedColumnHeader', 'selectedRow'].includes(key)
                )
            )
        }
    };

    return customTheme;
};

/**
 * Available base theme names for easy reference
 */
export const THEME_NAMES = Object.keys(BASE_TABLE_THEMES);

/**
 * Get base theme by name with fallback
 * @param {string} themeName - Theme name
 * @returns {Object} Theme configuration
 */
export const getBaseTheme = (themeName) => {
    return BASE_TABLE_THEMES[themeName] || BASE_TABLE_THEMES.standard;
};