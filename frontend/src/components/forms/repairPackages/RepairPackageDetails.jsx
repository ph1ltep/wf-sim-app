// frontend/src/components/forms/repairPackages/RepairPackageDetails.jsx
import React from 'react';
import { Row, Col, Tag, Space } from 'antd';

/**
 * Compact display of repair package details in expandable rows
 */
const RepairPackageDetails = ({ record }) => {
  const costs = record.costs || {};
  const crane = record.crane || {};
  const appliesTo = record.appliesTo || {};

  // Get cost categories with values
  const activeCosts = Object.entries(costs)
    .filter(([, data]) => data && ((data.perEventEUR > 0) || (data.perDayEUR > 0)))
    .map(([key, data]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      perEvent: data.perEventEUR,
      perDay: data.perDayEUR
    }));

  const hasCrane = (costs.crane?.perEventEUR > 0) || (costs.crane?.perDayEUR > 0);

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Description */}
      {record.description && (
        <div style={{ marginBottom: 12, color: '#666' }}>
          {record.description}
        </div>
      )}

      <Row gutter={24}>
        {/* Cost Breakdown */}
        <Col span={12}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>💰 Cost Breakdown</div>
          {activeCosts.length > 0 ? (
            <Space direction="vertical" size={2} style={{ width: '100%' }}>
              {activeCosts.map(cost => (
                <div key={cost.key} style={{ fontSize: 13 }}>
                  <strong>{cost.label}:</strong>{' '}
                  {cost.perEvent > 0 && <span>€{cost.perEvent.toLocaleString()}/event</span>}
                  {cost.perEvent > 0 && cost.perDay > 0 && <span> + </span>}
                  {cost.perDay > 0 && <span>€{cost.perDay.toLocaleString()}/day</span>}
                </div>
              ))}
            </Space>
          ) : (
            <span style={{ color: '#999', fontSize: 13 }}>No costs configured</span>
          )}
        </Col>

        {/* Configuration & Details */}
        <Col span={12}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>⚙️ Configuration</div>
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <div style={{ fontSize: 13 }}>
              <strong>Duration:</strong> {record.baseDurationDays || 1} day{(record.baseDurationDays || 1) !== 1 ? 's' : ''}
            </div>
            
            {hasCrane && (
              <div style={{ fontSize: 13 }}>
                <strong>Crane:</strong>{' '}
                <Tag size="small" color={
                  crane.type === 'mobile' ? 'blue' :
                  crane.type === 'crawler' ? 'red' :
                  crane.type === 'tower' ? 'purple' :
                  crane.type === 'special' ? 'orange' : 'default'
                }>
                  {crane.type?.charAt(0).toUpperCase() + crane.type?.slice(1)}
                </Tag>
                {crane.minimumDays > 0 && <span> (min {crane.minimumDays} days)</span>}
              </div>
            )}

            {appliesTo.componentCategories && appliesTo.componentCategories.length > 0 && (
              <div style={{ fontSize: 13 }}>
                <strong>Components:</strong>{' '}
                <Space size={4} wrap>
                  {appliesTo.componentCategories.map((category, index) => (
                    <Tag key={index} size="small">{category}</Tag>
                  ))}
                </Space>
              </div>
            )}

            <div style={{ fontSize: 13 }}>
              <strong>Status:</strong>{' '}
              <Tag size="small" color={record.isActive ? 'green' : 'red'}>
                {record.isActive ? 'Active' : 'Inactive'}
              </Tag>
              {record.isDefault && (
                <Tag size="small" color="blue" style={{ marginLeft: 4 }}>Default</Tag>
              )}
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default RepairPackageDetails;