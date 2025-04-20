// src/components/distributionFields/DistributionFieldV3.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Space, Divider, Row, Col, Switch, Alert } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { FormRow, FormCol, SelectField, NumberField, CurrencyField, PercentageField } from '../contextFields';
import DistributionPlot from './DistributionPlot';
import renderParameterFields from './renderParameterFields';
import { distributionTypes, DistributionUtils } from '../../utils/distributions';

const { Title, Text, Paragraph } = Typography;

/**
 * Enhanced distribution field component that uses metadata-driven parameter rendering
 * 
 * @param {string[]} path - Path to the distribution object in the context
 * @param {string[]} defaultValuePath - Path to use for default value
 * @param {string} label - Field label
 * @param {string} tooltip - Optional tooltip
 * @param {Object[]} options - Distribution type options
 * @param {boolean} showTitle - Whether to show a title
 * @param {string} titleLevel - Typography title level
 * @param {string} valueType - Type of value field
 * @param {string} valueName - Name to display for value field
 * @param {string} addonAfter - Text to display after value inputs
 * @param {boolean} compact - Use compact layout
 * @param {boolean} showVisualization - Whether to show visualization
 * @param {boolean} showInfoBox - Whether to show distribution info
 * @param {string} infoBoxTitle - Optional title for the info box
 * @param {boolean} showTimeSeriesToggle - Whether to show time series mode toggle
 * @param {Object} style - Additional styles
 */
const DistributionFieldV3 = ({
    path,
    defaultValuePath,
    label,
    tooltip,
    options = distributionTypes,
    showTitle = true,
    titleLevel = 5,
    valueType = 'number',
    valueName = null,
    addonAfter,
    compact = false,
    showVisualization = false,
    showInfoBox = false,
    infoBoxTitle,
    showTimeSeriesToggle = false,
    style = {},
    step,
    ...rest
}) => {
    // Get scenario context
    const { getValueByPath, updateByPath } = useScenario();

    // Define parameter paths
    const typePath = [...path, 'type'];
    const parametersPath = [...path, 'parameters'];
    const timeSeriesModePath = [...path, 'timeSeriesMode'];

    // Get current distribution settings
    const currentType = (getValueByPath(typePath, 'fixed')).toLowerCase();
    const parameters = getValueByPath(parametersPath, {});
    const timeSeriesMode = getValueByPath(timeSeriesModePath, false);

    // Get default value from defaultValuePath if provided
    const defaultValue = defaultValuePath ? getValueByPath(defaultValuePath, 0) : 0;
    const value = getValueByPath([...parametersPath, 'value'], defaultValue);

    // Set column widths based on compact mode
    const colSpan = compact ? 200 : 150;

    // Initialize value if needed
    useEffect(() => {
        // Only initialize if value is undefined and we have a default value
        if (defaultValue !== undefined && defaultValue !== null && (value === undefined || value === null)) {
            updateByPath([...parametersPath, 'value'], defaultValue);
        }
    }, [defaultValue, parameters, parametersPath, updateByPath, value]);

    // Toggle time series mode
    const handleTimeSeriesModeChange = (checked) => {
        updateByPath(timeSeriesModePath, checked);
    };

    // Updated renderValueField function in DistributionFieldV3.jsx
    const renderValueField = () => {
        const metadata = DistributionUtils.getMetadata(currentType);
        const valueParam = metadata?.parameters?.find(p => p.name === 'value');

        // Only apply custom width if explicitly specified in metadata
        const style = valueParam?.fieldProps?.width ? { width: valueParam.fieldProps.width } : undefined;

        const fieldProps = {
            path: [...parametersPath, 'value'],
            label: valueName || 'Value',
            tooltip: currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value',
            required: true,
            defaultValue: defaultValue,
            step: step
        };

        // Only add style if it's defined
        if (style) {
            fieldProps.style = style;
        }

        // For value field, prioritize:
        // 1. addonAfter prop passed to DistributionFieldV3
        // 2. addonAfter from the field's metadata
        if (addonAfter) {
            fieldProps.addonAfter = addonAfter;
        } else if (valueParam?.fieldProps?.addonAfter) {
            fieldProps.addonAfter = valueParam.fieldProps.addonAfter;
        }

        switch (valueType) {
            case 'currency':
                return <CurrencyField {...fieldProps} />;
            case 'percentage':
                return <PercentageField {...fieldProps} />;
            case 'number':
            default:
                return <NumberField {...fieldProps} />;
        }
    };

    // Get distribution metadata for info box
    const metadata = useMemo(() => {
        return DistributionUtils.getMetadata(currentType) || {};
    }, [currentType]);

    return (
        <div className="distribution-field-v3" style={style}>
            {showTitle && (
                <Title level={titleLevel}>{label}</Title>
            )}

            <Space direction="vertical" style={{ width: '100%' }}>
                <Row align="middle">
                    <Col flex="auto">
                        <SelectField
                            path={typePath}
                            label={`Distribution Type`}
                            tooltip={tooltip}
                            options={options}
                            defaultValue={currentType}
                            {...rest}
                        />
                    </Col>
                    {showTimeSeriesToggle && (
                        <Col flex="none" style={{ marginLeft: 16 }}>
                            <Space>
                                <Text>Time Series Mode:</Text>
                                <Switch
                                    checked={timeSeriesMode}
                                    onChange={handleTimeSeriesModeChange}
                                />
                            </Space>
                        </Col>
                    )}
                </Row>

                <Divider style={{ margin: '8px 0' }} />

                <Row gutter={16} align="top">
                    <Col span={showVisualization ? 12 : 24}>
                        {/* Value field always rendered first */}
                        <FormRow>
                            <FormCol span={colSpan}>
                                {renderValueField()}
                            </FormCol>
                        </FormRow>

                        {/* Render other parameter fields based on distribution metadata */}
                        <FormRow>
                            {renderParameterFields(currentType, parametersPath, {
                                addonAfter,
                                step,
                                colSpan,
                                renderValueSeparately: true
                            }).map((field, index) => (
                                <FormCol span={colSpan} key={index}>
                                    {field}
                                </FormCol>
                            ))}
                        </FormRow>
                    </Col>

                    {showVisualization && (
                        <Col span={12}>
                            <DistributionPlot
                                distributionType={currentType}
                                parameters={parameters}
                                addonAfter={addonAfter}
                                showMean={true}
                                showStdDev={true}
                                showMarkers={true}
                                showSummary={false}
                            />
                        </Col>
                    )}
                </Row>
                {/* Show info box if enabled */}
                {showInfoBox && metadata && (
                    <Alert
                        type="info"
                        message={metadata.label || metadata.name}
                        description={
                            <div style={{ fontSize: '0.8em' }}>
                                <Paragraph style={{ marginBottom: '12px' }}>
                                    {metadata.description}
                                </Paragraph>
                                <Paragraph style={{ marginBottom: '2px' }}>
                                    <Text strong>Applications:</Text> {metadata.applications}
                                </Paragraph>
                                <Paragraph style={{ marginBottom: '2px' }}>
                                    <Text strong>Examples:</Text> {metadata.examples}
                                </Paragraph>
                                <Paragraph style={{ marginBottom: '2px' }}>
                                    <Text strong>Parameters:</Text>
                                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        {metadata.parameters && metadata.parameters.map((param, index) => (
                                            <li key={index}>
                                                <Text code>{param.fieldProps.label || param.name}</Text>: {param.description}
                                                {param.required && ' (required)'}
                                                {param.fieldProps.min !== undefined && `, min: ${param.fieldProps.min}`}
                                                {param.fieldProps.max !== undefined && `, max: ${param.fieldProps.max}`}
                                            </li>
                                        ))}
                                    </ul>
                                </Paragraph>
                                {metadata.axis && (
                                    <Paragraph style={{ marginBottom: '2px' }}>
                                        <Text strong>Axis:</Text> {metadata.axis}
                                    </Paragraph>
                                )}
                            </div>
                        }
                        showIcon
                    />
                )}
            </Space>
        </div>
    );
};

export default DistributionFieldV3;