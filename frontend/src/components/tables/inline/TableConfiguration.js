// src/components/tables/inline/TableConfiguration.js - Updated to use CSS classes instead of inline styles
import React from 'react';
import { Typography, Tag } from 'antd';
import EditableCell from './EditableCell';
import { getMarkerClasses, getMarkerStyles } from '../shared/TableThemeEngine';

const { Text } = Typography;

/**
 * Format year display with new format
 * @param {number} year - Year value
 * @returns {string} Formatted year string
 */
export const formatYear = (year) => {
    if (year === 0) return 'Year 0';
    return year > 0 ? `Year +${year}` : `Year ${year}`;
};

/**
 * Check if a year matches any timeline marker
 * @param {number} year - Year to check
 * @param {Array} timelineMarkers - Array of timeline marker objects
 * @returns {Object|null} Matching marker or null
 */
export const getTimelineMarker = (year, timelineMarkers = []) => {
    return timelineMarkers.find(marker => marker.year === year) || null;
};

/**
 * Get table configuration based on orientation
 * @param {string} orientation - 'horizontal' or 'vertical'
 * @param {Array} yearColumns - Array of year values
 * @param {Array} contractData - Array of contract/item data
 * @param {string} selectedDataField - Currently selected data field
 * @param {boolean} hideEmptyItems - Whether to hide empty rows/columns in read mode
 * @param {boolean} isEditing - Whether table is in edit mode
 * @param {Array} timelineMarkers - Timeline markers for highlighting
 * @returns {Object} Table configuration with rows, cols, and cell accessor functions
 */
export const getTableConfiguration = (orientation, yearColumns, contractData, selectedDataField, hideEmptyItems = false, isEditing = false, timelineMarkers = []) => {
    const hasDataInYear = (year, data, field) => {
        return data.some(item => {
            const timeSeries = item[field] || [];
            const dataPoint = timeSeries.find(dp => dp.year === year);
            return dataPoint && dataPoint.value !== null && dataPoint.value !== undefined && dataPoint.value !== '';
        });
    };

    const hasDataInContract = (contract, field) => {
        const timeSeries = contract[field] || [];
        return timeSeries.some(dp => dp.value !== null && dp.value !== undefined && dp.value !== '');
    };

    if (orientation === 'vertical') {
        // Filter years if hiding empty items and in read mode
        const filteredYears = (hideEmptyItems && !isEditing)
            ? yearColumns.filter(year => hasDataInYear(year, contractData, selectedDataField))
            : yearColumns;

        return {
            rows: filteredYears.map(year => ({
                year,
                type: 'year',
                timelineMarker: getTimelineMarker(year, timelineMarkers)
            })),
            cols: contractData.map((item, index) => ({
                index,
                item,
                type: 'contract',
                title: item.name || `Item ${index + 1}`
            })),
            getCellData: (rowData, colData) => {
                const year = rowData.year;
                const contract = colData.item;
                const timeSeriesData = contract[selectedDataField] || [];
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
        // Filter contracts if hiding empty items and in read mode
        const filteredContracts = (hideEmptyItems && !isEditing)
            ? contractData.filter(contract => hasDataInContract(contract, selectedDataField))
            : contractData;

        // Also filter years if hiding empty items and in read mode
        const filteredYears = (hideEmptyItems && !isEditing)
            ? yearColumns.filter(year => hasDataInYear(year, filteredContracts, selectedDataField))
            : yearColumns;

        return {
            rows: filteredContracts.map((item, displayIndex) => {
                // Find original index for proper updates
                const realIndex = contractData.findIndex(c => c === item);
                return {
                    index: realIndex,
                    item,
                    type: 'contract',
                    title: item.name || `Contract ${realIndex + 1}`
                };
            }),
            cols: filteredYears.map(year => ({
                year,
                type: 'year',
                timelineMarker: getTimelineMarker(year, timelineMarkers)
            })),
            getCellData: (rowData, colData) => {
                const year = colData.year;
                const contract = rowData.item;
                const timeSeriesData = contract[selectedDataField] || [];
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

/**
 * Render a table cell (editable or display)
 */
export const renderTableCell = (
    cellData,
    isEditing,
    currentFieldConfig,
    updateCellValue,
    modifiedCells,
    validationErrors,
    handleCellValidation,
    handleCellModification
) => {
    const { value, rowIndex, year } = cellData;

    if (!isEditing) {
        // Display mode
        if (value === null || value === undefined || value === '') {
            return <Text type="secondary">-</Text>;
        }

        // Format based on field type
        if (currentFieldConfig?.type === 'currency') {
            return `${value.toLocaleString()}`;
        } else if (currentFieldConfig?.type === 'percentage') {
            return `${value}%`;
        }
        return value;
    }

    // Edit mode - render EditableCell
    return (
        <EditableCell
            value={value}
            onChange={(newValue) => updateCellValue(rowIndex, year, newValue)}
            rowIndex={rowIndex}
            year={year}
            fieldConfig={currentFieldConfig}
            disabled={false}
            modifiedCells={modifiedCells}
            validationErrors={validationErrors}
            onCellValidation={handleCellValidation}
            onCellModification={handleCellModification}
        />
    );
};

/**
 * Generate table columns based on configuration
 */
export const generateTableColumns = (
    orientation,
    tableConfig,
    selectedDataField,
    isEditing,
    currentFieldConfig,
    updateCellValue,
    modifiedCells,
    validationErrors,
    handleCellValidation,
    handleCellModification
) => {
    // First column (fixed)
    const firstColumn = {
        title: orientation === 'vertical' ? 'Year' : 'Contract',
        dataIndex: orientation === 'vertical' ? 'year' : 'name',
        key: orientation === 'vertical' ? 'year' : 'name',
        fixed: 'left',
        width: orientation === 'vertical' ? 140 : 200,
        render: (value, record) => {
            if (orientation === 'vertical') {
                // Year column with timeline markers - use CSS classes
                const marker = record.timelineMarker;
                const markerClasses = marker ? getMarkerClasses(marker, 'cell') : '';
                const markerStyles = marker ? getMarkerStyles(marker) : {};

                return (
                    <div
                        className={`year-column ${markerClasses}`.trim()}
                        style={markerStyles}
                    >
                        <span className="year-label">{formatYear(record.year)}</span>
                        {marker && (
                            <Tag
                                color={marker.color}
                                size="small"
                                className="marker-tag"
                            >
                                {marker.tag}
                            </Tag>
                        )}
                    </div>
                );
            } else {
                // Contract name column
                return (
                    <div className="contract-name">
                        {record.item?.name || value || `Contract ${record.index + 1}`}
                    </div>
                );
            }
        }
    };

    // Data columns
    const dataColumns = tableConfig.cols.map((colConfig) => {
        const marker = colConfig.timelineMarker;
        const markerClasses = marker ? getMarkerClasses(marker, 'header') : '';
        const markerStyles = marker ? getMarkerStyles(marker) : {};

        return {
            title: orientation === 'vertical' ?
                colConfig.title :
                (
                    <div className={`year-header ${markerClasses}`.trim()} style={markerStyles}>
                        <span className="year-label">{formatYear(colConfig.year)}</span>
                        {marker && (
                            <Tag
                                color={marker.color}
                                size="small"
                                className="marker-tag"
                            >
                                {marker.tag}
                            </Tag>
                        )}
                    </div>
                ),
            key: orientation === 'vertical' ? `contract-${colConfig.index}` : `year-${colConfig.year}`,
            width: 120,
            align: 'center',
            className: marker ? getMarkerClasses(marker, 'column') : '',
            onHeaderCell: () => {
                const headerMarkerClasses = marker ? getMarkerClasses(marker, 'header') : '';
                const headerMarkerStyles = marker ? getMarkerStyles(marker) : {};

                return {
                    className: headerMarkerClasses,
                    style: headerMarkerStyles
                };
            },
            onCell: () => {
                const cellMarkerClasses = marker ? getMarkerClasses(marker, 'cell') : '';
                const cellMarkerStyles = marker ? getMarkerStyles(marker) : {};

                return {
                    className: cellMarkerClasses,
                    style: cellMarkerStyles
                };
            },
            render: (_, rowRecord) => {
                const cellData = tableConfig.getCellData(rowRecord, colConfig);

                return renderTableCell(
                    cellData,
                    isEditing,
                    currentFieldConfig,
                    updateCellValue,
                    modifiedCells,
                    validationErrors,
                    handleCellValidation,
                    handleCellModification
                );
            }
        };
    });

    return [firstColumn, ...dataColumns];
};