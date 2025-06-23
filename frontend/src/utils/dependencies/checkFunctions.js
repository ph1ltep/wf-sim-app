// src/utils/dependencies/checkFunctions.js
import { get } from 'lodash';

/**
 * Check if distribution analysis has been completed
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if all required distributions have results
 */
export const isDistributionsComplete = (getValueByPath) => {
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    const requiredDistributions = ['energyProduction', 'electricityPrice', 'escalationRate'];

    return requiredDistributions.every(key => {
        const simInfo = distributionAnalysis[key];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });
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