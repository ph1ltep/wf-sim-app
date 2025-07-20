// frontend/src/components/cards/FinanceabilityCard.jsx - Full CubeContext Migration
import React, { useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button, Row, Col } from 'antd';
import {
    DollarOutlined,
    SafetyOutlined,
    InfoCircleOutlined,
    AuditOutlined
} from '@ant-design/icons';
import Plot from 'react-plotly.js';
import { useCube } from '../../contexts/CubeContext';
import { useScenario } from '../../contexts/ScenarioContext';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';
import { MetricsTable } from '../tables';
import {
    createFinancialMetricsConfig,
    createDSCRChartConfig,
    prepareFinancialTimelineData,
    calculateCovenantAnalysis,
    getBankabilityRiskLevel
} from './configs/FinanceabilityConfig';

const { Text, Title } = Typography;

/**
 * FinanceabilityCard - Full CubeContext integration for bankability analysis
 */
const FinanceabilityCard = () => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    const [selectedChartPercentile, setSelectedChartPercentile] = useState(null);

    // Cube context and scenario data
    const { getData, getMetric, isLoading, error } = useCube();
    const { getValueByPath, scenarioData } = useScenario();

    // Get configuration from scenario data
    const selectedPercentile = getValueByPath(['simulation', 'inputSim', 'cashflow', 'selectedPercentile']);
    const availablePercentiles = getValueByPath(['settings', 'simulation', 'percentiles'])?.map(p => p.value) || [10, 25, 50, 75, 90];
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'percentiles', 'primaryPercentile']) || 50;
    const localCurrency = getValueByPath(['settings', 'project', 'currency', 'local']) || 'USD';
    const projectLife = getValueByPath(['settings', 'general', 'projectLife']) || 20;

    // Define required source IDs for time-series data
    const cardSourceIds = [
        'netCashflow',       // For DSCR calculation base
        'debtService',       // Combined debt service payments
        'dscr',              // Pre-calculated DSCR time series
        'cumulativeCashflow' // For visualization
    ];

    // Define required metric IDs for scalar financial metrics
    const cardMetricIds = [
        'projectIRR',        // Project Internal Rate of Return
        'equityIRR',         // Equity Internal Rate of Return  
        'projectNPV',        // Net Present Value
        'minDSCR',           // Minimum DSCR across project life
        'avgDSCR',           // Average DSCR operational years
        'minLLCR',           // Minimum Loan Life Coverage Ratio
        'minICR',            // Minimum Interest Coverage Ratio
        'covenantBreaches'   // Covenant breach analysis
    ];

    // Get cube source data for current percentile
    const cubeSourceData = useMemo(() => {
        if (!selectedPercentile?.value) return {};

        try {
            console.log(`🏦 FinanceabilityCard: Getting cube source data for P${selectedPercentile.value}`);
            return getData({
                sourceIds: cardSourceIds,
                percentile: selectedPercentile.value
            });
        } catch (error) {
            console.error('❌ FinanceabilityCard: Failed to get cube source data:', error);
            return {};
        }
    }, [selectedPercentile?.value, getData]);

    // Get cube metrics data for all percentiles (for table)
    const cubeMetricsData = useMemo(() => {
        try {
            console.log('🏦 FinanceabilityCard: Getting cube metrics data for all percentiles');
            return getMetric({
                metricIds: cardMetricIds
            });
        } catch (error) {
            console.error('❌ FinanceabilityCard: Failed to get cube metrics data:', error);
            return {};
        }
    }, [getMetric]);

    // Transform cube data to financial metrics format for MetricsTable
    const financialMetricsData = useMemo(() => {
        if (!cubeMetricsData || Object.keys(cubeMetricsData).length === 0) return null;

        console.log('🔄 FinanceabilityCard: Transforming cube metrics to financial format');

        // Extract covenant threshold from scenario or default
        const covenantThreshold = getValueByPath(['settings', 'modules', 'financing', 'minimumDSCR']) || 1.3;

        return {
            // Transform cube metrics to expected format
            irr: cubeMetricsData.projectIRR || {},
            equityIRR: cubeMetricsData.equityIRR || {},
            npv: cubeMetricsData.projectNPV || {},
            dscr: cubeMetricsData.minDSCR || {},
            avgDSCR: cubeMetricsData.avgDSCR || {},
            llcr: cubeMetricsData.minLLCR || {},
            icr: cubeMetricsData.minICR || {},
            covenantBreaches: cubeMetricsData.covenantBreaches || {},
            covenantThreshold
        };
    }, [cubeMetricsData, getValueByPath]);

    // Create metrics table configuration
    const { tableData, tableConfig } = useMemo(() => {
        if (!financialMetricsData || !availablePercentiles?.length) {
            return { tableData: [], tableConfig: { columns: [] } };
        }

        console.log('🔄 FinanceabilityCard: Creating metrics table configuration');

        const { data, config } = createFinancialMetricsConfig({
            financingData: financialMetricsData,
            availablePercentiles,
            primaryPercentile: selectedPercentile?.value || primaryPercentile,
            currency: localCurrency,
            scenarioData,
            onColumnSelect: (percentile, columnKey, rowData) => {
                console.log(`📊 Column selected: P${percentile} for ${rowData?.key}`);
                setSelectedChartPercentile(percentile);
            }
        });

        // Add selected column highlight
        const enhancedConfig = {
            ...config,
            selectedColumn: selectedChartPercentile ? `P${selectedChartPercentile}` : `P${selectedPercentile?.value || primaryPercentile}`
        };

        return { tableData: data, tableConfig: enhancedConfig };
    }, [financialMetricsData, availablePercentiles, selectedPercentile, primaryPercentile, localCurrency, scenarioData, selectedChartPercentile]);

    // Calculate covenant analysis for risk assessment
    const covenantAnalysis = useMemo(() => {
        if (!financialMetricsData?.covenantBreaches || !financialMetricsData?.covenantThreshold) return null;

        console.log('🔄 FinanceabilityCard: Calculating covenant analysis');

        return calculateCovenantAnalysis(
            financialMetricsData,
            availablePercentiles,
            financialMetricsData.covenantThreshold
        );
    }, [financialMetricsData, availablePercentiles]);

    // Prepare chart data for DSCR timeline
    const chartData = useMemo(() => {
        if (!cubeSourceData?.dscr?.data && !financialMetricsData?.dscr) {
            return { data: [], layout: {} };
        }

        console.log('🔄 FinanceabilityCard: Preparing DSCR chart data');

        try {
            const chartConfig = createDSCRChartConfig({
                sourceData: cubeSourceData,
                financingData: financialMetricsData,
                availablePercentiles,
                primaryPercentile: selectedPercentile?.value || primaryPercentile,
                selectedPercentile: selectedChartPercentile,
                projectLife,
                covenantThreshold: financialMetricsData?.covenantThreshold
            });

            return prepareFinancialTimelineData(chartConfig);
        } catch (error) {
            console.error('❌ FinanceabilityCard: Chart preparation failed:', error);
            return { data: [], layout: {}, error: error.message };
        }
    }, [cubeSourceData, financialMetricsData, selectedPercentile, selectedChartPercentile]);

    // Calculate bankability risk level
    const bankabilityRisk = useMemo(() => {
        if (!financialMetricsData) return null;

        return getBankabilityRiskLevel({
            minDSCR: financialMetricsData.dscr[selectedPercentile?.value || primaryPercentile]?.value,
            projectIRR: financialMetricsData.irr[selectedPercentile?.value || primaryPercentile]?.value,
            equityIRR: financialMetricsData.equityIRR[selectedPercentile?.value || primaryPercentile]?.value,
            covenantBreaches: financialMetricsData.covenantBreaches[selectedPercentile?.value || primaryPercentile]?.value || [],
            covenantThreshold: financialMetricsData.covenantThreshold
        });
    }, [financialMetricsData, selectedPercentile, primaryPercentile]);

    // Error states
    if (error) {
        return (
            <Card title="Financeability Analysis" variant="outlined">
                <Alert
                    type="error"
                    message="Cube Data Error"
                    description={`Failed to load financial data: ${error}`}
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

    if (!financialMetricsData) {
        return (
            <Card title="Financeability Analysis" variant="outlined">
                <Empty description="No financial metrics available from cube data" />
            </Card>
        );
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
                            icon={<AuditOutlined />}
                            size="small"
                            onClick={() => setAuditTrailVisible(true)}
                        >
                            Audit Trail
                        </Button>
                        <Button
                            icon={<InfoCircleOutlined />}
                            size="small"
                            type="text"
                        >
                            P{selectedPercentile?.value || primaryPercentile}
                        </Button>
                    </Space>
                }
            >
                {/* Financial Metrics Table */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ margin: '0 0 12px 0' }}>
                        Financial Metrics
                        <Text style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: 8 }}>
                            (All percentiles - click to highlight in chart)
                        </Text>
                    </Title>
                    <MetricsTable
                        data={tableData}
                        config={tableConfig}
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
                        <Alert type="error" message={`Chart Error: ${chartData.error}`} />
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
                        {availablePercentiles?.length || 0} percentiles
                    </span>
                    <span>
                        Currency: {localCurrency}, Project: {projectLife} years
                    </span>
                </div>
            </Card>

            {/* Audit Trail Viewer */}
            <AuditTrailViewer
                cubeSourceData={cubeSourceData}
                cubeMetricsData={cubeMetricsData}
                visible={auditTrailVisible}
                onClose={() => setAuditTrailVisible(false)}
            />
        </>
    );
};

export default FinanceabilityCard;