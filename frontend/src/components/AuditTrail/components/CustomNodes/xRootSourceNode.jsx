// frontend/src/components/AuditTrail/components/CustomNodes/RootSourceNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { DatabaseOutlined, FunctionOutlined, BarChartOutlined, NumberOutlined } from '@ant-design/icons';

const RootSourceNode = ({ data, selected }) => {
    const rootType = data.rootSourceType || 'scalar';

    // Different icons but same green color family
    const typeConfig = {
        complex: {
            icon: <FunctionOutlined />,
            color: '#289e0d',      // Darker green
            lightColor: '#63d13d', // Medium green
            label: 'Complex'
        },
        distribution: {
            icon: <BarChartOutlined />,
            color: '#42c41a',      // Standard green
            lightColor: '#85de64', // Light green
            label: 'Distribution'
        },
        scalar: {
            icon: <NumberOutlined />,
            color: '#137804',      // Darkest green
            lightColor: '#a7eb8f', // Lightest green
            label: 'Scalar'
        }
    };

    const config = typeConfig[rootType];
    const hasReferences = data.referenceDependencyCount > 0;

    return (
        <div style={{
            background: selected ? config.color : config.lightColor,
            border: selected ? `2px solid ${config.color}` : `1px solid ${config.color}`,
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: selected ? `0 4px 12px ${config.color}40` : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            position: 'relative'
        }}>
            <div style={{ fontSize: '16px', marginBottom: '2px' }}>
                {config.icon}
            </div>
            <div style={{ textAlign: 'center', lineHeight: '10px' }}>
                <div>{data.label}</div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>
                    {config.label}
                </div>
            </div>

            {/* Reference indicator */}
            {hasReferences && (
                <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#1890ff',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                }}>
                    {data.referenceDependencyCount}
                </div>
            )}

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: config.color,
                    border: '2px solid #fff',
                    width: '8px',
                    height: '8px'
                }}
            />
        </div>
    );
};

export default RootSourceNode;