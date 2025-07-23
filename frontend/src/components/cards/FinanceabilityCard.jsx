// frontend/src/components/cards/FinanceabilityCard.jsx - Simplified to only refresh when cube refreshes
import React, { use, useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button } from 'antd';
import {
    DollarOutlined,
    SafetyOutlined,
    InfoCircleOutlined,
    AuditOutlined
} from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useScenario } from '../../contexts/ScenarioContext';
import { useCubeMetrics } from '../../hooks/useCubeMetrics';
import { useCube } from '../../contexts/CubeContext';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';
import { MetricsTable } from '../tables';
import {
    createFinanceabilityRowConfig,
    createFinanceabilityColConfig,
    calculateCovenantAnalysis,
    getBankabilityRiskLevel
} from './configs/FinanceabilityConfig';
import { theme } from 'antd';
import { set } from 'lodash';

const { Text, Title } = Typography;
const { useToken } = theme;

const FinanceabilityCard = () => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    const [selectedChartPercentile, setSelectedChartPercentile] = useState(null);
    const { token } = useToken();
    const { getPercentileData, setSelectedPercentile } = useCube();

    // Use cube metrics hook
    const { getMetric, prepareMetricsTable, cubeStatus, isLoading, hasError, isReady } = useCubeMetrics();
    const { getValueByPath } = useScenario();
    //const percentileInfo = getPercentileData();


    // Define required metric IDs - static array
    const cardMetricIds = [
        'projectIRR',
        'equityIRR',
        'projectNPV',
        'dscrMetrics',
        //'avgDSCR',
        //'minLLCR',
        //'minICR',
        //'covenantBreaches'
    ];

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

        console.log('🏦 FinanceabilityCard: Computing all data from cube refresh');

        // ✅ Get fresh percentileInfo inside useMemo
        const percentileInfo = getPercentileData();

        // Get static configuration
        const staticConfig = {
            localCurrency: getValueByPath(['settings', 'project', 'currency', 'local']) || 'USD',
            projectLife: getValueByPath(['settings', 'general', 'projectLife']) || 20,
            covenantThreshold: getValueByPath(['settings', 'modules', 'financing', 'minimumDSCR']) || 1.3
        };


        // Create table configurations
        const rowConfig = createFinanceabilityRowConfig(staticConfig.localCurrency);
        const colConfig = createFinanceabilityColConfig(
            percentileInfo,
            (percentile, columnKey, rowData) => {
                console.log(`📊 Column selected: ${percentile} for ${rowData?.key}`);
                setSelectedChartPercentile(percentile);
                setSelectedPercentile(percentile);
            },
            token
        );

        // ✅ Add selectedColumn to colConfig
        colConfig.selectedColumn = `P${percentileInfo.selected}`;

        // Prepare metrics table data
        const metricsTableData = prepareMetricsTable({
            metricIds: cardMetricIds,
            percentiles: percentileInfo.available,
            selectedPercentile: percentileInfo.selected,
            primaryPercentile: percentileInfo.primary,
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
        getMetric
    ]);

    // Chart data - only updates when cube refreshes or chart selection changes
    const chartData = useMemo(() => {
        // TODO: We need source data (DSCR time series) for charts
        return {
            data: [],
            layout: {},
            error: 'Chart integration pending - need source data access'
        };
    }, [
        cubeStatus.lastRefresh,
        selectedChartPercentile
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

    const { metricsTableData, covenantAnalysis, bankabilityRisk, staticConfig, percentileInfo } = cardData;

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
                        Debt Service Coverage Timeline
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                            {' '}(DSCR, LLCR, ICR - Years 1+)
                        </span>
                        {selectedChartPercentile && (
                            <Button
                                size="small"
                                type="link"
                                onClick={() => setSelectedChartPercentile(null)}
                                style={{ marginLeft: 8, fontSize: '11px' }}
                            >
                                Show All Percentiles
                            </Button>
                        )}
                    </Title>
                    {chartData.error ? (
                        <Alert
                            type="info"
                            message={`Chart: ${chartData.error}`}
                            description="Source data integration needed for DSCR timeline visualization"
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