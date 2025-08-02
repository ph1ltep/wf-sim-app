// frontend/src/components/AuditTrail/components/RealRootDetailsPanel.jsx
import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Space, Descriptions, Button, Spin, Alert } from 'antd';
import {
    CloseOutlined,
    DatabaseOutlined,
    FunctionOutlined,
    BarChartOutlined,
    NumberOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { JsonViewer } from './JsonViewer';
import { useScenario } from '../../../contexts/ScenarioContext';

const { Title, Text } = Typography;

const RealRootDetailsPanel = ({ node, onClose }) => {
    const [pathData, setPathData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { getValueByPath } = useScenario();

    const rootType = node.data.rootType || 'scalar';
    const path = node.data.path || [];
    const fullPath = path.join('.');

    // Type configuration
    const typeConfig = {
        complex: {
            icon: <FunctionOutlined />,
            badge: '⚡',
            color: '#722ed1',
            description: 'Complex transformation with custom logic'
        },
        distribution: {
            icon: <BarChartOutlined />,
            badge: '📊',
            color: '#52c41a',
            description: 'Probabilistic data with multiple percentiles'
        },
        scalar: {
            icon: <NumberOutlined />,
            badge: '📏',
            color: '#1890ff',
            description: 'Single value or simple data structure'
        }
    };

    const config = typeConfig[rootType];

    // Lazy load path data
    const loadPathData = async () => {
        if (!path || path.length === 0) {
            setError('No path available');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`🔍 Loading data for path: ${fullPath}`);
            const data = getValueByPath(path);
            setPathData(data);
            console.log(`✅ Loaded data for ${fullPath}:`, data);
        } catch (err) {
            console.error(`❌ Failed to load path data:`, err);
            setError(`Failed to load data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load on mount
    useEffect(() => {
        loadPathData();
    }, [node.id]);

    return (
        <div style={{
            width: '340px',
            height: '100%',
            borderLeft: '1px solid #f0f0f0',
            backgroundColor: '#fafafa',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: 'white'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
                        <DatabaseOutlined style={{ marginRight: '6px', color: '#13c2c2' }} />
                        Real Root Data
                    </Title>
                    <Button type="text" icon={<CloseOutlined />} onClick={onClose} size="small" />
                </div>

                <div style={{ marginBottom: '8px' }}>
                    <Space>
                        <span style={{ fontSize: '16px' }}>{config.badge}</span>
                        <Tag color={config.color} style={{ fontSize: '10px' }}>
                            {config.icon} {rootType.toUpperCase()}
                        </Tag>
                        {node.data.dependentCount > 0 && (
                            <Tag color="orange" style={{ fontSize: '10px' }}>
                                {node.data.dependentCount} dependents
                            </Tag>
                        )}
                    </Space>
                </div>

                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                    {config.description}
                </Text>
            </div>

            {/* Path Information */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#f9f9f9'
            }}>
                <Descriptions size="small" column={1} colon={false}>
                    <Descriptions.Item label={<Text strong style={{ fontSize: '11px' }}>Full Path</Text>}>
                        <Text code style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                            {fullPath}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Text strong style={{ fontSize: '11px' }}>Display Name</Text>}>
                        <Text style={{ fontSize: '11px' }}>
                            {path.length > 1 ? path.slice(-2).join('.') : node.data.label}
                        </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Text strong style={{ fontSize: '11px' }}>Has Percentiles</Text>}>
                        <Tag color={node.data.hasPercentiles ? 'green' : 'default'} size="small">
                            {node.data.hasPercentiles ? 'Yes' : 'No'}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>
            </div>

            {/* Data Preview */}
            <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '12px' }}>Data Preview</Text>
                    <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={loadPathData}
                        loading={loading}
                        style={{ fontSize: '10px' }}
                    >
                        Reload
                    </Button>
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="small" />
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
                            Loading path data...
                        </div>
                    </div>
                )}

                {error && (
                    <Alert
                        message="Load Error"
                        description={error}
                        type="error"
                        size="small"
                        showIcon
                    />
                )}

                {!loading && !error && pathData && (
                    <JsonViewer
                        data={pathData}
                        compact={false}
                        maxHeight="100%"
                    />
                )}

                {!loading && !error && !pathData && (
                    <Alert
                        message="No Data"
                        description="No data found at the specified path."
                        type="info"
                        size="small"
                        showIcon
                    />
                )}
            </div>
        </div>
    );
};

export default RealRootDetailsPanel;