// src/components/cards/CashflowTimelineCard.jsx - Enhanced with dual-axis support
import React, { useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button, Switch } from 'antd';
import { LineChartOutlined, InfoCircleOutlined, AuditOutlined, SettingOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';
import { prepareDualAxisChartData, addRefinancingAnnotations } from '../../utils/financialChartsUtils';

const { Text } = Typography;

const CashflowTimelineCard = ({ cashflowData, selectedPercentiles }) => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    const [showDebtService, setShowDebtService] = useState(true);
    const [showEquityCashflow, setShowEquityCashflow] = useState(true);

    // Prepare enhanced chart data with dual axes
    const chartData = useMemo(() => {
        if (!cashflowData || !cashflowData.aggregations) {
            return { data: [], layout: {} };
        }

        const { totalCosts, totalRevenue, netCashflow } = cashflowData.aggregations;

        // Find debt service and equity cashflow line items
        const debtServiceLineItem = cashflowData.lineItems?.find(item => item.id === 'operationalDebtService');
        const primaryPercentile = selectedPercentiles?.unified || 50;

        // Get debt service data
        let debtServiceData = null;
        if (debtServiceLineItem && showDebtService) {
            if (debtServiceLineItem.percentileData?.has(primaryPercentile)) {
                debtServiceData = { data: debtServiceLineItem.percentileData.get(primaryPercentile) };
            } else if (debtServiceLineItem.data) {
                debtServiceData = { data: debtServiceLineItem.data };
            }
        }

        // Calculate equity cash flow (net cashflow - debt service)
        let equityCashflowData = null;
        if (showEquityCashflow && debtServiceData?.data) {
            const debtMap = new Map(debtServiceData.data.map(d => [d.year, d.value]));
            const equityData = netCashflow.data.map(cf => ({
                year: cf.year,
                value: cf.value - (debtMap.get(cf.year) || 0)
            }));
            equityCashflowData = { data: equityData };
        }

        // Prepare primary traces (existing cash flows)
        const traces = [];

        // Revenue trace (positive, green)
        traces.push({
            x: totalRevenue.data.map(d => d.year),
            y: totalRevenue.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Revenue',
            line: { color: '#52c41a', width: 3 },
            marker: { size: 6 },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Revenue: $%{y:,.0f}<extra></extra>'
        });

        // Costs trace (negative, red)
        traces.push({
            x: totalCosts.data.map(d => d.year),
            y: totalCosts.data.map(d => -d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Costs',
            line: { color: '#ff4d4f', width: 3 },
            marker: { size: 6 },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Costs: $%{y:,.0f}<extra></extra>'
        });

        // Net cashflow trace (blue)
        traces.push({
            x: netCashflow.data.map(d => d.year),
            y: netCashflow.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Net Cash Flow',
            line: { color: '#1890ff', width: 4 },
            marker: { size: 8 },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Net Cash Flow: $%{y:,.0f}<extra></extra>'
        });

        // Add debt service on secondary axis
        if (debtServiceData?.data && showDebtService) {
            traces.push({
                x: debtServiceData.data.map(d => d.year),
                y: debtServiceData.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Debt Service',
                line: { color: '#722ed1', width: 2, dash: 'dot' },
                marker: { size: 5 },
                yaxis: 'y2',
                hovertemplate: 'Year: %{x}<br>Debt Service: $%{y:,.0f}<extra></extra>'
            });
        }

        // Add equity cash flow on primary axis
        if (equityCashflowData?.data && showEquityCashflow) {
            traces.push({
                x: equityCashflowData.data.map(d => d.year),
                y: equityCashflowData.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Free Cash Flow to Equity',
                line: { color: '#13c2c2', width: 2 },
                marker: { size: 5 },
                yaxis: 'y',
                hovertemplate: 'Year: %{x}<br>Equity Cash Flow: $%{y:,.0f}<extra></extra>'
            });
        }

        // Add zero line
        const years = netCashflow.data.map(d => d.year);
        traces.push({
            x: years,
            y: years.map(() => 0),
            type: 'scatter',
            mode: 'lines',
            name: 'Break-even',
            line: { color: '#999', width: 1, dash: 'dash' },
            yaxis: 'y',
            showlegend: false,
            hoverinfo: 'skip'
        });

        // Create dual-axis layout
        let layout = {
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
                tickformat: '$,.0s',
                side: 'left'
            },
            yaxis2: {
                title: `Debt Service (${cashflowData.metadata.currency})`,
                showgrid: false,
                tickformat: '$,.0s',
                side: 'right',
                overlaying: 'y'
            },
            legend: {
                orientation: 'h',
                y: -0.2
            },
            margin: { t: 20, b: 80, l: 80, r: 80 },
            height: 400,
            plot_bgcolor: '#fafafa'
        };

        // Add refinancing window annotations
        const refinancingWindows = [
            { startYear: 5, endYear: 7, label: 'Typical Refinancing Window', color: '#faad14' }
        ];
        layout = addRefinancingAnnotations(layout, refinancingWindows);

        return { data: traces, layout };
    }, [cashflowData, selectedPercentiles, showDebtService, showEquityCashflow]);

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
                {/* Chart Controls */}
                <div style={{ marginBottom: 16, display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Space>
                        <SettingOutlined style={{ color: '#999' }} />
                        <Text style={{ fontSize: '12px', color: '#666' }}>Display:</Text>
                        <Switch
                            size="small"
                            checked={showDebtService}
                            onChange={setShowDebtService}
                        />
                        <Text style={{ fontSize: '12px' }}>Debt Service</Text>
                        <Switch
                            size="small"
                            checked={showEquityCashflow}
                            onChange={setShowEquityCashflow}
                        />
                        <Text style={{ fontSize: '12px' }}>Equity Cash Flow</Text>
                    </Space>
                </div>

                <Plot
                    data={chartData.data}
                    layout={chartData.layout}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%' }}
                />

                {/* Enhanced metadata footer */}
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
                        {showDebtService && ' • Debt Service'}
                        {showEquityCashflow && ' • Equity Cash Flow'}
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