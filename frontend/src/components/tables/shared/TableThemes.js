// src/components/tables/shared/TableThemes.js - CSS Classes + Theme Provider approach
/**
 * Base table theme definitions with CSS classes and rules
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
        },
        cssRules: `
            /* Minimal custom styles, rely on Ant Design defaults */
            .table-theme-standard {
                /* Container-level styles */
            }
        `
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
        },
        cssRules: `
            .table-theme-compact .ant-table-thead > tr > th {
                padding: 4px 8px;
                border-bottom: 1px solid #f0f0f0;
                background-color: #fafafa;
                font-size: 12px;
                font-weight: 600;
            }
            .table-theme-compact .ant-table-tbody > tr > td {
                padding: 6px 8px;
                font-size: 13px;
            }
            .table-theme-compact .ant-table-thead > tr > th::before {
                display: none;
            }
            .table-theme-compact .ant-table-container {
                border-top: none;
            }
            .table-theme-compact .ant-table-thead {
                background: #fafafa;
            }
        `
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
        },
        cssRules: `
            .table-theme-metrics .ant-table-thead > tr > th {
                padding: 8px 12px;
                background-color: #fafafa;
                font-size: 13px;
                font-weight: 600;
                text-align: center;
            }
            .table-theme-metrics .ant-table-tbody > tr > td {
                padding: 8px 12px;
                font-size: 14px;
                text-align: center;
            }
            .table-theme-metrics .ant-table-thead {
                background-color: #fafafa;
            }
            .table-theme-metrics .selected-column-cell {
                border-left: 4px solid var(--primary-color);
                border-right: 4px solid var(--primary-color);
        `
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
        },
        cssRules: `
            .table-theme-timeline .ant-table-thead > tr > th {
                padding: 6px 8px;
                background-color: #fafafa;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
            }
            .table-theme-timeline .ant-table-tbody > tr > td {
                padding: 8px 10px;
                font-size: 13px;
            }
            /* Timeline marker column styling - lower specificity allows onHeaderCell to override */
            .table-theme-timeline .timeline-marker-column {
                background-color: rgba(250, 173, 20, 0.08);
                border-color: rgba(250, 173, 20, 0.4);
            }
        `
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

    // Generate unique class names for custom theme
    const customContainerClass = `table-theme-${customName.toLowerCase().replace(/\s+/g, '-')}`;
    const customTableClass = `table-${customName.toLowerCase().replace(/\s+/g, '-')}`;

    // Merge CSS rules
    let customCssRules = baseTheme.cssRules;
    if (overrides.additionalCSS) {
        // Replace base class names with custom ones in additional CSS
        const additionalCSS = overrides.additionalCSS
            .replace(new RegExp(baseTheme.containerClass, 'g'), customContainerClass)
            .replace(new RegExp(baseTheme.tableClass, 'g'), customTableClass);

        customCssRules = `${baseTheme.cssRules}\n${additionalCSS}`;
    }

    return {
        name: customName,
        description: `Custom theme based on ${baseTheme.name}`,
        containerClass: customContainerClass,
        tableClass: customTableClass,
        table: {
            ...baseTheme.table,
            ...overrides.table
        },
        cssRules: customCssRules
    };
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