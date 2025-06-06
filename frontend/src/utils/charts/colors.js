// src/utils/charts/colors.js - Generic chart color utilities

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color code
 * @returns {string} RGB values as "r, g, b"
 */
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '22, 119, 255'; // Default blue

    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ].join(', ');
};

/**
 * Generate color palette for charts
 * @param {number} count - Number of colors needed
 * @param {Object} options - Color options
 * @returns {Array} Array of hex color codes
 */
export const generateColorPalette = (count, options = {}) => {
    const {
        baseHue = 210, // Blue base
        saturation = 70,
        lightness = 50,
        variation = 30
    } = options;

    const colors = [];

    for (let i = 0; i < count; i++) {
        const hue = (baseHue + (i * variation)) % 360;
        const hsl = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        colors.push(hslToHex(hsl));
    }

    return colors;
};

/**
 * Convert HSL to hex color
 * @param {string} hsl - HSL color string
 * @returns {string} Hex color code
 */
const hslToHex = (hsl) => {
    const hslRegex = /hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/;
    const match = hsl.match(hslRegex);

    if (!match) return '#000000';

    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Get semantic color for data types
 * @param {string} type - Data type or semantic meaning
 * @returns {string} Hex color code
 */
export const getSemanticColor = (type) => {
    const colors = {
        // Financial semantics
        positive: '#52c41a',    // Green - positive values
        negative: '#ff4d4f',    // Red - negative values
        neutral: '#1890ff',     // Blue - neutral values

        // Chart element types
        primary: '#1890ff',     // Primary blue
        secondary: '#722ed1',   // Purple
        accent: '#faad14',      // Orange
        success: '#52c41a',     // Green
        warning: '#faad14',     // Orange
        error: '#ff4d4f',       // Red

        // Data categories
        revenue: '#52c41a',     // Green
        cost: '#ff4d4f',        // Red
        profit: '#1890ff',      // Blue
        debt: '#722ed1',        // Purple
        equity: '#13c2c2',      // Cyan

        // Timeline markers
        development: '#1677ff', // Blue
        construction: '#fa8c16', // Orange
        operation: '#52c41a',   // Green

        // Risk levels
        low_risk: '#52c41a',    // Green
        medium_risk: '#faad14', // Orange
        high_risk: '#ff4d4f'    // Red
    };

    return colors[type] || colors.neutral;
};

/**
 * Get financial color scheme for different metric types
 * @param {string} metricType - Type of financial metric
 * @returns {string} Hex color code
 */
export const getFinancialColorScheme = (metricType) => {
    const colors = {
        dscr: '#1890ff',      // Blue - primary coverage ratio
        llcr: '#52c41a',      // Green - loan life coverage
        icr: '#faad14',       // Orange - interest coverage
        irr: '#722ed1',       // Purple - returns
        npv: '#eb2f96',       // Pink - valuation
        cashflow: '#13c2c2',  // Cyan - cash flows
        debt: '#ff4d4f',      // Red - debt service
        equity: '#52c41a',    // Green - equity returns
        revenue: '#52c41a',   // Green - positive cash
        costs: '#ff4d4f'      // Red - negative cash
    };

    return colors[metricType] || '#666666';
};

/**
 * Create color with opacity
 * @param {string} color - Base color (hex)
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export const createColorWithOpacity = (color, opacity = 1) => {
    const rgb = hexToRgb(color);
    return `rgba(${rgb}, ${opacity})`;
};

/**
 * Lighten or darken a color
 * @param {string} color - Base color (hex)
 * @param {number} amount - Amount to lighten (positive) or darken (negative)
 * @returns {string} Modified hex color
 */
export const adjustColorBrightness = (color, amount) => {
    const rgb = hexToRgb(color).split(', ').map(Number);

    const adjusted = rgb.map(channel => {
        const newChannel = channel + amount;
        return Math.max(0, Math.min(255, newChannel));
    });

    const toHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${adjusted.map(toHex).join('')}`;
};