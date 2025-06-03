// src/utils/cashflow/transform.js - Updated transformation orchestrator with new data structure
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
        // Add percentile to context for simulation data extraction
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
 * Build dataReferences object with proper structure
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
            // Use the last segment of the path as the key, or fall back to index
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
 * Validate that primary data source exists before calling transformer
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

    // Test that all percentile sources will use the same percentile
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
 * Updated transformation function with new data structure and signatures
 */
export const transformScenarioToCashflow = async (
    scenarioData,
    registry,
    selectedPercentiles,
    getValueByPath
) => {
    console.log('🔄 Starting cashflow transformation with new data structure...');

    // Test percentile mode
    testUnifiedPercentileMode(selectedPercentiles, registry, getValueByPath);

    // Extract metadata
    const availablePercentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []).map(p => p.value);
    const metadata = {
        projectLife: getValueByPath(['settings', 'general', 'projectLife'], 20),
        currency: getValueByPath(['settings', 'project', 'currency', 'local'], 'USD'),
        numWTGs: getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20),
        availablePercentiles,
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

    // Extract multiplier data with new structure
    console.log('📊 Processing multipliers...');
    const multiplierData = {};
    let multiplierErrors = 0;

    registry.multipliers?.forEach(multiplierConfig => {
        try {
            // Get primary data source
            const dataSource = getValueByPath(multiplierConfig.path);
            validateDataSource(dataSource, multiplierConfig);

            // Build data references
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

            const data = extractDataForPercentile(dataSource, dataReferences, multiplierConfig, selectedPercentile);
            multiplierData[multiplierConfig.id] = data;

        } catch (error) {
            console.error(`❌ Error processing multiplier '${multiplierConfig.id}':`, error.message);
            multiplierErrors++;
            multiplierData[multiplierConfig.id] = [];
        }
    });

    console.log(`✅ Processed ${Object.keys(multiplierData).length} multipliers (${multiplierErrors} errors)`);

    // Process line items with new structure
    console.log('📈 Processing line items...');
    const lineItems = [];
    let lineItemErrors = 0;

    ['costs', 'revenues'].forEach(sourceType => {
        registry[sourceType]?.forEach(sourceConfig => {
            try {
                // Get primary data source
                const dataSource = getValueByPath(sourceConfig.path);
                validateDataSource(dataSource, sourceConfig);

                // Build data references
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

                const baseData = extractDataForPercentile(dataSource, dataReferences, sourceConfig, selectedPercentile);
                let finalData = baseData;
                let appliedMultipliers = [];

                // Apply multipliers if configured
                if (sourceConfig.multipliers && sourceConfig.multipliers.length > 0) {
                    const multiplierResult = applyMultipliers(
                        baseData,
                        sourceConfig.multipliers,
                        multiplierData
                    );
                    finalData = multiplierResult.data;
                    appliedMultipliers = multiplierResult.appliedMultipliers;
                }

                const lineItem = {
                    id: sourceConfig.id,
                    category: sourceType === 'costs' ? 'cost' : 'revenue',
                    subcategory: sourceConfig.category,
                    name: sourceConfig.description || sourceConfig.id,
                    data: finalData || [],
                    metadata: {
                        selectedPercentile,
                        hasPercentileVariation: sourceConfig.hasPercentiles,
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

    console.log(`✅ Processed ${lineItems.length} line items (${lineItemErrors} errors)`);

    // Calculate aggregations (unchanged logic)
    console.log('🧮 Calculating aggregations...');
    const aggregateByCategorySimplified = (category) => {
        const categoryItems = lineItems.filter(item => item.category === category);

        if (categoryItems.length === 0) {
            return {
                data: [],
                metadata: {
                    selectedPercentile: selectedPercentiles.unified || 50,
                    sourceCount: 0,
                    hasPercentileVariation: false
                }
            };
        }

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

        const aggregatedData = Array.from(allYears).map(year => {
            const total = categoryItems.reduce((sum, item) => {
                if (!Array.isArray(item.data)) {
                    return sum;
                }
                const dataPoint = item.data.find(d => d && d.year === year);
                return sum + (dataPoint ? (dataPoint.value || 0) : 0);
            }, 0);
            return { year, value: total };
        }).sort((a, b) => a.year - b.year);

        const hasPercentileVariation = categoryItems.some(item => item.metadata?.hasPercentileVariation);
        const representativePercentile = selectedPercentiles.strategy === 'unified'
            ? selectedPercentiles.unified
            : Math.round(Object.values(selectedPercentiles.perSource).reduce((sum, p) => sum + p, 0) / categoryItems.length);

        return {
            data: aggregatedData,
            metadata: {
                selectedPercentile: representativePercentile,
                sourceCount: categoryItems.length,
                hasPercentileVariation
            }
        };
    };

    const aggregations = {
        totalCosts: aggregateByCategorySimplified('cost'),
        totalRevenue: aggregateByCategorySimplified('revenue'),
        netCashflow: { data: [], metadata: { selectedPercentile: 50, sourceCount: 0, hasPercentileVariation: false } }
    };

    // Calculate net cashflow
    const allYears = new Set([
        ...aggregations.totalCosts.data.map(d => d.year),
        ...aggregations.totalRevenue.data.map(d => d.year)
    ]);

    aggregations.netCashflow.data = Array.from(allYears).map(year => {
        const revenue = aggregations.totalRevenue.data.find(d => d.year === year)?.value || 0;
        const cost = aggregations.totalCosts.data.find(d => d.year === year)?.value || 0;
        return { year, value: revenue - cost };
    }).sort((a, b) => a.year - b.year);

    aggregations.netCashflow.metadata = {
        selectedPercentile: aggregations.totalRevenue.metadata.selectedPercentile,
        sourceCount: aggregations.totalCosts.metadata.sourceCount + aggregations.totalRevenue.metadata.sourceCount,
        hasPercentileVariation: aggregations.totalCosts.metadata.hasPercentileVariation || aggregations.totalRevenue.metadata.hasPercentileVariation
    };

    // Calculate finance metrics
    const financeMetrics = calculateFinanceMetrics(aggregations, availablePercentiles, scenarioData, lineItems);

    const result = { metadata, lineItems, aggregations, financeMetrics };

    console.log(`✅ New transformation complete: ${lineItems.length} items, ${aggregations.totalCosts.data.length} cost points, ${aggregations.totalRevenue.data.length} revenue points`);

    return result;
};