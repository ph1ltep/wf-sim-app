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
import { getMarketFactorColorScheme } from 'utils/charts/colors';
import { CORE_COST_CATEGORIES, COST_CATEGORY_MAP } from '../../../constants/costCategories';

const { Text } = Typography;
const { Option } = Select;

// Icon mapping for the core cost categories (5 categories used in repair packages)
const CORE_CATEGORY_ICONS = {
    material: <DollarOutlined />,
    labor: <UserOutlined />,
    tooling: <ToolOutlined />,
    crane: <BuildOutlined />,
    other: <AppstoreOutlined />
};

const CostCategoryFactors = () => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();
    
    // Get current cost category factors
    const costCategoryFactors = getValueByPath('settings.project.economics.marketFactors.costCategoryFactors', {
        material: 'baseEscalationRate',
        labor: 'baseEscalationRate',
        tooling: 'baseEscalationRate',
        crane: 'baseEscalationRate',
        contractsLocal: 'baseEscalationRate',
        contractsForeign: 'baseEscalationRate',
        other: 'baseEscalationRate'
    });
    
    // Get available market factors from dynamic object structure
    const marketFactors = useMemo(() => {
        const marketFactorsObject = getValueByPath(['settings', 'project', 'economics', 'marketFactors', 'factors'], {});
        // Convert object values to array, filtering out non-object entries
        return Object.values(marketFactorsObject || {})
            .filter(factor => factor && typeof factor === 'object' && factor.id)
            .map(factor => ({
                id: factor.id,
                name: factor.name,
                description: factor.description,
                isDefault: factor.isDefault
            }));
    }, [scenarioData?.settings?.project?.economics?.marketFactors?.factors, getValueByPath]);
    
    // Handle factor change for a category
    const handleFactorChange = async (category, factorId) => {
        try {
            const updatedFactors = {
                ...costCategoryFactors,
                [category]: factorId
            };
            await updateByPath('settings.project.economics.marketFactors.costCategoryFactors', updatedFactors);
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
                {CORE_COST_CATEGORIES.map(category => {
                    const currentFactor = marketFactors.find(f => f.id === costCategoryFactors[category.key]);
                    
                    return (
                        <Col key={category.key} xs={24} sm={12} md={8} lg={8} xl={8}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Space>
                                    <span style={{ color: getMarketFactorColorScheme(category.key), fontSize: 18 }}>
                                        {CORE_CATEGORY_ICONS[category.key]}
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
                                    <Text style={{ fontSize: 11, color: getMarketFactorColorScheme(category.key) }}>
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