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
     * Collect all distributions from hardcoded sources and market factors
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
            windVariability: scenarioData.settings.modules.revenue.windVariability,
            rainfallAmount: scenarioData.settings.marketFactors.rainfallAmount
        };

        // Add hardcoded distributions
        Object.entries(hardcodedDistributions).forEach(([key, dist]) => {
            if (dist) {
                distributions.push(dist);
            }
        });

        // Add market factor distributions (keys are now guaranteed unique by backend)
        const marketFactors = scenarioData.settings.marketFactors.factors || [];
        marketFactors.forEach(factor => {
            if (factor && factor.distribution) {
                distributions.push(factor.distribution);
            }
        });

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

            // Call simulation API
            const response = await simulateDistributions(params);

            if (response && response.success) {
                // Get all simulation results
                const results = response.data.simulationInfo;

                // Get market factor IDs for determining storage location
                const marketFactors = scenarioData.settings.marketFactors.factors || [];
                const marketFactorIds = marketFactors.map(f => f.id);

                // Create batch updates object using the keys from the distribution objects
                const updates = {};
                for (const result of results) {
                    if (result.distribution && result.distribution.key) {
                        const key = result.distribution.key;
                        
                        // Determine storage location based on whether key matches a market factor ID
                        let path;
                        if (marketFactorIds.includes(key)) {
                            // Store market factor results in marketFactors object
                            path = ['simulation', 'inputSim', 'marketFactors', key];
                        } else {
                            // Store existing distributions in distributionAnalysis (unchanged behavior)
                            path = ['simulation', 'inputSim', 'distributionAnalysis', key];
                        }
                        
                        updates[path.join('.')] = result;
                    }
                }

                // Perform a single batch update
                const result = await updateByPath(updates);

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