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

        // Get percentile discovery data
        const percentileData = discoverPercentiles(getValueByPath);
        const availablePercentiles = percentileData.availableValues || [10, 25, 50, 75, 90];

        // ✅ NEW: Get target metric values from sensitivity results
        // Find the min/max target metric values across all variables for scale
        const allTargetValues = sensitivityResults.flatMap(r => [
            r.lowTargetValue,
            r.baseTargetValue,
            r.highTargetValue
        ]);
        const minTargetValue = Math.min(...allTargetValues);
        const maxTargetValue = Math.max(...allTargetValues);
        const targetValueRange = maxTargetValue - minTargetValue;

        // Create markers for each percentile using TARGET METRIC VALUES
        const markers = availablePercentiles.map(percentile => {
            // ✅ NEW: Get target metric value for this percentile
            // We'll approximate based on the range - in a real implementation,
            // you'd want to run the sensitivity analysis for each percentile
            let targetValue;

            if (percentile === selectedRange.lower) {
                // Use the average low target value across all variables
                targetValue = sensitivityResults.reduce((sum, r) => sum + r.lowTargetValue, 0) / sensitivityResults.length;
            } else if (percentile === selectedRange.upper) {
                // Use the average high target value across all variables
                targetValue = sensitivityResults.reduce((sum, r) => sum + r.highTargetValue, 0) / sensitivityResults.length;
            } else if (percentile === 50) {
                // Use the average base target value across all variables
                targetValue = sensitivityResults.reduce((sum, r) => sum + r.baseTargetValue, 0) / sensitivityResults.length;
            } else {
                // Linear interpolation for other percentiles
                const baseValue = sensitivityResults.reduce((sum, r) => sum + r.baseTargetValue, 0) / sensitivityResults.length;
                if (percentile < 50) {
                    const lowValue = sensitivityResults.reduce((sum, r) => sum + r.lowTargetValue, 0) / sensitivityResults.length;
                    const ratio = (50 - percentile) / (50 - selectedRange.lower);
                    targetValue = baseValue - ((baseValue - lowValue) * ratio);
                } else {
                    const highValue = sensitivityResults.reduce((sum, r) => sum + r.highTargetValue, 0) / sensitivityResults.length;
                    const ratio = (percentile - 50) / (selectedRange.upper - 50);
                    targetValue = baseValue + ((highValue - baseValue) * ratio);
                }
            }

            // Position based on target metric value relative to our display range
            const position = targetValueRange > 0 ? ((targetValue - minTargetValue) / targetValueRange) * 100 : 50;

            const isSelected = percentile === selectedRange.lower || percentile === selectedRange.upper;
            const isBaseline = percentile === 50;

            return {
                percentile,
                value: targetValue, // ✅ NOW: This is the target metric value
                position: Math.max(0, Math.min(100, position)),
                isSelected,
                isBaseline
            };
        });

        // Find selected range markers for the connecting bar
        const lowerMarker = markers.find(m => m.percentile === selectedRange.lower);
        const upperMarker = markers.find(m => m.percentile === selectedRange.upper);

        return {
            markers,
            lowerMarker,
            upperMarker,
            isCurrency: metricConfig.units === 'currency',
            metricLabel: metricConfig.label,
            minTargetValue,
            maxTargetValue,
            targetValueRange
        };
    }, [sensitivityResults, metricConfig, selectedRange, getValueByPath]);

    if (!visualData) return null;

    const { markers, lowerMarker, upperMarker, isCurrency, metricLabel, minTargetValue, maxTargetValue } = visualData;

    // Container padding to ensure labels fit
    const containerPadding = 40;
    const barHeight = 12;
    const markerSize = 16;

    return (
        <div style={{
            marginBottom: 24,
            padding: '16px 0',
            borderBottom: '1px solid #e8e8e8'
        }}>
            {/* Title */}
            <Text strong style={{
                fontSize: '13px',
                color: '#262626',
                marginBottom: 16,
                display: 'block',
                fontWeight: 600
            }}>
                {metricLabel} Distribution Range
            </Text>

            {/* Scale indicators */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: `0 ${containerPadding}px`,
                marginBottom: 8
            }}>
                <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                    {formatLargeNumber(minTargetValue, { currency: isCurrency, precision: 1 })}
                </Text>
                <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                    {formatLargeNumber(maxTargetValue, { currency: isCurrency, precision: 1 })}
                </Text>
            </div>

            {/* Visualization Container */}
            <div style={{
                position: 'relative',
                height: 80,
                padding: `0 ${containerPadding}px`,
                marginTop: 8
            }}>
                {/* Main range bar */}
                <div style={{
                    position: 'absolute',
                    top: 35,
                    left: containerPadding,
                    right: containerPadding,
                    height: barHeight,
                    background: 'linear-gradient(90deg, #f0f0f0 0%, #e6e6e6 50%, #f0f0f0 100%)',
                    borderRadius: barHeight / 2,
                    border: '1px solid #d9d9d9',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                }} />

                {/* Selected range connector bar */}
                {lowerMarker && upperMarker && (
                    <div style={{
                        position: 'absolute',
                        top: 38,
                        left: `${containerPadding + (lowerMarker.position * (100 - 2 * containerPadding) / 100)}px`,
                        width: `${Math.abs(upperMarker.position - lowerMarker.position) * (100 - 2 * containerPadding) / 100}px`,
                        height: 6,
                        background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
                        borderRadius: 3,
                        boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
                    }} />
                )}

                {/* Markers */}
                {markers.map(({ percentile, value, position, isSelected, isBaseline }) => {
                    const leftPosition = containerPadding + (position * (100 - 2 * containerPadding) / 100);

                    return (
                        <div key={percentile} style={{
                            position: 'absolute',
                            left: leftPosition,
                            transform: 'translateX(-50%)',
                            textAlign: 'center'
                        }}>
                            {/* P-value label on top */}
                            <Text style={{
                                fontSize: '10px',
                                color: isBaseline ? '#ff4d4f' : isSelected ? '#1890ff' : '#8c8c8c',
                                fontWeight: isBaseline || isSelected ? 600 : 500,
                                display: 'block',
                                marginBottom: 4,
                                textShadow: isBaseline || isSelected ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                            }}>
                                P{percentile}
                            </Text>

                            {/* Marker dot */}
                            <div style={{
                                width: markerSize,
                                height: markerSize,
                                background: isBaseline
                                    ? 'linear-gradient(135deg, #ff4d4f, #ff7875)'
                                    : isSelected
                                        ? 'linear-gradient(135deg, #1890ff, #40a9ff)'
                                        : 'linear-gradient(135deg, #8c8c8c, #bfbfbf)',
                                borderRadius: '50%',
                                margin: '0 auto',
                                border: '2px solid #fff',
                                boxShadow: isBaseline || isSelected
                                    ? '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
                                    : '0 2px 4px rgba(0,0,0,0.12)',
                                position: 'relative',
                                top: 35 - markerSize / 2 + barHeight / 2,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }} />

                            {/* Target metric value label below */}
                            <Text style={{
                                fontSize: '9px',
                                color: '#595959',
                                display: 'block',
                                marginTop: 8,
                                fontWeight: 500,
                                background: 'rgba(255,255,255,0.9)',
                                padding: '2px 4px',
                                borderRadius: 2,
                                border: '1px solid #f0f0f0'
                            }}>
                                {formatLargeNumber(value, { currency: isCurrency, precision: 1 })}
                            </Text>
                        </div>
                    );
                })}
            </div>

            {/* Range summary */}
            {lowerMarker && upperMarker && (
                <div style={{
                    marginTop: 12,
                    textAlign: 'center',
                    padding: '6px 12px',
                    background: 'rgba(24,144,255,0.05)',
                    borderRadius: 4,
                    border: '1px solid rgba(24,144,255,0.1)'
                }}>
                    <Text style={{ fontSize: '11px', color: '#595959' }}>
                        Selected Range: P{lowerMarker.percentile} to P{upperMarker.percentile} •
                        <Text style={{ fontWeight: 600, color: '#1890ff', marginLeft: 4 }}>
                            {formatLargeNumber(Math.abs(upperMarker.value - lowerMarker.value), {
                                currency: isCurrency,
                                precision: 1
                            })} spread
                        </Text>
                    </Text>
                </div>
            )}
        </div>
    );
};

export default TargetMetricRangeVisualizer;