// frontend/src/utils/cube/sources/transformers/equipment.js
import { extractPercentileData, filterCubeSourceData } from './common.js';
import { generateLEPTimeSeries } from '../../../lepSimUtils.js';

/**
 * LEP AEP Impact Transformer - Generate Leading Edge Protection impact over project lifetime
 * Transforms rainfall distribution data using wind speed and blade config into AEP loss time series
 * 
 * @param {Array} sourceData - SimResultsSchema array from rainfallAmount distribution
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects with AEP loss over time
 */
export const lepAepImpactTransformer = (sourceData, context) => {
    const {
        processedData,
        percentileInfo,
        customPercentile,
        addAuditEntry,
        allReferences
    } = context;

    // Get blade configuration from references
    const bladeConfig = allReferences.bladeConfig;
    if (!bladeConfig || !bladeConfig.lepType) {
        console.warn('⚠️ lepAepImpactTransformer: No blade configuration or LEP type available in references');
        return [];
    }

    // Validate rainfall source data
    if (!sourceData || !Array.isArray(sourceData) || sourceData.length === 0) {
        console.warn('⚠️ lepAepImpactTransformer: No rainfall source data provided');
        return [];
    }

    // Get wind speed data from processed sources
    const windSpeedSources = filterCubeSourceData(processedData, { sourceId: 'windSpeed' });

    if (windSpeedSources.length === 0) {
        console.warn('⚠️ lepAepImpactTransformer: No wind speed source found in processed data');
        return [];
    }

    const windSpeedSource = windSpeedSources[0];

    console.log(`🌬️ lepAepImpactTransformer: Processing LEP AEP impact for ${bladeConfig.lepType}`);

    const results = [];
    let processedPercentiles = 0;
    let totalDataPoints = 0;

    // Process each percentile separately
    percentileInfo.available.forEach(percentile => {
        try {
            // Extract DataPointSchema arrays for this percentile
            const rainfallData = extractPercentileData(sourceData, percentile);
            const windSpeedData = extractPercentileData(windSpeedSource.percentileSource, percentile);

            if (!rainfallData?.length || !windSpeedData?.length) {
                return; // Skip percentile with insufficient data
            }

            // Call core LEP physics function
            const lepResult = generateLEPTimeSeries(rainfallData, windSpeedData, bladeConfig);

            if (!lepResult?.length) {
                return; // Skip if calculation failed
            }

            // Add to results for this percentile
            results.push({
                name: 'lepAepImpact',
                data: lepResult, // DataPointSchema array
                percentile: { value: percentile },
                metadata: {
                    lepType: bladeConfig.lepType,
                    lepLength: bladeConfig.lepLength,
                    repairEnabled: bladeConfig.lepRepairEnabled,
                    customPercentile: customPercentile && customPercentile['lepAepImpact'] ? {
                        lepAepImpact: customPercentile['lepAepImpact']
                    } : null
                }
            });

            processedPercentiles++;
            totalDataPoints += lepResult.length;

        } catch (error) {
            console.error(`❌ LEP AEP Impact transformer failed for percentile ${percentile}:`, error);
        }
    });

    if (results.length === 0) {
        console.warn('⚠️ lepAepImpactTransformer: No valid LEP AEP impact results generated');
        return [];
    }

    // Calculate summary statistics
    const allLossValues = results.flatMap(r => r.data.map(d => d.value));
    const avgLoss = allLossValues.reduce((sum, val) => sum + val, 0) / allLossValues.length;

    console.log(`✅ lepAepImpactTransformer: ${results.length} percentiles, ${totalDataPoints} total data points, avg AEP loss: ${avgLoss.toFixed(4)}%`);

    // Single audit entry following financing.js pattern
    addAuditEntry(
        'apply_lep_aep_impact_transformation',
        `calculating LEP AEP impact analysis for ${bladeConfig.lepType}`,
        ['windSpeed', 'bladeConfig'],
        results,
        'transform',
        'complex'
    );

    return results;
};