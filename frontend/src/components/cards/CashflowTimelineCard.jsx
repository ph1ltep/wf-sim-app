// src/components/cards/CashflowTimelineCard.jsx - Complete timeline card with audit trail
import React, { useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button } from 'antd';
import { LineChartOutlined, InfoCircleOutlined, AuditOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';

const { Text } = Typography;

const CashflowTimelineCard = ({ cashflowData, selectedPercentiles }) => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (!cashflowData || !cashflowData.aggregations) {
            return { data: [], layout: {} };
        }

        const { totalCosts, totalRevenue, netCashflow } = cashflowData.aggregations;

        // Revenue trace (positive, green)
        const revenueTrace = {
            x: totalRevenue.data.map(d => d.year),
            y: totalRevenue.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Revenue',
            line: { color: '#52c41a', width: 3 },
            marker: { size: 6 },
            hovertemplate: 'Year: %{x}<br>Revenue: $%{y:,.0f}<extra></extra>'
        };

        // Costs trace (negative, red)
        const costsTrace = {
            x: totalCosts.data.map(d => d.year),
            y: totalCosts.data.map(d => -d.value), // Negative for visual clarity
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Costs',
            line: { color: '#ff4d4f', width: 3 },
            marker: { size: 6 },
            hovertemplate: 'Year: %{x}<br>Costs: $%{y:,.0f}<extra></extra>'
        };

        // Net cashflow trace (blue)
        const netTrace = {
            x: netCashflow.data.map(d => d.year),
            y: netCashflow.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Net Cash Flow',
            line: { color: '#1890ff', width: 4 },
            marker: { size: 8 },
            hovertemplate: 'Year: %{x}<br>Net Cash Flow: $%{y:,.0f}<extra></extra>'
        };

        // Add zero line
        const years = netCashflow.data.map(d => d.year);
        const zeroTrace = {
            x: years,
            y: years.map(() => 0),
            type: 'scatter',
            mode: 'lines',
            name: 'Break-even',
            line: { color: '#999', width: 1, dash: 'dash' },
            showlegend: false,
            hoverinfo: 'skip'
        };

        const layout = {
            title: '',
            xaxis: {
                title: 'Project Year',
                showgrid: true,
                gridcolor: '#f0f0f0'
            },
            yaxis: {
                title: `Cash Flow (${cashflowData.metadata.currency})`,
                showgrid: true,
                gridcolor: '#f0f0f0',
                tickformat: '$,.0s'
            },
            legend: {
                orientation: 'h',
                y: -0.2
            },
            margin: { t: 20, b: 80, l: 80, r: 20 },
            height: 400,
            plot_bgcolor: '#fafafa'
        };

        return {
            data: [zeroTrace, costsTrace, revenueTrace, netTrace],
            layout
        };
    }, [cashflowData]);

    // Get multiplier info for display
    const multiplierInfo = useMemo(() => {
        if (!cashflowData?.lineItems) return [];

        const multipliers = new Set();
        cashflowData.lineItems.forEach(item => {
            item.metadata.appliedMultipliers?.forEach(m => {
                multipliers.add(m.id);
            });
        });

        return Array.from(multipliers);
    }, [cashflowData]);

    // Error states
    if (!cashflowData) {
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Empty description="No cashflow data available" />
            </Card>
        );
    }

    if (!cashflowData.aggregations || cashflowData.lineItems.length === 0) {
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Alert
                    message="No Data"
                    description="No line items available for timeline display."
                    type="info"
                    showIcon
                />
            </Card>
        );
    }

    return (
        <>
            <Card
                title={
                    <Space>
                        <LineChartOutlined />
                        <Text>Cash Flow Timeline</Text>
                    </Space>
                }
                variant="outlined"
                extra={
                    <Space>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {cashflowData.lineItems.length} line items
                        </Text>
                        {multiplierInfo.length > 0 && (
                            <Tag icon={<InfoCircleOutlined />} color="blue" size="small">
                                {multiplierInfo.length} multipliers
                            </Tag>
                        )}
                        <Button
                            icon={<AuditOutlined />}
                            size="small"
                            onClick={() => setAuditTrailVisible(true)}
                        >
                            Audit Trail
                        </Button>
                    </Space>
                }
            >
                <Plot
                    data={chartData.data}
                    layout={chartData.layout}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%' }}
                />

                {/* Metadata footer */}
                <div style={{
                    marginTop: 16,
                    padding: '8px 0',
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#999'
                }}>
                    <span>
                        Strategy: {cashflowData.metadata.percentileStrategy.strategy === 'unified'
                            ? `Unified P${selectedPercentiles?.unified || 50}`
                            : 'Per-Source'
                        }
                    </span>
                    <span>
                        Project: {cashflowData.metadata.projectLife} years, {cashflowData.metadata.numWTGs} WTGs
                    </span>
                </div>
            </Card>

            {/* Audit Trail Viewer */}
            <AuditTrailViewer
                cashflowData={cashflowData}
                visible={auditTrailVisible}
                onClose={() => setAuditTrailVisible(false)}
            />
        </>
    );
};

export default CashflowTimelineCard;