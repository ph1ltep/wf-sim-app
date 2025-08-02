// src/components/tables/shared/TableConfiguration.js - Table configuration generators

import { getTimelineMarker } from './TimelineUtils';

/**
 * Generate table configuration based on orientation
 * @param {string} orientation - 'horizontal' or 'vertical'
 * @param {Array} yearColumns - Array of year values
 * @param {Array} dataItems - Array of data items
 * @param {string} selectedField - Currently selected data field
 * @param {Object} options - Additional configuration options
 * @returns {Object} Table configuration with rows, cols, and accessors
 */
export const generateTableConfiguration = (orientation, yearColumns, dataItems, selectedField, options = {}) => {
    const {
        hideEmptyItems = false,
        isEditing = false,
        timelineMarkers = [],
        keyPrefix = 'item'
    } = options;

    const hasDataInYear = (year, data, field) => {
        return data.some(item => {
            const timeSeries = item[field] || [];
            const dataPoint = timeSeries.find(dp => dp.year === year);
            return dataPoint && dataPoint.value !== null && dataPoint.value !== undefined && dataPoint.value !== '';
        });
    };

    const hasDataInItem = (item, field) => {
        const timeSeries = item[field] || [];
        return timeSeries.some(dp => dp.value !== null && dp.value !== undefined && dp.value !== '');
    };

    if (orientation === 'vertical') {
        const filteredYears = (hideEmptyItems && !isEditing)
            ? yearColumns.filter(year => hasDataInYear(year, dataItems, selectedField))
            : yearColumns;

        return {
            rows: filteredYears.map(year => ({
                key: `year-${year}`,
                year,
                type: 'year',
                timelineMarker: getTimelineMarker(year, timelineMarkers)
            })),
            cols: dataItems.map((item, index) => ({
                key: `${keyPrefix}-${index}`,
                index,
                item,
                type: 'item',
                title: item.name || `Item ${index + 1}`
            })),
            getCellData: (rowData, colData) => {
                const year = rowData.year;
                const item = colData.item;
                const timeSeriesData = item[selectedField] || [];
                const dataPoint = timeSeriesData.find(dp => dp.year === year);
                return {
                    value: dataPoint?.value,
                    rowIndex: colData.index,
                    year: year,
                    cellKey: `${colData.index}-${year}`,
                    timelineMarker: rowData.timelineMarker
                };
            }
        };
    } else {
        const filteredItems = (hideEmptyItems && !isEditing)
            ? dataItems.filter(item => hasDataInItem(item, selectedField))
            : dataItems;

        const filteredYears = (hideEmptyItems && !isEditing)
            ? yearColumns.filter(year => hasDataInYear(year, filteredItems, selectedField))
            : yearColumns;

        return {
            rows: filteredItems.map((item, displayIndex) => {
                const realIndex = dataItems.findIndex(c => c === item);
                return {
                    key: `${keyPrefix}-${realIndex}`,
                    index: realIndex,
                    item,
                    type: 'item',
                    title: item.name || `Item ${realIndex + 1}`
                };
            }),
            cols: filteredYears.map(year => ({
                key: `year-${year}`,
                year,
                type: 'year',
                timelineMarker: getTimelineMarker(year, timelineMarkers)
            })),
            getCellData: (rowData, colData) => {
                const year = colData.year;
                const item = rowData.item;
                const timeSeriesData = item[selectedField] || [];
                const dataPoint = timeSeriesData.find(dp => dp.year === year);
                return {
                    value: dataPoint?.value,
                    rowIndex: rowData.index,
                    year: year,
                    cellKey: `${rowData.index}-${year}`,
                    timelineMarker: colData.timelineMarker
                };
            }
        };
    }
};