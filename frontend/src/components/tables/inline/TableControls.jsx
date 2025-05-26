// src/components/tables/inline/TableControls.jsx - Reusable table control components
import React from 'react';
import { Button, Space, Typography, Select } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { TableHeaderMetadata } from './TableMetadata';

const { Text } = Typography;

/**
 * Data field selector dropdown
 * @param {Array} dataFieldOptions - Available field options
 * @param {string} selectedDataField - Currently selected field
 * @param {Function} onChange - Change handler
 * @param {boolean} disabled - Whether selector is disabled
 * @param {boolean} hasUnsavedChanges - Whether there are unsaved changes
 * @returns {JSX.Element|null} Field selector or null if single option
 */
export const DataFieldSelector = ({ 
    dataFieldOptions = [], 
    selectedDataField, 
    onChange, 
    disabled = false,
    hasUnsavedChanges = false 
}) => {
    if (dataFieldOptions.length <= 1) return null;
    
    return (
        <Space>
            <Text>Field:</Text>
            <Select
                value={selectedDataField}
                onChange={onChange}
                disabled={disabled}
                style={{ minWidth: 120 }}
            >
                {dataFieldOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                        {option.label}
                    </Select.Option>
                ))}
            </Select>
            {hasUnsavedChanges && (
                <Text type="warning" style={{ fontSize: '11px' }}>
                    (unsaved changes)
                </Text>
            )}
        </Space>
    );
};

/**
 * Edit mode controls with save/cancel buttons and metadata
 * @param {Object} props - Control properties
 * @returns {JSX.Element} Edit controls
 */
export const EditModeControls = ({
    onSave,
    onCancel,
    canSave = false,
    saveLoading = false,
    hasValidationErrors = false,
    saveAttempted = false,
    modifiedCellsCount = 0,
    validationErrorsCount = 0,
    totalCells = 0,
    isEditing = false
}) => (
    <Space>
        <TableHeaderMetadata
            changeCount={modifiedCellsCount}
            errorCount={validationErrorsCount}
            totalCells={totalCells}
            isEditing={isEditing}
        />
        <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            disabled={saveLoading}
        >
            Cancel
        </Button>
        <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={onSave}
            loading={saveLoading}
            disabled={!canSave}
            danger={saveAttempted && hasValidationErrors}
        >
            Save
            {modifiedCellsCount > 0 && ` (${modifiedCellsCount})`}
            {saveAttempted && hasValidationErrors && ` - ${validationErrorsCount} errors`}
        </Button>
    </Space>
);

/**
 * View mode controls with edit button
 * @param {Object} props - Control properties
 * @returns {JSX.Element} View controls
 */
export const ViewModeControls = ({
    onEdit,
    disabled = false,
    fieldLabel = 'Data'
}) => (
    <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={onEdit}
        disabled={disabled}
    >
        Edit {fieldLabel}
    </Button>
);