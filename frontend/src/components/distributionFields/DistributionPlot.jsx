// src/components/distributionFields/DistributionPlot.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Typography, Alert } from 'antd';
import { DistributionUtils } from '../../utils/distributions';

const { Title, Text, Paragraph } = Typography;

/**
 * Component to visualize different statistical distributions
 * 
 * @param {string} distributionType - Type of distribution to visualize
 * @param {Object} parameters - Parameters for the distribution
 * @param {string} addonAfter - Unit to display on x-axis label
 * @param {boolean} showMean - Whether to show mean marker
 * @param {boolean} showStdDev - Whether to show standard deviation markers
 * @param {boolean} showMarkers - Whether to show key point markers
 * @param {boolean} showSummary - Whether to show parameter summary
 * @param {Object} style - Additional styling
 */
const DistributionPlot = ({
    distributionType,
    parameters,
    addonAfter,
    showMean = true,
    showStdDev = true,
    showMarkers = true,
    showSummary = false,
    style = {}
}) => {
    const [plotData, setPlotData] = useState([]);
    const [plotLayout, setPlotLayout] = useState({});

    // Normalize parameters to ensure we have valid objects
    const normalizedParameters = useMemo(() => {
        return parameters || {};
    }, [parameters]);

    // Validate parameters using the distribution utilities
    const validationResult = useMemo(() => {
        return DistributionUtils.validateDistributionParameters(distributionType, normalizedParameters);
    }, [distributionType, normalizedParameters]);

    // Update visualization when parameters change
    useEffect(() => {
        if (validationResult.isValid) {
            const options = {
                addonAfter,
                showMean,
                showStdDev,
                showMarkers,
                showSummary
            };

            // Use the distribution utilities to generate plot data
            const plotInfo = DistributionUtils.generateDistributionData(
                distributionType,
                normalizedParameters,
                options
            );

            setPlotData(plotInfo.data);

            // Set plot layout
            const layout = {
                title: plotInfo.title,
                autosize: true,
                width: 400,
                height: 300,
                margin: {
                    l: 50,
                    r: 30,
                    b: 50,
                    t: 10,
                    pad: 4
                },
                xaxis: {
                    title: { text: plotInfo.xaxisTitle, standoff: 10 },
                },
                yaxis: {
                    title: { text: plotInfo.yaxisTitle, standoff: 30 }
                },
                annotations: plotInfo.annotations,
                shapes: plotInfo.shapes,
                showlegend: false  // Always hide legend
            };

            if (plotInfo.legend) {
                layout.legend = plotInfo.legend;
            }

            setPlotLayout(layout);
        }
    }, [
        distributionType,
        normalizedParameters,
        validationResult.isValid,
        addonAfter,
        showMean,
        showStdDev,
        showMarkers,
        showSummary
    ]);

    // If parameters are not valid, show an enhanced warning with detailed message
    if (!validationResult.isValid) {
        return (
            <Alert
                message="Visualization not available"
                description={
                    <div style={{ fontSize: '0.9em' }}>
                        {validationResult.message && validationResult.message.length > 0 ? (
                            <>
                                <ul style={{ margin: 0, paddingLeft: '30px' }}>
                                    {validationResult.message.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            "Invalid parameters detected."
                        )}
                        {validationResult.details && (
                            <Paragraph style={{ marginTop: '8px', marginBottom: 0 }}>
                                <Text strong>Details:</Text> {validationResult.details}
                            </Paragraph>
                        )}
                    </div>
                }
                type="warning"
                showIcon
                style={{ width: '100%', ...style }}
            />
        );
    }

    return (
        <Plot
            data={plotData}
            layout={plotLayout}
            config={{ displayModeBar: false }}
            style={{ width: '100%', height: '100%', ...style }}
        />
    );
};

export default DistributionPlot;