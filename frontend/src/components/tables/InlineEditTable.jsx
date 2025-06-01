// src/components/tables/InlineEditTable.jsx - Refactored and simplified
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Alert, message, Modal } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateAffectedMetrics } from '../../utils/metricsUtils';
import { validateCellValue } from './inline/EditableCell';
import { ValidationErrorSummary } from './inline/TableMetadata';
import { DataFieldSelector, EditModeControls, ViewModeControls } from './inline/TableControls';
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

const { confirm } = Modal;

/**
 * InlineEditTable - Simplified table component with form isolation for editing time series data
 * 
 * @param {Array} path - Path to the parent array/object in context
 * @param {Array} dataFieldOptions - Array of field configuration objects for editing
 * @param {Object} yearRange - Year range configuration { min: number, max: number }
 * @param {boolean} trimBlanks - Whether to remove entries with null/empty values on save (default: true)
 * @param {any} trimValue - Specific value to remove on save (e.g., 0 for default percentages)
 * @param {boolean} showMetadata - Whether to show expandable row metadata with statistics (default: true)
 * @param {boolean} hideEmptyItems - Whether to hide empty rows/columns in read mode (default: false)
 * @param {Function} metadataRenderer - Custom metadata renderer function
 * @param {Array} affectedMetrics - Array of metric names to recalculate on save
 * @param {Function} onBeforeSave - Intercept and transform data before updateByPath call
 * @param {Function} onAfterSave - Handle save result after updateByPath completes
 * @param {Function} onCancel - Handle cancel action when user exits edit mode
 * @param {string} orientation - Table orientation ('horizontal' or 'vertical', default: 'horizontal')
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
    ...tableProps
}) => {
    // Validation
    if (!path || !Array.isArray(path)) {
        throw new Error('InlineEditTable: path prop is required and must be an array');
    }
    if (!dataFieldOptions || dataFieldOptions.length === 0) {
        throw new Error('InlineEditTable: dataFieldOptions prop is required and must not be empty');
    }

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

    // Data preparation
    const rawContextData = getValueByPath(path, []);
    const isSingleMode = isSingleObjectMode(rawContextData);
    const contextData = isSingleMode ? [rawContextData] : (Array.isArray(rawContextData) ? rawContextData : []);

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

    // Validate all cells
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

            // Process data
            let processedData = trimTimeSeriesData(formData, selectedDataField, trimBlanks, trimValue);
            if (onBeforeSave) {
                processedData = await onBeforeSave(processedData);
            }

            // Build updates
            const updates = buildBatchUpdates(
                processedData,
                originalData,
                rawContextData,
                isSingleMode,
                path,
                selectedDataField
            );

            // Add metrics
            if (affectedMetrics?.length > 0) {
                const metricUpdates = calculateAffectedMetrics(affectedMetrics, null, updates);
                Object.assign(updates, metricUpdates);
            }

            // Save
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
    }, [canSaveComputed, formData, selectedDataField, trimBlanks, onBeforeSave, originalData, rawContextData, isSingleMode, path, affectedMetrics, updateByPath, modifiedCells.size, onAfterSave]);

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

    // Effects
    useEffect(() => {
        if (saveAttempted && isEditing) {
            validateAllCells();
        }
    }, [saveAttempted, isEditing, validateAllCells]);

    // Table configuration and columns
    const tableConfig = useMemo(() => {
        const baseData = isEditing ? formData : contextData;
        return getTableConfiguration(orientation, yearColumns, baseData, selectedDataField, hideEmptyItems, isEditing);
    }, [orientation, yearColumns, isEditing, formData, contextData, selectedDataField, hideEmptyItems]);

    const columns = useMemo(() => {
        return generateTableColumns(
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
        );
    }, [
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
    ]);

    // Render helpers
    const renderDataFieldSelector = () => (
        <DataFieldSelector
            dataFieldOptions={dataFieldOptions}
            selectedDataField={selectedDataField}
            onChange={handleDataFieldChangeWithConfirmation}
            disabled={isEditing && saveLoading}
            hasUnsavedChanges={isEditing && hasUnsavedChanges}
        />
    );

    const renderEditControls = () => {
        if (!isEditing) {
            return (
                <ViewModeControls
                    onEdit={handleEdit}
                    disabled={!contextData || contextData.length === 0}
                    fieldLabel={currentFieldConfig?.label || 'Data'}
                />
            );
        }

        return (
            <EditModeControls
                onSave={handleSaveAttempt}
                onCancel={handleCancelWithConfirmation}
                canSave={canSaveComputed}
                saveLoading={saveLoading}
                hasValidationErrors={hasValidationErrors}
                saveAttempted={saveAttempted}
                modifiedCellsCount={modifiedCells.size}
                validationErrorsCount={validationErrors.size}
                totalCells={(formData?.length || 0) * yearColumns.length}
                isEditing={isEditing}
            />
        );
    };

    // Main render
    if (!contextData || contextData.length === 0) {
        return (
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}>
                    {renderDataFieldSelector()}
                    {renderEditControls()}
                </div>
                <Alert message="No data available" type="info" />
            </div>
        );
    }

    return (
        <div className="inline-edit-table">
            {/* Header with controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
            }}>
                {renderDataFieldSelector()}
                {renderEditControls()}
            </div>

            {/* Validation summary */}
            <ValidationErrorSummary
                validationErrors={validationErrors}
                saveAttempted={saveAttempted}
                onClose={() => setSaveAttempted(false)}
            />

            {/* Main table */}
            <Table
                columns={columns}
                dataSource={tableConfig.rows}
                rowKey={(record) =>
                    orientation === 'vertical'
                        ? `year-${record.year}`
                        : `contract-${record.index}`
                }
                pagination={false}
                size="small"
                scroll={{ x: 'max-content' }}
                {...tableProps}
            />
        </div>
    );
};

export default InlineEditTable;