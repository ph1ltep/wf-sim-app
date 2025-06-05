// src/utils/cashflowUtils.js - Core cashflow utilities
import { get } from 'lodash';

/**
 * Extract all sources that have percentiles from the registry
 * @param {Object} registry - CASHFLOW_SOURCE_REGISTRY
 * @returns {Array} Array of {id, category} objects for sources with percentiles
 */
export const getPercentileSourcesFromRegistry = (registry) => {
    const sources = [];

    // Add multipliers with percentiles
    registry.multipliers?.forEach(source => {
        if (source.hasPercentiles) {
            sources.push({ id: source.id, category: 'multipliers' });
        }
    });

    // Add costs with percentiles
    registry.costs?.forEach(source => {
        if (source.hasPercentiles) {
            sources.push({ id: source.id, category: 'costs' });
        }
    });

    // Add revenues with percentiles
    registry.revenues?.forEach(source => {
        if (source.hasPercentiles) {
            sources.push({ id: source.id, category: 'revenues' });
        }
    });

    return sources;
};

/**
 * Create default per-source percentile selection
 * @param {Array} percentileSources - Array of source objects with percentiles
 * @param {number} primaryPercentile - Default percentile value
 * @returns {Object} Object mapping sourceId to percentile value
 */
export const createPerSourceDefaults = (percentileSources, primaryPercentile) => {
    const perSourceDefaults = {};
    percentileSources.forEach(source => {
        perSourceDefaults[source.id] = primaryPercentile;
    });
    return perSourceDefaults;
};

/**
 * Validate percentile selection against available percentiles
 * @param {Object} selection - Percentile selection object
 * @param {Array} availablePercentiles - Available percentile values
 * @param {string} strategy - PERCENTILE_STRATEGIES value
 * @returns {boolean} True if selection is valid
 */
export const validatePercentileStrategy = (selection, availablePercentiles, strategy) => {
    if (availablePercentiles.length === 0) return true;

    if (strategy === 'unified') {
        return availablePercentiles.includes(selection.unified);
    } else if (strategy === 'perSource') {
        return Object.values(selection.perSource).every(p => availablePercentiles.includes(p));
    }
    return true;
};

/**
 * Get percentile value for a specific source based on current strategy
 * @param {string} sourceId - Source identifier
 * @param {Object} selectedPercentiles - Current percentile selection
 * @param {number} primaryPercentile - Fallback percentile
 * @returns {number} Percentile value for the source
 */
export const getPercentileForSource = (sourceId, selectedPercentiles, primaryPercentile) => {
    if (selectedPercentiles.strategy === 'unified') {
        return selectedPercentiles.unified;
    } else if (selectedPercentiles.strategy === 'perSource') {
        return selectedPercentiles.perSource[sourceId] || primaryPercentile;
    }
    return primaryPercentile;
};

/**
 * Aggregate line items into totals
 * @param {Array} lineItems - Array of CashflowLineItem objects
 * @param {string} category - 'cost' or 'revenue'
 * @param {Array} availablePercentiles - Available percentile values
 * @returns {Object} Aggregated data with percentile and fixed components
 */
export const aggregateLineItems = (lineItems, category, availablePercentiles) => {
    const categoryItems = lineItems.filter(item => item.category === category);

    const aggregation = {
        percentileData: new Map(),
        fixedData: []
    };

    // Aggregate percentile data
    availablePercentiles.forEach(percentile => {
        const yearlyTotals = new Map();

        categoryItems.forEach(item => {
            if (item.hasPercentileVariation && item.percentileData.has(percentile)) {
                const itemData = item.percentileData.get(percentile);
                itemData.forEach(dataPoint => {
                    const currentTotal = yearlyTotals.get(dataPoint.year) || 0;
                    yearlyTotals.set(dataPoint.year, currentTotal + dataPoint.value);
                });
            }
        });

        // Convert to array and sort by year
        const aggregatedData = Array.from(yearlyTotals.entries())
            .map(([year, value]) => ({ year: parseInt(year), value }))
            .sort((a, b) => a.year - b.year);

        aggregation.percentileData.set(percentile, aggregatedData);
    });

    // Aggregate fixed data
    const fixedYearlyTotals = new Map();
    categoryItems.forEach(item => {
        if (!item.hasPercentileVariation && item.fixedData.length > 0) {
            item.fixedData.forEach(dataPoint => {
                const currentTotal = fixedYearlyTotals.get(dataPoint.year) || 0;
                fixedYearlyTotals.set(dataPoint.year, currentTotal + dataPoint.value);
            });
        }
    });

    aggregation.fixedData = Array.from(fixedYearlyTotals.entries())
        .map(([year, value]) => ({ year: parseInt(year), value }))
        .sort((a, b) => a.year - b.year);

    return aggregation;
};

/**
 * Calculate confidence intervals for financial metrics using scenario percentiles
 * @param {Object} financingData - Finance metrics data
 * @param {Array} availablePercentiles - Available percentiles from scenario
 * @param {Object} selectedPercentiles - Selected percentile strategy
 * @returns {Object} Confidence intervals with percentile info
 */
export const calculateConfidenceIntervals = (financingData, availablePercentiles, selectedPercentiles) => {
    const primaryPercentile = selectedPercentiles?.unified || 50;

    // Use min/max from available percentiles, plus primary
    const minPercentile = Math.min(...availablePercentiles);
    const maxPercentile = Math.max(...availablePercentiles);
    const percentilesToUse = [minPercentile, primaryPercentile, maxPercentile];

    // Remove duplicates and sort
    const uniquePercentiles = [...new Set(percentilesToUse)].sort((a, b) => a - b);

    const intervals = {};

    // IRR intervals
    if (financingData.irr) {
        intervals.irr = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.irr.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // Equity IRR intervals
    if (financingData.equityIRR) {
        intervals.equityIRR = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.equityIRR.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // NPV intervals  
    if (financingData.npv) {
        intervals.npv = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.npv.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // LLCR intervals
    if (financingData.llcr) {
        intervals.llcr = uniquePercentiles.reduce((acc, p) => {
            const value = financingData.llcr.get(p);
            if (typeof value === 'number') acc[`P${p}`] = value;
            return acc;
        }, {});
    }

    // Min DSCR intervals
    if (financingData.dscr) {
        intervals.minDSCR = uniquePercentiles.reduce((acc, p) => {
            const dscrData = financingData.dscr.get(p);
            if (Array.isArray(dscrData) && dscrData.length > 0) {
                const minValue = Math.min(...dscrData.map(d => d.value));
                acc[`P${p}`] = minValue;
            }
            return acc;
        }, {});
    }

    // Store percentile info for display
    intervals._percentileInfo = {
        min: minPercentile,
        primary: primaryPercentile,
        max: maxPercentile,
        all: uniquePercentiles
    };

    return intervals;
};

/**
 * Calculate covenant breach analysis for bankability assessment - Fixed to exclude construction years
 * @param {Object} financingData - Finance metrics data
 * @param {Object} confidenceIntervals - Calculated confidence intervals
 * @param {Array} availablePercentiles - Available percentiles from scenario
 * @returns {Object} Covenant analysis with risk assessment
 */
export const calculateCovenantAnalysis = (financingData, confidenceIntervals, availablePercentiles) => {
    let totalScenarios = 0;
    let scenariosWithBreaches = 0;
    let worstCaseBreaches = [];

    availablePercentiles.forEach(p => {
        const breaches = financingData.covenantBreaches.get(p);
        totalScenarios++;

        if (Array.isArray(breaches) && breaches.length > 0) {
            // FILTER OUT negative years (construction phase) and year 0
            const operationalBreaches = breaches.filter(breach => breach.year > 0);

            if (operationalBreaches.length > 0) {
                scenariosWithBreaches++;
                worstCaseBreaches = worstCaseBreaches.concat(operationalBreaches);
            }
        }
    });

    const breachProbability = totalScenarios > 0 ? (scenariosWithBreaches / totalScenarios) * 100 : 0;

    // Risk assessment based on min DSCR and breach probability
    const minPercentile = Math.min(...availablePercentiles);
    const minDSCR = confidenceIntervals?.minDSCR?.[`P${minPercentile}`] || financingData.covenantThreshold;

    const { riskLevel, riskColor } = getBankabilityRiskLevel(breachProbability, minDSCR);

    return {
        breachProbability: Math.round(breachProbability),
        totalBreachYears: worstCaseBreaches.length, // Now only counts operational years
        riskLevel,
        riskColor,
        threshold: financingData.covenantThreshold,
        percentileCount: availablePercentiles.length
    };
};

/**
 * Get bankability risk level based on breach probability and min DSCR
 * @param {number} breachProbability - Percentage probability of covenant breaches
 * @param {number} minDSCR - Minimum DSCR across scenarios
 * @returns {Object} Risk level and color
 */
export const getBankabilityRiskLevel = (breachProbability, minDSCR) => {
    let riskLevel = 'low';
    let riskColor = '#52c41a'; // Green

    if (breachProbability > 15 || minDSCR < 1.2) {
        riskLevel = 'high';
        riskColor = '#ff4d4f'; // Red
    } else if (breachProbability > 5 || minDSCR < 1.4) {
        riskLevel = 'medium';
        riskColor = '#faad14'; // Yellow
    }

    return { riskLevel, riskColor };
};

/**
 * Prepare DSCR timeline chart data - Primary color with faded variants and different markers
 */
export const prepareDSCRChartData = (financingData, availablePercentiles, selectedPercentiles) => {
    const primaryPercentile = selectedPercentiles?.unified || 50;
    const percentilesToShow = [...availablePercentiles].sort((a, b) => a - b);
    const traces = [];

    // Marker symbols for variety
    const markerSymbols = ['circle', 'square', 'diamond', 'cross', 'triangle-up', 'triangle-down', 'star', 'hexagon'];

    percentilesToShow.forEach((percentile, index) => {
        const dscrData = financingData.dscr.get(percentile);
        if (!Array.isArray(dscrData)) return;

        const isPrimary = percentile === primaryPercentile;

        // Primary color with fading + different markers
        const baseColor = '#1890ff'; // Primary blue
        const opacity = isPrimary ? 1.0 : 0.3 + (index % 3) * 0.2; // Varied opacity
        const lineWidth = isPrimary ? 4 : 2;
        const markerSize = isPrimary ? 8 : 5;
        const markerSymbol = isPrimary ? 'circle' : markerSymbols[index % markerSymbols.length];

        traces.push({
            x: dscrData.map(d => d.year),
            y: dscrData.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: `P${percentile}${isPrimary ? ' (Primary)' : ''}`,
            line: { color: baseColor, width: lineWidth },
            marker: {
                size: markerSize,
                color: baseColor,
                symbol: markerSymbol,
                line: { width: 1, color: 'white' }
            },
            opacity: opacity,
            hovertemplate: `Year: %{x}<br>DSCR: %{y:.2f}<br>Percentile: P${percentile}<extra></extra>`
        });
    });

    // Add covenant threshold line (unchanged)
    if (traces.length > 0 && financingData.covenantThreshold) {
        const years = traces[0].x;
        traces.push({
            x: years,
            y: years.map(() => financingData.covenantThreshold),
            type: 'scatter',
            mode: 'lines',
            name: `Covenant Threshold (${financingData.covenantThreshold})`,
            line: { color: '#ff4d4f', width: 3, dash: 'dash' },
            hovertemplate: `Covenant Threshold: ${financingData.covenantThreshold}<extra></extra>`
        });
    }

    const layout = {
        title: '',
        xaxis: {
            title: 'Project Year',
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: 'Debt Service Coverage Ratio',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickformat: '.2f'
        },
        legend: {
            orientation: 'h',
            y: -0.3,
            font: { size: 10 }
        },
        margin: { t: 20, b: 100, l: 80, r: 20 },
        height: 350,
        plot_bgcolor: '#fafafa'
    };

    return { data: traces, layout };
};

/**
 * Create confidence interval statistic display component data
 * @param {string} title - Statistic title
 * @param {Object} intervals - Confidence interval data
 * @param {Object} percentileInfo - Percentile metadata
 * @param {Function} formatter - Value formatting function
 * @param {string} suffix - Value suffix
 * @returns {React.Element|null} Formatted statistic component
 */
export const createConfidenceStatistic = (title, intervals, percentileInfo, formatter = (v) => v?.toFixed(2) || '-', suffix = '') => {
    if (!intervals || !percentileInfo) return null;

    const { min, primary, max } = percentileInfo;
    const primaryValue = intervals[`P${primary}`];
    const minValue = intervals[`P${min}`];
    const maxValue = intervals[`P${max}`];

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                {title}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                {formatter(primaryValue)}{suffix}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
                P{min}: {formatter(minValue)}{suffix} | P{max}: {formatter(maxValue)}{suffix}
            </div>
        </div>
    );
};
