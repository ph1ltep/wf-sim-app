// src/components/config/LocationDefaults.jsx
import React from 'react';
import { Typography, Card, Alert, Button } from 'antd';
import { GlobalOutlined, ReloadOutlined, BankOutlined, LineChartOutlined, PieChartOutlined, FileTextOutlined } from '@ant-design/icons';

// Custom hook for location data management
import useLocations from '../../hooks/useLocations';

// Components
import DatabaseTable from '../tables/DatabaseTable';
import LocationForm from './locations/LocationForm';
import { createTextColumn, createPercentageColumn, createNumberColumn, createIconColumn } from '../tables/columns';
import { currencies } from './locations/currencyConstants';

const { Title } = Typography;

// Location columns definition
const locationColumns = () => [
  createTextColumn('country', 'Country', {
    sorter: true,
  }),
  createTextColumn('countryCode', 'Country Code'),
  createPercentageColumn('inflationRate', 'Inflation Rate'),
  createPercentageColumn('capacityFactor', 'Capacity Factor'),
  createNumberColumn('energyPrice', 'Energy Price', {
    render: (value, record) => `${value} ${record.currency}/MWh`,
  }),
  createTextColumn('currency', 'Local Currency'),
  createTextColumn('foreignCurrency', 'Foreign Currency'),
  createTextColumn('exchangeRate', 'Foreign/Local FX', {
    render: (value, record) => `1 ${record.foreignCurrency} = ${value} ${record.currency}`,
  }),
  createIconColumn('Financial Parameters', [
    {
      key: 'costOfConstructionDebt',
      icon: <BankOutlined />,
      tooltip: (record) => `Construction Debt: ${record.costOfConstructionDebt}%`,
      color: '#1890ff'
    },
    {
      key: 'costOfOperationalDebt',
      icon: <BankOutlined />,
      tooltip: (record) => `Operational Debt: ${record.costOfOperationalDebt}%`,
      color: '#52c41a'
    },
    {
      key: 'costofEquity',
      icon: <LineChartOutlined />,
      tooltip: (record) => `Cost of Equity: ${record.costofEquity}%`,
      color: '#fa8c16'
    },
    {
      key: 'debtRatio',
      icon: <PieChartOutlined />,
      tooltip: (record) => `Debt Ratio: ${record.debtRatio}%`,
      color: '#722ed1'
    },
    {
      key: 'effectiveTaxRate',
      icon: <FileTextOutlined />,
      tooltip: (record) => `Tax Rate: ${record.effectiveTaxRate}%`,
      color: '#eb2f96'
    }
  ], {
    width: 150
  })
];

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
          columns={locationColumns()}
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
        />
      </Card>
    </div>
  );
};

export default LocationDefaults;