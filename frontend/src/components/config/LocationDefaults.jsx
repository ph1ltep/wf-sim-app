// src/components/config/LocationDefaults.jsx
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table } from 'antd';
import { PlusOutlined, GlobalOutlined } from '@ant-design/icons';

// Custom hook for location data management
import useLocations from '../../hooks/useLocations';

// Component imports
import LocationForm from './locations/LocationForm';
import { getLocationColumns } from './locations/locationColumns';
import { currencies } from './locations/currencyConstants';

const { Title } = Typography;

const LocationDefaults = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [currentLocation, setCurrentLocation] = useState({});
  
  // Use the custom hook for location data and operations
  const { 
    locations, 
    loading, 
    createLocation,
    updateLocation,
    deleteLocation
  } = useLocations();
  
  // Handle opening the form modal for adding a new location
  const handleAdd = () => {
    form.resetFields();
    setCurrentLocation({});
    setFormType('add');
    setModalVisible(true);
  };
  
  // Handle opening the form modal for editing an existing location
  const handleEdit = (record) => {
    setCurrentLocation(record);
    setFormType('edit');
    setModalVisible(true);
  };
  
  // Handle deleting a location
  const handleDelete = async (id) => {
    await deleteLocation(id);
  };
  
  // Handle saving the form data
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (formType === 'add') {
        await createLocation(values);
      } else {
        await updateLocation(currentLocation.key, values);
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
  const columns = getLocationColumns(handleEdit, handleDelete);

  return (
    <div>
      <Title level={2}>Location Defaults</Title>
      <p>Manage default settings for different country locations.</p>
      
      <Card 
        title={
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            Country Defaults
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Location
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table 
          columns={columns} 
          dataSource={locations} 
          rowKey="key"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>
      
      <Modal
        title={formType === 'add' ? 'Add Location' : 'Edit Location'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSave} loading={loading}>
            Save
          </Button>,
        ]}
      >
        <LocationForm
          form={form}
          initialValues={currentLocation}
          currencies={currencies}
        />
      </Modal>
    </div>
  );
};

export default LocationDefaults;