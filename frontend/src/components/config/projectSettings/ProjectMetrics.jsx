// src/components/config/projectSettings/ProjectMetrics.jsx
import React from 'react';
import { Card, Row, Col, Statistic, Divider } from 'antd';

/**
 * Component for displaying calculated project metrics
 */
const ProjectMetrics = ({ calculatedValues }) => {
  // Table styling for component quantities
  const tableStyle = {
    header: {
      backgroundColor: '#f0f2f5',
      padding: '12px 10px',
      textAlign: 'left',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '14px',
      fontWeight: '500'
    },
    cell: {
      padding: '8px 10px',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '14px'
    },
    cellRight: {
      padding: '8px 10px',
      borderBottom: '1px solid #e8e8e8',
      fontSize: '14px',
      textAlign: 'right',
      fontWeight: '500'
    }
  };

  return (
    <Card title="Calculated Project Metrics">
      <Row gutter={24}>
        <Col span={8}>
          <Statistic
            title="Total Project Capacity"
            value={calculatedValues.totalMW}
            precision={2}
            suffix="MW"
          />
        </Col>
        <Col span={8}>
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
        <Col span={8}>
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
      </Row>
      
      <Divider orientation="left">Major Component Quantities</Divider>
      
      <table className="component-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableStyle.header}>Component</th>
            <th style={tableStyle.header}>Quantity</th>
            <th style={tableStyle.header}>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tableStyle.cell}>Blades</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.blades || 0}</td>
            <td style={tableStyle.cell}>3 per turbine</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Blade Bearings</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.bladeBearings || 0}</td>
            <td style={tableStyle.cell}>1 per blade</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Transformers</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.transformers || 0}</td>
            <td style={tableStyle.cell}>1 per turbine</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Gearboxes</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.gearboxes || 0}</td>
            <td style={tableStyle.cell}>Only for geared turbines</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Generators</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.generators || 0}</td>
            <td style={tableStyle.cell}>1 per turbine</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Converters</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.converters || 0}</td>
            <td style={tableStyle.cell}>1 per turbine</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Main Bearings/Shaft</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.mainBearings || 0}</td>
            <td style={tableStyle.cell}>1 per turbine (different type for geared/direct drive)</td>
          </tr>
          <tr>
            <td style={tableStyle.cell}>Yaw Systems</td>
            <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.yawSystems || 0}</td>
            <td style={tableStyle.cell}>1 per turbine</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
};

export default ProjectMetrics;
