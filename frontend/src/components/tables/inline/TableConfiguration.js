// src/components/tables/inline/TableConfiguration.js
import React from 'react';
import { Typography, Tag } from 'antd';
import EditableCell from './EditableCell';

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
                // Year column with timeline markers - consistent with horizontal header styling
                const marker = record.timelineMarker;
                return (
                    <div style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: marker ? marker.color : '#262626',
                        backgroundColor: marker ? `${marker.color}15` : '#f5f5f5',
                        padding: '6px 5px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        margin: '2px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <span>{formatYear(record.year)}</span>
                        {marker && (
                            <Tag
                                color={marker.color}
                                size="small"
                                style={{
                                    fontSize: '10px',
                                    lineHeight: '16px',
                                    margin: 0,
                                    padding: '0 5px',
                                    fontWeight: 600
                                }}
                            >
                                {marker.tag}
                            </Tag>
                        )}
                    </div>
                );
            } else {
                // Contract name column
                return (
                    <div style={{ fontWeight: 500, padding: '4px 0' }}>
                        {record.item?.name || value || `Contract ${record.index + 1}`}
                    </div>
                );
            }
        }
    };

    // Data columns
    const dataColumns = tableConfig.cols.map((colConfig) => {
        const marker = colConfig.timelineMarker;

        return {
            title: orientation === 'vertical' ?
                colConfig.title :
                (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px'
                    }}>
                        <span style={{
                            fontWeight: marker ? 600 : 500,
                            color: marker ? marker.color : '#262626'
                        }}>
                            {formatYear(colConfig.year)}
                        </span>
                        {marker && (
                            <Tag
                                color={marker.color}
                                size="small"
                                style={{
                                    fontSize: '9px',
                                    lineHeight: '14px',
                                    margin: 0,
                                    padding: '0 4px',
                                    fontWeight: 500
                                }}
                            >
                                {marker.tag}
                            </Tag>
                        )}
                    </div>
                ),
            key: orientation === 'vertical' ? `contract-${colConfig.index}` : `year-${colConfig.year}`,
            width: 120,
            align: 'center',
            className: marker ? 'timeline-marker-column' : '',
            onHeaderCell: () => ({
                style: marker ? {
                    backgroundColor: `${marker.color}15`,
                    borderColor: `${marker.color}40`,
                    borderWidth: '2px'
                } : {}
            }),
            onCell: () => ({
                style: marker ? {
                    backgroundColor: `${marker.color}08`,
                    borderLeft: '0px',
                    borderRight: '0px'
                } : {}
            }),
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