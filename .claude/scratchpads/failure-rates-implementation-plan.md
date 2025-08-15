# Component Failure Rates UI - Implementation Plan

## Overview

This document provides a detailed implementation plan for the space-efficient component failure rates configuration UI, based on the design analysis in `failure-rates-ui-design.md`.

## Implementation Strategy

### Phase 1: Schema Enhancement (Minimal Changes)

**File**: `schemas/yup/scenario.js`

Extend the existing `FailureModelSchema` to support distributions:

```javascript
// Enhanced FailureModelSchema with distribution support
const FailureModelSchema = Yup.object().shape({
    designLife: Yup.number().default(20),
    componentCount: Yup.number().default(100),
    assumedFailureRate: Yup.number().default(0.01), // Keep for backward compatibility
    
    // NEW: Distribution support for failure rates
    failureRateDistribution: DistributionTypeSchema.nullable().default(null),
    
    majorComponent: MajorComponentSchema.required('Major component is required'),
    historicalData: Yup.object().shape({
        type: Yup.string().oneOf(['separate', 'analysis', 'none']).default('none'),
        data: Yup.array().of(Yup.object().shape({
            year: Yup.number().required('Year is required'),
            failureRate: Yup.number().required('Failure rate is required'),
        })).default([]),
    }),
});
```

**Logic**:
- If `failureRateDistribution` exists, use it for calculations and display
- If null, fall back to `assumedFailureRate` as a fixed value
- This maintains full backward compatibility

### Phase 2: Utility Functions

**File**: `frontend/src/utils/componentFailureUtils.js`

Create comprehensive utilities for data management:

```javascript
// Component definitions (from seedMajorComponents.js)
export const MAJOR_COMPONENTS = [
    {
        name: 'Gearbox',
        description: 'Mechanical gearboxes that increase rotational speed',
        appliesTo: { geared: true, directDrive: false },
        quantityPerWTG: 1,
        defaultFailureRate: 3.0,
        category: 'drivetrain'
    },
    {
        name: 'Generator', 
        description: 'Electric generators that produce power',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 1,
        defaultFailureRate: 2.5,
        category: 'drivetrain'
    },
    {
        name: 'Main Bearing',
        description: 'Main shaft bearings',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 1,
        defaultFailureRate: 1.8,
        category: 'drivetrain'
    },
    {
        name: 'Power Electronics',
        description: 'Power electronics for converting variable AC to grid power',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 1,
        defaultFailureRate: 2.0,
        category: 'electrical'
    },
    {
        name: 'Blade Bearings',
        description: 'Bearings that attach blades to hub and allow pitch control',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 3,
        defaultFailureRate: 1.5,
        category: 'rotor'
    },
    {
        name: 'Yaw System',
        description: 'Systems that rotate nacelle to face the wind',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 1,
        defaultFailureRate: 1.2,
        category: 'structural'
    },
    {
        name: 'Control System',
        description: 'Control and monitoring systems',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 1,
        defaultFailureRate: 0.8,
        category: 'electrical'
    },
    {
        name: 'Transformer',
        description: 'Power transformers for grid connection',
        appliesTo: { geared: true, directDrive: true },
        quantityPerWTG: 1,
        defaultFailureRate: 1.0,
        category: 'electrical'
    }
];

// Get components applicable to platform type
export const getComponentsForPlatform = (platformType) => {
    return MAJOR_COMPONENTS.filter(component => 
        component.appliesTo[platformType] === true
    );
};

// Check if component is enabled in failure models
export const isComponentEnabled = (componentName, failureModels) => {
    return failureModels.some(model => 
        model.majorComponent.name === componentName
    );
};

// Get failure model for component
export const getFailureModelForComponent = (componentName, failureModels) => {
    return failureModels.find(model => 
        model.majorComponent.name === componentName
    );
};

// Create default failure model for component
export const createDefaultFailureModel = (componentName, platformType, numWTGs) => {
    const component = MAJOR_COMPONENTS.find(c => c.name === componentName);
    if (!component) return null;
    
    return {
        designLife: 20,
        componentCount: component.quantityPerWTG * numWTGs,
        assumedFailureRate: component.defaultFailureRate / 100, // Convert % to decimal
        failureRateDistribution: null, // Start with fixed value
        majorComponent: {
            name: component.name,
            description: component.description,
            appliesTo: component.appliesTo,
            quantityPerWTG: component.quantityPerWTG,
            defaultFailureRate: component.defaultFailureRate
        },
        historicalData: {
            type: 'none',
            data: []
        }
    };
};

// Get display value for failure rate
export const getFailureRateDisplay = (failureModel) => {
    if (!failureModel) return 'Not Set';
    
    // If distribution exists, show range
    if (failureModel.failureRateDistribution) {
        const dist = failureModel.failureRateDistribution;
        if (dist.type === 'fixed') {
            return `${(dist.parameters.value * 100).toFixed(1)}%`;
        }
        // For distributions, calculate P10-P90 range
        const range = calculateDistributionRange(dist);
        return `${(range.p10 * 100).toFixed(1)}% - ${(range.p90 * 100).toFixed(1)}%`;
    }
    
    // Fall back to assumed failure rate
    return `${(failureModel.assumedFailureRate * 100).toFixed(1)}%`;
};

// Calculate expected annual failures
export const calculateExpectedFailures = (failureModels) => {
    return failureModels.reduce((total, model) => {
        const rate = model.failureRateDistribution?.parameters?.value || model.assumedFailureRate;
        return total + (rate * model.componentCount);
    }, 0);
};

// Enable component
export const enableComponent = (componentName, failureModels, platformType, numWTGs) => {
    if (isComponentEnabled(componentName, failureModels)) {
        return failureModels; // Already enabled
    }
    
    const newModel = createDefaultFailureModel(componentName, platformType, numWTGs);
    return [...failureModels, newModel];
};

// Disable component
export const disableComponent = (componentName, failureModels) => {
    return failureModels.filter(model => 
        model.majorComponent.name !== componentName
    );
};
```

### Phase 3: ComponentListTable (Master View)

**File**: `frontend/src/components/tables/ComponentListTable.jsx`

```javascript
import React, { useMemo } from 'react';
import { Table, Switch, Button, Tag, Tooltip } from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import { 
    getComponentsForPlatform, 
    isComponentEnabled, 
    getFailureRateDisplay,
    getFailureModelForComponent 
} from '../../utils/componentFailureUtils';

const ComponentListTable = ({
    onEdit,
    onToggleEnabled,
    selectedComponent,
    platformType,
    failureModels
}) => {
    const components = useMemo(() => 
        getComponentsForPlatform(platformType), [platformType]
    );
    
    const tableData = useMemo(() => {
        return components.map(component => {
            const enabled = isComponentEnabled(component.name, failureModels);
            const failureModel = getFailureModelForComponent(component.name, failureModels);
            const displayRate = enabled ? getFailureRateDisplay(failureModel) : 'Disabled';
            
            return {
                key: component.name,
                name: component.name,
                description: component.description,
                category: component.category,
                quantityPerWTG: component.quantityPerWTG,
                enabled,
                failureRate: displayRate,
                hasDistribution: failureModel?.failureRateDistribution !== null,
                component
            };
        });
    }, [components, failureModels]);
    
    const columns = [
        {
            title: 'Component',
            dataIndex: 'name',
            key: 'name',
            width: 140,
            render: (text, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{text}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.quantityPerWTG} per WTG
                    </div>
                </div>
            ),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 90,
            render: (category) => (
                <Tag color={getCategoryColor(category)}>
                    {category}
                </Tag>
            ),
        },
        {
            title: 'Enabled',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 70,
            align: 'center',
            render: (enabled, record) => (
                <Switch
                    checked={enabled}
                    size="small"
                    onChange={(checked) => onToggleEnabled(record.name, checked)}
                />
            ),
        },
        {
            title: 'Failure Rate',
            dataIndex: 'failureRate', 
            key: 'failureRate',
            width: 110,
            render: (rate, record) => (
                <div style={{ 
                    color: record.enabled ? '#000' : '#999',
                    fontWeight: record.hasDistribution ? 500 : 400 
                }}>
                    {record.hasDistribution && <SettingOutlined style={{ marginRight: 4, fontSize: '10px' }} />}
                    {rate}
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EditOutlined />}
                    size="small"
                    onClick={() => onEdit(record.name)}
                    disabled={!record.enabled}
                >
                    Edit
                </Button>
            ),
        },
    ];
    
    return (
        <Table
            dataSource={tableData}
            columns={columns}
            pagination={false}
            size="small"
            rowClassName={(record) => 
                record.key === selectedComponent ? 'selected-component' : ''
            }
            style={{ minHeight: '400px' }}
        />
    );
};

const getCategoryColor = (category) => {
    const colors = {
        'drivetrain': 'blue',
        'electrical': 'green', 
        'rotor': 'orange',
        'structural': 'purple'
    };
    return colors[category] || 'default';
};

export default ComponentListTable;
```

### Phase 4: ComponentEditPanel (Detail View)

**File**: `frontend/src/components/panels/ComponentEditPanel.jsx`

```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Button, Space, Alert, Divider, Typography } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { ContextField } from '../contextFields';
import { DistributionFieldV3 } from '../distributionFields';
import { InlineEditTable } from '../tables';
import { getFailureModelForComponent } from '../../utils/componentFailureUtils';

const { Title, Text } = Typography;

const ComponentEditPanel = ({
    componentName,
    failureModels,
    onSave,
    onCancel,
    platformType,
    numWTGs
}) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const failureModel = useMemo(() => 
        getFailureModelForComponent(componentName, failureModels), 
        [componentName, failureModels]
    );
    
    const modelIndex = useMemo(() => 
        failureModels.findIndex(model => model.majorComponent.name === componentName),
        [componentName, failureModels]
    );
    
    if (!componentName || !failureModel) {
        return (
            <Card title="Component Configuration" style={{ height: '500px' }}>
                <Alert
                    message="No Component Selected"
                    description="Select a component from the list to configure its failure rate parameters."
                    type="info"
                />
            </Card>
        );
    }
    
    const basePath = `settings.modules.cost.failureModels[${modelIndex}]`;
    
    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await onSave();
            setHasUnsavedChanges(false);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCancel = () => {
        if (hasUnsavedChanges) {
            // Show confirmation dialog
            Modal.confirm({
                title: 'Unsaved Changes',
                content: 'You have unsaved changes. Are you sure you want to cancel?',
                onOk: () => {
                    setHasUnsavedChanges(false);
                    onCancel();
                }
            });
        } else {
            onCancel();
        }
    };
    
    return (
        <Card 
            title={
                <Space>
                    <Title level={5} style={{ margin: 0 }}>
                        Configure: {componentName}
                    </Title>
                    {hasUnsavedChanges && (
                        <Text type="warning" style={{ fontSize: '12px' }}>
                            (unsaved changes)
                        </Text>
                    )}
                </Space>
            }
            extra={
                <Space>
                    <Button
                        icon={<SaveOutlined />}
                        type="primary"
                        onClick={handleSave}
                        loading={isSubmitting}
                        disabled={!hasUnsavedChanges}
                    >
                        Save
                    </Button>
                    <Button
                        icon={<CloseOutlined />}
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                </Space>
            }
            style={{ height: '500px', overflow: 'auto' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                
                {/* Basic Configuration */}
                <div>
                    <Title level={5}>Basic Configuration</Title>
                    
                    <ContextField
                        path={`${basePath}.designLife`}
                        fieldType="number"
                        label="Design Life (years)"
                        tooltip="Expected operational lifetime of the component"
                        inputProps={{ min: 1, max: 50 }}
                        onChange={() => setHasUnsavedChanges(true)}
                    />
                    
                    <ContextField
                        path={`${basePath}.componentCount`}
                        fieldType="number"
                        label="Total Component Count"
                        tooltip={`Number of ${componentName.toLowerCase()} components in the wind farm`}
                        inputProps={{ min: 1, disabled: true }}
                        helpText={`Calculated: ${failureModel.majorComponent.quantityPerWTG} per WTG × ${numWTGs} WTGs`}
                    />
                </div>
                
                <Divider />
                
                {/* Failure Rate Configuration */}
                <div>
                    <Title level={5}>Failure Rate Model</Title>
                    
                    <DistributionFieldV3
                        path={`${basePath}.failureRateDistribution`}
                        label="Failure Rate Configuration"
                        helpText="Configure failure rate as fixed value or probability distribution"
                        distributionTypes={['fixed', 'normal', 'weibull', 'exponential']}
                        defaultType="fixed"
                        onChange={() => setHasUnsavedChanges(true)}
                        validationRules={{
                            min: 0,
                            max: 1,
                            message: 'Failure rate must be between 0% and 100%'
                        }}
                    />
                    
                    {/* Fallback fixed value when distribution is null */}
                    <ContextField
                        path={`${basePath}.assumedFailureRate`}
                        fieldType="number"
                        label="Fixed Failure Rate (%)"
                        tooltip="Fixed failure rate as decimal (used when no distribution is configured)"
                        inputProps={{ 
                            min: 0, 
                            max: 1, 
                            step: 0.001,
                            formatter: value => `${(value * 100).toFixed(1)}%`,
                            parser: value => value.replace('%', '') / 100
                        }}
                        onChange={() => setHasUnsavedChanges(true)}
                        style={{ 
                            display: failureModel.failureRateDistribution ? 'none' : 'block' 
                        }}
                    />
                </div>
                
                <Divider />
                
                {/* Historical Data (Optional) */}
                <div>
                    <Title level={5}>Historical Data (Optional)</Title>
                    
                    <ContextField
                        path={`${basePath}.historicalData.type`}
                        fieldType="select"
                        label="Historical Data Type"
                        options={[
                            { value: 'none', label: 'No Historical Data' },
                            { value: 'separate', label: 'Separate Analysis' },
                            { value: 'analysis', label: 'Integrated Analysis' }
                        ]}
                        onChange={() => setHasUnsavedChanges(true)}
                    />
                    
                    {failureModel.historicalData?.type !== 'none' && (
                        <InlineEditTable
                            path={[...basePath.split('.'), 'historicalData', 'data']}
                            dataFieldOptions={[
                                { 
                                    value: 'failureRate', 
                                    label: 'Failure Rate (%)', 
                                    type: 'number',
                                    validation: { min: 0, max: 1 }
                                }
                            ]}
                            yearRange={{ min: 1, max: 25 }}
                            orientation="horizontal"
                            showDataFieldSelector={false}
                            onAfterSave={() => setHasUnsavedChanges(false)}
                            theme="compact"
                        />
                    )}
                </div>
                
            </Space>
        </Card>
    );
};

export default ComponentEditPanel;
```

### Phase 5: Main Container Component

**File**: Replace `frontend/src/pages/scenario/equipment/FailureRates.jsx`

```javascript
import React, { useState, useMemo } from 'react';
import { Row, Col, Typography, Card, Statistic, Space, Alert } from 'antd';
import { useScenario } from '../../../contexts/ScenarioContext';
import ComponentListTable from '../../../components/tables/ComponentListTable';
import ComponentEditPanel from '../../../components/panels/ComponentEditPanel';
import {
    getComponentsForPlatform,
    enableComponent,
    disableComponent,
    calculateExpectedFailures
} from '../../../utils/componentFailureUtils';

const { Title } = Typography;

const ComponentFailureRatesConfig = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    
    const { getValueByPath, updateByPath } = useScenario();
    
    // Get data from context
    const failureModels = getValueByPath(['settings', 'modules', 'cost', 'failureModels'], []);
    const platformType = getValueByPath(['settings', 'project', 'windFarm', 'wtgPlatformType'], 'geared');
    const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20);
    
    // Calculate summary metrics
    const summaryMetrics = useMemo(() => {
        const applicableComponents = getComponentsForPlatform(platformType);
        const enabledCount = failureModels.length;
        const totalCount = applicableComponents.length;
        const coveragePercent = totalCount > 0 ? (enabledCount / totalCount * 100) : 0;
        const expectedFailures = calculateExpectedFailures(failureModels);
        
        return {
            enabledCount,
            totalCount,
            coveragePercent,
            expectedFailures
        };
    }, [failureModels, platformType]);
    
    // Handle component enable/disable
    const handleToggleEnabled = async (componentName, enabled) => {
        let updatedModels;
        
        if (enabled) {
            updatedModels = enableComponent(componentName, failureModels, platformType, numWTGs);
        } else {
            updatedModels = disableComponent(componentName, failureModels);
            
            // Clear selection if disabled component was selected
            if (selectedComponent === componentName) {
                setSelectedComponent(null);
            }
        }
        
        await updateByPath(['settings', 'modules', 'cost', 'failureModels'], updatedModels);
    };
    
    // Handle component editing
    const handleEdit = (componentName) => {
        setSelectedComponent(componentName);
    };
    
    const handleSave = async () => {
        // Save is handled by individual ContextFields and DistributionFieldV3
        // This is called after successful saves to update UI state
        setSelectedComponent(null);
    };
    
    const handleCancel = () => {
        setSelectedComponent(null);
    };
    
    return (
        <div style={{ padding: '0 0 24px 0' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                
                {/* Header */}
                <div>
                    <Title level={2}>Equipment Failure Rates</Title>
                    <p>Configure failure rate models and reliability parameters for wind turbine components.</p>
                </div>
                
                {/* Summary Metrics */}
                <Card>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Components Enabled"
                                value={summaryMetrics.enabledCount}
                                suffix={`/ ${summaryMetrics.totalCount}`}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Coverage"
                                value={summaryMetrics.coveragePercent}
                                suffix="%"
                                precision={0}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Expected Annual Failures"
                                value={summaryMetrics.expectedFailures}
                                precision={2}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Platform Type"
                                value={platformType}
                                valueStyle={{ textTransform: 'capitalize' }}
                            />
                        </Col>
                    </Row>
                </Card>
                
                {/* Main Configuration Interface */}
                <Row gutter={16} style={{ minHeight: '500px' }}>
                    
                    {/* Master View - Component List */}
                    <Col span={14}>
                        <Card title="Component Configuration" style={{ height: '100%' }}>
                            <ComponentListTable
                                onEdit={handleEdit}
                                onToggleEnabled={handleToggleEnabled}
                                selectedComponent={selectedComponent}
                                platformType={platformType}
                                failureModels={failureModels}
                            />
                        </Card>
                    </Col>
                    
                    {/* Detail View - Component Editor */}
                    <Col span={10}>
                        <ComponentEditPanel
                            componentName={selectedComponent}
                            failureModels={failureModels}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            platformType={platformType}
                            numWTGs={numWTGs}
                        />
                    </Col>
                    
                </Row>
                
                {/* Help Information */}
                <Alert
                    message="Configuration Guide"
                    description={
                        <div>
                            <p><strong>Enable/Disable:</strong> Toggle components on/off based on your analysis requirements.</p>
                            <p><strong>Failure Rates:</strong> Configure as fixed percentages or probability distributions.</p>
                            <p><strong>Historical Data:</strong> Optionally provide time-series data for more sophisticated modeling.</p>
                            <p><strong>Platform Filtering:</strong> Gearbox components only apply to geared platforms.</p>
                        </div>
                    }
                    type="info"
                    showIcon
                />
                
            </Space>
        </div>
    );
};

export default ComponentFailureRatesConfig;
```

## Implementation Notes

### 1. Schema Migration
- The enhanced schema is backward compatible
- Existing `assumedFailureRate` values remain valid
- New `failureRateDistribution` field starts as null

### 2. Data Flow
- All state changes go through ScenarioContext
- Enable/disable operations update the failureModels array
- Individual field changes use ContextField paths
- Distributions use DistributionFieldV3 with proper validation

### 3. Responsive Design
- Desktop: 60/40 split (master/detail)
- Tablet: Could stack vertically or use modal overlay
- Mobile: Component list + modal editor

### 4. Performance Optimizations
- Memoized calculations for display values
- Component filtering based on platform type
- Lazy rendering of edit panel content
- Minimal re-renders with proper dependencies

### 5. User Experience
- Immediate feedback on enable/disable
- Clear visual indicators for unsaved changes
- Comprehensive validation with helpful error messages
- Keyboard navigation and accessibility support

This implementation provides a comprehensive, space-efficient solution for configuring component failure rates while maintaining consistency with existing application patterns and architectural principles.