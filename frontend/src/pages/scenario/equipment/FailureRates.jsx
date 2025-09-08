/**
 * Component Failure Rates Configuration Page
 * Transformed to follow MarketFactors pattern with expandable rows and DistributionFieldV3 integration
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Card, Typography, Space, Switch, Button, Tag, message, Form, Input, InputNumber, Select, Tooltip, Table, Modal, Popconfirm, Alert, Row, Col } from 'antd';
import { 
    CheckOutlined, 
    CloseOutlined,
    DollarOutlined,
    BankOutlined,
    ToolOutlined,
    ClockCircleOutlined,
    UserOutlined,
    BuildOutlined,
    AppstoreOutlined,
    ExclamationCircleOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    SettingOutlined,
    LockOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';

import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';
import FailureRateSummaryCard from 'components/cards/FailureRateSummaryCard';
import { DEFAULT_COMPONENTS } from 'schemas/yup/componentFailureRates';
import { getMarketFactorColorScheme, getComponentCategoryColorScheme } from 'utils/charts/colors';
import { distributionTypes } from '../../../utils/distributions';
import RepairPackageSelector from 'components/selectors/RepairPackageSelector';
import CostOverrideInterface from 'components/forms/CostOverrideInterface';
import { ContextField } from 'components/contextFields';

const { Title, Text } = Typography;

// Failure Rate Detail Component for expandable rows
const FailureRateDetail = ({ record }) => {
    return (
        <div style={{ padding: '16px 0', backgroundColor: '#fafafa', borderRadius: '4px' }}>
            <Row gutter={24}>
                <Col span={24}>
                    <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Configure the statistical distribution for {record.name} failure rate (annual probability as percentage). 
                            Changes are applied immediately to scenario calculations.
                        </Text>
                    </div>
                    
                    {/* DistributionFieldV3 - Direct context integration */}
                    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #d9d9d9' }}>
                        <DistributionFieldV3
                            path={['settings', 'project', 'equipment', 'failureRates', 'components', record.id, 'distribution']}
                            showVisualization={true}
                            showInfoBox={true}
                            valueType="percentage"
                            valueName="Failure Rate"
                            step={0.001}
                            showTitle={false}
                            options={[
                                { value: 'fixed', label: 'Fixed Rate - Constant value (no uncertainty)' },
                                { value: 'weibull', label: 'Weibull - Aging/wear-out patterns (recommended for mechanical)' },
                                { value: 'exponential', label: 'Exponential - Constant hazard rate (memoryless failures)' },
                                { value: 'lognormal', label: 'Log-normal - Multiplicative effects and right skew' },
                                { value: 'normal', label: 'Normal - Symmetric uncertainty around mean' },
                                { value: 'beta', label: 'Beta - Bounded between 0% and 100%' },
                                { value: 'gamma', label: 'Gamma - Shape flexibility for aging patterns' }
                            ]}
                            addonAfter="% chance/year"
                            tooltip="Annual probability as percentage (e.g., 2.5% means 2.5% chance per component per year)"
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

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

// Category color mapping for tags - using centralized theming
const getCategoryColor = (category) => getComponentCategoryColorScheme(category);


const FailureRates = () => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    
    // Get components object and convert to array for table display (following MarketFactors pattern)
    const componentsObject = useMemo(() => {
        const components = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], {});
        return components;
    }, [getValueByPath]);

    const componentsArray = useMemo(() => {
        return Object.values(componentsObject);
    }, [componentsObject]);

    // Get global enabled state
    const globalEnabled = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'enabled'], false);

    // Validate if component can be enabled
    const validateComponentReadiness = (component) => {
        const issues = [];
        
        // Check quantity configuration
        if (!component.quantityConfig || !component.quantityConfig.mode) {
            issues.push('Quantity configuration missing');
        } else if (component.quantity === 0 && component.quantityConfig.mode !== 'fixed') {
            issues.push('Calculated quantity is 0 (check wind farm settings)');
        }
        
        // Check repair package and cost configuration
        if (!component.repairPackageId) {
            issues.push('Repair package not selected');
        } else {
            // Check if repair package has configured costs
            const repairPackage = component?.repairConfig?.repairPackageSnapshot;
            if (!repairPackage?.costs) {
                issues.push('Repair package has no cost data');
            } else {
                // Check if any cost category has costs configured
                const hasCosts = Object.values(repairPackage.costs).some(category => 
                    (category?.perEventEUR && category.perEventEUR > 0) || 
                    (category?.perDayEUR && category.perDayEUR > 0)
                );
                if (!hasCosts) {
                    issues.push('No costs configured in repair package');
                }
            }
        }
        
        // Check distribution configuration  
        if (!component.distribution || !component.distribution.parameters) {
            issues.push('Failure rate distribution not configured');
        } else if (component.distribution.parameters.value <= 0) {
            issues.push('Failure rate must be greater than 0');
        }
        
        return {
            canEnable: issues.length === 0,
            issues
        };
    };

    // Ensure default components are always present and clean up invalid components
    useEffect(() => {
        const ensureDefaultsAndCleanup = async () => {
            const currentComponents = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], {});
            let needsUpdate = false;
            const updatedComponents = { ...currentComponents };

            // Add missing default components
            DEFAULT_COMPONENTS.forEach(defaultComp => {
                if (!updatedComponents[defaultComp.id]) {
                    updatedComponents[defaultComp.id] = { ...defaultComp };
                    needsUpdate = true;
                }
            });

            // Clean up invalid components
            let needsCleanup = false;
            const validComponents = {};

            // Filter out invalid components and ensure proper structure
            Object.entries(updatedComponents).forEach(([key, component]) => {
                if (component && component.id && component.name && component.distribution) {
                    validComponents[key] = component;
                } else {
                    needsCleanup = true;
                    needsUpdate = true;
                }
            });

            if (needsUpdate || needsCleanup) {
                try {
                    await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], validComponents);
                } catch (error) {
                    console.error('Error updating failure rate components:', error);
                }
            }
        };

        if (scenarioData) {
            ensureDefaultsAndCleanup();
        }
    }, [scenarioData, updateByPath, getValueByPath]);

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Component Failure Rates</Title>
                <Alert
                    message="No Active Scenario"
                    description="Please create or load a scenario first."
                    type="warning"
                />
            </div>
        );
    }

    // Generate unique ID for new components
    const generateComponentId = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 5);
        return `component_${timestamp}_${random}`;
    };


    // Handle opening modal for edit/create
    const handleOpenModal = (componentKey = null) => {
        if (componentKey !== null) {
            // Edit existing component
            const componentData = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', componentKey]);
            
            setEditingKey(componentKey);
            form.setFieldsValue({
                name: componentData?.name || '',
                category: componentData?.category || '',
                enabled: componentData?.enabled || false
            });
        } else {
            // Create new component
            setEditingKey(null);
            form.resetFields();
            form.setFieldsValue({
                name: '',
                category: '',
                enabled: false
            });
        }
        setIsModalOpen(true);
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingKey(null);
        form.resetFields();
    };


    // Handle form submission for create new component
    const handleCreateComponent = async () => {
        try {
            setLoading(true);
            const values = {
                name: form.getFieldValue('name'),
                category: form.getFieldValue('category'), 
                enabled: form.getFieldValue('enabled') || false
            };

            if (!values.name || !values.category) {
                message.error('Please fill in required fields');
                return;
            }

            const currentComponents = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], {});
            const newComponentId = generateComponentId();
            const newComponent = {
                id: newComponentId,
                name: values.name,
                category: values.category,
                enabled: values.enabled,
                distribution: {
                    key: newComponentId,
                    type: 'exponential',
                    timeSeriesMode: false,
                    parameters: {
                        lambda: 0.025,
                        value: 0.025
                    },
                    timeSeriesParameters: {
                        value: []
                    },
                    metadata: {
                        percentileDirection: 'ascending'
                    }
                },
                repairPackageId: 'Heavy Lift Major',
                componentCostOverride: null,
                escalationOverride: null,
                isDefault: false,
                displayOrder: Object.keys(currentComponents).length + 1
            };

            const updatedComponents = { ...currentComponents, [newComponentId]: newComponent };
            await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], updatedComponents);
            message.success('New component created successfully');
            handleCloseModal();
        } catch (error) {
            console.error('Error creating component:', error);
            message.error('Failed to create component');
        } finally {
            setLoading(false);
        }
    };

    // Handle component deletion
    const handleDelete = async (componentKey) => {
        try {
            const currentComponents = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], {});

            // Remove component from object
            const updatedComponents = { ...currentComponents };
            delete updatedComponents[componentKey];

            await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], updatedComponents);
            message.success('Component deleted successfully');
        } catch (error) {
            console.error('Error deleting component:', error);
            message.error('Failed to delete component');
        }
    };


    // Handle global enable/disable
    const handleGlobalToggle = async (enabled) => {
        try {
            await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'enabled'], enabled);
            message.success(`Component failure modeling ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            message.error(`Failed to update global setting: ${error.message}`);
        }
    };

    // Format distribution for display - values are stored as decimals but display as percentages
    const formatDistribution = (distribution) => {
        if (!distribution || !distribution.parameters) return 'Not configured';
        const rate = distribution.parameters.lambda || distribution.parameters.value || 0;
        // Convert from decimal storage (0.008) to percentage display (0.8%)
        return `${(rate * 100).toFixed(2)}%`;
    };

    // Calculate expected events per year
    const calculateExpectedEvents = (distribution, quantity) => {
        if (!distribution || !distribution.parameters || quantity === 0) return 0;
        const rate = distribution.parameters.lambda || distribution.parameters.value || 0;
        // Rate is stored as decimal (e.g., 0.025 for 2.5% annual failure rate)
        // Use directly for calculation since it's already in decimal form
        return rate * quantity;
    };

    // Get cost summary icons with tooltips - using repair package structure
    const getCostSummary = (component) => {
        const repairPackage = component?.repairConfig?.repairPackageSnapshot;
        if (!repairPackage?.costs) return <Text type="secondary" style={{ fontSize: 11 }}>No costs configured</Text>;
        
        const costCategories = [
            { 
                key: 'material', 
                icon: <DollarOutlined style={{ color: getMarketFactorColorScheme('material') }} />,
                label: 'Material Costs'
            },
            { 
                key: 'labor', 
                icon: <UserOutlined style={{ color: getMarketFactorColorScheme('labor') }} />,
                label: 'Labor Costs'
            },
            { 
                key: 'tooling', 
                icon: <ToolOutlined style={{ color: getMarketFactorColorScheme('tooling') }} />,
                label: 'Tooling Costs'
            },
            { 
                key: 'crane', 
                icon: <BuildOutlined style={{ color: getMarketFactorColorScheme('crane') }} />,
                label: 'Crane Costs'
            },
            { 
                key: 'other', 
                icon: <AppstoreOutlined style={{ color: getMarketFactorColorScheme('other') }} />,
                label: 'Other Costs'
            }
        ];
        
        const configuredCategories = costCategories.filter(category => {
            const categoryData = repairPackage.costs[category.key];
            return categoryData && ((categoryData.perEventEUR || 0) > 0 || (categoryData.perDayEUR || 0) > 0);
        });
        
        // Calculate total costs
        let totalPerEvent = 0;
        let totalPerDay = 0;
        configuredCategories.forEach(category => {
            const categoryData = repairPackage.costs[category.key];
            totalPerEvent += categoryData?.perEventEUR || 0;
            totalPerDay += categoryData?.perDayEUR || 0;
        });
        
        if (configuredCategories.length === 0) {
            return <Text type="secondary" style={{ fontSize: 11 }}>No costs configured</Text>;
        }
        
        return (
            <Space size={4} wrap>
                {configuredCategories.map(category => {
                    const categoryData = repairPackage.costs[category.key];
                    const eventCost = categoryData?.perEventEUR || 0;
                    const dayCost = categoryData?.perDayEUR || 0;
                    
                    const tooltipContent = (
                        <div>
                            <div><strong>{category.label}</strong></div>
                            {eventCost > 0 && <div>Per Event: €{eventCost.toLocaleString()}</div>}
                            {dayCost > 0 && <div>Per Day: €{dayCost.toLocaleString()}/day</div>}
                        </div>
                    );
                    
                    return (
                        <Tooltip 
                            key={category.key}
                            title={tooltipContent}
                            placement="top"
                        >
                            <span style={{ cursor: 'help' }}>
                                {category.icon}
                            </span>
                        </Tooltip>
                    );
                })}
                <Tooltip 
                    title={
                        <div>
                            <div><strong>Total Cost</strong></div>
                            <div>Per Event: €{totalPerEvent.toLocaleString()}</div>
                            {totalPerDay > 0 && <div>Per Day: €{totalPerDay.toLocaleString()}/day</div>}
                        </div>
                    }
                    placement="top"
                >
                    <span style={{ cursor: 'help', marginLeft: 4 }}>
                        <BankOutlined style={{ color: '#1890ff', fontWeight: 'bold' }} />
                    </span>
                </Tooltip>
            </Space>
        );
    };

    // Table columns following MarketFactors pattern
    const columns = [
        {
            title: 'Component Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Text strong>{text}</Text>
            ),
            flex: 1,
            minWidth: 200
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            render: (category) => (
                <Tag color={getCategoryColor(category)}>
                    {category?.charAt(0).toUpperCase() + category?.slice(1)}
                </Tag>
            ),
            width: 100
        },
        {
            title: 'Enabled',
            dataIndex: 'enabled',
            key: 'enabled',
            render: (enabled, record) => {
                const validation = validateComponentReadiness(record);
                
                const handleToggle = async (checked) => {
                    if (checked && !validation.canEnable) {
                        message.error('Cannot enable: ' + validation.issues.join(', '));
                        return;
                    }
                    
                    try {
                        const currentComponents = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], {});
                        const updatedComponent = { ...currentComponents[record.id], enabled: checked };
                        const updatedComponents = { ...currentComponents, [record.id]: updatedComponent };
                        await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], updatedComponents);
                    } catch (error) {
                        message.error('Failed to update component status');
                    }
                };
                
                // If component is enabled or can be enabled, show regular switch
                if (enabled || validation.canEnable) {
                    return (
                        <Switch 
                            checked={enabled} 
                            size="small"
                            checkedChildren={<CheckOutlined />}
                            unCheckedChildren={<CloseOutlined />}
                            onChange={handleToggle}
                        />
                    );
                }

                // If component cannot be enabled, show switch with tooltip
                return (
                    <Tooltip 
                        title={
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Cannot enable component:</div>
                                {validation.issues.map((issue, index) => (
                                    <div key={index}>• {issue}</div>
                                ))}
                                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.8 }}>
                                    Configure the component first by clicking Edit
                                </div>
                            </div>
                        }
                        placement="topLeft"
                    >
                        <Switch 
                            checked={false} 
                            size="small"
                            checkedChildren={<CheckOutlined />}
                            unCheckedChildren={<CloseOutlined />}
                            onChange={handleToggle}
                            style={{ opacity: 0.6 }}
                        />
                    </Tooltip>
                );
            },
            width: 80,
            align: 'center'
        },
        {
            title: '%/Year',
            dataIndex: 'distribution',
            key: 'baseRate',
            render: (distribution) => (
                <Text style={{ fontFamily: 'monospace' }}>
                    {formatDistribution(distribution)}
                </Text>
            ),
            width: 90
        },
        {
            title: 'Quantity',
            key: 'quantity',
            render: (_, record) => {
                const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 100);
                const quantityConfig = record.quantityConfig || { mode: 'perTurbine', value: 1 };
                
                let total = 0;
                switch (quantityConfig.mode) {
                    case 'fixed':
                        total = quantityConfig.value || 0;
                        break;
                    case 'perBlade':
                        total = numWTGs * 3 * (quantityConfig.value || 1);
                        break;
                    case 'perTurbine':
                    default:
                        // Special handling for gearboxes
                        if (record.id === 'gearboxes') {
                            const wtgPlatformType = getValueByPath(['settings', 'project', 'windFarm', 'wtgPlatformType'], 'geared');
                            total = wtgPlatformType === 'geared' ? numWTGs * (quantityConfig.value || 1) : 0;
                        } else {
                            total = numWTGs * (quantityConfig.value || 1);
                        }
                        break;
                }
                
                return (
                    <Text>
                        {total.toLocaleString()}
                    </Text>
                );
            },
            width: 80
        },
        {
            title: 'Events/Year',
            key: 'expectedEvents',
            render: (_, record) => {
                const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 100);
                const quantityConfig = record.quantityConfig || { mode: 'perTurbine', value: 1 };
                
                let quantity = 0;
                switch (quantityConfig.mode) {
                    case 'fixed':
                        quantity = quantityConfig.value || 0;
                        break;
                    case 'perBlade':
                        quantity = numWTGs * 3 * (quantityConfig.value || 1);
                        break;
                    case 'perTurbine':
                    default:
                        // Special handling for gearboxes
                        if (record.id === 'gearboxes') {
                            const wtgPlatformType = getValueByPath(['settings', 'project', 'windFarm', 'wtgPlatformType'], 'geared');
                            quantity = wtgPlatformType === 'geared' ? numWTGs * (quantityConfig.value || 1) : 0;
                        } else {
                            quantity = numWTGs * (quantityConfig.value || 1);
                        }
                        break;
                }
                
                const expectedEvents = calculateExpectedEvents(record.distribution, quantity);
                
                return (
                    <Text style={{ fontFamily: 'monospace' }}>
                        {expectedEvents.toFixed(2)}
                    </Text>
                );
            },
            width: 120,
            align: 'right'
        },
        {
            title: 'Costs',
            key: 'costSummary',
            render: (_, record) => getCostSummary(record),
            width: 160,
            align: 'center'
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record.id)}
                        size="small"
                        title="Edit basic properties"
                    />
                    {record.isLocked ? (
                        <Tooltip title="This is a default component and cannot be deleted">
                            <Button
                                type="text"
                                icon={<LockOutlined />}
                                size="small"
                                disabled
                                style={{ color: '#d9d9d9' }}
                            />
                        </Tooltip>
                    ) : (
                        <Popconfirm
                            title="Delete Component"
                            description="Are you sure you want to delete this component?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    const enabledCount = componentsArray.filter(c => c.enabled).length;

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>Component Failure Rates</Title>
                <div>
                    <Text type="secondary">
                        Configure failure rates and cost modeling for major wind turbine components. 
                        Rates are specified as annual probability percentages per component per year. 
                        During simulation, these rates are multiplied by component quantities to estimate total expected failures.
                    </Text>
                </div>
            </div>

            {/* Global Configuration Card */}
            <Card 
                title="Global Configuration" 
                style={{ marginBottom: '24px' }}
                extra={
                    <Switch
                        checked={globalEnabled || false}
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
                            {globalEnabled ? 'Enabled' : 'Disabled'}
                        </Text>
                    </div>
                    <div>
                        <Text>Active components: </Text>
                        <Text strong>{enabledCount} of {componentsArray.length}</Text>
                    </div>
                    {globalEnabled && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Component failures will be included in Monte Carlo simulations and cost calculations
                        </Text>
                    )}
                </Space>
            </Card>

            {/* Components Table following MarketFactors pattern */}
            <Card style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>
                        Configure failure rates for major turbine components. Expand rows to configure statistical distributions.
                    </Text>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenModal()}
                        loading={loading}
                    >
                        Add Component
                    </Button>
                </div>

                <Table
                    dataSource={componentsArray}
                    columns={columns}
                    pagination={false}
                    size="small"
                    rowKey="id"
                    expandable={{
                        expandedRowRender: (record) => <FailureRateDetail record={record} />,
                        rowExpandable: (record) => !!record?.distribution,
                        expandRowByClick: false,
                        expandIcon: ({ expanded, onExpand, record }) => (
                            <Button
                                type="text"
                                size="small"
                                icon={<SettingOutlined />}
                                onClick={(e) => onExpand(record, e)}
                                title={expanded ? "Hide distribution settings" : "Configure distribution"}
                                style={{ 
                                    color: expanded ? '#1890ff' : '#666',
                                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'all 0.2s'
                                }}
                            />
                        )
                    }}
                />
            </Card>

            {/* Summary Card */}
            <FailureRateSummaryCard />

            {/* Component Configuration Modal */}
            <Modal
                title={`${editingKey !== null ? 'Edit' : 'Create'} Component`}
                open={isModalOpen}
                onCancel={handleCloseModal}
                width={800}
                footer={[
                    <Button key="cancel" onClick={handleCloseModal}>
                        Cancel
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={loading}
                        onClick={() => {
                            if (editingKey) {
                                // Validate component before closing
                                const component = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey]);
                                const hasRepairPackage = component?.repairPackageSnapshot;
                                const isEnabled = component?.enabled;
                                
                                if (isEnabled && !hasRepairPackage) {
                                    message.error('Cannot enable component without a repair package. Please select a repair package first.');
                                    return;
                                }
                                
                                message.success('Component configuration saved successfully');
                                handleCloseModal();
                            } else {
                                handleCreateComponent();
                            }
                        }}
                    >
                        {editingKey ? 'Save Changes' : 'Create Component'}
                    </Button>
                ]}
            >
                {editingKey ? (
                    /* Edit Existing Component */
                    <div style={{ padding: '8px 0' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            
                            {/* Component Details Section */}
                            <div>
                                <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block', color: '#262626' }}>
                                    Component Details
                                </Text>
                                <Row gutter={16} align="bottom">
                                    <Col span={10}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                                            Component Name
                                        </Text>
                                        <ContextField
                                            path={['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'name']}
                                            component={Input}
                                            placeholder="Enter component name"
                                            style={{ height: 32 }}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                                            Category
                                        </Text>
                                        <ContextField
                                            path={['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'category']}
                                            component={(props) => (
                                                <Select
                                                    {...props}
                                                    placeholder="Select category"
                                                    options={CATEGORY_OPTIONS}
                                                    style={{ width: '100%', height: 32 }}
                                                />
                                            )}
                                        />
                                    </Col>
                                    <Col span={6}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                                            Enabled
                                        </Text>
                                        <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ContextField
                                                path={['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'enabled']}
                                                component={(props) => {
                                                    const currentComponent = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey]);
                                                    const validation = validateComponentReadiness(currentComponent);
                                                    
                                                    return (
                                                        <Switch
                                                            {...props}
                                                            size="small"
                                                            checkedChildren={<CheckOutlined />}
                                                            unCheckedChildren={<CloseOutlined />}
                                                            onChange={(checked) => {
                                                                if (checked && !validation.canEnable) {
                                                                    message.error('Cannot enable: ' + validation.issues.join(', '));
                                                                    return;
                                                                }
                                                                props.onChange(checked);
                                                            }}
                                                        />
                                                    );
                                                }}
                                                valuePropName="checked"
                                            />
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            {/* Quantity Configuration Section */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 16, color: '#262626' }}>Quantity Configuration</Text>
                                    <Tag color="blue" style={{ borderRadius: 4 }}>Auto-calculated</Tag>
                                </div>
                                <Row gutter={16} align="bottom">
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                                            Calculation Mode
                                        </Text>
                                        <ContextField
                                            path={['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'quantityConfig', 'mode']}
                                            component={(props) => (
                                                <Select
                                                    {...props}
                                                    placeholder="Select mode"
                                                    options={[
                                                        { value: 'fixed', label: 'Fixed Quantity' },
                                                        { value: 'perTurbine', label: 'Per Turbine' },
                                                        { value: 'perBlade', label: 'Per Blade (×3)' }
                                                    ]}
                                                    style={{ width: '100%', height: 32 }}
                                                />
                                            )}
                                            affectedMetrics={['componentQuantities']}
                                        />
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>
                                            Value
                                        </Text>
                                        <ContextField
                                            path={['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'quantityConfig', 'value']}
                                            component={(props) => (
                                                <InputNumber
                                                    {...props}
                                                    min={0}
                                                    step={1}
                                                    style={{ width: '100%', height: 32 }}
                                                    placeholder="1"
                                                />
                                            )}
                                            affectedMetrics={['componentQuantities']}
                                        />
                                    </Col>
                                </Row>
                            </div>

                            {/* Repair Package Configuration Section */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <Text strong style={{ fontSize: 16, color: '#262626' }}>Repair Package</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Override costs</Text>
                                        <ContextField
                                            path={['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'enableCostOverrides']}
                                            component={Switch}
                                            valuePropName="checked"
                                            affectedMetrics={['failureRateCosts']}
                                        />
                                    </div>
                                </div>
                                
                                {/* Repair Package Selector - Only the selector */}
                                <div style={{ 
                                    opacity: getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'enableCostOverrides']) ? 0.7 : 1,
                                    pointerEvents: getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'enableCostOverrides']) ? 'none' : 'auto',
                                    marginBottom: 16
                                }}>
                                    <RepairPackageSelector 
                                        componentId={editingKey}
                                        showCostPreview={false}
                                        showDescription={!getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'enableCostOverrides'])}
                                        showDurationAndCrane={false}
                                    />
                                </div>

                                {/* Cost Override Interface - Show when enabled */}
                                {(() => {
                                    const overridesEnabled = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey, 'enableCostOverrides']);
                                    
                                    if (!overridesEnabled) return null;
                                    
                                    return (
                                        <div style={{ 
                                            marginBottom: 16,
                                            padding: 20,
                                            background: '#fafafa',
                                            borderRadius: 8,
                                            border: '1px solid #d9d9d9'
                                        }}>
                                            <CostOverrideInterface componentId={editingKey} showTotalRow={false} />
                                        </div>
                                    );
                                })()}
                                
                                {/* Cost Summary Row - Always visible at bottom */}
                                {(() => {
                                    const currentComponent = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey]);
                                    const selectedPackage = currentComponent?.repairConfig?.repairPackageSnapshot;
                                    
                                    if (!selectedPackage) return null;
                                    
                                    // Get cost summary from either override or package
                                    const costs = selectedPackage.costs || {};
                                    let totalPerEvent = 0;
                                    let totalPerDay = 0;
                                    
                                    Object.values(costs).forEach(category => {
                                        totalPerEvent += category?.perEventEUR || 0;
                                        totalPerDay += category?.perDayEUR || 0;
                                    });
                                    
                                    const formatCurrency = (value) => `€${value?.toLocaleString() || '0'}`;
                                    
                                    return (
                                        <div style={{ 
                                            padding: '12px 16px', 
                                            background: '#f8f9fa', 
                                            borderRadius: 8, 
                                            border: '1px solid #e8e8e8',
                                            marginBottom: 16
                                        }}>
                                            <Space size="small" wrap>
                                                <DollarOutlined style={{ color: getMarketFactorColorScheme('material') }} />
                                                <UserOutlined style={{ color: getMarketFactorColorScheme('labor') }} />
                                                <ToolOutlined style={{ color: getMarketFactorColorScheme('tooling') }} />
                                                <BuildOutlined style={{ color: getMarketFactorColorScheme('crane') }} />
                                                <AppstoreOutlined style={{ color: getMarketFactorColorScheme('other') }} />
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    Total: {formatCurrency(totalPerEvent)}
                                                    {totalPerDay > 0 && ` + ${formatCurrency(totalPerDay)}/day`}
                                                </Text>
                                            </Space>
                                        </div>
                                    );
                                })()}
                                
                                {/* Duration and Crane Info - Always at bottom */}
                                {(() => {
                                    const currentComponent = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components', editingKey]);
                                    const selectedPackage = currentComponent?.repairConfig?.repairPackageSnapshot;
                                    
                                    if (!selectedPackage) return null;
                                    
                                    return (
                                        <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                                            <Space size="small">
                                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                                <Text style={{ fontSize: 12 }}>
                                                    Duration: {selectedPackage.baseDurationDays} days
                                                </Text>
                                            </Space>
                                            {selectedPackage.crane?.type !== 'none' && (
                                                <Space size="small">
                                                    <ToolOutlined style={{ color: '#722ed1' }} />
                                                    <Text style={{ fontSize: 12 }}>
                                                        Crane: {selectedPackage.crane.type}
                                                        {selectedPackage.crane.minimumDays > 0 && 
                                                            ` (${selectedPackage.crane.minimumDays} days min)`
                                                        }
                                                    </Text>
                                                </Space>
                                            )}
                                        </Space>
                                    );
                                })()}
                            </div>
                        </Space>
                    </div>
                ) : (
                    /* Create New Component - Simplified Form */
                    <div>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div>
                                <Text strong>New Component</Text>
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Component Name</Text>
                                        <Input 
                                            value={form.getFieldValue('name') || ''}
                                            onChange={(e) => form.setFieldValue('name', e.target.value)}
                                            placeholder="e.g., Main Bearing, Gearbox"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Category</Text>
                                        <Select
                                            value={form.getFieldValue('category')}
                                            onChange={(value) => form.setFieldValue('category', value)}
                                            placeholder="Select category"
                                            options={CATEGORY_OPTIONS}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <Row gutter={8} style={{ alignItems: 'center' }}>
                                        <Col>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Enable:</Text>
                                        </Col>
                                        <Col>
                                            <Switch
                                                size="small"
                                                checked={form.getFieldValue('enabled') || false}
                                                onChange={(checked) => form.setFieldValue('enabled', checked)}
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                            
                            <Alert
                                message="Configure after creation"
                                description="Quantity, repair packages, and distributions can be configured after creating the component."
                                type="info"
                                showIcon
                                style={{ fontSize: 11, padding: 8 }}
                                banner
                            />
                        </Space>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FailureRates;