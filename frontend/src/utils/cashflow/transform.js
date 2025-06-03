// src/utils/cashflow/transform.js - Enhanced with multi-percentile support
import { applyTransformer } from './transformers';
import { applyMultipliers } from './multipliers';
import { calculateFinanceMetrics } from '../cashflowUtils';

/**
 * Get the selected percentile for a source based on strategy
 */
const getSelectedPercentileForSource = (sourceId, selectedPercentiles, availablePercentiles) => {
    if (selectedPercentiles.strategy === 'unified') {
        return selectedPercentiles.unified;
    } else {
        return selectedPercentiles.perSource[sourceId] || availablePercentiles[0] || 50;
    }
};

/**
 * Extract data for a specific percentile from simulation results
 */
const extractDataForPercentile = (dataSource, dataReferences, sourceConfig, percentile) => {
    if (sourceConfig.hasPercentiles) {
        const contextWithPercentile = {
            ...dataReferences.context,
            percentile
        };
        const referencesWithContext = {
            ...dataReferences,
            context: contextWithPercentile
        };
        return applyTransformer('extractPercentileData', dataSource, referencesWithContext, sourceConfig);
    } else {
        return sourceConfig.transformer
            ? applyTransformer(sourceConfig.transformer, dataSource, dataReferences, sourceConfig)
            : applyTransformer('extractFixedData', dataSource, dataReferences, sourceConfig);
    }
};

/**
 * NEW: Extract data for all available percentiles (for summary cards)
 */
const extractDataForAllPercentiles = (dataSource, dataReferences, sourceConfig, availablePercentiles) => {
    const allPercentileData = new Map();

    if (sourceConfig.hasPercentiles) {
        // For sources with percentiles, extract each one
        availablePercentiles.forEach(percentile => {
            const data = extractDataForPercentile(dataSource, dataReferences, sourceConfig, percentile);
            allPercentileData.set(percentile, data);
        });
    } else {
        // For fixed sources, same data for all percentiles
        const fixedData = extractDataForPercentile(dataSource, dataReferences, sourceConfig, null);
        availablePercentiles.forEach(percentile => {
            allPercentileData.set(percentile, fixedData);
        });
    }

    return allPercentileData;
};

/**
 * Build dataReferences object with proper structure (unchanged)
 */
const buildDataReferences = (sourceConfig, registry, getValueByPath, selectedPercentiles, availablePercentiles, context) => {
    const dataReferences = {
        reference: {},
        global: {},
        context: {
            projectLife: context.projectLife,
            numWTGs: context.numWTGs,
            getValueByPath
        }
    };

    // Add global data from registry.data
    Object.entries(registry.data || {}).forEach(([key, path]) => {
        dataReferences.global[key] = getValueByPath(path);
    });

    // Add reference data from sourceConfig.references
    if (sourceConfig.references && Array.isArray(sourceConfig.references)) {
        sourceConfig.references.forEach((referencePath, index) => {
            const data = getValueByPath(referencePath);
            const key = referencePath[referencePath.length - 1] || `ref_${index}`;
            dataReferences.reference[key] = data;
        });
    }

    // Add percentile to context if source has percentiles
    if (sourceConfig.hasPercentiles) {
        const selectedPercentile = getSelectedPercentileForSource(
            sourceConfig.id,
            selectedPercentiles,
            availablePercentiles
        );
        dataReferences.context.percentile = selectedPercentile;
    }

    return dataReferences;
};

/**
 * Validate that primary data source exists before calling transformer (unchanged)
 */
const validateDataSource = (dataSource, sourceConfig) => {
    if (!dataSource) {
        throw new Error(`Missing primary data source for '${sourceConfig.id}' at path: ${sourceConfig.path.join('.')}`);
    }
    return true;
};

const testUnifiedPercentileMode = (selectedPercentiles, registry, getValueByPath) => {
    console.log('🧪 Testing unified percentile mode...');

    const { strategy, unified } = selectedPercentiles;

    if (strategy !== 'unified') {
        console.log('⏭️ Skipping unified test - strategy is:', strategy);
        return true;
    }

    console.log(`📊 Testing unified percentile: P${unified}`);

    const percentileSources = [...(registry.multipliers || []), ...(registry.revenues || [])]
        .filter(source => source.hasPercentiles);

    percentileSources.forEach(source => {
        const testPercentile = getSelectedPercentileForSource(
            source.id,
            selectedPercentiles,
            [10, 25, 50, 75, 90]
        );

        if (testPercentile === unified) {
            console.log(`✅ ${source.id}: P${testPercentile} (correct)`);
        } else {
            console.warn(`❌ ${source.id}: P${testPercentile} (expected P${unified})`);
            return false;
        }
    });

    console.log('✅ Unified percentile mode test passed');
    return true;
};

/**
 * Enhanced transformation function with multi-percentile support
 */
export const transformScenarioToCashflow = async (
    scenarioData,
    registry,
    selectedPercentiles,
    getValueByPath
) => {
    console.log('🔄 Starting enhanced cashflow transformation with multi-percentile support...');

    // Test percentile mode
    testUnifiedPercentileMode(selectedPercentiles, registry, getValueByPath);

    // Extract metadata (enhanced)
    const availablePercentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []).map(p => p.value);
    const primaryPercentile = selectedPercentiles?.unified || getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);

    const metadata = {
        projectLife: getValueByPath(['settings', 'general', 'projectLife'], 20),
        currency: getValueByPath(['settings', 'project', 'currency', 'local'], 'USD'),
        numWTGs: getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20),
        availablePercentiles,
        primaryPercentile, // NEW: Store primary percentile
        lastUpdated: new Date(),
        percentileStrategy: {
            strategy: selectedPercentiles.strategy,
            selections: selectedPercentiles.strategy === 'unified'
                ? { unified: selectedPercentiles.unified }
                : selectedPercentiles.perSource
        }
    };

    const context = {
        projectLife: metadata.projectLife,
        numWTGs: metadata.numWTGs,
        getValueByPath
    };

    // Extract multiplier data (unchanged logic, but enhanced storage)
    console.log('📊 Processing multipliers with multi-percentile support...');
    const multiplierData = {};
    let multiplierErrors = 0;

    registry.multipliers?.forEach(multiplierConfig => {
        try {
            const dataSource = getValueByPath(multiplierConfig.path);
            validateDataSource(dataSource, multiplierConfig);

            const dataReferences = buildDataReferences(
                multiplierConfig,
                registry,
                getValueByPath,
                selectedPercentiles,
                availablePercentiles,
                context
            );

            const selectedPercentile = getSelectedPercentileForSource(
                multiplierConfig.id,
                selectedPercentiles,
                availablePercentiles
            );

            // Get primary data (existing logic)
            const data = extractDataForPercentile(dataSource, dataReferences, multiplierConfig, selectedPercentile);
            multiplierData[multiplierConfig.id] = data;

        } catch (error) {
            console.error(`❌ Error processing multiplier '${multiplierConfig.id}':`, error.message);
            multiplierErrors++;
            multiplierData[multiplierConfig.id] = [];
        }
    });

    console.log(`✅ Processed ${Object.keys(multiplierData).length} multipliers (${multiplierErrors} errors)`);

    // Process line items with enhanced storage (CORE ENHANCEMENT)
    console.log('📈 Processing line items with multi-percentile support...');
    const lineItems = [];
    let lineItemErrors = 0;

    ['costs', 'revenues'].forEach(sourceType => {
        registry[sourceType]?.forEach(sourceConfig => {
            try {
                const dataSource = getValueByPath(sourceConfig.path);
                validateDataSource(dataSource, sourceConfig);

                const dataReferences = buildDataReferences(
                    sourceConfig,
                    registry,
                    getValueByPath,
                    selectedPercentiles,
                    availablePercentiles,
                    context
                );

                const selectedPercentile = getSelectedPercentileForSource(
                    sourceConfig.id,
                    selectedPercentiles,
                    availablePercentiles
                );

                // Get primary data (existing logic)
                const baseData = extractDataForPercentile(dataSource, dataReferences, sourceConfig, selectedPercentile);
                let finalData = baseData;
                let appliedMultipliers = [];

                // Apply multipliers if configured (existing logic)
                if (sourceConfig.multipliers && sourceConfig.multipliers.length > 0) {
                    const multiplierResult = applyMultipliers(
                        baseData,
                        sourceConfig.multipliers,
                        multiplierData
                    );
                    finalData = multiplierResult.data;
                    appliedMultipliers = multiplierResult.appliedMultipliers;
                }

                // NEW: Get all percentile data for summary cards
                let allPercentileData = null;
                if (sourceConfig.hasPercentiles || availablePercentiles.length > 1) {
                    allPercentileData = new Map();

                    availablePercentiles.forEach(percentile => {
                        let percentileBaseData = extractDataForPercentile(dataSource, dataReferences, sourceConfig, percentile);

                        // Apply same multipliers to each percentile
                        if (sourceConfig.multipliers && sourceConfig.multipliers.length > 0) {
                            const percentileMultiplierResult = applyMultipliers(
                                percentileBaseData,
                                sourceConfig.multipliers,
                                multiplierData
                            );
                            percentileBaseData = percentileMultiplierResult.data;
                        }

                        allPercentileData.set(percentile, percentileBaseData);
                    });
                }

                const lineItem = {
                    id: sourceConfig.id,
                    category: sourceType === 'costs' ? 'cost' : 'revenue',
                    subcategory: sourceConfig.category,
                    name: sourceConfig.description || sourceConfig.id,
                    data: finalData || [], // Primary percentile (existing)
                    percentileData: allPercentileData, // NEW: All percentiles
                    metadata: {
                        selectedPercentile,
                        hasPercentileVariation: sourceConfig.hasPercentiles,
                        hasAllPercentiles: allPercentileData !== null, // NEW: Flag
                        appliedMultipliers,
                        description: sourceConfig.description
                    }
                };

                if (sourceConfig.displayNote) {
                    lineItem.displayNote = sourceConfig.displayNote;
                }

                lineItems.push(lineItem);

            } catch (error) {
                console.error(`❌ Error processing ${sourceType} '${sourceConfig.id}':`, error.message);
                lineItemErrors++;
            }
        });
    });

    console.log(`✅ Processed ${lineItems.length} line items with multi-percentile support (${lineItemErrors} errors)`);

    // Enhanced aggregations with multi-percentile support
    console.log('🧮 Calculating enhanced aggregations...');
    const aggregateByCategoryEnhanced = (category) => {
        const categoryItems = lineItems.filter(item => item.category === category);

        if (categoryItems.length === 0) {
            return {
                data: [],
                percentileData: new Map(),
                metadata: {
                    selectedPercentile: primaryPercentile,
                    sourceCount: 0,
                    hasPercentileVariation: false,
                    hasAllPercentiles: false
                }
            };
        }

        // Calculate primary percentile aggregation (existing logic)
        const allYears = new Set();
        categoryItems.forEach(item => {
            if (!item.data || !Array.isArray(item.data)) {
                console.warn(`⚠️ Line item '${item.id}' has invalid data:`, {
                    dataType: typeof item.data,
                    isArray: Array.isArray(item.data),
                    value: item.data
                });
                item.data = [];
                return;
            }

            item.data.forEach(point => {
                if (point && typeof point.year === 'number') {
                    allYears.add(point.year);
                }
            });
        });

        const primaryData = Array.from(allYears).map(year => {
            const total = categoryItems.reduce((sum, item) => {
                if (!Array.isArray(item.data)) return sum;
                const dataPoint = item.data.find(d => d && d.year === year);
                return sum + (dataPoint ? (dataPoint.value || 0) : 0);
            }, 0);
            return { year, value: total };
        }).sort((a, b) => a.year - b.year);

        // NEW: Calculate all percentile aggregations
        const allPercentileAggregation = new Map();
        availablePercentiles.forEach(percentile => {
            const percentileYears = new Set();

            // Collect all years across all items for this percentile
            categoryItems.forEach(item => {
                if (item.percentileData && item.percentileData.has(percentile)) {
                    const percentileData = item.percentileData.get(percentile);
                    if (Array.isArray(percentileData)) {
                        percentileData.forEach(point => {
                            if (point && typeof point.year === 'number') {
                                percentileYears.add(point.year);
                            }
                        });
                    }
                }
            });

            // Aggregate for this percentile
            const percentileAggregated = Array.from(percentileYears).map(year => {
                const total = categoryItems.reduce((sum, item) => {
                    if (!item.percentileData || !item.percentileData.has(percentile)) return sum;
                    const percentileData = item.percentileData.get(percentile);
                    if (!Array.isArray(percentileData)) return sum;
                    const dataPoint = percentileData.find(d => d && d.year === year);
                    return sum + (dataPoint ? (dataPoint.value || 0) : 0);
                }, 0);
                return { year, value: total };
            }).sort((a, b) => a.year - b.year);

            allPercentileAggregation.set(percentile, percentileAggregated);
        });

        const hasPercentileVariation = categoryItems.some(item => item.metadata?.hasPercentileVariation);
        const representativePercentile = selectedPercentiles.strategy === 'unified'
            ? selectedPercentiles.unified
            : Math.round(Object.values(selectedPercentiles.perSource).reduce((sum, p) => sum + p, 0) / categoryItems.length);

        return {
            data: primaryData, // Primary percentile (existing)
            percentileData: allPercentileAggregation, // NEW: All percentiles
            metadata: {
                selectedPercentile: representativePercentile,
                sourceCount: categoryItems.length,
                hasPercentileVariation,
                hasAllPercentiles: allPercentileAggregation.size > 0 // NEW: Flag
            }
        };
    };

    const aggregations = {
        totalCosts: aggregateByCategoryEnhanced('cost'),
        totalRevenue: aggregateByCategoryEnhanced('revenue'),
        netCashflow: { data: [], percentileData: new Map(), metadata: { selectedPercentile: primaryPercentile, sourceCount: 0, hasPercentileVariation: false, hasAllPercentiles: false } }
    };

    // Calculate net cashflow for all percentiles
    const allNetCashflowYears = new Set([
        ...aggregations.totalCosts.data.map(d => d.year),
        ...aggregations.totalRevenue.data.map(d => d.year)
    ]);

    // Primary percentile net cashflow (existing logic)
    aggregations.netCashflow.data = Array.from(allNetCashflowYears).map(year => {
        const revenue = aggregations.totalRevenue.data.find(d => d.year === year)?.value || 0;
        const cost = aggregations.totalCosts.data.find(d => d.year === year)?.value || 0;
        return { year, value: revenue - cost };
    }).sort((a, b) => a.year - b.year);

    // NEW: All percentile net cashflow
    const netCashflowAllPercentiles = new Map();
    availablePercentiles.forEach(percentile => {
        const revenueData = aggregations.totalRevenue.percentileData.get(percentile) || [];
        const costData = aggregations.totalCosts.percentileData.get(percentile) || [];

        const allYears = new Set([
            ...revenueData.map(d => d.year),
            ...costData.map(d => d.year)
        ]);

        const netData = Array.from(allYears).map(year => {
            const revenue = revenueData.find(d => d.year === year)?.value || 0;
            const cost = costData.find(d => d.year === year)?.value || 0;
            return { year, value: revenue - cost };
        }).sort((a, b) => a.year - b.year);

        netCashflowAllPercentiles.set(percentile, netData);
    });

    aggregations.netCashflow.percentileData = netCashflowAllPercentiles;
    aggregations.netCashflow.metadata = {
        selectedPercentile: aggregations.totalRevenue.metadata.selectedPercentile,
        sourceCount: aggregations.totalCosts.metadata.sourceCount + aggregations.totalRevenue.metadata.sourceCount,
        hasPercentileVariation: aggregations.totalCosts.metadata.hasPercentileVariation || aggregations.totalRevenue.metadata.hasPercentileVariation,
        hasAllPercentiles: netCashflowAllPercentiles.size > 0
    };

    // Calculate enhanced finance metrics (already supports all percentiles)
    const financeMetrics = calculateFinanceMetrics(aggregations, availablePercentiles, scenarioData, lineItems);

    const result = { metadata, lineItems, aggregations, financeMetrics };

    console.log(`✅ Enhanced transformation complete: ${lineItems.length} items, multi-percentile support enabled`);

    return result;
};