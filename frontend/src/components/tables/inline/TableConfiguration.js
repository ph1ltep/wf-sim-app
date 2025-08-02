// src/components/tables/inline/TableConfiguration.js - v3.0 CORRECTED: Full new class hierarchy support

import React from 'react';
import { Typography, Tag } from 'antd';
import EditableCell from './EditableCell';
import {
    getCellClasses,
    getMarkerStyles
} from '../shared/TableThemeEngine';
import { max } from 'lodash';

const { Text } = Typography;

/**
 * Format year display with consistent format
 */
export const formatYear = (year) => {
    if (year === 0) return 'Year 0';
    return year > 0 ? `Year +${year}` : `Year ${year}`;
};

/**
 * Check if a year matches any timeline marker
 */
export const getTimelineMarker = (year, timelineMarkers = []) => {
    return timelineMarkers.find(marker => marker.year === year) || null;
};

/**
 * Get table configuration with proper position data for new class hierarchy
 */
export const getTableConfiguration = (
    orientation,
    yearColumns,
    contractData,
    selectedDataField,
    hideEmptyItems = false,
    isEditing = false,
    timelineMarkers = [],
    selectedColumn = null,
    primaryColumn = null
) => {
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
        const filteredYears = (hideEmptyItems && !isEditing)
            ? yearColumns.filter(year => hasDataInYear(year, contractData, selectedDataField))
            : yearColumns;

        return {
            rows: filteredYears.map((year, rowIndex) => ({
                key: `year-${year}`,
                year,
                timelineMarker: getTimelineMarker(year, timelineMarkers),
                rowIndex,
                totalRows: filteredYears.length,
                orientation
            })),
            cols: contractData.map((contract, colIndex) => ({
                key: `contract-${colIndex}`,
                index: colIndex,
                item: contract,
                title: contract.name || `Contract ${colIndex + 1}`,
                colIndex,
                totalCols: contractData.length,
                orientation
            })),
            getCellData: (rowData, colData) => {
                const year = rowData.year;
                const contract = colData.item;
                const timeSeries = contract[selectedDataField] || [];
                const dataPoint = timeSeries.find(dp => dp.year === year);
                return {
                    value: dataPoint?.value,
                    rowIndex: colData.index,
                    year: year,
                    cellKey: `${colData.index}-${year}`,
                    timelineMarker: rowData.timelineMarker,
                    position: {
                        rowIndex: rowData.rowIndex,
                        colIndex: colData.colIndex,
                        totalRows: rowData.totalRows,
                        totalCols: colData.totalCols,
                        isHeaderRow: false,
                        isHeaderCol: false,
                        orientation
                    }
                };
            }
        };
    } else {
        const filteredContracts = (hideEmptyItems && !isEditing)
            ? contractData.filter(contract => hasDataInContract(contract, selectedDataField))
            : contractData;

        const filteredYears = (hideEmptyItems && !isEditing)
            ? yearColumns.filter(year => hasDataInYear(year, filteredContracts, selectedDataField))
            : yearColumns;

        return {
            rows: filteredContracts.map((contract, rowIndex) => ({
                key: `contract-${rowIndex}`,
                index: rowIndex,
                item: contract,
                name: contract.name || `Contract ${rowIndex + 1}`,
                rowIndex,
                totalRows: filteredContracts.length,
                orientation
            })),
            cols: filteredYears.map((year, colIndex) => ({
                key: `year-${year}`,
                year,
                timelineMarker: getTimelineMarker(year, timelineMarkers),
                colIndex,
                totalCols: filteredYears.length,
                orientation
            })),
            getCellData: (rowData, colData) => {
                const contract = rowData.item;
                const year = colData.year;
                const timeSeries = contract[selectedDataField] || [];
                const dataPoint = timeSeries.find(dp => dp.year === year);

                return {
                    value: dataPoint?.value,
                    rowIndex: rowData.index,
                    year: year,
                    cellKey: `${rowData.index}-${year}`,
                    timelineMarker: colData.timelineMarker,
                    position: {
                        rowIndex: rowData.rowIndex,
                        colIndex: colData.colIndex,
                        totalRows: rowData.totalRows,
                        totalCols: colData.totalCols,
                        isHeaderRow: false,
                        isHeaderCol: false,
                        orientation
                    }
                };
            }
        };
    }
};

/**
 * Render table cell with new class hierarchy support
 */
export const renderTableCell = (
    cellData,
    isEditing,
    currentFieldConfig,
    updateCellValue,
    modifiedCells,
    validationErrors,
    handleCellValidation,
    handleCellModification,
    states = {}
) => {
    const { value, rowIndex, year, isCalculated, className, formatter, isIntersection } = cellData;

    let formattedValue = value;

    // For intersection cells, only show the value, no header
    if (isIntersection) {
        if (value === null || value === undefined || value === '') {
            return (
                <div className="content-inner">
                    <Text type="secondary">-</Text>
                </div>
            );
        }

        // Use custom formatter if provided (for data, summary, or totals cells)
        if (formatter && typeof formatter === 'function') {
            try {
                formattedValue = formatter(value);
            } catch (error) {
                console.error('Formatter error:', error);
                formattedValue = value;
            }
        } else {
            // Default formatting only for non-calculated cells
            if (!isCalculated) {
                if (currentFieldConfig?.type === 'currency') {
                    formattedValue = `${value.toLocaleString()}`;
                } else if (currentFieldConfig?.type === 'percentage') {
                    formattedValue = `${value}%`;
                }
            }
        }

        return (
            <div className="content-inner">
                {formattedValue}
            </div>
        );
    }

    if (!isEditing || isCalculated) {
        if (value === null || value === undefined || value === '') {
            return (
                <div className="content-inner">
                    <Text type="secondary">-</Text>
                </div>
            );
        }

        let formattedValue = value;

        // Use custom formatter if provided
        if (formatter && typeof formatter === 'function') {
            try {
                formattedValue = formatter(value);
            } catch (error) {
                console.error('Formatter error:', error);
                formattedValue = value; // Fallback to original value
            }
        } else {
            // Default formatting
            if (currentFieldConfig?.type === 'currency') {
                formattedValue = `${value.toLocaleString()}`;
            } else if (currentFieldConfig?.type === 'percentage') {
                formattedValue = `${value}%`;
            }
        }

        return (
            <div className="content-inner">
                {formattedValue}
            </div>
        );
    }

    // NOTE: Cell styling applied via onCell, not here
    if (!isEditing) {
        if (value === null || value === undefined || value === '') {
            return (
                <div className="content-inner">
                    <Text type="secondary">-</Text>
                </div>
            );
        }

        let formattedValue = value;
        if (currentFieldConfig?.type === 'currency') {
            formattedValue = `${value.toLocaleString()}`;
        } else if (currentFieldConfig?.type === 'percentage') {
            formattedValue = `${value}%`;
        }

        return (
            <div className="content-inner">
                {formattedValue}
            </div>
        );
    }

    return (
        <div className="content-inner">
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
        </div>
    );
};
/**
 * Generate table columns with FULL new class hierarchy support
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
    handleCellModification,
    selectedColumn = null,
    primaryColumn = null,
    styleOptions = {},
    calcSummary = null,
    calcTotals = null
) => {
    // Prepare styleOptions with isEditing logic
    const processedStyleOptions = {
        header: true,
        subHeader: true,
        // Default summary/totals to true if calc functions are provided, BUT force false in edit mode
        summary: isEditing ? false : (styleOptions.summary !== undefined ? styleOptions.summary : !!calcSummary),
        totals: isEditing ? false : (styleOptions.totals !== undefined ? styleOptions.totals : !!calcTotals),
        summaryLabel: styleOptions.summaryLabel || 'Summary',
        totalsLabel: styleOptions.totalsLabel || 'Totals',
        cellFormatter: styleOptions.cellFormatter || null,
        summaryFormatter: styleOptions.summaryFormatter || null,
        totalsFormatter: styleOptions.totalsFormatter || null,

        // Include any other styleOptions
        ...styleOptions,
        // FORCE these to false in edit mode - no overrides allowed
        ...(isEditing && {
            summary: false,
            totals: false
        })
    };

    // First column (fixed) - OPTIMIZED
    const firstColumn = {
        title: orientation === 'vertical' ? 'Year' : 'Contract',
        dataIndex: orientation === 'vertical' ? 'year' : 'name',
        key: orientation === 'vertical' ? 'year' : 'name',
        fixed: 'left',
        width: orientation === 'vertical' ? 140 : 200,
        onHeaderCell: () => {
            const headerClasses = getCellClasses({
                position: {
                    rowIndex: 0,
                    colIndex: 0,
                    totalRows: 1,
                    totalCols: (tableConfig.cols?.length || 0) + 1,
                    isHeaderRow: true,
                    isHeaderCol: true,
                    orientation
                },
                states: {},
                marker: null,
                orientation,
                styleOptions: processedStyleOptions
            });

            return { className: headerClasses };
        },
        onCell: (record, recordIndex) => {
            const marker = orientation === 'vertical' ? record.timelineMarker : null;
            const cellClasses = getCellClasses({
                position: {
                    rowIndex: recordIndex || 0,
                    colIndex: 0,
                    totalRows: tableConfig.rows?.length || 1,
                    totalCols: (tableConfig.cols?.length || 0) + 1,
                    isHeaderRow: false,
                    isHeaderCol: true,
                    orientation
                },
                states: {},
                marker,
                orientation,
                styleOptions: processedStyleOptions
            });

            return {
                className: cellClasses,
                style: getMarkerStyles(marker)
            };
        },
        render: (value, record, rowIndex) => {
            if (orientation === 'vertical') {
                const marker = record.timelineMarker;

                return (
                    <div className="content-inner">
                        <span>{formatYear(record.year)}</span>
                        {marker && (
                            <Tag className="content-tag" color={marker.color} size="small">
                                {marker.tag}
                            </Tag>
                        )}
                    </div>
                );
            } else {
                // Handle calculated rows (like totals row)
                if (record.isCalculated) {
                    return (
                        <div className="content-inner">
                            {record.name || record.item?.name || ''}
                        </div>
                    );
                }

                // Regular contract rows
                return (
                    <div className="content-inner">
                        {record.item?.name || value || `Contract ${record.index + 1}`}
                    </div>
                );
            }
        }
    };

    // Data columns - OPTIMIZED
    const dataColumns = (tableConfig.cols || []).map((colConfig, colIndex) => {
        const marker = colConfig.timelineMarker;
        const columnKey = orientation === 'vertical' ? `contract-${colConfig.index}` : `year-${colConfig.year}`;
        const isSelected = selectedColumn === columnKey;
        const isPrimary = primaryColumn === columnKey;

        const columnStates = {
            selected: isSelected,
            primary: isPrimary
        };

        return {
            // OPTIMIZED: Simple title without duplicate classes
            title: orientation === 'vertical' ?
                colConfig.title :
                (
                    // Check if this is a calculated column (summary/totals)
                    colConfig.isCalculated ?
                        colConfig.year : // Just show the label, no formatting
                        (
                            <div className="content-inner">
                                <span>{formatYear(colConfig.year)}</span>
                                {marker && (
                                    <Tag className="content-tag" color={marker.color} size="small">
                                        {marker.tag}
                                    </Tag>
                                )}
                            </div>
                        )
                ),
            key: columnKey,
            //width: 100,
            align: 'center',
            onHeaderCell: () => {
                const headerClasses = getCellClasses({
                    position: {
                        rowIndex: 0,
                        colIndex: colIndex + 1,
                        totalRows: 1,
                        totalCols: (tableConfig.cols?.length || 0) + 1,
                        isHeaderRow: true,
                        isHeaderCol: false,
                        orientation
                    },
                    states: columnStates,
                    marker,
                    orientation,
                    styleOptions: processedStyleOptions
                });

                return {
                    className: headerClasses,
                    style: getMarkerStyles(marker)
                };
            },
            onCell: (record, recordIndex) => {
                // Get cell data to check if it's calculated
                const cellData = tableConfig.getCellData(record, colConfig);

                // If this is a calculated cell, use the pre-determined classes
                if (cellData.isCalculated && cellData.className) {
                    return {
                        className: cellData.className,
                        style: getMarkerStyles(marker)
                    };
                }
                const cellClasses = getCellClasses({
                    position: {
                        rowIndex: recordIndex || 0,
                        colIndex: colIndex + 1,
                        totalRows: tableConfig.rows?.length || 1,
                        totalCols: (tableConfig.cols?.length || 0) + 1,
                        isHeaderRow: false,
                        isHeaderCol: false,
                        styleOptions: processedStyleOptions
                    },
                    states: columnStates,
                    marker,
                    orientation,
                    styleOptions
                });

                return {
                    className: cellClasses,
                    style: getMarkerStyles(marker)
                };
            },
            render: (_, rowRecord, rowIndex) => {
                const cellData = tableConfig.getCellData(rowRecord, colConfig);

                return renderTableCell(
                    cellData,
                    isEditing,
                    currentFieldConfig,
                    updateCellValue,
                    modifiedCells,
                    validationErrors,
                    handleCellValidation,
                    handleCellModification,
                    columnStates
                );
            }
        };
    });

    return [firstColumn, ...dataColumns];
};