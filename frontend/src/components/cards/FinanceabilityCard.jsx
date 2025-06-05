// src/components/cards/FinanceabilityCard.jsx - Enhanced with MetricsDataTable and new charts
import React, { useMemo, useState } from 'react';
import { Card, Empty, Alert, Space, Typography, Tag, Button, Row, Col } from 'antd';
import {
    DollarOutlined,
    SafetyOutlined,
    InfoCircleOutlined,
    AuditOutlined
} from '@ant-design/icons';
import Plot from 'react-plotly.js';
import AuditTrailViewer from '../results/cashflow/components/AuditTrailViewer';
import { MetricsTable } from '../tables';
import { createFinancialMetricsTableData } from '../tables/metrics/DataOperations';
import { prepareFinancialTimelineData } from '../../utils/financialChartsUtils';
import {
    calculateCovenantAnalysis,
    getBankabilityRiskLevel
} from '../../utils/cashflowUtils';

const { Text, Title } = Typography;

/**
 * FinanceabilityCard - Summary card for bankability analysis with MetricsDataTable
 * Enhanced with LLCR, ICR metrics and column selection for chart filtering
 */
const FinanceabilityCard = ({ cashflowData, selectedPercentiles }) => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);
    const [selectedChartPercentile, setSelectedChartPercentile] = useState(null);

    // Extract financing parameters and thresholds
    const financingData = useMemo(() => {
        if (!cashflowData?.financeMetrics) return null;

        const { dscr, irr, npv, llcr, equityIRR, icr, avgDSCR, covenantBreaches } = cashflowData.financeMetrics;

        return {
            dscr,
            irr,
            npv,
            llcr,
            equityIRR,
            icr,        // NEW: Interest Coverage Ratio
            avgDSCR,    // NEW: Average DSCR
            covenantBreaches,
            covenantThreshold: cashflowData.financeMetrics.covenantThreshold || 1.3
        };
    }, [cashflowData]);

    // Create metrics table data using new utility
    const { tableData, tableConfig } = useMemo(() => {
        if (!financingData || !cashflowData?.metadata?.availablePercentiles) {
            return { tableData: [], tableConfig: { columns: [] } };
        }

        const { data, config } = createFinancialMetricsTableData(
            financingData,
            cashflowData.metadata.availablePercentiles,
            selectedPercentiles?.unified || cashflowData.metadata.primaryPercentile || 50,
            cashflowData.metadata.currency
        );

        // Add column selection handler
        const enhancedConfig = {
            ...config,
            onColumnSelect: (percentile, columnKey, rowData) => {
                setSelectedChartPercentile(percentile);
            },
            selectedColumn: selectedChartPercentile ? `P${selectedChartPercentile}` : `P${selectedPercentiles?.unified || 50}`
        };

        return { tableData: data, tableConfig: enhancedConfig };
    }, [financingData, cashflowData?.metadata, selectedPercentiles, selectedChartPercentile]);

    // Calculate covenant breach analysis
    const covenantAnalysis = useMemo(() => {
        if (!financingData?.covenantBreaches || !financingData?.covenantThreshold ||
            !cashflowData?.metadata?.availablePercentiles) return null;

        return calculateCovenantAnalysis(
            financingData,
            { minDSCR: financingData.avgDSCR }, // Use avgDSCR for analysis
            cashflowData.metadata.availablePercentiles
        );
    }, [financingData, cashflowData?.metadata?.availablePercentiles]);

    // Enhanced DSCR timeline chart with LLCR and ICR
    const enhancedChartData = useMemo(() => {
        if (!financingData?.dscr || !cashflowData?.metadata?.availablePercentiles) {
            return { data: [], layout: {} };
        }

        return prepareFinancialTimelineData(
            financingData,
            cashflowData.metadata.availablePercentiles,
            selectedPercentiles?.unified || cashflowData.metadata.primaryPercentile || 50,
            {
                metrics: ['dscr', 'llcr', 'icr'], // LLCR now included
                selectedPercentile: selectedChartPercentile,
                showAllPercentiles: !selectedChartPercentile,
                covenantThreshold: financingData.covenantThreshold,
                projectLife: cashflowData.metadata.projectLife
            }
        );
    }, [financingData, cashflowData?.metadata, selectedPercentiles, selectedChartPercentile]);


    // Error states
    if (!cashflowData) {
        return (
            <Card title="Financeability Analysis" variant="outlined">
                <Empty description="No cashflow data available" />
            </Card>
        );
    }

    if (!financingData) {
        return (
            <Card title="Financeability Analysis" variant="outlined">
                <Alert
                    message="No Finance Data"
                    description="No finance metrics available for financeability analysis."
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
                        <DollarOutlined />
                        <Text>Financeability Analysis</Text>
                    </Space>
                }
                variant="outlined"
                extra={
                    <Space>
                        {covenantAnalysis && (
                            <Tag
                                color={covenantAnalysis.riskLevel === 'low' ? 'success' :
                                    covenantAnalysis.riskLevel === 'medium' ? 'warning' : 'error'}
                                size="small"
                            >
                                {covenantAnalysis.riskLevel.toUpperCase()} RISK
                            </Tag>
                        )}
                        {selectedChartPercentile && (
                            <Tag color="blue" size="small">
                                Viewing P{selectedChartPercentile}
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
                {/* MetricsTable replacing inline table */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12 }}>
                        Financial Summary - All Percentiles
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                            {' '}(Click column to filter chart)
                        </span>
                    </Title>

                    <MetricsTable
                        data={tableData}
                        config={tableConfig}
                        loading={false}
                        size="small"
                    />
                </div>

                {/* Compact Bankability Status */}
                {covenantAnalysis && (
                    <div style={{
                        marginBottom: 24,
                        padding: '8px 12px',
                        backgroundColor: `${covenantAnalysis.riskColor}08`,
                        borderRadius: '4px',
                        border: `1px solid ${covenantAnalysis.riskColor}30`,
                        fontSize: '12px'
                    }}>
                        <Row gutter={[16, 0]} align="middle">
                            <Col flex="auto">
                                <Space size="large">
                                    <div>
                                        <Text strong style={{ color: covenantAnalysis.riskColor, fontSize: '13px' }}>
                                            {covenantAnalysis.riskLevel.toUpperCase()} RISK
                                        </Text>
                                    </div>
                                    <div>
                                        <Text strong>{covenantAnalysis.breachProbability}%</Text>
                                        <Text type="secondary" style={{ marginLeft: 4 }}>breach probability</Text>
                                    </div>
                                    <div>
                                        <Text strong style={{ color: covenantAnalysis.totalBreachYears > 0 ? '#ff4d4f' : '#52c41a' }}>
                                            {covenantAnalysis.totalBreachYears}
                                        </Text>
                                        <Text type="secondary" style={{ marginLeft: 4 }}>years below {covenantAnalysis.threshold}</Text>
                                    </div>
                                </Space>
                            </Col>
                            <Col>
                                <SafetyOutlined style={{
                                    fontSize: '16px',
                                    color: covenantAnalysis.riskColor,
                                    opacity: 0.7
                                }} />
                            </Col>
                        </Row>
                    </div>
                )}

                {/* Enhanced Multi-Metric Timeline Chart */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        Coverage Ratios Timeline
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                            {' '}(DSCR, LLCR, ICR - Years 0+)
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
                    <Plot
                        data={enhancedChartData.data}
                        layout={enhancedChartData.layout}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%' }}
                    />
                </div>

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
                        Analysis: {cashflowData.lineItems?.length || 0} line items,
                        {cashflowData.metadata.availablePercentiles?.length || 0} percentiles
                    </span>
                    <span>
                        Currency: {cashflowData.metadata.currency},
                        Project: {cashflowData.metadata.projectLife} years
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

export default FinanceabilityCard;