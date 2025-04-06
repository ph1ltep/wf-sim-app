// src/components/contextFields/DistributionFieldV2.jsx
import React from 'react';
import { Typography, Space, Divider } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { SelectField, NumberField, CurrencyField, PercentageField, FormRow, FormCol } from './index';

const { Title } = Typography;

/**
 * A field component for managing distribution type and parameters
 * based on the new distribution structure: { type, parameters, timeSeriesMode }
 * 
 * @param {string[]} path - Path to the distribution object in the context
 * @param {string[]} defaultValuePath - Path to use for default value of value/mean/mode parameters
 * @param {string} label - Field label
 * @param {string} tooltip - Optional tooltip
 * @param {Object[]} options - Distribution type options
 * @param {boolean} showTitle - Whether to show a title
 * @param {string} titleLevel - Typography title level
 * @param {string} valueType - Type of value field ('number', 'currency', 'percentage')
 * @param {string} addonAfter - Text to display after value inputs
 * @param {Object} style - Additional styles
 */
const DistributionFieldV2 = ({
    path,
    defaultValuePath,
    label,
    tooltip,
    options = [
        { value: 'fixed', label: 'Fixed Value' },
        { value: 'normal', label: 'Normal Distribution' },
        { value: 'lognormal', label: 'Lognormal Distribution' },
        { value: 'triangular', label: 'Triangular Distribution' },
        { value: 'uniform', label: 'Uniform Distribution' },
        { value: 'weibull', label: 'Weibull Distribution' },
        { value: 'exponential', label: 'Exponential Distribution' },
        { value: 'poisson', label: 'Poisson Distribution' },
        { value: 'kaimal', label: 'Kaimal Distribution' }
    ],
    showTitle = true,
    titleLevel = 5,
    valueType = 'number',
    addonAfter,
    compact = false,
    style = {},
    step,
    ...rest
}) => {
    // Get scenario context
    const { getValueByPath } = useScenario();

    // Get current distribution type
    const typePath = [...path, 'type'];
    const parametersPath = [...path, 'parameters'];
    const currentType = getValueByPath(typePath, 'fixed');

    // Get default value from defaultValuePath if provided
    const defaultValue = defaultValuePath ? getValueByPath(defaultValuePath, 0) : 0;

    // Set column widths based on compact mode
    const colSpan = compact ? 200 : 150;

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
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'value'],
                                'Fixed Value',
                                {
                                    required: true,
                                    tooltip: 'Exact value to use (no randomness)',
                                    addonAfter: addonAfter,
                                    defaultValue: defaultValue,
                                    step: step
                                }
                            )}
                        </FormCol>
                    </FormRow>
                );

            case 'normal':
                return (
                    <FormRow>
                        <FormCol span={colSpan}>
                            {renderValueField(
                                [...parametersPath, 'mean'],
                                'Mean',
                                {
                                    required: true,
                                    tooltip: 'Average value in the normal distribution',
                                    addonAfter: addonAfter,
                                    defaultValue: defaultValue,
                                    step: step
                                }
                            )}
                        </FormCol>
                        <FormCol span={colSpan}>
                            <NumberField
                                path={[...parametersPath, 'stdDev']}
                                label="Standard Deviation"
                                tooltip="Measure of dispersion"
                                min={0}
                                step={0.01}
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
                                [...parametersPath, 'mean'],
                                'Mu (Log-mean)',
                                {
                                    required: true,
                                    tooltip: 'Mean of the logarithm of the variable',
                                    defaultValue: defaultValue,
                                    step: step
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
                                min={0}
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

            default:
                return null;
        }
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
                    //style={{ width: '100%' }}
                    {...rest}
                />

                <Divider style={{ margin: '8px 0' }} />

                {renderParameterFields()}
            </Space>
        </div>
    );
};

export default DistributionFieldV2;