/**
 * RepairPackage Selector Component
 * Integrates with ContextField system for Component Failure Rates
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Select, Space, Typography, Button, Tooltip, Tag, Spin, Alert } from 'antd';
import { 
    ToolOutlined, 
    DollarOutlined, 
    InfoCircleOutlined,
    PlusOutlined,
    LoadingOutlined,
    UserOutlined,
    BuildOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import useRepairPackages from 'hooks/useRepairPackages';
import { useScenario } from 'contexts/ScenarioContext';
import { getMarketFactorColorScheme, getComponentCategoryColorScheme } from 'utils/charts/colors';

const { Text } = Typography;
const { Option } = Select;

// Cost category icons with colors - matching CostOverrideInterface exactly
const COST_CATEGORY_ICONS = {
    material: { icon: <DollarOutlined />, color: getMarketFactorColorScheme('material') },
    labor: { icon: <UserOutlined />, color: getMarketFactorColorScheme('labor') },
    tooling: { icon: <ToolOutlined />, color: getMarketFactorColorScheme('tooling') },
    crane: { icon: <BuildOutlined />, color: getMarketFactorColorScheme('crane') },
    other: { icon: <AppstoreOutlined />, color: getMarketFactorColorScheme('other') }
};

// Category color mapping for tags - using centralized theming
const getCategoryColor = (category) => getComponentCategoryColorScheme(category);

/**
 * RepairPackage Selector with cost preview and OMScopes pattern integration
 * @param {string} componentId - Component ID for context path
 * @param {boolean} showCostPreview - Show cost summary preview
 * @param {boolean} showDescription - Show package description
 * @param {boolean} showDurationAndCrane - Show duration and crane info
 * @param {boolean} allowClear - Allow clearing selection
 * @param {boolean} disabled - Disable the selector
 * @param {Function} onPackageChange - Callback when package changes
 */
const RepairPackageSelector = ({
    componentId,
    showCostPreview = true,
    showDescription = true,
    showDurationAndCrane = true,
    allowClear = true,
    disabled = false,
    onPackageChange = null
}) => {
    const { updateByPath, getValueByPath } = useScenario();
    const { repairPackages, loading: packagesLoading, fetchRepairPackages } = useRepairPackages();
    const [selectedPackage, setSelectedPackage] = useState(null);
    
    // Get current repair package ID from context
    const currentRepairPackageId = getValueByPath([
        'settings', 'project', 'equipment', 'failureRates', 'components', componentId, 'repairConfig', 'repairPackageId'
    ]);
    
    // Find selected package details
    const selectedPackageData = useMemo(() => {
        if (!currentRepairPackageId || !repairPackages.length) return null;
        return repairPackages.find(pkg => pkg._id === currentRepairPackageId || pkg.key === currentRepairPackageId);
    }, [currentRepairPackageId, repairPackages]);
    
    // Update local state when context changes
    useEffect(() => {
        setSelectedPackage(selectedPackageData);
    }, [selectedPackageData]);
    
    // Handle package selection with OMScopes pattern (copy full data)
    const handlePackageSelect = async (packageId) => {
        try {
            if (!packageId) {
                // Clear repair package
                await updateByPath([
                    'settings', 'project', 'equipment', 'failureRates', 'components', componentId, 'repairConfig'
                ], {
                    repairPackageId: null,
                    repairPackageSnapshot: null
                });
                setSelectedPackage(null);
                if (onPackageChange) onPackageChange(null);
                return;
            }
            
            // Find package and copy full data (OMScopes pattern)
            const packageData = repairPackages.find(pkg => pkg._id === packageId || pkg.key === packageId);
            if (!packageData) {
                throw new Error('Selected repair package not found');
            }
            
            // Copy complete package data to avoid stale references
            const packageSnapshot = {
                _id: packageData._id,
                name: packageData.name,
                description: packageData.description,
                category: packageData.category,
                baseDurationDays: packageData.baseDurationDays,
                costs: { ...packageData.costs },
                crane: { ...packageData.crane },
                appliesTo: { ...packageData.appliesTo },
                isDefault: packageData.isDefault,
                isActive: packageData.isActive
            };
            
            // Update context with package reference and snapshot
            await updateByPath([
                'settings', 'project', 'equipment', 'failureRates', 'components', componentId, 'repairConfig'
            ], {
                repairPackageId: packageId,
                repairPackageSnapshot: packageSnapshot
            });
            
            setSelectedPackage(packageData);
            if (onPackageChange) onPackageChange(packageData);
            
        } catch (error) {
            console.error('Error selecting repair package:', error);
        }
    };
    
    // Calculate total cost summary
    const calculateCostSummary = (packageData) => {
        if (!packageData?.costs) return null;
        
        const totalPerEvent = Object.values(packageData.costs).reduce((sum, cost) => {
            return sum + (cost?.perEventEUR || 0);
        }, 0);
        
        const totalPerDay = Object.values(packageData.costs).reduce((sum, cost) => {
            return sum + (cost?.perDayEUR || 0);
        }, 0);
        
        return { totalPerEvent, totalPerDay };
    };
    
    // Render cost preview
    const renderCostPreview = (packageData) => {
        if (!packageData?.costs || !showCostPreview) return null;
        
        const costSummary = calculateCostSummary(packageData);
        const configuredCategories = Object.entries(packageData.costs).filter(([_, cost]) => 
            (cost?.perEventEUR || 0) > 0 || (cost?.perDayEUR || 0) > 0
        );
        
        return (
            <div style={{ marginTop: 8 }}>
                <Space size="small" wrap>
                    {configuredCategories.map(([category, cost]) => {
                        const categoryConfig = COST_CATEGORY_ICONS[category];
                        if (!categoryConfig) return null;
                        
                        const eventCost = cost?.perEventEUR || 0;
                        const dayCost = cost?.perDayEUR || 0;
                        
                        return (
                            <Tooltip 
                                key={category}
                                title={
                                    <div>
                                        <div><strong>{category.charAt(0).toUpperCase() + category.slice(1)}</strong></div>
                                        {eventCost > 0 && <div>Per Event: €{eventCost.toLocaleString()}</div>}
                                        {dayCost > 0 && <div>Per Day: €{dayCost.toLocaleString()}</div>}
                                    </div>
                                }
                            >
                                <span style={{ color: categoryConfig.color, cursor: 'help' }}>
                                    {categoryConfig.icon}
                                </span>
                            </Tooltip>
                        );
                    })}
                    {costSummary && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Total: €{costSummary.totalPerEvent.toLocaleString()}
                            {costSummary.totalPerDay > 0 && ` + €${costSummary.totalPerDay.toLocaleString()}/day`}
                        </Text>
                    )}
                </Space>
            </div>
        );
    };
    
    if (packagesLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Loading repair packages...</Text>
                </div>
            </div>
        );
    }
    
    if (!repairPackages.length) {
        return (
            <Alert
                message="No Repair Packages Available"
                description="Create repair packages in Configuration → Defaults → Repair Packages before assigning them to components."
                type="warning"
                showIcon
                action={
                    <Button size="small" icon={<PlusOutlined />} onClick={() => fetchRepairPackages()}>
                        Refresh
                    </Button>
                }
            />
        );
    }
    
    return (
        <div>
            <Select
                value={currentRepairPackageId}
                onChange={handlePackageSelect}
                placeholder="Select a repair package..."
                style={{ width: '100%' }}
                allowClear={allowClear}
                disabled={disabled}
                showSearch
                filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
            >
                {repairPackages.map(pkg => (
                    <Option key={pkg._id} value={pkg._id}>
                        <Space>
                            <Text strong>{pkg.name}</Text>
                            <Tag color={getCategoryColor(pkg.category)} size="small">{pkg.category}</Tag>
                        </Space>
                    </Option>
                ))}
            </Select>
            
            {selectedPackage && (() => {
                const hasDescription = showDescription && selectedPackage.description;
                const hasDurationAndCrane = showDurationAndCrane;
                const hasCostPreview = showCostPreview;
                
                // Only render container if there's content to show
                if (!hasDescription && !hasDurationAndCrane && !hasCostPreview) {
                    return null;
                }
                
                return (
                    <div style={{ marginTop: 8, padding: '8px 0' }}>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            {hasDescription && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {selectedPackage.description}
                                </Text>
                            )}
                            
                            {hasDurationAndCrane && (
                                <Space size="middle">
                                    <Space size="small">
                                        <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                        <Text style={{ fontSize: 12 }}>
                                            Duration: {selectedPackage.baseDurationDays} days
                                        </Text>
                                    </Space>
                                    {selectedPackage.crane?.type !== 'none' && (
                                        <Space size="small">
                                            <ToolOutlined style={{ color: '#722ed1' }} />
                                            <Text style={{ fontSize: 12 }}>
                                                Crane: {selectedPackage.crane.type}
                                                {selectedPackage.crane.minimumDays > 0 && 
                                                    ` (${selectedPackage.crane.minimumDays} days min)`
                                                }
                                            </Text>
                                        </Space>
                                    )}
                                </Space>
                            )}
                            
                            {hasCostPreview && renderCostPreview(selectedPackage)}
                        </Space>
                    </div>
                );
            })()}
        </div>
    );
};

export default RepairPackageSelector;