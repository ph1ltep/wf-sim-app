/**
 * Component Failure Rates Configuration Page
 * MVP implementation using proven EditableTable + Modal pattern
 */

import React, { useState, useMemo } from 'react';
import { Card, Typography, Space, Switch, Button, Tag, message } from 'antd';
import { SettingOutlined, ThunderboltOutlined, ToolOutlined, ControlOutlined, 
         SyncOutlined, ReloadOutlined, DashboardOutlined, ApiOutlined } from '@ant-design/icons';

import { useScenario } from 'contexts/ScenarioContext';
import EditableTable from 'components/tables/EditableTable';
import ComponentFailureModal from './ComponentFailureModal';
import FailureRateSummaryCard from 'components/cards/FailureRateSummaryCard';

const { Title, Text } = Typography;

// Component icons mapping
const COMPONENT_ICONS = {
    gearbox: <SettingOutlined />,
    generator: <ThunderboltOutlined />,
    mainBearing: <ToolOutlined />,
    powerElectronics: <ControlOutlined />,
    bladeBearings: <SyncOutlined />,
    yawSystem: <ReloadOutlined />,
    controlSystem: <DashboardOutlined />,
    transformer: <ApiOutlined />
};

// Component display names
const COMPONENT_NAMES = {
    gearbox: 'Gearbox',
    generator: 'Generator', 
    mainBearing: 'Main Bearing',
    powerElectronics: 'Power Electronics',
    bladeBearings: 'Blade Bearings',
    yawSystem: 'Yaw System',
    controlSystem: 'Control System',
    transformer: 'Transformer'
};

// Component categories for organization
const COMPONENT_CATEGORIES = {
    gearbox: 'Drivetrain',
    generator: 'Electrical',
    mainBearing: 'Drivetrain', 
    powerElectronics: 'Electrical',
    bladeBearings: 'Rotor',
    yawSystem: 'Mechanical',
    controlSystem: 'Control',
    transformer: 'Electrical'
};

const FailureRates = () => {
    const { getValueByPath, updateByPath } = useScenario();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState(null);
    
    // Get failure rates configuration from scenario context
    const failureRatesConfig = getValueByPath('settings.project.equipment.failureRates', {
        enabled: false,
        components: {}
    });

    // Component list for table display
    const componentsList = useMemo(() => {
        const components = Object.keys(COMPONENT_NAMES).map(componentKey => {
            const componentConfig = failureRatesConfig.components?.[componentKey] || { enabled: false };
            const failureRate = componentConfig.failureRate?.parameters?.value || 
                              componentConfig.failureRate?.parameters?.lambda || 0;
            
            return {
                id: componentKey,
                key: componentKey,
                component: componentKey,
                name: COMPONENT_NAMES[componentKey],
                category: COMPONENT_CATEGORIES[componentKey],
                enabled: componentConfig.enabled || false,
                failureRate: failureRate,
                status: componentConfig.enabled ? 'configured' : 'disabled'
            };
        });
        return components;
    }, [failureRatesConfig]);

    // Handle component enable/disable toggle
    const handleToggleComponent = async (componentKey, enabled) => {
        try {
            await updateByPath(`settings.project.equipment.failureRates.components.${componentKey}.enabled`, enabled);
            message.success(`${COMPONENT_NAMES[componentKey]} ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            message.error(`Failed to update ${COMPONENT_NAMES[componentKey]}: ${error.message}`);
        }
    };

    // Handle opening modal for detailed configuration
    const handleEditComponent = (componentKey) => {
        setSelectedComponent(componentKey);
        setModalVisible(true);
    };

    // Handle modal close
    const handleModalClose = () => {
        setModalVisible(false);
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
    const formatFailureRate = (rate) => {
        if (!rate || rate === 0) return 'Not configured';
        return `${(rate * 100).toFixed(2)}% annual`;
    };

    // Get status badge
    const getStatusBadge = (status, enabled) => {
        if (!enabled) return <Tag color="default">Disabled</Tag>;
        return <Tag color="green">Active</Tag>;
    };

    // Table columns configuration
    const columns = [
        {
            title: 'Component',
            dataIndex: 'component',
            key: 'component',
            width: '25%',
            render: (componentKey, record) => (
                <Space>
                    {COMPONENT_ICONS[componentKey]}
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.category}
                        </Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Enabled',
            dataIndex: 'enabled',
            key: 'enabled',
            width: '15%',
            render: (enabled, record) => (
                <Switch
                    checked={enabled}
                    onChange={(checked) => handleToggleComponent(record.component, checked)}
                    size="small"
                />
            )
        },
        {
            title: 'Failure Rate',
            dataIndex: 'failureRate',
            key: 'failureRate',
            width: '25%',
            render: (rate) => (
                <Text style={{ fontFamily: 'monospace' }}>
                    {formatFailureRate(rate)}
                </Text>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '15%',
            render: (status, record) => getStatusBadge(status, record.enabled)
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '20%',
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => handleEditComponent(record.component)}
                >
                    Configure
                </Button>
            )
        }
    ];

    const enabledCount = componentsList.filter(c => c.enabled).length;

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
                        <Text strong>{enabledCount} of {componentsList.length}</Text>
                    </div>
                    {failureRatesConfig.enabled && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Component failures will be included in Monte Carlo simulations and cost calculations
                        </Text>
                    )}
                </Space>
            </Card>

            {/* Components Table */}
            <Card title="Component Configuration" style={{ marginBottom: '24px' }}>
                <EditableTable
                    columns={columns}
                    data={componentsList}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Summary Card */}
            <FailureRateSummaryCard />

            {/* Detail Configuration Modal */}
            {selectedComponent && (
                <ComponentFailureModal
                    visible={modalVisible}
                    componentKey={selectedComponent}
                    componentName={COMPONENT_NAMES[selectedComponent]}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default FailureRates;