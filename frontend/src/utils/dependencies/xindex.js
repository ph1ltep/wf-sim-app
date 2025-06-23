// src/utils/dependencies/index.js - Simple dependency initialization
import { generateConstructionCostSources } from '../drawdownUtils';
import { refreshAllMetrics } from '../metricsUtils';

/**
 * Check if distributions are complete
 */
const isDistributionsComplete = (getValueByPath) => {
    const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});
    const requiredDistributions = ['energyProduction', 'electricityPrice', 'escalationRate'];
    
    return requiredDistributions.every(key => {
        const simInfo = distributionAnalysis[key];
        return simInfo && simInfo.results && simInfo.results.length > 0;
    });
};

/**
 * Check if construction cost sources exist
 */
const isConstructionSourcesComplete = (getValueByPath) => {
    const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources']);
    return costSources && Array.isArray(costSources) && costSources.length > 0;
};

/**
 * Initialize all cashflow dependencies in sequence
 * Takes the required functions as parameters instead of using hooks
 */
export const initializeCashflowDependencies = async (
    getValueByPath,
    updateByPath,
    updateDistributions,
    scenarioData
) => {
    console.log('🚀 Starting cashflow dependencies initialization');
    
    try {
        // Step 1: Distribution Analysis (if needed)
        if (!isDistributionsComplete(getValueByPath)) {
            console.log('📊 Initializing distribution analysis');
            const distributionsOk = await updateDistributions();
            if (!distributionsOk) {
                throw new Error('Distribution initialization failed');
            }
        } else {
            console.log('✅ Distribution analysis already complete');
        }
        
        // Step 2: Construction Cost Sources (if needed)
        if (!isConstructionSourcesComplete(getValueByPath)) {
            console.log('🏗️ Initializing construction cost sources');
            const codDate = getValueByPath(['settings', 'project', 'windFarm', 'codDate']);
            const result = await updateByPath({
                'settings.modules.cost.constructionPhase.costSources': generateConstructionCostSources(codDate)
            });
            if (!result.isValid) {
                throw new Error('Construction sources initialization failed');
            }
        } else {
            console.log('✅ Construction cost sources already exist');
        }
        
        // Step 3: Refresh Metrics
        console.log('🧮 Refreshing calculated metrics');
        const metricsResult = await refreshAllMetrics(scenarioData, updateByPath);
        if (Object.keys(metricsResult).length === 0) {
            console.warn('⚠️ Metrics refresh returned no updates');
        } else {
            console.log('✅ Metrics refreshed');
        }
        
        console.log('✅ All cashflow dependencies initialized');
        return true;
        
    } catch (error) {
        console.error('❌ Cashflow dependencies initialization failed:', error);
        return false;
    }
};

/**
 * Simple function to initialize construction sources (for CapexDrawdownCard)
 */
export const initializeConstructionSourcesSimple = async (getValueByPath, updateByPath) => {
    if (!isConstructionSourcesComplete(getValueByPath)) {
        console.log('🏗️ Initializing construction cost sources');
        const codDate = getValueByPath(['settings', 'project', 'windFarm', 'codDate']);
        const result = await updateByPath({
            'settings.modules.cost.constructionPhase.costSources': generateConstructionCostSources(codDate)
        });
        return result.isValid;
    }
    return true;
};