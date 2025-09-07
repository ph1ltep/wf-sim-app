/**
 * Quantity Configuration Component
 * Handles component quantity calculation with reactive numWTGs dependency
 */

import React, { useMemo } from 'react';
import { Card, Row, Col, Select, InputNumber, Space, Typography, Alert } from 'antd';
import { CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { ContextField } from 'components/contextFields';
import { useScenario } from 'contexts/ScenarioContext';

const { Text } = Typography;
const { Option } = Select;

// Quantity mode options
const QUANTITY_MODES = [
    {
        value: 'fixed',
        label: 'Fixed Quantity',
        description: 'Use a fixed number of components regardless of turbine count'
    },
    {
        value: 'perTurbine',
        label: 'Per Turbine',
        description: 'Multiply by number of wind turbines (numWTGs)'
    },
    {
        value: 'perBlade',
        label: 'Per Blade (×3)',
        description: 'Three components per turbine (e.g., blade bearings, blades)'
    }
];

/**
 * Computed Quantity Display Component
 */
const ComputedQuantityDisplay = ({ componentId, quantityConfig, numWTGs }) => {
    const computedQuantity = useMemo(() => {
        if (!quantityConfig) return 0;
        
        const { mode, value } = quantityConfig;
        
        switch (mode) {
            case 'perTurbine':
                return (value || 0) * (numWTGs || 0);
            case 'perBlade':
                return (value || 0) * (numWTGs || 0) * 3;
            case 'fixed':
            default:
                return value || 0;
        }
    }, [quantityConfig, numWTGs]);
    
    const getCalculationDisplay = () => {
        if (!quantityConfig) return 'No configuration';
        
        const { mode, value } = quantityConfig;
        
        switch (mode) {
            case 'perTurbine':
                return `${value || 0} × ${numWTGs || 0} turbines = ${computedQuantity}`;
            case 'perBlade':
                return `${value || 0} × ${numWTGs || 0} turbines × 3 blades = ${computedQuantity}`;
            case 'fixed':
            default:
                return `Fixed: ${value || 0}`;
        }
    };
    
    return (
        <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f0f2f5', 
            borderRadius: '4px',
            border: '1px solid #d9d9d9'
        }}>
            <Space>
                <CalculatorOutlined style={{ color: '#1890ff' }} />
                <div>
                    <Text strong style={{ color: '#1890ff' }}>
                        Computed Quantity: {computedQuantity}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {getCalculationDisplay()}
                    </Text>
                </div>
            </Space>
        </div>
    );
};

/**
 * Quantity Configuration Component
 * @param {string} componentId - Component ID for context path
 * @param {string} title - Section title
 */
const QuantityConfiguration = ({
    componentId,
    title = "Quantity Configuration"
}) => {
    const { getValueByPath } = useScenario();
    
    // Get current values from context
    const quantityConfig = getValueByPath([
        'settings', 'project', 'equipment', 'failureRates', 'components', componentId, 'quantityConfig'
    ], { mode: 'fixed', value: 1 });
    
    const numWTGs = getValueByPath(['settings', 'project', 'layout', 'numWTGs'], 20);
    
    // Base context path for quantity configuration
    const basePath = [
        'settings', 'project', 'equipment', 'failureRates', 'components', componentId, 'quantityConfig'
    ];
    
    return (
        <Card size="small" style={{ marginTop: 16 }} title={title}>
            <Row gutter={16} align="top">
                <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Quantity Mode</Text>
                        <div style={{ marginTop: 4 }}>
                            <ContextField
                                path={[...basePath, 'mode']}
                                component={Select}
                                style={{ width: '100%' }}
                                placeholder="Select quantity mode"
                            >
                                {QUANTITY_MODES.map(mode => (
                                    <Option key={mode.value} value={mode.value}>
                                        <div>
                                            <div>{mode.label}</div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {mode.description}
                                            </Text>
                                        </div>
                                    </Option>
                                ))}
                            </ContextField>
                        </div>
                    </div>
                </Col>
                
                <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>
                            {quantityConfig.mode === 'fixed' ? 'Fixed Quantity' : 
                             quantityConfig.mode === 'perTurbine' ? 'Quantity per Turbine' :
                             'Quantity per Blade'}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                            <ContextField
                                path={[...basePath, 'value']}
                                component={InputNumber}
                                style={{ width: '100%' }}
                                min={0}
                                step={1}
                                placeholder="Enter quantity"
                            />
                        </div>
                    </div>
                </Col>
            </Row>
            
            <ComputedQuantityDisplay 
                componentId={componentId}
                quantityConfig={quantityConfig}
                numWTGs={numWTGs}
            />
            
            <Alert
                message="Quantity Calculation"
                description={
                    <div>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text style={{ fontSize: 11 }}>
                                <strong>Current Project:</strong> {numWTGs} wind turbines
                            </Text>
                            <Text style={{ fontSize: 11 }}>
                                Quantity updates automatically when the number of turbines changes
                            </Text>
                            <Text style={{ fontSize: 11 }}>
                                This quantity is used in Monte Carlo simulations to calculate component failure events
                            </Text>
                        </Space>
                    </div>
                }
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginTop: 12, fontSize: 11 }}
            />
        </Card>
    );
};

export default QuantityConfiguration;