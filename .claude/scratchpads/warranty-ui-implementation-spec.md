# Warranty Configuration UI Implementation Specification

## Overview

This document provides a complete implementation specification for a progressive disclosure warranty configuration UI that handles complex, multi-dimensional warranty terms while maintaining excellent usability.

## Data Structure Design

### Core Schema Integration

```javascript
// Add to existing scenario.js Yup schema
warranties: Yup.object().shape({
  configurationMode: Yup.string().oneOf(['template', 'component', 'advanced']).default('template'),
  
  template: Yup.object().shape({
    selectedTemplate: Yup.string().oneOf(['basic', 'comprehensive', 'performance', 'custom']).default('basic'),
    customizations: Yup.object().default({})
  }),
  
  componentWarranties: Yup.object().shape({
    gearbox: ComponentWarrantySchema,
    generator: ComponentWarrantySchema,
    blades: ComponentWarrantySchema,
    mainBearing: ComponentWarrantySchema,
    transformer: ComponentWarrantySchema,
    yawSystem: ComponentWarrantySchema,
    converter: ComponentWarrantySchema
  }),
  
  globalSettings: Yup.object().shape({
    warrantyProvider: Yup.string().default('OEM'),
    overallWarrantyPeriod: Yup.number().default(5),
    escalationClauses: Yup.boolean().default(false),
    currencyOfWarranty: Yup.string().default('USD')
  })
}).default(() => ({
  configurationMode: 'template',
  template: { selectedTemplate: 'basic', customizations: {} },
  componentWarranties: {},
  globalSettings: {
    warrantyProvider: 'OEM',
    overallWarrantyPeriod: 5,
    escalationClauses: false,
    currencyOfWarranty: 'USD'
  }
}))

// Component warranty schema
const ComponentWarrantySchema = Yup.object().shape({
  enabled: Yup.boolean().default(false),
  
  warrantyPeriods: Yup.array().of(Yup.object().shape({
    id: Yup.string().required(),
    startYear: Yup.number().required(),
    endYear: Yup.number().required(),
    warrantyType: Yup.string().oneOf(['comprehensive', 'component', 'performance']).default('comprehensive'),
    
    caps: Yup.object().shape({
      eventCap: DistributionTypeSchema.nullable(),
      annualCap: DistributionTypeSchema.nullable(),
      lifetimeCap: DistributionTypeSchema.nullable(),
      rollingCaps: Yup.object().shape({
        enabled: Yup.boolean().default(false),
        periodMonths: Yup.number().default(12),
        capAmount: DistributionTypeSchema.nullable()
      })
    }),
    
    coverage: Yup.object().shape({
      repairCosts: Yup.boolean().default(true),
      replacementCosts: Yup.boolean().default(true),
      laborCosts: Yup.boolean().default(true),
      logisticsCosts: Yup.boolean().default(false),
      consequentialDamages: Yup.boolean().default(false)
    }),
    
    performanceGuarantees: Yup.object().shape({
      availabilityGuarantee: Yup.object().shape({
        enabled: Yup.boolean().default(false),
        guaranteedAvailability: Yup.number().min(0).max(100).default(97),
        liquidatedDamages: DistributionTypeSchema.nullable()
      }),
      powerCurveGuarantee: Yup.object().shape({
        enabled: Yup.boolean().default(false),
        guaranteedPerformance: Yup.number().min(0).max(100).default(98),
        liquidatedDamages: DistributionTypeSchema.nullable()
      })
    }),
    
    responseTimeGuarantees: Yup.object().shape({
      enabled: Yup.boolean().default(false),
      guaranteedResponseTime: DistributionTypeSchema.nullable(),
      guaranteedRepairTime: DistributionTypeSchema.nullable(),
      downtimeReductionFactor: Yup.number().min(0).max(1).default(0.2)
    })
  })).default([]),
  
  exclusions: Yup.array().of(Yup.string()).default([]),
  inclusions: Yup.array().of(Yup.string()).default([]),
  
  strategicSpares: Yup.object().shape({
    enabled: Yup.boolean().default(false),
    prePositioned: Yup.boolean().default(false),
    spareComponents: Yup.array().of(Yup.string()).default([]),
    logisticsImprovementFactor: Yup.number().min(0).max(1).default(0.3)
  })
});
```

## Component Architecture

### 1. WarrantyConfigurationCard (Main Container)

**File**: `frontend/src/components/warranty/WarrantyConfigurationCard.jsx`

```javascript
import React, { useState, useMemo } from 'react';
import { Card, Tabs, Alert, Button } from 'antd';
import { SafetyCertificateOutlined, SettingOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import WarrantyTemplateSelector from './WarrantyTemplateSelector';
import ComponentWarrantyTabs from './ComponentWarrantyTabs';
import AdvancedWarrantyMatrix from './AdvancedWarrantyMatrix';
import WarrantyImpactCard from './WarrantyImpactCard';

const WarrantyConfigurationCard = () => {
  const { getValueByPath, updateByPath } = useScenario();
  const basePath = ['settings', 'modules', 'warranties'];
  
  const configurationMode = getValueByPath([...basePath, 'configurationMode'], 'template');
  
  const tabItems = [
    {
      key: 'template',
      label: (
        <span>
          <SafetyCertificateOutlined /> Templates
        </span>
      ),
      children: <WarrantyTemplateSelector basePath={basePath} />
    },
    {
      key: 'component',
      label: (
        <span>
          <SettingOutlined /> Component Specific
        </span>
      ),
      children: <ComponentWarrantyTabs basePath={basePath} />
    },
    {
      key: 'advanced',
      label: (
        <span>
          <DatabaseOutlined /> Advanced Configuration
        </span>
      ),
      children: <AdvancedWarrantyMatrix basePath={basePath} />
    }
  ];

  const handleModeChange = (newMode) => {
    updateByPath([...basePath, 'configurationMode'], newMode);
  };

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 2 }}>
        <Card 
          title="Warranty Configuration" 
          size="small"
          extra={
            <Button
              type="link"
              size="small"
              onClick={() => {/* Help modal */}}
            >
              Configuration Guide
            </Button>
          }
        >
          <Tabs
            activeKey={configurationMode}
            onChange={handleModeChange}
            items={tabItems}
            size="small"
          />
        </Card>
      </div>
      
      <div style={{ flex: 1 }}>
        <WarrantyImpactCard basePath={basePath} />
      </div>
    </div>
  );
};

export default WarrantyConfigurationCard;
```

### 2. WarrantyTemplateSelector (Level 1 - Beginner)

**File**: `frontend/src/components/warranty/WarrantyTemplateSelector.jsx`

```javascript
import React from 'react';
import { Radio, Card, Typography, Row, Col, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { ContextField } from '../contextFields/ContextField';
import { FormSection, FormRow, FormCol } from '../ui/FormComponents';

const { Text, Paragraph } = Typography;

const warrantyTemplates = {
  basic: {
    label: 'Basic Warranty',
    description: '2-year comprehensive warranty with standard terms',
    features: ['Component repair/replacement', 'Standard response times', 'Basic availability guarantee'],
    coverage: { years: 2, components: 'major', availability: '95%' }
  },
  comprehensive: {
    label: 'Comprehensive Warranty',
    description: '5-year full coverage with performance guarantees',
    features: ['Full component coverage', 'Guaranteed response times', 'Availability & performance guarantees', 'Strategic spares'],
    coverage: { years: 5, components: 'all', availability: '97%' }
  },
  performance: {
    label: 'Performance-Based Warranty',
    description: 'Availability-focused warranty with liquidated damages',
    features: ['Availability guarantees', 'Performance guarantees', 'Liquidated damages', 'Advanced monitoring'],
    coverage: { years: 3, components: 'major', availability: '98%' }
  },
  custom: {
    label: 'Custom Configuration',
    description: 'Build your own warranty terms',
    features: ['Flexible terms', 'Component-specific configuration', 'Advanced cap structures'],
    coverage: { years: 'variable', components: 'configurable', availability: 'configurable' }
  }
};

const WarrantyTemplateSelector = ({ basePath }) => {
  const templatePath = [...basePath, 'template', 'selectedTemplate'];

  const renderTemplateOption = (key, template) => (
    <Card 
      size="small" 
      style={{ marginBottom: 16, cursor: 'pointer' }}
      hoverable
    >
      <Row align="middle">
        <Col span={20}>
          <div>
            <Text strong>{template.label}</Text>
            <Paragraph style={{ margin: '4px 0', color: '#666' }}>
              {template.description}
            </Paragraph>
            <div style={{ marginTop: 8 }}>
              {template.features.map((feature, index) => (
                <Tag key={index} size="small" style={{ marginBottom: 4 }}>
                  <CheckCircleOutlined style={{ marginRight: 4 }} />
                  {feature}
                </Tag>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
              {template.coverage.years} years • {template.coverage.components} components • {template.coverage.availability} availability
            </div>
          </div>
        </Col>
        <Col span={4} style={{ textAlign: 'center' }}>
          <Radio value={key} />
        </Col>
      </Row>
    </Card>
  );

  return (
    <FormSection title="Warranty Template Selection">
      <ContextField
        path={templatePath}
        component={Radio.Group}
        componentProps={{
          style: { width: '100%' }
        }}
      >
        {Object.entries(warrantyTemplates).map(([key, template]) =>
          React.cloneElement(renderTemplateOption(key, template), { key })
        )}
      </ContextField>
      
      <FormSection title="Global Warranty Settings" style={{ marginTop: 24 }}>
        <FormRow>
          <FormCol>
            <ContextField
              path={[...basePath, 'globalSettings', 'warrantyProvider']}
              label="Warranty Provider"
              component={Radio.Group}
              componentProps={{
                options: [
                  { label: 'OEM', value: 'OEM' },
                  { label: 'Third Party', value: 'third-party' },
                  { label: 'Insurance', value: 'insurance' }
                ]
              }}
            />
          </FormCol>
          <FormCol>
            <ContextField
              path={[...basePath, 'globalSettings', 'overallWarrantyPeriod']}
              label="Overall Warranty Period"
              component={InputNumber}
              componentProps={{
                min: 1,
                max: 25,
                addonAfter: 'years'
              }}
            />
          </FormCol>
        </FormRow>
      </FormSection>
    </FormSection>
  );
};

export default WarrantyTemplateSelector;
```

### 3. ComponentWarrantyTabs (Level 2 - Intermediate)

**File**: `frontend/src/components/warranty/ComponentWarrantyTabs.jsx`

```javascript
import React from 'react';
import { Tabs, Switch, Alert } from 'antd';
import { 
  ToolOutlined, 
  ThunderboltOutlined, 
  GlobalOutlined, 
  SettingOutlined,
  ExchangeOutlined,
  RocketOutlined,
  ApiOutlined
} from '@ant-design/icons';
import ComponentWarrantyConfig from './ComponentWarrantyConfig';

const componentTypes = {
  gearbox: { 
    label: 'Gearbox', 
    icon: <ToolOutlined />,
    description: 'Gearbox warranty terms and coverage'
  },
  generator: { 
    label: 'Generator', 
    icon: <ThunderboltOutlined />,
    description: 'Generator warranty and performance guarantees'
  },
  blades: { 
    label: 'Blades', 
    icon: <GlobalOutlined />,
    description: 'Blade warranty including leading edge protection'
  },
  mainBearing: { 
    label: 'Main Bearing', 
    icon: <SettingOutlined />,
    description: 'Main bearing warranty and replacement terms'
  },
  transformer: { 
    label: 'Transformer', 
    icon: <ExchangeOutlined />,
    description: 'Transformer warranty and electrical coverage'
  },
  yawSystem: { 
    label: 'Yaw System', 
    icon: <RocketOutlined />,
    description: 'Yaw system warranty and control coverage'
  },
  converter: { 
    label: 'Converter', 
    icon: <ApiOutlined />,
    description: 'Power converter warranty and electronics coverage'
  }
};

const ComponentWarrantyTabs = ({ basePath }) => {
  const tabItems = Object.entries(componentTypes).map(([key, component]) => ({
    key,
    label: (
      <span>
        {component.icon} {component.label}
      </span>
    ),
    children: (
      <ComponentWarrantyConfig
        componentType={key}
        componentInfo={component}
        basePath={[...basePath, 'componentWarranties', key]}
      />
    )
  }));

  return (
    <div>
      <Alert
        message="Component-Specific Warranty Configuration"
        description="Configure warranty terms individually for each major component type. Each component can have different warranty periods, caps, and performance guarantees."
        type="info"
        style={{ marginBottom: 16 }}
      />
      
      <Tabs
        type="card"
        size="small"
        items={tabItems}
        tabPosition="top"
      />
    </div>
  );
};

export default ComponentWarrantyTabs;
```

### 4. ComponentWarrantyConfig (Component-specific configuration)

**File**: `frontend/src/components/warranty/ComponentWarrantyConfig.jsx`

```javascript
import React from 'react';
import { Switch, Divider, Button, Space, Typography } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import { ContextField } from '../contextFields/ContextField';
import { DistributionFieldV3 } from '../distributionFields/DistributionFieldV3';
import { EditableTable } from '../tables/EditableTable';
import { FormSection, FormRow, FormCol } from '../ui/FormComponents';
import WarrantyPeriodTimeline from './WarrantyPeriodTimeline';

const { Title, Text } = Typography;

const ComponentWarrantyConfig = ({ componentType, componentInfo, basePath }) => {
  // Warranty period table configuration
  const warrantyPeriodColumns = [
    {
      title: 'Start Year',
      dataIndex: 'startYear',
      key: 'startYear',
      width: 100,
      sorter: (a, b) => a.startYear - b.startYear
    },
    {
      title: 'End Year',
      dataIndex: 'endYear',
      key: 'endYear',
      width: 100
    },
    {
      title: 'Warranty Type',
      dataIndex: 'warrantyType',
      key: 'warrantyType',
      width: 150,
      render: (type) => {
        const typeMap = {
          comprehensive: 'Comprehensive',
          component: 'Component Only',
          performance: 'Performance Based'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: 'Event Cap',
      key: 'eventCap',
      render: (_, record) => {
        const cap = record.caps?.eventCap;
        if (!cap || cap.type === 'none') return 'No Cap';
        return cap.type === 'fixed' ? `$${cap.parameters?.value?.toLocaleString()}` : 'Variable';
      }
    }
  ];

  const warrantyPeriodFields = [
    {
      name: 'startYear',
      label: 'Start Year',
      rules: [{ required: true, message: 'Start year is required' }],
      render: (form) => (
        <ContextField
          path={null}
          component={InputNumber}
          componentProps={{
            min: 0,
            max: 30,
            placeholder: 'Start year'
          }}
          formMode={true}
          name="startYear"
        />
      )
    },
    {
      name: 'endYear',
      label: 'End Year',
      rules: [{ required: true, message: 'End year is required' }],
      render: (form) => (
        <ContextField
          path={null}
          component={InputNumber}
          componentProps={{
            min: 1,
            max: 30,
            placeholder: 'End year'
          }}
          formMode={true}
          name="endYear"
        />
      )
    },
    {
      name: 'warrantyType',
      label: 'Warranty Type',
      rules: [{ required: true, message: 'Warranty type is required' }],
      render: (form) => (
        <ContextField
          path={null}
          component={Select}
          componentProps={{
            options: [
              { value: 'comprehensive', label: 'Comprehensive' },
              { value: 'component', label: 'Component Only' },
              { value: 'performance', label: 'Performance Based' }
            ],
            placeholder: 'Select warranty type'
          }}
          formMode={true}
          name="warrantyType"
        />
      )
    }
  ];

  return (
    <div>
      {/* Component Enable/Disable */}
      <FormSection title={`${componentInfo.label} Warranty Configuration`}>
        <Text type="secondary">{componentInfo.description}</Text>
        
        <div style={{ marginTop: 16 }}>
          <ContextField
            path={[...basePath, 'enabled']}
            label={`Enable ${componentInfo.label} Warranty`}
            component={Switch}
            componentProps={{
              checkedChildren: 'Enabled',
              unCheckedChildren: 'Disabled'
            }}
          />
        </div>
      </FormSection>

      {/* Warranty Periods Configuration */}
      <FormSection title="Warranty Periods" style={{ marginTop: 24 }}>
        <Text type="secondary">
          Define time-based warranty periods with different terms and coverage levels.
        </Text>
        
        {/* Timeline Visualization */}
        <WarrantyPeriodTimeline basePath={[...basePath, 'warrantyPeriods']} />
        
        {/* Warranty Periods Table */}
        <EditableTable
          path={[...basePath, 'warrantyPeriods']}
          columns={warrantyPeriodColumns}
          formFields={warrantyPeriodFields}
          keyField="id"
          itemName="Warranty Period"
          addButtonText="Add Warranty Period"
          addButtonIcon={<PlusOutlined />}
        />
      </FormSection>

      {/* Financial Caps Configuration */}
      <FormSection title="Financial Caps" style={{ marginTop: 24 }}>
        <Text type="secondary">
          Configure financial limits and caps for warranty claims.
        </Text>
        
        <FormRow>
          <FormCol>
            <DistributionFieldV3
              path={[...basePath, 'warrantyPeriods', 0, 'caps', 'eventCap']}
              label="Event Cap"
              tooltip="Maximum warranty coverage per failure event"
              addonAfter="$/event"
              valueType="currency"
              showVisualization={true}
              options={[
                { value: 'fixed', label: 'Fixed Cap' },
                { value: 'lognormal', label: 'Uncertain Cap' },
                { value: 'triangular', label: 'Range Estimate' }
              ]}
            />
          </FormCol>
          <FormCol>
            <DistributionFieldV3
              path={[...basePath, 'warrantyPeriods', 0, 'caps', 'annualCap']}
              label="Annual Cap"
              tooltip="Maximum warranty coverage per year"
              addonAfter="$/year"
              valueType="currency"
              showVisualization={true}
              options={[
                { value: 'fixed', label: 'Fixed Cap' },
                { value: 'lognormal', label: 'Uncertain Cap' },
                { value: 'triangular', label: 'Range Estimate' }
              ]}
            />
          </FormCol>
        </FormRow>
      </FormSection>

      {/* Performance Guarantees */}
      <FormSection title="Performance Guarantees" style={{ marginTop: 24 }}>
        <FormRow>
          <FormCol>
            <ContextField
              path={[...basePath, 'warrantyPeriods', 0, 'performanceGuarantees', 'availabilityGuarantee', 'enabled']}
              label="Availability Guarantee"
              component={Switch}
            />
            
            <ContextField
              path={[...basePath, 'warrantyPeriods', 0, 'performanceGuarantees', 'availabilityGuarantee', 'guaranteedAvailability']}
              label="Guaranteed Availability"
              component={InputNumber}
              componentProps={{
                min: 0,
                max: 100,
                addonAfter: '%',
                step: 0.1
              }}
            />
          </FormCol>
          <FormCol>
            <ContextField
              path={[...basePath, 'warrantyPeriods', 0, 'performanceGuarantees', 'powerCurveGuarantee', 'enabled']}
              label="Power Curve Guarantee"
              component={Switch}
            />
            
            <ContextField
              path={[...basePath, 'warrantyPeriods', 0, 'performanceGuarantees', 'powerCurveGuarantee', 'guaranteedPerformance']}
              label="Guaranteed Performance"
              component={InputNumber}
              componentProps={{
                min: 0,
                max: 100,
                addonAfter: '%',
                step: 0.1
              }}
            />
          </FormCol>
        </FormRow>
      </FormSection>

      {/* Strategic Spares */}
      <FormSection title="Strategic Spares" style={{ marginTop: 24 }}>
        <ContextField
          path={[...basePath, 'strategicSpares', 'enabled']}
          label="Strategic Spares Program"
          component={Switch}
        />
        
        <ContextField
          path={[...basePath, 'strategicSpares', 'prePositioned']}
          label="Pre-positioned Spares"
          component={Switch}
        />
        
        <ContextField
          path={[...basePath, 'strategicSpares', 'logisticsImprovementFactor']}
          label="Logistics Improvement Factor"
          tooltip="Reduction in downtime due to strategic spares (0 = no improvement, 1 = perfect improvement)"
          component={InputNumber}
          componentProps={{
            min: 0,
            max: 1,
            step: 0.05,
            placeholder: '0.3'
          }}
        />
      </FormSection>
    </div>
  );
};

export default ComponentWarrantyConfig;
```

### 5. WarrantyImpactCard (Real-time Impact Visualization)

**File**: `frontend/src/components/warranty/WarrantyImpactCard.jsx`

```javascript
import React, { useMemo } from 'react';
import { Card, Statistic, Row, Col, Progress, Typography, Tag } from 'antd';
import { TrendingDownOutlined, TrendingUpOutlined, DollarOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { useCube } from '../../contexts/CubeContext';

const { Text, Title } = Typography;

const WarrantyImpactCard = ({ basePath }) => {
  const { getValueByPath } = useScenario();
  const { getData } = useCube();
  
  // Get warranty configuration
  const warrantyConfig = getValueByPath(basePath, {});
  
  // Calculate warranty impact metrics
  const impactMetrics = useMemo(() => {
    // This would integrate with the actual Monte Carlo simulation
    // For now, providing example calculations
    
    const baselineCost = 1000000; // Base O&M costs without warranty
    const warrantyBenefit = calculateWarrantyBenefit(warrantyConfig);
    const warrantyCost = calculateWarrantyCost(warrantyConfig);
    
    return {
      costReduction: warrantyBenefit,
      warrantyCost: warrantyCost,
      netBenefit: warrantyBenefit - warrantyCost,
      riskReduction: calculateRiskReduction(warrantyConfig),
      availabilityImprovement: calculateAvailabilityImprovement(warrantyConfig)
    };
  }, [warrantyConfig]);

  const calculateWarrantyBenefit = (config) => {
    // Simplified calculation - would integrate with actual cost models
    let benefit = 0;
    
    if (config.template?.selectedTemplate === 'comprehensive') {
      benefit += 200000; // Comprehensive warranty benefit
    } else if (config.template?.selectedTemplate === 'performance') {
      benefit += 150000; // Performance warranty benefit
    } else {
      benefit += 50000; // Basic warranty benefit
    }
    
    // Add component-specific benefits
    Object.values(config.componentWarranties || {}).forEach(component => {
      if (component.enabled) {
        benefit += 30000; // Per-component benefit
      }
    });
    
    return benefit;
  };

  const calculateWarrantyCost = (config) => {
    // Simplified calculation - would integrate with actual pricing models
    let cost = 0;
    
    if (config.template?.selectedTemplate === 'comprehensive') {
      cost += 80000; // Comprehensive warranty cost
    } else if (config.template?.selectedTemplate === 'performance') {
      cost += 60000; // Performance warranty cost
    } else {
      cost += 20000; // Basic warranty cost
    }
    
    return cost;
  };

  const calculateRiskReduction = (config) => {
    // Simplified risk reduction calculation
    let reduction = 0;
    
    if (config.template?.selectedTemplate === 'comprehensive') {
      reduction = 75;
    } else if (config.template?.selectedTemplate === 'performance') {
      reduction = 60;
    } else {
      reduction = 30;
    }
    
    return reduction;
  };

  const calculateAvailabilityImprovement = (config) => {
    // Simplified availability improvement calculation
    let improvement = 0;
    
    Object.values(config.componentWarranties || {}).forEach(component => {
      if (component.enabled && component.strategicSpares?.enabled) {
        improvement += 0.5; // 0.5% improvement per component with strategic spares
      }
    });
    
    return improvement;
  };

  return (
    <Card title="Warranty Impact Analysis" size="small">
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Real-time impact of warranty configuration on project costs and risks
        </Text>
      </div>

      {/* Financial Impact */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="Net Warranty Benefit"
            value={impactMetrics.netBenefit}
            precision={0}
            valueStyle={{ 
              color: impactMetrics.netBenefit > 0 ? '#3f8600' : '#cf1322' 
            }}
            prefix={impactMetrics.netBenefit > 0 ? <TrendingDownOutlined /> : <TrendingUpOutlined />}
            suffix="USD"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Statistic
            title="Cost Reduction"
            value={impactMetrics.costReduction}
            precision={0}
            valueStyle={{ color: '#3f8600' }}
            prefix={<DollarOutlined />}
            suffix="USD"
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Warranty Cost"
            value={impactMetrics.warrantyCost}
            precision={0}
            valueStyle={{ color: '#cf1322' }}
            prefix={<DollarOutlined />}
            suffix="USD"
          />
        </Col>
      </Row>

      {/* Risk Reduction */}
      <div style={{ marginTop: 24 }}>
        <Text strong>Risk Reduction</Text>
        <Progress
          percent={impactMetrics.riskReduction}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          format={(percent) => `${percent}%`}
        />
      </div>

      {/* Availability Improvement */}
      <div style={{ marginTop: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text strong>Availability Improvement</Text>
          </Col>
          <Col>
            <Tag color="green">+{impactMetrics.availabilityImprovement.toFixed(1)}%</Tag>
          </Col>
        </Row>
      </div>

      {/* Configuration Summary */}
      <div style={{ marginTop: 24, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
        <Text strong style={{ fontSize: 12 }}>Current Configuration:</Text>
        <div style={{ marginTop: 8 }}>
          <Tag size="small" color="blue">
            {warrantyConfig.template?.selectedTemplate || 'Not Selected'}
          </Tag>
          {Object.entries(warrantyConfig.componentWarranties || {}).map(([key, component]) => 
            component.enabled && (
              <Tag key={key} size="small" color="green">
                {key}
              </Tag>
            )
          )}
        </div>
      </div>
    </Card>
  );
};

export default WarrantyImpactCard;
```

## Integration Points

### 1. Cost Model Integration

- Connect warranty terms to existing failure rate models
- Modify cost calculations based on warranty coverage
- Integrate with Monte Carlo simulation for uncertainty analysis

### 2. Performance Impact Modeling

- Link availability guarantees to downtime calculations
- Connect strategic spares to logistics improvement factors
- Integrate response time guarantees with repair time distributions

### 3. User Experience Enhancements

- Progressive disclosure with clear mode switching
- Real-time feedback on configuration changes
- Integration with existing help and documentation systems
- Responsive design for mobile and desktop use

## Implementation Priority

1. **Phase 1**: Data structure, basic template selector, and impact visualization
2. **Phase 2**: Component-specific configuration and time-varying terms
3. **Phase 3**: Advanced features, strategic spares, and complex cap structures
4. **Phase 4**: Monte Carlo integration and advanced analytics

This architecture provides a comprehensive, scalable solution for warranty configuration while maintaining consistency with existing UI patterns and technical architecture.