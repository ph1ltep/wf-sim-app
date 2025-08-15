/**
 * Component Failure Modal - Detailed configuration using DistributionFieldV3
 * Tabbed interface for failure rate and cost configuration
 */

import React, { useState } from 'react';
import { Modal, Tabs, Space, Typography, message, Button } from 'antd';
import { DistributionFieldV3 } from 'components/distributionFields';
import { useScenario } from 'contexts/ScenarioContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ComponentFailureModal = ({ 
    visible, 
    componentKey, 
    componentName, 
    onClose 
}) => {
    const { updateByPath } = useScenario();
    const [activeTab, setActiveTab] = useState('failureRate');
    const [loading, setLoading] = useState(false);

    // Base path for component configuration
    const basePath = `settings.project.equipment.failureRates.components.${componentKey}`;

    // Handle modal close
    const handleClose = () => {
        setActiveTab('failureRate');
        onClose();
    };

    // Initialize component with default values if needed
    const initializeComponent = async () => {
        try {
            setLoading(true);
            
            // Set default failure rate if not exists
            await updateByPath(`${basePath}.failureRate`, {
                type: 'exponential',
                parameters: { lambda: 0.025, value: 0.025 },
                timeSeriesMode: false,
                timeSeriesParameters: { value: [] },
                metadata: { percentileDirection: 'ascending' }
            });

            // Set default costs if not exists
            await updateByPath(`${basePath}.costs.componentReplacement`, {
                type: 'lognormal',
                parameters: { mu: 13.1, sigma: 0.4, value: 500000 },
                metadata: { percentileDirection: 'ascending' }
            });

            await updateByPath(`${basePath}.costs.craneMobilization`, {
                type: 'triangular',
                parameters: { min: 80000, mode: 120000, max: 200000, value: 120000 },
                metadata: { percentileDirection: 'ascending' }
            });

            await updateByPath(`${basePath}.costs.craneDailyRate`, {
                type: 'normal',
                parameters: { mean: 15000, stdDev: 3000, value: 15000 },
                metadata: { percentileDirection: 'ascending' }
            });

            await updateByPath(`${basePath}.costs.repairDurationDays`, {
                type: 'gamma',
                parameters: { shape: 3, scale: 2, value: 6 },
                metadata: { percentileDirection: 'ascending' }
            });

            await updateByPath(`${basePath}.costs.specialistLabor`, {
                type: 'normal',
                parameters: { mean: 35000, stdDev: 10000, value: 35000 },
                metadata: { percentileDirection: 'ascending' }
            });

            await updateByPath(`${basePath}.costs.downtimeRevenuePerDay`, {
                type: 'normal',
                parameters: { mean: 200, stdDev: 50, value: 200 },
                metadata: { percentileDirection: 'descending' }
            });

            message.success('Component initialized with default values');
        } catch (error) {
            message.error(`Failed to initialize component: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`Configure ${componentName} Failure Rate`}
            visible={visible}
            onCancel={handleClose}
            width={800}
            footer={[
                <Button key="initialize" onClick={initializeComponent} loading={loading}>
                    Initialize Defaults
                </Button>,
                <Button key="close" onClick={handleClose}>
                    Close
                </Button>
            ]}
        >
            <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                style={{ minHeight: '400px' }}
            >
                <TabPane tab="Failure Rate" key="failureRate">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Title level={4}>Annual Failure Rate Configuration</Title>
                            <Text type="secondary">
                                Configure the annual failure probability for {componentName.toLowerCase()}. 
                                Supports fixed values, uncertainty distributions, and time-varying parameters.
                            </Text>
                        </div>

                        <DistributionFieldV3
                            path={[basePath, 'failureRate']}
                            label="Annual Failure Rate"
                            tooltip="Annual probability of component failure (typically 0.5% - 5%)"
                            addonAfter="failures/year"
                            options={[
                                { value: 'fixed', label: 'Fixed Rate' },
                                { value: 'exponential', label: 'Constant Rate (Exponential)' },
                                { value: 'weibull', label: 'Aging Effects (Weibull)' },
                                { value: 'lognormal', label: 'General Uncertainty' },
                                { value: 'normal', label: 'Normal Distribution' }
                            ]}
                            showTimeSeriesToggle={true}
                            allowCurveToggle={true}
                            showVisualization={true}
                            valueType="percentage"
                            step={0.001}
                        />

                        <div style={{ 
                            background: '#f6ffed', 
                            border: '1px solid #b7eb8f', 
                            borderRadius: '6px', 
                            padding: '12px' 
                        }}>
                            <Text style={{ fontSize: '12px' }}>
                                <strong>Distribution Guidelines:</strong><br/>
                                • <strong>Exponential:</strong> Constant failure rate over time (most common)<br/>
                                • <strong>Weibull:</strong> Accounts for aging effects and wear-out<br/>
                                • <strong>Lognormal:</strong> General uncertainty with positive skew<br/>
                                • <strong>Time Series:</strong> Enable for time-varying failure rates
                            </Text>
                        </div>
                    </Space>
                </TabPane>

                <TabPane tab="Cost Components" key="costs">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Title level={4}>Failure Cost Components</Title>
                            <Text type="secondary">
                                Configure the cost elements associated with {componentName.toLowerCase()} failures.
                                All costs support uncertainty distributions.
                            </Text>
                        </div>

                        <DistributionFieldV3
                            path={[basePath, 'costs', 'componentReplacement']}
                            label="Component Replacement Cost"
                            tooltip="Cost of the replacement component including procurement and logistics"
                            addonAfter="USD"
                            showVisualization={true}
                            valueType="currency"
                        />

                        <DistributionFieldV3
                            path={[basePath, 'costs', 'craneMobilization']}
                            label="Crane Mobilization Cost"
                            tooltip="One-time cost to mobilize heavy-lift crane to site"
                            addonAfter="USD"
                            showVisualization={true}
                            valueType="currency"
                        />

                        <DistributionFieldV3
                            path={[basePath, 'costs', 'craneDailyRate']}
                            label="Crane Daily Rate"
                            tooltip="Daily rental cost for heavy-lift crane during repair"
                            addonAfter="USD/day"
                            showVisualization={true}
                            valueType="currency"
                        />

                        <DistributionFieldV3
                            path={[basePath, 'costs', 'repairDurationDays']}
                            label="Repair Duration"
                            tooltip="Total duration for component replacement including weather delays"
                            addonAfter="days"
                            showVisualization={true}
                            valueType="integer"
                        />

                        <DistributionFieldV3
                            path={[basePath, 'costs', 'specialistLabor']}
                            label="Specialist Labor Cost"
                            tooltip="Cost for specialist technicians and supervisors"
                            addonAfter="USD"
                            showVisualization={true}
                            valueType="currency"
                        />

                        <DistributionFieldV3
                            path={[basePath, 'costs', 'downtimeRevenuePerDay']}
                            label="Downtime Revenue Loss"
                            tooltip="Daily revenue loss per MW during turbine downtime"
                            addonAfter="USD/MW/day"
                            showVisualization={true}
                            valueType="currency"
                        />
                    </Space>
                </TabPane>

                <TabPane tab="Advanced" key="advanced">
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <Title level={4}>Advanced Configuration</Title>
                            <Text type="secondary">
                                Additional parameters for {componentName.toLowerCase()} failure modeling.
                            </Text>
                        </div>

                        <div style={{ 
                            background: '#fffbe6', 
                            border: '1px solid #ffe58f', 
                            borderRadius: '6px', 
                            padding: '16px' 
                        }}>
                            <Title level={5}>Component Information</Title>
                            <Space direction="vertical" size="small">
                                <Text><strong>Component:</strong> {componentName}</Text>
                                <Text><strong>Key:</strong> {componentKey}</Text>
                                <Text><strong>Schema Path:</strong> {basePath}</Text>
                            </Space>
                        </div>

                        <div style={{ 
                            background: '#f6ffed', 
                            border: '1px solid #b7eb8f', 
                            borderRadius: '6px', 
                            padding: '16px' 
                        }}>
                            <Title level={5}>Future Enhancements</Title>
                            <Text style={{ fontSize: '12px' }}>
                                • Component count per turbine<br/>
                                • Design life assumptions<br/>
                                • Historical calibration data<br/>
                                • Component correlations<br/>
                                • Warranty integration<br/>
                                • Platform-specific configurations
                            </Text>
                        </div>
                    </Space>
                </TabPane>
            </Tabs>
        </Modal>
    );
};

export default ComponentFailureModal;