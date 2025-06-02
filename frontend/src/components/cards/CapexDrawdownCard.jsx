// src/components/cards/CapexDrawdownCard.jsx
import React, { useMemo, useCallback } from 'react';
import { Alert, Typography, Space, Tag, message, Progress, Statistic, Row, Col } from 'antd';
import { BuildOutlined, WarningOutlined, CheckCircleOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { InlineEditTable } from '../tables';
import { FieldCard } from '../contextFields';

const { Text } = Typography;

/**
 * CapexDrawdownCard - Configure CAPEX spending schedule during construction
 */
const CapexDrawdownCard = ({
    title,
    icon,
    cardProps = {},
    tableProps = {}
}) => {
    const { getValueByPath, scenarioData } = useScenario();

    // Get data
    const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources'], []);
    const currency = getValueByPath(['settings', 'project', 'currency', 'local'], 'USD');

    // Get timeline data for markers
    const developmentStartYear = getValueByPath(['settings', 'metrics', 'developmentStartYear'], -5);
    const ntpYear = getValueByPath(['settings', 'metrics', 'ntpYear'], -3);

    // Dynamic year range based on development start
    const yearRange = useMemo(() => ({
        min: Math.min(developmentStartYear - 1, -10), // At least 1 year before dev start, but no more than -10
        max: 5
    }), [developmentStartYear]);

    // Enhanced summary metadata
    const summary = useMemo(() => {
        if (!costSources.length) {
            return {
                totalCapex: 0,
                validationResults: [],
                allValid: true,
                postCODSpend: 0,
                estimatedEndYear: 0,
                phaseBreakdown: [],
                timelineAnalysis: {}
            };
        }

        let totalCapex = 0;
        let postCODSpend = 0;
        let estimatedEndYear = 0;
        let totalScheduledPercentage = 0;
        let totalScheduledAmount = 0;

        const phaseBreakdown = [];
        const yearlyTotals = new Map();

        const validationResults = costSources.map(source => {
            totalCapex += source.totalAmount || 0;

            const schedule = source.drawdownSchedule || [];
            const totalPercentage = schedule.reduce((sum, item) => sum + (item.value || 0), 0);
            const isValid = Math.abs(totalPercentage - 100) < 0.1;

            // Calculate amounts for this source
            const scheduledAmount = (totalPercentage / 100) * (source.totalAmount || 0);
            totalScheduledAmount += scheduledAmount;

            // Track yearly totals
            schedule.forEach(item => {
                const yearAmount = (item.value / 100) * (source.totalAmount || 0);
                yearlyTotals.set(item.year, (yearlyTotals.get(item.year) || 0) + yearAmount);
            });

            // Calculate post-COD spending for this source
            const sourcePostCOD = schedule
                .filter(item => item.year > 0)
                .reduce((sum, item) => sum + (item.value || 0), 0);
            postCODSpend += (sourcePostCOD / 100) * (source.totalAmount || 0);

            // Update estimated end year
            if (schedule.length > 0) {
                const sourceEndYear = Math.max(...schedule.map(item => item.year));
                estimatedEndYear = Math.max(estimatedEndYear, sourceEndYear);
            }

            // Phase breakdown
            phaseBreakdown.push({
                id: source.id,
                name: source.name,
                amount: source.totalAmount || 0,
                scheduledPercentage: totalPercentage,
                scheduledAmount,
                isValid,
                peakYear: schedule.length > 0 ? schedule.reduce((prev, curr) =>
                    (curr.value > prev.value) ? curr : prev
                ).year : null
            });

            return {
                sourceId: source.id,
                sourceName: source.name,
                totalPercentage,
                isValid,
                amount: source.totalAmount || 0
            };
        });

        // Timeline analysis
        const timelineAnalysis = {
            peakSpendingYear: Array.from(yearlyTotals.entries()).reduce((peak, [year, amount]) =>
                amount > (yearlyTotals.get(peak.year) || 0) ? { year, amount } : peak
                , { year: 0, amount: 0 }),
            preCODSpending: totalScheduledAmount - postCODSpend,
            spendingEfficiency: totalCapex > 0 ? (totalScheduledAmount / totalCapex) * 100 : 0
        };

        const allValid = validationResults.every(result => result.isValid);

        return {
            totalCapex,
            validationResults,
            allValid,
            postCODSpend,
            estimatedEndYear,
            phaseBreakdown,
            timelineAnalysis,
            totalScheduledAmount
        };
    }, [costSources]);

    // Handle before save - validate percentages for each cost source
    const handleBeforeSave = useCallback((updatedDataArray) => {
        console.log('Processing CAPEX drawdown schedules before save:', updatedDataArray.length, 'cost sources');

        updatedDataArray.forEach(source => {
            const schedule = source.drawdownSchedule || [];
            const totalPercentage = schedule.reduce((sum, item) => sum + (item.value || 0), 0);

            if (Math.abs(totalPercentage - 100) > 5) {
                console.warn(`${source.name} drawdown schedule total is ${totalPercentage.toFixed(1)}%, should be ~100%`);
            }
        });

        return updatedDataArray;
    }, []);

    // Timeline markers with enhanced information
    const timelineMarkers = useMemo(() => [
        { year: developmentStartYear, tag: 'DEV', color: 'blue', label: 'Development Start' },
        { year: ntpYear, tag: 'NTP', color: 'orange', label: 'Notice to Proceed' },
        { year: 0, tag: 'COD', color: 'green', label: 'Commercial Operation' }
    ], [developmentStartYear, ntpYear]);

    // Handle after save
    const handleAfterSave = useCallback((result) => {
        if (result.isValid) {
            message.success('CAPEX drawdown schedules updated successfully');
        } else {
            message.error('Failed to save CAPEX drawdown schedules');
            console.error('Save errors:', result.errors);
        }
    }, []);

    // Handle null scenario
    if (!scenarioData) {
        return (
            <FieldCard title={title || 'CAPEX Drawdown Schedule'} {...cardProps}>
                <Alert message="No active scenario available" type="info" />
            </FieldCard>
        );
    }

    // Render validation status
    const validationStatus = (
        <Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
                Total Investment: {currency} {summary.totalCapex.toLocaleString()}
            </Text>
            {summary.allValid ? (
                <Tag icon={<CheckCircleOutlined />} color="success" size="small">
                    All Valid
                </Tag>
            ) : (
                <Tag icon={<WarningOutlined />} color="warning" size="small">
                    {summary.validationResults.filter(r => !r.isValid).length} Issues
                </Tag>
            )}
        </Space>
    );

    return (
        <FieldCard
            title={title || 'Investment Drawdown Schedule'}
            extra={validationStatus}
            {...cardProps}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                    Configure when investment is spent across development and construction phases. Timeline markers show key project milestones.
                </Text>
            </div>

            {/* Enhanced metadata summary */}
            <div style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                    <Col span={6}>
                        <Statistic
                            title="Spending Efficiency"
                            value={summary.timelineAnalysis.spendingEfficiency}
                            precision={1}
                            suffix="%"
                            prefix={<DollarOutlined />}
                        />
                        <Progress
                            percent={summary.timelineAnalysis.spendingEfficiency}
                            size="small"
                            strokeColor={summary.timelineAnalysis.spendingEfficiency > 95 ? '#52c41a' : '#faad14'}
                            showInfo={false}
                        />
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Peak Spending Year"
                            value={summary.timelineAnalysis.peakSpendingYear.year === 0 ? 'COD' :
                                summary.timelineAnalysis.peakSpendingYear.year > 0 ?
                                    `COD+${summary.timelineAnalysis.peakSpendingYear.year}` :
                                    `COD${summary.timelineAnalysis.peakSpendingYear.year}`}
                            prefix={<CalendarOutlined />}
                        />
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {currency} {Math.round(summary.timelineAnalysis.peakSpendingYear.amount).toLocaleString()}
                        </div>
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Pre-COD Investment"
                            value={summary.timelineAnalysis.preCODSpending}
                            precision={0}
                            formatter={value => `${currency} ${(value / 1000000).toFixed(1)}M`}
                        />
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {((summary.timelineAnalysis.preCODSpending / summary.totalCapex) * 100).toFixed(1)}% of total
                        </div>
                    </Col>
                    <Col span={6}>
                        <Statistic
                            title="Timeline Span"
                            value={`${Math.abs(developmentStartYear)} years`}
                            prefix={<CalendarOutlined />}
                        />
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            Dev to COD+{summary.estimatedEndYear}
                        </div>
                    </Col>
                </Row>
            </div>

            {!summary.allValid && (
                <Alert
                    message="Validation Issues"
                    description={
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {summary.validationResults
                                .filter(result => !result.isValid)
                                .map(result => (
                                    <li key={result.sourceId}>
                                        <strong>{result.sourceName}:</strong> {result.totalPercentage.toFixed(1)}%
                                        (should be ~100%)
                                    </li>
                                ))
                            }
                        </ul>
                    }
                    type="warning"
                    size="small"
                    style={{ marginBottom: 16 }}
                />
            )}

            <InlineEditTable
                path={['settings', 'modules', 'cost', 'constructionPhase', 'costSources']}
                dataFieldOptions={[
                    {
                        value: 'drawdownSchedule',
                        label: 'Drawdown %',
                        type: 'percentage',
                        validation: {
                            min: 0,
                            max: 100,
                            precision: 1
                        },
                        defaultValueField: null
                    }
                ]}
                yearRange={yearRange}
                trimBlanks={true}
                trimValue={0}
                hideEmptyItems={true}
                onBeforeSave={handleBeforeSave}
                onAfterSave={handleAfterSave}
                affectedMetrics={['totalCapex']}
                showMetadata={false}
                orientation="vertical"
                timelineMarkers={timelineMarkers}
                {...tableProps}
            />

            {/* Enhanced summary footer */}
            <div style={{
                marginTop: 16,
                padding: '12px 16px',
                backgroundColor: '#fafafa',
                borderRadius: 6,
                fontSize: '12px',
                color: '#666'
            }}>
                <Row gutter={16}>
                    <Col span={8}>
                        <Space direction="vertical" size={4}>
                            <Text strong style={{ fontSize: '13px' }}>Investment Summary</Text>
                            <Text>Total: {currency} {summary.totalCapex.toLocaleString()}</Text>
                            <Text>Scheduled: {currency} {Math.round(summary.totalScheduledAmount).toLocaleString()}</Text>
                        </Space>
                    </Col>
                    <Col span={8}>
                        <Space direction="vertical" size={4}>
                            <Text strong style={{ fontSize: '13px' }}>Timeline</Text>
                            <Text>Span: {Math.abs(developmentStartYear)} to COD+{summary.estimatedEndYear}</Text>
                            <Text>Post-COD: {currency} {Math.round(summary.postCODSpend).toLocaleString()}</Text>
                        </Space>
                    </Col>
                    <Col span={8}>
                        <Space direction="vertical" size={4}>
                            <Text strong style={{ fontSize: '13px' }}>Validation</Text>
                            <Text>Valid Schedules: {summary.validationResults.filter(r => r.isValid).length}/{summary.validationResults.length}</Text>
                            <Text>Efficiency: {summary.timelineAnalysis.spendingEfficiency.toFixed(1)}%</Text>
                        </Space>
                    </Col>
                </Row>
            </div>
        </FieldCard>
    );
};

export default CapexDrawdownCard;