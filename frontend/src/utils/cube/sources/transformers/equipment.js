// frontend/src/utils/cube/sources/transformers/equipment.js
import { extractPercentileData, normalizeIntoSimResults } from './common.js';
import { generateLEPTimeSeries } from '../../../lepSimUtils.js';

/**
 * LEP Time Series Transformer - Generate Leading Edge Protection impact over project lifetime
 * Converts rainfall and wind data into AEP loss time series for the current LEP configuration
 * 
 * @param {null} sourceData - Not used for virtual sources
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects with AEP loss over time
 */
export const lepTimeSeriesTransformer = (sourceData, context) => {
    const {
        percentileInfo,
        customPercentile,
        addAuditEntry,
        allReferences
    } = context;

    // Get blade configuration and simulation data from references
    const bladeConfig = allReferences.bladeConfig;
    const rainfallResults = allReferences.rainfallData;
    const windResults = allReferences.windData;

    if (!bladeConfig || !bladeConfig.lepType) {
        addAuditEntry(
            'lep_config_missing',
            'blade configuration or LEP type not found in references',
            [],
            null,
            'error',
            'validation'
        );
        return [];
    }

    if (!rainfallResults?.length || !windResults?.length) {
        addAuditEntry(
            'lep_data_missing',
            'rainfall or wind simulation results not found in references',
            [],
            {
                hasRainfall: !!rainfallResults?.length,
                hasWind: !!windResults?.length
            },
            'error',
            'validation'
        );
        return [];
    }

    addAuditEntry(
        'lep_processing_start',
        `processing LEP analysis for type: ${bladeConfig.lepType}`,
        [],
        { lepType: bladeConfig.lepType, lepLength: bladeConfig.lepLength },
        'transform',
        'lep_analysis'
    );

    const results = [];

    // Process each percentile separately
    percentileInfo.available.forEach(percentile => {
        try {
            // Extract DataPointSchema arrays for this percentile from references
            const rainfallData = extractPercentileData(rainfallResults, percentile);
            const windData = extractPercentileData(windResults, percentile);

            if (!rainfallData?.length || !windData?.length) {
                addAuditEntry(
                    'lep_percentile_skip',
                    `skipping percentile ${percentile} - no data available`,
                    [],
                    { percentile, rainfallCount: rainfallData?.length, windCount: windData?.length },
                    'warning',
                    'data_validation'
                );
                return;
            }

            // Call core LEP physics function
            const lepResult = generateLEPTimeSeries(rainfallData, windData, bladeConfig);

            if (!lepResult?.length) {
                addAuditEntry(
                    'lep_calculation_failed',
                    `LEP calculation failed for percentile ${percentile}`,
                    [],
                    { percentile, lepType: bladeConfig.lepType },
                    'error',
                    'calculation'
                );
                return;
            }

            // Add to results for this percentile
            results.push({
                name: `LEP AEP Loss - ${bladeConfig.lepType}`,
                data: lepResult, // DataPointSchema array
                percentile: { value: percentile },
                metadata: {
                    lepType: bladeConfig.lepType,
                    lepLength: bladeConfig.lepLength,
                    repairEnabled: bladeConfig.lepRepairEnabled,
                    customPercentile: customPercentile && customPercentile['lepTimeSeries'] ? {
                        lepTimeSeries: customPercentile['lepTimeSeries']
                    } : null
                }
            });

            addAuditEntry(
                'lep_percentile_complete',
                `completed LEP analysis for percentile ${percentile}`,
                [],
                {
                    percentile,
                    dataPoints: lepResult.length,
                    avgAepLoss: lepResult.reduce((sum, d) => sum + d.value, 0) / lepResult.length
                },
                'transform',
                'lep_analysis'
            );

        } catch (error) {
            addAuditEntry(
                'lep_percentile_error',
                `error processing percentile ${percentile}: ${error.message}`,
                [],
                { percentile, error: error.message },
                'error',
                'calculation'
            );
            console.error(`❌ LEP transformer failed for percentile ${percentile}:`, error);
        }
    });

    if (results.length === 0) {
        addAuditEntry(
            'lep_no_results',
            'no valid LEP results generated for any percentile',
            [],
            { bladeConfig },
            'error',
            'final_validation'
        );
        return [];
    }

    addAuditEntry(
        'lep_processing_complete',
        `LEP analysis complete - generated ${results.length} percentile results`,
        [],
        {
            resultCount: results.length,
            lepType: bladeConfig.lepType,
            percentiles: results.map(r => r.percentile.value)
        },
        'transform',
        'lep_analysis'
    );

    return results;
};