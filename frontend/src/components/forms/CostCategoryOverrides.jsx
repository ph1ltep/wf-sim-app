/**
 * Cost Category Override Component
 * Allows overriding repair package cost categories with distributions
 */

import React, { useMemo } from 'react';
import { Card, Row, Col, Space, Typography, Divider, Alert } from 'antd';
import { DollarOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import { DistributionFieldV3 } from 'components/distributionFields';
import { getMarketFactorColorScheme } from 'utils/charts/colors';
import { useScenario } from 'contexts/ScenarioContext';

const { Text } = Typography;

// Cost category definitions with icons and theming
const COST_CATEGORIES = [
    {
        key: 'material',
        label: 'Material Costs',
        description: 'Component replacement and material costs',
        icon: <DollarOutlined />,
        addonAfter: 'EUR'
    },
    {
        key: 'labor',
        label: 'Labor Costs',
        description: 'Direct labor and specialist technician costs',
        icon: <UserOutlined />,
        addonAfter: 'EUR'
    },
    {
        key: 'tooling',
        label: 'Tooling & Equipment',
        description: 'Special tools and equipment rental',
        icon: <ToolOutlined />,
        addonAfter: 'EUR'
    },
    {
        key: 'crane',
        label: 'Crane Operations',
        description: 'Crane mobilization and daily rental costs',
        icon: <ToolOutlined />,
        addonAfter: 'EUR'
    },
    {
        key: 'other',
        label: 'Other Costs',
        description: 'Miscellaneous costs not covered elsewhere',
        icon: <DollarOutlined />,
        addonAfter: 'EUR'
    }
];

/**
 * Cost Category Override Row Component
 */
const CostCategoryRow = ({ category, componentId, repairPackageCost, basePath }) => {
    const categoryColor = getMarketFactorColorScheme(category.key);
    const overridePath = [...basePath, 'costOverrides', category.key];
    
    return (
        <Row align="middle" gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
                <Space>
                    <span style={{ color: categoryColor, fontSize: 16 }}>
                        {category.icon}
                    </span>
                    <div>
                        <Text strong>{category.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {category.description}
                        </Text>
                    </div>
                </Space>
            </Col>
            
            <Col span={6}>
                <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Base Package Cost:
                    </Text>
                    <br />
                    <Text style={{ fontFamily: 'monospace' }}>
                        {repairPackageCost ? 
                            `€${repairPackageCost.toLocaleString()}` : 
                            'Not configured'
                        }
                    </Text>
                </div>
            </Col>
            
            <Col span={10}>
                <div style={{ backgroundColor: '#fafafa', padding: '8px', borderRadius: '4px' }}>
                    <DistributionFieldV3
                        path={overridePath}
                        showVisualization={false}
                        showInfoBox={false}
                        valueType="currency"
                        valueName={`${category.label} Override`}
                        compact={true}
                        allowZero={true}
                        placeholder="No override (use package cost)"
                        addonAfter={category.addonAfter}
                        options={[
                            { value: 'fixed', label: 'Fixed Cost' },
                            { value: 'normal', label: 'Normal Distribution' },
                            { value: 'lognormal', label: 'Log-Normal' },
                            { value: 'triangular', label: 'Triangular' },
                            { value: 'uniform', label: 'Uniform' }
                        ]}
                        tooltip={`Override ${category.label.toLowerCase()} from the repair package. Set to 0 to exclude this cost category entirely.`}
                    />
                </div>
            </Col>
        </Row>
    );
};

/**
 * Cost Category Overrides Component
 * @param {string} componentId - Component ID for context path
 * @param {Object} repairPackageSnapshot - Current repair package data
 * @param {string} title - Section title
 * @param {boolean} collapsed - Initial collapsed state
 */
const CostCategoryOverrides = ({
    componentId,
    repairPackageSnapshot = null,
    title = "Cost Category Overrides",
    collapsed = false
}) => {
    const { getValueByPath } = useScenario();
    
    // Base context path for this component's repair config
    const basePath = [
        'settings', 'project', 'equipment', 'failureRates', 'components', componentId, 'repairConfig'
    ];
    
    // Get current overrides
    const currentOverrides = getValueByPath([...basePath, 'costOverrides'], {});
    
    // Calculate override summary
    const overrideSummary = useMemo(() => {
        const overrideCount = Object.keys(currentOverrides).filter(key => 
            currentOverrides[key] && currentOverrides[key].parameters?.value !== undefined
        ).length;
        
        return { overrideCount };
    }, [currentOverrides]);
    
    if (!repairPackageSnapshot) {
        return (
            <Card size="small" style={{ marginTop: 16 }}>
                <Alert
                    message="No Repair Package Selected"
                    description="Select a repair package to configure cost category overrides."
                    type="info"
                    showIcon
                />
            </Card>
        );
    }
    
    return (
        <Card 
            size="small" 
            style={{ marginTop: 16 }}
            title={
                <Space>
                    <span>{title}</span>
                    {overrideSummary.overrideCount > 0 && (
                        <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                            ({overrideSummary.overrideCount} overrides active)
                        </Text>
                    )}
                </Space>
            }
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Override specific cost categories from the <strong>{repairPackageSnapshot.name}</strong> repair package. 
                    Leave blank to use package defaults, or set to 0 to exclude the category entirely.
                </Text>
            </div>
            
            <div>
                {COST_CATEGORIES.map((category, index) => {
                    const packageCost = repairPackageSnapshot.costs?.[category.key];
                    const totalPackageCost = (packageCost?.perEventEUR || 0) + (packageCost?.perDayEUR || 0);
                    
                    return (
                        <div key={category.key}>
                            <CostCategoryRow
                                category={category}
                                componentId={componentId}
                                repairPackageCost={totalPackageCost}
                                basePath={basePath}
                            />
                            {index < COST_CATEGORIES.length - 1 && (
                                <Divider style={{ margin: '12px 0' }} />
                            )}
                        </div>
                    );
                })}
            </div>
            
            <Alert
                message="Cost Override Notes"
                description={
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        <li>Overrides replace the entire cost from the repair package</li>
                        <li>Set to 0 to completely exclude a cost category</li>
                        <li>Use distributions to model cost uncertainty</li>
                        <li>Changes apply immediately to Monte Carlo simulations</li>
                    </ul>
                }
                type="info"
                showIcon={false}
                style={{ marginTop: 16, fontSize: 11 }}
            />
        </Card>
    );
};

export default CostCategoryOverrides;