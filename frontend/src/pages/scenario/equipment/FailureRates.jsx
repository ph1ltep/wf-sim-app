/**
 * Component Failure Rates Configuration Page
 * Refactored to use EditableTable with dynamic array structure
 */

import React, { useState, useMemo } from 'react';
import { Card, Typography, Space, Switch, Button, Tag, message, Form, Input, Select } from 'antd';
import { SettingOutlined, ThunderboltOutlined, ToolOutlined, ControlOutlined, 
         SyncOutlined, ReloadOutlined, DashboardOutlined, ApiOutlined } from '@ant-design/icons';

import { useScenario } from 'contexts/ScenarioContext';
import EditableTable from 'components/tables/EditableTable';
import { ContextField } from 'components/contextFields/ContextField';
import { DistributionFieldV3 } from 'components/distributionFields';
import { createActionsColumn, createTagColumn, createBooleanColumn } from 'components/tables/columns';
import ComponentFailureModal from './ComponentFailureModal';
import FailureRateSummaryCard from 'components/cards/FailureRateSummaryCard';

const { Title, Text } = Typography;

// Component icons mapping for display
const COMPONENT_ICONS = {
    setting: <SettingOutlined />,
    thunderbolt: <ThunderboltOutlined />,
    tool: <ToolOutlined />,
    control: <ControlOutlined />,
    sync: <SyncOutlined />,
    reload: <ReloadOutlined />,
    dashboard: <DashboardOutlined />,
    api: <ApiOutlined />
};

// Component categories for organization
const CATEGORY_OPTIONS = [
    { value: 'drivetrain', label: 'Drivetrain' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'rotor', label: 'Rotor' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'control', label: 'Control' }
];

// Category color mapping for tags
const CATEGORY_COLORS = {
    drivetrain: 'blue',
    electrical: 'orange',
    rotor: 'green',
    mechanical: 'purple',
    control: 'cyan'
};

// Default component configurations for initialization
const DEFAULT_COMPONENTS = [
    {
        id: 'gearbox',
        name: 'Gearbox',
        category: 'drivetrain',
        icon: 'setting',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.025, value: 0.025 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'generator',
        name: 'Generator',
        category: 'electrical',
        icon: 'thunderbolt',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.020, value: 0.020 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'mainBearing',
        name: 'Main Bearing',
        category: 'drivetrain',
        icon: 'tool',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.018, value: 0.018 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'powerElectronics',
        name: 'Power Electronics',
        category: 'electrical',
        icon: 'control',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.022, value: 0.022 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'bladeBearings',
        name: 'Blade Bearings',
        category: 'rotor',
        icon: 'sync',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.015, value: 0.015 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'yawSystem',
        name: 'Yaw System',
        category: 'mechanical',
        icon: 'reload',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.012, value: 0.012 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'controlSystem',
        name: 'Control System',
        category: 'control',
        icon: 'dashboard',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.008, value: 0.008 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    },
    {
        id: 'transformer',
        name: 'Transformer',
        category: 'electrical',
        icon: 'api',
        enabled: false,
        failureRate: {
            type: 'exponential',
            parameters: { lambda: 0.010, value: 0.010 },
            timeSeriesMode: false,
            metadata: { percentileDirection: 'ascending' }
        }
    }
];

const FailureRates = () => {
    const { getValueByPath, updateByPath } = useScenario();
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [selectedComponentIndex, setSelectedComponentIndex] = useState(null);
    
    // Get failure rates configuration from scenario context
    const failureRatesConfig = getValueByPath('settings.project.equipment.failureRates', {
        enabled: false,
        components: []
    });

    // Get components array from the dynamic structure
    const componentsArray = failureRatesConfig.components || [];

    // Handle opening detailed configuration modal
    const handleDetailedConfig = (component, index) => {
        setSelectedComponent(component);
        setSelectedComponentIndex(index);
        setDetailModalVisible(true);
    };

    // Initialize defaults if no data exists
    const handleInitializeDefaults = async () => {
        try {
            const currentComponents = getValueByPath('settings.project.equipment.failureRates.components', []);
            if (currentComponents.length === 0) {
                await updateByPath('settings.project.equipment.failureRates.components', DEFAULT_COMPONENTS);
                message.success('Default components initialized successfully');
            } else {
                message.info('Components already exist. Clear existing data first to reinitialize.');
            }
        } catch (error) {
            message.error(`Failed to initialize defaults: ${error.message}`);
        }
    };

    // Handle modal close
    const handleDetailModalClose = () => {
        setDetailModalVisible(false);
        setSelectedComponent(null);
        setSelectedComponentIndex(null);
    };

    // Handle global enable/disable
    const handleGlobalToggle = async (enabled) => {
        try {
            await updateByPath('settings.project.equipment.failureRates.enabled', enabled);
            message.success(`Component failure modeling ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            message.error(`Failed to update global setting: ${error.message}`);
        }
    };

    // Format failure rate for display
    const formatFailureRate = (failureRate) => {
        if (!failureRate || !failureRate.parameters) return 'Not configured';
        const rate = failureRate.parameters.lambda || failureRate.parameters.value || 0;
        return `${(rate * 100).toFixed(2)}% annual`;
    };

    // Get status badge
    const getStatusBadge = (enabled) => {
        return enabled ? <Tag color="green">Active</Tag> : <Tag color="default">Disabled</Tag>;
    };

    // EditableTable columns configuration using reusable column helpers
    const columns = [
        {
            title: 'Component',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            render: (name, record) => (
                <Space>
                    {COMPONENT_ICONS[record.icon] || <ToolOutlined />}
                    <div>
                        <div style={{ fontWeight: 500 }}>{name}</div>
                        <Tag color={CATEGORY_COLORS[record.category]} size="small">
                            {record.category?.charAt(0).toUpperCase() + record.category?.slice(1)}
                        </Tag>
                    </div>
                </Space>
            )
        },
        createBooleanColumn('enabled', 'Enabled', {
            width: '15%',
            trueText: 'Yes',
            falseText: 'No',
            trueColor: 'success',
            falseColor: 'default'
        }),
        {
            title: 'Failure Rate',
            dataIndex: 'failureRate',
            key: 'failureRate',
            width: '25%',
            render: (failureRate) => (
                <Text style={{ fontFamily: 'monospace' }}>
                    {formatFailureRate(failureRate)}
                </Text>
            )
        },
        {
            title: 'Details',
            key: 'details',
            width: 100,
            align: 'center',
            render: (_, record, index) => (
                <Button
                    type="text"
                    onClick={() => handleDetailedConfig(record, index)}
                    size="small"
                >
                    Configure
                </Button>
            )
        }
    ];

    // Form fields for EditableTable modal
    const formFields = (
        <>
            <ContextField
                path="name"
                component={Input}
                label="Component Name"
                required
                rules={[{ required: true, message: 'Component name is required' }]}
            />
            
            <Form.Item 
                name="category" 
                label="Category" 
                rules={[{ required: true, message: 'Please select a category' }]}
            >
                <Select 
                    placeholder="Select component category"
                    options={CATEGORY_OPTIONS}
                />
            </Form.Item>
            
            <ContextField
                path="icon"
                component={Input}
                label="Icon"
                required
                rules={[{ required: true, message: 'Icon is required' }]}
            />
            
            <Form.Item label="Enabled" name="enabled" valuePropName="checked">
                <Switch />
            </Form.Item>
            
        </>
    );

    const enabledCount = componentsArray.filter(c => c.enabled).length;

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Component Failure Rates</Title>
                <Text type="secondary">
                    Configure failure rates and cost modeling for major wind turbine components
                </Text>
            </div>

            {/* Global Configuration Card */}
            <Card 
                title="Global Configuration" 
                style={{ marginBottom: '24px' }}
                extra={
                    <Space>
                        {componentsArray.length === 0 && (
                            <Button 
                                type="dashed" 
                                onClick={handleInitializeDefaults}
                                size="small"
                            >
                                Initialize Defaults
                            </Button>
                        )}
                        <Switch
                            checked={failureRatesConfig.enabled || false}
                            onChange={handleGlobalToggle}
                            checkedChildren="Enabled"
                            unCheckedChildren="Disabled"
                        />
                    </Space>
                }
            >
                <Space direction="vertical" size="small">
                    <div>
                        <Text>Component failure modeling: </Text>
                        <Text strong>
                            {failureRatesConfig.enabled ? 'Enabled' : 'Disabled'}
                        </Text>
                    </div>
                    <div>
                        <Text>Active components: </Text>
                        <Text strong>{enabledCount} of {componentsArray.length}</Text>
                    </div>
                    {failureRatesConfig.enabled && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Component failures will be included in Monte Carlo simulations and cost calculations
                        </Text>
                    )}
                </Space>
            </Card>

            {/* Components EditableTable */}
            <Card title="Component Configuration" style={{ marginBottom: '24px' }}>
                <EditableTable
                    path="settings.project.equipment.failureRates.components"
                    columns={columns}
                    formFields={formFields}
                    itemName="Component"
                    addButtonText="Add Component"
                    keyField="id"
                    tableSize="small"
                    autoActions={true}
                    formLayout="vertical"
                    formCompact={false}
                />
            </Card>

            {/* Summary Card */}
            <FailureRateSummaryCard />

            {/* Detail Configuration Modal */}
            {selectedComponent && selectedComponentIndex !== null && (
                <ComponentFailureModal
                    visible={detailModalVisible}
                    component={selectedComponent}
                    componentIndex={selectedComponentIndex}
                    onClose={handleDetailModalClose}
                />
            )}
        </div>
    );
};

export default FailureRates;