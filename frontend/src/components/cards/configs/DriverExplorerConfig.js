// Create frontend/src/components/cards/configs/DriverExplorerConfig.js

import { getFinancialColorScheme } from '../../../utils/charts/colors';

/**
 * Create driver summary table configuration for MetricsDataTable
 * @param {Object} params - Configuration parameters
 * @param {Array} params.sensitivityResults - Sensitivity analysis results
 * @param {string} params.targetMetric - Target metric key
 * @param {Object} params.metricConfig - Metric configuration
 * @param {Function} params.onDriverSelect - Driver selection callback
 * @param {string} params.highlightedDriver - Currently highlighted driver
 * @returns {Object} Table configuration for MetricsDataTable
 */
export const createDriverSummaryTableConfig = ({
    sensitivityResults,
    targetMetric,
    metricConfig,
    onDriverSelect,
    highlightedDriver
}) => {
    // Transform sensitivity results to table data
    const tableData = sensitivityResults
        .sort((a, b) => b.impact - a.impact) // Sort by impact magnitude
        .map((result, index) => ({
            key: result.variableId,
            rank: index + 1,
            variable: result.variable,
            type: result.displayCategory,
            impact: result.impact,
            lowValue: result.variableValues.low,
            baseValue: result.variableValues.base,
            highValue: result.variableValues.high,
            confidenceInterval: result.percentileRange.confidenceInterval,
            isHighlighted: result.variableId === highlightedDriver
        }));

    // Create table configuration
    const tableConfig = {
        rowSelection: false,
        selectedColumn: null,
        onColumnSelect: null,
        onRowClick: (record) => {
            onDriverSelect?.(record.key);
        },
        columns: [
            {
                key: 'rank',
                label: 'Rank',
                width: 80,
                align: 'center'
            },
            {
                key: 'variable',
                label: 'Variable',
                width: 200,
                primary: true
            },
            {
                key: 'type',
                label: 'Type',
                width: 100,
                align: 'center'
            },
            {
                key: 'impact',
                label: `${metricConfig.label} Impact`,
                width: 120,
                align: 'right',
                valueField: (record) => record.impact,
                formatter: (value) => metricConfig.impactFormat(value)
            },
            {
                key: 'range',
                label: 'Variable Range',
                width: 150,
                align: 'center',
                valueField: (record) => `${record.lowValue} → ${record.highValue}`,
                formatter: (value) => value
            },
            {
                key: 'confidence',
                label: 'Confidence',
                width: 100,
                align: 'center',
                valueField: (record) => record.confidenceInterval,
                formatter: (value) => `${value}%`
            }
        ],
        rowClassName: (record) => {
            return record.isHighlighted ? 'driver-highlighted' : '';
        }
    };

    return { data: tableData, config: tableConfig };
};

/**
 * Create educational footer content for driver analysis
 * @param {Object} params - Parameters
 * @param {number} params.confidenceInterval - Confidence interval percentage
 * @param {number} params.variableCount - Number of variables analyzed
 * @returns {Object} Footer content configuration
 */
export const createDriverAnalysisFooter = ({ confidenceInterval, variableCount }) => {
    return {
        left: `${variableCount} variables analyzed with ${confidenceInterval}% confidence range`,
        right: 'Impact shows effect on target metric when variable moves from lower to upper percentile'
    };
};

/**
 * Create insights panel content from sensitivity results
 * @param {Array} sensitivityResults - Sensitivity analysis results
 * @param {Object} metricConfig - Metric configuration
 * @returns {Object} Insights panel configuration
 */
export const createDriverInsights = (sensitivityResults, metricConfig) => {
    if (!sensitivityResults.length) return null;

    // Sort by impact magnitude
    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);

    // Top 3 drivers
    const topDrivers = sortedResults.slice(0, 3);

    // Categorize by type
    const revenueDrivers = sortedResults.filter(r => r.variableType === 'revenue');
    const costDrivers = sortedResults.filter(r => r.variableType === 'cost');
    const multiplierDrivers = sortedResults.filter(r => r.variableType === 'multiplier');

    return {
        topDrivers: topDrivers.map(driver => ({
            name: driver.variable,
            impact: metricConfig.impactFormat(driver.impact),
            type: driver.displayCategory
        })),
        summary: {
            totalVariables: sensitivityResults.length,
            revenueDrivers: revenueDrivers.length,
            costDrivers: costDrivers.length,
            multiplierDrivers: multiplierDrivers.length,
            maxImpact: metricConfig.impactFormat(sortedResults[0].impact),
            minImpact: metricConfig.impactFormat(sortedResults[sortedResults.length - 1].impact)
        }
    };
};