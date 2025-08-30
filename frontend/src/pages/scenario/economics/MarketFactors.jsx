// frontend/src/pages/scenario/economics/MarketFactors.jsx
import React, { useState, useMemo } from 'react';
import { Typography, Alert, Table, Button, Modal, Input, Space, Popconfirm, message, Card, Divider, Form, Select } from 'antd';
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
    const [editingIndex, setEditingIndex] = useState(null);
    const [loading, setLoading] = useState(false);

    // Get market factors array
    const marketFactorsArray = useMemo(() => {
        return getValueByPath(['settings', 'marketFactors', 'factors'], DEFAULT_MARKET_FACTORS);
    }, [scenarioData?.settings?.marketFactors?.factors, getValueByPath]);

    // Clean up invalid market factors on component mount
    React.useEffect(() => {
        const cleanupInvalidFactors = async () => {
            const factors = getValueByPath(['settings', 'marketFactors', 'factors'], []);
            let needsCleanup = false;

            // Filter out invalid factors
            const validFactors = factors.filter(factor => 
                factor && factor.id && factor.name && factor.distribution
            );

            if (validFactors.length !== factors.length) {
                needsCleanup = true;
            }

            // Ensure baseEscalationRate exists
            const hasBaseEscalationRate = validFactors.some(f => f.id === 'baseEscalationRate');
            if (!hasBaseEscalationRate) {
                validFactors.unshift(DEFAULT_MARKET_FACTORS[0]);
                needsCleanup = true;
            }

            if (needsCleanup) {
                try {
                    await updateByPath(['settings', 'marketFactors', 'factors'], validFactors);
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
    const handleOpenModal = async (factorIndex = null) => {
        if (factorIndex !== null) {
            // Edit existing factor
            setEditingIndex(factorIndex);
            setIsModalOpen(true);
        } else {
            // Create new factor
            const newFactorId = generateFactorId();
            const currentFactors = getValueByPath(['settings', 'marketFactors', 'factors'], []);
            
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
            
            const updatedFactors = [...currentFactors, newFactor];
            
            try {
                setLoading(true);
                await updateByPath(['settings', 'marketFactors', 'factors'], updatedFactors);
                setEditingIndex(updatedFactors.length - 1);
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
        setEditingIndex(null);
    };

    // Handle delete
    const handleDelete = async (factorIndex) => {
        try {
            const currentFactors = getValueByPath(['settings', 'marketFactors', 'factors'], []);
            const factorToDelete = currentFactors[factorIndex];
            
            // Remove factor from array
            const updatedFactors = currentFactors.filter((_, index) => index !== factorIndex);
            
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
            
            await updateByPath(['settings', 'marketFactors', 'factors'], updatedFactors);
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
            render: (_, record, index) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(index)}
                        size="small"
                    />
                    {!record.isDefault && (
                        <Popconfirm
                            title="Delete Market Factor"
                            description="Are you sure you want to delete this market factor?"
                            onConfirm={() => handleDelete(index)}
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
                                await updateByPath(['settings', 'marketFactors', 'factors'], DEFAULT_MARKET_FACTORS);
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
                title={`${editingIndex !== null && marketFactorsArray[editingIndex]?.id === 'baseEscalationRate' ? 'Edit' : editingIndex !== null ? 'Edit' : 'Create'} Market Factor`}
                open={isModalOpen}
                onCancel={handleCloseModal}
                width={900}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Close
                    </Button>
                ]}
            >
                {editingIndex !== null && marketFactorsArray[editingIndex] && (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Form layout="vertical" style={{ marginBottom: 0 }}>
                            <Form.Item label="Factor Name" style={{ marginBottom: 16 }}>
                                <Input
                                    value={marketFactorsArray[editingIndex]?.name || ''}
                                    onChange={(e) => updateByPath(['settings', 'marketFactors', 'factors', editingIndex, 'name'], e.target.value)}
                                    placeholder="e.g., Crane Cost Factor, Local Labor Rates"
                                    disabled={marketFactorsArray[editingIndex]?.id === 'baseEscalationRate'}
                                />
                            </Form.Item>

                            <Form.Item label="Description" style={{ marginBottom: 16 }}>
                                <Input.TextArea
                                    value={marketFactorsArray[editingIndex]?.description || ''}
                                    onChange={(e) => updateByPath(['settings', 'marketFactors', 'factors', editingIndex, 'description'], e.target.value)}
                                    placeholder="Describe what this market factor represents"
                                    disabled={marketFactorsArray[editingIndex]?.id === 'baseEscalationRate'}
                                    rows={2}
                                />
                            </Form.Item>
                        </Form>

                        <Divider style={{ margin: '12px 0' }} />

                        <div>
                            <Text strong style={{ display: 'block', marginBottom: 12 }}>Factor Distribution</Text>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                                Configure the distribution for this market factor (base value should be 1.0 for multipliers)
                            </Text>
                            
                            <DistributionFieldV3
                                path={['settings', 'marketFactors', 'factors', editingIndex, 'distribution']}
                                showVisualization={true}
                                showInfoBox={true}
                                valueType="number"
                                valueName="Base Multiplier"
                                step={0.01}
                                showTitle={false}
                                options={distributionTypes}
                            />
                        </div>
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default MarketFactors;