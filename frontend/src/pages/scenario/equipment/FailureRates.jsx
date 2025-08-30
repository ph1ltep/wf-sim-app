/**
 * Component Failure Rates Configuration Page
 * Refactored to use EditableTable with dynamic array structure
 */

import React, { useState } from 'react';
import { Card, Typography, Space, Switch, Button, Tag, message, Form, Input, Select, Tooltip } from 'antd';
import { 
    CheckOutlined, 
    CloseOutlined,
    DollarOutlined,
    BankOutlined,
    ToolOutlined,
    ClockCircleOutlined,
    UserOutlined,
    ExclamationCircleOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';

import { useScenario } from 'contexts/ScenarioContext';
import EditableTable from 'components/tables/EditableTable';
import { ContextField, SwitchField } from 'components/contextFields';
import { createActionsColumn } from 'components/tables/columns';
import ComponentFailureModal from './ComponentFailureModal';
import FailureRateSummaryCard from 'components/cards/FailureRateSummaryCard';
import { DEFAULT_COMPONENTS } from 'schemas/yup/componentFailureRates';
import { getMarketFactorColorScheme } from 'utils/charts/colors';

const { Title, Text } = Typography;

// Cost component icons mapping with centralized color scheme
const COST_ICONS = {
    componentReplacement: <DollarOutlined style={{ color: getMarketFactorColorScheme('material') }} />,
    craneMobilization: <ToolOutlined style={{ color: getMarketFactorColorScheme('crane') }} />,
    craneDailyRate: <BankOutlined style={{ color: getMarketFactorColorScheme('crane') }} />,
    repairDurationDays: <ClockCircleOutlined style={{ color: getMarketFactorColorScheme('other') }} />,
    specialistLabor: <UserOutlined style={{ color: getMarketFactorColorScheme('labor') }} />,
    downtimeRevenuePerDay: <ExclamationCircleOutlined style={{ color: getMarketFactorColorScheme('contractsLocal') }} />
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


    // Handle before save to ensure proper structure using schema defaults
    const handleBeforeSave = async (itemToSave, context) => {
        try {
            // Use schema defaults to ensure proper structure
            // Schema provides complete defaults for failureRate and costs
            // Just ensure enabled is boolean
            if (typeof itemToSave.enabled !== 'boolean') {
                itemToSave.enabled = false;
            }
            
            return itemToSave;
        } catch (error) {
            console.error('Error in handleBeforeSave:', error);
            throw error;
        }
    };

    // Handle component deletion
    const handleDelete = async (componentId) => {
        try {
            const currentComponents = getValueByPath('settings.project.equipment.failureRates.components', []);
            const filteredComponents = currentComponents.filter(c => c.id !== componentId);
            await updateByPath('settings.project.equipment.failureRates.components', filteredComponents);
            message.success('Component removed successfully');
        } catch (error) {
            message.error(`Failed to remove component: ${error.message}`);
        }
    };

    // Handle component editing
    const handleEdit = (record, index) => {
        setSelectedComponent(record);
        setSelectedComponentIndex(index);
        setDetailModalVisible(true);
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

    // Get cost summary icons with tooltips
    const getCostSummary = (component) => {
        if (!component?.costs) return null;
        
        const costComponents = [
            { 
                key: 'componentReplacement', 
                icon: COST_ICONS.componentReplacement,
                label: 'Component Cost',
                getValue: (costs) => costs.componentReplacement?.parameters?.value || 0
            },
            { 
                key: 'craneMobilization', 
                icon: COST_ICONS.craneMobilization,
                label: 'Crane Mobilization',
                getValue: (costs) => costs.craneMobilization?.parameters?.value || 0
            },
            { 
                key: 'craneDailyRate', 
                icon: COST_ICONS.craneDailyRate,
                label: 'Crane Daily Rate',
                getValue: (costs) => costs.craneDailyRate?.parameters?.value || 0
            },
            { 
                key: 'repairDurationDays', 
                icon: COST_ICONS.repairDurationDays,
                label: 'Repair Duration',
                getValue: (costs) => costs.repairDurationDays?.parameters?.value || 0
            },
            { 
                key: 'specialistLabor', 
                icon: COST_ICONS.specialistLabor,
                label: 'Specialist Labor',
                getValue: (costs) => costs.specialistLabor?.parameters?.value || 0
            },
            { 
                key: 'downtimeRevenuePerDay', 
                icon: COST_ICONS.downtimeRevenuePerDay,
                label: 'Downtime Revenue Loss',
                getValue: (costs) => costs.downtimeRevenuePerDay?.parameters?.value || 0
            }
        ];
        
        const configuredComponents = costComponents.filter(comp => {
            const value = comp.getValue(component.costs);
            return value > 0;
        });
        
        if (configuredComponents.length === 0) {
            return <Tag color="default">Not configured</Tag>;
        }
        
        return (
            <Space size={4} wrap>
                {configuredComponents.map(comp => {
                    const value = comp.getValue(component.costs);
                    const formattedValue = comp.key === 'repairDurationDays' 
                        ? `${value} days`
                        : `$${value.toLocaleString()}`;
                    
                    return (
                        <Tooltip 
                            key={comp.key}
                            title={`${comp.label}: ${formattedValue}`}
                            placement="top"
                        >
                            <span style={{ cursor: 'help' }}>
                                {comp.icon}
                            </span>
                        </Tooltip>
                    );
                })}
            </Space>
        );
    };

    // EditableTable columns configuration
    const columns = [
        {
            title: 'Component Name',
            dataIndex: 'name',
            key: 'name',
            width: '18%',
            render: (name) => (
                <div style={{ fontWeight: 500 }}>{name}</div>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: '12%',
            render: (category) => (
                <Tag color={CATEGORY_COLORS[category]}>
                    {category?.charAt(0).toUpperCase() + category?.slice(1)}
                </Tag>
            )
        },
        {
            title: 'Enabled',
            key: 'enabled',
            width: '10%',
            align: 'center',
            render: (_, record, index) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <SwitchField
                        path={`settings.project.equipment.failureRates.components.${index}.enabled`}
                        size="small"
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                        valuePropName="checked"
                    />
                </div>
            )
        },
        {
            title: 'Failure Rate',
            dataIndex: 'failureRate',
            key: 'failureRate',
            width: '15%',
            render: (failureRate) => (
                <Text style={{ fontFamily: 'monospace' }}>
                    {formatFailureRate(failureRate)}
                </Text>
            )
        },
        {
            title: 'Cost Summary',
            key: 'costSummary',
            width: '25%',
            render: (_, record) => getCostSummary(record)
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '20%',
            align: 'center',
            render: (_, record, index) => (
                <Space size="small">
                    <Button
                        type="text"
                        onClick={() => handleDetailedConfig(record, index)}
                        size="small"
                        title="Configure detailed failure rate and cost parameters"
                    >
                        Configure
                    </Button>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record, index)}
                        size="small"
                        title="Edit component"
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                        size="small"
                        title="Remove component"
                    />
                </Space>
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
                path="enabled"
                component={Switch}
                label="Enabled"
                transform={(checked) => checked}
                valuePropName="checked"
            />
            
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
                    autoActions={false}
                    formLayout="vertical"
                    formCompact={false}
                    onBeforeSave={handleBeforeSave}
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