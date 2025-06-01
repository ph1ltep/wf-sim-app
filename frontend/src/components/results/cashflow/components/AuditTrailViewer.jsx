// src/components/results/cashflow/components/AuditTrailViewer.jsx - Audit trail visualization
import React, { useState, useMemo } from 'react';
import { Drawer, Tree, Descriptions, Typography, Space, Tag, Button, Card, Alert } from 'antd';
import { AuditOutlined, CalculatorOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const AuditTrailViewer = ({ cashflowData, visible, onClose }) => {
    const [selectedLineItem, setSelectedLineItem] = useState(null);

    // Generate audit trail tree data
    const auditTreeData = useMemo(() => {
        if (!cashflowData?.lineItems) return [];

        return cashflowData.lineItems.map(lineItem => ({
            title: `${lineItem.name} (${lineItem.category})`,
            key: lineItem.id,
            icon: <CalculatorOutlined />,
            children: [
                {
                    title: `Source Data (P${lineItem.metadata.selectedPercentile})`,
                    key: `${lineItem.id}-source`,
                    icon: <AuditOutlined />,
                },
                ...lineItem.metadata.appliedMultipliers.map((multiplier, index) => ({
                    title: `${multiplier.id} (${multiplier.operation})`,
                    key: `${lineItem.id}-multiplier-${index}`,
                    icon: <ArrowRightOutlined />,
                })),
                {
                    title: `Final Result (${lineItem.data.length} data points)`,
                    key: `${lineItem.id}-result`,
                    icon: <CalculatorOutlined />,
                }
            ]
        }));
    }, [cashflowData]);

    // Handle tree node selection
    const handleTreeSelect = (selectedKeys, info) => {
        const key = selectedKeys[0];
        if (!key) return;

        const [lineItemId] = key.split('-');
        const lineItem = cashflowData?.lineItems?.find(item => item.id === lineItemId);

        if (lineItem) {
            setSelectedLineItem({
                ...lineItem,
                selectedNode: key
            });
        }
    };

    // Render calculation steps
    const renderCalculationSteps = () => {
        if (!selectedLineItem) {
            return (
                <Alert
                    message="Select a line item"
                    description="Choose a line item from the tree to view its calculation steps."
                    type="info"
                />
            );
        }

        const steps = [];

        // Step 1: Source data
        steps.push(
            <Card key="source" size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>
                    1. Source Data
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                        P{selectedLineItem.metadata.selectedPercentile}
                    </Tag>
                </Title>
                <Descriptions size="small" column={2}>
                    <Descriptions.Item label="Category">{selectedLineItem.category}</Descriptions.Item>
                    <Descriptions.Item label="Subcategory">{selectedLineItem.subcategory}</Descriptions.Item>
                    <Descriptions.Item label="Has Percentiles">{selectedLineItem.metadata.hasPercentileVariation ? 'Yes' : 'No'}</Descriptions.Item>
                    <Descriptions.Item label="Data Points">{selectedLineItem.data.length}</Descriptions.Item>
                </Descriptions>

                {selectedLineItem.data.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary">Sample data: </Text>
                        <Text code>
                            Year {selectedLineItem.data[0].year}: {selectedLineItem.data[0].value.toLocaleString()}
                        </Text>
                        {selectedLineItem.data.length > 1 && (
                            <Text code style={{ marginLeft: 8 }}>
                                ... ({selectedLineItem.data.length} total points)
                            </Text>
                        )}
                    </div>
                )}
            </Card>
        );

        // Step 2+: Applied multipliers
        selectedLineItem.metadata.appliedMultipliers.forEach((multiplier, index) => {
            steps.push(
                <Card key={`multiplier-${index}`} size="small" style={{ marginBottom: 16 }}>
                    <Title level={5}>
                        {index + 2}. Apply {multiplier.id}
                        <Tag color="orange" style={{ marginLeft: 8 }}>
                            {multiplier.operation}
                        </Tag>
                    </Title>
                    <Descriptions size="small" column={2}>
                        <Descriptions.Item label="Operation">{multiplier.operation}</Descriptions.Item>
                        <Descriptions.Item label="Base Year">{multiplier.baseYear}</Descriptions.Item>
                        <Descriptions.Item label="Cumulative">{multiplier.cumulative ? 'Yes' : 'No'}</Descriptions.Item>
                        <Descriptions.Item label="Multiplier Points">{multiplier.values?.length || 0}</Descriptions.Item>
                    </Descriptions>

                    {multiplier.operation === 'compound' && (
                        <Alert
                            message="Compound Growth Formula"
                            description={`value × (1 + rate)^(year - ${multiplier.baseYear})`}
                            type="info"
                            size="small"
                            style={{ marginTop: 8 }}
                        />
                    )}

                    {multiplier.operation === 'multiply' && (
                        <Alert
                            message="Multiplication Formula"
                            description="value × multiplier"
                            type="info"
                            size="small"
                            style={{ marginTop: 8 }}
                        />
                    )}
                </Card>
            );
        });

        // Final step: Result
        const totalValue = selectedLineItem.data.reduce((sum, point) => sum + point.value, 0);
        steps.push(
            <Card key="result" size="small" style={{ marginBottom: 16 }}>
                <Title level={5}>
                    {selectedLineItem.metadata.appliedMultipliers.length + 2}. Final Result
                    <Tag color="green" style={{ marginLeft: 8 }}>
                        Complete
                    </Tag>
                </Title>
                <Descriptions size="small" column={2}>
                    <Descriptions.Item label="Total Value">{totalValue.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Currency">{cashflowData.metadata.currency}</Descriptions.Item>
                    <Descriptions.Item label="Project Years">{selectedLineItem.data.length}</Descriptions.Item>
                    <Descriptions.Item label="Average Annual">{Math.round(totalValue / selectedLineItem.data.length).toLocaleString()}</Descriptions.Item>
                </Descriptions>

                {selectedLineItem.displayNote && (
                    <Alert
                        message="Display Note"
                        description={selectedLineItem.displayNote}
                        type="warning"
                        size="small"
                        style={{ marginTop: 8 }}
                    />
                )}
            </Card>
        );

        return steps;
    };

    return (
        <Drawer
            title={
                <Space>
                    <AuditOutlined />
                    <Text>Cashflow Calculation Audit Trail</Text>
                </Space>
            }
            placement="right"
            size="large"
            open={visible}
            onClose={onClose}
            extra={
                <Button onClick={onClose}>Close</Button>
            }
        >
            <div style={{ display: 'flex', height: '100%' }}>
                {/* Tree view */}
                <div style={{ width: '300px', borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
                    <Title level={5}>Line Items</Title>
                    <Tree
                        treeData={auditTreeData}
                        onSelect={handleTreeSelect}
                        selectedKeys={selectedLineItem ? [selectedLineItem.id] : []}
                        defaultExpandAll
                    />
                </div>

                {/* Details view */}
                <div style={{ flex: 1, paddingLeft: '16px', overflowY: 'auto' }}>
                    <Title level={5}>Calculation Steps</Title>
                    {renderCalculationSteps()}
                </div>
            </div>
        </Drawer>
    );
};

export default AuditTrailViewer;