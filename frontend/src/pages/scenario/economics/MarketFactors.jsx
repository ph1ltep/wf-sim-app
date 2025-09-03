// frontend/src/pages/scenario/economics/MarketFactors.jsx
import React, { useState, useMemo } from 'react';
import { Typography, Alert, Table, Button, Modal, Space, Popconfirm, message, Card, Select, Input, Divider, Row, Col, Form } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    LockOutlined,
    DollarOutlined,
    UserOutlined,
    ToolOutlined,
    BuildOutlined,
    AppstoreOutlined,
    FileTextOutlined,
    GlobalOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';
import { getMarketFactorColorScheme } from 'utils/charts/colors';
import { distributionTypes } from '../../../utils/distributions';

// Default market factors
const DEFAULT_MARKET_FACTORS = [
    {
        id: 'baseEscalationRate',
        name: 'Base Escalation Rate',
        description: 'Default cost escalation for all operations',
        distribution: {
            key: 'baseEscalationRate',
            type: 'fixed',
            timeSeriesMode: false,
            parameters: {
                value: 1.0,
                drift: 2.5
            },
            timeSeriesParameters: {
                value: []
            },
            metadata: {
                percentileDirection: 'ascending'
            }
        },
        isDefault: true
    }
];

// Cost category configurations
const COST_CATEGORIES = [
    {
        key: 'material',
        label: 'Material',
        icon: <DollarOutlined />,
        description: 'Component and spare parts costs'
    },
    {
        key: 'labor',
        label: 'Labor',
        icon: <UserOutlined />,
        description: 'Technician and specialist costs'
    },
    {
        key: 'tooling',
        label: 'Tooling',
        icon: <ToolOutlined />,
        description: 'Equipment and tool rental'
    },
    {
        key: 'crane',
        label: 'Crane',
        icon: <BuildOutlined />,
        description: 'Crane mobilization and operation'
    },
    {
        key: 'contractsLocal',
        label: 'Contracts (Local)',
        icon: <FileTextOutlined />,
        description: 'Local contracting and service costs'
    },
    {
        key: 'contractsForeign',
        label: 'Contracts (Foreign)',
        icon: <GlobalOutlined />,
        description: 'International contracting and logistics'
    },
    {
        key: 'other',
        label: 'Other',
        icon: <AppstoreOutlined />,
        description: 'Additional and contingency costs'
    }
];

const { Title, Text } = Typography;
const { Option } = Select;

// Market Factor Detail Component for expandable rows
const MarketFactorDetail = ({ record }) => {
    return (
        <div style={{ padding: '16px 0', backgroundColor: '#fafafa', borderRadius: '4px' }}>
            <Row gutter={24}>
                <Col span={24}>
                    <div style={{ marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Configure the statistical distribution for this market factor. 
                            The base value is fixed at 1.0 since this is a multiplier. Changes are applied immediately.
                        </Text>
                    </div>
                    
                    {/* DistributionFieldV3 - Direct context integration, no form wrapper needed */}
                    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '6px', border: '1px solid #d9d9d9' }}>
                        <DistributionFieldV3
                            path={['settings', 'marketFactors', record.id, 'distribution']}
                            showVisualization={true}
                            showInfoBox={true}
                            valueType="number"
                            valueName="Multiplier"
                            step={0.01}
                            showTitle={false}
                            options={distributionTypes}
                            addonAfter="×"
                            valueReadOnly={true}
                            defaultValue={1.0}
                            enforceValue={1.0}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

const MarketFactors = () => {
    const { scenarioData, updateByPath, getValueByPath } = useScenario();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    // Get market factors object and convert to array for table display
    const marketFactorsObject = useMemo(() => {
        const factors = getValueByPath(['settings', 'marketFactors'], {});
        console.log('📊 MarketFactors table data updated:', { factors });
        return factors;
    }, [scenarioData?.settings?.marketFactors, getValueByPath]);

    const marketFactorsArray = useMemo(() => {
        return Object.values(marketFactorsObject);
    }, [marketFactorsObject]);

    // Get current cost category factors
    const costCategoryFactors = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'costCategoryFactors'], {
        material: 'baseEscalationRate',
        labor: 'baseEscalationRate',
        tooling: 'baseEscalationRate',
        crane: 'baseEscalationRate',
        contractsLocal: 'baseEscalationRate',
        contractsForeign: 'baseEscalationRate',
        other: 'baseEscalationRate'
    });

    // Determine which factors are assigned to cost categories (and thus locked from deletion)
    const assignedFactors = useMemo(() => {
        const assigned = new Set();
        Object.values(costCategoryFactors).forEach(factorId => {
            assigned.add(factorId);
        });
        return assigned;
    }, [costCategoryFactors]);

    // Clean up invalid market factors on component mount
    React.useEffect(() => {
        const cleanupInvalidFactors = async () => {
            const factors = getValueByPath(['settings', 'marketFactors'], {});
            let needsCleanup = false;
            const validFactors = {};

            // Filter out invalid factors and ensure proper structure
            Object.entries(factors).forEach(([key, factor]) => {
                if (factor && factor.id && factor.name && factor.distribution) {
                    validFactors[key] = factor;
                } else {
                    needsCleanup = true;
                }
            });

            // Ensure baseEscalationRate exists
            if (!validFactors.baseEscalationRate) {
                validFactors.baseEscalationRate = DEFAULT_MARKET_FACTORS[0];
                needsCleanup = true;
            }

            if (needsCleanup) {
                try {
                    await updateByPath(['settings', 'marketFactors'], validFactors);
                } catch (error) {
                    console.error('Error cleaning up market factors:', error);
                }
            }
        };

        if (scenarioData?.settings?.marketFactors) {
            cleanupInvalidFactors();
        }
    }, [scenarioData, updateByPath, getValueByPath]);

    // Check if we have an active scenario
    if (!scenarioData) {
        return (
            <div>
                <Title level={2}>Market Factors</Title>
                <Alert
                    message="No Active Scenario"
                    description="Please create or load a scenario first."
                    type="warning"
                />
            </div>
        );
    }

    // Generate unique ID for new factors
    const generateFactorId = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 5);
        return `factor_${timestamp}_${random}`;
    };

    // Handle opening modal for edit/create
    const handleOpenModal = (factorKey = null) => {
        if (factorKey !== null) {
            // Edit existing factor
            const marketFactorData = getValueByPath(['settings', 'marketFactors', factorKey]);
            console.log('🚀 Opening modal for editing:', { 
                factorKey, 
                path: ['settings', 'marketFactors', factorKey],
                data: marketFactorData 
            });
            
            setEditingKey(factorKey);
            form.setFieldsValue({
                name: marketFactorData?.name || '',
                description: marketFactorData?.description || ''
            });
        } else {
            // Create new factor
            setEditingKey(null);
            form.resetFields();
            form.setFieldsValue({
                name: '',
                description: ''
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

    // Handle form submission
    const handleFormSubmit = async (values) => {
        try {
            setLoading(true);
            const currentFactors = getValueByPath(['settings', 'marketFactors'], {});

            if (editingKey) {
                // Update existing factor
                const existingFactor = currentFactors[editingKey];
                const updatedFactor = {
                    ...existingFactor,
                    name: values.name,
                    description: values.description
                };

                const updatedFactors = { ...currentFactors, [editingKey]: updatedFactor };
                await updateByPath(['settings', 'marketFactors'], updatedFactors);
                message.success('Market factor updated successfully');
            } else {
                // Create new factor
                const newFactorId = generateFactorId();
                const newFactor = {
                    id: newFactorId,
                    name: values.name,
                    description: values.description,
                    distribution: {
                        key: newFactorId,
                        type: 'fixed',
                        timeSeriesMode: false,
                        parameters: {
                            value: 1.0, // Always 1.0 for multipliers
                            drift: 0
                        },
                        timeSeriesParameters: {
                            value: []
                        },
                        metadata: {
                            percentileDirection: 'ascending'
                        }
                    },
                    isDefault: false
                };

                const updatedFactors = { ...currentFactors, [newFactorId]: newFactor };
                await updateByPath(['settings', 'marketFactors'], updatedFactors);
                message.success('New market factor created successfully');
            }

            handleCloseModal();
        } catch (error) {
            console.error('Error saving market factor:', error);
            message.error('Failed to save market factor');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (factorKey) => {
        try {
            const currentFactors = getValueByPath(['settings', 'marketFactors'], {});
            const factorToDelete = currentFactors[factorKey];

            // Remove factor from object
            const updatedFactors = { ...currentFactors };
            delete updatedFactors[factorKey];

            // Update any cost category mappings that referenced this factor
            const failureRates = getValueByPath(['settings', 'project', 'equipment', 'failureRates'], {});
            if (failureRates?.costCategoryFactors) {
                const updatedMappings = { ...failureRates.costCategoryFactors };
                Object.keys(updatedMappings).forEach(category => {
                    if (updatedMappings[category] === factorToDelete.id) {
                        updatedMappings[category] = 'baseEscalationRate'; // Reset to default
                    }
                });
                await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'costCategoryFactors'], updatedMappings);
            }

            await updateByPath(['settings', 'marketFactors'], updatedFactors);
            message.success('Market factor deleted successfully');
        } catch (error) {
            console.error('Error deleting market factor:', error);
            message.error('Failed to delete market factor');
        }
    };

    // Handle factor change for a category
    const handleCategoryFactorChange = async (category, factorId) => {
        try {
            const updatedFactors = {
                ...costCategoryFactors,
                [category]: factorId
            };
            await updateByPath(['settings', 'project', 'equipment', 'failureRates', 'costCategoryFactors'], updatedFactors);
        } catch (error) {
            console.error('Error updating cost category factor:', error);
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record, index) => {
                const isAssigned = assignedFactors.has(record.id);
                const isLocked = record.isDefault || isAssigned;
                return (
                    <Space>
                        {isLocked && (
                            <LockOutlined 
                                style={{ 
                                    color: record.isDefault ? '#1890ff' : '#52c41a',
                                    fontSize: record.isDefault ? 14 : 12
                                }} 
                                title={record.isDefault ? 'Default factor (cannot be deleted)' : 'Assigned to cost categories (cannot be deleted)'}
                            />
                        )}
                        <Text strong={record.isDefault}>{text}</Text>
                    </Space>
                );
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Distribution Type',
            dataIndex: 'distribution',
            key: 'distributionType',
            render: (distribution) => {
                const type = distribution?.type || 'fixed';
                const typeLabel = distributionTypes.find(dt => dt.value === type)?.label || 'Fixed';
                return (
                    <Space>
                        <Text>{typeLabel}</Text>
                        {distribution?.timeSeriesMode && (
                            <Text type="secondary" style={{ fontSize: 11 }}>(Time Series)</Text>
                        )}
                    </Space>
                );
            },
            width: 150
        },
        {
            title: 'Base Value',
            dataIndex: 'distribution',
            key: 'baseValue',
            render: (distribution, record) => {
                // Always show 1.0 as the base value since this is a multiplier
                const drift = distribution?.parameters?.drift || 0;
                if (drift !== 0) {
                    return `1.00× (${drift > 0 ? '+' : ''}${drift}% p.a.)`;
                }
                return '1.00×';
            },
            width: 150
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => {
                const isAssigned = assignedFactors.has(record.id);
                const canDelete = !record.isDefault && !isAssigned;
                
                return (
                    <Space>
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenModal(record.id)}
                            size="small"
                            title="Edit basic properties"
                        />
                        {canDelete ? (
                            <Popconfirm
                                title="Delete Market Factor"
                                description="Are you sure you want to delete this market factor?"
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
                        ) : (
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                size="small"
                                disabled
                                title={record.isDefault ? 'Cannot delete default factor' : 'Cannot delete factor assigned to cost categories'}
                                style={{ color: '#ccc' }}
                            />
                        )}
                    </Space>
                );
            }
        }
    ];

    return (
        <div>
            <Title level={2}>Market Factors</Title>
            <p>Configure market-driven cost escalation factors that affect various repair and maintenance costs.</p>

            <Card style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text>
                        Market factors are multipliers applied to different cost categories. The base escalation rate is always available and cannot be removed.
                    </Text>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenModal()}
                        loading={loading}
                    >
                        Add Market Factor
                    </Button>
                </div>

                <Table
                    dataSource={marketFactorsArray}
                    columns={columns}
                    pagination={false}
                    size="small"
                    rowKey="id"
                    expandable={{
                        expandedRowRender: (record) => <MarketFactorDetail record={record} />,
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

            <Card
                title="Cost Category Factor Assignment"
                style={{ marginBottom: 24 }}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Market factors are multipliers applied to base costs during Monte Carlo simulations.
                    Each cost category can have its own market factor to model different escalation patterns.
                </Text>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                }}>
                    {COST_CATEGORIES.map((category) => {
                        const categoryColor = getMarketFactorColorScheme(category.key);
                        return (
                            <Card
                                key={category.key}
                                size="small"
                                style={{
                                    borderLeft: `4px solid ${categoryColor}`,
                                    borderRadius: '6px',
                                    backgroundColor: '#fafafa'
                                }}
                                bodyStyle={{ padding: '12px' }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: categoryColor, fontSize: 16 }}>
                                            {category.icon}
                                        </span>
                                        <div style={{ flex: 1 }}>
                                            <Text strong>{category.label}</Text>
                                            <div style={{ fontSize: 11, color: '#666', lineHeight: '14px' }}>
                                                {category.description}
                                            </div>
                                        </div>
                                    </div>

                                    <Select
                                        value={costCategoryFactors[category.key]}
                                        onChange={(value) => handleCategoryFactorChange(category.key, value)}
                                        style={{ width: '100%' }}
                                        size="small"
                                        placeholder="Select market factor"
                                        dropdownMatchSelectWidth={true}
                                    >
                                        {marketFactorsArray.map(factor => (
                                            <Option key={factor.id} value={factor.id}>
                                                {factor.name}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </Card>

            <Modal
                title={`${editingKey !== null ? 'Edit' : 'Create'} Market Factor`}
                open={isModalOpen}
                onCancel={handleCloseModal}
                width={500}
                footer={[
                    <Button key="cancel" onClick={handleCloseModal}>
                        Cancel
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={loading}
                        onClick={() => form.submit()}
                    >
                        {editingKey ? 'Save Changes' : 'Create Factor'}
                    </Button>
                ]}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                    requiredMark={false}
                >
                    <Form.Item
                        name="name"
                        label="Factor Name"
                        rules={[
                            { required: true, message: 'Factor name is required' },
                            { min: 3, message: 'Name must be at least 3 characters' },
                            { max: 50, message: 'Name must be less than 50 characters' }
                        ]}
                    >
                        <Input
                            placeholder="e.g., Crane Cost Factor, Local Labor Rates"
                            disabled={editingKey && marketFactorsObject[editingKey]?.id === 'baseEscalationRate'}
                        />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Description"
                        rules={[
                            { max: 200, message: 'Description must be less than 200 characters' }
                        ]}
                    >
                        <Input.TextArea
                            placeholder="Describe what this market factor represents"
                            disabled={editingKey && marketFactorsObject[editingKey]?.id === 'baseEscalationRate'}
                            rows={3}
                        />
                    </Form.Item>

                    <Divider orientation="left" style={{ margin: '16px 0' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Distribution Settings
                        </Text>
                    </Divider>

                    <Alert
                        message="Configure Distribution in Table"
                        description={
                            <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Use the <SettingOutlined /> button in the table to configure the statistical distribution 
                                    for this market factor. Distribution settings are applied immediately to your scenario.
                                </Text>
                            </div>
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: 0 }}
                    />
                </Form>
            </Modal>
        </div>
    );
};

export default MarketFactors;