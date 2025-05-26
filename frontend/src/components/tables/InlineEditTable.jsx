// src/components/tables/InlineEditTable.jsx - Inline editing table with form isolation
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Select, Alert, message, Modal } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateAffectedMetrics } from '../../utils/metricsUtils';
import EditableCell, { validateCellValue } from './inline/EditableCell';
import { 
    calculateRowStats, 
    CompactMetadataRenderer, 
    ValidationErrorSummary 
} from './inline/TableMetadata';
import { 
    DataFieldSelector, 
    EditModeControls, 
    ViewModeControls 
} from './inline/TableControls';
import { get, set } from 'lodash';

const { Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

/**
 * InlineEditTable - Table component with form isolation for editing time series data
 * 
 * @param {Array} path - Path to the parent array in context (e.g., ['settings', 'modules', 'contracts', 'oemContracts'])
 * @param {Array} dataFieldOptions - Array of field configuration objects for editing
 *   Each object should contain:
 *   - value: string - Field name in the data object (e.g., 'fixedFeeTimeSeries')
 *   - label: string - Display name for the field (e.g., 'Annual Fees')
 *   - type: string - Field type for validation and rendering ('currency', 'percentage', 'number')
 *   - validation: object - Validation rules { min: number, max: number, precision: number }
 *   - defaultValueField: string - Field name to use as default value for new entries (e.g., 'fixedFee')
 * @param {Object} yearRange - Year range configuration { min: number, max: number }
 *   Defines the columns/years to display. Can include negative years (e.g., { min: -5, max: 20 })
 * @param {boolean} trimBlanks - Whether to remove entries with null/empty values on save (default: true)
 * @param {boolean} showMetadata - Whether to show expandable row metadata with statistics (default: true)
 * @param {Function} metadataRenderer - Custom metadata renderer function (rowData, stats, errors) => ReactNode
 *   Called for each expandable row. Receives row data, calculated statistics, and validation errors
 * @param {Array} affectedMetrics - Array of metric names to recalculate on save (e.g., ['contractCosts'])
 * @param {Function} onBeforeSave - Intercept and transform data before updateByPath call
 *   Receives processed data array, should return modified data array. Use for computed fields like averages
 * @param {Function} onAfterSave - Handle save result after updateByPath completes
 *   Receives updateByPath result object { isValid, applied, errors }
 * @param {Function} onCancel - Handle cancel action when user exits edit mode
 * @param {string} orientation - Table orientation ('horizontal' or 'vertical', default: 'horizontal')
 *   Horizontal: contracts as rows, years as columns. Vertical: years as rows, contracts as columns
 */
const InlineEditTable = ({
    path,
    dataFieldOptions = [],
    yearRange = { min: 1, max: 20 },
    trimBlanks = true,
    showMetadata = true,
    metadataRenderer,
    affectedMetrics = [],
    onBeforeSave,
    onAfterSave,
    onCancel,
    orientation = 'horizontal',
    ...tableProps
}) => {
    // Get scenario context
    const { getValueByPath, updateByPath } = useScenario();

    // Validate required props
    if (!path || !Array.isArray(path)) {
        throw new Error('InlineEditTable: path prop is required and must be an array');
    }

    if (!dataFieldOptions || dataFieldOptions.length === 0) {
        throw new Error('InlineEditTable: dataFieldOptions prop is required and must not be empty');
    }

    // Component state
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [selectedDataField, setSelectedDataField] = useState(dataFieldOptions[0]?.value);
    const [modifiedCells, setModifiedCells] = useState(new Set());
    const [validationErrors, setValidationErrors] = useState(new Map());
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveAttempted, setSaveAttempted] = useState(false);

    // Get current data from context
    const contextData = getValueByPath(path, []);
    
    // Computed states
    const hasUnsavedChanges = modifiedCells.size > 0;
    const hasValidationErrors = validationErrors.size > 0;
    const currentFieldConfig = dataFieldOptions.find(opt => opt.value === selectedDataField);

    // Enhanced canSave computation with validation check
    const canSaveComputed = useMemo(() => {
        return hasUnsavedChanges && !hasValidationErrors && !saveLoading;
    }, [hasUnsavedChanges, hasValidationErrors, saveLoading]);

    // Generate year columns
    const yearColumns = useMemo(() => {
        const years = [];
        for (let year = yearRange.min; year <= yearRange.max; year++) {
            years.push(year);
        }
        return years;
    }, [yearRange]);

    // Data normalization - ensure all contracts have complete time series for the year range
    const normalizeTimeSeriesData = useCallback((contracts, selectedField, fieldConfig) => {
        if (!contracts || !Array.isArray(contracts)) return [];
        
        return contracts.map(contract => {
            const timeSeries = contract[selectedField] || [];
            const defaultValue = fieldConfig?.defaultValueField ? 
                (contract[fieldConfig.defaultValueField] || 0) : 0;
            const normalizedSeries = [];
            
            yearColumns.forEach(year => {
                const existing = timeSeries.find(dp => dp.year === year);
                normalizedSeries.push(existing || { 
                    year, 
                    value: defaultValue 
                });
            });
            
            return { ...contract, [selectedField]: normalizedSeries };
        });
    }, [yearColumns]);

    // Trim blank entries from time series
    const trimTimeSeriesData = useCallback((contracts, selectedField) => {
        if (!trimBlanks) return contracts;
        
        return contracts.map(contract => ({
            ...contract,
            [selectedField]: (contract[selectedField] || []).filter(dp => 
                dp.value !== null && 
                dp.value !== undefined && 
                dp.value !== '' &&
                !isNaN(dp.value)
            )
        }));
    }, [trimBlanks]);

    // Enhanced cell modification tracking with better performance
    const handleCellModification = useCallback((cellKey) => {
        setModifiedCells(prev => {
            if (prev.has(cellKey)) return prev; // Already modified, no change needed
            return new Set([...prev, cellKey]);
        });
    }, []);

    // Enhanced cell validation with error aggregation
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

    // Batch validation for all visible cells (used when saveAttempted changes)
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

    // Update cell value in form data
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

   // Enter edit mode
   const handleEdit = useCallback(() => {
       const currentData = Array.isArray(contextData) ? contextData : [];
       const normalizedData = normalizeTimeSeriesData(currentData, selectedDataField, currentFieldConfig);
       
       setOriginalData(currentData);
       setFormData(normalizedData);
       setIsEditing(true);
       setModifiedCells(new Set());
       setValidationErrors(new Map());
       setSaveAttempted(false);
   }, [contextData, selectedDataField, currentFieldConfig, normalizeTimeSeriesData]);

   // Enhanced cancel with confirmation for unsaved changes
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
                   
                   if (onCancel) {
                       onCancel();
                   }
               }
           });
       } else {
           setIsEditing(false);
           setFormData(null);
           setOriginalData(null);
           setModifiedCells(new Set());
           setValidationErrors(new Map());
           setSaveAttempted(false);
           
           if (onCancel) {
               onCancel();
           }
       }
   }, [hasUnsavedChanges, modifiedCells.size, onCancel]);

   // Save changes
   const handleSave = useCallback(async () => {
       if (!canSaveComputed) {
           setSaveAttempted(true);
           return;
       }

       try {
           setSaveLoading(true);
           
           // 1. Apply trimming if enabled
           let processedData = trimTimeSeriesData(formData, selectedDataField);
           
           // 2. Call onBeforeSave for custom processing
           if (onBeforeSave) {
               processedData = await onBeforeSave(processedData);
           }
           
           // 3. Build batch update
           const updates = {};
           const pathString = Array.isArray(path) ? path.join('.') : path;
           
           processedData.forEach((contract, index) => {
               // Update the time series data
               updates[`${pathString}.${index}.${selectedDataField}`] = contract[selectedDataField];
               
               // Update any computed fields from onBeforeSave
               Object.keys(contract).forEach(key => {
                   if (key !== selectedDataField && 
                       JSON.stringify(contract[key]) !== JSON.stringify(originalData[index]?.[key])) {
                       updates[`${pathString}.${index}.${key}`] = contract[key];
                   }
               });
           });
           
           // Add metrics if specified
           if (affectedMetrics?.length > 0) {
               const metricUpdates = calculateAffectedMetrics(affectedMetrics, null, updates);
               Object.assign(updates, metricUpdates);
           }
           
           // 4. Single batch updateByPath
           const result = await updateByPath(updates);
           
           // 5. Handle result
           if (result.isValid) {
               setIsEditing(false);
               setFormData(null);
               setOriginalData(null);
               setModifiedCells(new Set());
               setValidationErrors(new Map());
               setSaveAttempted(false);
               
               message.success(`${modifiedCells.size} changes saved successfully`);
               
               if (onAfterSave) {
                   onAfterSave(result);
               }
           } else {
               console.error('Save failed:', result.errors);
               message.error('Failed to save changes');
               if (onAfterSave) {
                   onAfterSave(result);
               }
           }
           
       } catch (error) {
           console.error('Save error:', error);
           message.error('An error occurred while saving');
           if (onAfterSave) {
               onAfterSave({ isValid: false, error: error.message });
           }
       } finally {
           setSaveLoading(false);
       }
   }, [canSaveComputed, formData, selectedDataField, trimTimeSeriesData, onBeforeSave, path, originalData, affectedMetrics, updateByPath, modifiedCells.size, onAfterSave]);

   // Enhanced save attempt handler
   const handleSaveAttempt = useCallback(() => {
       setSaveAttempted(true);
       
       if (!hasUnsavedChanges) {
           message.info('No changes to save');
           return;
       }
       
       if (hasValidationErrors) {
           // Re-validate all cells to ensure we catch any missed errors
           validateAllCells();
           message.error(`Please fix ${validationErrors.size} validation errors before saving`);
           return;
       }
       
       // Proceed with actual save
       handleSave();
   }, [hasUnsavedChanges, hasValidationErrors, validationErrors.size, validateAllCells, handleSave]);

   // Enhanced data field change with unsaved changes handling
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
                   
                   // Re-normalize data for new field
                   const newFieldConfig = dataFieldOptions.find(opt => opt.value === newFieldValue);
                   const normalizedData = normalizeTimeSeriesData(originalData, newFieldValue, newFieldConfig);
                   setFormData(normalizedData);
                   setModifiedCells(new Set());
                   setValidationErrors(new Map());
                   setSaveAttempted(false);
               }
           });
       } else {
           setSelectedDataField(newFieldValue);
           
           if (isEditing) {
               // Re-normalize data for new field
               const newFieldConfig = dataFieldOptions.find(opt => opt.value === newFieldValue);
               const normalizedData = normalizeTimeSeriesData(originalData, newFieldValue, newFieldConfig);
               setFormData(normalizedData);
               setModifiedCells(new Set());
               setValidationErrors(new Map());
               setSaveAttempted(false);
           }
       }
   }, [isEditing, hasUnsavedChanges, modifiedCells.size, dataFieldOptions, normalizeTimeSeriesData, originalData]);

   // Effect to validate all cells when saveAttempted becomes true
   useEffect(() => {
       if (saveAttempted && isEditing) {
           validateAllCells();
       }
   }, [saveAttempted, isEditing, validateAllCells]);

   // Render data field selector
   const renderDataFieldSelector = () => (
       <DataFieldSelector
           dataFieldOptions={dataFieldOptions}
           selectedDataField={selectedDataField}
           onChange={handleDataFieldChangeWithConfirmation}
           disabled={isEditing && saveLoading}
           hasUnsavedChanges={isEditing && hasUnsavedChanges}
       />
   );

   // Render edit controls
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

   // Render validation summary
   const renderValidationSummary = () => (
       <ValidationErrorSummary
           validationErrors={validationErrors}
           saveAttempted={saveAttempted}
           onClose={() => setSaveAttempted(false)}
       />
   );

   // Table columns with editable cells
   const columns = useMemo(() => {
       const baseColumns = [
           {
               title: 'Contract',
               dataIndex: 'name',
               key: 'name',
               fixed: 'left',
               width: 200,
               render: (text, record, index) => (
                   <div style={{ fontWeight: 500 }}>
                       {text || `Contract ${index + 1}`}
                   </div>
               )
           }
       ];
       
       // Add year columns with editable cells
       const yearCols = yearColumns.map(year => ({
           title: `Year ${year}`,
           key: `year-${year}`,
           width: 120,
           align: 'center',
           render: (_, record, rowIndex) => {
               const timeSeriesData = record[selectedDataField] || [];
               const dataPoint = timeSeriesData.find(dp => dp.year === year);
               const value = dataPoint?.value;
               
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
           }
       }));
       
       return [...baseColumns, ...yearCols];
   }, [
       yearColumns, 
       selectedDataField, 
       isEditing, 
       currentFieldConfig, 
       modifiedCells, 
       validationErrors, 
       handleCellValidation, 
       handleCellModification, 
       updateCellValue
   ]);

   // Expandable row configuration
   const expandableConfig = useMemo(() => {
       if (!showMetadata || !isEditing) return undefined;
       
       return {
           expandedRowRender: (record, index) => {
               const timeSeries = record[selectedDataField] || [];
               const stats = calculateRowStats(timeSeries);
               
               if (metadataRenderer) {
                   return metadataRenderer(record, stats);
               }
               
               return (
                   <CompactMetadataRenderer
                       rowData={record}
                       stats={stats}
                       fieldConfig={currentFieldConfig}
                   />
               );
           },
           rowExpandable: () => true,
           defaultExpandAllRows: false
       };
   }, [showMetadata, isEditing, selectedDataField, metadataRenderer, currentFieldConfig]);

   // Basic table structure
   const displayData = isEditing ? formData : contextData;
   
   if (!displayData || displayData.length === 0) {
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
           {renderValidationSummary()}

           {/* Main table */}
           <Table
               columns={columns}
               dataSource={displayData}
               rowKey="id"
               pagination={false}
               size="small"
               scroll={{ x: 'max-content' }}
               expandable={expandableConfig}
               {...tableProps}
           />
       </div>
   );
};

export default InlineEditTable;