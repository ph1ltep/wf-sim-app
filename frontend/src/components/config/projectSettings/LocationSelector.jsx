// src/components/config/projectSettings/LocationSelector.jsx
import React, { useState } from 'react';
import { Card, Row, Col, Select, Button, Tag } from 'antd';
import { GlobalOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * Component for selecting location defaults
 */
const LocationSelector = ({ 
  locations = [], 
  loading = false,
  selectedLocation, 
  onLocationChange, 
  onLoadDefaults 
}) => {
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);
  
  const handleLoadDefaults = () => {
    onLoadDefaults();
    setDefaultsLoaded(true);
  };

  return (
    <Card 
      title={
        <span>
          <GlobalOutlined style={{ marginRight: 8 }} />
          Location Selection
        </span>
      } 
      style={{ marginBottom: 24 }}
      extra={selectedLocation && defaultsLoaded && (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Using {selectedLocation.country} ({selectedLocation.countryCode?.toUpperCase()})
        </Tag>
      )}
    >
      <Row gutter={16}>
        <Col span={18}>
          <Select 
            placeholder="Select a location to load defaults"
            style={{ width: '100%' }}
            onChange={(value) => {
              onLocationChange(value);
              setDefaultsLoaded(false); // Reset when location changes
            }}
            loading={loading}
            disabled={loading || locations.length === 0}
            value={selectedLocation?._id}
          >
            {locations.map(location => (
              <Option key={location._id} value={location._id}>
                {location.country} ({location.countryCode?.toUpperCase()}) - {location.currency}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Button 
            type="primary" 
            onClick={handleLoadDefaults}
            disabled={!selectedLocation || loading}
            loading={loading}
          >
            Load Defaults
          </Button>
        </Col>
      </Row>
      <p style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
        Loading a location will override capacity factor, electricity price, inflation rate, 
        local currency, foreign currency, and exchange rate settings with country-specific defaults.
      </p>
    </Card>
  );
};

export default LocationSelector;