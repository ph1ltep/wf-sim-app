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
    fee: {
        name: 'Fee',
        unit: '',  // Will be populated with currency
        calculateValue: (oemContract, year, context) => {
            const { numWTGs } = context;
            // Schema: years: Yup.array().of(Yup.number()).required('Years are required')
            if (!oemContract.years?.includes(year)) return 0;

            // Schema: fixedFee: Yup.number().required('Fixed fee is required')
            const baseFee = oemContract.fixedFee || 0;
            // Schema: isPerTurbine: Yup.boolean().default(false)
            return oemContract.isPerTurbine ? baseFee * numWTGs : baseFee;
        },
        getColorScale: () => [
            [0, 'rgb(255,255,255)'],      // White for no contract
            [0.1, 'rgb(240,249,255)'],    // Very light blue
            [0.3, 'rgb(186,228,255)'],    // Light blue  
            [0.5, 'rgb(120,198,255)'],    // Medium blue
            [0.7, 'rgb(66,165,245)'],     // Darker blue
            [1, 'rgb(25,118,210)']        // Dark blue
        ],
        formatValue: (value, context) => {
            const { currency } = context;
            if (value === 0) return 'No Contract';
            return `${currency}${value.toLocaleString()}`;
        }
    }

    // Future strategies can be added here:
    // coverage: { ... },
    // scope: { ... },
    // escalation: { ... }
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

            // Track maximum value for color scaling
            if (value > maxValue.current) {
                maxValue.current = value;
            }
        });

        valueMatrix.push(valueRow);
        textMatrix.push(textRow);
    });

    return {
        x: years,
        y: contractNames,
        z: valueMatrix,
        text: textMatrix,
        maxValue: maxValue.current,
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

    const { x, y, z, text, maxValue, strategy } = heatmapData;

    // Build Plotly heatmap configuration
    const plotData = [{
        type: 'heatmap',
        x,
        y,
        z,
        text,
        texttemplate: '%{text}',
        textfont: {
            size: 10,
            color: 'rgba(0,0,0,0.8)'
        },
        hoverongaps: false,
        hovertemplate:
            '<b>%{y}</b><br>' +
            'Year %{x}<br>' +
            '%{text}<br>' +
            '<extra></extra>',
        colorscale: strategy.getColorScale(),
        zmin: 0,
        zmax: maxValue || 1,
        showscale: true,
        colorbar: {
            title: {
                text: `${strategy.name} (${currency})`,
                side: 'right'
            },
            thickness: 15,
            len: 0.7
        }
    }];

    const layout = {
        title: {
            text: `Contract ${strategy.name} Heatmap`,
            font: { size: 16 }
        },
        xaxis: {
            title: 'Project Year',
            dtick: 1,
            tickmode: 'linear',
            side: 'bottom'
        },
        yaxis: {
            title: 'Contracts',
            automargin: true,
            tickmode: 'array',
            tickvals: Array.from({ length: y.length }, (_, i) => i),
            ticktext: y
        },
        height,
        margin: { l: 150, r: 80, t: 60, b: 60 },
        font: { family: 'Arial, sans-serif' },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
    };

    const config = {
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            'pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'resetScale2d'
        ],
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