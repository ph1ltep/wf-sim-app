// src/components/config/LocationDefaults.jsx
import React from 'react';
import { Typography, Card } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

// Custom hook for location data management
import useLocations from '../../hooks/useLocations';

// Components
import DatabaseTable from '../tables/DatabaseTable';
import LocationForm from './locations/LocationForm';
import { locationColumns } from '../tables/columns';
import { currencies } from './locations/currencyConstants';

const { Title } = Typography;

const LocationDefaults = () => {
  // Use the custom hook for location data and operations
  const { 
    locations, 
    loading, 
    createLocation,
    updateLocation,
    deleteLocation
  } = useLocations();
  
  // Render the location form for create/edit
  const renderLocationForm = (form, record) => {
    return (
      <LocationForm
        form={form}
        initialValues={record || {}}
        currencies={currencies}
      />
    );
  };

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
        style={{ marginBottom: 24 }}
      >
        <DatabaseTable
          columns={locationColumns()}
          dataSource={locations}
          rowKey="key"
          loading={loading}
          entityName="Location"
          onCreate={createLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
          renderForm={renderLocationForm}
          pagination={{ pageSize: 10 }}
          addActions={true}
        />
      </Card>
    </div>
  );
};

export default LocationDefaults;