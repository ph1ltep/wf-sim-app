// // frontend/src/utils/cashflow/metrics/foundational/index.js
// import * as totalRevenue from './totalRevenue.js';
// import * as totalCosts from './totalCosts.js';
// import * as totalCapex from './totalCapex.js';
// import * as netCashflow from './netCashflow.js';
// import * as debtService from './debtService.js';

// /**
//  * Foundational Metrics Registry (Tier 1)
//  * Priority 1-9: Computed first, provide time-series data for analytical metrics
//  */
// export const FOUNDATIONAL_METRICS_REGISTRY = {
//     totalRevenue: {
//         ...totalRevenue,
//         thresholds: [],
//         dependsOn: [],
//         metadata: totalRevenue.metadata,
//         category: 'foundational',
//         usage: ['internal'],
//         priority: 1,
//         inputStrategy: 'raw',
//         cubeConfig: {
//             aggregation: { method: 'sum', options: { filter: 'all' } },
//             timeSeriesRequired: true,
//             percentileDependent: true,
//             aggregatesTo: 'time_series'
//         }
//     },

//     totalCosts: {
//         ...totalCosts,
//         thresholds: [],
//         dependsOn: [],
//         metadata: totalCosts.metadata,
//         category: 'foundational',
//         usage: ['internal'],
//         priority: 1,
//         inputStrategy: 'raw',
//         cubeConfig: {
//             aggregation: { method: 'sum', options: { filter: 'all' } },
//             timeSeriesRequired: true,
//             percentileDependent: true,
//             aggregatesTo: 'time_series'
//         }
//     },

//     totalCapex: {
//         ...totalCapex,
//         thresholds: [],
//         dependsOn: [],
//         metadata: totalCapex.metadata,
//         category: 'foundational',
//         usage: ['internal'],
//         priority: 1,
//         inputStrategy: 'raw',
//         cubeConfig: {
//             aggregation: { method: 'sum', options: { filter: 'construction' } },
//             timeSeriesRequired: true,
//             percentileDependent: true,
//             aggregatesTo: 'time_series'
//         }
//     },

//     debtService: {
//         ...debtService,
//         thresholds: [],
//         dependsOn: [],
//         metadata: debtService.metadata,
//         category: 'foundational',
//         usage: ['internal'],
//         priority: 2,
//         inputStrategy: 'raw',
//         cubeConfig: {
//             aggregation: { method: 'sum', options: { filter: 'operational' } },
//             timeSeriesRequired: true,
//             percentileDependent: false, // Debt service typically doesn't vary by percentile
//             aggregatesTo: 'time_series'
//         }
//     },

//     netCashflow: {
//         ...netCashflow,
//         thresholds: [],
//         dependsOn: ['totalRevenue', 'totalCosts'],
//         metadata: netCashflow.metadata,
//         category: 'foundational',
//         usage: ['internal'],
//         priority: 3,
//         inputStrategy: 'foundational', // Uses foundational metrics as inputs
//         cubeConfig: {
//             aggregation: { method: 'sum', options: { filter: 'all' } },
//             timeSeriesRequired: true,
//             percentileDependent: true,
//             aggregatesTo: 'time_series'
//         }
//     }
// };