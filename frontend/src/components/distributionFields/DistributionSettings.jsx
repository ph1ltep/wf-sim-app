// frontend/src/components/distributionFields/DistributionSettings.jsx
import React from 'react';
import { Popover, Space, Button, Switch, Segmented } from 'antd';
import ThemedIcon from '../common/ThemedIcon';

/**
 * Settings popover component for distribution controls
 * @param {Object} props - Component props
 */
const DistributionSettings = ({
    timeSeriesMode = false,
    percentileDirection = 'ascending',
    viewMode = 'pdf',
    showInfoBox = false,
    onTimeSeriesModeChange,
    onPercentileDirectionChange,
    onViewModeChange,
    onShowInfoBoxChange,
    disabled = false
}) => {
    const settingsContent = (
        <div style={{ width: 200 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Time Series Mode */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        Data Mode
                    </div>
                    <Switch
                        checked={timeSeriesMode}
                        onChange={onTimeSeriesModeChange}
                        checkedChildren="Time Series"
                        unCheckedChildren="Single Value"
                        disabled={disabled}
                        size="small"
                    />
                </div>

                {/* Percentile Direction */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        Percentile Direction
                    </div>
                    <Segmented
                        value={percentileDirection}
                        onChange={onPercentileDirectionChange}
                        options={[
                            {
                                label: 'P90 > P10',
                                value: 'ascending',
                                icon: <ThemedIcon iconKey="percentileDirection.ascending" showEnabled={!disabled} />
                            },
                            {
                                label: 'P90 < P10',
                                value: 'descending',
                                icon: <ThemedIcon iconKey="percentileDirection.descending" showEnabled={!disabled} />
                            }
                        ]}
                        size="small"
                        disabled={disabled}
                    />
                </div>

                {/* View Mode */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        View Mode
                    </div>
                    <Segmented
                        value={viewMode}
                        onChange={onViewModeChange}
                        options={[
                            {
                                label: 'PDF',
                                value: 'pdf',
                                icon: <ThemedIcon iconKey="viewMode.pdf" showEnabled={!disabled} />
                            },
                            {
                                label: 'CDF',
                                value: 'cdf',
                                icon: <ThemedIcon iconKey="viewMode.cdf" showEnabled={!disabled} />
                            }
                        ]}
                        size="small"
                        disabled={disabled}
                    />
                </div>

                {/* Info Box Toggle */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        Information
                    </div>
                    <Switch
                        checked={showInfoBox}
                        onChange={onShowInfoBoxChange}
                        checkedChildren="Show Details"
                        unCheckedChildren="Hide Details"
                        disabled={disabled}
                        size="small"
                    />
                </div>
            </Space>
        </div>
    );

    return (
        <Popover
            content={settingsContent}
            title="Distribution Settings"
            trigger="click"
            placement="bottomLeft"
            overlayStyle={{ zIndex: 1050 }}
        >
            <Button
                icon={<ThemedIcon iconKey="settings" showEnabled={!disabled} />}
                size="small"
                type="text"
                disabled={disabled}
                style={{ marginLeft: 8 }}
            />
        </Popover>
    );
};

export default DistributionSettings;