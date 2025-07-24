// src/components/results/cashflow/components/PercentileSelector.jsx - Updated for new percentileData system
import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, Form, Row, Col, Typography, Space, Tag, Alert } from 'antd';
import { SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useScenario } from '../../../../contexts/ScenarioContext';
import { useCube } from '../../../../contexts/CubeContext';

const { Option } = Select;
const { Text } = Typography;

const PercentileSelector = () => {
    const { updateByPath } = useScenario();

    // Get percentile data from CubeContext
    const { getPercentileData, setSelectedPercentile, getSourceMetadata, updatePercentileData } = useCube();
    const percentileInfo = getPercentileData();

    // Extract values from percentileInfo (reactive to changes)
    const selectedPercentile = percentileInfo?.selected;
    const availablePercentiles = percentileInfo?.available || [];
    const primaryPercentile = percentileInfo?.primary;
    const customPercentiles = percentileInfo?.custom || {};
    const strategy = percentileInfo?.strategy || 'unified';

    // Get sources that have percentiles for custom mode (from CubeContext, not discovery)
    const percentileSources = React.useMemo(() => {
        // Get source IDs from customPercentiles keys
        const customSourceIds = Object.keys(customPercentiles);

        if (customSourceIds.length === 0) {
            console.log('📋 No custom percentile sources configured');
            return [];
        }

        try {
            // Get metadata for all custom sources using the new getSourceMetadata function
            const sourceMetadata = getSourceMetadata({ sourceIds: customSourceIds });

            // Map to the expected format
            return customSourceIds
                .map(sourceId => {
                    const metadata = sourceMetadata[sourceId];
                    if (!metadata) {
                        console.warn(`⚠️ Metadata not found for source: ${sourceId}`);
                        return null;
                    }

                    return {
                        id: sourceId,
                        name: metadata.name || sourceId
                    };
                })
                .filter(Boolean) // Remove null entries
                .sort((a, b) => a.name.localeCompare(b.name));

        } catch (error) {
            console.error('❌ Error getting source metadata:', error);
            return [];
        }
    }, [customPercentiles, getSourceMetadata]);

    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Update selected percentile
    const handleUnifiedChange = (value) => {
        setSelectedPercentile(value);
    };

    const handleAdvancedSubmit = async () => {
        try {
            const values = await form.validateFields();
            const { strategy, unified, ...perSourceValues } = values;

            console.log('💾 Form values received:', values);
            console.log('📊 Strategy:', strategy);
            console.log('🎯 Per-source values:', perSourceValues);

            // FIXED: Build the correct update object based on PercentileDataSchema
            const updates = {
                strategy: strategy
            };

            // Add selected and custom based on strategy
            if (strategy === 'unified') {
                updates.selected = unified || primaryPercentile;
            } else if (strategy === 'perSource') {
                // Keep current selected value for perSource mode
                // updates.selected stays unchanged
                updates.selected = 0; // Use the virtual 0 for perSource
                updates.custom = perSourceValues; // This is the object like {energyRevenue: 75, escalationRate: 25}
            }

            console.log('🚀 Updating percentileData with:', updates);

            // FIXED: Use the new updatePercentileData function from CubeContext
            if (await updatePercentileData(updates)) {
                setModalVisible(false);
                console.log('✅ Percentile configuration saved successfully');
            } else {
                console.error('❌ Failed to save percentile configuration');
            }
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    // Set form values when modal opens
    const handleModalOpen = () => {
        const formValues = {
            strategy: strategy,
            unified: selectedPercentile || primaryPercentile
        };

        // Add custom percentile values - FIXED: Always populate from customPercentiles
        percentileSources.forEach(source => {
            formValues[source.id] = customPercentiles[source.id] || primaryPercentile;
        });

        console.log('📋 Setting form values:', formValues); // Debug log
        form.setFieldsValue(formValues);
        setModalVisible(true);
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
                    value={selectedPercentile || primaryPercentile}
                    onChange={handleUnifiedChange}
                    disabled={strategy !== 'unified'}
                    style={{ minWidth: 120 }}
                >
                    {availablePercentiles.map(percentile => (
                        <Option key={percentile} value={percentile}>
                            P{percentile}
                            {percentile === primaryPercentile && (
                                <Tag size="small" color="blue" style={{ marginLeft: 4 }}>
                                    Primary
                                </Tag>
                            )}
                        </Option>
                    ))}
                </Select>

                <Button
                    icon={<SettingOutlined />}
                    onClick={handleModalOpen}
                    size="small"
                    type={strategy === 'perSource' ? 'primary' : 'default'}
                >
                    Per-Source
                </Button>
            </Space>

            <Text type="secondary" style={{ fontSize: '12px' }}>
                {strategy === 'unified'
                    ? `Unified: P${selectedPercentile || primaryPercentile}`
                    : `Per-Source: ${Object.keys(customPercentiles).length} configured`
                }
            </Text>

            {/* Modal for advanced configuration */}
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
                            const currentStrategy = getFieldValue('strategy');

                            if (currentStrategy === 'unified') {
                                return (
                                    <Form.Item name="unified" label="Unified Percentile">
                                        <Select>
                                            {availablePercentiles.map(p => (
                                                <Option key={p} value={p}>
                                                    P{p}
                                                    {p === primaryPercentile && (
                                                        <Tag size="small" color="blue" style={{ marginLeft: 4 }}>
                                                            Primary
                                                        </Tag>
                                                    )}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                );
                            }

                            if (percentileSources.length === 0) {
                                return (
                                    <Alert
                                        message="No sources with percentiles found"
                                        description="Custom percentile configuration requires sources with percentile data."
                                        type="info"
                                        size="small"
                                    />
                                );
                            }

                            return (
                                <Row gutter={[16, 16]}>
                                    {percentileSources.map(source => (
                                        <Col key={source.id} span={12}>
                                            <Form.Item
                                                name={source.id}
                                                label={source.name}
                                                initialValue={primaryPercentile}
                                            >
                                                <Select>
                                                    {availablePercentiles.map(p => (
                                                        <Option key={p} value={p}>
                                                            P{p}
                                                            {p === primaryPercentile && (
                                                                <Tag size="small" color="blue" style={{ marginLeft: 4 }}>
                                                                    Primary
                                                                </Tag>
                                                            )}
                                                        </Option>
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