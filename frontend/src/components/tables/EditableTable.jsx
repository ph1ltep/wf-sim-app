// src/components/tables/EditableTable.jsx
import React, { useState, useCallback } from 'react';
import { Table, Button, Modal, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import ContextForm from '../contextFields/ContextForm';

/**
 * EditableTable - Table with in-line editing capabilities connected to context arrays
 */
const EditableTable = ({
  // Required props
  columns,
  path,
  formFields,

  // Optional configuration
  keyField = 'id',
  itemName = 'Item',
  addButtonText = `Add ${itemName}`,
  showAddButton = true,
  tableSize = 'small',
  autoActions = true,

  // Table specific props
  pagination = false,

  // Error handling
  errorText = null,

  // Additional props
  modalProps = {},
  tableProps = {}
}) => {
  // State for the edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [error, setError] = useState(null);

  // Get data and operations from context
  const { getValueByPath, updateByPath } = useScenario();
  const dataSource = getValueByPath(path, []);

  // Handle adding new item
  const handleAdd = useCallback(() => {
    setEditingItemIndex(null);
    setError(null);
    setModalVisible(true);
  }, []);

  // Handle editing existing item
  const handleEdit = useCallback((record, index) => {
    setEditingItemIndex(index);
    setError(null);
    setModalVisible(true);
  }, []);

  // Handle deleting item
  const handleDelete = useCallback((index) => {
    try {
      const newArray = [...dataSource];
      newArray.splice(index, 1);
      updateByPath(path, newArray);
    } catch (error) {
      console.error("Error deleting item:", error);
      setError("Failed to delete item");
    }
  }, [dataSource, path, updateByPath]);

  // Handle saving changes
  const handleSave = useCallback((formValues) => {
    try {
      const newArray = [...dataSource];

      if (editingItemIndex !== null) {
        // If editing an existing item, the context is already updated
        // We just need to close the modal
      } else {
        // For new items, we need to add to the array
        const newItem = formValues;

        // Generate a unique ID if needed
        if (keyField && !newItem[keyField]) {
          newItem[keyField] = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        }

        newArray.push(newItem);
        updateByPath(path, newArray);
      }

      setModalVisible(false);
      setEditingItemIndex(null);
    } catch (error) {
      console.error("Save error:", error);
      setError(`Error: ${error.message || "Failed to save"}`);
    }
  }, [dataSource, editingItemIndex, keyField, path, updateByPath]);

  // Handle modal cancel
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingItemIndex(null);
    setError(null);
  }, []);

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
        render: (_, record, index) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record, index)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(index)}
            />
          </div>
        )
      });
    }
  }

  return (
    <div className="editable-table">
      {/* Error messages */}
      {(errorText || error) && (
        <Alert
          message="Error"
          description={error || errorText}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
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
        rowKey={keyField}
        pagination={pagination}
        size={tableSize}
        {...tableProps}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingItemIndex !== null ? `Edit ${itemName}` : `Add ${itemName}`}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        {...modalProps}
      >
        <ContextForm
          path={editingItemIndex !== null
            ? [...path, editingItemIndex]
            : [...path, 'temp_new_item']
          }
          onSubmit={handleSave}
          onCancel={handleCancel}
          layout="vertical"
        >
          {formFields}

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </ContextForm>
      </Modal>
    </div>
  );
};

export default EditableTable;