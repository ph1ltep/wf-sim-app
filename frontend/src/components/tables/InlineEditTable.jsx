// src/components/tables/InlineEditTable.jsx - Updated to use CSS-in-JS theme system
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Alert, message, Modal } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateAffectedMetrics } from '../../utils/metricsUtils';
import { validateCellValue } from './inline/EditableCell';
import { ValidationErrorSummary } from './inline/TableMetadata';
import { DataFieldSelector, EditModeControls, ViewModeControls, TableControls } from './inline/TableControls';
import {
    getTableConfiguration,
    generateTableColumns
} from './inline/TableConfiguration';
import {
    isSingleObjectMode,
    normalizeTimeSeriesData,
    trimTimeSeriesData,
    buildBatchUpdates
} from './inline/DataOperations';
// Updated theme imports
import {
    useTableTheme,
    composeTheme,
    validateTableStructure,
    ensureUniqueKeys,
    getRowClasses
} from './shared';

const { confirm } = Modal;

/**
 * InlineEditTable - Updated with CSS-in-JS theme integration
 */
const InlineEditTable = ({
    path,
    dataFieldOptions = [],
    yearRange = { min: 1, max: 20 },
    trimBlanks = true,
    trimValue = null,
    showMetadata = true,
    hideEmptyItems = false,
    metadataRenderer,
    affectedMetrics = [],
    onBeforeSave,
    onAfterSave,
    onCancel,
    orientation = 'horizontal',
    calcSummary, // (rowOrColData, orientation, styleOptions) => value
    calcTotals,  // (rowOrColData, orientation, styleOptions) => value

    // Updated theme integration options
    theme = 'compact', // Use compact theme by default for inline editing
    customTheme = null,
    additionalCSS = '', // Legacy CSS string support
    additionalStyles = {}, // CSS-in-JS object overrides
    containerClassName = '', // Allow cards to add container classes
    tableClassName = '', // Allow cards to add table classes

    // Timeline marker support
    timelineMarkers = [],

    // Existing render props options
    renderControls,
    controlsPlacement = 'internal',
    showDataFieldSelector = true,
    styleOptions = { header: true, subHeader: true, summary: false, totals: false },
    ...tableProps
}) => {
    // Validation
    if (!path || !Array.isArray(path)) {
        throw new Error('InlineEditTable: path prop is required and must be an array');
    }
    if (!dataFieldOptions || dataFieldOptions.length === 0) {
        throw new Error('InlineEditTable: dataFieldOptions prop is required and must not be empty');
    }

    // Theme composition: base theme + card overrides
    const baseTableTheme = useTableTheme(customTheme || theme);
    const finalTheme = useMemo(() => {
        if (!additionalCSS && !additionalStyles && !containerClassName && !tableClassName) {
            return baseTableTheme;
        }

        return composeTheme(baseTableTheme, {
            containerClass: containerClassName,
            tableClass: tableClassName,
            additionalCSS,
            additionalStyles
        });
    }, [baseTableTheme, additionalCSS, additionalStyles, containerClassName, tableClassName]);


    // Context and state
    const { getValueByPath, updateByPath } = useScenario();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [selectedDataField, setSelectedDataField] = useState(dataFieldOptions[0]?.value);
    const [modifiedCells, setModifiedCells] = useState(new Set());
    const [validationErrors, setValidationErrors] = useState(new Map());
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveAttempted, setSaveAttempted] = useState(false);

    // Data preparation with shared validation
    const rawContextData = getValueByPath(path, []);
    const isSingleMode = isSingleObjectMode(rawContextData);
    const contextData = isSingleMode ? [rawContextData] : (Array.isArray(rawContextData) ? rawContextData : []);

    // Validate data structure using shared utilities
    const dataValidation = useMemo(() => {
        const errors = validateTableStructure(contextData, 'InlineEditTable');
        return { isValid: errors.length === 0, errors };
    }, [contextData]);

    // Computed states
    const hasUnsavedChanges = modifiedCells.size > 0;
    const hasValidationErrors = validationErrors.size > 0;
    const currentFieldConfig = dataFieldOptions.find(opt => opt.value === selectedDataField);
    const canSaveComputed = useMemo(() => {
        return hasUnsavedChanges && !hasValidationErrors && !saveLoading;
    }, [hasUnsavedChanges, hasValidationErrors, saveLoading]);

    // Year columns generation
    const yearColumns = useMemo(() => {
        const years = [];
        for (let year = yearRange.min; year <= yearRange.max; year++) {
            years.push(year);
        }
        return years;
    }, [yearRange]);

    // Cell modification and validation handlers
    const handleCellModification = useCallback((cellKey) => {
        setModifiedCells(prev => {
            if (prev.has(cellKey)) return prev;
            return new Set([...prev, cellKey]);
        });
    }, []);

    const handleCellValidation = useCallback((cellKey, error) => {
        setValidationErrors(prev => {
            const newErrors = new Map(prev);
            if (error) {
                newErrors.set(cellKey, error);
            } else {
                newErrors.delete(cellKey);
            }
            return newErrors;
        });
    }, []);

    // Validate all cells using shared validation
    const validateAllCells = useCallback(() => {
        if (!formData || !isEditing) return;

        const newErrors = new Map();
        formData.forEach((contract, rowIndex) => {
            const timeSeries = contract[selectedDataField] || [];
            yearColumns.forEach(year => {
                const dataPoint = timeSeries.find(dp => dp.year === year);
                const value = dataPoint?.value;
                const cellKey = `${rowIndex}-${year}`;
                const error = validateCellValue(value, currentFieldConfig);
                if (error) {
                    newErrors.set(cellKey, error);
                }
            });
        });
        setValidationErrors(newErrors);
    }, [formData, isEditing, selectedDataField, yearColumns, currentFieldConfig]);

    // Update cell value
    const updateCellValue = useCallback((rowIndex, year, newValue) => {
        setFormData(prev => {
            if (!prev) return prev;

            const newData = [...prev];
            const contract = { ...newData[rowIndex] };
            const timeSeries = [...(contract[selectedDataField] || [])];

            const dataPointIndex = timeSeries.findIndex(dp => dp.year === year);
            if (dataPointIndex >= 0) {
                timeSeries[dataPointIndex] = { ...timeSeries[dataPointIndex], value: newValue };
            } else {
                timeSeries.push({ year, value: newValue });
            }
            contract[selectedDataField] = timeSeries;
            newData[rowIndex] = contract;

            return newData;
        });
    }, [selectedDataField]);

    // Edit mode management
    const handleEdit = useCallback(() => {
        const currentData = Array.isArray(contextData) ? contextData : [];
        const normalizedData = normalizeTimeSeriesData(currentData, selectedDataField, currentFieldConfig, yearColumns);

        setOriginalData(isSingleMode ? rawContextData : contextData);
        setFormData(normalizedData);
        setIsEditing(true);
        setModifiedCells(new Set());
        setValidationErrors(new Map());
        setSaveAttempted(false);
    }, [contextData, rawContextData, isSingleMode, selectedDataField, currentFieldConfig, yearColumns]);

    const handleCancelWithConfirmation = useCallback(() => {
        if (hasUnsavedChanges) {
            confirm({
                title: 'Unsaved Changes',
                content: `You have ${modifiedCells.size} unsaved changes. Are you sure you want to cancel?`,
                okText: 'Yes, Cancel',
                okType: 'danger',
                cancelText: 'Keep Editing',
                onOk: () => {
                    setIsEditing(false);
                    setFormData(null);
                    setOriginalData(null);
                    setModifiedCells(new Set());
                    setValidationErrors(new Map());
                    setSaveAttempted(false);
                    onCancel?.();
                }
            });
        } else {
            setIsEditing(false);
            setFormData(null);
            setOriginalData(null);
            setModifiedCells(new Set());
            setValidationErrors(new Map());
            setSaveAttempted(false);
            onCancel?.();
        }
    }, [hasUnsavedChanges, modifiedCells.size, onCancel]);

    // Save operation
    const handleSave = useCallback(async () => {
        if (!canSaveComputed) {
            setSaveAttempted(true);
            return;
        }

        try {
            setSaveLoading(true);

            let processedData = trimTimeSeriesData(formData, selectedDataField, trimBlanks, trimValue);
            if (onBeforeSave) {
                processedData = await onBeforeSave(processedData);
            }

            const updates = buildBatchUpdates(
                processedData,
                originalData,
                rawContextData,
                isSingleMode,
                path,
                selectedDataField
            );

            if (affectedMetrics?.length > 0) {
                const metricUpdates = calculateAffectedMetrics(affectedMetrics, null, updates);
                Object.assign(updates, metricUpdates);
            }

            const result = await updateByPath(updates);

            if (result.isValid) {
                setIsEditing(false);
                setFormData(null);
                setOriginalData(null);
                setModifiedCells(new Set());
                setValidationErrors(new Map());
                setSaveAttempted(false);

                message.success(`${modifiedCells.size} changes saved successfully`);
                onAfterSave?.(result);
            } else {
                console.error('Save failed:', result.errors);
                message.error('Failed to save changes');
                onAfterSave?.(result);
            }

        } catch (error) {
            console.error('Save error:', error);
            message.error('An error occurred while saving');
            onAfterSave?.({ isValid: false, error: error.message });
        } finally {
            setSaveLoading(false);
        }
    }, [canSaveComputed, formData, selectedDataField, trimBlanks, trimValue, onBeforeSave, originalData, rawContextData, isSingleMode, path, affectedMetrics, updateByPath, modifiedCells.size, onAfterSave]);

    const handleSaveAttempt = useCallback(() => {
        setSaveAttempted(true);

        if (!hasUnsavedChanges) {
            message.info('No changes to save');
            return;
        }

        if (hasValidationErrors) {
            validateAllCells();
            message.error(`Please fix ${validationErrors.size} validation errors before saving`);
            return;
        }

        handleSave();
    }, [hasUnsavedChanges, hasValidationErrors, validationErrors.size, validateAllCells, handleSave]);

    // Data field change
    const handleDataFieldChangeWithConfirmation = useCallback((newFieldValue) => {
        if (isEditing && hasUnsavedChanges) {
            confirm({
                title: 'Switch Field',
                content: `You have ${modifiedCells.size} unsaved changes. Switching fields will lose these changes. Continue?`,
                okText: 'Yes, Switch',
                okType: 'danger',
                cancelText: 'Keep Current Field',
                onOk: () => {
                    setSelectedDataField(newFieldValue);
                    const newFieldConfig = dataFieldOptions.find(opt => opt.value === newFieldValue);
                    const normalizedData = normalizeTimeSeriesData(originalData, newFieldValue, newFieldConfig, yearColumns);
                    setFormData(normalizedData);
                    setModifiedCells(new Set());
                    setValidationErrors(new Map());
                    setSaveAttempted(false);
                }
            });
        } else {
            setSelectedDataField(newFieldValue);
            if (isEditing) {
                const newFieldConfig = dataFieldOptions.find(opt => opt.value === newFieldValue);
                const normalizedData = normalizeTimeSeriesData(originalData, newFieldValue, newFieldConfig, yearColumns);
                setFormData(normalizedData);
                setModifiedCells(new Set());
                setValidationErrors(new Map());
                setSaveAttempted(false);
            }
        }
    }, [isEditing, hasUnsavedChanges, modifiedCells.size, dataFieldOptions, originalData, yearColumns]);

    // Create controls props object
    const controlsProps = {
        isEditing,
        dataFieldOptions,
        selectedDataField,
        onDataFieldChange: handleDataFieldChangeWithConfirmation,
        onEdit: handleEdit,
        onSave: handleSaveAttempt,
        onCancel: handleCancelWithConfirmation,
        canSave: canSaveComputed,
        saveLoading,
        hasValidationErrors,
        saveAttempted,
        modifiedCellsCount: modifiedCells.size,
        validationErrorsCount: validationErrors.size,
        totalCells: (formData?.length || 0) * yearColumns.length,
        hasUnsavedChanges,
        fieldLabel: currentFieldConfig?.label || 'Data',
        showDataFieldSelector,
        showMetadata
    };

    // Effects
    useEffect(() => {
        if (saveAttempted && isEditing) {
            validateAllCells();
        }
    }, [saveAttempted, isEditing, validateAllCells]);


    const addCalculatedRowsAndColumns = useCallback((tableConfig, calcSummary, calcTotals, orientation) => {
        if (isEditing) return tableConfig; // No calculations in edit mode
        if (!calcSummary && !calcTotals) return tableConfig; // No calculations needed

        const newConfig = { ...tableConfig };
        let { rows, cols } = newConfig;

        // Get the underlying data source
        const dataSource = isEditing ? formData : contextData;
        if (!Array.isArray(dataSource) || dataSource.length === 0) {
            return tableConfig; // No data to calculate
        }

        const summaryLabel = styleOptions.summaryLabel || 'Summary';
        const totalsLabel = styleOptions.totalsLabel || 'Totals';

        // Build 2D data map: dataMap[rowIndex][colIndex] = value
        // This ONLY includes non-calculated rows and columns
        const dataMap = {};

        dataSource.forEach((contract, rowIndex) => {
            dataMap[rowIndex] = {};
            const timeSeries = contract[selectedDataField] || [];

            cols.forEach((col, colIndex) => {
                // CRITICAL: Only include non-calculated columns
                if (!col.isCalculated) {
                    const year = col.year;
                    const dataPoint = timeSeries.find(dp => dp.year === year);
                    dataMap[rowIndex][colIndex] = parseFloat(dataPoint?.value) || 0;
                }
            });
        });

        // Helper functions to collect data from the 2D map (ONLY non-calculated data)
        const collectRowData = (rowIndex) => {
            if (!dataMap[rowIndex]) return {};
            const filteredData = {};
            Object.keys(dataMap[rowIndex]).forEach(colIndex => {
                const numColIndex = parseInt(colIndex);
                const col = cols[numColIndex];
                if (col && !col.isCalculated) {
                    filteredData[numColIndex] = dataMap[rowIndex][colIndex];
                }
            });
            return filteredData;
        };

        const collectColData = (colIndex) => {
            const data = {};
            Object.keys(dataMap).forEach(rowIndex => {
                const numRowIndex = parseInt(rowIndex);
                const row = rows[numRowIndex];
                if (row && !row.isCalculated && dataMap[numRowIndex] && dataMap[numRowIndex][colIndex] !== undefined) {
                    data[numRowIndex] = dataMap[numRowIndex][colIndex];
                }
            });
            return data;
        };

        // NEW: Helper functions that include calculated rows/cols for totals
        const collectRowDataForTotals = (rowIndex) => {
            const data = collectRowData(rowIndex);

            // If we have calcSummary, add the summary column value
            if (calcSummary) {
                const summaryValue = calcSummary(data, orientation, styleOptions);
                data[originalColCount] = summaryValue; // Add summary at the end
            }

            return data;
        };

        const collectColDataForTotals = (colIndex) => {
            const data = collectColData(colIndex);

            // If we have calcSummary, add the summary row value
            if (calcSummary) {
                const summaryValue = calcSummary(data, orientation, styleOptions);
                data[originalRowCount] = summaryValue; // Add summary at the end
            }

            return data;
        };

        // Store original row/col counts before adding calculated ones
        const originalRowCount = rows.length;
        const originalColCount = cols.length;



        // Add summary column (horizontal) or summary row (vertical)
        if (calcSummary) {
            if (orientation === 'horizontal') {
                // Add summary column - collects data across years for each contract
                const summaryCol = {
                    key: 'summary-col',
                    year: summaryLabel,
                    timelineMarker: null,
                    colIndex: cols.length,
                    totalCols: cols.length + 1,
                    orientation,
                    isCalculated: true
                };

                cols = [...cols, summaryCol];

                // Update totalCols for existing columns
                cols.forEach(col => {
                    if (!col.isCalculated) col.totalCols = cols.length;
                });
            } else {
                // Add summary row - collects data across contracts for each year
                const summaryRow = {
                    key: 'summary-row',
                    year: summaryLabel,
                    timelineMarker: null,
                    rowIndex: rows.length,
                    totalRows: rows.length + 1,
                    orientation,
                    isCalculated: true
                };

                rows = [...rows, summaryRow];

                // Update totalRows for existing rows
                rows.forEach(row => {
                    if (!row.isCalculated) row.totalRows = rows.length;
                });
            }
        }

        // Add totals row (horizontal) or totals column (vertical)
        if (calcTotals) {
            if (orientation === 'horizontal') {
                const totalsRow = {
                    key: 'totals-row',
                    index: rows.length,
                    item: { name: totalsLabel },
                    name: totalsLabel,
                    rowIndex: rows.length,
                    totalRows: rows.length + 1,
                    orientation,
                    isCalculated: true
                };

                rows = [...rows, totalsRow];
                rows.forEach(row => {
                    if (!row.isCalculated) row.totalRows = rows.length;
                });
            } else {
                const totalsCol = {
                    key: 'totals-col',
                    index: cols.length,
                    item: { name: totalsLabel },
                    title: totalsLabel,
                    colIndex: cols.length,
                    totalCols: cols.length + 1,
                    orientation,
                    isCalculated: true
                };

                cols = [...cols, totalsCol];
                cols.forEach(col => {
                    if (!col.isCalculated) col.totalCols = cols.length;
                });
            }
        }

        // Update the config with new rows/cols
        newConfig.rows = rows;
        newConfig.cols = cols;

        // Enhance getCellData to handle calculated cells using the 2D data map
        const originalGetCellData = newConfig.getCellData;
        newConfig.getCellData = (rowData, colData) => {
            if (rowData.isCalculated && colData.isCalculated) {
                // This is the intersection cell (bottom-right)
                if ((rowData.key === 'totals-row' && colData.key === 'summary-col') ||
                    (rowData.key === 'summary-row' && colData.key === 'totals-col')) {

                    // Sum all the summary values
                    let grandTotal = 0;

                    if (orientation === 'horizontal') {
                        // Sum all contract summary values
                        for (let i = 0; i < originalRowCount; i++) {
                            const rowData = collectRowData(i);
                            if (Object.keys(rowData).length > 0) {
                                const summaryValue = calcSummary(rowData, orientation, styleOptions);
                                grandTotal += summaryValue || 0;
                            }
                        }
                    } else {
                        // Sum all year summary values
                        for (let i = 0; i < originalColCount; i++) {
                            const colData = collectColData(i);
                            if (Object.keys(colData).length > 0) {
                                const summaryValue = calcSummary(colData, orientation, styleOptions);
                                grandTotal += summaryValue || 0;
                            }
                        }
                    }

                    return {
                        value: grandTotal,
                        isCalculated: true,
                        className: 'content content-totals',
                        formatter: styleOptions.cellFormatter // Use cellFormatter instead of totalsFormatter
                    };
                }
            }

            // Handle calculated summary cells
            if (colData.isCalculated && calcSummary) {
                if (orientation === 'horizontal') {
                    // This is a summary column cell - collect data for this contract row
                    const contractIndex = rowData.index;
                    if (contractIndex !== undefined && contractIndex < originalRowCount) {
                        const data = collectRowData(contractIndex);
                        const value = calcSummary(data, orientation, styleOptions);
                        return { value, isCalculated: true, className: 'content content-summary', formatter: styleOptions.summaryFormatter };
                    }
                }
            }

            if (rowData.isCalculated && calcSummary) {
                if (orientation === 'vertical') {
                    // This is a summary row cell - collect data for this contract column
                    const contractIndex = colData.index;
                    if (contractIndex !== undefined && contractIndex < originalColCount) {
                        const data = collectColData(contractIndex);
                        const value = calcSummary(data, orientation, styleOptions);
                        return { value, isCalculated: true, className: 'content content-summary', formatter: styleOptions.summaryFormatter };
                    }
                }
            }

            // Handle calculated totals cells
            if (rowData.isCalculated && calcTotals) {
                if (orientation === 'horizontal') {
                    // This is a totals row cell - collect data for this year column
                    const yearColIndex = colData.colIndex;
                    if (yearColIndex !== undefined && yearColIndex < originalColCount) {
                        const data = collectColData(yearColIndex);
                        const value = calcTotals(data, orientation, styleOptions);
                        return { value, isCalculated: true, className: 'content content-totals', formatter: styleOptions.totalsFormatter };
                    }
                }
            }

            if (colData.isCalculated && calcTotals) {
                if (orientation === 'vertical') {
                    // This is a totals column cell - collect data for this year row
                    const yearRowIndex = rowData.rowIndex;
                    if (yearRowIndex !== undefined && yearRowIndex < originalRowCount) {
                        const data = collectRowData(yearRowIndex);
                        const value = calcTotals(data, orientation, styleOptions);
                        return { value, isCalculated: true, className: 'content content-totals', formatter: styleOptions.totalsFormatter };
                    }
                }
            }

            // Regular cell - use original logic
            return originalGetCellData(rowData, colData);
        };

        return newConfig;
    }, [isEditing, formData, contextData, selectedDataField, styleOptions]);

    // Table configuration and columns
    const tableConfig = useMemo(() => {
        const baseData = isEditing ? formData : contextData;
        const baseConfig = getTableConfiguration(
            orientation,
            yearColumns,
            baseData,
            selectedDataField,
            hideEmptyItems,
            isEditing,
            timelineMarkers || []
        );

        // Add calculated rows/columns if needed
        return addCalculatedRowsAndColumns(baseConfig, calcSummary, calcTotals, orientation);
    }, [orientation, yearColumns, isEditing, formData, contextData, selectedDataField, hideEmptyItems, timelineMarkers, calcSummary, calcTotals, addCalculatedRowsAndColumns]);

    const columns = useMemo(() => {
        const cols = generateTableColumns(
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
            null,
            null,
            styleOptions,
            calcSummary,
            calcTotals
        );

        // console.log('Total columns:', cols.length);
        // console.log('Column keys:', cols.map(c => c.key));
        // console.log('Columns with fixed left:', cols.filter(col => col.fixed === 'left'));
        // console.log('Fixed left count:', cols.filter(col => col.fixed === 'left').length);

        return cols;
    }, [orientation, tableConfig, selectedDataField, isEditing, currentFieldConfig, updateCellValue, modifiedCells, validationErrors, handleCellValidation, handleCellModification, styleOptions, calcSummary, calcTotals]);

    // Ensure data has unique keys using shared utility
    const tableDataWithKeys = useMemo(() => {
        return ensureUniqueKeys(tableConfig.rows, 'key');
    }, [tableConfig.rows]);
    console.log(columns[1]);
    // Generate CSS classes for timeline marker rows (vertical orientation)
    const getTimelineRowClasses = useCallback((record) => {
        if (orientation !== 'vertical' || !record.timelineMarker) return undefined;

        const classes = ['timeline-marker-row'];
        if (record.timelineMarker.tag) {
            classes.push(`timeline-marker-${record.timelineMarker.tag.toLowerCase().replace(/\s+/g, '-')}`);
        }

        return classes.join(' ');
    }, [orientation]);

    // Render controls based on placement
    const renderTableControls = () => {
        if (controlsPlacement === 'none') return null;

        if (controlsPlacement === 'external' && renderControls) {
            return null; // Controls are rendered by parent
        }

        return <TableControls {...controlsProps} />;
    };

    // For external rendering, make controls available to parent
    if (controlsPlacement === 'external' && renderControls) {
        return (
            <>
                {renderControls(controlsProps)}
                <div className={`table-container ${finalTheme.containerClass}`.trim()}>
                    {/* Apply theme CSS globally */}
                    <style jsx global>{finalTheme.cssRules}</style>

                    {/* Validation summary */}
                    <ValidationErrorSummary
                        validationErrors={validationErrors}
                        saveAttempted={saveAttempted}
                        onClose={() => setSaveAttempted(false)}
                    />

                    {/* Main table with CSS classes and timeline marker support */}
                    <Table
                        className={`table-base ${finalTheme.tableClass}`.trim()}
                        columns={columns}
                        dataSource={tableDataWithKeys}
                        rowKey="key"
                        pagination={false}
                        size={finalTheme.tableProps.size}
                        bordered={finalTheme.tableProps.bordered}
                        scroll={{ x: 'max-content' }}
                        rowClassName={getTimelineRowClasses}
                        onRow={orientation === 'vertical' ? (record) => {
                            const marker = record.timelineMarker;
                            return {
                                className: getTimelineRowClasses(record),
                                style: marker ? {
                                    backgroundColor: `${marker.color}08`,
                                    borderTop: `2px solid ${marker.color}30`,
                                    borderBottom: `1px solid ${marker.color}20`
                                } : {}
                            };
                        } : undefined}
                        {...tableProps}
                    />
                </div>
            </>
        );
    }

    // Main render for internal controls
    if (!contextData || contextData.length === 0) {
        return (
            <div className={`table-container ${finalTheme.containerClass}`.trim()}>
                <style jsx global>{finalTheme.cssRules}</style>
                {controlsPlacement === 'internal' && renderTableControls()}
                <Alert message="No data available" type="info" />
            </div>
        );
    }

    // Show data validation errors if any
    if (!dataValidation.isValid) {
        return (
            <div className={`table-container ${finalTheme.containerClass}`.trim()}>
                <style jsx global>{finalTheme.cssRules}</style>
                {controlsPlacement === 'internal' && renderTableControls()}
                <Alert
                    message="Data Structure Error"
                    description={`Table data validation failed: ${dataValidation.errors.join(', ')}`}
                    type="error"
                />
            </div>
        );
    }

    return (
        <div className={`table-container ${finalTheme.containerClass}`.trim()}>
            {/* Apply theme CSS globally */}
            <style jsx global>{finalTheme.cssRules}</style>

            {/* Header with controls - only if internal */}
            {controlsPlacement === 'internal' && (
                <div style={{ marginBottom: 16 }}>
                    {renderTableControls()}
                </div>
            )}

            {/* Validation summary */}
            <ValidationErrorSummary
                validationErrors={validationErrors}
                saveAttempted={saveAttempted}
                onClose={() => setSaveAttempted(false)}
            />

            {/* Main table with CSS classes and timeline marker support */}
            <Table
                className={`table-base ${finalTheme.tableClass}`.trim()}
                columns={columns}
                dataSource={tableDataWithKeys}
                rowKey="key"
                pagination={false}
                size={finalTheme.tableProps.size}
                bordered={finalTheme.tableProps.bordered}
                scroll={{ x: 'max-content' }}
                rowClassName={getTimelineRowClasses}
                onRow={orientation === 'vertical' ?
                    (record) => {
                        const marker = record.timelineMarker;
                        const baseRowClasses = getRowClasses(orientation);
                        const timelineClasses = getTimelineRowClasses(record);

                        return {
                            className: [baseRowClasses, timelineClasses].filter(Boolean).join(' '),
                            style: marker ? {
                                backgroundColor: `${marker.color}08`,
                                borderTop: `2px solid ${marker.color}30`,
                                borderBottom: `1px solid ${marker.color}20`
                            } : {}
                        };
                    } :
                    (record) => ({
                        className: getRowClasses(orientation)
                    })
                }
                {...tableProps}
            />
        </div>
    );
};

export default InlineEditTable;