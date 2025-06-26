// frontend/src/components/cards/components/InsightsPanel.jsx
// Complete rewrite with compact, consistent formatting

import React, { useMemo } from 'react';
import { Row, Col, Statistic, Card, Tag, Space, Typography } from 'antd';
import { TrophyOutlined, RiseOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { getCategoryColorScheme } from '../../../utils/charts/colors';

const { Text, Title } = Typography;

const InsightsPanel = ({
    sensitivityResults,
    metricConfig,
    targetMetric,
    highlightedDriver,
    confidenceLevel,
    onDriverSelect // Add this prop for handling driver clicks
}) => {
    // Generate insights from sensitivity results
    const insights = useMemo(() => {
        if (!sensitivityResults.length) return null;

        // Sort by total spread (percentage impact)
        const sortedResults = [...sensitivityResults].sort((a, b) => b.totalSpread - a.totalSpread);

        // Top drivers
        const topDrivers = sortedResults.slice(0, 3);

        // Categorize by variable type
        const byType = sortedResults.reduce((acc, result) => {
            const type = result.variableType || 'unknown';
            if (!acc[type]) acc[type] = [];
            acc[type].push(result);
            return acc;
        }, {});

        // Summary statistics using totalSpread instead of impact
        const spreads = sortedResults.map(r => r.totalSpread);
        const maxSpread = Math.max(...spreads);
        const minSpread = Math.min(...spreads);
        const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;

        return {
            topDrivers: topDrivers.map(driver => ({
                name: driver.variable,
                impact: `${driver.totalSpread.toFixed(1)}%`, // Use percentage spread
                type: driver.variableType || driver.category,
                variableId: driver.variableId
            })),
            summary: {
                totalVariables: sensitivityResults.length,
                maxSpread: `${maxSpread.toFixed(1)}%`,
                minSpread: `${minSpread.toFixed(1)}%`,
                avgSpread: `${avgSpread.toFixed(1)}%`,
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
    const colors = ['#ff4d4f', '#faad14', '#52c41a']; // Red, Orange, Green for top 3

    return (
        <Card size="small" title="Key Insights" style={{ marginTop: 0 }}>
            <Row gutter={[24, 16]}>
                {/* Left side - Top Impact Drivers */}
                <Col span={14}>
                    <Text strong style={{ fontSize: '13px', marginBottom: 8, display: 'block' }}>
                        Top Impact Drivers
                    </Text>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        {topDrivers.map((driver, index) => {
                            // USE THEMING ENGINE INSTEAD OF FIXED COLORS
                            const driverColor = getCategoryColorScheme(driver.type);

                            return (
                                <div
                                    key={driver.variableId}
                                    style={{
                                        padding: '6px 8px',
                                        background: '#fafafa',
                                        borderRadius: 4,
                                        border: '1px solid #e8e8e8',
                                        borderLeft: `4px solid ${driverColor}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                        <Text style={{
                                            fontWeight: 500,
                                            fontSize: '12px',
                                            marginRight: 8,
                                            color: '#595959'
                                        }}>
                                            #{index + 1}
                                        </Text>
                                        <Text style={{ fontSize: '12px' }}>
                                            {driver.name}
                                        </Text>
                                    </div>
                                    <Text strong style={{ fontSize: '12px', color: driverColor }}>
                                        {driver.impact}
                                    </Text>
                                </div>
                            );
                        })}
                    </Space>

                    {/* Legend - USE THEMING ENGINE */}
                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #e8e8e8' }}>
                        <Text type="secondary" style={{ fontSize: '10px', marginBottom: 4, display: 'block' }}>
                            Categories:
                        </Text>
                        <Space wrap size={[8, 4]}>
                            {summary.typeBreakdown.map(({ type, count }) => {
                                // USE THEMING ENGINE FOR LEGEND COLORS
                                const categoryColor = getCategoryColorScheme(type);
                                return (
                                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{
                                            width: 8,
                                            height: 8,
                                            background: categoryColor,
                                            borderRadius: 2
                                        }} />
                                        <Text style={{ fontSize: '10px', color: '#595959' }}>
                                            {count} {type}
                                        </Text>
                                    </div>
                                );
                            })}
                        </Space>
                    </div>
                </Col>

                {/* Right side - Summary KPIs unchanged */}
                <Col span={10}>
                    <Text strong style={{ fontSize: '13px', marginBottom: 8, display: 'block' }}>
                        Analysis Summary
                    </Text>
                    <Row gutter={[12, 8]}>
                        <Col span={12}>
                            <Statistic
                                title="Variables"
                                value={summary.totalVariables}
                                valueStyle={{ fontSize: 16, fontWeight: 600 }}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="Confidence"
                                value={confidenceLevel}
                                suffix="%"
                                valueStyle={{ fontSize: 16, fontWeight: 600 }}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="Max Impact"
                                value={summary.maxSpread}
                                valueStyle={{ fontSize: 14, color: '#ff4d4f' }}
                            />
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title="Avg Impact"
                                value={summary.avgSpread}
                                valueStyle={{ fontSize: 14, color: '#1890ff' }}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Card>
    );
};

export default InsightsPanel;