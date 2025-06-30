// frontend/src/utils/cashflow/metrics/cubeReference.js
// Simplified cube data access and analysis functions

import { aggregateTimeSeries } from '../../timeSeries/aggregation';
import { CASHFLOW_METRICS_REGISTRY } from './registry';

/**
 * Calculate sensitivity impact across ALL metrics for given percentile range
 * SIMPLIFIED: Leverages calculateSingleMetricSensitivity for each metric
 * @param {Object} cube - Populated SensitivityCube instance
 * @param {number} lowerPercentile - Lower bound percentile (e.g., 25)
 * @param {number} upperPercentile - Upper bound percentile (e.g., 75)
 * @param {Object} options - Analysis options: {sortBy?: 'impact'|'metric', includeFormatted?: boolean}
 * @returns {Map<string, Object>} Complete sensitivity results for all metrics
 */
export const calculateAllMetricSensitivity = (cube, lowerPercentile, upperPercentile, options = {}) => {
    if (!cube || !cube.data) {
        console.warn('calculateAllMetricSensitivity: Invalid or uninitialized cube');
        return new Map();
    }

    const { sortBy = 'impact', includeTimeSeries = false } = options;
    const results = new Map();
    
    // Process each metric using the single metric function
    for (const metricKey of cube.metrics) {
        try {
            const singleResult = calculateSingleMetricSensitivity(
                cube, 
                metricKey, 
                lowerPercentile, 
                upperPercentile, 
                { includeTimeSeries }
            );
            results.set(metricKey, singleResult);
        } catch (error) {
            console.error(`calculateAllMetricSensitivity: Error processing metric ${metricKey}:`, error);
        }
    }
    
    // Sort results if requested
    if (sortBy === 'impact') {
        const sortedEntries = Array.from(results.entries())
            .sort((a, b) => b[1].absoluteImpact - a[1].absoluteImpact);
        return new Map(sortedEntries);
    }
    
    return results;
};

/**
 * Calculate sensitivity impact for specific metric across percentile range
 * ENHANCED: Returns comprehensive sensitivity analysis for single metric
 * @param {Object} cube - Populated SensitivityCube instance
 * @param {string} metricKey - Target metric identifier
 * @param {number} lowerPercentile - Lower bound percentile
 * @param {number} upperPercentile - Upper bound percentile
 * @param {Object} options - Options: {includeTimeSeries?: boolean}
 * @returns {Object} Complete sensitivity analysis for single metric
 */
export const calculateSingleMetricSensitivity = (cube, metricKey, lowerPercentile, upperPercentile, options = {}) => {
    const metricConfig = CASHFLOW_METRICS_REGISTRY[metricKey];
    if (!metricConfig) {
        throw new Error(`Metric configuration not found for: ${metricKey}`);
    }
    
    const { includeTimeSeries = false } = options;
    
    // Get time-series data as DataPointSchema arrays
    const lowerDataPoints = getCubeTimeSeriesAsDataPoints(cube, metricKey, lowerPercentile);
    const upperDataPoints = getCubeTimeSeriesAsDataPoints(cube, metricKey, upperPercentile);
    
    if (lowerDataPoints.length === 0 || upperDataPoints.length === 0) {
        throw new Error(`No time-series data available for metric ${metricKey}`);
    }
    
    // Apply registry-configured aggregation
    const aggregationMethod = metricConfig.cubeConfig?.aggregation?.method || 'sum';
    const aggregationOptions = metricConfig.cubeConfig?.aggregation?.options || {};
    
    const lowerValue = aggregateTimeSeries(lowerDataPoints, aggregationMethod, aggregationOptions);
    const upperValue = aggregateTimeSeries(upperDataPoints, aggregationMethod, aggregationOptions);
    
    if (lowerValue === null || upperValue === null) {
        throw new Error(`Aggregation failed for metric ${metricKey} using method ${aggregationMethod}`);
    }
    
    // Calculate comprehensive sensitivity metrics
    const absoluteImpact = Math.abs(upperValue - lowerValue);
    const baseValue = (lowerValue + upperValue) / 2;
    const percentageImpact = baseValue !== 0 ? (absoluteImpact / Math.abs(baseValue)) * 100 : 0;
    const direction = upperValue > lowerValue ? 'positive' : 'negative';
    const impactDirection = upperValue - lowerValue;
    
    // Build comprehensive result
    const result = {
        // Core values
        lowerValue,
        upperValue,
        baseValue,
        
        // Impact metrics
        absoluteImpact,
        percentageImpact,
        impactDirection,
        direction,
        
        // Range analysis
        range: {
            min: Math.min(lowerValue, upperValue),
            max: Math.max(lowerValue, upperValue),
            spread: absoluteImpact,
            midpoint: baseValue
        },
        
        // Percentile info
        percentiles: {
            lower: lowerPercentile,
            upper: upperPercentile,
            range: upperPercentile - lowerPercentile
        },
        
        // Metadata
        metric: metricKey,
        aggregationMethod,
        units: metricConfig.metadata?.displayUnits || '',
        
        // Formatted values (always included)
        formatted: {
            lowerValue: metricConfig.format ? metricConfig.format(lowerValue) : lowerValue.toLocaleString(),
            upperValue: metricConfig.format ? metricConfig.format(upperValue) : upperValue.toLocaleString(),
            baseValue: metricConfig.format ? metricConfig.format(baseValue) : baseValue.toLocaleString(),
            absoluteImpact: metricConfig.format ? metricConfig.format(absoluteImpact) : absoluteImpact.toLocaleString(),
            percentageImpact: `${percentageImpact.toFixed(1)}%`,
            impactDirection: `${impactDirection > 0 ? '+' : ''}${metricConfig.format ? metricConfig.format(impactDirection) : impactDirection.toLocaleString()}`
        }
    };
    
    // Add time-series analysis if requested
    if (includeTimeSeries) {
        result.timeSeries = {
            lower: lowerDataPoints,
            upper: upperDataPoints,
            yearByYearImpact: lowerDataPoints.map((lowerPoint, index) => {
                const upperPoint = upperDataPoints[index];
                return {
                    year: lowerPoint.year,
                    lowerValue: lowerPoint.value,
                    upperValue: upperPoint ? upperPoint.value : 0,
                    impact: upperPoint ? Math.abs(upperPoint.value - lowerPoint.value) : Math.abs(lowerPoint.value)
                };
            })
        };
    }
    
    return result;
};

/**
 * Get time-series data from cube in DataPointSchema format for aggregation
 * OPTIMIZED: Single function that handles both slice access and format conversion
 * @param {Object} cube - SensitivityCube instance
 * @param {string} metricKey - Target metric identifier
 * @param {number} percentile - Target percentile value
 * @returns {Array<{year: number, value: number}>} DataPointSchema array ready for aggregateTimeSeries()
 */
export const getCubeTimeSeriesAsDataPoints = (cube, metricKey, percentile) => {
    if (!cube || !cube.data) {
        return [];
    }
    
    const mIdx = cube.metrics.indexOf(metricKey);
    const pIdx = cube.percentiles.indexOf(percentile);
    
    if (mIdx === -1 || pIdx === -1) {
        console.warn(`getCubeTimeSeriesAsDataPoints: Metric "${metricKey}" or percentile "${percentile}" not found in cube`);
        return [];
    }
    
    // Get zero-copy slice from cube typed array (optimized - combines getTimeSeriesSlice logic)
    const start = cube.getIndex(mIdx, pIdx, 0);
    const timeSeriesSlice = cube.data.subarray(start, start + cube.years);
    
    if (!timeSeriesSlice || timeSeriesSlice.length === 0) {
        return [];
    }
    
    // Convert to DataPointSchema format starting from cube's startYear
    const startYear = cube.startYear || 0;
    return Array.from(timeSeriesSlice).map((value, index) => ({
        year: startYear + index,
        value
    }));
};

/**
 * Get time-series data for single metric across all percentiles
 * @param {Object} cube - SensitivityCube instance
 * @param {string} metricKey - Target metric identifier
 * @param {Object} options - Options: {asDataPoints?: boolean}
 * @returns {Map<number, Array<{year, value}>|Float64Array>} Time-series for each percentile
 */
export const getMetricTimeSeriesForAllPercentiles = (cube, metricKey, options = {}) => {
    const { asDataPoints = true } = options;
    
    if (!cube || !cube.data) {
        return new Map();
    }
    
    const results = new Map();
    
    for (const percentile of cube.percentiles) {
        if (asDataPoints) {
            // Use optimized function for DataPointSchema format
            const dataPoints = getCubeTimeSeriesAsDataPoints(cube, metricKey, percentile);
            results.set(percentile, dataPoints);
        } else {
            // Return raw Float64Array slice
            const mIdx = cube.metrics.indexOf(metricKey);
            const pIdx = cube.percentiles.indexOf(percentile);
            
            if (mIdx !== -1 && pIdx !== -1) {
                const start = cube.getIndex(mIdx, pIdx, 0);
                const slice = cube.data.subarray(start, start + cube.years);
                results.set(percentile, slice);
            }
        }
    }
    
    return results;
};

/**
 * Get cube dimensions and memory usage information
 * @param {Object} cube - SensitivityCube instance
 * @returns {Object} Cube information: {metrics, percentiles, years, totalValues, memorySizeKB, isInitialized}
 */
export const getCubeInfo = (cube) => {
    if (!cube) {
        return {
            metrics: 0,
            percentiles: 0, 
            years: 0,
            totalValues: 0,
            memorySizeKB: 0,
            isInitialized: false
        };
    }
    
    const totalValues = cube.data ? cube.data.length : 0;
    const memorySizeKB = (totalValues * 8 / 1024).toFixed(1);
    
    return {
        metrics: cube.metrics ? cube.metrics.length : 0,
        percentiles: cube.percentiles ? cube.percentiles.length : 0,
        years: cube.years || 0,
        startYear: cube.startYear || 0,
        totalValues,
        memorySizeKB,
        isInitialized: cube.data !== null && cube.data !== undefined
    };
};