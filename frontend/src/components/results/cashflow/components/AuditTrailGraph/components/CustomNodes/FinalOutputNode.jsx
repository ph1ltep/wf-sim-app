// frontend/src/components/results/cashflow/components/AuditTrailGraph/components/CustomNodes/FinalOutputNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircleOutlined } from '@ant-design/icons';

const FinalOutputNode = ({ data, selected }) => {
    return (
        <div style={{
            background: selected ? '#b37feb' : '#d3adf7',
            border: selected ? '2px solid #722ed1' : '1px solid #b37feb',
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
            boxShadow: selected ? '0 4px 12px rgba(114, 46, 209, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer'
        }}>
            <CheckCircleOutlined style={{ fontSize: '16px', marginBottom: '2px' }} />
            <div style={{ textAlign: 'center', lineHeight: '10px' }}>
                <div>{data.label}</div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>
                    {data.steps} steps
                </div>
            </div>

            {/* Input handle */}
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
        </div>
    );
};

export default FinalOutputNode;