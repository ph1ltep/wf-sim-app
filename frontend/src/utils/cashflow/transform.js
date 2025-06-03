// src/utils/cashflow/transform.js - Complete transformation orchestrator with debugging
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
const extractDataForPercentile = (rawData, sourceConfig, percentile) => {
    if (sourceConfig.hasPercentiles) {
        return applyTransformer('extractPercentileData', rawData, sourceConfig, { percentile });
    } else {
        return sourceConfig.transformer
            ? applyTransformer(sourceConfig.transformer, rawData, sourceConfig)
            : applyTransformer('extractFixedData', rawData, sourceConfig);
    }
};

/**
 * Simplified transformation function with enhanced debugging
 */
export const transformScenarioToCashflow = async (
    scenarioData,
    registry,
    selectedPercentiles,
    getValueByPath
) => {
    console.log('🔄 Starting cashflow transformation...');

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

    // Extract multiplier data
    console.log('📊 Processing multipliers...');
    const multiplierData = {};
    let multiplierErrors = 0;

    registry.multipliers?.forEach(multiplierConfig => {
        const rawData = getValueByPath(multiplierConfig.path);
        if (!rawData) {
            console.warn(`⚠️ No data for multiplier '${multiplierConfig.id}'`);
            multiplierErrors++;
            return;
        }

        const selectedPercentile = getSelectedPercentileForSource(
            multiplierConfig.id,
            selectedPercentiles,
            availablePercentiles
        );

        try {
            const data = extractDataForPercentile(rawData, multiplierConfig, selectedPercentile, context);
            multiplierData[multiplierConfig.id] = data;
        } catch (error) {
            console.error(`❌ Error processing multiplier '${multiplierConfig.id}':`, error.message);
            multiplierErrors++;
            multiplierData[multiplierConfig.id] = [];
        }
    });

    console.log(`✅ Processed ${Object.keys(multiplierData).length} multipliers (${multiplierErrors} errors)`);

    // Process line items
    console.log('📈 Processing line items...');
    const lineItems = [];
    let lineItemErrors = 0;

    ['costs', 'revenues'].forEach(sourceType => {
        registry[sourceType]?.forEach(sourceConfig => {
            let rawData = {};

            // Add global data first
            Object.entries(registry.data || {}).forEach(([key, path]) => {
                const lastSegment = path[path.length - 1];
                rawData[lastSegment] = getValueByPath(path);
            });

            // Add source-specific data
            if (sourceConfig.paths) {
                Object.entries(sourceConfig.paths).forEach(([key, path]) => {
                    const lastSegment = path[path.length - 1];
                    rawData[lastSegment] = getValueByPath(path);
                });
            }
            else if (sourceConfig.path) {
                const lastSegment = sourceConfig.path[sourceConfig.path.length - 1];
                rawData[lastSegment] = getValueByPath(sourceConfig.path);
            }

            if (!rawData || Object.keys(rawData).length === 0) {
                console.warn(`⚠️ No data for ${sourceType} '${sourceConfig.id}'`);
                lineItemErrors++;
                return;
            }

            const selectedPercentile = getSelectedPercentileForSource(
                sourceConfig.id,
                selectedPercentiles,
                availablePercentiles
            );

            try {
                const baseData = extractDataForPercentile(rawData, sourceConfig, selectedPercentile);
                let finalData = baseData;
                let appliedMultipliers = [];

                console.log(`Debug - Processing ${sourceConfig.id}:`, {
                    baseDataType: typeof baseData,
                    baseDataIsArray: Array.isArray(baseData),
                    finalDataType: typeof finalData,
                    finalDataIsArray: Array.isArray(finalData),
                    finalDataLength: finalData?.length
                });

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

    // Calculate aggregations
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
            // Add validation to prevent the error
            if (!item.data || !Array.isArray(item.data)) {
                console.warn(`⚠️ Line item '${item.id}' has invalid data:`, {
                    dataType: typeof item.data,
                    isArray: Array.isArray(item.data),
                    value: item.data
                });
                // Set empty array as fallback
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
                // Additional safety check here too
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

    // Calculate finance metrics (simplified placeholders)
    const netCashflowData = aggregations.netCashflow.data;
    const representativePercentile = aggregations.netCashflow.metadata.selectedPercentile;

    const financeMetrics = calculateFinanceMetrics(aggregations, availablePercentiles, scenarioData, lineItems);

    financeMetrics.covenantBreaches.data = financeMetrics.dscr.data
        .filter(d => d.value < financeMetrics.dscr.metadata.covenantThreshold)
        .map(d => ({
            year: d.year,
            dscr: d.value,
            threshold: financeMetrics.dscr.metadata.covenantThreshold,
            margin: financeMetrics.dscr.metadata.covenantThreshold - d.value
        }));

    const result = { metadata, lineItems, aggregations, financeMetrics };

    console.log(`✅ Transformation complete: ${lineItems.length} items, ${aggregations.totalCosts.data.length} cost points, ${aggregations.totalRevenue.data.length} revenue points`);

    return result;
};