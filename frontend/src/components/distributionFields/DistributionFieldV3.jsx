// src/components/distributionFields/DistributionFieldV3.jsx - Updated with optimized layout
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Typography, Space, Divider, Row, Col, Alert, Spin, message, Popover, Button } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { FormRow, FormCol, SelectField, NumberField, CurrencyField, PercentageField } from '../contextFields';
import DistributionPlot from './DistributionPlot';
import DistributionSettings from './DistributionSettings';
import renderParameterFields from './renderParameterFields';
import renderTimeSeriesFields from './renderTimeSeriesFields';
import { distributionTypes, DistributionUtils } from '../../utils/distributions';
import { validateTimeSeriesModeTransition, getAppropriateValue } from '../../utils/distributions/stateTransition';
import useInputSim from '../../hooks/useInputSim';
import ThemedIcon from '../common/ThemedIcon';

const { Title, Text, Paragraph } = Typography;

/**
 * Status icons component for distribution field
 */
const DistributionStatusIcons = ({
  timeSeriesMode,
  percentileDirection,
  viewMode,
  allowCurveToggle = true,
  vertical = false
}) => {
  const iconStyle = {
    fontSize: '16px',
    cursor: 'default'
  };

  const icons = [
    {
      iconKey: timeSeriesMode ? 'dataMode.timeSeries' : 'dataMode.singleValue',
      enabled: true
    },
    {
      iconKey: `percentileDirection.${percentileDirection}`,
      enabled: true
    },
    {
      iconKey: `viewMode.${viewMode}`,
      enabled: allowCurveToggle
    }
  ];

  if (vertical) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        {icons.map((icon, index) => (
          <ThemedIcon
            key={index}
            iconKey={icon.iconKey}
            showEnabled={icon.enabled}
            style={iconStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <Space size={8}>
      {icons.map((icon, index) => (
        <ThemedIcon
          key={index}
          iconKey={icon.iconKey}
          showEnabled={icon.enabled}
          style={{ ...iconStyle, marginRight: index < icons.length - 1 ? 8 : 0 }}
        />
      ))}
    </Space>
  );
};

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
  ...rest
}) => {
  const { getValueByPath, updateByPath } = useScenario();
  const { fitDistributionToData, fittingDistribution } = useInputSim();

  const typePath = [...path, 'type'];
  const parametersPath = [...path, 'parameters'];
  const timeSeriesParametersPath = [...path, 'timeSeriesParameters'];
  const timeSeriesModePath = [...path, 'timeSeriesMode'];
  const metadataPath = [...path, 'metadata'];

  const currentType = (getValueByPath(typePath, 'fixed')).toLowerCase();
  const parameters = getValueByPath(parametersPath, {});
  const timeSeriesParameters = getValueByPath(timeSeriesParametersPath, { value: [] });
  const timeSeriesMode = getValueByPath(timeSeriesModePath, false);

  // Settings state
  const percentileDirection = getValueByPath([...metadataPath, 'percentileDirection'], 'ascending');
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
      return getValueByPath(defaultValuePath, 0);
    }
    if (distribution && metadata) {
      const valueParam = metadata.parameters.find(p => p.name === 'value');
      return valueParam?.fieldProps?.defaultValue || 0;
    }
    return 0;
  }, [defaultValuePath, getValueByPath, distribution, metadata]);

  const value = getValueByPath([...parametersPath, 'value'], defaultValue);

  const timeSeriesData = useMemo(() => {
    if (timeSeriesMode) {
      const tsData = getValueByPath([...timeSeriesParametersPath, 'value'], []);
      return Array.isArray(tsData) ? tsData : [];
    }
    return [];
  }, [timeSeriesMode, timeSeriesParametersPath, getValueByPath]);

  const canShowPlot = useMemo(() => {
    return !timeSeriesMode || (timeSeriesMode && hasFittedParams);
  }, [timeSeriesMode, hasFittedParams]);

  const colSpan = compact ? 200 : 150;

  // Initialize parameters and time series as needed
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== null) {
      if (timeSeriesMode) {
        const currentTSData = getValueByPath([...timeSeriesParametersPath, 'value'], null);
        if (!currentTSData || !Array.isArray(currentTSData) || currentTSData.length === 0) {
          const initialData = [];
          if (typeof value === 'number') {
            initialData.push({ year: 0, value: value });
          }
          updateByPath([...timeSeriesParametersPath, 'value'], initialData);
        }
      } else if (value === undefined || value === null) {
        updateByPath([...parametersPath, 'value'], defaultValue);
      }
    }
  }, [defaultValue, parametersPath, timeSeriesParametersPath, updateByPath, value, timeSeriesMode, getValueByPath]);

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
                    {...rest}
                  />
                </div>
              </div>

              {/* Compact Separator */}
              <Divider style={{ margin: '0px', marginBottom: '14px' }} />

              {/* Dynamic Content Area */}
              <div>
                <Spin spinning={fittingDistribution} tip="Fitting distribution to data...">
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
                      parameters,
                      minRequiredPoints
                    })
                  ) : (
                    <>
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
                      <FormRow>
                        {renderParameterFields(currentType, parametersPath, {
                          addonAfter,
                          step,
                          colSpan,
                          renderValueSeparately: true,
                          currentParameters: { value: parameters.value }
                        }).map((field, index) => (
                          <FormCol span={colSpan} key={index}>
                            {field}
                          </FormCol>
                        ))}
                      </FormRow>
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