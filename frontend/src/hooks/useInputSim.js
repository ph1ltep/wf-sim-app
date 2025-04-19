// src/hooks/useInputSim.js

import { useState, useCallback } from 'react';
import { useScenario } from '../contexts/ScenarioContext';
import { simulateDistributions } from '../api/simulation';
import { message } from 'antd';
import { produce } from 'immer';
import { set } from 'lodash';

// Hook for managing simulation input operations
/**
 * Provides functionality to run simulations and update distribution analysis data.
 * @returns {Object} Hook methods and states
 * @returns {Function} updateDistributions - Runs simulation and updates context
 * @returns {boolean} loading - Indicates if simulation is in progress
 * @returns {string|null} error - Error message if simulation fails
 */
const useInputSim = () => {
    const { getValueByPath, updateByPath } = useScenario();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Runs simulation and updates distribution analysis
    const updateDistributions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Define distribution fields
            const distributionFields = [
                { path: ['settings', 'modules', 'revenue', 'energyProduction'], key: 'energyProduction' },
                { path: ['settings', 'modules', 'revenue', 'electricityPrice'], key: 'electricityPrice' },
                { path: ['settings', 'modules', 'revenue', 'downtimePerEvent'], key: 'downtimePerEvent' },
                { path: ['settings', 'modules', 'revenue', 'windVariability'], key: 'windVariability' }
            ];

            // Collect distributions
            const distributions = distributionFields
                .map(field => getValueByPath(field.path, null))
                .filter(dist => dist !== null);

            // Retrieve simSettings as SimSettingsSchema
            const simSettings = getValueByPath(['settings', 'simulation'], {
                iterations: 10000,
                seed: 42,
                years: 20,
                percentiles: []
            });

            // Create SimRequestSchema
            const simulationRequest = {
                distributions,
                simulationSettings: simSettings
            };

            // Call API
            const response = await simulateDistributions(simulationRequest);

            if (response.success && response.data.simulationInfo) {
                // Map API results to distributionAnalysis fields using distribution.key
                const simInfoMap = {};
                response.data.simulationInfo.forEach(info => {
                    if (info.distribution && info.distribution.key) {
                        simInfoMap[info.distribution.key] = info;
                    }
                });
                console.log('simInfoMap:', simInfoMap);

                // Batch updates for distributionAnalysis
                const updates = produce({}, draft => {
                    distributionFields.forEach(field => {
                        const info = simInfoMap[field.key];
                        if (info) {
                            set(draft, field.key, info);
                        }
                    });
                });

                // Apply batched update
                const updateResult = await updateByPath(['simulation', 'inputSim', 'distributionAnalysis'], updates);

                if (!updateResult.isValid || !updateResult.applied) {
                    throw new Error(`Failed to update distributionAnalysis: ${updateResult.errors.join(', ')} `);
                }

                const test = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
                console.log('Updated distribution analysis:', test);

                message.success('Distributions updated successfully');
            } else {
                throw new Error(response.error || 'Simulation failed');
            }
        } catch (err) {
            setError(err.message);
            message.error(`Error updating distributions: ${err.message} `);
            console.error('Simulation error:', err);
        } finally {
            setLoading(false);
        }
    }, [getValueByPath, updateByPath]);

    return { updateDistributions, loading, error };
};

export default useInputSim;