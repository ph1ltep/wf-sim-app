// frontend/src/components/results/cashflow/components/AuditTrailGraph/components/CustomNodes/IntermediarySourceNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { CalculatorOutlined } from '@ant-design/icons';

const IntermediarySourceNode = ({ data, selected }) => {
    const hasReferences = data.referenceDependencyCount > 0;

    return (
        <div style={{
            background: selected ? '#ffa940' : '#ffb366',
            border: selected ? '2px solid #fa8c16' : '1px solid #ffa940',
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
            boxShadow: selected ? '0 4px 12px rgba(250, 140, 22, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            position: 'relative'
        }}>
            <CalculatorOutlined style={{ fontSize: '16px', marginBottom: '4px' }} />
            <div style={{ textAlign: 'center', lineHeight: '10px' }}>
                <div>{data.label}</div>
                <div style={{ fontSize: '8px', opacity: 0.8 }}>
                    {data.steps} steps • {data.dataDependencyCount} deps
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

            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Top}
                style={{
                    background: '#fa8c16',
                    border: '2px solid #fff',
                    width: '8px',
                    height: '8px'
                }}
            />

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: '#fa8c16',
                    border: '2px solid #fff',
                    width: '8px',
                    height: '8px'
                }}
            />
        </div>
    );
};

export default IntermediarySourceNode;