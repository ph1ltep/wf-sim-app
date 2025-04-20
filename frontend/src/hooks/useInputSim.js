// src/hooks/useInputSim.js - Adding fitDistribution functionality
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useScenario } from '../contexts/ScenarioContext';
import {
    simulateDistributions,
    fitDistribution
} from '../api/simulation';

/**
 * Hook for managing input simulation operations
 */
const useInputSim = () => {
    const [loading, setLoading] = useState(false);
    const [fittingDistribution, setFittingDistribution] = useState(false);
    const { getValueByPath, updateByPath } = useScenario();

    // Function to update distribution analysis results
    const updateDistributions = useCallback(async () => {
        try {
            setLoading(true);
            message.loading('Running distribution analysis...', 0);

            // Gather the distribution settings from scenario
            const settings = getValueByPath(['settings'], {});
            const simulationSettings = getValueByPath(['settings', 'simulation'], {});
            const distributionAnalysisPath = ['simulation', 'inputSim', 'distributionAnalysis'];

            // Collect all distributions to simulate
            const distributions = [
                settings?.modules?.revenue?.energyProduction,
                settings?.modules?.revenue?.electricityPrice,
                settings?.modules?.revenue?.downtimePerEvent,
                settings?.modules?.revenue?.windVariability,
            ].filter(Boolean);

            // Prepare payload for the API
            const payload = {
                distributions,
                simulationSettings: {
                    iterations: simulationSettings.iterations || 10000,
                    seed: simulationSettings.seed || 42,
                    percentiles: simulationSettings.percentiles || [],
                },
            };

            // Call the API
            const response = await simulateDistributions(payload);

            if (response.success) {
                // Map simulation results to the right place in the context
                const results = response.data.simulationInfo;
                const mapping = {
                    energyProduction: [...distributionAnalysisPath, 'energyProduction'],
                    electricityPrice: [...distributionAnalysisPath, 'electricityPrice'],
                    downtimePerEvent: [...distributionAnalysisPath, 'downtimePerEvent'],
                    windVariability: [...distributionAnalysisPath, 'windVariability'],
                };

                // Update each distribution's results
                for (const result of results) {
                    const distributionKey = result.distribution.key;
                    if (mapping[distributionKey]) {
                        await updateByPath(mapping[distributionKey], result);
                    }
                }

                message.success('Distribution analysis completed');
                return true;
            } else {
                message.error('Distribution analysis failed: ' + (response.error || 'Unknown error'));
                return false;
            }
        } catch (error) {
            console.error('Error in distribution analysis:', error);
            message.error('Distribution analysis failed: ' + (error.message || 'Unknown error'));
            return false;
        } finally {
            setLoading(false);
            message.destroy();
        }
    }, [getValueByPath, updateByPath]);

    /**
     * Fit a distribution to time series data
     * @param {Object} distribution - Distribution configuration object
     * @param {Array} dataPoints - Array of time series data points
     * @param {Function} onSuccess - Optional callback on successful fit
     * @returns {Promise<boolean>} Success status
     */
    const fitDistributionToData = useCallback(async (distribution, dataPoints, onSuccess) => {
        if (!distribution || !dataPoints || dataPoints.length === 0) {
            message.error('Invalid data for distribution fitting');
            return false;
        }

        try {
            setFittingDistribution(true);
            message.loading('Fitting distribution to data...', 0);

            // Prepare payload for API
            const payload = {
                distribution: { ...distribution },
                dataPoints: dataPoints
            };

            // Call the API
            const response = await fitDistribution(payload);

            if (response.success) {
                // Successfully fitted distribution
                message.success('Distribution fitted to data');

                // If onSuccess callback provided, call it with the fitted parameters
                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess(response.data);
                }

                return true;
            } else {
                message.error('Failed to fit distribution: ' + (response.error || 'Unknown error'));
                return false;
            }
        } catch (error) {
            console.error('Error fitting distribution:', error);
            message.error('Failed to fit distribution: ' + (error.message || 'Unknown error'));
            return false;
        } finally {
            setFittingDistribution(false);
            message.destroy();
        }
    }, []);

    return {
        loading,
        fittingDistribution,
        updateDistributions,
        fitDistributionToData
    };
};

export default useInputSim;