// src/components/tables/EditableTable.jsx
import React, { useState, useCallback } from 'react';
import { Table, Button, Modal, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useScenario } from '../../contexts/ScenarioContext';

// Import the Form component and custom fields
import { Form } from '../forms';

/**
 * EditableTable - Handles all CRUD operations using custom form fields
 * 
 * @param {Object[]} columns - Table column definitions
 * @param {string[]} path - Path to the data in scenario context
 * @param {Object[]} formFields - Array of field definitions using custom fields
 * @param {Object} validationSchema - Yup validation schema for the form
 * @param {string} keyField - Name of the field to use as the unique key
 */
const EditableTable = ({
    // Required props
    columns,
    path,
    formFields,

    // Validation
    validationSchema = null,

    // Optional configuration
    keyField = null,
    itemName = 'Item',
    idPrefix = itemName.toLowerCase().replace(/\s+/g, '_'),

    // Customization
    addButtonText = `Add ${itemName}`,
    showAddButton = true,
    tableSize = 'small',
    autoActions = true,

    // Table specific props
    pagination = false,

    // Additional behaviors
    transformBeforeSave = null,

    // Error handling
    errorText = null,

    // Additional props
    modalProps = {},
    tableProps = {}
}) => {
    // Determine the actual row key to use
    const rowKey = keyField || '_key';

    // Get data and operations from context
    const { getValueByPath, arrayOperations, hasValidScenario } = useScenario();
    const dataSource = getValueByPath(path, []);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [operationError, setOperationError] = useState(null);

    // Initialize form with React Hook Form
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: validationSchema ? yupResolver(validationSchema) : undefined
    });

    // Handle adding new item
    const handleAdd = useCallback(() => {
        setEditingItem(null);
        reset({});  // Clear the form
        setOperationError(null);
        setModalVisible(true);
    }, [reset]);

    // Handle editing existing item
    const handleEdit = useCallback((record) => {
        // Check if scenario is valid first
        if (!hasValidScenario()) {
            setOperationError("Cannot edit: No active scenario");
            return;
        }

        setEditingItem(record);
        reset(record);  // Set form values to record data
        setOperationError(null);
        setModalVisible(true);
    }, [reset, hasValidScenario]);

    // Handle deleting item
    const handleDelete = useCallback((record) => {
        // Check if scenario is valid first
        if (!hasValidScenario()) {
            setOperationError("Cannot delete: No active scenario");
            return;
        }

        // Get the ID for deletion
        const id = record[rowKey];

        // Make sure we have an ID
        if (id === undefined) {
            console.error(`Row is missing the key field '${rowKey}':`, record);
            setOperationError(`Cannot delete: Item missing key field (${rowKey})`);
            return;
        }

        // Delete the item
        try {
            const success = arrayOperations(path, 'remove', null, id);
            console.log(`Delete operation for ${id} success:`, success);

            if (!success) {
                setOperationError("Failed to delete item");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            setOperationError(`Error: ${error.message || "Failed to delete item"}`);
        }
    }, [arrayOperations, path, rowKey, hasValidScenario]);

    // Handle form submission (save data)
    // Inside EditableTable.jsx, update the onSubmit function:
    const onSubmit = useCallback(async (data) => {
        try {
            // Check if scenario is valid first
            if (!hasValidScenario()) {
                setOperationError("Cannot save: No active scenario");
                return;
            }

            setOperationError(null);

            // Transform data if needed
            let dataToSave = transformBeforeSave ? transformBeforeSave(data) : data;

            // Handle key field for new items
            if (!editingItem) {
                if (keyField) {
                    // When using keyField, check for duplicates
                    const keyValue = dataToSave[keyField];
                    if (keyValue === undefined) {
                        setOperationError(`${keyField} is required`);
                        return;
                    }

                    const isDuplicate = dataSource.some(item =>
                        item[keyField] === keyValue
                    );

                    if (isDuplicate) {
                        setOperationError(`A ${itemName.toLowerCase()} with ${keyField} "${keyValue}" already exists`);
                        return;
                    }
                } else {
                    // When not using keyField, generate a unique _key
                    dataToSave = {
                        ...dataToSave,
                        _key: `${idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    };
                }
            }

            console.log('EditableTable: Starting operation', {
                type: editingItem ? 'update' : 'add',
                data: dataToSave
            });

            let success;
            if (editingItem) {
                // Get the ID for updating
                const id = editingItem[keyField || rowKey];
                success = arrayOperations(path, 'update', dataToSave, id);
            } else {
                success = arrayOperations(path, 'add', dataToSave);
            }

            if (success) {
                console.log(`EditableTable: ${editingItem ? 'Update' : 'Add'} operation completed for ${itemName}`);
                setModalVisible(false);
            } else {
                setOperationError("Operation failed, please try again");
            }
        } catch (error) {
            console.error('Save error:', error);
            setOperationError(`Error: ${error.message || "Failed to save"}`);
        }
    }, [
        dataSource,
        editingItem,
        transformBeforeSave,
        arrayOperations,
        path,
        rowKey,
        keyField,
        idPrefix,
        hasValidScenario,
        itemName
    ]);

    // Use exactly the columns provided - don't filter anything
    const finalColumns = [...columns];

    // Add actions column if auto-actions is enabled and no existing actions column
    if (autoActions) {
        // Check if an actions column already exists
        const hasActionsColumn = finalColumns.some(col => col.key === 'actions' || col.dataIndex === 'actions');

        if (!hasActionsColumn) {
            // Add actions column
            finalColumns.push({
                title: 'Actions',
                key: 'actions',
                width: 120,
                render: (_, record) => (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </div>
                )
            });
        }
    }

    return (
        <div className="editable-table">
            {/* Error messages */}
            {(errorText || operationError) && (
                <Alert
                    message="Error"
                    description={operationError || errorText}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                    closable
                    onClose={() => setOperationError(null)}
                />
            )}

            {/* Add button */}
            {showAddButton && (
                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        {addButtonText}
                    </Button>
                </div>
            )}

            {/* Main table */}
            <Table
                dataSource={dataSource}
                columns={finalColumns}
                rowKey={rowKey}
                pagination={pagination}
                size={tableSize}
                {...tableProps}
            />

            {/* Add/Edit Modal */}
            <Modal
                title={editingItem ? `Edit ${itemName}` : `Add ${itemName}`}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleSubmit(onSubmit)}
                confirmLoading={isSubmitting}
                {...modalProps}
            >
                <Form
                    onSubmit={handleSubmit(onSubmit)}
                    submitButtons={false}
                >
                    {formFields.map(field => {
                        // Skip internal key field from form if it's auto-generated
                        if (!keyField && field.name === '_key') {
                            return null;
                        }

                        // Pass the control prop to each field component
                        return React.cloneElement(field, {
                            key: field.name,
                            control,
                            error: errors[field.name]?.message
                        });
                    })}

                    {operationError && (
                        <Alert
                            message="Error"
                            description={operationError}
                            type="error"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default EditableTable;