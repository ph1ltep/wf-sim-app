// src/utils/dependencies/checkFunctions.js
import { get } from 'lodash';

/**
 * Check if distribution analysis has been completed
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if all required distributions have results
 */
export const isDistributionsComplete = (getValueByPath) => {
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});

    // Updated list based on actual distributions collected in useInputSim.js after environment parameter migration
    const requiredDistributions = [
        'energyProduction',
        'electricityPrice',
        'downtimePerEvent',
        'windVariability',    // Moved from revenue to environment/weather
        'rainfallAmount'      // Moved from revenue to environment/weather
    ];
    // Note: escalationRate commented out in useInputSim.js, so not required

    const missing = [];
    const available = Object.keys(distributionAnalysis);

    const results = requiredDistributions.every(key => {
        const simInfo = distributionAnalysis[key];
        const isValid = simInfo && simInfo.results && simInfo.results.length > 0;
        if (!isValid) missing.push(key);
        return isValid;
    });

    if (!results) {
        console.warn('🔍 Distribution validation failed:');
        console.warn('  Missing distributions:', missing);
        console.warn('  Available distributions:', available);
        console.warn('  Required distributions:', requiredDistributions);
    }

    return results;
};

/**
 * Check if construction cost sources have been generated
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if construction sources exist and are not empty
 */
export const isConstructionSourcesComplete = (getValueByPath) => {
    const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources'], []);
    return Array.isArray(costSources) && costSources.length > 0;
};

/**
 * Check if basic metrics have been calculated
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if essential metrics exist
 */
export const isMetricsComplete = (getValueByPath) => {
    const totalCapex = getValueByPath(['settings', 'metrics', 'totalCapex'], 0);
    const totalMW = getValueByPath(['settings', 'metrics', 'totalMW'], 0);

    // Basic check - if we have meaningful CAPEX and MW values
    return totalCapex > 0 && totalMW > 0;
};