// frontend/src/components/cards/components/InsightsPanel.jsx
// Created from scratch

import React, { useMemo } from 'react';
import { Row, Col, Statistic, Card, Tag, Space, Typography } from 'antd';
import { TrophyOutlined, RiseOutlined, FallOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const InsightsPanel = ({
    sensitivityResults,
    metricConfig,
    targetMetric,
    highlightedDriver,
    confidenceLevel
}) => {
    // Generate insights from sensitivity results
    const insights = useMemo(() => {
        if (!sensitivityResults.length) return null;

        // Sort by impact magnitude
        const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);

        // Top drivers
        const topDrivers = sortedResults.slice(0, 3);

        // Categorize by variable type
        const byType = sortedResults.reduce((acc, result) => {
            const type = result.variableType || 'unknown';
            if (!acc[type]) acc[type] = [];
            acc[type].push(result);
            return acc;
        }, {});

        // Summary statistics
        const impacts = sortedResults.map(r => r.impact);
        const maxImpact = Math.max(...impacts);
        const minImpact = Math.min(...impacts);
        const avgImpact = impacts.reduce((a, b) => a + b, 0) / impacts.length;

        return {
            topDrivers: topDrivers.map(driver => ({
                name: driver.variable,
                impact: metricConfig.impactFormat(driver.impact),
                type: driver.displayCategory || driver.category,
                variableId: driver.variableId
            })),
            summary: {
                totalVariables: sensitivityResults.length,
                maxImpact: metricConfig.impactFormat(maxImpact),
                minImpact: metricConfig.impactFormat(minImpact),
                avgImpact: metricConfig.impactFormat(avgImpact),
                typeBreakdown: Object.keys(byType).map(type => ({
                    type,
                    count: byType[type].length
                }))
            }
        };
    }, [sensitivityResults, metricConfig]);

    if (!insights) {
        return null;
    }

    const { topDrivers, summary } = insights;

    return (
        <div>
            <Title level={5} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                <ThunderboltOutlined style={{ marginRight: 8, color: '#faad14' }} />
                Key Insights
            </Title>

            <Row gutter={[16, 12]}>
                {/* Top Drivers */}
                <Col span={12}>
                    <Card size="small" title={
                        <Space>
                            <TrophyOutlined style={{ color: '#faad14' }} />
                            Top Impact Drivers
                        </Space>
                    }>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            {topDrivers.map((driver, index) => {
                                const isHighlighted = driver.variableId === highlightedDriver;
                                const colors = ['#fa8c16', '#52c41a', '#1890ff'];
                                const bgColors = ['#fff7e6', '#f6ffed', '#f0f5ff'];
                                const borderColors = ['#ffd591', '#b7eb8f', '#91d5ff'];

                                return (
                                    <div
                                        key={driver.variableId}
                                        style={{
                                            padding: '8px 12px',
                                            background: isHighlighted ? '#e6f7ff' : bgColors[index],
                                            borderRadius: 4,
                                            border: '1px solid',
                                            borderColor: isHighlighted ? '#1890ff' : borderColors[index],
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <Row justify="space-between" align="middle">
                                            <Col>
                                                <Text strong style={{ fontSize: 13 }}>
                                                    #{index + 1} {driver.name}
                                                </Text>
                                                <br />
                                                <Tag size="small" color={
                                                    index === 0 ? 'gold' :
                                                        index === 1 ? 'green' : 'blue'
                                                }>
                                                    {driver.type}
                                                </Tag>
                                            </Col>
                                            <Col>
                                                <Text strong style={{
                                                    color: isHighlighted ? '#1890ff' : colors[index],
                                                    fontSize: 14
                                                }}>
                                                    {driver.impact}
                                                </Text>
                                            </Col>
                                        </Row>
                                    </div>
                                );
                            })}
                        </Space>
                    </Card>
                </Col>

                {/* Summary Statistics */}
                <Col span={12}>
                    <Card size="small" title="Analysis Summary">
                        <Row gutter={[8, 8]}>
                            <Col span={12}>
                                <Statistic
                                    title="Variables Analyzed"
                                    value={summary.totalVariables}
                                    prefix={<RiseOutlined />}
                                    valueStyle={{ fontSize: 16 }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Confidence Level"
                                    value={confidenceLevel}
                                    suffix="%"
                                    valueStyle={{ fontSize: 16 }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Max Impact"
                                    value={summary.maxImpact}
                                    valueStyle={{ fontSize: 14, color: '#ff4d4f' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Avg Impact"
                                    value={summary.avgImpact}
                                    valueStyle={{ fontSize: 14, color: '#1890ff' }}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* Variable Types Breakdown */}
            <Row style={{ marginTop: 12 }}>
                <Col span={24}>
                    <Space wrap>
                        <Text type="secondary">Variable types:</Text>
                        {summary.typeBreakdown.map(({ type, count }) => {
                            const colorMap = {
                                multiplier: 'blue',
                                revenue: 'green',
                                cost: 'red',
                                technical: 'purple',
                                financing: 'orange',
                                operational: 'cyan'
                            };
                            return (
                                <Tag key={type} color={colorMap[type] || 'default'}>
                                    {count} {type}
                                </Tag>
                            );
                        })}
                    </Space>
                </Col>
            </Row>

            {/* Highlighted Driver Info */}
            {highlightedDriver && (
                <div style={{
                    marginTop: 12,
                    padding: 8,
                    background: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    borderRadius: 4
                }}>
                    <Space>
                        <Text type="secondary">Selected:</Text>
                        <Text strong>{highlightedDriver}</Text>
                        <Text type="secondary">
                            • Click chart bars to highlight variables
                        </Text>
                    </Space>
                </div>
            )}
        </div>
    );
};

export default InsightsPanel;