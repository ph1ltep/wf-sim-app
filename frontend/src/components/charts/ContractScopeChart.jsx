// src/components/charts/ContractScopeChart.jsx
import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Empty, Spin } from 'antd';

/**
 * Data transformation strategies for different visualization modes
 * Each strategy defines how to calculate the value and color for heatmap cells
 * Uses schema-safe contract structure from settings.modules.contracts.oemContracts
 */
const VISUALIZATION_STRATEGIES = {
    'fee-total': {
        name: 'Fee (total)',
        unit: '',  // Will be populated with currency
        colorScheme: [
            [0, 'rgba(0,0,0,0)'],           // Transparent for null values
            [0.001, 'rgba(24,144,255,0.1)'], // Very light blue
            [0.3, 'rgba(24,144,255,0.3)'],   // Light blue
            [0.5, 'rgba(24,144,255,0.5)'],   // Medium blue
            [0.7, 'rgba(24,144,255,0.7)'],   // Darker blue
            [1, 'rgba(24,144,255,0.9)']      // Dark blue
        ],
        calculateValue: (oemContract, year, context) => {
            const { numWTGs } = context;
            // Schema: years: Yup.array().of(Yup.number()).required('Years are required')
            if (!oemContract.years?.includes(year)) return null; // Return null for empty years

            // Schema: fixedFee: Yup.number().required('Fixed fee is required')
            const baseFee = oemContract.fixedFee || 0;
            // Schema: isPerTurbine: Yup.boolean().default(false)
            return oemContract.isPerTurbine ? baseFee * numWTGs : baseFee;
        },
        formatValue: (value, context) => {
            const { currency } = context;
            if (value === null || value === undefined) return 'No Contract';
            if (value === 0) return 'No Contract';
            return `${currency}${value.toLocaleString()}`;
        }
    },

    'fee-per-unit': {
        name: 'Fee (per unit)',
        unit: '',  // Will be populated with currency
        colorScheme: [
            [0, 'rgba(0,0,0,0)'],           // Transparent for null values
            [0.001, 'rgba(82,196,26,0.1)'],  // Very light green
            [0.3, 'rgba(82,196,26,0.3)'],    // Light green
            [0.5, 'rgba(82,196,26,0.5)'],    // Medium green
            [0.7, 'rgba(82,196,26,0.7)'],    // Darker green
            [1, 'rgba(82,196,26,0.9)']       // Dark green
        ],
        calculateValue: (oemContract, year, context) => {
            // Schema: years: Yup.array().of(Yup.number()).required('Years are required')
            if (!oemContract.years?.includes(year)) return null; // Return null for empty years

            // Schema: fixedFee: Yup.number().required('Fixed fee is required')
            const baseFee = oemContract.fixedFee || 0;

            // For per-unit view, ALWAYS show the base fee (what's configured per unit)
            // regardless of isPerTurbine setting - this shows the unit cost
            return baseFee;
        },
        formatValue: (value, context) => {
            const { currency } = context;
            if (value === null || value === undefined) return 'No Contract';
            if (value === 0) return 'No Contract';
            return `${currency}${value.toLocaleString()}/unit`;
        }
    }

    // Future strategies can be added here with their own color schemes
    // coverage: { colorScheme: [...using #faad14], ... },
    // scope: { colorScheme: [...using #eb2f96], ... },
};

/**
 * Optimized single-pass data transformation
 * Builds heatmap data structure in one iteration through oemContracts and years
 * @param {Array} oemContracts - Array of contract objects from schema (settings.modules.contracts.oemContracts)
 * @param {number} projectLife - Project duration in years
 * @param {string} visualizationMode - Key from VISUALIZATION_STRATEGIES
 * @param {Object} context - Additional context data (numWTGs, currency, etc.)
 */
const transformContractsToHeatmapData = (oemContracts, projectLife, visualizationMode, context) => {
    const strategy = VISUALIZATION_STRATEGIES[visualizationMode];
    if (!strategy) {
        throw new Error(`Unknown visualization mode: ${visualizationMode}`);
    }

    // Pre-allocate data structures
    const years = Array.from({ length: projectLife }, (_, i) => i + 1);
    // Schema: name: Yup.string().required('Name is required')
    const contractNames = oemContracts.map(oemContract => oemContract.name || `Contract ${oemContract.id}`);

    // Initialize matrices for efficient data building
    const valueMatrix = [];
    const textMatrix = [];
    const maxValue = { current: 0 };

    // Arrays to store summation row data
    const summationValues = [];
    const summationText = [];
    const summationMaxValue = { current: 0 };

    // Single pass through oemContracts to build all data
    oemContracts.forEach((oemContract, contractIndex) => {
        const valueRow = [];
        const textRow = [];

        // Single pass through years for this contract
        years.forEach(year => {
            const value = strategy.calculateValue(oemContract, year, context);
            const formattedValue = strategy.formatValue(value, context);

            valueRow.push(value);
            textRow.push(formattedValue);

            // Track maximum value for color scaling (only for non-null values)
            if (value !== null && value !== undefined && value > maxValue.current) {
                maxValue.current = value;
            }
        });

        valueMatrix.push(valueRow);
        textMatrix.push(textRow);
    });

    // Calculate summation row
    years.forEach((year, yearIndex) => {
        let yearSum = 0;
        let hasValues = false;

        // Sum all contract values for this year
        oemContracts.forEach((oemContract) => {
            const value = strategy.calculateValue(oemContract, year, context);
            if (value !== null && value !== undefined) {
                yearSum += value;
                hasValues = true;
            }
        });

        // If no contracts active this year, show null
        const summationValue = hasValues ? yearSum : null;
        const summationFormattedValue = hasValues ?
            strategy.formatValue(yearSum, context) :
            'No Contracts';

        summationValues.push(summationValue);
        summationText.push(summationFormattedValue);

        // Track max summation value for separate color scaling
        if (summationValue !== null && summationValue > summationMaxValue.current) {
            summationMaxValue.current = summationValue;
        }
    });

    // Add summation row to the matrices - AT THE BEGINNING
    valueMatrix.unshift(summationValues);  // Add to beginning
    textMatrix.unshift(summationText);     // Add to beginning

    // Add summation row name - AT THE BEGINNING
    contractNames.unshift('📊 Total');

    return {
        x: years,
        y: contractNames,
        z: valueMatrix,
        text: textMatrix,
        maxValue: maxValue.current,
        summationMaxValue: summationMaxValue.current,
        summationRowIndex: 0,  // Now it's the first row
        strategy
    };
};

/**
 * ContractScopeChart - Plotly heatmap for contract visualization
 * @param {Array} oemContracts - Array of contract objects from schema (settings.modules.contracts.oemContracts)
 * @param {number} projectLife - Project duration in years
 * @param {number} numWTGs - Number of wind turbine generators
 * @param {string} currency - Currency code for display
 * @param {string} visualizationMode - Visualization strategy key
 * @param {string} colorTheme - Color theme for the heatmap ('default', 'blue', 'green', 'purple')
 * @param {number} height - Chart height in pixels
 * @param {string} color - Base color theme (for future use)
 * @param {boolean} loading - Loading state
 */
const ContractScopeChart = ({
    oemContracts = [],
    projectLife = 20,
    numWTGs = 20,
    currency = 'USD',
    visualizationMode = 'fee',
    colorTheme = 'default',
    height = 400,
    color = '#1890ff',
    loading = false
}) => {
    // Memoized data transformation
    const heatmapData = useMemo(() => {
        if (!oemContracts?.length || projectLife <= 0) return null;

        const context = { numWTGs, currency };

        try {
            return transformContractsToHeatmapData(oemContracts, projectLife, visualizationMode, context);
        } catch (error) {
            console.error('Error transforming contract data:', error);
            return null;
        }
    }, [oemContracts, projectLife, numWTGs, currency, visualizationMode]);

    // Loading state
    if (loading) {
        return (
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    // Empty state
    if (!heatmapData || !oemContracts?.length) {
        return (
            <div style={{ height }}>
                <Empty
                    description="No contract data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    const { x, y, z, text, maxValue, summationMaxValue, summationRowIndex, strategy } = heatmapData;

    // Build unified heatmap traces - all using same color scale based on summation max
    const summationData = {
        type: 'heatmap',
        x,
        y: [y[summationRowIndex]], // Only summation row (now first)
        z: [z[summationRowIndex]], // Only summation row values
        text: [text[summationRowIndex]], // Only summation row text
        hovertemplate:
            '<b>%{y}</b><br>' +
            'Year %{x}<br>' +
            '%{text}<br>' +
            '<extra></extra>',
        colorscale: strategy.colorScheme,
        zmin: 0,
        zmax: summationMaxValue || 1,  // Use summation max for all color scaling
        showscale: false,  // No color bar for summation
        connectgaps: false
    };

    const contractData = {
        type: 'heatmap',
        x,
        y: y.slice(1), // All except summation row (skip first)
        z: z.slice(1), // All except summation row (skip first)
        text: text.slice(1), // All except summation row (skip first)
        hovertemplate:
            '<b>%{y}</b><br>' +
            'Year %{x}<br>' +
            '%{text}<br>' +
            '<extra></extra>',
        colorscale: strategy.colorScheme,
        zmin: 0,
        zmax: summationMaxValue || 1,  // Use summation max for unified scaling
        showscale: true,
        colorbar: {
            title: {
                text: `${strategy.name} (${currency})`,
                side: 'right'
            },
            thickness: 15,
            len: 0.6  // Single color bar for entire chart
        },
        connectgaps: false,
        yaxis: 'y2'  // Use secondary y-axis for contracts
    };

    const plotData = [summationData, contractData];

    const layout = {
        // title: {
        //     text: `Contract ${strategy.name} Heatmap`,
        //     font: { size: 16 }
        // },
        xaxis: {
            dtick: 1,
            tickmode: 'linear',
            side: 'bottom',
            showgrid: true,
            gridcolor: 'rgba(0,0,0,0.1)',
            gridwidth: 1,
            zeroline: false
        },
        yaxis: {
            automargin: true,
            tickmode: 'array',
            tickvals: [0],
            ticktext: [y[summationRowIndex]], // Only summation row (now first)
            tickfont: { size: 12, weight: 'bold' },
            showgrid: false,
            zeroline: false,
            domain: [0.85, 1.0]  // Top 15% for summation row
        },
        yaxis2: {
            automargin: true,
            tickmode: 'array',
            tickvals: Array.from({ length: y.length - 1 }, (_, i) => i),
            ticktext: y.slice(1), // All except summation row (skip first)
            tickfont: { size: 12 },
            showgrid: true,
            gridcolor: 'rgba(0,0,0,0.1)',
            gridwidth: 1,
            zeroline: false,
            domain: [0, 0.7],  // Bottom 70% for individual contracts (reduced from 80%)
            anchor: 'x'
        },
        height,
        margin: { l: 150, r: 80, t: 60, b: 60 }, // Reduced right margin (single color bar)
        font: { family: 'Arial, sans-serif' },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        bargap: 0,
        bargroupgap: 0
    };

    const config = {
        displayModeBar: false,  // Hide all plotly controls
        responsive: true
    };

    return (
        <div style={{ width: '100%', height }}>
            <Plot
                data={plotData}
                layout={layout}
                config={config}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
            />
        </div>
    );
};

export default ContractScopeChart;

// Export strategies for use in parent components (dropdown options)
export { VISUALIZATION_STRATEGIES };