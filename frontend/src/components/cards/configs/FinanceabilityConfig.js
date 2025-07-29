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
export const createFinanceabilityColConfig = (percentileInfo, onColumnSelect, token) => {

    const results = {
        showHeader: true,
        size: 'small',
        onColumnSelect,
        columns: [...percentileInfo.available, 0].map(p => ({
            key: `P${p}`,
            label: (p === 0) ? 'Per-Source' : `P${p}`,
            width: 80, // Explicit width
            selectable: true,
            primary: p === percentileInfo.primary,
            marker: p === percentileInfo.primary ? {
                type: 'primary',
                color: getSemanticColor('primary', 5, token), // Use token-aware colors
                tag: 'Primary'
            } : null,
        }))
    };

    // results.columns.push({
    //     key: `P0`,
    //     label: `Per-Source`,
    //     width: 80, // Explicit width
    //     selectable: true,
    //     primary: 0 === percentileInfo.primary,
    //     marker: 0 === percentileInfo.primary ? {
    //         type: 'primary',
    //         color: getSemanticColor('primary', 5, token), // Use token-aware colors
    //         tag: 'Primary'
    //     } : null,
    // });

    return results;

};

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
 * Create financeability chart configuration with dual percentiles
 * @param {Object} context - Chart context
 * @returns {Object} Chart configuration
 */
export const createFinanceabilityChartConfig = (context) => {
    const {
        primaryData,
        selectedData,
        percentileInfo,        // Use this instead of selectedChartPercentile
        staticConfig,
        primaryPayback,
        selectedPayback,
        token
    } = context;

    return {
        primaryData,
        selectedData,
        percentileInfo,        // Pass the whole object
        projectLife: staticConfig.projectLife,
        covenantThreshold: staticConfig.covenantThreshold,
        primaryPayback,
        selectedPayback,
        token
    };
};

/**
 * Prepare financeability chart data for Plotly - dual percentiles, solid lines, different shades
 * @param {Object} chartConfig - Chart configuration
 * @returns {Object} Plotly chart data and layout
 */
export const prepareFinanceabilityChartData = (chartConfig) => {
    const {
        primaryData,
        selectedData,
        percentileInfo,        // Use this for both primary and selected
        covenantThreshold,
        projectLife,
        primaryPayback,
        selectedPayback,
        token
    } = chartConfig;

    // Get percentiles from the percentileInfo object
    const primaryPercentile = percentileInfo.primary;
    const selectedPercentile = percentileInfo.selected;
    const showBothPercentiles = selectedPercentile !== primaryPercentile;

    const traces = [];

    // Validate that we have at least some data
    if ((!primaryData || Object.keys(primaryData).length === 0) &&
        (!selectedData || Object.keys(selectedData).length === 0)) {
        console.error('❌ prepareFinanceabilityChartData: No data provided');
        return { data: [], layout: {}, error: 'No chart data available' };
    }

    // Get effective percentiles
    const effectiveSelectedPercentile = percentileInfo.selected;

    // Colors - primary uses primary color shades, selected uses warning color shades
    const primaryBaseColor = getSemanticColor('neutral', 5, token);
    const selectedBaseColor = getSemanticColor('accent', 5, token);
    const covenantColor = getSemanticColor('primary', 6, token);

    // Helper function to add traces for a percentile
    const addTracesForPercentile = (sourceData, percentile, baseColor, label) => {
        if (!sourceData || Object.keys(sourceData).length === 0) {
            console.warn(`⚠️ No source data for ${label} P${percentile}`);
            return;
        }

        // Calculate color variations using proper shade parameter
        const colorType = label === 'Primary' ? 'neutral' : 'accent';
        const dscrColor = getSemanticColor(colorType, 6);  // Main shade
        const llcrColor = getSemanticColor(colorType, 3);  // Lighter shade  
        const icrColor = getSemanticColor(colorType, 1);   // Darker shade

        // DSCR trace (solid line, circle markers)
        if (sourceData.dscr && sourceData.dscr.data && sourceData.dscr.data.length > 0) {
            traces.push({
                x: sourceData.dscr.data.map(d => d.year),
                y: sourceData.dscr.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `DSCR P${percentile}${showBothPercentiles ? ` (${label})` : ''}`,
                line: { color: dscrColor, width: 3 },
                marker: {
                    color: dscrColor,
                    size: 8,
                    symbol: 'circle'
                },
                hovertemplate: 'Year: %{x}<br>DSCR: %{y:.2f}x<extra></extra>'
            });
        }

        // LLCR trace (solid line, square markers)
        if (sourceData.llcr && sourceData.llcr.data && sourceData.llcr.data.length > 0) {
            traces.push({
                x: sourceData.llcr.data.map(d => d.year),
                y: sourceData.llcr.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `LLCR P${percentile}${showBothPercentiles ? ` (${label})` : ''}`,
                line: { color: llcrColor, width: 3 },
                marker: {
                    color: llcrColor,
                    size: 7,
                    symbol: 'square'
                },
                hovertemplate: 'Year: %{x}<br>LLCR: %{y:.2f}x<extra></extra>'
            });
        }

        // ICR trace (solid line, diamond markers)
        if (sourceData.icr && sourceData.icr.data && sourceData.icr.data.length > 0) {
            traces.push({
                x: sourceData.icr.data.map(d => d.year),
                y: sourceData.icr.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `ICR P${percentile}${showBothPercentiles ? ` (${label})` : ''}`,
                line: { color: icrColor, width: 3 },
                marker: {
                    color: icrColor,
                    size: 7,
                    symbol: 'diamond'
                },
                hovertemplate: 'Year: %{x}<br>ICR: %{y:.2f}x<extra></extra>'
            });
        }
    };

    // Add traces for primary percentile
    if (primaryData) {
        addTracesForPercentile(primaryData, primaryPercentile, primaryBaseColor, 'Primary');
    }

    // Add traces for selected percentile (only if different from primary)
    if (selectedData && showBothPercentiles) {
        addTracesForPercentile(selectedData, effectiveSelectedPercentile, selectedBaseColor, 'Selected');
    }

    // Calculate Y-axis range for reference lines
    const allYValues = traces.flatMap(trace => trace.y || []);
    const maxY = allYValues.length > 0 ? Math.max(...allYValues) : 3;
    const minY = 0;

    // Add covenant threshold line (horizontal, dashed) - DSCR is universal
    if (traces.length > 0 && covenantThreshold) {
        traces.push({
            x: [0, projectLife || 20],
            y: [covenantThreshold, covenantThreshold],
            type: 'scatter',
            mode: 'lines',
            name: 'DSCR Covenant',
            line: { color: covenantColor, width: 2, dash: 'dash' },
            hovertemplate: 'Covenant: %{y:.2f}x<extra></extra>',
            showlegend: true
        });
    }

    // Add payback period lines (vertical, dashed) - both percentiles
    if (primaryPayback && primaryPayback > 0 && primaryPayback <= (projectLife || 20)) {
        traces.push({
            x: [primaryPayback, primaryPayback],
            y: [minY, Math.max(maxY * 1.1, 3)],
            type: 'scatter',
            mode: 'lines',
            name: `Payback P${primaryPercentile}${showBothPercentiles ? ' (Primary)' : ''} (${primaryPayback.toFixed(1)}y)`,
            line: { color: primaryBaseColor, width: 2, dash: 'dash' },
            hovertemplate: `Payback P${primaryPercentile}: Year %{x:.1f}<extra></extra>`,
            showlegend: true
        });
    }

    if (selectedPayback && selectedPayback > 0 && selectedPayback <= (projectLife || 20) && showBothPercentiles) {
        traces.push({
            x: [selectedPayback, selectedPayback],
            y: [minY, Math.max(maxY * 1.1, 3)],
            type: 'scatter',
            mode: 'lines',
            name: `Payback P${effectiveSelectedPercentile} (Selected) (${selectedPayback.toFixed(1)}y)`,
            line: { color: selectedBaseColor, width: 2, dash: 'dash' },
            hovertemplate: `Payback P${effectiveSelectedPercentile}: Year %{x:.1f}<extra></extra>`,
            showlegend: true
        });
    }

    // Check if we actually have any traces to display
    if (traces.length === 0) {
        console.warn('⚠️ prepareFinanceabilityChartData: No valid traces generated');
        return {
            data: [],
            layout: {},
            error: 'No valid chart data - check that DSCR, LLCR, or ICR sources contain data'
        };
    }

    const layout = {
        title: {
            //text: 'Debt Service Coverage Analysis',
            font: { size: 16, color: '#333' }
        },
        xaxis: {
            title: {
                text: 'Year',
                font: { size: 14, color: '#666' }
            },
            dtick: 1,
            range: [0, projectLife || 20],
            showline: false,
            showgrid: true,
            gridcolor: 'rgba(128,128,128,0.2)',
            tickfont: { size: 12, color: '#666' },
            zerolinecolor: 'rgba(128,128,128,0.3)'
        },
        yaxis: {
            title: {
                text: 'Coverage Ratio (x)',
                font: { size: 14, color: '#666' }
            },
            rangemode: 'tozero',
            showline: false,
            showgrid: true,
            gridcolor: 'rgba(128,128,128,0.2)',
            tickfont: { size: 12, color: '#666' },
            zerolinecolor: 'rgba(128,128,128,0.3)'
        },
        showlegend: true,
        legend: {
            x: 1.02,
            y: 1,
            xanchor: 'left',
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: 'rgba(0,0,0,0.1)',
            borderwidth: 1,
            font: { size: 11, color: '#333' }
        },
        margin: { t: 60, r: 150, b: 60, l: 70 },
        hovermode: 'x unified',
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
    };

    console.log(`✅ prepareFinanceabilityChartData: Generated ${traces.length} traces - Primary: P${primaryPercentile}, Selected: P${effectiveSelectedPercentile}, ShowBoth: ${showBothPercentiles}`);
    return { data: traces, layout };
};