// Enhanced insights panel component for DriverExplorerCard
import React, { useMemo } from 'react';
import { Row, Col, Space, Typography, Tag, Statistic, Card, Progress, Tooltip } from 'antd';
import {
    ArrowUpOutlined,      // For positive trends
    ArrowDownOutlined,    // For negative trends
    RiseOutlined,         // Alternative for positive
    FallOutlined,         // Alternative for negative
    InfoCircleOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const TornadoInsightsPanel = ({
    tornadoData,
    targetMetricConfig,
    analysisPercentiles,
    correlationThreshold = 0.1
}) => {
    // Calculate comprehensive insights
    const insights = useMemo(() => {
        if (!tornadoData?.chartData?.[0]?.data?.length) return null;

        const data = tornadoData.chartData[0].data;

        // Filter by threshold
        const significantData = data.filter(d => Math.abs(d.value) >= correlationThreshold);

        // Categorize relationships
        const positiveCorrelations = significantData.filter(d => d.value > 0);
        const negativeCorrelations = significantData.filter(d => d.value < 0);

        // Strength categories
        const strongCorrelations = significantData.filter(d => Math.abs(d.value) >= 0.5);
        const moderateCorrelations = significantData.filter(d => Math.abs(d.value) >= 0.3 && Math.abs(d.value) < 0.5);
        const weakCorrelations = significantData.filter(d => Math.abs(d.value) >= correlationThreshold && Math.abs(d.value) < 0.3);

        // Risk assessment
        const maxCorrelation = Math.max(...significantData.map(d => Math.abs(d.value)));
        const averageCorrelation = significantData.reduce((sum, d) => sum + Math.abs(d.value), 0) / significantData.length;

        // Top drivers by category
        const topPositive = positiveCorrelations.sort((a, b) => b.value - a.value)[0];
        const topNegative = negativeCorrelations.sort((a, b) => a.value - b.value)[0];

        // Risk level assessment
        let riskLevel = 'low';
        let riskColor = 'green';
        let riskDescription = 'Low correlation risk';

        if (strongCorrelations.length > 5) {
            riskLevel = 'high';
            riskColor = 'red';
            riskDescription = `High concentration risk: ${strongCorrelations.length} strong correlations`;
        } else if (strongCorrelations.length > 2 || maxCorrelation > 0.8) {
            riskLevel = 'medium';
            riskColor = 'orange';
            riskDescription = `Moderate risk: ${strongCorrelations.length} strong correlations`;
        }

        return {
            totalVariables: data.length,
            significantVariables: significantData.length,
            positiveCount: positiveCorrelations.length,
            negativeCount: negativeCorrelations.length,
            strongCount: strongCorrelations.length,
            moderateCount: moderateCorrelations.length,
            weakCount: weakCorrelations.length,
            maxCorrelation,
            averageCorrelation,
            topPositive,
            topNegative,
            riskLevel,
            riskColor,
            riskDescription,
            diversificationScore: Math.max(0, 100 - (strongCorrelations.length * 20)) // Simple diversification score
        };
    }, [tornadoData, correlationThreshold]);

    if (!insights) return null;

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Risk Assessment */}
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                <Row gutter={16} align="middle">
                    <Col span={6}>
                        <Space>
                            <ThunderboltOutlined style={{ color: insights.riskColor === 'red' ? '#ff4d4f' : insights.riskColor === 'orange' ? '#faad14' : '#52c41a' }} />
                            <Space direction="vertical" size={0}>
                                <Text strong style={{ fontSize: '12px' }}>Risk Level</Text>
                                <Tag color={insights.riskColor} style={{ margin: 0 }}>
                                    {insights.riskLevel.toUpperCase()}
                                </Tag>
                            </Space>
                        </Space>
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Diversification"
                            value={insights.diversificationScore}
                            suffix="%"
                            valueStyle={{ fontSize: '16px' }}
                            precision={0}
                        />
                        <Progress
                            percent={insights.diversificationScore}
                            size="small"
                            showInfo={false}
                            strokeColor={insights.diversificationScore > 70 ? '#52c41a' : insights.diversificationScore > 40 ? '#faad14' : '#ff4d4f'}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Max Correlation"
                            value={insights.maxCorrelation * 100}
                            suffix="%"
                            valueStyle={{ fontSize: '16px' }}
                            precision={1}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Avg Correlation"
                            value={insights.averageCorrelation * 100}
                            suffix="%"
                            valueStyle={{ fontSize: '16px' }}
                            precision={1}
                        />
                    </Col>
                </Row>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                    {insights.riskDescription}
                </Text>
            </Card>

            {/* Correlation Breakdown */}
            <Row gutter={16}>
                <Col span={8}>
                    <Card size="small">
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Space>
                                <RiseOutlined style={{ color: '#52c41a' }} />
                                <Text strong>Positive Drivers</Text>
                            </Space>
                            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#52c41a' }}>
                                {insights.positiveCount}
                            </Text>
                            {insights.topPositive && (
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Strongest:</Text>
                                    <Tooltip title={`${(insights.topPositive.value * 100).toFixed(1)}% correlation`}>
                                        <Text style={{ fontSize: '12px' }} ellipsis>
                                            {insights.topPositive.label}
                                        </Text>
                                    </Tooltip>
                                </Space>
                            )}
                        </Space>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card size="small">
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Space>
                                <FallOutlined style={{ color: '#ff4d4f' }} />
                                <Text strong>Negative Drivers</Text>
                            </Space>
                            <Text style={{ fontSize: '20px', fontWeight: 600, color: '#ff4d4f' }}>
                                {insights.negativeCount}
                            </Text>
                            {insights.topNegative && (
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>Strongest:</Text>
                                    <Tooltip title={`${(Math.abs(insights.topNegative.value) * 100).toFixed(1)}% correlation`}>
                                        <Text style={{ fontSize: '12px' }} ellipsis>
                                            {insights.topNegative.label}
                                        </Text>
                                    </Tooltip>
                                </Space>
                            )}
                        </Space>
                    </Card>
                </Col>

                <Col span={8}>
                    <Card size="small">
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Space>
                                <InfoCircleOutlined style={{ color: '#1677ff' }} />
                                <Text strong>Correlation Strength</Text>
                            </Space>
                            <Space size="small">
                                <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
                                    {insights.strongCount} Strong
                                </Tag>
                                <Tag color="default" style={{ fontSize: '10px', margin: 0 }}>
                                    {insights.moderateCount} Moderate
                                </Tag>
                                <Tag color="default" style={{ fontSize: '10px', margin: 0 }}>
                                    {insights.weakCount} Weak
                                </Tag>
                            </Space>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                {insights.significantVariables} of {insights.totalVariables} variables analyzed
                            </Text>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Impact Analysis */}
            <Card size="small" title="Impact Analysis" style={{ backgroundColor: '#f8f9fa' }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: '12px' }}>Percentile Range Impact</Text>
                            <Text>
                                Moving from <Tag color="blue">P{analysisPercentiles[0]}</Tag> to{' '}
                                <Tag color="green">P{analysisPercentiles[1]}</Tag> shows:
                            </Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                • {insights.positiveCount} variables increase {targetMetricConfig?.metadata?.name || 'target metric'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                • {insights.negativeCount} variables decrease {targetMetricConfig?.metadata?.name || 'target metric'}
                            </Text>
                        </Space>
                    </Col>
                    <Col span={12}>
                        <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: '12px' }}>Key Recommendations</Text>
                            {insights.riskLevel === 'high' && (
                                <Text type="danger" style={{ fontSize: '11px' }}>
                                    • Consider diversifying input assumptions
                                </Text>
                            )}
                            {insights.strongCount > 0 && (
                                <Text style={{ fontSize: '11px' }}>
                                    • Focus risk management on top {Math.min(3, insights.strongCount)} drivers
                                </Text>
                            )}
                            {insights.diversificationScore < 50 && (
                                <Text type="warning" style={{ fontSize: '11px' }}>
                                    • High correlation concentration detected
                                </Text>
                            )}
                            <Text style={{ fontSize: '11px' }}>
                                • Monitor correlations above {(correlationThreshold * 100)}% threshold
                            </Text>
                        </Space>
                    </Col>
                </Row>
            </Card>
        </Space>
    );
};

export default TornadoInsightsPanel;