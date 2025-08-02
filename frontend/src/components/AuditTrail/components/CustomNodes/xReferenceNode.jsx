// frontend/src/components/AuditTrail/components/CustomNodes/ReferenceNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { LinkOutlined } from '@ant-design/icons';

const ReferenceNode = ({ data, selected }) => {
    return (
        <div style={{
            background: selected ? '#40a9ff' : '#69c0ff',
            border: selected ? '2px solid #1890ff' : '1px solid #40a9ff',
            width: '60px',
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 'bold',
            color: '#fff',
            transform: 'rotate(45deg)',
            boxShadow: selected ? '0 4px 12px rgba(24, 144, 255, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer'
        }}>
            <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
                <LinkOutlined style={{ fontSize: '14px', marginBottom: '2px' }} />
                <div style={{ lineHeight: '9px' }}>
                    <div>{data.label}</div>
                    <div style={{ fontSize: '7px', opacity: 0.8 }}>
                        ref
                    </div>
                </div>
            </div>

            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: '#1890ff',
                    border: '2px solid #fff',
                    width: '6px',
                    height: '6px',
                    transform: 'rotate(-45deg) translateY(-8px)'
                }}
            />

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: '#1890ff',
                    border: '2px solid #fff',
                    width: '6px',
                    height: '6px',
                    transform: 'rotate(-45deg) translateY(8px)'
                }}
            />
        </div>
    );
};

export default ReferenceNode;