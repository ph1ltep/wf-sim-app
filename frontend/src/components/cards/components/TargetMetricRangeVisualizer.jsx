// frontend/src/components/cards/components/TargetMetricRangeVisualizer.jsx
// Completely rewritten - simple and elegant

import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { formatLargeNumber } from '../../../utils/tables/formatting';
import { discoverPercentiles } from '../../../utils/finance';

const { Text } = Typography;

const TargetMetricRangeVisualizer = ({
    sensitivityResults,
    metricConfig,
    selectedRange,
    getValueByPath
}) => {
    const visualData = useMemo(() => {
        if (!sensitivityResults.length || !metricConfig || !getValueByPath) return null;

        // Get all available percentiles from discovery
        const percentileData = discoverPercentiles(getValueByPath);
        const availablePercentiles = percentileData.percentiles || [10, 25, 50, 75, 90];

        // Get actual metric values at each percentile (simplified approximation)
        const allValues = sensitivityResults.flatMap(r => [r.lowValue, r.baseValue, r.highValue]);
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);

        // Create markers for each percentile
        const markers = availablePercentiles.map(percentile => {
            // Linear interpolation based on percentile position
            const value = minValue + (maxValue - minValue) * (percentile / 100);
            const isSelected = percentile === selectedRange.lower || percentile === selectedRange.upper;
            const isBaseline = percentile === 50; // Assuming P50 is baseline

            return {
                percentile,
                value,
                position: ((percentile - Math.min(...availablePercentiles)) / (Math.max(...availablePercentiles) - Math.min(...availablePercentiles))) * 100,
                isSelected,
                isBaseline
            };
        });

        return {
            markers,
            isCurrency: metricConfig.units === 'currency',
            metricLabel: metricConfig.label
        };
    }, [sensitivityResults, metricConfig, selectedRange, getValueByPath]);

    if (!visualData) return null;

    const { markers, isCurrency, metricLabel } = visualData;

    return (
        <div style={{
            marginBottom: 16,
            padding: '12px 0',
            borderBottom: '1px solid #e8e8e8'
        }}>
            <Text strong style={{ fontSize: '12px', color: '#595959', marginBottom: 8, display: 'block' }}>
                {metricLabel} Distribution Across Percentiles
            </Text>

            {/* Percentile bar */}
            <div style={{ position: 'relative', height: 40 }}>
                {/* Base line */}
                <div style={{
                    position: 'absolute',
                    top: 15,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: '#d9d9d9',
                    borderRadius: 1
                }} />

                {/* Markers */}
                {markers.map(({ percentile, value, position, isSelected, isBaseline }) => (
                    <div
                        key={percentile}
                        style={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: 8,
                            transform: 'translateX(-50%)',
                            textAlign: 'center'
                        }}
                    >
                        {/* Marker dot */}
                        <div style={{
                            width: isBaseline ? 8 : isSelected ? 6 : 4,
                            height: isBaseline ? 8 : isSelected ? 6 : 4,
                            background: isBaseline ? '#ff4d4f' : isSelected ? '#1890ff' : '#8c8c8c',
                            borderRadius: '50%',
                            margin: '0 auto 4px',
                            border: isBaseline ? '2px solid #fff' : isSelected ? '1px solid #fff' : 'none',
                            boxShadow: isBaseline || isSelected ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                        }} />

                        {/* Percentile label */}
                        <Text style={{
                            fontSize: '9px',
                            color: isBaseline ? '#ff4d4f' : isSelected ? '#1890ff' : '#8c8c8c',
                            fontWeight: isBaseline || isSelected ? 600 : 400,
                            display: 'block'
                        }}>
                            P{percentile}
                        </Text>

                        {/* Value label */}
                        <Text style={{
                            fontSize: '8px',
                            color: '#595959',
                            display: 'block',
                            marginTop: 2
                        }}>
                            {formatLargeNumber(value, { currency: isCurrency, precision: 0 })}
                        </Text>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TargetMetricRangeVisualizer;