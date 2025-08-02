// src/components/tables/shared/TimeSeriesOps.js - Time series data operations

/**
 * Transform time series data to table format
 * @param {Array} timeSeriesData - Array of {year, value} objects
 * @param {Object} options - Transformation options
 * @returns {Array} Transformed table data
 */
export const transformTimeSeriesForTable = (timeSeriesData, options = {}) => {
    const {
        keyPrefix = 'ts',
        addMetadata = false,
        fillMissingYears = false,
        yearRange = null
    } = options;

    if (!Array.isArray(timeSeriesData)) return [];

    let processedData = [...timeSeriesData];

    if (fillMissingYears && yearRange) {
        const dataMap = new Map(timeSeriesData.map(item => [item.year, item.value]));
        processedData = [];

        for (let year = yearRange.min; year <= yearRange.max; year++) {
            processedData.push({
                year,
                value: dataMap.get(year) || null
            });
        }
    }

    return processedData.map((item, index) => ({
        key: `${keyPrefix}-${item.year || index}`,
        year: item.year,
        value: item.value,
        ...(addMetadata && {
            metadata: {
                originalIndex: index,
                hasValue: item.value !== null && item.value !== undefined
            }
        })
    }));
};

/**
 * Transform percentile data map to table format
 * @param {Map} percentileDataMap - Map of percentile -> data arrays
 * @param {Array} selectedPercentiles - Percentiles to include
 * @param {Object} options - Transformation options
 * @returns {Array} Table data with percentile columns
 */
export const transformPercentileMapForTable = (percentileDataMap, selectedPercentiles, options = {}) => {
    const {
        keyPrefix = 'pct',
        metricName = 'value',
        formatter = null
    } = options;

    if (!percentileDataMap || typeof percentileDataMap.get !== 'function') {
        return [];
    }

    const allYears = new Set();
    selectedPercentiles.forEach(percentile => {
        const data = percentileDataMap.get(percentile);
        if (Array.isArray(data)) {
            data.forEach(point => allYears.add(point.year));
        }
    });

    return Array.from(allYears).sort((a, b) => a - b).map(year => {
        const row = {
            key: `${keyPrefix}-${year}`,
            year,
            metricName
        };

        selectedPercentiles.forEach(percentile => {
            const data = percentileDataMap.get(percentile);
            const point = Array.isArray(data) ? data.find(p => p.year === year) : null;
            const value = point ? point.value : null;

            row[`P${percentile}`] = formatter ? formatter(value) : value;
        });

        return row;
    });
};