// src/components/results/cashflow/components/PercentileSelector.jsx - Simplified version
import React, { useState } from 'react';
import { Select, Button, Modal, Form, Row, Col, Typography, Space, Tag, Alert } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
//import { useCashflow } from '../../../../contexts/CashflowContext';
import { useScenario } from '../../../../contexts/ScenarioContext';
import { useCube } from '../../../../contexts/CubeContext';

const { Option } = Select;
const { Text } = Typography;

const PercentileSelector = () => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();
    const availablePercentiles = scenarioData?.settings?.simulation?.percentiles?.map(p => p.value) || [10, 25, 50, 75, 90]
    const primaryPercentile = scenarioData?.settings?.simulation?.primaryPercentile || 50;
    const {
        //availablePercentiles,
        //primaryPercentile,
        getCustomPercentiles,
        selectedPercentile,
        //updatePercentileSelection
    } = useCube();
    const customPercentiles = getCustomPercentiles();

    const updatePercentileSelection = (newSelection) => {
        console.log('🎯 Percentile selection changed:', {
            from: selectedPercentile.strategy,
            to: newSelection.strategy,
            unified: newSelection.value,
            perSourceCount: Object.keys(newSelection.customPercentile || {}).length
        });

        const result = updateByPath(['simulation', 'inputSim', 'cashflow', 'selectedPercentile'], newSelection);
        console.log('⚡ Instant percentile switch - no recomputation needed');
    };


    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const handleUnifiedChange = (value) => {
        updatePercentileSelection({
            ...selectedPercentile,
            strategy: 'unified',
            value: value
        });
    };

    const handleAdvancedSubmit = async () => {
        try {
            const values = await form.validateFields();
            const { strategy, value, ...perSourceValues } = values;

            const newSelection = {
                strategy,
                value: value || primaryPercentile,
                customPercentile: perSourceValues
            };

            if (updatePercentileSelection(newSelection)) {
                setModalVisible(false);
            }
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    if (availablePercentiles.length === 0) {
        return (
            <Alert
                message="No percentiles available"
                type="warning"
                size="small"
            />
        );
    }

    return (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>Percentile Selection</Text>

            <Space>
                <Select
                    value={selectedPercentile?.value || primaryPercentile}
                    onChange={handleUnifiedChange}
                    disabled={selectedPercentile?.strategy !== 'unified'}
                    style={{ minWidth: 120 }}
                >
                    {availablePercentiles.map(percentile => (
                        <Option key={percentile} value={percentile}>
                            P{percentile}
                            {percentile === primaryPercentile && <Tag size="small" color="blue" style={{ marginLeft: 4 }}>Primary</Tag>}
                        </Option>
                    ))}
                </Select>

                <Button
                    icon={<SettingOutlined />}
                    onClick={() => {
                        form.setFieldsValue({
                            strategy: selectedPercentile?.strategy || 'unified',
                            unified: selectedPercentile?.value || primaryPercentile,
                            ...selectedPercentile?.customPercentile
                        });
                        setModalVisible(true);
                    }}
                    size="small"
                    type={selectedPercentile?.strategy === 'perSource' ? 'unified' : 'unified'}
                >
                    Per-Source
                </Button>
            </Space>

            <Text type="secondary" style={{ fontSize: '12px' }}>
                {selectedPercentile?.strategy === 'unified'
                    ? `Unified: P${selectedPercentile.value}`
                    : `Per-Source: ${Object.keys(selectedPercentile?.customPercentile || {}).length} configured`
                }
            </Text>

            {/* Simplified Modal */}
            <Modal
                title="Per-Source Percentile Configuration"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={handleAdvancedSubmit}
                width={500}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="strategy" label="Strategy">
                        <Select>
                            <Option value="unified">Unified - Same percentile for all</Option>
                            <Option value="perSource">Per-Source - Different per source</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) => prev.strategy !== current.strategy}
                    >
                        {({ getFieldValue }) => {
                            const strategy = getFieldValue('strategy');

                            if (strategy === 'unified') {
                                return (
                                    <Form.Item name="unified" label="Unified Percentile">
                                        <Select>
                                            {availablePercentiles.map(p => (
                                                <Option key={p} value={p}>P{p}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                );
                            }

                            return (
                                <Row gutter={[16, 16]}>
                                    {customPercentiles.map(source => (
                                        <Col key={source.id} span={12}>
                                            <Form.Item
                                                name={source.id}
                                                label={source.id}
                                                initialValue={primaryPercentile}
                                            >
                                                <Select>
                                                    {availablePercentiles.map(p => (
                                                        <Option key={p} value={p}>P{p}</Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    ))}
                                </Row>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    );
};

export default PercentileSelector;