/**
 * Failure Rate Summary Card - Overview of component failure configuration
 * Shows enabled components and basic cost estimates
 */

import React from 'react';
import { Card, Typography, Space, Statistic, Row, Col, Progress, Tag } from 'antd';
import { 
    WarningOutlined, 
    CheckCircleOutlined, 
    DollarCircleOutlined,
    ClockCircleOutlined 
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';

const { Text } = Typography;

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

const FailureRateSummaryCard = ({ title = "Failure Rate Summary" }) => {
    const { getValueByPath } = useScenario();
    
    // Get failure rates configuration
    const failureRatesConfig = getValueByPath('settings.project.equipment.failureRates', {
        enabled: false,
        components: []
    });

    // Calculate summary statistics
    const componentsArray = failureRatesConfig.components || [];
    const enabledComponents = componentsArray.filter(component => component.enabled);
    
    const enabledCount = enabledComponents.length;
    const totalCount = Object.keys(COMPONENT_NAMES).length;
    const enabledPercentage = totalCount > 0 ? (enabledCount / totalCount) * 100 : 0;

    // Calculate estimated annual failure probability
    const annualFailureProbability = enabledComponents.reduce((sum, component) => {
        const failureRate = component?.failureRate?.parameters?.value || 
                          component?.failureRate?.parameters?.lambda || 0;
        return sum + failureRate;
    }, 0);

    // Calculate estimated annual cost (simplified)
    const estimatedAnnualCost = enabledComponents.reduce((sum, component) => {
        const failureRate = component?.failureRate?.parameters?.value || 
                          component?.failureRate?.parameters?.lambda || 0;
        const replacementCost = component?.costs?.componentReplacement?.parameters?.value || 500000;
        const craneCost = component?.costs?.craneMobilization?.parameters?.value || 120000;
        
        return sum + (failureRate * (replacementCost + craneCost));
    }, 0);

    // Status determination
    const getStatus = () => {
        if (!failureRatesConfig.enabled) {
            return { status: 'disabled', color: 'default', icon: <WarningOutlined /> };
        }
        if (enabledCount === 0) {
            return { status: 'no components', color: 'warning', icon: <WarningOutlined /> };
        }
        return { status: 'active', color: 'success', icon: <CheckCircleOutlined /> };
    };

    const statusInfo = getStatus();

    // Format large numbers
    const formatCurrency = (value) => {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value.toFixed(0)}`;
    };

    return (
        <Card 
            title={
                <Space>
                    {statusInfo.icon}
                    {title}
                </Space>
            }
            extra={
                <Tag color={statusInfo.color}>
                    {statusInfo.status.toUpperCase()}
                </Tag>
            }
        >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Global Status */}
                <div>
                    <Text type="secondary">Global Status:</Text>
                    <br />
                    <Text strong>
                        {failureRatesConfig.enabled 
                            ? 'Component failure modeling enabled' 
                            : 'Component failure modeling disabled'
                        }
                    </Text>
                </div>

                {/* Component Statistics */}
                <Row gutter={16}>
                    <Col span={12}>
                        <Statistic
                            title="Active Components"
                            value={enabledCount}
                            suffix={`/ ${totalCount}`}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        />
                        <Progress 
                            percent={enabledPercentage} 
                            size="small" 
                            status={enabledCount > 0 ? 'active' : 'exception'}
                            showInfo={false}
                        />
                    </Col>
                    <Col span={12}>
                        <Statistic
                            title="Annual Failure Rate"
                            value={(annualFailureProbability * 100).toFixed(2)}
                            suffix="%"
                            prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                        />
                    </Col>
                </Row>

                {/* Cost Estimate */}
                {enabledCount > 0 && (
                    <Row gutter={16}>
                        <Col span={24}>
                            <Statistic
                                title="Estimated Annual Cost"
                                value={formatCurrency(estimatedAnnualCost)}
                                prefix={<DollarCircleOutlined style={{ color: '#f5222d' }} />}
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                Based on failure rates × (replacement + crane costs)
                            </Text>
                        </Col>
                    </Row>
                )}

                {/* Active Components List */}
                {enabledCount > 0 && (
                    <div>
                        <Text type="secondary">Active Components:</Text>
                        <br />
                        <Space wrap style={{ marginTop: '8px' }}>
                            {enabledComponents.map(component => (
                                <Tag 
                                    key={component.id} 
                                    color="green" 
                                    style={{ margin: '2px' }}
                                >
                                    {component.name}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                )}

                {/* Help Text */}
                {!failureRatesConfig.enabled && (
                    <div style={{ 
                        background: '#fffbe6', 
                        border: '1px solid #ffe58f', 
                        borderRadius: '6px', 
                        padding: '12px' 
                    }}>
                        <Text style={{ fontSize: '12px' }}>
                            Enable component failure modeling to include major component failures 
                            in Monte Carlo simulations and cost calculations.
                        </Text>
                    </div>
                )}

                {failureRatesConfig.enabled && enabledCount === 0 && (
                    <div style={{ 
                        background: '#fff2e8', 
                        border: '1px solid #ffbb96', 
                        borderRadius: '6px', 
                        padding: '12px' 
                    }}>
                        <Text style={{ fontSize: '12px' }}>
                            Component failure modeling is enabled but no components are active. 
                            Enable individual components in the configuration table above.
                        </Text>
                    </div>
                )}
            </Space>
        </Card>
    );
};

export default FailureRateSummaryCard;