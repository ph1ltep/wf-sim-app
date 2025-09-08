// src/hooks/useInputSim.js - Updated for new schema structure
import { useCallback, useState } from 'react';
import { useScenario } from '../contexts/ScenarioContext';
import { message } from 'antd';
import { simulateDistributions, fitDistribution } from '../api/simulation';
import { DistributionUtils } from '../utils/distributions';

/**
 * Hook for managing input simulation data
 * @returns {Object} Input simulation functions and state
 */
const useInputSim = () => {
    const { updateByPath, scenarioData } = useScenario();
    const [loading, setLoading] = useState(false);
    const [fittingDistribution, setFittingDistribution] = useState(false);

    /**
     * Collect all distributions from hardcoded sources, market factors, and failure rates
     * @returns {Array} Array of all distributions
     */
    const collectAllDistributions = useCallback(() => {
        if (!scenarioData) return [];

        const distributions = [];

        // Hardcoded existing distributions
        const hardcodedDistributions = {
            energyProduction: scenarioData.settings.modules.revenue.energyProduction,
            electricityPrice: scenarioData.settings.modules.revenue.electricityPrice,
            escalationRate: scenarioData.settings.modules.cost.escalationRate,
            downtimePerEvent: scenarioData.settings.modules.revenue.downtimePerEvent,
            windVariability: scenarioData.settings.modules.revenue.windVariability
        };

        // Add hardcoded distributions
        Object.entries(hardcodedDistributions).forEach(([key, dist]) => {
            if (dist) {
                distributions.push(dist);
            }
        });

        // Add market factor distributions from dynamic key object structure
        const marketFactorsObject = scenarioData.settings.project?.economics?.marketFactors?.factors || {};
        // Convert object values to array and filter out non-object entries
        const marketFactorsArray = Object.values(marketFactorsObject).filter(factor => 
            factor && typeof factor === 'object' && factor.distribution
        );
        marketFactorsArray.forEach(factor => {
            distributions.push(factor.distribution);
        });

        // Add failure rate distributions from dynamic key object structure
        const failureRatesConfig = scenarioData.settings.project?.equipment?.failureRates || {};
        if (failureRatesConfig.enabled && failureRatesConfig.components) {
            const failureRatesObject = failureRatesConfig.components || {};
            // Convert object values to array and filter enabled components with distributions
            const failureRatesArray = Object.values(failureRatesObject).filter(component => 
                component && typeof component === 'object' && component.enabled && component.distribution
            );
            failureRatesArray.forEach(component => {
                distributions.push(component.distribution);
            });
        }

        return distributions;
    }, [scenarioData]);

    /**
     * Update distributions in the input simulation
     * @returns {Promise<boolean>} Success status
     */
    const updateDistributions = useCallback(async () => {
        if (!scenarioData) return false;

        try {
            setLoading(true);

            // Collect all distributions (existing + market factors)
            const allDistributions = collectAllDistributions();

            console.log('🔍 [INPUT SIM DEBUG] Raw collected distributions:', allDistributions);

            // Ensure proper structure for each distribution
            const normalizeDistribution = (dist) => {
                return dist //DistributionUtils.normalizeDistribution(dist);
            };

            // Create parameters for API request
            const params = {
                distributions: allDistributions.map(normalizeDistribution),
                simulationSettings: {
                    iterations: scenarioData.settings.simulation.iterations || 10000,
                    seed: scenarioData.settings.simulation.seed || 42,
                    years: scenarioData.settings.general.projectLife || 20,
                    percentiles: scenarioData.settings.simulation.percentiles || []
                }
            };

            console.log('📤 [INPUT SIM DEBUG] API request parameters:', params);
            console.log('📤 [INPUT SIM DEBUG] Failure rate distributions being sent:', 
                params.distributions.filter(d => d.key && d.key.startsWith('failure_')));

            // Call simulation API
            const response = await simulateDistributions(params);

            console.log('📥 [INPUT SIM DEBUG] Raw API response:', response);

            if (response && response.success) {
                // Get all simulation results
                const results = response.data.simulationInfo;

                console.log('🔄 [INPUT SIM DEBUG] Simulation results received:', results);
                console.log('🔄 [INPUT SIM DEBUG] Failure rate results:', 
                    results.filter(r => r.distribution?.key?.startsWith('failure_')));

                // Get market factor IDs for determining storage location
                const marketFactorsObject = scenarioData.settings.project?.economics?.marketFactors?.factors || {};
                const marketFactorsArray = Object.values(marketFactorsObject).filter(factor => 
                    factor && typeof factor === 'object' && factor.id
                );
                const marketFactorIds = marketFactorsArray.map(f => f.id);

                // Get failure rate component IDs for determining storage location
                const failureRatesConfig = scenarioData.settings.project?.equipment?.failureRates || {};
                const failureRatesObject = failureRatesConfig.components || {};
                const failureRatesArray = Object.values(failureRatesObject).filter(component => 
                    component && typeof component === 'object' && component.enabled && component.id
                );
                const failureRateIds = failureRatesArray.map(c => c.id);

                console.log('🎯 [INPUT SIM DEBUG] Failure rate component IDs:', failureRateIds);

                // Separate regular updates from specialized updates
                const regularUpdates = {};
                const marketFactorsUpdates = [];
                const failureRatesUpdates = [];
                
                for (const result of results) {
                    if (result.distribution && result.distribution.key) {
                        const key = result.distribution.key;
                        
                        if (marketFactorIds.includes(key)) {
                            // Store market factor results with dynamicKeys option
                            const path = ['simulation', 'inputSim', 'marketFactors', key];
                            marketFactorsUpdates.push({ path, value: result });
                        } else if (failureRateIds.includes(key)) {
                            // Store failure rate results with dynamicKeys option
                            const path = ['simulation', 'inputSim', 'failureRates', key];
                            failureRatesUpdates.push({ path, value: result });
                            
                            console.log(`💾 [INPUT SIM DEBUG] Storing failure rate result for ${key}:`, {
                                key,
                                path: path.join('.'),
                                originalDistribution: result.distribution,
                                percentiles: result.percentiles,
                                statistics: result.statistics,
                                sampleStats: result.sampleStatistics
                            });
                        } else {
                            // Store existing distributions in distributionAnalysis (unchanged behavior)
                            const path = ['simulation', 'inputSim', 'distributionAnalysis', key];
                            regularUpdates[path.join('.')] = result;
                        }
                    }
                }

                // Perform regular batch update first
                let result = { isValid: true, applied: 0, errors: [] };
                if (Object.keys(regularUpdates).length > 0) {
                    result = await updateByPath(regularUpdates);
                }

                // Perform marketFactors updates with dynamicKeys flag
                for (const { path, value } of marketFactorsUpdates) {
                    const marketResult = await updateByPath(path, value, { dynamicKeys: true });
                    if (!marketResult.isValid) {
                        result.isValid = false;
                        result.errors = [...(result.errors || []), ...(marketResult.errors || [])];
                        result.error = marketResult.error || result.error;
                    } else {
                        result.applied += marketResult.applied;
                    }
                }

                // Perform failureRates updates with dynamicKeys flag
                console.log('🚀 [INPUT SIM DEBUG] About to store failure rate updates:', failureRatesUpdates);
                
                for (const { path, value } of failureRatesUpdates) {
                    console.log(`📝 [INPUT SIM DEBUG] Updating path ${path.join('.')} with:`, value);
                    
                    const failureRateResult = await updateByPath(path, value, { dynamicKeys: true });
                    
                    console.log(`✅ [INPUT SIM DEBUG] Update result for ${path.join('.')}:`, failureRateResult);
                    
                    if (!failureRateResult.isValid) {
                        result.isValid = false;
                        result.errors = [...(result.errors || []), ...(failureRateResult.errors || [])];
                        result.error = failureRateResult.error || result.error;
                    } else {
                        result.applied += failureRateResult.applied;
                    }
                }

                if (result.isValid) {
                    message.success('Distributions updated successfully');
                    return true;
                } else {
                    message.error('Failed to update distributions: ' + (result.error || 'Unknown error'));
                    return false;
                }
            } else {
                message.error('Failed to update distributions: ' + (response?.error || 'Unknown error'));
                return false;
            }
        } catch (error) {
            console.error('Error updating distributions:', error);
            message.error('An error occurred while updating distributions');
            return false;
        } finally {
            setLoading(false);
        }
    }, [scenarioData, updateByPath, collectAllDistributions]);

    /**
     * Fit distribution to time series data
     * @param {Object} distribution Distribution object
     * @param {Array} dataPoints Time series data points
     * @param {Function} onSuccess Callback on successful fitting
     * @returns {Promise<boolean>} Success status
     */
    const fitDistributionToData = useCallback(async (distribution, dataPoints, onSuccess) => {
        if (!distribution || !dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
            message.error('Invalid data for fitting distribution');
            return false;
        }

        try {
            setFittingDistribution(true);

            // Validate distribution and data points
            const normalizedDist = DistributionUtils.normalizeDistribution(distribution);

            // Create parameters for API request
            const params = {
                distribution: {
                    type: normalizedDist.type,
                    parameters: normalizedDist.parameters,
                    timeSeriesMode: true
                },
                dataPoints: dataPoints
            };

            // Call fitting API
            const response = await fitDistribution(params);

            if (response && response.success && response.data) {
                if (onSuccess && typeof onSuccess === 'function') {
                    await onSuccess(response.data);
                }

                message.success('Distribution fitted successfully');
                return true;
            } else {
                message.error('Failed to fit distribution: ' + (response?.error || 'Unknown error'));
                return false;
            }
        } catch (error) {
            console.error('Error fitting distribution:', error);
            message.error('An error occurred while fitting distribution');
            return false;
        } finally {
            setFittingDistribution(false);
        }
    }, []);

    return {
        updateDistributions,
        fitDistributionToData,
        loading,
        fittingDistribution
    };
};

export default useInputSim;