// src/components/distributionFields/DistributionPlot.jsx - Updated to use defaultCurve
import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Typography, Alert, Switch, Space } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { DistributionUtils } from '../../utils/distributions';

const { Text, Paragraph } = Typography;

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
 * @param {boolean} showPercentiles - Whether to show percentile bands from scenario settings
 * @param {boolean} allowCurveToggle - Whether to allow toggling between PDF and CDF
 * @param {string} baseColor - Base color for the distribution curve and percentiles
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
    showPercentiles = true, // Default to true
    allowCurveToggle = true,
    baseColor = 'rgb(31, 119, 180)',
    style = {}
}) => {
    // State for plot data and layout
    const [plotData, setPlotData] = useState([]);
    const [plotLayout, setPlotLayout] = useState({});

    // Track whether we're showing CDF or PDF
    const [showCdf, setShowCdf] = useState(false);

    // Get scenario context for percentiles
    const { getValueByPath } = useScenario();

    // Get distribution implementation and metadata
    const distribution = useMemo(() =>
        DistributionUtils.getDistribution(distributionType),
        [distributionType]
    );

    const metadata = useMemo(() =>
        distribution ? DistributionUtils.getMetadata(distributionType, parameters) : null,
        [distribution, distributionType, parameters]
    );

    // Determine default curve type from metadata
    useEffect(() => {
        if (metadata && metadata.defaultCurve) {
            setShowCdf(metadata.defaultCurve === 'cdf');
        }
    }, [metadata]);

    // Get percentiles and primary percentile from scenario settings
    const percentiles = useMemo(() => {
        if (showPercentiles) {
            return getValueByPath(['settings', 'simulation', 'percentiles'], []);
        }
        return [];
    }, [showPercentiles, getValueByPath]);

    const primaryPercentile = useMemo(() => {
        return getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    }, [getValueByPath]);

    // Normalize parameters to ensure we have valid objects
    const normalizedParameters = useMemo(() => {
        return parameters || {};
    }, [parameters]);

    // Validate parameters using the distribution utilities
    const validationResult = useMemo(() => {
        if (!distribution) return { isValid: false, message: ["Unknown distribution type"] };
        return distribution.validate(normalizedParameters);
    }, [distribution, normalizedParameters]);

    // Update visualization when parameters or curve type changes
    useEffect(() => {
        if (validationResult.isValid && distribution) {
            const options = {
                addonAfter,
                showMean,
                showStdDev,
                showMarkers,
                showSummary,
                showPercentiles,
                percentiles,
                primaryPercentile,
                baseColor,
                useCdf: showCdf // Pass current curve selection
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
                autosize: true,
                width: 400,
                height: 300,
                margin: {
                    l: 50,
                    r: 30,
                    b: 50,
                    t: 30,
                    pad: 4
                },
                xaxis: {
                    title: { text: plotInfo.xaxisTitle, standoff: 10 },
                },
                yaxis: {
                    title: { text: plotInfo.yaxisTitle, standoff: 30 },
                    // Set fixed y-axis range for CDF curves
                    ...(showCdf ? { range: [0, 1.05] } : {})
                },
                annotations: plotInfo.annotations,
                shapes: plotInfo.shapes,
                showlegend: false, // Always hide legend
                hovermode: 'closest'
            };

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
        showSummary,
        showPercentiles,
        percentiles,
        primaryPercentile,
        baseColor,
        showCdf,
        distribution
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

    // Determine the current curve type name for the toggle label
    const curveTypeLabel = showCdf ? "CDF" : "PDF";

    return (
        <div style={{ width: '100%', ...style }}>
            {allowCurveToggle && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                    <Space>
                        <Text>View:</Text>
                        <Switch
                            checked={showCdf}
                            onChange={setShowCdf}
                            checkedChildren="CDF"
                            unCheckedChildren="PDF"
                            size="small"
                        />
                        <Text type="secondary">{curveTypeLabel}</Text>
                    </Space>
                </div>
            )}
            <Plot
                data={plotData}
                layout={plotLayout}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default DistributionPlot;