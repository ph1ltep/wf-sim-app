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
     * Update distributions in the input simulation
     * @returns {Promise<boolean>} Success status
     */
    const updateDistributions = useCallback(async () => {
        if (!scenarioData) return false;

        try {
            setLoading(true);

            // Extract required distribution objects from scenario data
            const energyProduction = scenarioData.settings.modules.revenue.energyProduction;
            const electricityPrice = scenarioData.settings.modules.revenue.electricityPrice;
            const downtimePerEvent = scenarioData.settings.modules.revenue.downtimePerEvent;
            const windVariability = scenarioData.settings.modules.revenue.windVariability;

            // Ensure proper structure for each distribution
            const normalizeDistribution = (dist) => {
                return DistributionUtils.normalizeDistribution(dist);
            };

            // Create parameters for API request
            const params = {
                distributions: [
                    normalizeDistribution(energyProduction),
                    normalizeDistribution(electricityPrice),
                    normalizeDistribution(downtimePerEvent),
                    normalizeDistribution(windVariability)
                ],
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
                // Update each simulation result in context
                const results = response.data.simulationInfo;

                // Map results to their respective paths in the context
                const resultMap = [
                    { path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction'], index: 0 },
                    { path: ['simulation', 'inputSim', 'distributionAnalysis', 'electricityPrice'], index: 1 },
                    { path: ['simulation', 'inputSim', 'distributionAnalysis', 'downtimePerEvent'], index: 2 },
                    { path: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'], index: 3 }
                ];

                // Update each result in the scenario context
                for (const { path, index } of resultMap) {
                    if (results[index]) {
                        await updateByPath(path, results[index]);
                    }
                }

                message.success('Distributions updated successfully');
                return true;
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
    }, [scenarioData, updateByPath]);

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