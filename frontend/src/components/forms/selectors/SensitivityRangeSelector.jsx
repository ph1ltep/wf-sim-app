// frontend/src/components/results/cashflow/components/SensitivityRangeSelector.jsx
// Simplified sensitivity range selection

import React, { useMemo } from 'react';
import { Row, Col, Select, Typography, Space } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { discoverPercentiles, createPercentileOptions } from '../../../utils/finance';

const { Text } = Typography;

const SensitivityRangeSelector = ({
    getValueByPath,
    lowerPercentile,
    upperPercentile,
    primaryPercentile,
    onRangeChange,
    disabled = false
}) => {
    // Discover available percentiles
    const percentileData = useMemo(() => {
        return discoverPercentiles(getValueByPath);
    }, [getValueByPath]);

    // Create options for selects
    const percentileOptions = useMemo(() => {
        return createPercentileOptions(percentileData.percentiles);
    }, [percentileData.percentiles]);

    // Calculate confidence level
    const confidenceLevel = upperPercentile - lowerPercentile;

    return (
        <div>
            <Row gutter={[16, 8]}>
                <Col span={8}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Lower Bound</Text>
                        <Select
                            value={lowerPercentile}
                            onChange={(value) => onRangeChange?.(value, upperPercentile)}
                            style={{ width: '100%' }}
                            options={percentileOptions.filter(opt => opt.value < upperPercentile)}
                            disabled={disabled}
                        />
                    </Space>
                </Col>
                <Col span={8}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Upper Bound</Text>
                        <Select
                            value={upperPercentile}
                            onChange={(value) => onRangeChange?.(lowerPercentile, value)}
                            style={{ width: '100%' }}
                            options={percentileOptions.filter(opt => opt.value > lowerPercentile)}
                            disabled={disabled}
                        />
                    </Space>
                </Col>
                <Col span={8}>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>Base Case</Text>
                        <div style={{
                            padding: '4px 11px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            background: '#fafafa'
                        }}>
                            <Text code>P{primaryPercentile} (Primary)</Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {confidenceLevel}% confidence range
                        </Text>
                    </Space>
                </Col>
            </Row>

        </div>
    );
};

export default SensitivityRangeSelector;