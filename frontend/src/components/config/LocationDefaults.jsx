// src/components/config/LocationDefaults.jsx
import React from 'react';
import { Typography, Card, Alert, Button } from 'antd';
import { GlobalOutlined, ReloadOutlined } from '@ant-design/icons';

// Custom hook for location data management
import useLocations from '../../hooks/useLocations';

// Components
import DatabaseTable from '../tables/DatabaseTable';
import LocationForm from './locations/LocationForm';
import { getLocationColumns } from './locations/locationColumns';
import { currencies } from './locations/currencyConstants';

const { Title } = Typography;

const LocationDefaults = () => {
  // Use the custom hook for location data and operations
  const {
    locations,
    loading,
    error,
    fetchLocations,
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

  // Header extra content with refresh button
  const headerExtra = (
    <Button
      icon={<ReloadOutlined />}
      onClick={fetchLocations}
      loading={loading}
    >
      Refresh
    </Button>
  );

  return (
    <div>
      <Title level={2}>Location Defaults</Title>
      <p>Manage default settings for different country locations.</p>

      {error && (
        <Alert
          message="Error Loading Locations"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Card
        title={
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            Country Defaults
          </span>
        }
        extra={headerExtra}
        style={{ marginBottom: 24 }}
      >
        <DatabaseTable
          columns={getLocationColumns()}
          dataSource={locations}
          rowKey="key"
          loading={loading}
          entityName="Location"
          onCreate={createLocation}
          onUpdate={updateLocation}
          onDelete={deleteLocation}
          renderForm={renderLocationForm}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} locations`
          }}
          addActions={true}
          modalProps={{
            width: 620  // Increased from default (~520px) to 900px
          }}
        />
      </Card>
    </div>
  );
};

export default LocationDefaults;