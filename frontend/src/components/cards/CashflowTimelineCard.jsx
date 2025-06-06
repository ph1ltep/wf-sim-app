// src/components/cards/CashflowTimelineCard.jsx - Enhanced with dual-axis support
import React, { useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button, Switch } from 'antd';
import { LineChartOutlined, InfoCircleOutlined, AuditOutlined, SettingOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';
import {
    createTimelineChartConfig,
    createMultiplierSummary,
    createChartControlsConfig,
    createMetadataFooterConfig,
    validateChartData
} from './configs'; // UPDATED

const { Text } = Typography;

const CashflowTimelineCard = ({ cashflowData, selectedPercentiles }) => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    const [showDebtService, setShowDebtService] = useState(true);
    const [showEquityCashflow, setShowEquityCashflow] = useState(true);

    // Prepare enhanced chart data with dual axes
    const chartData = useMemo(() => {
        const validation = validateChartData(cashflowData);
        if (!validation.isValid) {
            return { data: [], layout: {}, error: validation.error };
        }

        return createTimelineChartConfig({
            cashflowData,
            selectedPercentiles,
            showDebtService,
            showEquityCashflow,
            lineItems: cashflowData.lineItems
        });
    }, [cashflowData, selectedPercentiles, showDebtService, showEquityCashflow]);

    // Get multiplier info for display
    const multiplierInfo = useMemo(() => {
        return createMultiplierSummary(cashflowData?.lineItems);
    }, [cashflowData]);

    // Add new useMemo for controls and metadata:
    const controlsConfig = useMemo(() => {
        const debtServiceLineItem = cashflowData?.lineItems?.find(item => item.id === 'operationalDebtService');

        return createChartControlsConfig({
            showDebtService,
            showEquityCashflow,
            onToggleDebtService: setShowDebtService,
            onToggleEquityCashflow: setShowEquityCashflow,
            hasDebtService: !!debtServiceLineItem,
            hasEquityCashflow: !!debtServiceLineItem
        });
    }, [showDebtService, showEquityCashflow, cashflowData]);

    const footerConfig = useMemo(() => {
        if (!cashflowData) return null;

        return createMetadataFooterConfig({
            cashflowData,
            selectedPercentiles,
            showDebtService,
            showEquityCashflow
        });
    }, [cashflowData, selectedPercentiles, showDebtService, showEquityCashflow]);

    // Error states
    if (!cashflowData) {
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Empty description="No cashflow data available" />
            </Card>
        );
    }

    if (chartData.error) {
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Alert
                    message="Chart Configuration Error"
                    description={chartData.error}
                    type="error"
                    showIcon
                />
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
                        {controlsConfig.controls.map(control => (
                            <Space key={control.key} size="small">
                                <Switch
                                    size="small"
                                    checked={control.checked}
                                    onChange={control.onChange}
                                    disabled={control.disabled}
                                />
                                <Text style={{ fontSize: '12px' }}>{control.label}</Text>
                            </Space>
                        ))}
                    </Space>
                </div>

                <Plot
                    data={chartData.data}
                    layout={chartData.layout}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: '100%' }}
                />

                {/* Enhanced metadata footer */}
                {footerConfig && (
                    <div style={{
                        marginTop: 16,
                        padding: '8px 0',
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#999'
                    }}>
                        <span>{footerConfig.left}</span>
                        <span>{footerConfig.right}</span>
                    </div>
                )}
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