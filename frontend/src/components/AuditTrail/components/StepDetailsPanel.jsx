// frontend/src/components/AuditTrail/components/StepDetailsPanel.jsx
import React, { useState } from 'react';
import { Card, Timeline, Typography, Tag, Space, Descriptions, Button, Collapse } from 'antd';
import {
    CloseOutlined,
    ClockCircleOutlined,
    LinkOutlined,
    DatabaseOutlined,
    GroupOutlined,
    SwapOutlined,
    CalculatorOutlined,
    ShrinkOutlined,
    BarChartOutlined,
    InfoCircleOutlined,
    CaretRightOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { JsonTag, JsonButton } from './JsonViewer';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Step type icons mapping - FIXED: GroupOutlined instead of AggregationOutlined
const stepTypeIcons = {
    aggregate: { icon: <GroupOutlined />, color: '#52c41a' },
    transform: { icon: <SwapOutlined />, color: '#1890ff' },
    multiply: { icon: <CalculatorOutlined />, color: '#fa8c16' },
    reduce: { icon: <ShrinkOutlined />, color: '#722ed1' },
    normalize: { icon: <BarChartOutlined />, color: '#eb2f96' },
    none: { icon: <InfoCircleOutlined />, color: '#8c8c8c' }
};

const StepDetailsPanel = ({ node, auditData, onClose }) => {
    const [selectedDataSample, setSelectedDataSample] = useState(null);
    const audit = auditData[node.id];

    if (!audit?.trail) {
        return (
            <div style={{
                width: '320px',
                height: '100%',
                borderLeft: '1px solid #f0f0f0',
                backgroundColor: '#fafafa',
                padding: '16px'
            }}>
                <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <Title level={5} style={{ margin: 0 }}>No Steps Available</Title>
                        <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
                    </div>
                    <Text type="secondary">This source does not have detailed step information.</Text>
                </Card>
            </div>
        );
    }

    const trail = audit.trail;
    const totalDuration = trail.reduce((sum, step) => sum + (step.duration || 0), 0);
    const references = node.data.references || {};

    // Format duration for display
    const formatDuration = (duration) => {
        if (!duration || duration === 0) return '0ms';
        return duration < 1 ? '<1ms' : `${duration.toFixed(1)}ms`;
    };

    return (
        <div style={{
            width: '320px',
            height: '100%',
            borderLeft: '1px solid #f0f0f0',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Optimized Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: 'white'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Title level={5} style={{ margin: 0, fontSize: '14px' }}>Steps</Title>
                    <Button type="text" icon={<CloseOutlined />} onClick={onClose} size="small" />
                </div>

                <div style={{ fontSize: '11px', color: '#666' }}>
                    <Text strong style={{ fontSize: '12px' }}>{node.id}</Text>
                    <div style={{ marginTop: '4px' }}>
                        {trail.length} steps • {formatDuration(totalDuration)} • {node.type}
                    </div>
                </div>
            </div>

            {/* References Section */}
            {Object.keys(references).length > 0 && (
                <div style={{
                    padding: '8px 16px',
                    backgroundColor: '#e6f7ff',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <Text strong style={{ fontSize: '11px', color: '#1890ff', marginBottom: '4px', display: 'block' }}>
                        <DatabaseOutlined /> References ({Object.keys(references).length})
                    </Text>
                    <div style={{ lineHeight: '18px' }}>
                        {Object.entries(references).map(([refId, refValue]) => (
                            <JsonTag
                                key={refId}
                                label={refId}
                                value={refValue}
                                size="small"
                                maxPreviewLength={30}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Chronological Steps Timeline */}
            <div style={{
                flex: 1,
                padding: '12px 16px',
                overflowY: 'auto'
            }}>
                <Timeline size="small">
                    {trail.map((step, index) => {
                        const typeInfo = stepTypeIcons[step.type] || stepTypeIcons.none;
                        const stepType = step.type || 'none';
                        const showTypeInfo = stepType !== 'none' && stepType !== null;
                        const showStepName = !showTypeInfo; // Only show step name for none/null types

                        return (
                            <Timeline.Item
                                key={index}
                                dot={
                                    <div style={{
                                        color: typeInfo.color,
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {typeInfo.icon}
                                    </div>
                                }
                                color={typeInfo.color}
                            >
                                {/* Optimized Step Header */}
                                <div style={{ marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Space size={4} wrap style={{ flex: 1 }}>
                                            {/* Show step name only for none/null types */}
                                            {showStepName && (
                                                <Text strong style={{ fontSize: '11px' }}>
                                                    {step.step}
                                                </Text>
                                            )}

                                            {/* Show type and typeOperation for non-none types */}
                                            {showTypeInfo && (
                                                <>
                                                    <Tag color={typeInfo.color} size="small" style={{ fontSize: '10px' }}>
                                                        {stepType}
                                                    </Tag>
                                                    {step.typeOperation && (
                                                        <Tag color="default" size="small" style={{ fontSize: '10px' }}>
                                                            {step.typeOperation}
                                                        </Tag>
                                                    )}
                                                </>
                                            )}

                                            {step.duration > 0 && (
                                                <Tag color="blue" size="small" style={{ fontSize: '9px' }}>
                                                    {formatDuration(step.duration)}
                                                </Tag>
                                            )}
                                        </Space>

                                        {/* Data Sample Icon Button */}
                                        {step.dataSample && (
                                            <JsonButton
                                                data={step.dataSample}
                                                tooltip={`View data sample ${step.dataSample.percentile ? `(P${step.dataSample.percentile})` : ''}`}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Step Details */}
                                {step.details && (
                                    <div style={{ marginBottom: '4px' }}>
                                        <Text type="secondary" style={{ fontSize: '10px' }}>
                                            {step.details}
                                        </Text>
                                    </div>
                                )}

                                {/* Dependencies */}
                                {step.dependencies && step.dependencies.length > 0 && (
                                    <div style={{ marginBottom: '4px' }}>
                                        <Text type="secondary" style={{ fontSize: '10px', marginRight: '4px' }}>
                                            Deps:
                                        </Text>
                                        <Space size={1} wrap>
                                            {step.dependencies.map((dep, i) => {
                                                const isReference = references.hasOwnProperty(dep);
                                                return (
                                                    <Tag
                                                        key={i}
                                                        color={isReference ? 'blue' : 'orange'}
                                                        size="small"
                                                        style={{ fontSize: '9px', margin: '1px' }}
                                                    >
                                                        {dep}{isReference && ' (ref)'}
                                                    </Tag>
                                                );
                                            })}
                                        </Space>
                                    </div>
                                )}
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            </div>

        </div>
    );
};

export default StepDetailsPanel;