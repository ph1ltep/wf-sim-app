// frontend/src/utils/cashflow/metrics/foundational/index.js
// Foundational Metrics Registry - Tier 1 metrics that replace .aggregations/.totals

import * as totalRevenue from './totalRevenue.js';
import * as totalCosts from './totalCosts.js';
import * as totalCapex from './totalCapex.js';
import * as netCashflow from './netCashflow.js';
import * as debtService from './debtService.js';

/**
 * Foundational Metrics Registry (Tier 1)
 * These metrics replace the .aggregations/.totals system from transformScenarioToCashflow
 * Priority 1-9: Computed first, provide time-series data for analytical metrics
 */
export const FOUNDATIONAL_METRICS_REGISTRY = {
    // Revenue aggregation - Priority 1 (no dependencies)
    totalRevenue: {
        ...totalRevenue,
        priority: 1,
        category: 'foundational',
        usage: ['internal'], // Not displayed in UI cards
        dependsOn: [], // Aggregates from raw sources
        inputStrategy: 'aggregation' // Uses CASHFLOW_SOURCE_REGISTRY data
    },

    // Cost aggregation - Priority 1 (no dependencies, can run parallel to totalRevenue)
    totalCosts: {
        ...totalCosts,
        priority: 1,
        category: 'foundational',
        usage: ['internal'],
        dependsOn: [],
        inputStrategy: 'aggregation'
    },

    // Capex aggregation - Priority 1 (no dependencies)
    totalCapex: {
        ...totalCapex,
        priority: 1,
        category: 'foundational',
        usage: ['internal'],
        dependsOn: [],
        inputStrategy: 'aggregation'
    },

    // Debt service schedule - Priority 2 (no foundational dependencies, but uses raw scenario data)
    debtService: {
        ...debtService,
        priority: 2,
        category: 'foundational',
        usage: ['internal'],
        dependsOn: [], // Calculated from raw debt parameters
        inputStrategy: 'raw' // Processes raw scenario data directly
    },

    // Net cashflow - Priority 3 (depends on totalRevenue, totalCosts)
    netCashflow: {
        ...netCashflow,
        priority: 3,
        category: 'foundational',
        usage: ['internal'],
        dependsOn: ['totalRevenue', 'totalCosts'], // Uses foundational metrics as inputs
        inputStrategy: 'foundational' // New strategy: receives foundational metrics
    }
};