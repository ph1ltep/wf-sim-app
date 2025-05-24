// src/components/tables/EditableTable.jsx - Always include hidden ID field
import React, { useState, useCallback } from 'react';
import { Table, Button, Modal, Alert, Space, Form, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import ContextForm from '../forms/ContextForm';

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

  // Summary row support
  showSummary = false,
  renderSummary = null,

  // Form layout props
  formLayout = 'vertical',
  formCompact = false,
  formResponsive = false,
  formLabelCol,
  formWrapperCol,
  formProps = {},

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

  // Get data safely - ensure it's always an array
  const dataFromContext = getValueByPath(path, null);
  const dataSource = Array.isArray(dataFromContext) ? dataFromContext : [];

  // Generate a unique ID for new items
  const generateUniqueId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 9);
    return `${itemName.toLowerCase()}_${timestamp}_${random}`;
  }, [itemName]);

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

  // Handle saving changes - Generate ID for new items before validation
  const handleSave = useCallback((formValues) => {
    try {
      const newArray = [...dataSource];

      if (editingItemIndex !== null && editingItemIndex >= 0) {
        // Editing existing item - update in place
        newArray[editingItemIndex] = {
          ...newArray[editingItemIndex],
          ...formValues
        };
      } else {
        // Adding new item - the ID should already be in formValues from hidden field
        newArray.push(formValues);
      }

      updateByPath(path, newArray);
      setModalVisible(false);
      setEditingItemIndex(null);
    } catch (error) {
      console.error("Save error:", error);
      setError(`Error: ${error.message || "Failed to save"}`);
    }
  }, [dataSource, editingItemIndex, path, updateByPath]);

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

  // Generate summary row
  const summary = showSummary && renderSummary ? (data) => {
    const summaryData = renderSummary(data);
    if (!summaryData) return null;

    return (
      <Table.Summary.Row>
        {finalColumns.map((column, index) => {
          const dataIndex = column.dataIndex;
          return (
            <Table.Summary.Cell key={index} index={index}>
              {summaryData[dataIndex] || null}
            </Table.Summary.Cell>
          );
        })}
      </Table.Summary.Row>
    );
  } : undefined;

  // Calculate modal width based on layout
  const getModalWidth = () => {
    if (modalProps.width) return modalProps.width;

    // Adjust modal width based on form layout
    switch (formLayout) {
      case 'horizontal':
        return formCompact ? 600 : 800;
      case 'inline':
        return formCompact ? 500 : 700;
      default: // vertical
        return formCompact ? 400 : 520;
    }
  };

  // Determine if we're in add mode
  const isAddMode = editingItemIndex === null;
  const formPath = isAddMode
    ? [...path, dataSource.length]
    : [...path, editingItemIndex];

  // Get the initial ID value
  const getInitialIdValue = () => {
    if (isAddMode) {
      // Add mode: generate new ID
      return generateUniqueId();
    } else {
      // Edit mode: use existing ID from the record
      const existingRecord = dataSource[editingItemIndex];
      return existingRecord?.[keyField] || generateUniqueId();
    }
  };

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
        dataSource={Array.isArray(dataSource) ? dataSource : []}
        columns={finalColumns}
        rowKey={keyField}
        pagination={pagination}
        size={tableSize}
        summary={summary}
        {...tableProps}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={isAddMode ? `Add ${itemName}` : `Edit ${itemName}`}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        width={getModalWidth()}
        {...modalProps}
      >
        <ContextForm
          key={`${isAddMode ? 'add' : 'edit'}-${editingItemIndex}`}
          path={formPath}
          onSubmit={handleSave}
          onCancel={handleCancel}
          layout={formLayout}
          compact={formCompact}
          responsive={formResponsive}
          labelCol={formLabelCol}
          wrapperCol={formWrapperCol}
          {...formProps}
        >
          {/* Always include hidden ID field - populated based on mode */}
          <Form.Item
            name={keyField}
            initialValue={getInitialIdValue()}
            style={{ display: 'none' }}
          >
            <Input type="hidden" />
          </Form.Item>

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