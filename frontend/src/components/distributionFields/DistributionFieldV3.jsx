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
 * @param {Object} props - Component props
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
  const { getValueByPath, updateByPath } = useScenario();
  const { fitDistributionToData, fittingDistribution } = useInputSim();

  const typePath = [...path, 'type'];
  const parametersPath = [...path, 'parameters'];
  const timeSeriesParametersPath = [...path, 'timeSeriesParameters'];
  const timeSeriesModePath = [...path, 'timeSeriesMode'];

  const currentType = (getValueByPath(typePath, 'fixed')).toLowerCase();
  const parameters = getValueByPath(parametersPath, {});
  const timeSeriesParameters = getValueByPath(timeSeriesParametersPath, { value: [] });
  const timeSeriesMode = getValueByPath(timeSeriesModePath, false);

  const [hasFittedParams, setHasFittedParams] = useState(false);

  const defaultValue = defaultValuePath ? getValueByPath(defaultValuePath, 0) : 0;
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

  const handleTimeSeriesModeChange = useCallback(async (checked) => {
    try {
      const currentType = getValueByPath(typePath, 'fixed');
      const currentParameters = getValueByPath(parametersPath, {});
      const currentTimeSeriesParameters = getValueByPath(timeSeriesParametersPath, { value: [] });
      const currentIsTimeSeriesMode = getValueByPath(timeSeriesModePath, false);

      const currentDistribution = {
        type: currentType,
        timeSeriesMode: currentIsTimeSeriesMode,
        parameters: currentParameters,
        timeSeriesParameters: currentTimeSeriesParameters
      };

      const { isValid, message: validationMessage, distribution: updatedDistribution } =
        validateTimeSeriesModeTransition(currentDistribution, checked, defaultValue);

      if (validationMessage) {
        console.log(`Time series mode transition: ${validationMessage}`);
      }

      if (checked !== currentIsTimeSeriesMode) {
        await updateByPath(timeSeriesModePath, checked);

        if (updatedDistribution.parameters.value !== currentParameters.value) {
          await updateByPath([...parametersPath, 'value'], updatedDistribution.parameters.value);
        }

        if (JSON.stringify(updatedDistribution.timeSeriesParameters.value) !==
            JSON.stringify(currentTimeSeriesParameters.value)) {
          await updateByPath([...timeSeriesParametersPath, 'value'], updatedDistribution.timeSeriesParameters.value);
        }

        if (!checked && hasFittedParams) {
          setHasFittedParams(false);
        }
      }
    } catch (error) {
      console.error('Error toggling time series mode:', error);
      message.error('Failed to toggle time series mode');
    }
  }, [defaultValue, timeSeriesParametersPath, parametersPath, timeSeriesModePath, typePath, updateByPath, getValueByPath, hasFittedParams]);

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

    const distribution = {
      type: currentType,
      parameters: { ...parameters },
      timeSeriesParameters: { value: validData },
      timeSeriesMode: true
    };

    const fittedParams = await fitDistributionToData(distribution, validData, async (fittedParams) => {
      if (fittedParams) {
        // Prepare batch updates
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
  }, [currentType, fitDistributionToData, parameters, parametersPath, timeSeriesData, updateByPath]);

  const handleClearFit = useCallback(async () => {
    const metadata = DistributionUtils.getMetadata(currentType);
    if (metadata && metadata.parameters) {
      const updates = metadata.parameters
        .filter(param => param.name !== 'value' && param.fieldProps.defaultValue !== undefined)
        .reduce((acc, param) => {
          acc[[...parametersPath, param.name].join('.')] = param.fieldProps.defaultValue;
          return acc;
        }, {});

      await updateByPath(updates);
      setHasFittedParams(false);
    }
  }, [currentType, parametersPath, updateByPath]);

  const metadata = useMemo(() => {
    return DistributionUtils.getMetadata(currentType) || {};
  }, [currentType]);

  const minRequiredPoints = useMemo(() => {
    return DistributionUtils.getMinRequiredPoints(currentType) || 3;
  }, [currentType]);

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
          {showVisualization && (
            <Col span={12}>
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
                />
              )}
            </Col>
          )}
        </Row>
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