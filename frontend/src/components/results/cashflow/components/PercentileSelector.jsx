// src/components/results/cashflow/components/PercentileSelector.jsx - Simplified version
import React, { useState } from 'react';
import { Select, Button, Modal, Form, Row, Col, Typography, Space, Tag, Alert } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useCashflow } from '../../../../contexts/CashflowContext';

const { Option } = Select;
const { Text } = Typography;

const PercentileSelector = () => {
    const {
        availablePercentiles,
        primaryPercentile,
        percentileSources,
        selectedPercentiles,
        updatePercentileSelection
    } = useCashflow();

    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const handleUnifiedChange = (value) => {
        updatePercentileSelection({
            ...selectedPercentiles,
            strategy: 'unified',
            unified: value
        });
    };

    const handleAdvancedSubmit = async () => {
        try {
            const values = await form.validateFields();
            const { strategy, unified, ...perSourceValues } = values;

            const newSelection = {
                strategy,
                unified: unified || primaryPercentile,
                perSource: perSourceValues
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
                    value={selectedPercentiles?.unified || primaryPercentile}
                    onChange={handleUnifiedChange}
                    disabled={selectedPercentiles?.strategy !== 'unified'}
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
                            strategy: selectedPercentiles?.strategy || 'unified',
                            unified: selectedPercentiles?.unified || primaryPercentile,
                            ...selectedPercentiles?.perSource
                        });
                        setModalVisible(true);
                    }}
                    size="small"
                    type={selectedPercentiles?.strategy === 'perSource' ? 'primary' : 'default'}
                >
                    Per-Source
                </Button>
            </Space>

            <Text type="secondary" style={{ fontSize: '12px' }}>
                {selectedPercentiles?.strategy === 'unified'
                    ? `Unified: P${selectedPercentiles.unified}`
                    : `Per-Source: ${Object.keys(selectedPercentiles?.perSource || {}).length} configured`
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
                                    {percentileSources.map(source => (
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