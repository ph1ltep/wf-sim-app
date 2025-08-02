// frontend/src/components/AuditTrail/components/TreeAuditView.jsx
import React, { useState, useMemo } from 'react';
import { Tree, Descriptions, Typography, Space, Tag, Card, Alert, Collapse, Timeline } from 'antd';
import { AuditOutlined, CalculatorOutlined, ClockCircleOutlined, LinkOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useCube } from '../../../../contexts/CubeContext';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const TreeAuditView = ({ sourceIds }) => {
    const [selectedSourceId, setSelectedSourceId] = useState(null);
    const { getAuditTrail } = useCube();

    // Get audit trail data for the specified sources
    const auditData = useMemo(() => {
        if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) return {};

        try {
            return getAuditTrail(sourceIds);
        } catch (error) {
            console.error('❌ TreeAuditView: Failed to get audit trail:', error);
            return {};
        }
    }, [sourceIds, getAuditTrail]);

    // Generate audit trail tree data
    const auditTreeData = useMemo(() => {
        const sourceIdKeys = Object.keys(auditData);
        if (sourceIdKeys.length === 0) return [];

        return sourceIdKeys.map(sourceId => {
            const audit = auditData[sourceId];
            const trailLength = audit?.trail?.length || 0;

            return {
                title: `${sourceId} (${trailLength} steps)`,
                key: sourceId,
                icon: <DatabaseOutlined />,
                children: trailLength > 0 ? [
                    {
                        title: `${trailLength} Processing Steps`,
                        key: `${sourceId}-steps`,
                        icon: <AuditOutlined />,
                    }
                ] : []
            };
        });
    }, [auditData]);

    // Get selected source audit trail
    const selectedAudit = useMemo(() => {
        if (!selectedSourceId || !auditData[selectedSourceId]) return null;
        return auditData[selectedSourceId];
    }, [selectedSourceId, auditData]);

    // Handle tree node selection
    const handleTreeSelect = (selectedKeys) => {
        if (selectedKeys.length === 0) return;

        const key = selectedKeys[0];
        const sourceId = key.split('-')[0];
        setSelectedSourceId(sourceId);
    };

    // Format duration for display
    const formatDuration = (duration) => {
        if (!duration || duration === 0) return '0ms';
        return duration < 1 ? '<1ms' : `${duration.toFixed(1)}ms`;
    };

    // Render audit trail steps (same as before)
    const renderAuditSteps = () => {
        if (!selectedAudit?.trail) {
            return (
                <Alert
                    message="No audit trail available"
                    description="This source does not have detailed audit trail information."
                    type="info"
                />
            );
        }

        const trail = selectedAudit.trail;
        const totalDuration = trail.reduce((sum, step) => sum + (step.duration || 0), 0);

        return (
            <div>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {/* Source Overview */}
                    <Card size="small" title="Source Overview">
                        <Descriptions size="small" column={2}>
                            <Descriptions.Item label="Source ID">{selectedSourceId}</Descriptions.Item>
                            <Descriptions.Item label="Processing Steps">{trail.length}</Descriptions.Item>
                            <Descriptions.Item label="Total Duration">{formatDuration(totalDuration)}</Descriptions.Item>
                            <Descriptions.Item label="Dependencies">
                                {trail.reduce((deps, step) => {
                                    step.dependencies?.forEach(dep => {
                                        if (!deps.includes(dep)) deps.push(dep);
                                    });
                                    return deps;
                                }, []).length}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Processing Timeline */}
                    <Card size="small" title="Processing Timeline">
                        <Timeline>
                            {trail.map((step, index) => (
                                <Timeline.Item
                                    key={index}
                                    dot={<ClockCircleOutlined />}
                                    color={step.duration > 10 ? 'red' : 'green'}
                                >
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <Text strong>{step.step}</Text>
                                            {step.duration > 0 && (
                                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                                    {formatDuration(step.duration)}
                                                </Tag>
                                            )}
                                        </div>

                                        {step.details && (
                                            <div style={{ marginBottom: 8 }}>
                                                <Text type="secondary">{step.details}</Text>
                                            </div>
                                        )}

                                        {step.dependencies && step.dependencies.length > 0 && (
                                            <div style={{ marginBottom: 8 }}>
                                                <Text type="secondary">Dependencies: </Text>
                                                {step.dependencies.map((dep, i) => (
                                                    <Tag key={i} icon={<LinkOutlined />} color="orange">
                                                        {dep}
                                                    </Tag>
                                                ))}
                                            </div>
                                        )}

                                        {step.dataSample && (
                                            <Collapse size="small" ghost>
                                                <Panel header="View Data Sample" key="data">
                                                    <div style={{ backgroundColor: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                                                        <Text code style={{ fontSize: '11px' }}>
                                                            {JSON.stringify(step.dataSample, null, 2)}
                                                        </Text>
                                                    </div>
                                                </Panel>
                                            </Collapse>
                                        )}
                                    </div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>
                </Space>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {/* Tree view */}
            <div style={{ width: '300px', borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
                <Title level={5}>Data Sources</Title>
                {auditTreeData.length > 0 ? (
                    <Tree
                        treeData={auditTreeData}
                        onSelect={handleTreeSelect}
                        selectedKeys={selectedSourceId ? [selectedSourceId] : []}
                        defaultExpandAll
                    />
                ) : (
                    <Alert
                        message="No data sources"
                        description="No audit trail data available for this view."
                        type="warning"
                        size="small"
                    />
                )}
            </div>

            {/* Details view */}
            <div style={{ flex: 1, paddingLeft: '16px', overflowY: 'auto' }}>
                {selectedAudit ? (
                    renderAuditSteps()
                ) : (
                    <Alert
                        message="Select a data source"
                        description="Choose a data source from the tree to view its audit trail and processing steps."
                        type="info"
                    />
                )}
            </div>
        </div>
    );
};

export default TreeAuditView;