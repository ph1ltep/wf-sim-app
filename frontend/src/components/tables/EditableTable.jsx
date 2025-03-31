// src/components/tables/EditableTable.jsx
import React, { useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

/**
 * EditableTable - Handles all CRUD operations internally
 * 
 * @param {Object[]} columns - Table column definitions
 * @param {string[]} path - Path to the data in scenario context
 * @param {Object} formSchema - Form definition for add/edit modal
 * @param {string} itemName - Name of the item (for modal titles)
 * @param {Function} validate - Custom validation function before save
 * @param {Function} transformBeforeSave - Transform data before saving
 * @param {Object} modalProps - Additional props for the modal
 * @param {Object} tableProps - Additional props for the table
 */
const EditableTable = ({
    // Required props
    columns,
    path,
    formSchema,

    // Optional configuration
    itemName = 'Item',
    rowKey = 'id',
    idPrefix = itemName.toLowerCase().replace(/\s+/g, '_'),

    // Customization
    addButtonText = `Add ${itemName}`,
    showAddButton = true,
    tableSize = 'small',

    // Table specific props
    pagination = false,

    // Validation & transformation
    validate = null,
    transformBeforeSave = null,

    // Error handling
    errorText = null,

    // Additional props
    modalProps = {},
    tableProps = {}
}) => {
    // Get data and operations from context
    const { getValueByPath, arrayOperations } = useScenario();
    const dataSource = getValueByPath(path, []);

    // Form and modal state
    const [form] = Form.useForm();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);

    // Handle adding new item
    const handleAdd = useCallback(() => {
        // Reset form and open modal
        form.resetFields();
        setEditingItem(null);
        setModalVisible(true);
    }, [form]);

    // Handle editing existing item
    const handleEdit = useCallback((record) => {
        // Set form values and open modal
        form.resetFields();
        form.setFieldsValue(record);
        setEditingItem(record);
        setModalVisible(true);
    }, [form]);

    // Handle deleting item
    const handleDelete = useCallback((id) => {
        // Perform validation if needed
        if (validate && typeof validate.beforeDelete === 'function') {
            const canDelete = validate.beforeDelete(
                dataSource.find(item => item[rowKey] === id),
                dataSource
            );

            if (canDelete === false) {
                return;
            }
        }

        // Delete the item
        arrayOperations(path, 'remove', null, id);
    }, [arrayOperations, path, dataSource, validate, rowKey]);

    // Handle saving (add/update)
    const handleSave = useCallback(async () => {
        try {
            setLoading(true);

            // Validate form
            const values = await form.validateFields();

            // Perform custom validation if provided
            if (validate && typeof validate.beforeSave === 'function') {
                const validationResult = await validate.beforeSave(
                    values,
                    editingItem,
                    dataSource
                );

                if (validationResult === false) {
                    setLoading(false);
                    return;
                }
            }

            // Transform data if needed
            let dataToSave = values;
            if (transformBeforeSave) {
                dataToSave = transformBeforeSave(values, editingItem);
            }

            if (editingItem) {
                // Update existing item
                arrayOperations(path, 'update', dataToSave, editingItem[rowKey]);
            } else {
                // Add new item with generated ID
                arrayOperations(path, 'add', {
                    ...dataToSave,
                    [rowKey]: dataToSave[rowKey] || `${idPrefix}_${Date.now()}`
                });
            }

            // Close modal
            setModalVisible(false);
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setLoading(false);
        }
    }, [
        form, validate, transformBeforeSave, editingItem,
        dataSource, arrayOperations, path, rowKey, idPrefix
    ]);

    // Prepare final columns - replace any actions column with our handlers
    const finalColumns = columns.map(column => {
        // Check if this is an actions column (has 'actions' key)
        if (column.key === 'actions') {
            // Create a new actions column that uses our handlers
            return {
                ...column,
                render: (_, record) => {
                    // Replace the render function to use our handlers
                    return column.render ? column.render(
                        _, 
                        record, 
                        { 
                            handleEdit: () => handleEdit(record), 
                            handleDelete: () => handleDelete(record[rowKey]) 
                        }
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            />
                            <Popconfirm
                                title={`Are you sure you want to delete this ${itemName.toLowerCase()}?`}
                                onConfirm={() => handleDelete(record[rowKey])}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </div>
                    );
                }
            };
        }
        return column;
    });

    // Render form items
    const renderFormItems = () => {
        if (!formSchema || !Array.isArray(formSchema)) {
            return <div>No form schema provided</div>;
        }

        return formSchema.map((item, index) => (
            <Form.Item
                key={item.name || `form-item-${index}`}
                name={item.name}
                label={item.label}
                rules={item.rules}
                dependencies={item.dependencies}
                tooltip={item.tooltip}
            >
                {item.render(form, editingItem)}
            </Form.Item>
        ));
    };

    return (
        <div className="editable-table">
            {/* Error message if provided */}
            {errorText && (
                <Alert
                    message="Error"
                    description={errorText}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
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
                onOk={handleSave}
                confirmLoading={loading}
                {...modalProps}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    {renderFormItems()}
                </Form>
            </Modal>
        </div>
    );
};
//tets
export default EditableTable;

