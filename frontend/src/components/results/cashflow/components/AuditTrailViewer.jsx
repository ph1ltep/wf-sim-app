// frontend/src/components/results/cashflow/components/AuditTrailViewer.jsx
import React, { useState } from 'react';
import { Modal, Segmented, Typography } from 'antd';
import { AuditOutlined, PartitionOutlined } from '@ant-design/icons';
import TreeAuditView from './TreeAuditView';
import AuditTrailGraph from './AuditTrailGraph';

const { Title } = Typography;

const AuditTrailViewer = ({ sourceIds, visible, onClose }) => {
    const [viewMode, setViewMode] = useState('graph');

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AuditOutlined />
                        <Title level={4} style={{ margin: 0 }}>
                            Audit Trail Visualization
                        </Title>
                    </div>

                    <Segmented
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            {
                                label: 'Tree View',
                                value: 'tree',
                                icon: <AuditOutlined />
                            },
                            {
                                label: 'Graph View',
                                value: 'graph',
                                icon: <PartitionOutlined />
                            }
                        ]}
                    />
                </div>
            }
            open={visible}
            onCancel={onClose}
            width="90vw"
            style={{ top: '20px' }}
            styles={{
                body: {
                    height: 'calc(90vh - 100px)',
                    padding: '0',
                    overflow: 'hidden'
                }
            }}
            footer={null}
            destroyOnClose
        >
            <div style={{ height: '100%', width: '100%' }}>
                {viewMode === 'tree' ? (
                    <div style={{ padding: '16px', height: '100%' }}>
                        <TreeAuditView sourceIds={sourceIds} />
                    </div>
                ) : (
                    <AuditTrailGraph sourceIds={sourceIds} />
                )}
            </div>
        </Modal>
    );
};

export default AuditTrailViewer;