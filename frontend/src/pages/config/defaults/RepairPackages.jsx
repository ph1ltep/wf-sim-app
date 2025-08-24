// frontend/src/pages/config/defaults/RepairPackages.jsx
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table, Input, Select, Space } from 'antd';
import { PlusOutlined, ToolOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';

// Custom hook for repair package data management
import useRepairPackages from 'hooks/useRepairPackages';

// Component imports
import RepairPackageForm from 'components/forms/repairPackages/RepairPackageForm';
import { getRepairPackageColumns } from 'components/forms/repairPackages/repairPackageColumns';
import RepairPackageDetails from 'components/forms/repairPackages/RepairPackageDetails';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Repair package categories for filtering
const REPAIR_PACKAGE_CATEGORIES = [
  { value: 'major', label: 'Major', color: '#f50' },
  { value: 'medium', label: 'Medium', color: '#fa8c16' },
  { value: 'minor', label: 'Minor', color: '#52c41a' },
  { value: 'electronic', label: 'Electronic', color: '#1890ff' },
  { value: 'blade', label: 'Blade', color: '#722ed1' }
];

const RepairPackages = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [currentRepairPackage, setCurrentRepairPackage] = useState({});
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Use the custom hook for repair package data and operations
  const {
    repairPackages,
    loading,
    createRepairPackage,
    updateRepairPackage,
    deleteRepairPackage,
    cloneRepairPackage
  } = useRepairPackages();

  // Filter data based on search and filters
  const filteredData = repairPackages.filter(item => {
    const matchesSearch = !searchText || 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.isActive) ||
      (statusFilter === 'inactive' && !item.isActive) ||
      (statusFilter === 'default' && item.isDefault);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle opening the form modal for adding a new repair package
  const handleAdd = () => {
    form.resetFields();
    setCurrentRepairPackage({});
    setFormType('add');
    setModalVisible(true);
  };

  // Handle opening the form modal for editing an existing repair package
  const handleEdit = (record) => {
    setCurrentRepairPackage(record);
    setFormType('edit');
    setModalVisible(true);
  };

  // Handle deleting a repair package
  const handleDelete = async (id) => {
    await deleteRepairPackage(id);
  };

  // Handle cloning a repair package
  const handleClone = async (id) => {
    await cloneRepairPackage(id);
  };

  // Handle saving the form data
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // Ensure nested objects have proper structure for current schema
      const formattedValues = {
        ...values,
        costs: {
          material: { perEventEUR: 0, perDayEUR: 0 },
          labor: { perEventEUR: 0, perDayEUR: 0 },
          tooling: { perEventEUR: 0, perDayEUR: 0 },
          crane: { perEventEUR: 0, perDayEUR: 0 },
          other: { perEventEUR: 0, perDayEUR: 0 },
          ...values.costs
        },
        crane: {
          type: 'none',
          minimumDays: 0,
          ...values.crane
        },
        appliesTo: {
          componentCategories: [],
          ...values.appliesTo
        }
      };

      if (formType === 'add') {
        await createRepairPackage(formattedValues);
      } else {
        await updateRepairPackage(currentRepairPackage.key, formattedValues);
      }

      setModalVisible(false);
    } catch (error) {
      // Form validation error - no action needed as the form will show error messages
      console.error('Validation failed:', error);
    }
  };

  // Handle cancelling form editing
  const handleCancel = () => {
    setModalVisible(false);
  };

  // Get table columns with handler functions
  const columns = getRepairPackageColumns(handleEdit, handleDelete, handleClone);

  return (
    <div>
      <Title level={2}>Repair Package Defaults</Title>
      <p>Manage default repair packages for different component failures and maintenance activities.</p>

      <Card
        title={
          <span>
            <ToolOutlined style={{ marginRight: 8 }} />
            Repair Package Configuration
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Repair Package
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {/* Search and Filter Controls */}
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Search
              placeholder="Search repair packages..."
              allowClear
              enterButton={<SearchOutlined />}
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
            />
            
            <Select
              placeholder="Filter by category"
              style={{ width: 150 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Categories</Option>
              {REPAIR_PACKAGE_CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  <span style={{ color: cat.color }}>● </span>
                  {cat.label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Filter by status"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="default">Default</Option>
            </Select>
          </Space>

          <span style={{ color: '#666', fontSize: '14px' }}>
            {filteredData.length} of {repairPackages.length} packages
          </span>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} repair packages`
          }}
          loading={loading}
          expandable={{
            expandedRowRender: record => <RepairPackageDetails record={record} />,
          }}
        />
      </Card>

      <Modal
        title={formType === 'add' ? 'Add Repair Package' : 'Edit Repair Package'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        width={900}
        style={{ top: 20 }}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSave} loading={loading}>
            {formType === 'add' ? 'Create Package' : 'Update Package'}
          </Button>,
        ]}
        destroyOnClose
      >
        <RepairPackageForm
          form={form}
          initialValues={currentRepairPackage}
        />
      </Modal>
    </div>
  );
};

export default RepairPackages;