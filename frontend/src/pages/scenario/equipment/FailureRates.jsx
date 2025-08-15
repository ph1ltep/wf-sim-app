/**
 * Component Failure Rates Configuration Page
 * Refactored to use EditableTable with dynamic array structure
 */

import React, { useState, useMemo } from 'react';
import { Card, Typography, Space, Switch, Button, Tag, message, Form, Input } from 'antd';
import { SettingOutlined, ThunderboltOutlined, ToolOutlined, ControlOutlined, 
         SyncOutlined, ReloadOutlined, DashboardOutlined, ApiOutlined } from '@ant-design/icons';

import { useScenario } from 'contexts/ScenarioContext';
import EditableTable from 'components/tables/EditableTable';
import { ContextField } from 'components/contextFields/ContextField';
import DistributionFieldV3 from 'components/distributionFields/DistributionFieldV3';
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
    
    // Get failure rates configuration from scenario context
    const failureRatesConfig = getValueByPath('settings.project.equipment.failureRates', {
        enabled: false,
        components: []
    });

    // Get components array from the dynamic structure
    const componentsArray = failureRatesConfig.components || [];

    // Handle opening detailed configuration modal
    const handleDetailedConfig = (component) => {
        setSelectedComponent(component);
        setDetailModalVisible(true);
    };

    // Handle modal close
    const handleDetailModalClose = () => {
        setDetailModalVisible(false);
        setSelectedComponent(null);
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

    // EditableTable columns configuration  
    const columns = [
        {
            title: 'Component',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            render: (name, record) => (
                <Space>
                    {COMPONENT_ICONS[record.icon]}
                    <div>
                        <div style={{ fontWeight: 500 }}>{name}</div>
                        <Tag color={CATEGORY_COLORS[record.category]} size="small">
                            {record.category}
                        </Tag>
                    </div>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'enabled',
            key: 'enabled',
            width: '15%',
            render: (enabled) => getStatusBadge(enabled)
        },
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
            title: 'Actions',
            key: 'actions',
            width: '15%',
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => handleDetailedConfig(record)}
                >
                    Details
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
            
            <ContextField
                path="category"
                component={Input}
                label="Category"
                required
                rules={[{ required: true, message: 'Category is required' }]}
            />
            
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
            
            <Form.Item label="Failure Rate Distribution">
                <DistributionFieldV3
                    path="failureRate"
                    showAdvanced={true}
                    compactMode={false}
                />
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
                    <Switch
                        checked={failureRatesConfig.enabled || false}
                        onChange={handleGlobalToggle}
                        checkedChildren="Enabled"
                        unCheckedChildren="Disabled"
                    />
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
                />
            </Card>

            {/* Summary Card */}
            <FailureRateSummaryCard />

            {/* Detail Configuration Modal */}
            {selectedComponent && (
                <ComponentFailureModal
                    visible={detailModalVisible}
                    componentKey={selectedComponent.id}
                    componentName={selectedComponent.name}
                    onClose={handleDetailModalClose}
                />
            )}
        </div>
    );
};

export default FailureRates;