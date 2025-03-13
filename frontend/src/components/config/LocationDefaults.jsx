// src/components/config/LocationDefaults.jsx
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Form, 
  Input, 
  InputNumber, 
  Card, 
  Button, 
  Row, 
  Col, 
  Table, 
  Space, 
  Popconfirm, 
  message, 
  Select,
  Modal
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined, 
  UndoOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';
import { 
  getAllLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation 
} from '../../api/locations';

const { Title } = Typography;
const { Option } = Select;

// Currency options - comprehensive list of major world currencies
const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'HKD', label: 'Hong Kong Dollar (HKD)' },
  { value: 'NZD', label: 'New Zealand Dollar (NZD)' },
  { value: 'SEK', label: 'Swedish Krona (SEK)' },
  { value: 'KRW', label: 'South Korean Won (KRW)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  { value: 'NOK', label: 'Norwegian Krone (NOK)' },
  { value: 'MXN', label: 'Mexican Peso (MXN)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'RUB', label: 'Russian Ruble (RUB)' },
  { value: 'ZAR', label: 'South African Rand (ZAR)' },
  { value: 'TRY', label: 'Turkish Lira (TRY)' },
  { value: 'BRL', label: 'Brazilian Real (BRL)' },
  { value: 'TWD', label: 'Taiwan Dollar (TWD)' },
  { value: 'DKK', label: 'Danish Krone (DKK)' },
  { value: 'PLN', label: 'Polish Złoty (PLN)' },
  { value: 'THB', label: 'Thai Baht (THB)' },
  { value: 'IDR', label: 'Indonesian Rupiah (IDR)' },
  { value: 'CZK', label: 'Czech Koruna (CZK)' },
  { value: 'AED', label: 'UAE Dirham (AED)' },
  { value: 'MYR', label: 'Malaysian Ringgit (MYR)' },
  { value: 'PHP', label: 'Philippine Peso (PHP)' },
];

const LocationDefaults = () => {
  const [form] = Form.useForm();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  
  // Fetch locations data when component mounts
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const response = await getAllLocations();
        
        // Transform data format - add key property for Table
        const transformedData = response.data.map(location => ({
          key: location._id,
          ...location
        }));
        
        setLocations(transformedData);
      } catch (error) {
        message.error('Failed to fetch locations');
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);
  
  const isEditing = (record) => record.key === editingKey;
  
  const edit = (record) => {
    form.setFieldsValue({
      country: '',
      countryCode: '',
      inflationRate: 0,
      capacityFactor: 0,
      energyPrice: 0,
      currency: 'USD',
      exchangeRate: 1.0,
      ...record,
    });
    setEditingKey(record.key);
    setFormType('edit');
    setModalVisible(true);
  };
  
  const add = () => {
    form.resetFields();
    setFormType('add');
    setModalVisible(true);
  };

  const handleDeleteLocation = async (key) => {
    try {
      setLoading(true);
      await deleteLocation(key);
      
      // Update local state after successful deletion
      const newData = locations.filter(item => item.key !== key);
      setLocations(newData);
      
      message.success('Location deleted successfully');
    } catch (error) {
      message.error('Failed to delete location');
      console.error('Error deleting location:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const save = async () => {
    try {
      const row = await form.validateFields();
      setLoading(true);
      
      if (formType === 'add') {
        // Create new location record
        const response = await createLocation(row);
        const newLocation = {
          key: response.data._id,
          ...response.data
        };
        
        setLocations([...locations, newLocation]);
        message.success('Location added successfully');
      } else {
        // Update existing record
        const response = await updateLocation(editingKey, row);
        
        // Update local state
        const newData = [...locations];
        const index = newData.findIndex(item => editingKey === item.key);
        
        if (index > -1) {
          const updatedLocation = {
            key: editingKey,
            ...response.data
          };
          newData.splice(index, 1, updatedLocation);
          setLocations(newData);
          message.success('Location updated successfully');
        }
      }
      
      setModalVisible(false);
      setEditingKey('');
    } catch (error) {
      if (error.name === 'ValidationError' || error.response?.status === 400) {
        message.error(error.response?.data?.error || 'Validation failed. Please check your inputs.');
      } else {
        message.error(formType === 'add' ? 'Failed to add location' : 'Failed to update location');
        console.error('Error saving location:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const cancel = () => {
    setModalVisible(false);
    setEditingKey('');
  };
  
  const columns = [
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      sorter: (a, b) => a.country.localeCompare(b.country),
    },
    {
      title: 'Country Code',
      dataIndex: 'countryCode',
      key: 'countryCode',
    },
    {
      title: 'Inflation Rate (%)',
      dataIndex: 'inflationRate',
      key: 'inflationRate',
      render: value => `${value}%`,
    },
    {
      title: 'Capacity Factor (%)',
      dataIndex: 'capacityFactor',
      key: 'capacityFactor',
      render: value => `${value}%`,
    },
    {
      title: 'Energy Price',
      dataIndex: 'energyPrice',
      key: 'energyPrice',
      render: (value, record) => `${value} ${record.currency}/MWh`,
    },
    {
      title: 'Local Currency',
      dataIndex: 'currency',
      key: 'currency',
    },
    {
      title: 'Foreign Currency',
      dataIndex: 'foreignCurrency',
      key: 'foreignCurrency',
    },
    {
      title: 'Foreign/Local FX',
      dataIndex: 'exchangeRate',
      key: 'exchangeRate',
      render: (value, record) => `1 ${record.foreignCurrency} = ${value} ${record.currency}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        return (
          <Space size="small">
            <Button 
              icon={<EditOutlined />} 
              type="text" 
              onClick={() => edit(record)}
            />
            <Popconfirm
              title="Are you sure you want to delete this location?"
              onConfirm={() => handleDeleteLocation(record.key)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} type="text" danger />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

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
            onClick={add}
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
        visible={modalVisible}
        onOk={save}
        onCancel={cancel}
        footer={[
          <Button key="cancel" onClick={cancel}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={save}>
            Save
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true, message: 'Please enter country name' }]}
              >
                <Input placeholder="e.g., United States" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="countryCode"
                label="Country Code"
                rules={[{ required: true, message: 'Please enter country code' }]}
              >
                <Input placeholder="e.g., us" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="inflationRate"
                label="Inflation Rate (%)"
                rules={[{ required: true, message: 'Please enter inflation rate' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  step={0.1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="capacityFactor"
                label="Capacity Factor (%)"
                rules={[{ required: true, message: 'Please enter capacity factor' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  step={0.5}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="energyPrice"
            label="Energy Price (per MWh)"
            rules={[{ required: true, message: 'Please enter energy price' }]}
          >
            <InputNumber
              min={0}
              step={1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="Local Currency"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select placeholder="Select local currency">
                  {currencies.map(currency => (
                    <Option key={currency.value} value={currency.value}>{currency.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="foreignCurrency"
                label="Foreign Currency"
                rules={[{ required: true, message: 'Please select foreign currency' }]}
              >
                <Select placeholder="Select foreign currency">
                  {currencies.map(currency => (
                    <Option key={currency.value} value={currency.value}>{currency.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="exchangeRate"
            label="Foreign/Local Exchange Rate"
            help="Enter rate as: 1 foreign currency = ? local currency"
            rules={[{ required: true, message: 'Please enter exchange rate' }]}
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
              formatter={value => `${value}`}
              parser={value => value}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LocationDefaults;