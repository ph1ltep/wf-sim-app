// frontend/src/components/cards/CashflowTimelineCard.jsx - Modernized for CubeContext
import React, { useMemo, useState, useEffect } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button, Switch } from 'antd';
import { LineChartOutlined, InfoCircleOutlined, AuditOutlined, SettingOutlined } from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useCube } from '../../contexts/CubeContext';
import { useScenario } from '../../contexts/ScenarioContext';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';
import { useCubeSources } from '../../hooks/useCubeSources';
import {
    createTimelineChartConfig,
    createChartControlsConfig,
    createMetadataFooterConfig,
    validateChartData
} from './configs';

const { Text } = Typography;

const CashflowTimelineCard = () => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    const [showDebtService, setShowDebtService] = useState(true);
    const [showEquityCashflow, setShowEquityCashflow] = useState(true);

    // Get cube data and percentile selection
    const { getPercentileData, setSelectedPercentile } = useCube();
    const { getData, cubeStatus, isLoading, hasError, isReady } = useCubeSources();

    const { getValueByPath } = useScenario();

    // sourceIds for cashflow timeline card
    const cardSourceIds = ['totalRevenue', 'totalCost', 'netCashflow', 'debtService', 'dscr', 'cumulativeCashflow'];

    const percentileInfo = getPercentileData();
    //const selectedPercentile = percentileInfo?.selected;

    // Get cube data for current percentile
    const cubeData = useMemo(() => {

        try {
            console.log(`🔄 CashflowTimelineCard: Getting cube data for percentile ${percentileInfo.selected}`);
            return getData({ sourceIds: cardSourceIds, percentile: percentileInfo.selected });
        } catch (error) {
            console.error('❌ CashflowTimelineCard: Cube data transformation failed:', error);
            return null;
        }
    }, [percentileInfo, getData]);

    // Prepare chart data using cube sources directly
    const chartData = useMemo(() => {

        // ✅ Get fresh percentileInfo inside useMemo
        const percentileInfo = getPercentileData();
        const selectedPercentile = percentileInfo.selected;

        if (!cubeData) {
            return { data: [], layout: {}, error: null };
        }

        // Validate required cube sources
        const validation = validateChartData(cubeData);
        if (!validation.isValid) {
            console.error('❌ CashflowTimelineCard: Chart data validation failed:', validation.error);
            return { data: [], layout: {}, error: validation.error };
        }

        // Check if debt service is available (may be empty from transformer)
        const hasValidDebtService = cubeData.debtService?.data && cubeData.debtService.data.length > 0;
        if (!hasValidDebtService) {
            console.log('ℹ️ CashflowTimelineCard: Debt service data not available, disabling debt service features');
        }

        try {
            return createTimelineChartConfig({
                totalRevenue: cubeData.totalRevenue,
                totalCost: cubeData.totalCost,
                netCashflow: cubeData.netCashflow,
                debtService: hasValidDebtService ? cubeData.debtService : null,
                selectedPercentile,
                showDebtService: showDebtService && hasValidDebtService,
                showEquityCashflow: showEquityCashflow && hasValidDebtService
            });
        } catch (error) {
            console.error('❌ CashflowTimelineCard: Chart configuration failed:', error);
            return {
                data: [],
                layout: {},
                error: `Chart configuration failed: ${error.message}`
            };
        }
    }, [cubeData, percentileInfo, showDebtService, showEquityCashflow, percentileInfo]);

    // Controls configuration
    const controlsConfig = useMemo(() => {
        const hasValidDebtService = cubeData?.debtService?.data && cubeData.debtService.data.length > 0;

        return createChartControlsConfig({
            showDebtService,
            showEquityCashflow,
            onToggleDebtService: setShowDebtService,
            onToggleEquityCashflow: setShowEquityCashflow,
            hasDebtService: hasValidDebtService,
            hasEquityCashflow: hasValidDebtService // Equity cashflow depends on debt service
        });
    }, [showDebtService, showEquityCashflow, cubeData]);

    // Footer configuration
    const footerConfig = useMemo(() => {
        if (!cubeData) return null;

        return createMetadataFooterConfig({
            selectedPercentile: percentileInfo.selected,
            showDebtService,
            showEquityCashflow,
            // Create metadata from cube data
            metadata: {
                projectLife: getValueByPath(['settings', 'general', 'projectLife']), // TODO: Get from cube references
                currency: getValueByPath(['settings', 'project', 'currency', 'local']), // TODO: Get from cube references
                percentileStrategy: { strategy: percentileInfo.strategy }
            }
        });
    }, [cubeData, percentileInfo, showDebtService, showEquityCashflow]);

    // Error states - fail explicitly
    if (!cubeData && !isLoading) {
        console.error('❌ CubeContext sourceData unavailable for CashflowTimelineCard');
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Alert
                    type="error"
                    message="Cube Data Source Not Available"
                    description="CubeContext is not providing source data. Please check cube initialization."
                    showIcon
                />
            </Card>
        );
    }

    if (hasError) {
        console.error('❌ CubeContext error for CashflowTimelineCard:', cubeStatus.error);
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Alert
                    type="error"
                    message="Cube Data Error"
                    description={cubeStatus.error.message || 'Unknown cube data error'}
                    showIcon
                />
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Text>Loading cube data...</Text>
                </div>
            </Card>
        );
    }

    if (!cubeData) {
        return (
            <Card title="Cash Flow Timeline" variant="outlined">
                <Empty description="No cube data available for selected percentile" />
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
                            Cube Data • {(percentileInfo.selected == 0) ? 'Per-source' : 'P' + percentileInfo.selected}
                        </Text>
                        <Button
                            icon={<AuditOutlined />}
                            size="small"
                            onClick={() => setAuditTrailVisible(true)}
                            disabled={!cubeData}
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

            {/* Audit Trail Viewer - Updated for cube data */}
            {cubeData && (
                <AuditTrailViewer
                    sourceIds={cardSourceIds}
                    visible={auditTrailVisible}
                    onClose={() => setAuditTrailVisible(false)}
                />
            )}
        </>
    );
};

export default CashflowTimelineCard;