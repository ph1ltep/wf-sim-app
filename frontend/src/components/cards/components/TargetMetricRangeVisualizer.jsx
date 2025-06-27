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

        // Get actual metric values from sensitivity results for the selected range
        // Find the actual low and high values from the sensitivity analysis
        const selectedLowValue = sensitivityResults.find(r => r.percentile === selectedRange.lower)?.lowValue;
        const selectedHighValue = sensitivityResults.find(r => r.percentile === selectedRange.upper)?.highValue;

        // If we can't find the exact values, approximate from all available values
        const allValues = sensitivityResults.flatMap(r => [r.lowValue, r.baseValue, r.highValue]);
        const minValue = selectedLowValue || Math.min(...allValues);
        const maxValue = selectedHighValue || Math.max(...allValues);
        const valueRange = maxValue - minValue;

        // Create markers for each percentile
        const markers = availablePercentiles.map(percentile => {
            // Get the actual value for this percentile from sensitivity results
            let value;
            const exactResult = sensitivityResults.find(r => r.percentile === percentile);

            if (exactResult) {
                // Use the base value if we have exact data for this percentile
                value = exactResult.baseValue;
            } else {
                // Interpolate based on available data
                // This is a simplified approach - in reality, you'd want more sophisticated interpolation
                if (percentile <= selectedRange.lower) {
                    value = minValue;
                } else if (percentile >= selectedRange.upper) {
                    value = maxValue;
                } else {
                    // Linear interpolation between the selected range
                    const ratio = (percentile - selectedRange.lower) / (selectedRange.upper - selectedRange.lower);
                    value = minValue + (valueRange * ratio);
                }
            }

            // Position based on actual value relative to our display range
            const position = valueRange > 0 ? ((value - minValue) / valueRange) * 100 : 50;

            const isSelected = percentile === selectedRange.lower || percentile === selectedRange.upper;
            const isBaseline = percentile === 50;

            return {
                percentile,
                value,
                position: Math.max(0, Math.min(100, position)), // Clamp between 0-100
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
            minValue,
            maxValue,
            valueRange
        };
    }, [sensitivityResults, metricConfig, selectedRange, getValueByPath]);

    if (!visualData) return null;

    const { markers, lowerMarker, upperMarker, isCurrency, metricLabel, minValue, maxValue } = visualData;

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
                    {formatLargeNumber(minValue, { currency: isCurrency, precision: 0 })}
                </Text>
                <Text style={{ fontSize: '10px', color: '#8c8c8c' }}>
                    {formatLargeNumber(maxValue, { currency: isCurrency, precision: 0 })}
                </Text>
            </div>

            {/* Visualization Container */}
            <div style={{
                position: 'relative',
                height: 80,
                padding: `0 ${containerPadding}px`,
                marginTop: 8
            }}>
                {/* Main range bar - thicker and more prominent */}
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

                            {/* Marker dot - positioned within the bar */}
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

                            {/* Value label below */}
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
                                {formatLargeNumber(value, { currency: isCurrency, precision: 0 })}
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
                                precision: 0
                            })} spread
                        </Text>
                    </Text>
                </div>
            )}
        </div>
    );
};

export default TargetMetricRangeVisualizer;