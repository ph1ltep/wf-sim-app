// src/components/tables/DatabaseTable.jsx
import React, { useState } from 'react';
import { Table, Button, Modal, Form, Space, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { createActionsColumn } from './columns';

/**
 * A reusable table component for CRUD operations with database entities
 * 
 * @param {Object} props Component props
 * @param {Array} props.columns Table column definitions
 * @param {Array} props.dataSource Data to display in the table
 * @param {Function} props.onCreate Function to create a new entity
 * @param {Function} props.onUpdate Function to update an entity
 * @param {Function} props.onDelete Function to delete an entity
 * @param {Function} props.renderForm Function that renders the form for create/edit
 * @param {string} props.entityName Name of the entity for labels (e.g., "Location", "OEM Scope")
 * @param {boolean} props.loading Whether data is loading
 * @param {Object} props.pagination Pagination configuration
 * @param {boolean} props.addActions Whether to add edit/delete actions column
 * @param {Object} props.actionsConfig Configuration for the actions column
 * @param {React.ReactNode} props.headerExtra Extra content for the table header
 * @param {Object} props.expandable Expandable row configuration
 */
const DatabaseTable = ({
  columns,
  dataSource = [],
  onCreate,
  onUpdate,
  onDelete,
  renderForm,
  entityName = 'Item',
  loading = false,
  pagination = { pageSize: 10 },
  addActions = true,
  actionsConfig = {},
  headerExtra,
  expandable,
  rowKey = 'id',
  ...tableProps
}) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Handle opening modal for creating new entity
  const handleAdd = () => {
    form.resetFields();
    setEditingRecord(null);
    setModalVisible(true);
  };

  // Handle opening modal for editing entity
  const handleEdit = (record) => {
    form.resetFields();
    form.setFieldsValue(record);
    setEditingRecord(record);
    setModalVisible(true);
  };

  // Handle saving form data (create or update)
  const handleSave = async () => {
    try {
      setConfirmLoading(true);
      const values = await form.validateFields();
      
      if (editingRecord) {
        // Update existing record
        await onUpdate(editingRecord.id || editingRecord._id || editingRecord.key, values);
      } else {
        // Create new record
        await onCreate(values);
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Form validation or save error:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  // Handle deleting entity
  const handleDelete = async (id) => {
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // Create columns with actions if needed
  const tableColumns = [...columns];
  
  if (addActions && onUpdate && onDelete) {
    // Check if actions column already exists
    const hasActionsColumn = columns.some(col => 
      col.key === 'actions' || col.dataIndex === 'actions'
    );
    
    if (!hasActionsColumn) {
      // Add actions column
      tableColumns.push(
        createActionsColumn(
          handleEdit, 
          handleDelete, 
          actionsConfig
        )
      );
    }
  }

  return (
    <div className="database-table">
      {/* Table header with add button */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}
      >
        <div>
          {headerExtra}
        </div>
        <div>
          {onCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              Add {entityName}
            </Button>
          )}
        </div>
      </div>

      {/* Main table */}
      <Table
        columns={tableColumns}
        dataSource={dataSource}
        rowKey={rowKey}
        pagination={pagination}
        loading={loading}
        expandable={expandable}
        locale={{
          emptyText: <Empty description={`No ${entityName} data`} />
        }}
        {...tableProps}
      />

      {/* Create/Edit Modal */}
      {renderForm && (
        <Modal
          title={editingRecord ? `Edit ${entityName}` : `Add ${entityName}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={handleSave}
          confirmLoading={confirmLoading}
          destroyOnClose={true}
          maskClosable={false}
        >
          {renderForm(form, editingRecord)}
        </Modal>
      )}
    </div>
  );
};

export default DatabaseTable;