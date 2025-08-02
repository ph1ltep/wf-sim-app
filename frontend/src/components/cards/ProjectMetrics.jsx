// src/components/config/projectSettings/ProjectMetrics.jsx
import React from 'react';
import { Card, Row, Col, Statistic, Divider, Table, Tag } from 'antd';

/**
 * Component for displaying calculated project metrics
 */
const ProjectMetrics = ({ calculatedValues }) => {
  // Define table columns for component quantities
  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  // Create data source for the table
  const dataSource = [
    {
      key: 'blades',
      component: 'Blades',
      quantity: calculatedValues.componentQuantities?.blades || 0,
      notes: '3 per turbine',
    },
    {
      key: 'bladeBearings',
      component: 'Blade Bearings',
      quantity: calculatedValues.componentQuantities?.bladeBearings || 0,
      notes: '1 per blade',
    },
    {
      key: 'transformers',
      component: 'Transformers',
      quantity: calculatedValues.componentQuantities?.transformers || 0,
      notes: '1 per turbine',
    },
    {
      key: 'gearboxes',
      component: 'Gearboxes',
      quantity: calculatedValues.componentQuantities?.gearboxes || 0,
      notes: 'Only for geared turbines',
    },
    {
      key: 'generators',
      component: 'Generators',
      quantity: calculatedValues.componentQuantities?.generators || 0,
      notes: '1 per turbine',
    },
    {
      key: 'converters',
      component: 'Converters',
      quantity: calculatedValues.componentQuantities?.converters || 0,
      notes: '1 per turbine',
    },
    {
      key: 'mainBearings',
      component: 'Main Bearings/Shaft',
      quantity: calculatedValues.componentQuantities?.mainBearings || 0,
      notes: '1 per turbine (different type for geared/direct drive)',
    },
    {
      key: 'yawSystems',
      component: 'Yaw Systems',
      quantity: calculatedValues.componentQuantities?.yawSystems || 0,
      notes: '1 per turbine',
    },
  ];

  // Format timeline display
  const formatTimelineYear = (year) => {
    if (year === 0) return 'COD';
    return year > 0 ? `COD+${year}` : `COD${year}`;
  };

  const getYearFromCOD = (year) => {
    const currentYear = new Date().getFullYear();
    const codYear = currentYear + 2; // Assuming COD is 2 years from now (adjust as needed)
    return codYear + year;
  };

  return (
    <Card title="Calculated Project Metrics" style={{ marginBottom: 24 }}>
      <Row gutter={24}>
        <Col span={5}>
          <Statistic
            title="Total Project Capacity"
            value={calculatedValues.totalMW}
            precision={2}
            suffix="MW"
          />
        </Col>
        <Col span={5}>
          <Statistic
            title="Estimated AEP (Gross)"
            value={calculatedValues.grossAEP}
            precision={0}
            formatter={value => `${(value / 1000).toFixed(2)} GWh`}
          />
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            ({calculatedValues.grossAEP.toLocaleString()} MWh)
          </div>
        </Col>
        <Col span={5}>
          <Statistic
            title="Estimated AEP (Net)"
            value={calculatedValues.netAEP}
            precision={0}
            formatter={value => `${(value / 1000).toFixed(2)} GWh`}
            valueStyle={{ color: '#3f8600' }}
          />
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            ({calculatedValues.netAEP.toLocaleString()} MWh)
          </div>
        </Col>
        <Col span={5}>
          <Statistic
            title="Total Investment"
            value={calculatedValues.totalCapex}
            precision={0}
            formatter={value => `$${(value / 1000000).toFixed(1)}M`}
          />
          <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
            (${calculatedValues.totalCapex.toLocaleString()})
          </div>
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Project Timeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="blue" size="small">DEV</Tag>
                <span>
                  {formatTimelineYear(calculatedValues.devYear || -5)}
                  <span style={{ color: '#999', marginLeft: '4px' }}>
                    ({getYearFromCOD(calculatedValues.devYear || -5)})
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="orange" size="small">NTP</Tag>
                <span>
                  {formatTimelineYear(calculatedValues.ntpYear || -3)}
                  <span style={{ color: '#999', marginLeft: '4px' }}>
                    ({getYearFromCOD(calculatedValues.ntpYear || -3)})
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="green" size="small">COD</Tag>
                <span>
                  Year 0
                  <span style={{ color: '#999', marginLeft: '4px' }}>
                    ({getYearFromCOD(0)})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Divider orientation="left">Major Component Quantities</Divider>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        bordered
      />
    </Card>
  );
};

export default ProjectMetrics;