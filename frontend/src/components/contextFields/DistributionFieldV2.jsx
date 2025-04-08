// src/components/contextFields/DistributionFieldV2.jsx
import React from 'react';
import { Alert, Typography, Space, Divider, Row, Col } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { SelectField, NumberField, CurrencyField, PercentageField, FormRow, FormCol } from './index';
import DistributionPlot from './DistributionPlot';
import { distributionTypes, DistributionUtils } from '../../utils/distributions';


const { Title, Text, Paragraph } = Typography;

/**
 * A field component for managing distribution type and parameters
 * 
 * @param {string[]} path - Path to the distribution object in the context
 * @param {string[]} defaultValuePath - Path to use for default value
 * @param {string} label - Field label
 * @param {string} tooltip - Optional tooltip
 * @param {Object[]} options - Distribution type options
 * @param {boolean} showTitle - Whether to show a title
 * @param {string} titleLevel - Typography title level
 * @param {string} valueType - Type of value field
 * @param {string} addonAfter - Text to display after value inputs
 * @param {boolean} showVisualization - Whether to show visualization
 * @param {boolean} showInfoBox - Whether to show distribution info
 * @param {string} infoBoxTitle - Optional title for the info box
 * @param {Object} style - Additional styles
 */
const DistributionFieldV2 = ({
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
    style = {},
    step,
    ...rest
}) => {
    // Get scenario context
    const { getValueByPath, updateByPath } = useScenario();

    // Get current distribution type
    const typePath = [...path, 'type'];
    const parametersPath = [...path, 'parameters'];
    const currentType = getValueByPath(typePath, 'fixed');

    // Get parameters for visualization
    const parameters = getValueByPath(parametersPath, {});

    // Get default value from defaultValuePath if provided
    const defaultValue = defaultValuePath ? getValueByPath(defaultValuePath, 0) : 0;
    const value = getValueByPath([...parametersPath, 'value'], defaultValue);

    //if (!defaultValue) {
    //    updateByPath([...parametersPath, 'value'], defaultValue);
    //};


    // Get the distribution implementation dynamically
    const metadata = DistributionUtils.getMetadata(currentType);

    // Set column widths based on compact mode
    const colSpan = compact ? 200 : 150;

    //const distribution = getDistribution(currentType);
    //const metadata = distribution.getMetadata(currentType);

    // Helper function to render value field based on valueType
    const renderValueField = (valuePath, valueLabel, props = {}) => {
        switch (valueType) {
            case 'currency':
                return (
                    <CurrencyField
                        path={valuePath}
                        label={valueLabel}
                        {...props}
                    />
                );
            case 'percentage':
                return (
                    <PercentageField
                        path={valuePath}
                        label={valueLabel}
                        {...props}
                    />
                );
            case 'number':
            default:
                return (
                    <NumberField
                        path={valuePath}
                        label={valueLabel}
                        {...props}
                    />
                );
        }
    };

    // Render parameter fields based on distribution type
    const renderParameterFields = () => {
        switch (currentType) {
            case 'fixed':
                return null; // Value field is already rendered separately

            case 'normal':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            <PercentageField
                                path={[...parametersPath, 'stdDev']}
                                defaultValue={10.0}
                                label="Standard Deviation"
                                tooltip="Measure of dispersion"
                                min={0.1}
                                step={0.1}
                                required
                            />
                        </FormCol>
                    </FormRow>
                );

            case 'lognormal':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'mu'],
                                'Mu (Log-mean)',
                                {
                                    required: true,
                                    tooltip: 'Mean of the logarithm of the variable',
                                    value: Math.round(Math.log(value) * 100) / 100,
                                    step: 0.01,
                                    disabled: false
                                }
                            )}
                        </FormCol>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'sigma'],
                                'Sigma (Log-std)',
                                {
                                    min: 0,
                                    required: true,
                                    step: 0.01,
                                    tooltip: 'Standard deviation of the logarithm of the variable'
                                }
                            )}
                        </FormCol>
                    </FormRow>
                );

            case 'triangular':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'min'],
                                'Minimum',
                                {
                                    required: true,
                                    tooltip: 'Smallest possible value',
                                    defaultValue: defaultValue * 0.9,
                                    addonAfter: addonAfter,
                                    step: step
                                }
                            )}
                        </FormCol>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'mode'],
                                'Mode',
                                {
                                    required: true,
                                    tooltip: 'Most likely value',
                                    addonAfter: addonAfter,
                                    defaultValue: defaultValue,
                                    step: step
                                }
                            )}
                        </FormCol>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'max'],
                                'Maximum',
                                {
                                    required: true,
                                    tooltip: 'Largest possible value',
                                    defaultValue: defaultValue * 1.1,
                                    addonAfter: addonAfter,
                                    step: step
                                }
                            )}
                        </FormCol>
                    </FormRow>
                );

            case 'uniform':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'min'],
                                'Minimum',
                                {
                                    required: true,
                                    tooltip: 'Smallest possible value',
                                    addonAfter: addonAfter,
                                    step: step
                                }
                            )}
                        </FormCol>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'max'],
                                'Maximum',
                                {
                                    required: true,
                                    tooltip: 'Largest possible value',
                                    addonAfter: addonAfter,
                                    step: step
                                }
                            )}
                        </FormCol>
                    </FormRow>
                );

            case 'weibull':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'scale']}
                                label="Scale Parameter"
                                tooltip="Scale parameter of the Weibull distribution"
                                min={0}
                                step={0.01}
                                defaultValue={1}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'shape']}
                                label="Shape Parameter"
                                tooltip="Shape parameter of the Weibull distribution"
                                min={0}
                                step={0.01}
                                defaultValue={2}
                                required
                            />
                        </FormCol>
                    </FormRow>
                );

            case 'exponential':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'lambda']}
                                label="Lambda"
                                tooltip="Rate parameter of the exponential distribution"
                                defaultValue={1 / defaultValue}
                                min={0}
                                step={0.01}
                                required
                            />
                        </FormCol>
                    </FormRow>
                );

            case 'poisson':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'lambda']}
                                label="Lambda"
                                tooltip="Mean number of events in the specified interval"
                                min={0}
                                required
                            />
                        </FormCol>
                    </FormRow>
                );

            case 'kaimal':
                return (
                    <FormRow >
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'meanWindSpeed']}
                                label="Mean Wind Speed"
                                tooltip="Average wind speed in m/s"
                                min={0}
                                step={0.01}
                                addonAfter={'m/s'}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <PercentageField
                                path={[...parametersPath, 'turbulenceIntensity']}
                                label="Turbulence Intensity"
                                tooltip="Turbulence intensity as percentage of mean wind speed"
                                min={0}
                                max={30}
                                step={0.1}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'roughnessLength']}
                                label="Roughness Length"
                                tooltip="Surface roughness length in meters"
                                min={0}
                                step={0.01}
                                addonAfter={'m'}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'scale']}
                                label="Kaimal Scale"
                                tooltip="Scale parameter for the Kaimal spectrum"
                                step={0.01}
                                min={0}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'hubHeight']}
                                label="Hub Height"
                                tooltip="Hub height in meters"
                                min={70}
                                defaultValue={105}
                                step={0.5}
                                addonAfter={'m'}
                                required
                            />
                        </FormCol>
                    </FormRow>
                );
            case 'gbm':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            <PercentageField
                                path={[...parametersPath, 'drift']}
                                label="Drift (Annual)"
                                tooltip="Annual growth rate"
                                min={-20}
                                max={20}
                                step={0.1}
                                precision={1}
                                defaultValue={5}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <PercentageField
                                path={[...parametersPath, 'volatility']}
                                label="Volatility (Annual)"
                                tooltip="Annual standard deviation as percentage"
                                min={0}
                                max={100}
                                step={0.1}
                                precision={1}
                                defaultValue={20}
                                required
                            />
                        </FormCol>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'timeStep']}
                                label="Time Step"
                                tooltip="Time increment in years (typically 1 for annual)"
                                min={0.1}
                                step={0.1}
                                defaultValue={1}
                                precision={1}
                                addonAfter="years"
                                required
                            />
                        </FormCol>
                    </FormRow>
                );
            default:
                return null;
        }
    };

    // Create distribution object for InfoBox
    const distributionObject = {
        type: currentType,
        parameters: parameters
    };

    return (
        <div className="distribution-field-v2" style={style}>
            {showTitle && (
                <Title level={titleLevel}>{label}</Title>
            )}

            <Space direction="vertical" style={{ width: '100%' }}>
                <SelectField
                    path={typePath}
                    label={`Distribution Type`}
                    tooltip={tooltip}
                    options={options}
                    {...rest}
                />

                <Divider style={{ margin: '8px 0' }} />

                <Row gutter={16} align="top">
                    <Col span={showVisualization ? 12 : 24}>
                        {/* Always render value field first */}
                        <FormRow>
                            <FormCol span={colSpan}>
                                {renderValueField(
                                    [...parametersPath, 'value'],
                                    valueName || 'Value',
                                    {
                                        tooltip: currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value',
                                        addonAfter: addonAfter,
                                        required: true,
                                        defaultValue: defaultValue,
                                        step: step
                                    }
                                )}
                            </FormCol>
                        </FormRow>

                        {/* Render other parameter fields based on selected distribution */}
                        {currentType !== 'fixed' && renderParameterFields()}
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
                {/* This is the key change - conditionally render the DistributionInfoBox */}
                {showInfoBox &&
                    <Alert
                        type="info"
                        message={metadata.name}  // Updated from infoBoxTitle to use metadata.name
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
                                        {metadata.parameters.map((param, index) => (
                                            <li key={index}>
                                                <Text code>{param.name}</Text>: {param.description}
                                                {param.required && ' (required)'}
                                                {param.min !== undefined && `, min: ${param.min}`}
                                                {param.max !== undefined && `, max: ${param.max}`}
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
                }
            </Space>
        </div>
    );
};

export default DistributionFieldV2;