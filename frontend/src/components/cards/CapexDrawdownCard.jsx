// src/components/cards/CapexDrawdownCard.jsx
import React, { useMemo, useCallback } from 'react';
import { Alert, Typography, Space, Tag, message } from 'antd';
import { BuildOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
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

    // Calculate total CAPEX and summary metadata
    const summary = useMemo(() => {
        if (!costSources.length) {
            return {
                totalCapex: 0,
                validationResults: [],
                allValid: true,
                postCODSpend: 0,
                estimatedEndYear: 0
            };
        }

        let totalCapex = 0;
        let postCODSpend = 0;
        let estimatedEndYear = 0;

        const validationResults = costSources.map(source => {
            totalCapex += source.totalAmount || 0;

            const schedule = source.drawdownSchedule || [];
            const totalPercentage = schedule.reduce((sum, item) => sum + (item.value || 0), 0);
            const isValid = Math.abs(totalPercentage - 100) < 0.1;

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

            return {
                sourceId: source.id,
                sourceName: source.name,
                totalPercentage,
                isValid,
                amount: source.totalAmount || 0
            };
        });

        const allValid = validationResults.every(result => result.isValid);

        return {
            totalCapex,
            validationResults,
            allValid,
            postCODSpend,
            estimatedEndYear
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
                Total CAPEX: {currency} {summary.totalCapex.toLocaleString()}
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
            title={title || 'CAPEX Drawdown Schedule'}
            extra={validationStatus}
            {...cardProps}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                    Configure when CAPEX is spent during construction for each cost category. Negative years are before COD.
                </Text>
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
                yearRange={{ min: -10, max: 5 }}
                trimBlanks={true}
                onBeforeSave={handleBeforeSave}
                onAfterSave={handleAfterSave}
                affectedMetrics={['constructionCosts', 'totalCapex']}
                showMetadata={false}
                orientation="horizontal"
                hideEmptyItems={true}
                {...tableProps}
            />

            {/* Summary footer */}
            <div style={{
                marginTop: 16,
                padding: '8px 12px',
                backgroundColor: '#fafafa',
                borderRadius: 4,
                fontSize: '12px',
                color: '#666'
            }}>
                <Space split={<span style={{ color: '#d9d9d9' }}>|</span>} wrap>
                    <span><strong>Total CAPEX:</strong> {currency} {summary.totalCapex.toLocaleString()}</span>
                    <span><strong>End Year:</strong> COD{summary.estimatedEndYear > 0 ? '+' : ''}{summary.estimatedEndYear}</span>
                    {summary.postCODSpend > 0 && (
                        <span><strong>Post-COD Amount:</strong> {currency} {Math.round(summary.postCODSpend).toLocaleString()}</span>
                    )}
                    <span><strong>Valid Schedules:</strong> {summary.validationResults.filter(r => r.isValid).length}/{summary.validationResults.length}</span>
                </Space>
            </div>
        </FieldCard>
    );
};

export default CapexDrawdownCard;