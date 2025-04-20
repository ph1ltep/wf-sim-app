// src/components/distributionFields/DistributionFieldV3.jsx - Updated for new schema structure
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Typography, Space, Divider, Row, Col, Switch, Alert, Spin, message } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { FormRow, FormCol, SelectField, NumberField, CurrencyField, PercentageField } from '../contextFields';
import DistributionPlot from './DistributionPlot';
import renderParameterFields from './renderParameterFields';
import renderTimeSeriesFields from './renderTimeSeriesFields';
import { distributionTypes, DistributionUtils } from '../../utils/distributions';
import { validateTimeSeriesModeTransition, getAppropriateValue } from '../../utils/distributions/stateTransition';
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
    const timeSeriesParametersPath = [...path, 'timeSeriesParameters'];
    const timeSeriesModePath = [...path, 'timeSeriesMode'];

    // Get current distribution settings
    const currentType = (getValueByPath(typePath, 'fixed')).toLowerCase();
    const parameters = getValueByPath(parametersPath, {});
    const timeSeriesParameters = getValueByPath(timeSeriesParametersPath, { value: [] });
    const timeSeriesMode = getValueByPath(timeSeriesModePath, false);

    // Track fitted state
    const [hasFittedParams, setHasFittedParams] = useState(false);

    // Get default value from defaultValuePath if provided
    const defaultValue = defaultValuePath ? getValueByPath(defaultValuePath, 0) : 0;

    // Get current value based on mode
    const value = getValueByPath([...parametersPath, 'value'], defaultValue);

    // Track time series data
    const timeSeriesData = useMemo(() => {
        if (timeSeriesMode) {
            const tsData = getValueByPath([...timeSeriesParametersPath, 'value'], []);
            return Array.isArray(tsData) ? tsData : [];
        }
        return [];
    }, [timeSeriesMode, timeSeriesParametersPath, getValueByPath]);

    // Set column widths based on compact mode
    const colSpan = compact ? 200 : 150;

    // Initialize value if needed
    useEffect(() => {
        // Check if we need to initialize value
        if (defaultValue !== undefined && defaultValue !== null) {
            if (timeSeriesMode) {
                // If time series mode and no data, initialize with empty array
                const currentTSData = getValueByPath([...timeSeriesParametersPath, 'value'], null);
                if (!currentTSData || !Array.isArray(currentTSData) || currentTSData.length === 0) {
                    // Initialize with current parameter value if available
                    const initialData = [];
                    if (typeof value === 'number') {
                        initialData.push({ year: 0, value: value });
                    }
                    updateByPath([...timeSeriesParametersPath, 'value'], initialData);
                }
            } else if (value === undefined || value === null) {
                // In regular mode, initialize with default value
                updateByPath([...parametersPath, 'value'], defaultValue);
            }
        }
    }, [defaultValue, parametersPath, timeSeriesParametersPath, updateByPath, value, timeSeriesMode, getValueByPath]);

    // Handle time series mode toggle with validation
    const handleTimeSeriesModeChange = useCallback(async (checked) => {
        try {
            // Get the current distribution state
            const currentType = getValueByPath(typePath, 'fixed');
            const currentParameters = getValueByPath(parametersPath, {});
            const currentTimeSeriesParameters = getValueByPath(timeSeriesParametersPath, { value: [] });
            const currentIsTimeSeriesMode = getValueByPath(timeSeriesModePath, false);

            // Create current distribution object
            const currentDistribution = {
                type: currentType,
                timeSeriesMode: currentIsTimeSeriesMode,
                parameters: currentParameters,
                timeSeriesParameters: currentTimeSeriesParameters
            };

            // Validate and prepare the transition
            const { isValid, message: validationMessage, distribution: updatedDistribution } =
                validateTimeSeriesModeTransition(currentDistribution, checked, defaultValue);

            if (validationMessage) {
                console.log(`Time series mode transition: ${validationMessage}`);
            }

            // Apply updates
            if (checked !== currentIsTimeSeriesMode) {
                // Update time series mode flag
                await updateByPath(timeSeriesModePath, checked);

                // Update parameters if they've changed
                if (updatedDistribution.parameters.value !== currentParameters.value) {
                    await updateByPath([...parametersPath, 'value'], updatedDistribution.parameters.value);
                }

                // Update time series parameters if they've changed
                if (JSON.stringify(updatedDistribution.timeSeriesParameters.value) !==
                    JSON.stringify(currentTimeSeriesParameters.value)) {
                    await updateByPath([...timeSeriesParametersPath, 'value'], updatedDistribution.timeSeriesParameters.value);
                }

                // Reset fitted parameters when switching to regular mode
                if (!checked && hasFittedParams) {
                    setHasFittedParams(false);
                }
            }
        } catch (error) {
            console.error('Error toggling time series mode:', error);
            message.error('Failed to toggle time series mode');
        }
    }, [defaultValue, timeSeriesParametersPath, parametersPath, timeSeriesModePath, typePath, updateByPath, getValueByPath, hasFittedParams]);

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
            timeSeriesParameters: { value: validData },
            timeSeriesMode: true
        };

        // Call API to fit distribution
        const success = await fitDistributionToData(distribution, validData, async (fittedParams) => {
            // If fitting succeeded, update parameters in context
            if (fittedParams && fittedParams.parameters) {
                for (const [key, value] of Object.entries(fittedParams.parameters)) {
                    await updateByPath([...parametersPath, key], value);
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
                                    onChange={(checked) => {
                                        // Use setTimeout with 0ms delay instead of setImmediate
                                        setTimeout(() => handleTimeSeriesModeChange(checked), 0);
                                    }}
                                    disabled={fittingDistribution}
                                />
                            </Space>
                        </Col>
                    )}
                </Row>

                <Divider style={{ margin: '8px 0' }} />

                <Row gutter={16} align="top">
                    <Col span={showVisualization ? 12 : 24}>
                        <Spin spinning={fittingDistribution} tip="Fitting distribution to data...">
                            {/* Parameter Fields or Time Series Fields based on mode */}
                            {timeSeriesMode ? (
                                renderTimeSeriesFields(currentType, parametersPath, timeSeriesParametersPath, {
                                    addonAfter,
                                    valueType,
                                    valueName: displayName,
                                    precision: typeof step === 'number' ? String(step).split('.')[1]?.length || 0 : 2,
                                    timeSeriesData,
                                    isFitting: fittingDistribution,
                                    onFitDistribution: handleFitDistribution,
                                    onClearFit: handleClearFit,
                                    hasFittedParams,
                                    metadata,
                                    parameters
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

                    {/* Visualization column */}
                    {showVisualization && (
                        <Col span={12}>
                            {timeSeriesMode && !hasFittedParams ? (
                                <Alert
                                    message="Visualization not available"
                                    description={
                                        <div style={{ fontSize: '0.9em' }}>
                                            <p>Please fit a distribution to your time series data to see the visualization.</p>
                                            <p>You need at least {DistributionUtils.getMinRequiredPoints(currentType)} data points for the {currentType} distribution.</p>
                                        </div>
                                    }
                                    type="info"
                                    showIcon
                                    style={{ width: '100%' }}
                                />
                            ) : (
                                <DistributionPlot
                                    distributionType={currentType}
                                    parameters={parameters}
                                    timeSeriesParameters={timeSeriesParameters}
                                    timeSeriesMode={timeSeriesMode}
                                    addonAfter={addonAfter}
                                    showMean={true}
                                    showStdDev={true}
                                    showMarkers={true}
                                    showSummary={false}
                                />
                            )}
                        </Col>
                    )}
                </Row>

                {/* Show info box if enabled and not in time series mode */}
                {showInfoBox && metadata && !timeSeriesMode && (
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