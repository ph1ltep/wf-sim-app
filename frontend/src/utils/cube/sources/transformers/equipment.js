// frontend/src/utils/cube/sources/transformers/equipment.js
import { extractPercentileData, filterCubeSourceData } from './common.js';
import { generateLEPTimeSeries } from '../../../lepSimUtils.js';

/**
 * Component Failure Rates Transformer - Generate annual failure costs for enabled components
 * Transforms component failure rate configuration into time-series cost data
 * 
 * @param {Array} sourceData - Array of component failure rate configurations
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects with component failure costs
 */
export const componentFailureRatesTransformer = (sourceData, context) => {
    const {
        processedData,
        percentileInfo,
        customPercentile,
        addAuditEntry,
        allReferences
    } = context;

    // Validate source data - should be components array
    if (!Array.isArray(sourceData)) {
        console.warn('⚠️ componentFailureRatesTransformer: sourceData is not an array');
        return [];
    }

    // Filter to enabled components only
    const enabledComponents = sourceData.filter(component => 
        component?.enabled === true && 
        component?.failureRate && 
        component?.costs
    );

    if (enabledComponents.length === 0) {
        console.log('📋 componentFailureRatesTransformer: No enabled components found');
        return [];
    }

    // Get global references
    const projectLife = allReferences.projectLife || 20;
    const numWTGs = allReferences.numWTGs || 1;

    console.log(`🔧 componentFailureRatesTransformer: Processing ${enabledComponents.length} enabled components for ${projectLife} years`);

    const results = [];
    let totalAnnualCost = 0;

    // Process each enabled component
    enabledComponents.forEach(component => {
        try {
            // Extract failure rate and cost parameters
            const failureRate = component.failureRate?.parameters?.lambda || 
                               component.failureRate?.parameters?.value || 0;

            // Extract cost components with safe defaults
            const costs = component.costs || {};
            const componentCost = costs.componentReplacement?.parameters?.value || 0;
            const craneCost = costs.craneMobilization?.parameters?.value || 0;
            const craneDailyRate = costs.craneDailyRate?.parameters?.value || 0;
            const repairDays = costs.repairDurationDays?.parameters?.value || 0;
            const laborCost = costs.specialistLabor?.parameters?.value || 0;
            const downtimePerDay = costs.downtimeRevenuePerDay?.parameters?.value || 0;

            // Calculate total cost per failure event
            const totalCraneTime = craneCost + (craneDailyRate * repairDays);
            const totalDowntimeCost = downtimePerDay * repairDays;
            const totalCostPerFailure = componentCost + totalCraneTime + laborCost + totalDowntimeCost;

            // Calculate annual failure cost: failureRate * totalCostPerFailure * numWTGs
            const annualFailureCost = failureRate * totalCostPerFailure * numWTGs;
            totalAnnualCost += annualFailureCost;

            // Generate time series data for project life
            const timeSeriesData = [];
            for (let year = 1; year <= projectLife; year++) {
                timeSeriesData.push({
                    year,
                    value: annualFailureCost
                });
            }

            console.log(`  ⚙️ ${component.name}: ${(failureRate * 100).toFixed(2)}% annual rate, $${totalCostPerFailure.toLocaleString()} per failure, $${annualFailureCost.toLocaleString()} annual cost`);

            // Add component-specific results for each percentile
            percentileInfo.available.forEach(percentile => {
                results.push({
                    name: `componentFailure_${component.id}`,
                    data: [...timeSeriesData],
                    percentile: { value: percentile },
                    metadata: {
                        componentId: component.id,
                        componentName: component.name,
                        failureRate: failureRate,
                        costPerFailure: totalCostPerFailure,
                        annualCost: annualFailureCost,
                        customPercentile: customPercentile && customPercentile[`componentFailure_${component.id}`] ? {
                            [`componentFailure_${component.id}`]: customPercentile[`componentFailure_${component.id}`]
                        } : null
                    }
                });
            });

        } catch (error) {
            console.error(`❌ componentFailureRatesTransformer failed for component ${component.id}:`, error);
        }
    });

    if (results.length === 0) {
        console.warn('⚠️ componentFailureRatesTransformer: No valid component failure results generated');
        return [];
    }

    console.log(`✅ componentFailureRatesTransformer: ${enabledComponents.length} components processed, $${totalAnnualCost.toLocaleString()} total annual cost`);

    // Add audit entry
    addAuditEntry(
        'apply_component_failure_rates_transformation',
        `calculating failure costs for ${enabledComponents.length} enabled components`,
        ['projectLife', 'numWTGs'],
        results,
        'transform',
        'complex'
    );

    return results;
};

/**
 * Component Replacement Costs Transformer - Generate replacement cost time series
 * Transforms component cost configurations into time-series data
 * 
 * @param {Array} sourceData - Array of component failure rate configurations  
 * @param {Object} context - Transformer context
 * @returns {Array} Array of SimResultsSchema objects with replacement costs
 */
export const componentReplacementCostsTransformer = (sourceData, context) => {
    const {
        processedData,
        percentileInfo,
        customPercentile,
        addAuditEntry,
        allReferences
    } = context;

    // Validate source data
    if (!Array.isArray(sourceData)) {
        console.warn('⚠️ componentReplacementCostsTransformer: sourceData is not an array');
        return [];
    }

    // Filter to enabled components only
    const enabledComponents = sourceData.filter(component => 
        component?.enabled === true && component?.costs?.componentReplacement
    );

    if (enabledComponents.length === 0) {
        console.log('📋 componentReplacementCostsTransformer: No enabled components with replacement costs found');
        return [];
    }

    // Get global references
    const projectLife = allReferences.projectLife || 20;
    const numWTGs = allReferences.numWTGs || 1;

    console.log(`💰 componentReplacementCostsTransformer: Processing replacement costs for ${enabledComponents.length} components`);

    const results = [];

    // Process each enabled component's replacement cost
    enabledComponents.forEach(component => {
        try {
            const replacementCost = component.costs.componentReplacement?.parameters?.value || 0;
            const failureRate = component.failureRate?.parameters?.lambda || 
                               component.failureRate?.parameters?.value || 0;

            // Calculate annual replacement cost: failureRate * replacementCost * numWTGs
            const annualReplacementCost = failureRate * replacementCost * numWTGs;

            // Generate time series data
            const timeSeriesData = [];
            for (let year = 1; year <= projectLife; year++) {
                timeSeriesData.push({
                    year,
                    value: annualReplacementCost
                });
            }

            console.log(`  🔧 ${component.name}: $${replacementCost.toLocaleString()} replacement cost, $${annualReplacementCost.toLocaleString()} annual`);

            // Add component-specific results for each percentile
            percentileInfo.available.forEach(percentile => {
                results.push({
                    name: `componentReplacement_${component.id}`,
                    data: [...timeSeriesData],
                    percentile: { value: percentile },
                    metadata: {
                        componentId: component.id,
                        componentName: component.name,
                        replacementCost: replacementCost,
                        failureRate: failureRate,
                        annualCost: annualReplacementCost,
                        customPercentile: customPercentile && customPercentile[`componentReplacement_${component.id}`] ? {
                            [`componentReplacement_${component.id}`]: customPercentile[`componentReplacement_${component.id}`]
                        } : null
                    }
                });
            });

        } catch (error) {
            console.error(`❌ componentReplacementCostsTransformer failed for component ${component.id}:`, error);
        }
    });

    console.log(`✅ componentReplacementCostsTransformer: ${enabledComponents.length} components processed`);

    // Add audit entry
    addAuditEntry(
        'apply_component_replacement_costs_transformation',
        `calculating replacement costs for ${enabledComponents.length} enabled components`,
        ['projectLife', 'numWTGs'],
        results,
        'transform',
        'simple'
    );

    return results;
};

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