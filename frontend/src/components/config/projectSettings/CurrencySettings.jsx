// src/components/config/projectSettings/CurrencySettings.jsx
import React from 'react';
import { Form, InputNumber, Select, Card, Row, Col, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { currencies } from '../locations/currencyConstants';

const { Option } = Select;

/**
 * Component for currency settings form
 */
const CurrencySettings = ({ fieldsFromLocations }) => {
  return (
    <Card title="Currency Settings" style={{ marginBottom: 24 }}>
      <Row gutter={24}>
        <Col span={8}>
          <Form.Item
            label={
              <span>
                Local Currency
                {fieldsFromLocations.currency && 
                  <Tooltip title="Value from location defaults">
                    <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                  </Tooltip>
                }
              </span>
            }
            name="currency"
            rules={[{ required: true, message: 'Please select local currency' }]}
          >
            <Select placeholder="Select local currency">
              {currencies.map(currency => (
                <Option key={currency.value} value={currency.value}>{currency.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={
              <span>
                Foreign Currency
                {fieldsFromLocations.foreignCurrency && 
                  <Tooltip title="Value from location defaults">
                    <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                  </Tooltip>
                }
              </span>
            }
            name="foreignCurrency"
            rules={[{ required: true, message: 'Please select foreign currency' }]}
          >
            <Select placeholder="Select foreign currency">
              {currencies.map(currency => (
                <Option key={currency.value} value={currency.value}>{currency.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={
              <span>
                Foreign/Local Exchange Rate
                {fieldsFromLocations.exchangeRate && 
                  <Tooltip title="Value from location defaults">
                    <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                  </Tooltip>
                }
              </span>
            }
            name="exchangeRate"
            rules={[{ required: true, message: 'Please enter exchange rate' }]}
            tooltip="Enter rate as: 1 foreign currency = ? local currency"
          >
            <InputNumber
              min={0}
              step={0.01}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default CurrencySettings;