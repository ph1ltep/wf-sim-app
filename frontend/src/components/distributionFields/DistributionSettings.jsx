// frontend/src/components/distributionFields/DistributionSettings.jsx
import React from 'react';
import { Popover, Space, Button, Radio } from 'antd';
import { RadioGroupField } from '../contextFields';
import ThemedIcon from '../common/ThemedIcon';

/**
 * Settings popover component for distribution controls
 */
const DistributionSettings = ({
    basePath,
    viewMode = 'pdf',
    onViewModeChange,
    showInfoBox = false,
    onShowInfoBoxChange,
    allowCurveToggle = true,
    disabled = false
}) => {
    const timeSeriesModePath = [...basePath, 'timeSeriesMode'];
    const metadataPath = [...basePath, 'metadata'];

    const settingsContent = (
        <div style={{ width: 250 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* Time Series Mode - keep using RadioGroupField since it's context-based */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        Data Mode
                    </div>
                    <RadioGroupField
                        path={timeSeriesModePath}
                        options={[
                            {
                                value: false,
                                label: 'Single Value',
                                icon: <ThemedIcon iconKey="dataMode.singleValue" />,
                                tooltip: 'Use a single distribution value'
                            },
                            {
                                value: true,
                                label: 'Time Series',
                                icon: <ThemedIcon iconKey="dataMode.timeSeries" />,
                                tooltip: 'Use time series data with fitted distribution'
                            }
                        ]}
                        optionType="button"
                        size="small"
                        defaultValue={false}
                        disabled={disabled}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Percentile Direction - keep using RadioGroupField since it's context-based */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        Percentile Direction
                    </div>
                    <RadioGroupField
                        path={[...metadataPath, 'percentileDirection']}
                        options={[
                            {
                                value: 'ascending',
                                label: 'P90 > P10',
                                icon: <ThemedIcon iconKey="percentileDirection.ascending" />,
                                tooltip: 'Higher percentiles = higher values (typical for costs)'
                            },
                            {
                                value: 'descending',
                                label: 'P90 < P10',
                                icon: <ThemedIcon iconKey="percentileDirection.descending" />,
                                tooltip: 'Higher percentiles = lower values (typical for revenues)'
                            }
                        ]}
                        optionType="button"
                        size="small"
                        defaultValue="ascending"
                        disabled={disabled}
                        style={{ width: '100%', display: 'flex' }}
                    />
                </div>

                {/* View Mode - use Ant Design Radio.Group for local state control */}
                {allowCurveToggle && (
                    <div>
                        <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                            View Mode
                        </div>
                        <Radio.Group
                            value={viewMode}
                            onChange={(e) => onViewModeChange(e.target.value)}
                            optionType="button"
                            buttonStyle="outline"
                            //size="small"
                            disabled={disabled}
                            style={{ width: '100%', display: 'flex' }}
                        >
                            <Radio.Button value="pdf" style={{ flex: 1, textAlign: 'center' }}>
                                <Space size={4}>
                                    <ThemedIcon iconKey="viewMode.pdf" />
                                    PDF
                                </Space>
                            </Radio.Button>
                            <Radio.Button value="cdf" style={{ flex: 1, textAlign: 'center' }}>
                                <Space size={4}>
                                    <ThemedIcon iconKey="viewMode.cdf" />
                                    CDF
                                </Space>
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                )}

                {/* Info Box Toggle - use Ant Design Radio.Group for local state control */}
                <div>
                    <div style={{ marginBottom: 8, fontSize: '12px', fontWeight: 500 }}>
                        Information
                    </div>
                    <Radio.Group
                        value={showInfoBox ? 'show' : 'hide'}
                        onChange={(e) => onShowInfoBoxChange(e.target.value === 'show')}
                        optionType="button"
                        buttonStyle="outline"
                        //size="small"
                        disabled={disabled}
                        style={{ width: '100%', display: 'flex' }}
                    >
                        <Radio.Button value="hide" style={{ flex: 1, textAlign: 'center' }}>
                            <Space size={4}>
                                <ThemedIcon iconKey="infoBox.shown" showEnabled={false} />
                                Hide
                            </Space>
                        </Radio.Button>
                        <Radio.Button value="show" style={{ flex: 1, textAlign: 'center' }}>
                            <Space size={4}>
                                <ThemedIcon iconKey="infoBox.shown" showEnabled={true} />
                                Show
                            </Space>
                        </Radio.Button>
                    </Radio.Group>
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