// frontend/src/components/cards/FinanceabilityCard.jsx - Simplified to only refresh when cube refreshes
import React, { useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button } from 'antd';
import {
    DollarOutlined,
    InfoCircleOutlined,
    AuditOutlined
} from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useScenario } from '../../contexts/ScenarioContext';
import { useCubeMetrics } from '../../hooks/useCubeMetrics';
import { useCubeSources } from '../../hooks/useCubeSources';
import { useCube } from '../../contexts/CubeContext';
import AuditTrailViewer from '../AuditTrail/AuditTrailViewer';
import { MetricsTable } from '../tables';
import {
    createFinanceabilityRowConfig,
    createFinanceabilityColConfig,
    createFinanceabilityChartConfig, // NEW: Import chart config function
    prepareFinanceabilityChartData,  // NEW: Import chart data function
    calculateCovenantAnalysis,
    getBankabilityRiskLevel
} from './configs/FinanceabilityConfig';
import { theme } from 'antd';
//import { set } from 'lodash';

const { Text, Title } = Typography;
const { useToken } = theme;

const FinanceabilityCard = () => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    //const [selectedChartPercentile, setSelectedChartPercentile] = useState(null);
    const { token } = useToken();
    const { getPercentileData, setSelectedPercentile } = useCube();

    // Use cube metrics hook
    const { getMetric, prepareMetricsTable, cubeStatus, isLoading, hasError, isReady } = useCubeMetrics();
    const { getValueByPath } = useScenario();
    const { getData: getSourceData } = useCubeSources();

    // Constants
    const chartSourceIds = ['dscr', 'llcr', 'icr'];
    const cardMetricIds = ['projectIRR', 'equityIRR', 'projectNPV', 'dscrMetrics', 'paybackPeriod'];

    // Static configuration - separate useMemo
    const staticConfig = useMemo(() => ({
        localCurrency: getValueByPath(['settings', 'project', 'currency', 'local']) || 'USD',
        projectLife: getValueByPath(['settings', 'general', 'projectLife']) || 20,
        covenantThreshold: getValueByPath(['settings', 'modules', 'financing', 'minimumDSCR']) || 1.3
    }), [getValueByPath]);

    // Percentile information - separate useMemo
    const percentileInfo = useMemo(() => {
        return getPercentileData();
    }, [getPercentileData]);

    // Everything depends ONLY on cube refresh - all data is computed together
    const cardData = useMemo(() => {
        if (!isReady) {
            return {
                metricsTableData: { data: [], config: { columns: [] }, errors: ['Cube data not ready'] },
                cubeMetricsData: {},
                covenantAnalysis: null,
                bankabilityRisk: null,
                staticConfig: {
                    localCurrency: 'USD',
                    projectLife: 20,
                    covenantThreshold: 1.3
                }
            };
        }

        console.log('🏦 FinanceabilityCard: loading all data from cube');

        // Create table configurations
        const rowConfig = createFinanceabilityRowConfig(staticConfig.localCurrency);
        const colConfig = createFinanceabilityColConfig(
            percentileInfo,
            (percentile, columnKey, rowData) => {
                console.log(`📊 Column selected: ${percentile} for ${rowData?.key}`);
                setSelectedPercentile(percentile); // Only update global selection
            },
            token
        );

        // ✅ Add selectedColumn to colConfig
        colConfig.selectedColumn = `P${percentileInfo.selected}`;

        // Prepare metrics table data
        const metricsTableData = prepareMetricsTable({
            metricIds: cardMetricIds,
            percentileInfo: percentileInfo,
            rowConfig,
            colConfig
        });

        // Get cube metrics data
        let cubeMetricsData = {};
        try {
            cubeMetricsData = getMetric({ metricIds: cardMetricIds });
        } catch (error) {
            console.error('❌ FinanceabilityCard: Failed to get cube metrics data:', error);
        }

        // Calculate covenant analysis
        let covenantAnalysis = null;
        if (cubeMetricsData?.minDSCR && percentileInfo.available?.length) {
            const transformedData = {
                dscr: {},
                covenantBreaches: {},
                covenantThreshold: staticConfig.covenantThreshold
            };

            percentileInfo.available.forEach(percentile => {
                const dscrData = cubeMetricsData.minDSCR[percentile];
                const breachData = cubeMetricsData.covenantBreaches?.[percentile];

                transformedData.dscr[percentile] = {
                    value: dscrData?.value || 0
                };
                transformedData.covenantBreaches[percentile] = {
                    value: breachData?.value || []
                };
            });

            covenantAnalysis = calculateCovenantAnalysis(
                transformedData,
                percentileInfo.available,
                staticConfig.covenantThreshold
            );
        }

        // Calculate bankability risk
        let bankabilityRisk = null;
        if (cubeMetricsData?.projectIRR && percentileInfo.selected) {
            bankabilityRisk = getBankabilityRiskLevel({
                minDSCR: cubeMetricsData.minDSCR?.[percentileInfo.selected]?.value,
                projectIRR: cubeMetricsData.projectIRR?.[percentileInfo.selected]?.value,
                equityIRR: cubeMetricsData.equityIRR?.[percentileInfo.selected]?.value,
                covenantBreaches: cubeMetricsData.covenantBreaches?.[percentileInfo.selected]?.value || [],
                covenantThreshold: staticConfig.covenantThreshold
            });
        }

        return {
            metricsTableData,
            cubeMetricsData,
            covenantAnalysis,
            bankabilityRisk,
            staticConfig,
            percentileInfo
        };
    }, [
        cubeStatus.lastRefresh, // ONLY dependency - everything else is derived when cube refreshes
        isReady,
        getValueByPath,
        getPercentileData,
        prepareMetricsTable,
        getMetric,
        staticConfig,      // Now depends on separate useMemo
        percentileInfo,
    ]);

    // Chart data - simplified to use only global percentile selection
    const chartData = useMemo(() => {
        if (!isReady) {
            return { data: [], layout: {}, error: 'Loading...' };
        }

        try {
            // Use global percentile selection directly (like CashflowTimelineCard)
            const primaryPercentile = percentileInfo.primary;
            const selectedPercentile = percentileInfo.selected;

            console.log(`🔄 FinanceabilityCard: Getting chart data - Primary: P${primaryPercentile}, Selected: P${selectedPercentile}`);

            // Always get primary data
            const primaryData = getSourceData({
                sourceIds: chartSourceIds,
                percentile: primaryPercentile
            });

            // Get selected data
            const selectedData = getSourceData({
                sourceIds: chartSourceIds,
                percentile: selectedPercentile
            });

            // Validate that we have at least some data
            const hasPrimaryData = primaryData && Object.keys(primaryData).length > 0;
            const hasSelectedData = selectedData && Object.keys(selectedData).length > 0;

            if (!hasPrimaryData && !hasSelectedData) {
                return {
                    data: [],
                    layout: {},
                    error: 'Source data not available - check that financing sources (DSCR, LLCR, ICR) are enabled and contain data'
                };
            }

            // Get payback periods for both percentiles
            let primaryPayback = null;
            let selectedPayback = null;
            try {
                const paybackMetric = getMetric({ metricIds: ['paybackPeriod'] });
                primaryPayback = paybackMetric?.paybackPeriod?.[primaryPercentile]?.value || null;
                selectedPayback = paybackMetric?.paybackPeriod?.[selectedPercentile]?.value || null;
            } catch (error) {
                console.warn('⚠️ Could not get payback periods:', error);
            }

            // Create chart config with both datasets
            const chartConfig = createFinanceabilityChartConfig({
                primaryData: hasPrimaryData ? primaryData : null,
                selectedData: hasSelectedData ? selectedData : null,
                percentileInfo, // Pass the whole percentileInfo object
                staticConfig,
                primaryPayback,
                selectedPayback,
                token
            });

            return prepareFinanceabilityChartData(chartConfig);

        } catch (error) {
            console.error('❌ FinanceabilityCard: Chart preparation failed:', error);
            return {
                data: [],
                layout: {},
                error: `Chart error: ${error.message}`
            };
        }
    }, [
        cubeStatus.lastRefresh,
        isReady,
        getSourceData,
        getMetric,
        staticConfig,
        percentileInfo.primary,     // Primary percentile changes
        percentileInfo.selected,    // Global selected percentile changes (updated by MetricsTable)
        token
    ]);

    // Error states
    if (hasError) {
        return (
            <Card title="Financeability Analysis" variant="outlined">
                <Alert
                    type="error"
                    message="Cube Data Error"
                    description={`Failed to load financial data: ${cubeStatus.error}`}
                    showIcon
                />
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card title="Financeability Analysis" variant="outlined" loading>
                <div style={{ height: 200 }} />
            </Card>
        );
    }

    if (!isReady) {
        return (
            <Card title="Financeability Analysis" variant="outlined">
                <Empty description="No financial metrics available from cube data" />
            </Card>
        );
    }

    const { metricsTableData, covenantAnalysis, bankabilityRisk } = cardData;

    // Show preparation errors if any
    if (metricsTableData.errors?.length > 0) {
        console.warn('FinanceabilityCard: Metrics table preparation errors:', metricsTableData.errors);
    }

    return (
        <>
            <Card
                title={
                    <Space>
                        <DollarOutlined />
                        <span>Financeability Analysis</span>
                        {bankabilityRisk && (
                            <Tag color={bankabilityRisk.color}>
                                {bankabilityRisk.level.toUpperCase()}
                            </Tag>
                        )}
                    </Space>
                }
                variant="outlined"
                extra={
                    <Space>
                        <Button
                            icon={<InfoCircleOutlined />}
                            size="small"
                            type="text"
                        >
                            P{percentileInfo.selected || percentileInfo.primary}
                        </Button>
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
                {/* Debug Info */}
                {metricsTableData.errors?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Alert
                            type="warning"
                            message="Metrics Table Preparation Issues"
                            description={
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {metricsTableData.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            }
                            showIcon
                            closable
                        />
                    </div>
                )}

                {/* Financial Metrics Table */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ margin: '0 0 12px 0' }}>
                        Financial Metrics
                        <Text style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: 8 }}>
                            (All percentiles - click to highlight in chart)
                        </Text>
                    </Title>
                    <MetricsTable
                        data={metricsTableData.data}
                        config={metricsTableData.config}
                        loading={isLoading}
                        theme="metrics"
                    />
                </div>

                {/* Covenant Analysis Summary */}
                {covenantAnalysis && (
                    <div style={{ marginBottom: 24 }}>
                        <Alert
                            type={covenantAnalysis.severity === 'high' ? 'error' : covenantAnalysis.severity === 'medium' ? 'warning' : 'info'}
                            message={`Covenant Analysis: ${covenantAnalysis.breachCount} potential breaches across percentiles`}
                            description={covenantAnalysis.summary}
                            showIcon
                        />
                    </div>
                )}

                {/* DSCR Timeline Chart */}
                <div style={{ marginBottom: 16 }}>
                    <Title level={5} style={{ margin: '0 0 12px 0' }}>
                        Debt Service Coverage Analysis
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                            {' '}(DSCR, LLCR, ICR - P{percentileInfo.selected || percentileInfo.selected})
                        </span>
                        {percentileInfo.selected && (
                            <Button
                                size="small"
                                type="link"
                                onClick={() => setSelectedPercentile(null)}
                                style={{ marginLeft: 8, fontSize: '11px' }}
                            >
                                Reset to P{percentileInfo.selected}
                            </Button>
                        )}
                    </Title>
                    {chartData.error ? (
                        <Alert
                            type="info"
                            message={chartData.error}
                            description="Enable financing module and ensure debt service data is available"
                        />
                    ) : (
                        <Plot
                            data={chartData.data}
                            layout={chartData.layout}
                            config={{ responsive: true, displayModeBar: false }}
                            style={{ width: '100%' }}
                        />
                    )}
                </div>

                {/* Metadata Footer */}
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
                        Metrics: {cardMetricIds.length} financial metrics,
                        {percentileInfo.available?.length || 0} percentiles
                    </span>
                    <span>
                        Currency: {staticConfig.localCurrency}, Project: {staticConfig.projectLife} years
                        {cubeStatus.version && ` | Cube v${cubeStatus.version}`}
                    </span>
                </div>
            </Card>

            {/* Audit Trail Viewer */}
            <AuditTrailViewer
                cubeMetricsData={cardData.cubeMetricsData}
                visible={auditTrailVisible}
                onClose={() => setAuditTrailVisible(false)}
            />
        </>
    );
};

export default FinanceabilityCard;