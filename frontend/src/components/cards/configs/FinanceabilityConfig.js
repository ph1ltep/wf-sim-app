// frontend/src/components/cards/configs/FinanceabilityConfig.js - Updated for CubeContext

import { addCovenantAnnotations } from '../../../utils/charts/annotations';
import { getFinancialColorScheme, getSemanticColor } from '../../../utils/charts/colors';

/**
 * Row configuration for FinanceabilityCard metrics table
 */
export const createFinanceabilityRowConfig = (localCurrency = 'USD') => ({
    showRowLabels: true,
    rows: [
        {
            metricId: 'projectIRR',
            label: 'Project IRR (%)',
            tooltip: {
                title: 'Project Internal Rate of Return',
                content: 'Return on total project investment before debt service. Calculated from cube projectIRR metric.',
                icon: 'DollarOutlined'
            }
            // No formatter - use registry default
            // No tags - auto-generate from registry
            // No valueField - defaults to 'value'
        },
        {
            metricId: 'equityIRR',
            label: 'Equity IRR (%)',
            tooltip: {
                title: 'Equity Internal Rate of Return',
                content: 'Return to equity investors after debt service. Calculated from cube equityIRR metric.',
                icon: 'DollarOutlined'
            }
        },
        {
            metricId: 'projectNPV',
            label: `NPV (${localCurrency}M)`,
            tooltip: {
                title: 'Net Present Value',
                content: 'Present value of all future cash flows discounted at cost of equity. From cube projectNPV metric.',
                icon: 'DollarOutlined'
            },
            // Custom formatter for currency display
            formatter: (value, rowData) => {
                if (!value && value !== 0) return '-';
                const millions = value / 1000000;
                return `$${millions.toFixed(1)}M`;
            }
        },
        {
            metricId: 'dscrMetrics', // FIXED: Use correct metric ID
            label: 'Min DSCR',
            valueField: 'value', // Extract minimum from stats
            tooltip: {
                title: 'Minimum Debt Service Coverage Ratio',
                content: 'Lowest DSCR during operational period. From cube dscrMetrics metric with stats.min extraction.',
                icon: 'SafetyOutlined'
            }
        },
        {
            metricId: 'dscrMetrics', // FIXED: Same metric ID, different field
            label: 'Avg DSCR',
            valueField: 'stats.avg', // Extract average from stats
            tooltip: {
                title: 'Average Debt Service Coverage Ratio',
                content: 'Average DSCR across operational years. From cube dscrMetrics metric with stats.avg extraction.',
                icon: 'SafetyOutlined'
            }
        },
        {
            metricId: 'minLLCR',
            label: 'Min LLCR',
            tooltip: {
                title: 'Minimum Loan Life Coverage Ratio',
                content: 'NPV of remaining cash flows vs outstanding debt. From cube minLLCR metric.',
                icon: 'SafetyOutlined'
            }
        },
        {
            metricId: 'minICR',
            label: 'Min ICR',
            tooltip: {
                title: 'Minimum Interest Coverage Ratio',
                content: 'Cash flow available for interest payments. From cube minICR metric.',
                icon: 'SafetyOutlined'
            }
        },
        {
            metricId: 'covenantBreaches',
            label: 'Covenant Breaches',
            tooltip: {
                title: 'Covenant Breach Analysis',
                content: 'Number and severity of covenant breaches across operational period.',
                icon: 'SafetyOutlined'
            },
            tags: [] // Explicitly no tags for this metric
        }
    ]
});

/**
 * Column configuration for FinanceabilityCard metrics table
 */
export const createFinanceabilityColConfig = (percentileInfo, onColumnSelect, token) => ({
    showHeader: true,
    size: 'small',
    onColumnSelect,
    //selectedColumn: `P${percentileInfo.selected || percentileInfo.primary}`,
    columns: percentileInfo.available.map(p => ({
        key: `P${p}`,
        label: `P${p}`,
        width: 80, // Explicit width
        selectable: true,
        primary: p === percentileInfo.primary,
        marker: p === percentileInfo.primary ? {
            type: 'primary',
            color: getSemanticColor('primary', 5, token), // Use token-aware colors
            tag: 'Primary'
        } : null,
    }))
});

/**
 * Create DSCR chart configuration using cube source and metrics data
 * @param {Object} context - Chart context with cube data
 * @returns {Object} Chart configuration
 */
export const createDSCRChartConfig = (context) => {
    const {
        sourceData,              // Cube source data (time-series)
        financingData,           // Transformed cube metrics
        availablePercentiles,
        primaryPercentile,
        selectedPercentile,
        projectLife,
        covenantThreshold = 1.3
    } = context;

    // Extract DSCR time-series from cube sources
    const dscrTimeSeries = sourceData?.dscr?.data || [];
    const netCashflowTimeSeries = sourceData?.netCashflow?.data || [];
    const debtServiceTimeSeries = sourceData?.debtService?.data || [];

    return {
        timeSeriesData: {
            dscr: dscrTimeSeries,
            netCashflow: netCashflowTimeSeries,
            debtService: debtServiceTimeSeries
        },
        metricsData: financingData,
        availablePercentiles,
        primaryPercentile,
        selectedPercentile,
        projectLife,
        covenantThreshold,
        chartOptions: {
            showCovenantLine: true,
            showPercentilesBand: !selectedPercentile,
            highlightPercentile: selectedPercentile || primaryPercentile
        }
    };
};

/**
 * Prepare financial timeline data for chart visualization
 * @param {Object} chartConfig - Configuration from createDSCRChartConfig
 * @returns {Object} Plotly chart data and layout
 */
export const prepareFinancialTimelineData = (chartConfig) => {
    const {
        timeSeriesData,
        metricsData,
        availablePercentiles,
        primaryPercentile,
        selectedPercentile,
        covenantThreshold,
        chartOptions
    } = chartConfig;

    const traces = [];
    const colors = getFinancialColorScheme();

    // Create DSCR traces
    // if (chartOptions.showPercentilesBand && !selectedPercentile) {
    //     // Show percentile bands
    //     //availablePercentiles.forEach((percentile, index) => {
    //     const dscrData = timeSeriesData.dscr //.filter(d => d.percentile === percentile);

    //     traces.push({
    //         x: dscrData.map(d => d.year),
    //         y: dscrData.map(d => d.value),
    //         type: 'scatter',
    //         mode: 'lines',
    //         name: `DSCR P${percentile}`,
    //         line: {
    //             color: colors.percentiles[index],
    //             width: percentile === primaryPercentile ? 3 : 1
    //         },
    //         opacity: percentile === primaryPercentile ? 1.0 : 0.6
    //     });
    //     //});
    // } else {
    // Show single percentile
    const targetPercentile = selectedPercentile || primaryPercentile;
    const dscrData = timeSeriesData.dscr //.filter(d => d.percentile === targetPercentile);

    traces.push({
        x: dscrData.map(d => d.year),
        y: dscrData.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: `DSCR P${targetPercentile}`,
        line: { color: colors.primary, width: 3 },
        marker: { color: colors.primary, size: 6 }
    });
    // }

    // Add covenant threshold line
    if (chartOptions.showCovenantLine) {
        traces.push({
            x: [1, timeSeriesData.dscr[0]?.projectLife || 20],
            y: [covenantThreshold, covenantThreshold],
            type: 'scatter',
            mode: 'lines',
            name: 'Covenant Threshold',
            line: {
                color: colors.danger,
                width: 2,
                dash: 'dash'
            }
        });
    }

    const layout = {
        title: 'Debt Service Coverage Ratio Timeline',
        xaxis: {
            title: 'Year',
            range: [1, timeSeriesData.dscr[0]?.projectLife || 20]
        },
        yaxis: {
            title: 'DSCR',
            range: [0, Math.max(3.0, Math.max(...traces[0]?.y || [3.0]) * 1.1)]
        },
        showlegend: true,
        legend: { x: 1, y: 1 },
        margin: { t: 50, r: 50, b: 50, l: 60 },
        //annotations: addCovenantAnnotations(covenantThreshold)
    };

    return { data: traces, layout };
};

/**
 * Calculate covenant analysis from cube metrics data
 * @param {Object} financingData - Transformed cube metrics
 * @param {Array} availablePercentiles - Available percentiles
 * @param {number} covenantThreshold - DSCR covenant threshold
 * @returns {Object} Covenant analysis summary
 */
export const calculateCovenantAnalysis = (financingData, availablePercentiles, covenantThreshold) => {
    const analysis = {
        breachCount: 0,
        percentileBreaches: [],
        severity: 'low',
        summary: ''
    };

    availablePercentiles.forEach(percentile => {
        const breaches = financingData.covenantBreaches?.[percentile]?.value || [];
        const minDSCR = financingData.dscr?.[percentile]?.value || 999;

        if (breaches.length > 0 || minDSCR < covenantThreshold) {
            analysis.breachCount++;
            analysis.percentileBreaches.push({
                percentile,
                breachCount: breaches.length,
                minDSCR,
                severity: minDSCR < 1.0 ? 'severe' : minDSCR < 1.2 ? 'moderate' : 'minor'
            });
        }
    });

    // Determine overall severity
    if (analysis.breachCount > availablePercentiles.length * 0.5) {
        analysis.severity = 'high';
        analysis.summary = `High financing risk: ${analysis.breachCount}/${availablePercentiles.length} percentiles show covenant breaches`;
    } else if (analysis.breachCount > 0) {
        analysis.severity = 'medium';
        analysis.summary = `Moderate financing risk: ${analysis.breachCount}/${availablePercentiles.length} percentiles show covenant breaches`;
    } else {
        analysis.summary = 'Low financing risk: No covenant breaches detected across percentiles';
    }

    return analysis;
};

/**
 * Get bankability risk level assessment
 * @param {Object} metrics - Financial metrics for assessment
 * @returns {Object} Risk level with color coding
 */
export const getBankabilityRiskLevel = (metrics) => {
    const { minDSCR, projectIRR, equityIRR, covenantBreaches, covenantThreshold } = metrics;

    let score = 0;
    const factors = [];

    // DSCR assessment
    if (minDSCR >= covenantThreshold * 1.2) {
        score += 3; // Strong
    } else if (minDSCR >= covenantThreshold) {
        score += 2; // Adequate
        factors.push('DSCR close to covenant');
    } else {
        score += 0; // Weak
        factors.push('DSCR below covenant');
    }

    // IRR assessment
    if (projectIRR >= 12) {
        score += 2;
    } else if (projectIRR >= 8) {
        score += 1;
    } else {
        factors.push('Low project returns');
    }

    // Equity IRR assessment
    if (equityIRR >= 15) {
        score += 2;
    } else if (equityIRR >= 10) {
        score += 1;
    } else {
        factors.push('Low equity returns');
    }

    // Covenant breaches
    if (covenantBreaches?.length > 0) {
        score -= covenantBreaches.length;
        factors.push(`${covenantBreaches.length} covenant breaches`);
    }

    // Determine risk level
    if (score >= 6) {
        return { level: 'low', color: 'green', description: 'Strong bankability' };
    } else if (score >= 3) {
        return { level: 'medium', color: 'orange', description: `Moderate risk: ${factors.join(', ')}` };
    } else {
        return { level: 'high', color: 'red', description: `High risk: ${factors.join(', ')}` };
    }
};

/**
 * Create financial thresholds configuration
 * @param {Object} financingData - Financial metrics data
 * @param {Object} scenarioData - Scenario configuration
 * @returns {Object} Threshold configurations by metric
 */
// const createFinancialThresholds = (financingData, scenarioData) => {
//     const financing = scenarioData?.settings?.modules?.financing || {};

//     return {
//         dscr: [
//             {
//                 field: 'covenantThreshold',
//                 comparison: 'below',
//                 colorRule: (value, threshold) => value < threshold ? { color: '#ff4d4f', fontWeight: 600 } : null,
//                 priority: 10,
//                 description: 'DSCR below covenant threshold'
//             }
//         ],
//         irr: [
//             {
//                 field: 'target_irr',
//                 comparison: 'below',
//                 colorRule: (value, threshold) => value < (financing.targetIRR || 10) ? { color: '#ff4d4f' } : null,
//                 priority: 8,
//                 description: 'Project IRR below target'
//             }
//         ],
//         equityIRR: [
//             {
//                 field: 'target_equity_irr',
//                 comparison: 'below',
//                 colorRule: (value, threshold) => value < (financing.targetEquityIRR || 12) ? { color: '#ff4d4f' } : null,
//                 priority: 8,
//                 description: 'Equity IRR below target'
//             }
//         ],
//         npv: [
//             {
//                 field: 'npv_positive',
//                 comparison: 'above',
//                 colorRule: (value) => value > 0 ? { color: '#52c41a' } : { color: '#ff4d4f' },
//                 priority: 10,
//                 description: 'NPV positive/negative indicator'
//             }
//         ],
//         avgDSCR: [
//             {
//                 field: 'covenantThreshold',
//                 comparison: 'below',
//                 colorRule: (value, threshold) => value < threshold ? { color: '#faad14' } : null,
//                 priority: 7,
//                 description: 'Average DSCR below covenant'
//             }
//         ],
//         llcr: [
//             {
//                 field: 'llcr_minimum',
//                 comparison: 'below',
//                 colorRule: (value) => value < 1.5 ? { color: '#faad14' } : null,
//                 priority: 6,
//                 description: 'LLCR below recommended minimum'
//             }
//         ],
//         icr: [
//             {
//                 field: 'icr_minimum',
//                 comparison: 'below',
//                 colorRule: (value) => value < 2.0 ? { color: '#faad14' } : null,
//                 priority: 6,
//                 description: 'ICR below recommended minimum'
//             }
//         ]
//     };
// };