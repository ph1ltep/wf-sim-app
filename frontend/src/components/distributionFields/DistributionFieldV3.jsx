// src/components/distributionFields/DistributionFieldV3.jsx - Updated for time series mode
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Typography, Space, Divider, Row, Col, Switch, Alert, Spin } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { FormRow, FormCol, SelectField, NumberField, CurrencyField, PercentageField } from '../contextFields';
import DistributionPlot from './DistributionPlot';
import renderParameterFields from './renderParameterFields';
import renderTimeSeriesFields from './renderTimeSeriesFields';
import { distributionTypes, DistributionUtils } from '../../utils/distributions';
import useInputSim from '../../hooks/useInputSim';

const { Title, Text, Paragraph } = Typography;

/**
 * Enhanced distribution field component with time series support
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
    showTimeSeriesToggle = true,
    style = {},
    step,
    ...rest
}) => {
    // Get scenario context
    const { getValueByPath, updateByPath } = useScenario();
    const { fitDistributionToData, fittingDistribution } = useInputSim();

    // Define parameter paths
    const typePath = [...path, 'type'];
    const parametersPath = [...path, 'parameters'];
    const timeSeriesModePath = [...path, 'timeSeriesMode'];

    // Get current distribution settings
    const currentType = (getValueByPath(typePath, 'fixed')).toLowerCase();
    const parameters = getValueByPath(parametersPath, {});
    const timeSeriesMode = getValueByPath(timeSeriesModePath, false);

    // Track fitted state
    const [hasFittedParams, setHasFittedParams] = useState(false);

    // Get default value from defaultValuePath if provided
    const defaultValue = defaultValuePath ? getValueByPath(defaultValuePath, 0) : 0;
    const value = getValueByPath([...parametersPath, 'value'], defaultValue);

    // Track time series data
    const timeSeriesData = useMemo(() => {
        if (timeSeriesMode && Array.isArray(value)) {
            return value;
        }
        return [];
    }, [timeSeriesMode, value]);

    // Set column widths based on compact mode
    const colSpan = compact ? 200 : 150;

    // Initialize value if needed
    useEffect(() => {
        // Check if we need to initialize value
        if (defaultValue !== undefined && defaultValue !== null) {
            if (timeSeriesMode) {
                // If time series mode and no data, initialize with empty array
                if (!Array.isArray(value)) {
                    updateByPath([...parametersPath, 'value'], []);
                }
            } else if (value === undefined || value === null) {
                // In regular mode, initialize with default value
                updateByPath([...parametersPath, 'value'], defaultValue);
            }
        }
    }, [defaultValue, parameters, parametersPath, updateByPath, value, timeSeriesMode]);

    // Handle time series mode toggle
    const handleTimeSeriesModeChange = useCallback(async (checked) => {
        // If turning off time series mode and we have fitted parameters,
        // keep those parameters but switch to scalar value
        if (!checked && timeSeriesMode && hasFittedParams && Array.isArray(value)) {
            // Get current parameters but convert to scalar value
            // This preserves fitted parameters when switching modes
            const currentValue = parameters.value;

            // Get average value from time series data as a fallback
            let scalarValue = defaultValue;
            if (Array.isArray(currentValue) && currentValue.length > 0) {
                const validPoints = currentValue.filter(
                    point => point && typeof point === 'object' && point.value !== undefined
                );
                if (validPoints.length > 0) {
                    const values = validPoints.map(point => parseFloat(point.value) || 0);
                    scalarValue = values.reduce((sum, v) => sum + v, 0) / values.length;
                }
            }

            // Update time series mode first
            await updateByPath(timeSeriesModePath, checked);

            // Then update value to be scalar instead of array
            await updateByPath([...parametersPath, 'value'], scalarValue);
        } else {
            // Simple mode toggle
            await updateByPath(timeSeriesModePath, checked);

            // Initialize appropriate value structure
            if (checked && !Array.isArray(value)) {
                // If turning on time series mode, convert scalar to empty array
                await updateByPath([...parametersPath, 'value'], []);
                setHasFittedParams(false);
            } else if (!checked && Array.isArray(value)) {
                // If turning off time series mode, use default value
                await updateByPath([...parametersPath, 'value'], defaultValue);
                setHasFittedParams(false);
            }
        }
    }, [defaultValue, hasFittedParams, parameters, parametersPath, timeSeriesMode, updateByPath, value]);

    // Handle fitting distribution to time series data
    const handleFitDistribution = useCallback(async () => {
        if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
            return;
        }

        // Filter out invalid data points
        const validData = timeSeriesData.filter(
            point => point && typeof point === 'object' &&
                point.year !== undefined && point.value !== undefined
        );

        if (validData.length === 0) {
            return;
        }

        // Get current distribution configuration
        const distribution = {
            type: currentType,
            parameters: { ...parameters },
            timeSeriesMode: true
        };

        // Call API to fit distribution
        const success = await fitDistributionToData(distribution, validData, async (fittedParams) => {
            // If fitting succeeded, update parameters in context
            if (fittedParams && fittedParams.parameters) {
                for (const [key, value] of Object.entries(fittedParams.parameters)) {
                    // Skip updating the value parameter because that contains the time series data
                    if (key !== 'value') {
                        await updateByPath([...parametersPath, key], value);
                    }
                }

                // Mark as having fitted parameters
                setHasFittedParams(true);
            }
        });

        return success;
    }, [currentType, fitDistributionToData, parameters, parametersPath, timeSeriesData, updateByPath]);

    // Handle clearing fitted parameters
    const handleClearFit = useCallback(async () => {
        // Reset all parameters except value (which contains time series data)
        const metadata = DistributionUtils.getMetadata(currentType);

        if (metadata && metadata.parameters) {
            // Reset each parameter to its default value
            for (const param of metadata.parameters) {
                // Skip the value parameter which contains time series data
                if (param.name !== 'value' && param.fieldProps.defaultValue !== undefined) {
                    await updateByPath([...parametersPath, param.name], param.fieldProps.defaultValue);
                }
            }
        }

        setHasFittedParams(false);
    }, [currentType, parametersPath, updateByPath]);

    // Get distribution metadata for info box
    const metadata = useMemo(() => {
        return DistributionUtils.getMetadata(currentType) || {};
    }, [currentType]);

    // If no valid display name, use parameter name or field type
    const displayName = valueName || 'Value';

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
                                    disabled={fittingDistribution}
                                />
                            </Space>
                        </Col>
                    )}
                </Row>

                <Divider style={{ margin: '8px 0' }} />

                <Row gutter={16} align="top">
                    <Col span={showVisualization && (!timeSeriesMode || hasFittedParams) ? 12 : 24}>
                        <Spin spinning={fittingDistribution} tip="Fitting distribution to data...">
                            {/* Parameter Fields or Time Series Fields based on mode */}
                            {timeSeriesMode ? (
                                renderTimeSeriesFields(currentType, parametersPath, {
                                    addonAfter,
                                    valueType,
                                    valueName: displayName,
                                    precision: typeof step === 'number' ? String(step).split('.')[1]?.length || 0 : 2,
                                    timeSeriesData,
                                    isFitting: fittingDistribution,
                                    onFitDistribution: handleFitDistribution,
                                    onClearFit: handleClearFit,
                                    hasFittedParams,
                                    metadata
                                })
                            ) : (
                                <>
                                    {/* Value field always rendered first */}
                                    <FormRow>
                                        <FormCol span={colSpan}>
                                            {valueType === 'percentage' ? (
                                                <PercentageField
                                                    path={[...parametersPath, 'value']}
                                                    label={displayName}
                                                    tooltip={currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value'}
                                                    defaultValue={defaultValue}
                                                    required
                                                />
                                            ) : valueType === 'currency' ? (
                                                <CurrencyField
                                                    path={[...parametersPath, 'value']}
                                                    label={displayName}
                                                    tooltip={currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value'}
                                                    defaultValue={defaultValue}
                                                    required
                                                />
                                            ) : (
                                                <NumberField
                                                    path={[...parametersPath, 'value']}
                                                    label={displayName}
                                                    tooltip={currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value'}
                                                    addonAfter={addonAfter}
                                                    step={step}
                                                    defaultValue={defaultValue}
                                                    required
                                                />
                                            )}
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
                                </>
                            )}
                        </Spin>
                    </Col>

                    {/* Only show visualization when not in time series mode, or when in time series mode with fitted parameters */}
                    {showVisualization && (!timeSeriesMode || hasFittedParams) && (
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
                        message={metadata.name || currentType}
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