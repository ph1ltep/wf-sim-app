// src/components/cards/CapexDrawdownCard.jsx
import React, { useMemo, useCallback, useEffect } from 'react';
import { Alert, Typography, Space, Tag, message, Row, Col } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { InlineEditTable } from '../tables';
import { TableControls } from '../tables/inline/TableControls';
import { FieldCard } from '../contextFields';
import { generateConstructionCostSources } from '../../utils/drawdownUtils';
import { getSemanticColor } from '../../utils/charts';
import { initializeConstructionSourcesSimple } from '../../utils/dependencies';

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
    const { getValueByPath, updateByPath, scenarioData } = useScenario();

    // Get data
    let costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources']);
    const currency = getValueByPath(['settings', 'project', 'currency', 'local'], 'USD');

useEffect(() => {
    if (scenarioData && (!costSources || !Array.isArray(costSources) || costSources.length === 0)) {
        initializeConstructionSourcesSimple(getValueByPath, updateByPath);
    }
}, [scenarioData, costSources, getValueByPath, updateByPath]);

    // Re-get the data after potential initialization
    costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources'], []);

    // Get timeline data for markers and year range
    const developmentStartYear = getValueByPath(['settings', 'metrics', 'developmentStartYear'], -5);
    const ntpYear = getValueByPath(['settings', 'metrics', 'ntpYear'], -3);

    // Dynamic year range based on development start
    const yearRange = useMemo(() => ({
        min: Math.min(developmentStartYear - 1, -10),
        max: 5
    }), [developmentStartYear]);

    // Summary calculation
    const summary = useMemo(() => {
        if (!costSources || !Array.isArray(costSources) || costSources.length === 0) {
            return {
                totalCapex: 0,
                validationResults: [],
                allValid: true,
                phaseBreakdown: []
            };
        }

        let totalCapex = 0;
        const validationResults = [];
        const phaseBreakdown = [];

        costSources.forEach(source => {
            const sourceAmount = source?.totalAmount || 0;
            const sourceSchedule = source?.drawdownSchedule || [];
            const sourceName = source?.name || 'Unknown Source';
            const sourceId = source?.id || 'unknown';

            totalCapex += sourceAmount;

            const totalPercentage = sourceSchedule.reduce((sum, item) => sum + (item?.value || 0), 0);
            const isValid = Math.abs(totalPercentage - 100) < 0.1;

            validationResults.push({
                sourceId,
                sourceName,
                totalPercentage,
                isValid,
                amount: sourceAmount
            });

            phaseBreakdown.push({
                id: sourceId,
                name: sourceName,
                amount: sourceAmount,
                scheduledPercentage: totalPercentage,
                isValid
            });
        });

        const allValid = validationResults.every(result => result.isValid);

        return {
            totalCapex,
            validationResults,
            allValid,
            phaseBreakdown
        };
    }, [costSources]);

    // Timeline markers using actual metrics
    const timelineMarkers = useMemo(() => [
        { year: developmentStartYear, tag: 'DEV', type: 'milestone', color: getSemanticColor('development', 5), label: 'Development Start' },
        { year: ntpYear, tag: 'NTP', type: 'milestone', color: getSemanticColor('construction', 5), label: 'Notice to Proceed' },
        { year: 0, tag: 'COD', type: 'milestone', color: getSemanticColor('operation', 5), label: 'Commercial Operation' }
    ], [developmentStartYear, ntpYear]);

    // Handle before save
    const handleBeforeSave = useCallback((updatedDataArray) => {
        console.log('Processing CAPEX drawdown schedules before save:', updatedDataArray?.length || 0, 'cost sources');
        return updatedDataArray;
    }, []);

    // Handle after save
    const handleAfterSave = useCallback((result) => {
        if (result?.isValid) {
            message.success('CAPEX drawdown schedules updated successfully');
        } else {
            message.error('Failed to save CAPEX drawdown schedules');
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

    // Render validation status for content area
    const validationAlert = !summary.allValid ? (
        <Alert
            message="Validation Issues"
            description={
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {(summary.validationResults || [])
                        .filter(result => !result?.isValid)
                        .map(result => (
                            <li key={result?.sourceId || 'unknown'}>
                                <strong>{result?.sourceName || 'Unknown'}:</strong> {(result?.totalPercentage || 0).toFixed(1)}%
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
    ) : null;

    return (
        <FieldCard
            title={title || 'Investment Drawdown Schedule'}
            extra={
                <Space>
                    {/* Validation status in header */}
                    {summary.allValid ? (
                        <Tag icon={<CheckCircleOutlined />} color="success" size="small">
                            All Valid
                        </Tag>
                    ) : (
                        <Tag icon={<WarningOutlined />} color="warning" size="small">
                            {(summary.validationResults?.filter(r => !r?.isValid) || []).length} Issues
                        </Tag>
                    )}

                    {/* Edit controls in header */}
                </Space>
            }
            {...cardProps}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                    Configure when investment is spent across development and construction phases. Timeline markers show key project milestones.
                </Text>
            </div>

            {/* Enhanced phase summary with per-unit and per-MW data */}
            <div style={{ marginBottom: 16 }}>
                <Row gutter={8}>
                    {(summary.phaseBreakdown || []).map(phase => {
                        const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20);
                        const mwPerWTG = getValueByPath(['settings', 'project', 'windFarm', 'mwPerWTG'], 3.5);
                        const totalMW = numWTGs * mwPerWTG;

                        const perUnit = phase?.amount ? (phase.amount / numWTGs) : 0;
                        const perMW = phase?.amount && totalMW > 0 ? (phase.amount / totalMW) : 0;

                        return (
                            <Col key={phase?.id || 'unknown'} span={6}>
                                <div style={{
                                    padding: '8px',
                                    backgroundColor: '#fafafa',
                                    borderRadius: '4px',
                                    border: (phase?.isValid) ? '1px solid #d9d9d9' : '1px solid #ff7875'
                                }}>
                                    <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                                        {phase?.name || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                                        {currency} {((phase?.amount || 0) / 1000000).toFixed(1)}M total
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>
                                        {currency} {(perUnit / 1000).toFixed(0)}k/unit • {currency} {(perMW / 1000).toFixed(0)}k/MW
                                    </div>
                                    <div style={{ fontSize: '10px', color: (phase?.isValid) ? '#52c41a' : '#ff4d4f' }}>
                                        {(phase?.scheduledPercentage || 0).toFixed(1)}% scheduled
                                    </div>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            </div>

            {/* Validation alert if needed */}
            {validationAlert}

            {/* Table without controls */}
            <InlineEditTable
                theme="timeline"  // or "compact" 
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
                orientation="horizontal"
                timelineMarkers={timelineMarkers}
                controlsPlacement="internal"
                {...tableProps}
            />

            {/* Simple KPIs at bottom */}
            <div style={{ marginTop: 16 }}>
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fafafa',
                    borderRadius: 6,
                    fontSize: '12px',
                    color: '#666'
                }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Text strong style={{ fontSize: '13px' }}>Investment Summary</Text>
                            <br />
                            <Text>Total: {currency} {(summary.totalCapex || 0).toLocaleString()}</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ fontSize: '13px' }}>Per Unit Analysis</Text>
                            <br />
                            {(() => {
                                const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20);
                                const mwPerWTG = getValueByPath(['settings', 'project', 'windFarm', 'mwPerWTG'], 3.5);
                                const totalMW = numWTGs * mwPerWTG;
                                const perUnit = summary.totalCapex > 0 ? (summary.totalCapex / numWTGs) : 0;
                                const perMW = summary.totalCapex > 0 && totalMW > 0 ? (summary.totalCapex / totalMW) : 0;

                                return (
                                    <Text>
                                        {currency} {(perUnit / 1000000).toFixed(2)}M/unit • {currency} {(perMW / 1000000).toFixed(2)}M/MW
                                    </Text>
                                );
                            })()}
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ fontSize: '13px' }}>Validation Status</Text>
                            <br />
                            <Text>
                                Valid Schedules: {(summary.validationResults || []).filter(r => r?.isValid).length}/{(summary.validationResults || []).length}
                            </Text>
                        </Col>
                    </Row>
                </div>
            </div>
        </FieldCard>
    );
};

export default CapexDrawdownCard;