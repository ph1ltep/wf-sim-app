// src/utils/tables/formatting.js - Generic table formatting utilities

/**
 * Format value based on type - moved from shared TableDataOps
 * @param {any} value - Value to format
 * @param {string} type - Value type ('number', 'currency', 'percentage')
 * @param {Object} options - Formatting options
 * @returns {string} Formatted value
 */
export const formatTableValue = (value, type = 'number', options = {}) => {
    const { precision = 2, currency = 'USD', suffix = '', prefix = '' } = options;

    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }

    const numValue = Number(value);

    switch (type) {
        case 'currency':
            return `${prefix}$${numValue.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            })}${suffix}`;

        case 'percentage':
            return `${prefix}${numValue.toFixed(precision)}%${suffix}`;

        case 'number':
        default:
            return `${prefix}${numValue.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            })}${suffix}`;
    }
};

/**
 * Detect data type from array of values
 * @param {Array} values - Array of values to analyze
 * @returns {string} Detected type ('number', 'currency', 'percentage', 'string')
 */
export const detectTableValueType = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 'string';

    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return 'string';

    // Check if all are numbers
    const isNumeric = validValues.every(v => !isNaN(Number(v)));
    if (!isNumeric) return 'string';

    const numbers = validValues.map(v => Number(v));

    // Check for percentage patterns (values between 0-100)
    const possiblePercentages = numbers.filter(n => n >= 0 && n <= 100);
    if (possiblePercentages.length / numbers.length > 0.8) return 'percentage';

    // Check for currency patterns (larger numbers)
    const largeCurrency = numbers.filter(n => Math.abs(n) > 1000);
    if (largeCurrency.length / numbers.length > 0.5) return 'currency';

    return 'number';
};

/**
 * Format year display with project-relative format
 * @param {number} year - Year value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted year string
 */
export const formatTableYear = (year, options = {}) => {
    const { showRelative = true, codYear = 0 } = options;

    if (!showRelative) return `Year ${year}`;

    if (year === 0) return 'COD (Year 0)';
    if (year > 0) return `COD+${year}`;
    return `COD${year}`;
};

/**
 * Create confidence interval display string
 * @param {Object} intervals - Confidence interval data
 * @param {Object} percentileInfo - Percentile metadata
 * @param {Function} formatter - Value formatting function
 * @param {string} suffix - Value suffix
 * @returns {string} Formatted confidence interval
 */
export const formatConfidenceInterval = (intervals, percentileInfo, formatter = (v) => v?.toFixed(2) || '-', suffix = '') => {
    if (!intervals || !percentileInfo) return '-';

    const { min, primary, max } = percentileInfo;
    const primaryValue = intervals[`P${primary}`];
    const minValue = intervals[`P${min}`];
    const maxValue = intervals[`P${max}`];

    const primaryText = `${formatter(primaryValue)}${suffix}`;

    if (min === max || !minValue || !maxValue) {
        return primaryText;
    }

    return `${primaryText} (${formatter(minValue)}${suffix} - ${formatter(maxValue)}${suffix})`;
};

/**
 * Format large numbers with appropriate suffixes
 * @param {number} value - Numeric value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted value with suffix
 */
export const formatLargeNumber = (value, options = {}) => {
    const { precision = 1, currency = false } = options;

    if (value === null || value === undefined || isNaN(value)) return '-';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const prefix = currency ? '$' : '';

    if (absValue >= 1e9) {
        return `${sign}${prefix}${(absValue / 1e9).toFixed(precision)}B`;
    } else if (absValue >= 1e6) {
        return `${sign}${prefix}${(absValue / 1e6).toFixed(precision)}M`;
    } else if (absValue >= 1e3) {
        return `${sign}${prefix}${(absValue / 1e3).toFixed(precision)}K`;
    } else {
        return `${sign}${prefix}${absValue.toFixed(precision)}`;
    }
};

/**
 * Format duration in years/months
 * @param {number} years - Duration in years
 * @param {Object} options - Formatting options
 * @returns {string} Formatted duration
 */
export const formatDuration = (years, options = {}) => {
    const { showMonths = true, precision = 1 } = options;

    if (years === null || years === undefined || isNaN(years)) return '-';

    const wholeYears = Math.floor(years);
    const remainingMonths = Math.round((years - wholeYears) * 12);

    if (wholeYears === 0 && remainingMonths > 0 && showMonths) {
        return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }

    if (remainingMonths === 0 || !showMonths) {
        return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}`;
    }

    return `${wholeYears}y ${remainingMonths}m`;
};

/**
 * Format percentage with optional precision and bounds checking
 * @param {number} value - Percentage value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, options = {}) => {
    const { precision = 1, showWarnings = false, bounds = { min: 0, max: 100 } } = options;

    if (value === null || value === undefined || isNaN(value)) return '-';

    const formatted = `${Number(value).toFixed(precision)}%`;

    if (!showWarnings) return formatted;

    // Add warning indicators for out-of-bounds values
    if (value < bounds.min) return `${formatted} ⚠️`;
    if (value > bounds.max) return `${formatted} ⚠️`;

    return formatted;
};

/**
 * Create confidence interval statistic display component data (moved from cashflowUtils)
 * @param {string} title - Statistic title
 * @param {Object} intervals - Confidence interval data
 * @param {Object} percentileInfo - Percentile metadata
 * @param {Function} formatter - Value formatting function
 * @param {string} suffix - Value suffix
 * @returns {Object} Formatted statistic component data
 */
export const createConfidenceStatistic = (title, intervals, percentileInfo, formatter = (v) => v?.toFixed(2) || '-', suffix = '') => {
    if (!intervals || !percentileInfo) return null;

    const { min, primary, max } = percentileInfo;
    const primaryValue = intervals[`P${primary}`];
    const minValue = intervals[`P${min}`];
    const maxValue = intervals[`P${max}`];

    return {
        title,
        primaryValue: formatter(primaryValue) + suffix,
        confidenceRange: `P${min}: ${formatter(minValue)}${suffix} | P${max}: ${formatter(maxValue)}${suffix}`,
        data: {
            primary: primaryValue,
            min: minValue,
            max: maxValue,
            percentiles: { min, primary, max }
        }
    };
};