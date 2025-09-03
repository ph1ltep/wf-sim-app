// frontend/src/pages/scenario/economics/MarketFactors.jsx
import React, { useState, useMemo } from 'react';
import { Typography, Alert, Table, Button, Modal, Space, Popconfirm, message, Card, Select, Input, Divider, Form } from 'antd';
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
    GlobalOutlined
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { DistributionFieldV3 } from 'components/distributionFields';
import ContextForm from 'components/forms/ContextForm';
import { ContextField } from 'components/contextFields';
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

const MarketFactors = () => {
    const { scenarioData, updateByPath, getValueByPath } = useScenario();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const [loading, setLoading] = useState(false);

    // Get market factors object and convert to array for table display
    const marketFactorsObject = useMemo(() => {
        const factors = getValueByPath(['settings', 'marketFactors'], {});
        console.log('📊 MarketFactors table data updated:', { factors });
        return factors;
    }, [scenarioData?.settings?.marketFactors, getValueByPath]);

    const marketFactorsArray = useMemo(() => {
        return Object.values(marketFactorsObject);
    }, [marketFactorsObject]);

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
    const handleOpenModal = async (factorKey = null) => {
        if (factorKey !== null) {
            // Edit existing factor - log the data being edited
            const marketFactorData = getValueByPath(['settings', 'marketFactors', factorKey]);
            console.log('🚀 Opening modal for editing:', { 
                factorKey, 
                path: ['settings', 'marketFactors', factorKey],
                data: marketFactorData 
            });
            
            setEditingKey(factorKey);
            setIsModalOpen(true);
        } else {
            // Create new factor
            const newFactorId = generateFactorId();
            const currentFactors = getValueByPath(['settings', 'marketFactors'], {});

            const newFactor = {
                id: newFactorId,
                name: 'New Market Factor',
                description: '',
                distribution: {
                    key: newFactorId,
                    type: 'fixed',
                    timeSeriesMode: false,
                    parameters: {
                        value: 1.0,
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

            try {
                setLoading(true);
                await updateByPath(['settings', 'marketFactors'], updatedFactors);
                setEditingKey(newFactorId);
                setIsModalOpen(true);
                message.success('New market factor created');
            } catch (error) {
                console.error('Error creating market factor:', error);
                message.error('Failed to create market factor');
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingKey(null);
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
            render: (text, record, index) => (
                <Space>
                    {record.isDefault && <LockOutlined style={{ color: '#1890ff' }} />}
                    <Text strong={record.isDefault}>{text}</Text>
                </Space>
            )
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
            render: (distribution) => distribution?.type || 'Fixed',
            width: 150
        },
        {
            title: 'Base Value',
            dataIndex: 'distribution',
            key: 'baseValue',
            render: (distribution) => {
                const value = distribution?.parameters?.value || 1.0;
                const drift = distribution?.parameters?.drift || 0;
                if (drift !== 0) {
                    return `${value.toFixed(2)} (${drift > 0 ? '+' : ''}${drift}% p.a.)`;
                }
                return value.toFixed(2);
            },
            width: 150
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record.id)}
                        size="small"
                    />
                    {!record.isDefault && (
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
                    )}
                </Space>
            )
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
                    <Space>
                        <Button
                            type="dashed"
                            size="small"
                            onClick={async () => {
                                const defaultFactorsObject = DEFAULT_MARKET_FACTORS.reduce((acc, factor) => {
                                    acc[factor.id] = factor;
                                    return acc;
                                }, {});
                                await updateByPath(['settings', 'marketFactors'], defaultFactorsObject);
                                message.success('Market factors reset to defaults');
                            }}
                            title="Reset to only the default escalation rate"
                        >
                            Reset to Defaults
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal()}
                            loading={loading}
                        >
                            Add Market Factor
                        </Button>
                    </Space>
                </div>

                <Table
                    dataSource={marketFactorsArray}
                    columns={columns}
                    pagination={false}
                    size="small"
                    rowKey="id"
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
                title={`${editingKey !== null && marketFactorsObject[editingKey]?.id === 'baseEscalationRate' ? 'Edit' : editingKey !== null ? 'Edit' : 'Create'} Market Factor`}
                open={isModalOpen}
                onCancel={handleCloseModal}
                width={900}
                footer={null} // Let ContextForm handle the footer
            >
                {editingKey !== null && marketFactorsObject[editingKey] && (
                    <ContextForm
                        path={['settings', 'marketFactors', editingKey]}
                        onSubmit={(values) => {
                            message.success('Market factor updated successfully');
                            handleCloseModal();
                        }}
                        onCancel={handleCloseModal}
                        submitText="Save Changes"
                        cancelText="Cancel"
                    >
                        {/* Hidden ID Field - required for market factor */}
                        <ContextField
                            path="id"
                            component={Input}
                            style={{ display: 'none' }}
                            defaultValue={marketFactorsObject[editingKey]?.id}
                        />

                        {/* Hidden isDefault Field - preserve lock status */}
                        <ContextField
                            path="isDefault"
                            component={Input}
                            style={{ display: 'none' }}
                            defaultValue={marketFactorsObject[editingKey]?.isDefault}
                        />

                        {/* Factor Name Field */}
                        <ContextField
                            path="name"
                            component={Input}
                            label="Factor Name"
                            placeholder="e.g., Crane Cost Factor, Local Labor Rates"
                            disabled={marketFactorsObject[editingKey]?.id === 'baseEscalationRate'}
                            required={true}
                            rules={[
                                { required: true, message: 'Factor name is required' },
                                { min: 3, message: 'Name must be at least 3 characters' },
                                { max: 50, message: 'Name must be less than 50 characters' }
                            ]}
                            style={{ marginBottom: 16 }}
                        />

                        {/* Description Field */}
                        <ContextField
                            path="description"
                            component={Input.TextArea}
                            label="Description"
                            placeholder="Describe what this market factor represents"
                            disabled={marketFactorsObject[editingKey]?.id === 'baseEscalationRate'}
                            rows={2}
                            rules={[
                                { max: 200, message: 'Description must be less than 200 characters' }
                            ]}
                            style={{ marginBottom: 16 }}
                        />

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Distribution Configuration Section */}
                        <div style={{ marginTop: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>Factor Distribution</Text>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                                Configure the distribution for this market factor (base value should be 1.0 for multipliers)
                            </Text>

                            {/* DistributionFieldV3 with form mode - will automatically receive form props */}
                            <DistributionFieldV3
                                path="distribution"
                                showVisualization={true}
                                showInfoBox={true}
                                valueType="number"
                                valueName="Base Multiplier"
                                step={0.01}
                                showTitle={false}
                                options={distributionTypes}
                            />
                        </div>
                    </ContextForm>
                )}
            </Modal>
        </div>
    );
};

export default MarketFactors;