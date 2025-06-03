// src/components/cards/FinanceabilityCard.jsx - Bankability analysis with standardized card interface
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
import {
    calculateConfidenceIntervals,
    calculateCovenantAnalysis,
    prepareDSCRChartData,
    createConfidenceStatistic,
    getBankabilityRiskLevel
} from '../../utils/cashflowUtils';

const { Text, Title } = Typography;

/**
 * FinanceabilityCard - Summary card for bankability analysis
 * Standardized IO signature: { cashflowData, selectedPercentiles }
 * Card type: summary (multi-percentile analysis for investment decisions)
 */
const FinanceabilityCard = ({ cashflowData, selectedPercentiles }) => {
    const [auditTrailVisible, setAuditTrailVisible] = useState(false);

    // Extract financing parameters and thresholds
    const financingData = useMemo(() => {
        if (!cashflowData?.financeMetrics) return null;

        const { dscr, irr, npv, llcr, covenantBreaches } = cashflowData.financeMetrics;

        // Get covenant threshold from metadata (default 1.3)
        const covenantThreshold = dscr?.get?.(50)?.find?.(d => d.metadata)?.metadata?.covenantThreshold || 1.3;

        return {
            dscr,
            irr,
            npv,
            llcr,
            covenantBreaches,
            covenantThreshold
        };
    }, [cashflowData]);

    // Calculate confidence intervals using utility function
    const confidenceIntervals = useMemo(() => {
        if (!financingData || !cashflowData?.metadata?.availablePercentiles) return null;

        return calculateConfidenceIntervals(
            financingData,
            cashflowData.metadata.availablePercentiles,
            selectedPercentiles
        );
    }, [financingData, cashflowData?.metadata?.availablePercentiles, selectedPercentiles]);

    // Calculate covenant breach analysis using utility function
    const covenantAnalysis = useMemo(() => {
        if (!financingData?.covenantBreaches || !financingData?.covenantThreshold ||
            !cashflowData?.metadata?.availablePercentiles) return null;

        return calculateCovenantAnalysis(
            financingData,
            confidenceIntervals,
            cashflowData.metadata.availablePercentiles
        );
    }, [financingData, confidenceIntervals, cashflowData?.metadata?.availablePercentiles]);

    // Prepare DSCR timeline chart data using utility function
    const dscrChartData = useMemo(() => {
        if (!financingData?.dscr || !cashflowData?.metadata?.availablePercentiles) {
            return { data: [], layout: {} };
        }

        return prepareDSCRChartData(
            financingData,
            cashflowData.metadata.availablePercentiles,
            selectedPercentiles
        );
    }, [financingData, cashflowData?.metadata?.availablePercentiles, selectedPercentiles]);

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
                {/* Data-Dense Financial Summary */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 12 }}>
                        Financial Summary
                        {confidenceIntervals?._percentileInfo && (
                            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                                {' '}(P{confidenceIntervals._percentileInfo.min} / P{confidenceIntervals._percentileInfo.primary} / P{confidenceIntervals._percentileInfo.max})
                            </span>
                        )}
                    </Title>

                    {/* Compact table format showing all percentile values */}
                    <div style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        fontSize: '12px'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#fafafa' }}>
                                    <th style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #f0f0f0' }}>
                                        Metric
                                    </th>
                                    {confidenceIntervals?._percentileInfo?.all?.map(p => (
                                        <th key={p} style={{
                                            padding: '8px 8px',
                                            textAlign: 'center',
                                            borderRight: '1px solid #f0f0f0',
                                            fontWeight: p === confidenceIntervals._percentileInfo.primary ? 600 : 400,
                                            backgroundColor: p === confidenceIntervals._percentileInfo.primary ? '#e6f7ff' : 'transparent'
                                        }}>
                                            P{p}
                                        </th>
                                    )) || []}
                                </tr>
                            </thead>
                            <tbody>
                                {/* IRR Row */}
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{
                                        padding: '8px 12px',
                                        fontWeight: 500,
                                        borderRight: '1px solid #f0f0f0'
                                    }}>
                                        <div title="Internal Rate of Return - the discount rate that makes NPV zero. Higher IRR indicates better project returns.">
                                            IRR (%)
                                        </div>
                                    </td>
                                    {confidenceIntervals?._percentileInfo?.all?.map(p => (
                                        <td key={p} style={{
                                            padding: '8px 8px',
                                            textAlign: 'center',
                                            borderRight: '1px solid #f0f0f0',
                                            fontWeight: p === confidenceIntervals._percentileInfo.primary ? 600 : 400,
                                            backgroundColor: p === confidenceIntervals._percentileInfo.primary ? '#f6ffed' : 'transparent'
                                        }}>
                                            {(confidenceIntervals?.irr?.[`P${p}`])?.toFixed(1) || '-'}
                                        </td>
                                    )) || []}
                                </tr>

                                {/* NPV Row */}
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{
                                        padding: '8px 12px',
                                        fontWeight: 500,
                                        borderRight: '1px solid #f0f0f0'
                                    }}>
                                        <div title="Net Present Value - present value of all future cash flows discounted at the cost of equity. Positive NPV indicates value creation.">
                                            NPV ({cashflowData.metadata.currency}M)
                                        </div>
                                    </td>
                                    {confidenceIntervals?._percentileInfo?.all?.map(p => (
                                        <td key={p} style={{
                                            padding: '8px 8px',
                                            textAlign: 'center',
                                            borderRight: '1px solid #f0f0f0',
                                            fontWeight: p === confidenceIntervals._percentileInfo.primary ? 600 : 400,
                                            backgroundColor: p === confidenceIntervals._percentileInfo.primary ? '#f6ffed' : 'transparent'
                                        }}>
                                            {confidenceIntervals?.npv?.[`P${p}`] ?
                                                (confidenceIntervals.npv[`P${p}`] / 1000000).toFixed(1) : '-'}
                                        </td>
                                    )) || []}
                                </tr>

                                {/* Min DSCR Row */}
                                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{
                                        padding: '8px 12px',
                                        fontWeight: 500,
                                        borderRight: '1px solid #f0f0f0'
                                    }}>
                                        <div title="Debt Service Coverage Ratio - measures ability to service debt. Values below covenant threshold indicate potential financing issues.">
                                            Min DSCR
                                        </div>
                                    </td>
                                    {confidenceIntervals?._percentileInfo?.all?.map(p => (
                                        <td key={p} style={{
                                            padding: '8px 8px',
                                            textAlign: 'center',
                                            borderRight: '1px solid #f0f0f0',
                                            fontWeight: p === confidenceIntervals._percentileInfo.primary ? 600 : 400,
                                            backgroundColor: p === confidenceIntervals._percentileInfo.primary ? '#f6ffed' : 'transparent',
                                            color: (confidenceIntervals?.minDSCR?.[`P${p}`] || 0) < 1.3 ? '#ff4d4f' : 'inherit'
                                        }}>
                                            {(confidenceIntervals?.minDSCR?.[`P${p}`])?.toFixed(2) || '-'}
                                        </td>
                                    )) || []}
                                </tr>

                                {/* LLCR Row */}
                                <tr>
                                    <td style={{
                                        padding: '8px 12px',
                                        fontWeight: 500,
                                        borderRight: '1px solid #f0f0f0'
                                    }}>
                                        <div title="Loan Life Coverage Ratio - measures total debt coverage over the loan life. Higher values indicate stronger debt coverage.">
                                            LLCR
                                        </div>
                                    </td>
                                    {confidenceIntervals?._percentileInfo?.all?.map(p => (
                                        <td key={p} style={{
                                            padding: '8px 8px',
                                            textAlign: 'center',
                                            borderRight: '1px solid #f0f0f0',
                                            fontWeight: p === confidenceIntervals._percentileInfo.primary ? 600 : 400,
                                            backgroundColor: p === confidenceIntervals._percentileInfo.primary ? '#f6ffed' : 'transparent'
                                        }}>
                                            {(confidenceIntervals?.llcr?.[`P${p}`])?.toFixed(2) || '-'}
                                        </td>
                                    )) || []}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Compact Bankability Status */}
                    {covenantAnalysis && (
                        <div style={{
                            marginTop: '12px',
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
                </div>

                {/* DSCR Timeline Chart */}
                <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        DSCR Timeline Analysis
                    </Title>
                    <Plot
                        data={dscrChartData.data}
                        layout={dscrChartData.layout}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Bankability Summary removed - now integrated above */}

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