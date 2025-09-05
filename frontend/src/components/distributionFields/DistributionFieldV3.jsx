// src/components/distributionFields/DistributionFieldV3.jsx - Updated with optimized layout
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Typography, Space, Divider, Row, Col, Alert, Spin, message, Popover, Button, Form } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { FormRow, FormCol, SelectField, NumberField, CurrencyField, PercentageField } from '../contextFields';
import DistributionPlot from './DistributionPlot';
import DistributionSettings from './DistributionSettings';
import renderParameterFields from './renderParameterFields';
import renderTimeSeriesFields from './renderTimeSeriesFields';
import { distributionTypes, DistributionUtils } from '../../utils/distributions';
// Unused imports removed - validateTimeSeriesModeTransition, getAppropriateValue
import useInputSim from '../../hooks/useInputSim';
import ThemedIcon from '../common/ThemedIcon';

const { Title, Text, Paragraph } = Typography;

// DistributionStatusIcons component removed as it's unused

/**
 * Info popover component for distribution information
 */
const DistributionInfoPopover = ({ metadata, distributionType }) => {
  // Remove the metadata check - always show the button
  const infoContent = (
    <div style={{ maxWidth: 400 }}>
      {metadata ? (
        <div style={{ fontSize: '0.9em' }}>
          <Paragraph style={{ marginBottom: '12px' }}>
            <Text strong>{metadata.name || distributionType}</Text>
          </Paragraph>
          <Paragraph style={{ marginBottom: '12px' }}>
            {metadata.description}
          </Paragraph>
          <Paragraph style={{ marginBottom: '8px' }}>
            <Text strong>Applications:</Text> {metadata.applications}
          </Paragraph>
          <Paragraph style={{ marginBottom: '8px' }}>
            <Text strong>Examples:</Text> {metadata.examples}
          </Paragraph>
          <Paragraph style={{ marginBottom: '8px' }}>
            <Text strong>Parameters:</Text>
          </Paragraph>
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
          {metadata?.nonNegativeSupport && (
            <Paragraph style={{ marginBottom: '2px', marginTop: '8px' }}>
              <Text strong>Note:</Text> This distribution only supports non-negative values.
            </Paragraph>
          )}
        </div>
      ) : (
        <Text>No distribution information available</Text>
      )}
    </div>
  );

  return (
    <Popover
      content={infoContent}
      title="Distribution Information"
      trigger="click"
      placement="bottomLeft"
      overlayStyle={{ maxWidth: 450 }}
    >
      <Button
        type="text"
        size="small"
        icon={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
        style={{ padding: '0 4px', marginLeft: 0 }}
      />
    </Popover>
  );
};

/**
 * Enhanced distribution field component with optimized layout
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
  allowCurveToggle = true,
  style = {},
  step,
  // Form mode props
  formMode = false,
  name = null,
  getValueOverride = null,
  updateValueOverride = null,
  ...rest
}) => {
  const { getValueByPath, updateByPath } = useScenario();
  const { fitDistributionToData, fittingDistribution } = useInputSim();

  // Ensure path is an array to prevent character spreading - wrap in useMemo
  const pathArray = useMemo(() => Array.isArray(path) ? path : [path], [path]);
  
  // Generate base name for nested form fields when in form mode
  const baseName = formMode && name ? name : null;

  const typePath = [...pathArray, 'type'];
  // Wrap path arrays in useMemo to prevent unnecessary re-renders
  const parametersPath = useMemo(() => [...pathArray, 'parameters'], [pathArray]);
  const timeSeriesParametersPath = useMemo(() => [...pathArray, 'timeSeriesParameters'], [pathArray]);
  const timeSeriesModePath = [...pathArray, 'timeSeriesMode'];
  const metadataPath = [...pathArray, 'metadata'];

  // Get values respecting form mode
  const getValue = useCallback((path, defaultVal) => {
    if (formMode && getValueOverride) {
      return getValueOverride(path, defaultVal);
    }
    return getValueByPath(path, defaultVal);
  }, [formMode, getValueOverride, getValueByPath]);

  // Update values respecting form mode
  const updateValue = useCallback(async (path, value) => {
    if (formMode && updateValueOverride) {
      return updateValueOverride(path, value);
    }
    return await updateByPath(path, value);
  }, [formMode, updateValueOverride, updateByPath]);

  const currentType = (getValue(typePath, 'fixed')).toLowerCase();
  const parameters = getValue(parametersPath, {});
  const timeSeriesMode = getValue(timeSeriesModePath, false);

  // Settings state
  const percentileDirection = getValue([...metadataPath, 'percentileDirection'], 'ascending');
  const [viewModeState, setViewModeState] = useState('pdf');

  const [hasFittedParams, setHasFittedParams] = useState(false);

  // Get distribution implementation based on current type
  const distribution = useMemo(() =>
    DistributionUtils.getDistribution(currentType), [currentType]);

  // Get minimum required points from distribution metadata
  const minRequiredPoints = useMemo(() =>
    DistributionUtils.getMinRequiredPoints(currentType), [currentType]);

  // Get metadata from distribution
  const metadata = useMemo(() =>
    DistributionUtils.getMetadata(currentType, parameters), [currentType, parameters]);

  // Initialize view mode from metadata default curve
  useEffect(() => {
    if (metadata && metadata.defaultCurve) {
      setViewModeState(metadata.defaultCurve);
    } else {
      setViewModeState('pdf');
    }
  }, [metadata]);

  // Ensure we have the default value from defaultValuePath or distribution metadata
  const defaultValue = useMemo(() => {
    if (defaultValuePath) {
      return getValue(defaultValuePath, 0);
    }
    if (distribution && metadata) {
      const valueParam = metadata.parameters.find(p => p.name === 'value');
      return valueParam?.fieldProps?.defaultValue || 0;
    }
    return 0;
  }, [defaultValuePath, getValue, distribution, metadata]);

  const value = getValue([...parametersPath, 'value'], defaultValue);

  const timeSeriesData = useMemo(() => {
    if (timeSeriesMode) {
      const tsData = getValue([...timeSeriesParametersPath, 'value'], []);
      return Array.isArray(tsData) ? tsData : [];
    }
    return [];
  }, [timeSeriesMode, timeSeriesParametersPath, getValue]);

  // canShowPlot variable removed as it's unused

  const colSpan = compact ? { xs: 24, sm: 8 } : { xs: 24, sm: 12 };

  // Initialize parameters and time series as needed (skip in form mode)
  useEffect(() => {
    // Skip initialization in form mode - ContextForm handles initial values
    if (formMode) return;
    
    if (defaultValue !== undefined && defaultValue !== null) {
      if (timeSeriesMode) {
        const currentTSData = getValue([...timeSeriesParametersPath, 'value'], null);
        if (!currentTSData || !Array.isArray(currentTSData) || currentTSData.length === 0) {
          const initialData = [];
          if (typeof value === 'number') {
            initialData.push({ year: 0, value: value });
          }
          updateValue([...timeSeriesParametersPath, 'value'], initialData);
        }
      } else if (value === undefined || value === null) {
        updateValue([...parametersPath, 'value'], defaultValue);
      }
    }
  }, [formMode, defaultValue, parametersPath, timeSeriesParametersPath, updateValue, value, timeSeriesMode, getValue]);

  // Handle fitting distribution to time series data
  const handleFitDistribution = useCallback(async () => {
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      return;
    }

    const validData = timeSeriesData.filter(
      point => point && typeof point === 'object' &&
        point.year !== undefined && point.value !== undefined
    );

    if (validData.length === 0) {
      return;
    }

    if (validData.length < minRequiredPoints) {
      message.warning(`Need at least ${minRequiredPoints} data points for the ${currentType} distribution.`);
      return;
    }

    const distribution = {
      type: currentType,
      parameters: { ...parameters },
      timeSeriesParameters: { value: validData },
      timeSeriesMode: true
    };

    const fittedParams = await fitDistributionToData(distribution, validData, async (fittedParams) => {
      if (fittedParams) {
        const updates = Object.entries(fittedParams).reduce((acc, [key, value]) => {
          acc[[...parametersPath, key].join('.')] = value;
          return acc;
        }, {});

        const result = await updateByPath(updates);
        if (result.isValid && result.applied > 0) {
          setHasFittedParams(true);
        } else {
          message.error('Failed to apply some fitted parameters');
          console.error('Batch update errors:', result.errors);
        }
      }
    });

    return fittedParams;
  }, [currentType, fitDistributionToData, parameters, parametersPath, timeSeriesData, updateByPath, minRequiredPoints]);

  const handleClearFit = useCallback(async () => {
    if (!metadata || !metadata.parameters) return;

    const updates = metadata.parameters
      .filter(param => param.name !== 'value' && param.fieldProps.defaultValue !== undefined)
      .reduce((acc, param) => {
        acc[[...parametersPath, param.name].join('.')] = param.fieldProps.defaultValue;
        return acc;
      }, {});

    await updateByPath(updates);
    setHasFittedParams(false);
  }, [metadata, parametersPath, updateByPath]);

  const displayName = valueName || (metadata?.parameters.find(p => p.name === 'value')?.fieldProps?.label) || 'Value';

  const timeSeriesResult = useMemo(() => {
    if (timeSeriesMode) {
      return renderTimeSeriesFields(currentType, parametersPath, timeSeriesParametersPath, {
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
        parameters,
        minRequiredPoints,
        // Form mode props
        formMode,
        baseName,
        getValueOverride,
        updateValueOverride
      });
    }
    return { fieldsContent: null, fittedParamsAlert: null };
  }, [timeSeriesMode, currentType, parametersPath, timeSeriesParametersPath, addonAfter, valueType, displayName, step, timeSeriesData, fittingDistribution, handleFitDistribution, handleClearFit, hasFittedParams, metadata, parameters, minRequiredPoints, formMode, baseName, getValueOverride, updateValueOverride]);


  return (
    <div className="distribution-field-v3" style={style}>
      {showTitle && (
        <Title level={titleLevel}>{label}</Title>
      )}

      <Row gutter={16} style={{ maxWidth: '1000px' }}>
        {/* Left Column - Controls and Parameters - Fixed Size */}
        <Col xs={24} xl={showVisualization ? 12 : 20}>
          <div style={{ maxWidth: '500px' }}>
            <Space direction="vertical" style={{ width: '100%', paddingRight: '10px' }} size="small">
              {/* Distribution Type Row - Fixed size to content */}
              <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap', gap: '8px' }}>
                <div style={{ flex: '0 1 auto', minWidth: 200, maxWidth: 350 }}>
                  <SelectField
                    path={typePath}
                    label="Distribution Type"
                    tooltip={tooltip}
                    options={options}
                    defaultValue={currentType}
                    componentProps={{
                      dropdownMatchSelectWidth: false,
                      style: { minWidth: 200 }
                    }}
                    // Form mode props
                    formMode={formMode}
                    name={baseName ? `${baseName}.type` : undefined}
                    getValueOverride={getValueOverride}
                    updateValueOverride={updateValueOverride}
                    {...rest}
                  />
                </div>
              </div>

              {/* Compact Separator */}
              <Divider style={{ margin: '0px', marginBottom: '6px' }} />

              {/* Dynamic Content Area */}
              <div>
                <Spin spinning={fittingDistribution} tip="Fitting distribution to data...">
                  {timeSeriesMode ? (
                    timeSeriesResult.fieldsContent
                  ) : (
                    <>
                      <FormRow>
                        <FormCol {...(typeof colSpan === 'object' ? colSpan : { span: colSpan })}>
                          {valueType === 'percentage' ? (
                            <PercentageField
                              path={[...parametersPath, 'value']}
                              label={displayName}
                              tooltip={currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value'}
                              defaultValue={defaultValue}
                              required
                              formMode={formMode}
                              name={baseName ? `${baseName}.parameters.value` : undefined}
                              getValueOverride={getValueOverride}
                              updateValueOverride={updateValueOverride}
                            />
                          ) : valueType === 'currency' ? (
                            <CurrencyField
                              path={[...parametersPath, 'value']}
                              label={displayName}
                              tooltip={currentType === 'fixed' ? 'Exact value to use (no randomness)' : 'Default value'}
                              defaultValue={defaultValue}
                              required
                              formMode={formMode}
                              name={baseName ? `${baseName}.parameters.value` : undefined}
                              getValueOverride={getValueOverride}
                              updateValueOverride={updateValueOverride}
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
                              formMode={formMode}
                              name={baseName ? `${baseName}.parameters.value` : undefined}
                              getValueOverride={getValueOverride}
                              updateValueOverride={updateValueOverride}
                            />
                          )}
                        </FormCol>
                      </FormRow>
                      {/* Dynamic Parameter Fields - Use Form.Item shouldUpdate in form mode to trigger re-renders */}
                      {formMode ? (
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) => {
                            // Re-render when distribution type changes
                            const typeName = baseName ? `${baseName}.type` : 'type';
                            const prevType = prevValues[typeName] || (baseName ? prevValues[baseName]?.type : prevValues.type);
                            const currentType = currentValues[typeName] || (baseName ? currentValues[baseName]?.type : currentValues.type);
                            return prevType !== currentType;
                          }}
                        >
                          {(form) => {
                            // Get current type from form values
                            const typeName = baseName ? `${baseName}.type` : 'type';
                            const formType = form.getFieldValue(typeName) || 
                                           (baseName ? form.getFieldValue([baseName, 'type']) : form.getFieldValue('type')) || 
                                           'fixed';
                            
                            
                            return (
                              <FormRow>
                                {(() => {
                                  // Get metadata for the current form type
                                  const fieldMetadata = DistributionUtils.getMetadata(formType, parameters);
                                  const parametersToRender = fieldMetadata?.parameters?.filter(param => param.name !== 'value') || [];

                                  return renderParameterFields(formType, parametersPath, {
                                    addonAfter,
                                    step,
                                    colSpan,
                                    renderValueSeparately: true,
                                    currentParameters: { value: parameters.value },
                                    // Form mode props
                                    formMode,
                                    baseName,
                                    getValueOverride,
                                    updateValueOverride
                                  }).map((field, index) => {
                                    // Get the corresponding parameter metadata for this field
                                    const paramMetadata = parametersToRender[index];
                                    const fieldSpan = paramMetadata?.fieldProps?.span || colSpan;

                                    // Handle both object spans and number spans
                                    const spanProps = typeof fieldSpan === 'object'
                                      ? fieldSpan  // { xs: 24, sm: 8 }
                                      : { span: fieldSpan }; // 24

                                    return (
                                      <FormCol {...spanProps} key={`${formType}-${index}`}>
                                        {field}
                                      </FormCol>
                                    );
                                  });
                                })()}
                              </FormRow>
                            );
                          }}
                        </Form.Item>
                      ) : (
                        <FormRow>
                          {(() => {
                            // Get metadata to extract span information
                            const fieldMetadata = DistributionUtils.getMetadata(currentType, parameters);
                            const parametersToRender = fieldMetadata?.parameters?.filter(param => param.name !== 'value') || [];

                            return renderParameterFields(currentType, parametersPath, {
                              addonAfter,
                              step,
                              colSpan,
                              renderValueSeparately: true,
                              currentParameters: { value: parameters.value },
                              // Form mode props
                              formMode,
                              baseName,
                              getValueOverride,
                              updateValueOverride
                            }).map((field, index) => {
                              // Get the corresponding parameter metadata for this field
                              const paramMetadata = parametersToRender[index];
                              const fieldSpan = paramMetadata?.fieldProps?.span || colSpan;

                              // Handle both object spans and number spans
                              const spanProps = typeof fieldSpan === 'object'
                                ? fieldSpan  // { xs: 24, sm: 8 }
                                : { span: fieldSpan }; // 24

                              return (
                                <FormCol {...spanProps} key={index}>
                                  {field}
                                </FormCol>
                              );
                            });
                          })()}
                        </FormRow>
                      )}
                    </>
                  )}
                </Spin>
              </div>
            </Space>
          </div>
        </Col>

        {/* Visualization + Icon Column Group - Wrap together as one unit */}
        {showVisualization && (
          <Col xs={24} xl={10}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0px',
                width: '100%'
              }}>
                {/* Visualization */}
                <div style={{ flex: '1 1 auto', minWidth: 0, paddingRight: '12px', alignItems: 'center' }}>
                  {timeSeriesMode && !hasFittedParams ? (
                    <Alert
                      message="Visualization not available"
                      description={
                        <div style={{ fontSize: '0.9em' }}>
                          <p>Please fit a distribution to your time series data to see the visualization.</p>
                          <p>You need at least {minRequiredPoints} data points for the {currentType} distribution.</p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <>
                      {/* Distribution Plot - Use Form.Item shouldUpdate in form mode to get fresh parameters */}
                      {formMode ? (
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) => {
                            const typeName = baseName ? `${baseName}.type` : 'type';
                            const paramPrefix = baseName ? `${baseName}.parameters` : 'parameters';
                            
                            // Check if distribution type changed
                            if (prevValues[typeName] !== currentValues[typeName]) {
                              return true;
                            }
                            
                            // Check if any parameter field changed
                            const prevParamKeys = Object.keys(prevValues).filter(key => key.startsWith(paramPrefix + '.'));
                            const currentParamKeys = Object.keys(currentValues).filter(key => key.startsWith(paramPrefix + '.'));
                            
                            // Different number of parameter fields
                            if (prevParamKeys.length !== currentParamKeys.length) {
                              return true;
                            }
                            
                            // Check if any parameter value changed
                            return prevParamKeys.some(key => prevValues[key] !== currentValues[key]);
                          }}
                        >
                          {(form) => {
                            const typeName = baseName ? `${baseName}.type` : 'type';
                            const formType = form.getFieldValue(typeName) || 'fixed';
                            
                            // Reconstruct parameters object from flattened form fields
                            const allFormValues = form.getFieldsValue();
                            const paramPrefix = baseName ? `${baseName}.parameters` : 'parameters';
                            
                            // Extract all parameter fields from the flattened form structure
                            const reconstructedParams = {};
                            Object.keys(allFormValues).forEach(key => {
                              if (key.startsWith(paramPrefix + '.')) {
                                const paramName = key.replace(paramPrefix + '.', '');
                                reconstructedParams[paramName] = allFormValues[key];
                              }
                            });
                            
                            
                            return (
                              <DistributionPlot
                                distributionType={formType}
                                parameters={reconstructedParams}
                                addonAfter={addonAfter}
                                showMean={true}
                                showStdDev={true}
                                showMarkers={true}
                                showSummary={false}
                                showPercentiles={true}
                                allowCurveToggle={allowCurveToggle}
                                externalViewMode={showVisualization ? viewModeState : null}
                                onViewModeChange={setViewModeState}
                                style={{ marginTop: 0 }}
                              />
                            );
                          }}
                        </Form.Item>
                      ) : (
                        <DistributionPlot
                          distributionType={currentType}
                          parameters={parameters}
                          addonAfter={addonAfter}
                          showMean={true}
                          showStdDev={true}
                          showMarkers={true}
                          showSummary={false}
                          showPercentiles={true}
                          allowCurveToggle={allowCurveToggle}
                          externalViewMode={showVisualization ? viewModeState : null}
                          onViewModeChange={setViewModeState}
                          style={{ marginTop: 0 }}
                        />
                      )}

                      {/* Add the fitted parameters alert below the visualization */}
                      {timeSeriesResult.fittedParamsAlert && (
                        <div style={{ marginTop: '12px' }}>
                          {timeSeriesResult.fittedParamsAlert}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Icon Column - Always attached to visualization */}
                <div style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 8px',
                  height: '100%',
                  borderLeft: '1px solid #f0f0f0'
                }}>
                  {/* Settings Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                    <DistributionSettings
                      basePath={path}
                      viewMode={viewModeState}
                      onViewModeChange={setViewModeState}
                      allowCurveToggle={allowCurveToggle}
                      disabled={fittingDistribution}
                      // Form mode props
                      formMode={formMode}
                      getValueOverride={getValueOverride}
                      updateValueOverride={updateValueOverride}
                    />
                  </div>

                  {/* Info Icon - Grayed out */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                    <DistributionInfoPopover
                      metadata={metadata}
                      distributionType={currentType}
                    />
                  </div>

                  {/* Larger Spacer */}
                  <div style={{ height: '12px' }} />

                  {/* Status Icons - Smaller and more spaced */}
                  <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                    <ThemedIcon
                      iconKey={timeSeriesMode ? 'dataMode.timeSeries' : 'dataMode.singleValue'}
                      showEnabled={true}
                      style={{ fontSize: '14px', cursor: 'default' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                    <ThemedIcon
                      iconKey={`percentileDirection.${percentileDirection}`}
                      showEnabled={true}
                      style={{ fontSize: '14px', cursor: 'default' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                    <ThemedIcon
                      iconKey={`viewMode.${viewModeState}`}
                      showEnabled={true}
                      style={{ fontSize: '14px', cursor: 'default' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        )}

        {/* Icon Column for non-visualization mode only */}
        {!showVisualization && (
          <Col xs={24} xl={4}>
            <div style={{ maxWidth: '100px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 8px',
                borderLeft: '1px solid #f0f0f0',
                marginTop: 12
              }}>
                {/* Settings Icon */}
                <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                  <DistributionSettings
                    basePath={path}
                    viewMode={viewModeState}
                    onViewModeChange={setViewModeState}
                    allowCurveToggle={allowCurveToggle}
                    disabled={fittingDistribution}
                    // Form mode props
                    formMode={formMode}
                    getValueOverride={getValueOverride}
                    updateValueOverride={updateValueOverride}
                  />
                </div>

                {/* Info Icon - Grayed out */}
                <div style={{ display: 'flex', alignItems: 'center', height: '24px' }}>
                  <DistributionInfoPopover
                    metadata={metadata}
                    distributionType={currentType}
                  />
                </div>

                {/* Larger Spacer */}
                <div style={{ height: '12px' }} />

                {/* Status Icons */}
                <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                  <ThemedIcon
                    iconKey={timeSeriesMode ? 'dataMode.timeSeries' : 'dataMode.singleValue'}
                    showEnabled={true}
                    style={{ fontSize: '14px', cursor: 'default' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                  <ThemedIcon
                    iconKey={`percentileDirection.${percentileDirection}`}
                    showEnabled={true}
                    style={{ fontSize: '14px', cursor: 'default' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                  <ThemedIcon
                    iconKey={`viewMode.${viewModeState}`}
                    showEnabled={true}
                    style={{ fontSize: '14px', cursor: 'default' }}
                  />
                </div>
              </div>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DistributionFieldV3;