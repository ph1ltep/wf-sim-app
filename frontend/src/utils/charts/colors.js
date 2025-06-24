// src/utils/charts/colors.js - Generic chart color utilities
import {
    blue, green, red, orange, purple, cyan, yellow, lime,
    magenta, volcano, geekblue, gold, grey
} from '@ant-design/colors';
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
 * Generate color palette using Ant Design colors
 * @param {number} count - Number of colors needed
 * @param {Object} options - Color options
 * @returns {Array} Array of hex color codes
 */
export const generateColorPalette = (count, options = {}) => {
    const {
        baseColors = [blue, green, orange, purple, cyan, red, yellow, magenta],
        shade = 5,
        includeVariations = false
    } = options;

    const colors = [];

    if (includeVariations && count > baseColors.length) {
        // Use multiple shades when we need more colors
        const shadesPerColor = Math.ceil(count / baseColors.length);
        const shadeRange = [3, 4, 5, 6, 7]; // Mid-range shades

        baseColors.forEach(colorPalette => {
            for (let i = 0; i < shadesPerColor && colors.length < count; i++) {
                const shadeIndex = shadeRange[i % shadeRange.length];
                colors.push(colorPalette[shadeIndex]);
            }
        });
    } else {
        // Use single shade from each color
        for (let i = 0; i < count; i++) {
            const colorPalette = baseColors[i % baseColors.length];
            colors.push(colorPalette[shade]);
        }
    }

    return colors.slice(0, count);
};

/**
 * Create theme-aware color with automatic shade adjustment
 * @param {string} baseColor - Base color name or Ant Design color array
 * @param {Object} token - Ant Design token
 * @param {Object} options - Color options
 * @returns {string} Theme-appropriate color
 */
export const createThemeAwareColor = (baseColor, token = null, options = {}) => {
    const { shade = 5, fallbackShade = 5 } = options;

    // If it's a token color, use it directly
    if (token && token[baseColor]) {
        return token[baseColor];
    }

    // If it's an Ant Design color array
    if (Array.isArray(baseColor)) {
        return baseColor[shade] || baseColor[fallbackShade];
    }

    // If it's a color name, try to map it to Ant Design colors
    const colorMap = {
        blue, green, red, orange, purple, cyan, yellow, lime,
        magenta, volcano, geekblue, gold, grey
    };

    const colorPalette = colorMap[baseColor];
    if (colorPalette) {
        return colorPalette[shade];
    }

    // Fallback to original color
    return baseColor;
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
 * Get semantic color using enhanced theme integration
 * @param {string} type - Data type or semantic meaning
 * @param {number} shade - Color shade (0-9, default 5 for primary)
 * @param {Object} token - Ant Design token (optional, for theme integration)
 * @returns {string} Hex color code
 */
export const getSemanticColor = (type, shade = 5, token = null) => {
    // Use token colors when available for better theme integration
    if (token) {
        switch (type) {
            case 'primary':
            case 'neutral':
                return token.colorPrimary;
            case 'positive':
            case 'success':
                return token.colorSuccess;
            case 'negative':
            case 'error':
                return token.colorError;
            case 'warning':
            case 'accent':
                return token.colorWarning;
            case 'info':
                return token.colorInfo;
            // Enhanced timeline marker support
            case 'development':
                return token.colorPrimary;
            case 'construction':
                return token.colorWarning;
            case 'operation':
                return token.colorSuccess;
            // Enhanced risk level support
            case 'low_risk':
                return token.colorSuccess;
            case 'medium_risk':
                return token.colorWarning;
            case 'high_risk':
                return token.colorError;
        }
    }

    // Fallback to @ant-design/colors palette with improved semantic meanings
    const semanticMap = {
        // UI semantics (core)
        positive: green[shade],      // Green - positive values
        negative: red[shade],        // Red - negative values  
        neutral: blue[shade],        // Blue - neutral values
        primary: grey[shade],        // Primary blue
        secondary: purple[shade],    // Purple - complementary
        accent: orange[shade],       // Orange - attention
        success: green[shade],       // Green - success state
        warning: orange[shade],      // Orange - warning state
        error: red[shade],           // Red - error state
        info: blue[shade],           // Blue - informational

        // Timeline markers (improved semantic meaning)
        development: blue[6],        // #1677ff - deeper blue for early phase
        construction: volcano[5],    // #fa541c - warm red-orange for activity
        operation: green[6],         // #389e0d - deeper green for steady state
        milestone: geekblue[5],      // #2f54eb - tech blue for milestones

        // Risk levels (enhanced gradation)
        low_risk: green[6],          // #389e0d - deeper green for confidence
        medium_risk: gold[5],        // #faad14 - gold for caution (more serious than orange)
        high_risk: red[6]            // #cf1322 - deeper red for serious risk
    };

    return semanticMap[type] || blue[shade];
};

/**
 * Get financial color scheme using Ant Design palette
 * @param {string} metricType - Type of financial metric
 * @param {number} shade - Color shade (0-9, default 5)
 * @param {Object} token - Ant Design token (optional)
 * @returns {string} Hex color code
 */
export const getFinancialColorScheme = (metricType) => {
    const financialMap = {
        // Cash flow components (distinct color families)
        revenue: green[7],           // #237804 - deep green (strong positive income)
        costs: red[6],               // #cf1322 - deep red (clearly negative outflow)
        cost: red[6],               // #cf1322 - deep red (clearly negative outflow)
        profit: blue[5],             // #1890ff - blue (analytical, net result)

        // Coverage ratios (blues with distinct shades for differentiation)
        dscr: blue[5],               // #1890ff - primary blue (main coverage metric)
        llcr: geekblue[5],           // #2f54eb - geek blue (loan life specific)
        icr: cyan[5],                // #13c2c2 - cyan (interest specific)

        // Returns (purples - sophisticated financial metrics)
        irr: purple[5],              // #722ed1 - royal purple (internal returns)
        npv: magenta[5],             // #eb2f96 - magenta (net present value)

        // Cash flow types (distinct cyan/teal family with clear separation)
        cashflow: cyan[4],           // #36cfc9 - light cyan (general cash flow)
        netCashflow: blue[4],        // #40a9ff - light blue (net result)
        operatingCashflow: cyan[5],  // #13c2c2 - standard cyan (operations)
        freeCashflow: cyan[7],       // #08979c - dark cyan (free cash to equity)

        // Financing (distinct warm colors)
        debt: volcano[6],            // #ad2102 - dark red-orange (debt burden)
        equity: lime[6],             // #7cb305 - lime green (equity/investor capital)

        // Risk metrics (orange/gold family)
        volatility: gold[6],         // #d48806 - deep gold (market volatility)
        correlation: orange[6],      // #d4380d - deep orange (correlation metrics)

        // Special categories (neutrals and indicators)
        breakeven: grey[5],          // #8c8c8c - neutral gray (zero line)
        threshold: red[5],           // #ff4d4f - standard red (limit/threshold)
        target: green[5],            // #52c41a - standard green (goal/target)
        covenant: red[7],            // #a8071a - very dark red (covenant breach)

        // Debt service components (warm red family for debt-related)
        debtService: volcano[5],     // #fa541c - warm red-orange (total debt service)
        principalPayment: volcano[6], // #ad2102 - darker (principal portion)
        interestPayment: volcano[4], // #ff7a45 - lighter (interest portion)

        // Additional financial concepts
        ebitda: gold[5],             // #faad14 - gold (earnings metric)
        wacc: purple[6],             // #531dab - dark purple (cost of capital)
        roe: lime[5],                // #a0d911 - bright lime (return on equity)
        roa: lime[7]                 // #5b8c00 - dark lime (return on assets)
    };

    return financialMap[metricType] || grey[6]; // Default fallback
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

/**
 * Generate world-class chart color palette using @ant-design/colors
 * Based on research from D3, Observable, Plotly, and data visualization best practices
 * Optimized for visual distinction, accessibility, and theme compatibility
 * 
 * @param {number} count - Number of colors needed (default 15, supports up to 20)
 * @returns {Array<string>} Array of hex color codes
 */
export const generateChartColorPalette = (count = 15) => {
    // Premium color sequence optimized for charts
    // Colors selected for maximum visual distinction and accessibility
    const chartColors = [
        // Primary blues - excellent for main data series
        blue[5],        // #1890ff (light) / #177ddc (dark) - Primary blue, high contrast
        blue[7],        // #096dd9 (light) / #1765ad (dark) - Deeper blue for variation

        // Greens - natural positive association  
        green[5],       // #52c41a (light) / #49aa19 (dark) - Success green
        green[7],       // #389e0d (light) / #2f7e0f (dark) - Forest green

        // Oranges/Reds - attention-grabbing, good for highlighting
        orange[5],      // #fa8c16 (light) / #d48806 (dark) - Vibrant orange
        red[5],         // #ff4d4f (light) / #dc4446 (dark) - Alert red

        // Purples - sophisticated, works well with blues
        purple[5],      // #722ed1 (light) / #642ab5 (dark) - Royal purple
        magenta[5],     // #eb2f96 (light) / #c41d7f (dark) - Magenta for contrast

        // Cyans/Teals - calming, good contrast with warm colors
        cyan[5],        // #13c2c2 (light) / #13a8a8 (dark) - Teal cyan
        geekblue[5],    // #2f54eb (light) / #2f54eb (dark) - Tech blue

        // Accent colors for additional series
        volcano[5],     // #fa541c (light) / #d4380d (dark) - Warm red-orange
        gold[5],        // #faad14 (light) / #d48806 (dark) - Golden yellow
        lime[5],        // #a0d911 (light) / #7cb305 (dark) - Lime green

        // Extended palette for 15+ series
        blue[3],        // #91d5ff (light) / #69c0ff (dark) - Light blue
        purple[7],      // #531dab (light) / #531dab (dark) - Deep purple

        // Additional colors for 16-20 series (darker shades for distinction)
        green[8],       // #237804 (light) / #237804 (dark) - Dark green
        orange[7],      // #d4380d (light) / #ad2102 (dark) - Dark orange  
        cyan[7],        // #08979c (light) / #08979c (dark) - Dark cyan
        magenta[7],     // #c41d7f (light) / #9e1068 (dark) - Dark magenta
        volcano[7]      // #d4380d (light) / #ad2102 (dark) - Dark volcano
    ];

    return chartColors.slice(0, Math.min(count, chartColors.length));
};

/**
 * Generate categorical color palette (alias for chart palette)
 * @param {number} count - Number of colors needed
 * @returns {Array<string>} Array of hex color codes
 */
export const generateCategoricalPalette = (count = 15) => {
    return generateChartColorPalette(count);
};

/**
 * Generate sequential color palette for heatmaps/gradients
 * @param {string} baseColor - Base color name ('blue', 'green', etc.)
 * @param {number} steps - Number of gradient steps (default 9)
 * @returns {Array<string>} Array of hex color codes from light to dark
 */
export const generateSequentialPalette = (baseColor = 'blue', steps = 9) => {
    const colorMap = {
        blue, green, red, orange, purple, cyan, yellow, lime,
        magenta, volcano, geekblue, gold, grey
    };

    const colors = colorMap[baseColor] || blue;

    if (steps <= 9) {
        return colors.slice(0, steps);
    }

    // For more than 9 steps, interpolate
    const result = [];
    for (let i = 0; i < steps; i++) {
        const index = Math.round((i / (steps - 1)) * 8); // Map to 0-8 range
        result.push(colors[Math.min(index, 8)]);
    }

    return result;
};

/**
 * Generate diverging color palette for data with meaningful center point
 * @param {number} steps - Number of steps (should be odd for true center)
 * @returns {Array<string>} Array from red through neutral to blue
 */
export const generateDivergingPalette = (steps = 9) => {
    const redSide = red.slice(0, Math.floor(steps / 2)).reverse();
    const blueSide = blue.slice(0, Math.floor(steps / 2));
    const center = steps % 2 === 1 ? [grey[2]] : []; // Light neutral center

    return [...redSide, ...center, ...blueSide];
};