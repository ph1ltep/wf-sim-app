// src/utils/cashflow/initialization.js - Updated with distribution prerequisites
import { generateConstructionCostSources } from '../drawdownUtils';
import { refreshAllMetrics } from '../metricsUtils';

/**
 * Check if distribution analysis has been completed
 * Uses same pattern as DistributionAnalysis.jsx
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if distributions are complete
 */
const isDistributionAnalysisComplete = (getValueByPath) => {
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    
    // Check for the key distributions that cashflow depends on
    const requiredDistributions = ['energyProduction', 'electricityPrice', 'escalationRate'];
    
    return requiredDistributions.every(key => {
        const simInfo = distributionAnalysis[key];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });
};

/**
 * Initialize cashflow system prerequisites with proper sequencing
 * Updated sequence: distributions → construction sources → metrics → ready for cashflow
 * @param {Object} scenarioData - Current scenario data
 * @param {Function} getValueByPath - Function to get values from scenario
 * @param {Function} updateByPath - Function to update scenario data
 * @param {Function} updateDistributions - Distribution update function from useInputSim
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>} Success status
 */
export const initializeCashflowSystem = async (
    scenarioData, 
    getValueByPath, 
    updateByPath, 
    updateDistributions,
    options = {}
) => {
    const { onProgress = (step) => console.log(`📋 ${step}`) } = options;

    if (!scenarioData) {
        console.error('❌ No scenario data provided for cashflow initialization');
        return false;
    }

    try {
        // Step 1: Check and run distribution analysis if needed
        onProgress('Checking distribution analysis...');
        
        if (!isDistributionAnalysisComplete(getValueByPath)) {
            onProgress('Running distribution analysis (this may take a moment)...');
            
            const distributionSuccess = await updateDistributions();
            if (!distributionSuccess) {
                console.error('❌ Distribution analysis failed');
                return false;
            }
            
            onProgress('✅ Distribution analysis completed');
        } else {
            onProgress('✅ Distribution analysis already complete');
        }

        // Step 2: Initialize construction cost sources if needed
        onProgress('Checking construction cost sources...');
        
        const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources']);
        
        if (!costSources || !Array.isArray(costSources) || costSources.length === 0) {
            onProgress('Generating construction cost sources...');
            
            const codDate = getValueByPath(['settings', 'project', 'windFarm', 'codDate']);
            const newCostSources = generateConstructionCostSources(codDate);
            
            const costSourceUpdate = await updateByPath({
                'settings.modules.cost.constructionPhase.costSources': newCostSources
            });
            
            if (!costSourceUpdate.isValid) {
                console.error('❌ Failed to initialize construction cost sources:', costSourceUpdate.error);
                return false;
            }
            
            onProgress('✅ Construction cost sources generated');
        } else {
            onProgress('✅ Construction cost sources already exist');
        }

        // Step 3: Refresh all metrics (depends on distributions and cost sources)
        onProgress('Refreshing calculated metrics...');
        
        const metricUpdates = await refreshAllMetrics(scenarioData, updateByPath);
        
        if (Object.keys(metricUpdates).length === 0) {
            console.warn('⚠️ No metrics were updated - this may indicate missing data');
        } else {
            onProgress(`✅ Refreshed ${Object.keys(metricUpdates).length} metrics`);
        }

        onProgress('🚀 Cashflow system initialization complete');
        return true;

    } catch (error) {
        console.error('❌ Cashflow system initialization failed:', error);
        return false;
    }
};

/**
 * Check if cashflow system appears ready (for UI hints)
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if system appears ready
 */
export const isCashflowSystemReady = (getValueByPath) => {
    try {
        // Check distributions
        if (!isDistributionAnalysisComplete(getValueByPath)) {
            return false;
        }

        // Check cost sources
        const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources']);
        if (!costSources || !Array.isArray(costSources) || costSources.length === 0) {
            return false;
        }

        // Check basic metrics
        const totalCapex = getValueByPath(['settings', 'metrics', 'totalCapex']);
        if (!totalCapex || totalCapex === 0) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking cashflow system readiness:', error);
        return false;
    }
};