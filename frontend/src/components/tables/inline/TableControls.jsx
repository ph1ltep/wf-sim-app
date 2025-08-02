// src/components/tables/inline/TableControls.jsx - Enhanced for external rendering
import React from 'react';
import { Button, Space, Typography, Select } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { TableHeaderMetadata } from './TableMetadata';

const { Text } = Typography;

/**
 * Data field selector dropdown
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
    isEditing = false,
    showMetadata = true
}) => (
    <Space>
        {showMetadata && (
            <TableHeaderMetadata
                changeCount={modifiedCellsCount}
                errorCount={validationErrorsCount}
                totalCells={totalCells}
                isEditing={isEditing}
            />
        )}
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

/**
 * Combined table controls - can be rendered internally or externally
 */
export const TableControls = ({
    isEditing,
    dataFieldOptions,
    selectedDataField,
    onDataFieldChange,
    onEdit,
    onSave,
    onCancel,
    canSave,
    saveLoading,
    hasValidationErrors,
    saveAttempted,
    modifiedCellsCount,
    validationErrorsCount,
    totalCells,
    hasUnsavedChanges,
    fieldLabel,
    showDataFieldSelector = true,
    showMetadata = true,
    layout = 'horizontal' // 'horizontal' or 'vertical'
}) => {
    const dataFieldSelector = showDataFieldSelector ? (
        <DataFieldSelector
            dataFieldOptions={dataFieldOptions}
            selectedDataField={selectedDataField}
            onChange={onDataFieldChange}
            disabled={isEditing && saveLoading}
            hasUnsavedChanges={isEditing && hasUnsavedChanges}
        />
    ) : null;

    const editControls = isEditing ? (
        <EditModeControls
            onSave={onSave}
            onCancel={onCancel}
            canSave={canSave}
            saveLoading={saveLoading}
            hasValidationErrors={hasValidationErrors}
            saveAttempted={saveAttempted}
            modifiedCellsCount={modifiedCellsCount}
            validationErrorsCount={validationErrorsCount}
            totalCells={totalCells}
            isEditing={isEditing}
            showMetadata={showMetadata}
        />
    ) : (
        <ViewModeControls
            onEdit={onEdit}
            disabled={!dataFieldOptions || dataFieldOptions.length === 0}
            fieldLabel={fieldLabel}
        />
    );

    if (layout === 'vertical') {
        return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {dataFieldSelector}
                {editControls}
            </Space>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
        }}>
            {dataFieldSelector}
            {editControls}
        </div>
    );
};