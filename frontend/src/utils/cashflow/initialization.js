// src/utils/cashflow/initialization.js - Exportable cashflow system initialization
import { generateConstructionCostSources } from '../drawdownUtils';
import { refreshAllMetrics } from '../metricsUtils';

/**
 * Initialize cashflow system prerequisites and data
 * This is the main entry point for setting up everything needed for cashflow analysis
 * 
 * @param {Object} scenarioData - Current scenario data
 * @param {Function} getValueByPath - Function to get values from scenario
 * @param {Function} updateByPath - Function to update scenario values
 * @param {Object} options - Initialization options
 * @returns {Promise<boolean>} True if initialization succeeded
 */
export const initializeCashflowSystem = async (scenarioData, getValueByPath, updateByPath, options = {}) => {
    const {
        forceRefresh = false,
        skipMetrics = false,
        onProgress = null
    } = options;

    if (!scenarioData || !getValueByPath || !updateByPath) {
        console.error('❌ initializeCashflowSystem: Missing required parameters');
        return false;
    }

    try {
        console.log('🚀 Starting cashflow system initialization');
        onProgress?.('Checking prerequisites...');

        // Step 1: Ensure CAPEX cost sources exist
        const prerequisitesMet = await ensureScenarioPrerequisites(
            scenarioData,
            getValueByPath,
            updateByPath,
            { forceRefresh }
        );

        if (!prerequisitesMet) {
            throw new Error('Failed to ensure scenario prerequisites');
        }

        // Step 2: Refresh metrics (unless explicitly skipped)
        if (!skipMetrics) {
            onProgress?.('Refreshing financial metrics...');
            console.log('📊 Refreshing all metrics for cashflow dependencies');
            await refreshAllMetrics(scenarioData, updateByPath);

            // Wait for metrics to propagate
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        onProgress?.('Initialization complete');
        console.log('✅ Cashflow system initialization completed successfully');
        return true;

    } catch (error) {
        console.error('❌ Cashflow system initialization failed:', error);
        return false;
    }
};

/**
 * Ensure scenario has all prerequisites for cashflow transformation
 * @param {Object} scenarioData - Scenario data
 * @param {Function} getValueByPath - Function to get values from scenario
 * @param {Function} updateByPath - Function to update scenario values
 * @param {Object} options - Options
 * @returns {Promise<boolean>} True if prerequisites are met
 */
export const ensureScenarioPrerequisites = async (scenarioData, getValueByPath, updateByPath, options = {}) => {
    const { forceRefresh = false } = options;

    try {
        console.log('🔍 Checking scenario prerequisites...');
        let hasUpdates = false;
        const updates = {};

        // 1. Check CAPEX cost sources
        const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources'], []);
        const needsCostSources = forceRefresh || !Array.isArray(costSources) || costSources.length === 0;

        if (needsCostSources) {
            console.log('🏗️ Initializing CAPEX cost sources');
            const codDate = getValueByPath(['settings', 'project', 'windFarm', 'codDate']);
            updates['settings.modules.cost.constructionPhase.costSources'] = generateConstructionCostSources(codDate);
            hasUpdates = true;
        } else {
            console.log('✅ CAPEX cost sources already exist');
        }

        // 2. Validate financing module exists
        const financing = getValueByPath(['settings', 'modules', 'financing'], null);
        if (!financing) {
            console.warn('⚠️ Financing module missing - some finance metrics may not be available');
        }

        // 3. Apply updates if needed
        if (hasUpdates) {
            console.log('🔄 Applying prerequisite updates:', Object.keys(updates));
            const result = await updateByPath(updates);
            if (!result.isValid) {
                console.error('❌ Failed to apply prerequisite updates:', result.errors);
                return false;
            }
            // Wait for updates to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return true;

    } catch (error) {
        console.error('❌ Error ensuring prerequisites:', error);
        return false;
    }
};

/**
 * Check if cashflow system is ready (has all prerequisites)
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {boolean} True if ready
 */
export const isCashflowSystemReady = (getValueByPath) => {
    try {
        // Check for CAPEX cost sources
        const costSources = getValueByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources'], []);
        const hasCostSources = Array.isArray(costSources) && costSources.length > 0;

        // Check for financing module
        const financing = getValueByPath(['settings', 'modules', 'financing'], null);
        const hasFinancing = !!financing;

        return hasCostSources && hasFinancing;
    } catch (error) {
        console.error('Error checking cashflow system readiness:', error);
        return false;
    }
};