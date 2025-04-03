// src/components/contextFields/DistributionField.jsx
import React, { useMemo } from 'react';
import { Card, Typography, Space } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { SelectField, NumberField, FormRow, FormCol } from './index';

const { Title } = Typography;

/**
 * Complex field for managing probability distributions
 * Supports Normal, Lognormal, Triangular, and Uniform distributions
 * 
 * @param {string[]} path - Path to the distribution object in the context
 * @param {string} label - Field label
 * @param {string} tooltip - Optional tooltip
 * @param {Object[]} options - Distribution type options
 * @param {boolean} showTitle - Whether to show a title (defaults to true)
 * @param {string} titleLevel - Typography title level (defaults to 5)
 * @param {Object} style - Additional styles
 */
const DistributionField = ({
  path,
  label,
  tooltip,
  options = [
    { value: 'Normal', label: 'Normal' },
    { value: 'Lognormal', label: 'Lognormal' },
    { value: 'Triangular', label: 'Triangular' },
    { value: 'Uniform', label: 'Uniform' }
  ],
  showTitle = true,
  titleLevel = 5,
  compact = false,
  style = {},
  ...rest
}) => {
  // Get current distribution type
  const { getValueByPath } = useScenario();
  const distributionPath = [...path, 'distribution'];
  const distribution = getValueByPath(distributionPath, 'Normal');

  // Set column widths based on compact mode
  const colSpan = compact ? 12 : 8;

  // Create parameters components based on distribution type
  const parameterFields = useMemo(() => {
    switch (distribution) {
      case 'Normal':
        return (
          <FormRow>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'mean']}
                label="Mean"
                tooltip="Average value"
                required
              />
            </FormCol>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'std']}
                label="Standard Deviation"
                tooltip="Measure of dispersion"
                min={0}
                required
              />
            </FormCol>
          </FormRow>
        );
        
      case 'Lognormal':
        return (
          <FormRow>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'mu']}
                label="Mu" 
                tooltip="Log-mean parameter"
                required
              />
            </FormCol>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'sigma']}
                label="Sigma"
                tooltip="Log-standard deviation parameter"
                min={0}
                required
              />
            </FormCol>
          </FormRow>
        );
        
      case 'Triangular':
        return (
          <FormRow>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'min']}
                label="Minimum"
                tooltip="Smallest possible value"
                required
              />
            </FormCol>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'mode']}
                label="Mode"
                tooltip="Most likely value"
                required
              />
            </FormCol>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'max']}
                label="Maximum"
                tooltip="Largest possible value"
                required
              />
            </FormCol>
          </FormRow>
        );
        
      case 'Uniform':
        return (
          <FormRow>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'min']}
                label="Minimum"
                tooltip="Smallest possible value"
                required
              />
            </FormCol>
            <FormCol span={colSpan}>
              <NumberField
                path={[...path, 'max']}
                label="Maximum"
                tooltip="Largest possible value"
                required
              />
            </FormCol>
          </FormRow>
        );
        
      default:
        return null;
    }
  }, [distribution, path, colSpan]);

  return (
    <div className="distribution-field" style={style}>
      {showTitle && (
        <Title level={titleLevel}>{label}</Title>
      )}
      
      <Space direction="vertical" style={{ width: '100%' }}>
        <SelectField
          path={distributionPath}
          label={`Distribution Type`}
          tooltip={tooltip}
          options={options}
          style={{ width: '100%' }}
          {...rest}
        />
        
        {parameterFields}
      </Space>
    </div>
  );
};

export default DistributionField;