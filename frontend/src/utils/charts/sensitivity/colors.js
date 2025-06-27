// frontend/src/utils/charts/sensitivity/colors.js
// Smart coloring logic for sensitivity analysis charts

import { getSemanticColor, generateChartColorPalette, getCategoryColorScheme } from '../colors';

/**
 * Generate smart colors for sensitivity chart based on variable count and categories
 * @param {Array} sensitivityResults - Sensitivity analysis results
 * @param {string} highlightedDriver - Driver ID to highlight
 * @returns {Array} Array of colors for each variable
 */
export const generateSmartColors = (sensitivityResults, highlightedDriver) => {
    if (!sensitivityResults || !sensitivityResults.length) return [];

    const variableCount = sensitivityResults.length;

    return sensitivityResults.map(result => {
        // ✅ FIXED: Use result.id instead of result.variableId
        if (result.id === highlightedDriver) {
            return getSemanticColor('primary', 7);
        }

        // For 8 or fewer variables, use category-based colors
        if (variableCount <= 8) {
            // ✅ FIXED: Use result.category instead of result.variableType
            return getCategoryColorScheme(result.category);
        }

        // For more than 8 variables, use generated palette
        const palette = generateChartColorPalette(sensitivityResults.length);
        // ✅ FIXED: Use result.id instead of result.variableId
        const index = sensitivityResults.findIndex(r => r.id === result.id);
        return palette[index] || getSemanticColor('neutral', 6);
    });
};

/**
 * Get color palette optimized for sensitivity analysis
 * @param {number} variableCount - Number of variables
 * @param {Object} options - Color options
 * @returns {Array} Array of colors
 */
export const getSensitivityColorPalette = (variableCount, options = {}) => {
    const { useCategories = true, highlightColor = null } = options;

    if (variableCount <= 8 && useCategories) {
        // Use category-based colors for small sets
        const categories = ['revenue', 'cost', 'multiplier', 'technical', 'financing', 'operational', 'contract', 'escalation'];
        return categories.slice(0, variableCount).map(cat => getCategoryColorScheme(cat));
    }

    // Use generated palette for larger sets
    return generateChartColorPalette(variableCount);
};

/**
 * Generate opacity values for highlighting effect
 * @param {Array} sensitivityResults - Sensitivity analysis results
 * @param {string} highlightedDriver - Driver ID to highlight
 * @param {Object} options - Opacity options
 * @returns {Array} Array of opacity values
 */
export const generateHighlightOpacity = (sensitivityResults, highlightedDriver, options = {}) => {
    const { highlightOpacity = 1.0, defaultOpacity = 0.8 } = options;

    return sensitivityResults.map(result =>
        // ✅ FIXED: Use result.id instead of result.variableId
        result.id === highlightedDriver ? highlightOpacity : defaultOpacity
    );
};

/**
 * Create color scheme for different variable impact levels
 * @param {Array} sensitivityResults - Sensitivity analysis results sorted by impact
 * @param {Object} options - Color scheme options
 * @returns {Array} Array of colors representing impact levels
 */
export const generateImpactColors = (sensitivityResults, options = {}) => {
    const {
        highImpactColor = '#ff4d4f',   // Red for high impact
        mediumImpactColor = '#fa8c16', // Orange for medium impact
        lowImpactColor = '#52c41a'     // Green for low impact
    } = options;

    if (!sensitivityResults.length) return [];

    const impacts = sensitivityResults.map(r => r.impact);
    const maxImpact = Math.max(...impacts);
    const minImpact = Math.min(...impacts);
    const range = maxImpact - minImpact;

    return sensitivityResults.map(result => {
        if (range === 0) return mediumImpactColor;

        const normalizedImpact = (result.impact - minImpact) / range;

        if (normalizedImpact > 0.66) return highImpactColor;
        if (normalizedImpact > 0.33) return mediumImpactColor;
        return lowImpactColor;
    });
};