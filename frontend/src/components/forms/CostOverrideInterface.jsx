/**
 * Cost Override Interface Component
 * Directly edits the repairPackageSnapshot for component-specific cost overrides
 * Matches Repair Package form structure exactly including crane configuration
 */

import React from 'react';
import { Collapse, InputNumber, Typography, Space, Tag, Select } from 'antd';
import { 
    DollarOutlined, 
    UserOutlined, 
    ToolOutlined, 
    BuildOutlined, 
    AppstoreOutlined 
} from '@ant-design/icons';
import { useScenario } from 'contexts/ScenarioContext';
import { getMarketFactorColorScheme } from 'utils/charts/colors';
import { ResponsiveFieldRow } from 'components/contextFields';

const { Text } = Typography;
const { Option } = Select;

// Cost category configurations matching repair package structure exactly
const COST_CATEGORIES = [
    {
        key: 'material',
        icon: <DollarOutlined />,
        label: 'Material Costs',
        color: getMarketFactorColorScheme('material')
    },
    {
        key: 'labor', 
        icon: <UserOutlined />,
        label: 'Labor Costs',
        color: getMarketFactorColorScheme('labor')
    },
    {
        key: 'tooling',
        icon: <ToolOutlined />,
        label: 'Tooling Costs', 
        color: getMarketFactorColorScheme('tooling')
    },
    {
        key: 'crane',
        icon: <BuildOutlined />,
        label: 'Crane Costs & Configuration',
        color: getMarketFactorColorScheme('crane')
    },
    {
        key: 'other',
        icon: <AppstoreOutlined />,
        label: 'Other Costs',
        color: getMarketFactorColorScheme('other')
    }
];

// Crane types matching RepairPackageForm
const CRANE_TYPES = [
    { value: 'none', label: 'No Crane Required' },
    { value: 'mobile', label: 'Mobile Crane' },
    { value: 'crawler', label: 'Crawler Crane (Heavy lift)' },
    { value: 'tower', label: 'Tower Crane (Blade work)' },
    { value: 'special', label: 'Special Equipment' }
];

/**
 * Cost Override Interface Component - Directly edits repairPackageSnapshot
 * @param {string} componentId - Component ID for context path
 * @param {boolean} showTotalRow - Whether to show the cost totals summary row
 */
const CostOverrideInterface = ({ componentId, showTotalRow = true }) => {
    const { updateByPath, getValueByPath } = useScenario();
    
    // Get current repair package snapshot from context - Fixed path to include repairConfig
    const repairPackageSnapshot = getValueByPath([
        'settings', 'project', 'equipment', 'failureRates', 'components', 
        componentId, 'repairConfig', 'repairPackageSnapshot'
    ], {});

    // Handle cost value changes - directly update the snapshot
    const handleCostChange = (categoryKey, costType, value) => {
        const updatedSnapshot = {
            ...repairPackageSnapshot,
            costs: {
                ...repairPackageSnapshot.costs,
                [categoryKey]: {
                    ...repairPackageSnapshot.costs?.[categoryKey],
                    [costType]: value || 0
                }
            }
        };

        updateByPath([
            'settings', 'project', 'equipment', 'failureRates', 'components', 
            componentId, 'repairConfig', 'repairPackageSnapshot'
        ], updatedSnapshot);
    };

    // Handle crane configuration changes
    const handleCraneChange = (field, value) => {
        const updatedSnapshot = {
            ...repairPackageSnapshot,
            crane: {
                ...repairPackageSnapshot.crane,
                [field]: value
            }
        };

        updateByPath([
            'settings', 'project', 'equipment', 'failureRates', 'components', 
            componentId, 'repairConfig', 'repairPackageSnapshot'
        ], updatedSnapshot);
    };

    // Determine which panels should be expanded
    const shouldExpandCategory = (category) => {
        const categoryData = repairPackageSnapshot.costs?.[category.key];
        if (!categoryData) return false;
        
        if (category.key === 'crane') {
            // Expand crane if it has costs OR non-default crane type
            return (categoryData.perEventEUR > 0) || (categoryData.perDayEUR > 0) || 
                   (repairPackageSnapshot.crane?.type && repairPackageSnapshot.crane?.type !== 'none');
        }
        
        return (categoryData.perEventEUR > 0) || (categoryData.perDayEUR > 0);
    };

    const getDefaultExpandedPanels = () => {
        // Default to closed panels for cleaner interface
        return [];
    };

    // Calculate totals for summary
    const calculateTotals = () => {
        let totalPerEvent = 0;
        let totalPerDay = 0;
        
        if (repairPackageSnapshot.costs) {
            COST_CATEGORIES.forEach(category => {
                const categoryData = repairPackageSnapshot.costs[category.key] || {};
                totalPerEvent += categoryData.perEventEUR || 0;
                totalPerDay += categoryData.perDayEUR || 0;
            });
        }

        return { totalPerEvent, totalPerDay };
    };

    const totals = calculateTotals();

    // Format currency for display
    const formatCurrency = (value) => `€${value?.toLocaleString() || '0'}`;

    return (
        <div style={{ marginTop: 12 }}>
            {/* Cost totals summary - simplified to match disabled version style */}
            {showTotalRow && (
                <div style={{ marginTop: 8, marginBottom: 16 }}>
                    <Space size="small" wrap>
                        <DollarOutlined style={{ color: getMarketFactorColorScheme('material') }} />
                        <UserOutlined style={{ color: getMarketFactorColorScheme('labor') }} />
                        <ToolOutlined style={{ color: getMarketFactorColorScheme('tooling') }} />
                        <BuildOutlined style={{ color: getMarketFactorColorScheme('crane') }} />
                        <AppstoreOutlined style={{ color: getMarketFactorColorScheme('other') }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Total: {formatCurrency(totals.totalPerEvent)}
                            {totals.totalPerDay > 0 && ` + ${formatCurrency(totals.totalPerDay)}/day`}
                        </Text>
                    </Space>
                </div>
            )}

            {/* Collapsible Cost Categories */}
            <Collapse
                defaultActiveKey={getDefaultExpandedPanels()}
                size="small"
                items={COST_CATEGORIES.map(category => ({
                    key: category.key,
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: category.color }}>{category.icon}</span>
                            <span>{category.label}</span>
                        </div>
                    ),
                    children: category.key === 'crane' ? (
                        // Special crane section with configuration options
                        <div>
                            <ResponsiveFieldRow layout="twoColumn">
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                                        Per-Event Cost (EUR)
                                    </Text>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        step={1000}
                                        value={repairPackageSnapshot.costs?.[category.key]?.perEventEUR || 0}
                                        onChange={(value) => handleCostChange(category.key, 'perEventEUR', value)}
                                        formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/€\s?|(,*)/g, '')}
                                        placeholder="0"
                                    />
                                </div>
                                
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                                        Per-Day Cost (EUR)
                                    </Text>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        step={100}
                                        value={repairPackageSnapshot.costs?.[category.key]?.perDayEUR || 0}
                                        onChange={(value) => handleCostChange(category.key, 'perDayEUR', value)}
                                        formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/€\s?|(,*)/g, '')}
                                        placeholder="0"
                                    />
                                </div>
                            </ResponsiveFieldRow>
                            
                            <ResponsiveFieldRow layout="twoColumn" style={{ marginTop: 16 }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                                        Crane Type
                                    </Text>
                                    <Select 
                                        style={{ width: '100%' }}
                                        value={repairPackageSnapshot.crane?.type || 'none'}
                                        onChange={(value) => handleCraneChange('type', value)}
                                        placeholder="Select crane type"
                                    >
                                        {CRANE_TYPES.map(type => (
                                            <Option key={type.value} value={type.value}>
                                                {type.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                                        Minimum Crane Days
                                    </Text>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        max={365}
                                        step={1}
                                        value={repairPackageSnapshot.crane?.minimumDays || 0}
                                        onChange={(value) => handleCraneChange('minimumDays', value)}
                                        placeholder="0"
                                    />
                                </div>
                            </ResponsiveFieldRow>
                        </div>
                    ) : (
                        // Standard cost section
                        <ResponsiveFieldRow layout="twoColumn">
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                                    Per-Event Cost (EUR)
                                </Text>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    step={1000}
                                    value={repairPackageSnapshot.costs?.[category.key]?.perEventEUR || 0}
                                    onChange={(value) => handleCostChange(category.key, 'perEventEUR', value)}
                                    formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/€\s?|(,*)/g, '')}
                                    placeholder="0"
                                />
                            </div>
                            
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>
                                    Per-Day Cost (EUR)
                                </Text>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    step={100}
                                    value={repairPackageSnapshot.costs?.[category.key]?.perDayEUR || 0}
                                    onChange={(value) => handleCostChange(category.key, 'perDayEUR', value)}
                                    formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/€\s?|(,*)/g, '')}
                                    placeholder="0"
                                />
                            </div>
                        </ResponsiveFieldRow>
                    ),
                    style: { borderLeft: `4px solid ${category.color}` }
                }))}
            />

            {/* Help Text */}
            <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                    Modify repair package costs for this component. Changes are automatically reflected in the cost summary above.
                </Text>
            </div>
        </div>
    );
};

export default CostOverrideInterface;