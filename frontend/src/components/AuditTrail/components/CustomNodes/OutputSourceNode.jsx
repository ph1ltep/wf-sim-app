// frontend/src/components/AuditTrail/components/CustomNodes/OutputSourceNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircleOutlined } from '@ant-design/icons';

const OutputSourceNode = ({ data, selected }) => {
    const hasReferences = data.referenceDependencyCount > 0;
    const hasDependencies = data.dataDependencyCount > 0;

    return (
        <div style={{
            background: selected ? '#b37feb' : '#d3adf7',
            border: selected ? '2px solid #722ed1' : '1px solid #b37feb',
            borderRadius: '8px',
            width: '120px',
            height: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: selected ? '0 4px 12px rgba(114, 46, 209, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            position: 'relative'
        }}>
            <CheckCircleOutlined style={{ fontSize: '16px', marginBottom: '4px' }} />
            <div style={{ textAlign: 'center', lineHeight: '10px' }}>
                <div>{data.label}</div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>
                    {data.steps} steps
                    {hasDependencies && ` • ${data.dataDependencyCount} deps`}
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

            {/* Input handle - only show if this output has dependencies */}
            {hasDependencies && (
                <Handle
                    type="target"
                    position={Position.Top}
                    style={{
                        background: '#722ed1',
                        border: '2px solid #fff',
                        width: '8px',
                        height: '8px'
                    }}
                />
            )}

            {/* Output handle - always show for output sources that might be dependencies for others */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: '#722ed1',
                    border: '2px solid #fff',
                    width: '8px',
                    height: '8px'
                }}
            />
        </div>
    );
};

export default OutputSourceNode;