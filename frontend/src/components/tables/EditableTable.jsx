// src/components/contextFields/EditableTable.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Table, Button, Modal, Alert, Form } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';

/**
 * EditableTable - Table with in-line editing capabilities connected to context arrays
 * 
 * @param {Object[]} columns - Table column definitions
 * @param {string[]} path - Path to the array in scenario context
 * @param {React.ReactNode[]} formFields - Array of field components to use in the edit form
 * @param {string} keyField - Name of the field to use as the unique key
 * @param {string} itemName - Display name for the items being edited
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
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [error, setError] = useState(null);
  
  // Get data and operations from context
  const { getValueByPath, updateByPath } = useScenario();
  const dataSource = getValueByPath(path, []);
  
  // Form state to manage the edited values
  const [editValues, setEditValues] = useState({});
  
  // Reset form values when editing item changes
  useEffect(() => {
    if (editingItem) {
      setEditValues({...editingItem});
    } else {
      setEditValues({});
    }
  }, [editingItem]);

  // Handle adding new item
  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setEditingItemIndex(null);
    setEditValues({});
    setError(null);
    setModalVisible(true);
  }, []);

  // Handle editing existing item
  const handleEdit = useCallback((record, index) => {
    setEditingItem(record);
    setEditingItemIndex(index);
    setEditValues({...record});
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

  // Handle form field changes
  const handleFieldChange = useCallback((fieldPath, value) => {
    setEditValues(prev => {
      const result = {...prev};
      // Handle nested paths
      if (Array.isArray(fieldPath) && fieldPath.length > 1) {
        let current = result;
        for (let i = 0; i < fieldPath.length - 1; i++) {
          if (!current[fieldPath[i]]) {
            current[fieldPath[i]] = {};
          }
          current = current[fieldPath[i]];
        }
        current[fieldPath[fieldPath.length - 1]] = value;
      } else {
        const field = Array.isArray(fieldPath) ? fieldPath[0] : fieldPath;
        result[field] = value;
      }
      return result;
    });
  }, []);

  // Handle saving the changes
  const handleSave = useCallback(() => {
    try {
      const newArray = [...dataSource];
      
      if (editingItemIndex !== null) {
        // Update existing item
        newArray[editingItemIndex] = {...editValues};
      } else {
        // Add new item
        const newItem = {...editValues};
        if (keyField && !newItem[keyField]) {
          // Generate a unique ID if needed
          newItem[keyField] = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        }
        newArray.push(newItem);
      }
      
      updateByPath(path, newArray);
      setModalVisible(false);
      setEditingItem(null);
      setEditingItemIndex(null);
    } catch (error) {
      console.error("Save error:", error);
      setError(`Error: ${error.message || "Failed to save"}`);
    }
  }, [dataSource, editValues, editingItemIndex, keyField, path, updateByPath]);

  // Render field components with values connected to the edit form
  const renderFormFields = () => {
    return formFields.map((field, index) => {
      // Clone the field and inject necessary props
      return React.cloneElement(field, {
        key: index,
        value: editValues[field.props.name] || field.props.defaultValue || null,
        onChange: (value) => handleFieldChange(field.props.name, value)
      });
    });
  };

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
        title={editingItem ? `Edit ${itemName}` : `Add ${itemName}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        {...modalProps}
      >
        <Form layout="vertical">
          {renderFormFields()}
          
          {error && (
            <Alert
              message="Error"
              description={error}
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