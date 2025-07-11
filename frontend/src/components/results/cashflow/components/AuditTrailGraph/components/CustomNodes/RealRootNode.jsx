// frontend/src/components/results/cashflow/components/AuditTrailGraph/components/CustomNodes/RealRootNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { FunctionOutlined, BarChartOutlined, NumberOutlined } from '@ant-design/icons';

const RealRootNode = ({ data, selected }) => {
    const rootType = data.rootType || 'scalar';

    // Same teal color for all real roots, different icons and visual flair
    const baseColor = '#13c2c2';     // Teal
    const lightColor = '#87e8de';    // Light teal

    const typeConfig = {
        complex: {
            icon: <FunctionOutlined />,
            badge: '⚡',
            description: 'Complex'
        },
        distribution: {
            icon: <BarChartOutlined />,
            badge: '📊',
            description: 'Distribution'
        },
        scalar: {
            icon: <NumberOutlined />,
            badge: '📏',
            description: 'Scalar'
        }
    };

    const config = typeConfig[rootType];

    // Extract last two path items for display name
    const displayName = data.path && Array.isArray(data.path) && data.path.length > 1
        ? data.path.slice(-2).join('.')
        : data.label;

    return (
        <div style={{
            background: selected ? baseColor : lightColor,
            border: selected ? `2px solid ${baseColor}` : `1px solid ${baseColor}`,
            borderRadius: '8px',
            width: '120px',      // Same as intermediary
            height: '70px',      // Same as intermediary
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: selected ? '#fff' : '#006d75', // Dark teal text when not selected
            boxShadow: selected ? `0 4px 12px ${baseColor}40` : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            position: 'relative',
            // Visual flair - subtle pattern overlay
            backgroundImage: rootType === 'complex'
                ? 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)'
                : rootType === 'distribution'
                    ? 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 2px, transparent 2px)'
                    : 'none',
            backgroundSize: rootType === 'complex' ? '8px 8px' : '16px 16px'
        }}>
            <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                {config.icon}
            </div>
            <div style={{ textAlign: 'center', lineHeight: '10px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'normal' }}>
                    {displayName}
                </div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>
                    {config.description} Root
                </div>
            </div>

            {/* Type badge */}
            <div style={{
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                fontSize: '12px',
                background: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}>
                {config.badge}
            </div>

            {/* Dependents indicator */}
            {data.dependentCount > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#faad14',
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
                    {data.dependentCount}
                </div>
            )}

            {/* Output handle only */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: baseColor,
                    border: '2px solid #fff',
                    width: '8px',
                    height: '8px'
                }}
            />
        </div>
    );
};

export default RealRootNode;