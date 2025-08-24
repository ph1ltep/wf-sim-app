// frontend/src/components/forms/failureRates/CostCategoryFactors.jsx
import React, { useMemo } from 'react';
import { Card, Select, Space, Typography, Row, Col, Tag } from 'antd';
import { 
    DollarOutlined,
    UserOutlined,
    ToolOutlined,
    BuildOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';

const { Text } = Typography;
const { Option } = Select;

// Cost category configurations
const COST_CATEGORIES = [
    { 
        key: 'material', 
        label: 'Material', 
        icon: <DollarOutlined />, 
        color: '#1890ff',
        description: 'Component and spare parts costs'
    },
    { 
        key: 'labor', 
        label: 'Labor', 
        icon: <UserOutlined />, 
        color: '#52c41a',
        description: 'Technician and specialist costs'
    },
    { 
        key: 'tooling', 
        label: 'Tooling', 
        icon: <ToolOutlined />, 
        color: '#fa8c16',
        description: 'Equipment and tool rental'
    },
    { 
        key: 'crane', 
        label: 'Crane', 
        icon: <BuildOutlined />, 
        color: '#722ed1',
        description: 'Crane mobilization and operation'
    },
    { 
        key: 'other', 
        label: 'Other', 
        icon: <AppstoreOutlined />, 
        color: '#eb2f96',
        description: 'Additional and contingency costs'
    }
];

const CostCategoryFactors = () => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();
    
    // Get current cost category factors
    const costCategoryFactors = getValueByPath('settings.project.equipment.failureRates.costCategoryFactors', {
        material: 'escalationRate',
        labor: 'escalationRate',
        tooling: 'escalationRate',
        crane: 'escalationRate',
        other: 'escalationRate'
    });
    
    // Get available market factors
    const marketFactors = useMemo(() => {
        return getValueByPath(['settings', 'marketFactors', 'factors'], []).map(factor => ({
            id: factor.id,
            name: factor.name,
            description: factor.description,
            isDefault: factor.isDefault
        }));
    }, [scenarioData?.settings?.marketFactors?.factors, getValueByPath]);
    
    // Handle factor change for a category
    const handleFactorChange = async (category, factorId) => {
        try {
            const updatedFactors = {
                ...costCategoryFactors,
                [category]: factorId
            };
            await updateByPath('settings.project.equipment.failureRates.costCategoryFactors', updatedFactors);
        } catch (error) {
            console.error('Error updating cost category factor:', error);
        }
    };
    
    return (
        <Card 
            title={
                <Space>
                    <Text strong>Cost Category Factor Assignment</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Assign market factors to each repair cost category
                    </Text>
                </Space>
            }
            size="small"
            style={{ marginBottom: 24 }}
        >
            <Row gutter={[16, 16]}>
                {COST_CATEGORIES.map(category => {
                    const currentFactor = marketFactors.find(f => f.id === costCategoryFactors[category.key]);
                    
                    return (
                        <Col key={category.key} xs={24} sm={12} md={8} lg={8} xl={8}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Space>
                                    <span style={{ color: category.color, fontSize: 18 }}>
                                        {category.icon}
                                    </span>
                                    <Text strong>{category.label}</Text>
                                </Space>
                                
                                <Select
                                    value={costCategoryFactors[category.key]}
                                    onChange={(value) => handleFactorChange(category.key, value)}
                                    style={{ width: '100%' }}
                                    size="small"
                                    placeholder="Select market factor"
                                >
                                    {marketFactors.map(factor => (
                                        <Option key={factor.id} value={factor.id}>
                                            <Space>
                                                {factor.isDefault && <Tag color="blue" style={{ margin: 0 }}>Default</Tag>}
                                                <Text>{factor.name}</Text>
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                                
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {category.description}
                                </Text>
                                
                                {currentFactor && (
                                    <Text style={{ fontSize: 11, color: category.color }}>
                                        Using: {currentFactor.name}
                                    </Text>
                                )}
                            </Space>
                        </Col>
                    );
                })}
            </Row>
            
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <strong>Note:</strong> Market factors are multipliers applied to base costs during Monte Carlo simulations. 
                    Each cost category can have its own market factor to model different escalation patterns. 
                    Configure market factors in Economics → Market Factors.
                </Text>
            </div>
        </Card>
    );
};

export default CostCategoryFactors;