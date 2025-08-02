// frontend/src/components/AuditTrail/components/GraphLegend.jsx
import React from 'react';
import { Card, Space, Typography } from 'antd';
import { DatabaseOutlined, CalculatorOutlined, CheckCircleOutlined, FunctionOutlined } from '@ant-design/icons';

const { Text } = Typography;

const GraphLegend = () => {
    const legendItems = [
        {
            icon: <DatabaseOutlined style={{ color: '#13c2c2', fontSize: '14px' }} />,
            label: 'Real Root',
            description: 'Original data source',
            color: '#87e8de',
            shape: 'rectangle',
            badge: '⚡📊📏'
        },
        {
            icon: <CalculatorOutlined style={{ color: '#fa8c16', fontSize: '14px' }} />,
            label: 'Registry Source',
            description: 'Processes data per registry',
            color: '#ffb366',
            shape: 'rectangle',
            badge: '📋🔧⚙️'
        },
        {
            icon: <CheckCircleOutlined style={{ color: '#722ed1', fontSize: '14px' }} />,
            label: 'Output Source',
            description: 'Requested audit results',
            color: '#d3adf7',
            shape: 'rectangle'
        }
    ];

    return (
        <Card
            size="small"
            title="Legend"
            style={{
                minWidth: '190px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)', // ✅ FIXED: Transparent background
                backdropFilter: 'blur(4px)' // ✅ FIXED: Subtle blur effect
            }}
        >
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
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontWeight: 'bold',
                                fontSize: '11px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {item.label}
                                {item.badge && (
                                    <span style={{ fontSize: '8px' }}>{item.badge}</span>
                                )}
                            </div>
                            <div style={{ fontSize: '9px', color: '#666' }}>{item.description}</div>
                        </div>
                    </div>
                ))}

                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>
                        <strong>Features:</strong>
                    </div>
                    <div style={{ fontSize: '9px', color: '#666' }}>
                        <div>🔵 Blue badge = references used</div>
                        <div>🟡 Orange badge = dependents count</div>
                        <div>⚡📊📏 Type badges = Complex/Dist/Scalar</div>
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