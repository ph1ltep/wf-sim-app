// frontend/src/components/results/cashflow/components/AuditTrailGraph/components/GraphLegend.jsx
import React from 'react';
import { Card, Space, Typography } from 'antd';
import { DatabaseOutlined, CalculatorOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const GraphLegend = () => {
    const legendItems = [
        {
            icon: <DatabaseOutlined style={{ color: '#52c41a', fontSize: '14px' }} />,
            label: 'Root Source',
            description: 'Base data with no dependencies',
            color: '#95de64',
            shape: 'circle'
        },
        {
            icon: <CalculatorOutlined style={{ color: '#fa8c16', fontSize: '14px' }} />,
            label: 'Intermediary Source',
            description: 'Calculated from other sources',
            color: '#ffb366',
            shape: 'rectangle'
        },
        {
            icon: <CheckCircleOutlined style={{ color: '#722ed1', fontSize: '14px' }} />,
            label: 'Output Source',
            description: 'Sources you requested to audit',
            color: '#d3adf7',
            shape: 'rectangle'
        }
    ];

    return (
        <Card size="small" title="Legend" style={{ minWidth: '180px' }}>
            <Space direction="vertical" size="small">
                {legendItems.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            backgroundColor: item.color,
                            borderRadius: item.shape === 'circle' ? '50%' : '3px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(0,0,0,0.1)'
                        }}>
                            {item.icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{item.label}</div>
                            <div style={{ fontSize: '9px', color: '#666' }}>{item.description}</div>
                        </div>
                    </div>
                ))}

                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                        <strong>Note:</strong>
                    </div>
                    <div style={{ fontSize: '9px', color: '#666' }}>
                        <div>Output sources can depend on each other</div>
                        <div>🔵 Blue badge = reference count</div>
                        <div style={{ marginTop: '4px' }}>
                            <strong>Flow:</strong> ━━━ Data dependencies
                        </div>
                    </div>
                </div>
            </Space>
        </Card>
    );
};

export default GraphLegend;