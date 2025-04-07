// src/components/contextFields/DistributionPlot.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import * as jStat from 'jstat';
import { Alert } from 'antd';

/**
 * Component to visualize different statistical distributions
 * 
 * @param {string} distributionType - Type of distribution to visualize
 * @param {Object} parameters - Parameters for the distribution
 * @param {string} addonAfter - Unit to display on x-axis label
 * @param {Object} style - Additional styling
 */
const DistributionPlot = ({
    distributionType,
    parameters,
    addonAfter,
    style = {}
}) => {
    const [plotData, setPlotData] = useState([]);
    const [plotLayout, setPlotLayout] = useState({});

    // Validate parameters based on distribution type
    const validationResult = useMemo(() => {
        if (!distributionType || !parameters) {
            return { isValid: false, message: "Distribution type or parameters missing" };
        }

        switch (distributionType) {
            case 'fixed':
                if (parameters.value === undefined || parameters.value === null) {
                    return { isValid: false, message: "Fixed value is required" };
                }
                break;

            case 'normal':
                if (parameters.mean === undefined || parameters.mean === null) {
                    return { isValid: false, message: "Mean value is required" };
                }
                if (parameters.stdDev === undefined || parameters.stdDev === null || parameters.stdDev <= 0) {
                    return { isValid: false, message: "Standard deviation must be a positive number" };
                }
                break;

            case 'lognormal':
                if (parameters.mean === undefined || parameters.mean === null) {
                    return { isValid: false, message: "Mu (log-mean) value is required" };
                }
                if (parameters.sigma === undefined || parameters.sigma === null || parameters.sigma <= 0) {
                    return { isValid: false, message: "Sigma (log-std) must be a positive number" };
                }
                break;

            case 'triangular':
                if (parameters.min === undefined || parameters.min === null) {
                    return { isValid: false, message: "Minimum value is required" };
                }
                if (parameters.mode === undefined || parameters.mode === null) {
                    return { isValid: false, message: "Mode value is required" };
                }
                if (parameters.max === undefined || parameters.max === null) {
                    return { isValid: false, message: "Maximum value is required" };
                }
                if (parameters.min > parameters.mode || parameters.mode > parameters.max) {
                    return { isValid: false, message: "Triangle parameters must satisfy: min ≤ mode ≤ max" };
                }
                break;

            case 'uniform':
                if (parameters.min === undefined || parameters.min === null) {
                    return { isValid: false, message: "Minimum value is required" };
                }
                if (parameters.max === undefined || parameters.max === null) {
                    return { isValid: false, message: "Maximum value is required" };
                }
                if (parameters.min >= parameters.max) {
                    return { isValid: false, message: "Maximum must be greater than minimum" };
                }
                break;

            case 'weibull':
                if (parameters.scale === undefined || parameters.scale === null || parameters.scale <= 0) {
                    return { isValid: false, message: "Scale parameter must be positive" };
                }
                if (parameters.shape === undefined || parameters.shape === null || parameters.shape <= 0) {
                    return { isValid: false, message: "Shape parameter must be positive" };
                }
                break;

            case 'exponential':
                if (parameters.lambda === undefined || parameters.lambda === null || parameters.lambda <= 0) {
                    return { isValid: false, message: "Lambda parameter must be positive" };
                }
                break;

            case 'poisson':
                if (parameters.lambda === undefined || parameters.lambda === null || parameters.lambda <= 0) {
                    return { isValid: false, message: "Lambda parameter must be positive" };
                }
                break;

            case 'kaimal':
                if (parameters.meanWindSpeed === undefined || parameters.meanWindSpeed === null || parameters.meanWindSpeed <= 0) {
                    return { isValid: false, message: "Mean wind speed must be positive" };
                }
                if (parameters.turbulenceIntensity === undefined || parameters.turbulenceIntensity === null || parameters.turbulenceIntensity <= 0) {
                    return { isValid: false, message: "Turbulence intensity must be positive" };
                }
                break;

            case 'gbm':
                if (parameters.value === undefined || parameters.value === null || parameters.value <= 0) {
                    return { isValid: false, message: "Initial value must be positive" };
                }
                if (parameters.drift === undefined || parameters.drift === null) {
                    return { isValid: false, message: "Drift parameter is required" };
                }
                if (parameters.volatility === undefined || parameters.volatility === null || parameters.volatility <= 0) {
                    return { isValid: false, message: "Volatility must be positive" };
                }
                if (parameters.timeStep === undefined || parameters.timeStep === null || parameters.timeStep <= 0) {
                    return { isValid: false, message: "Time step must be positive" };
                }
                break;

            default:
                return { isValid: false, message: `Unknown distribution type: ${distributionType}` };
        }

        return { isValid: true };
    }, [distributionType, parameters]);

    useEffect(() => {
        if (validationResult.isValid) {
            updateVisualization(distributionType, parameters);
        }
    }, [distributionType, parameters, validationResult.isValid]);

    // Helper function to generate x values
    const generateXValues = (min, max, count = 100) => {
        const step = (max - min) / count;
        const values = [];
        for (let i = 0; i <= count; i++) {
            values.push(min + step * i);
        }
        return values;
    };

    // Helper to get parameter with default value
    const getParam = (params, key, defaultVal = 0) => {
        return params && params[key] !== undefined ? params[key] : defaultVal;
    };

    const calculateStdDev = (type, params) => {
        switch (type) {
            case 'normal':
                return getParam(params, 'stdDev', 1);
            case 'lognormal': {
                const mu = getParam(params, 'mean', 0);
                const sigma = getParam(params, 'sigma', 0.5);
                const variance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
                return Math.sqrt(variance);
            }
            case 'triangular': {
                const min = getParam(params, 'min', 0);
                const mode = getParam(params, 'mode', 5);
                const max = getParam(params, 'max', 10);
                return Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);
            }
            case 'uniform': {
                const min = getParam(params, 'min', 0);
                const max = getParam(params, 'max', 10);
                return Math.sqrt((max - min) * (max - min) / 12);
            }
            case 'weibull': {
                const scale = getParam(params, 'scale', 1);
                const shape = getParam(params, 'shape', 2);
                const mean = scale * jStat.gammafn(1 + 1 / shape);
                const variance = scale * scale * (jStat.gammafn(1 + 2 / shape) - Math.pow(jStat.gammafn(1 + 1 / shape), 2));
                return Math.sqrt(variance);
            }
            case 'exponential': {
                const lambda = getParam(params, 'lambda', 1);
                return 1 / lambda; // Standard deviation equals mean for exponential
            }
            case 'poisson': {
                const lambda = getParam(params, 'lambda', 3);
                return Math.sqrt(lambda); // Standard deviation equals square root of lambda for Poisson
            }
            case 'kaimal': {
                const meanWindSpeed = getParam(params, 'meanWindSpeed', 10);
                const turbulenceIntensity = getParam(params, 'turbulenceIntensity', 10) / 100;
                return meanWindSpeed * turbulenceIntensity;
            }
            default:
                return null;
        }
    };

    const addStdDevMarkers = (type, params, data, annotations, shapes) => {
        const stdDev = calculateStdDev(type, params);
        if (!stdDev) return;

        // For distributions with a clear mean/center
        switch (type) {
            case 'normal': {
                // Already handled in normal distribution case
                break;
            }
            case 'lognormal': {
                const mu = getParam(params, 'mean', 0);
                const sigma = getParam(params, 'sigma', 0.5);
                const mean = Math.exp(mu + sigma * sigma / 2);
                const peakY = jStat.lognormal.pdf(Math.exp(mu - sigma * sigma), mu, sigma);

                // Add +/- 1 and 2 standard deviation markers
                shapes.push(
                    createVerticalLine(mean + stdDev, jStat.lognormal.pdf(mean + stdDev, mu, sigma)),
                    createVerticalLine(mean - stdDev, jStat.lognormal.pdf(Math.max(0.001, mean - stdDev), mu, sigma)),
                    createVerticalLine(mean + 2 * stdDev, jStat.lognormal.pdf(mean + 2 * stdDev, mu, sigma)),
                    createVerticalLine(mean - 2 * stdDev, jStat.lognormal.pdf(Math.max(0.001, mean - 2 * stdDev), mu, sigma))
                );

                // Add labels for standard deviation
                annotations.push(
                    {
                        x: mean + stdDev,
                        y: jStat.lognormal.pdf(mean + stdDev, mu, sigma),
                        xanchor: 'left',
                        text: '+1σ',
                        showarrow: false,
                        font: { size: 10 },
                        xshift: 10
                    },
                    {
                        x: Math.max(0.001, mean - stdDev),
                        y: jStat.lognormal.pdf(Math.max(0.001, mean - stdDev), mu, sigma),
                        xanchor: 'right',
                        text: '-1σ',
                        showarrow: false,
                        font: { size: 10 },
                        xshift: -10
                    }
                );
                break;
            }
            // Add similar case blocks for other distribution types
            case 'uniform':
            case 'triangular':
            case 'weibull':
            case 'exponential':
            case 'poisson':
            case 'kaimal': {
                // Implementation for each type will be similar to lognormal
                // But calculate mean and use PDF functions specific to each distribution
                break;
            }
            default:
                break;
        }
    }

    // Create the main curve for the plot
    const createMainCurve = (xValues, yValues, type = 'scatter') => {
        if (type === 'bar') {
            return {
                x: xValues,
                y: yValues,
                type: 'bar',
                marker: {
                    color: 'rgba(49, 130, 189, 0.7)',
                    line: {
                        color: 'rgb(49, 130, 189)',
                        width: 1
                    }
                }
            };
        }

        return {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: 'rgb(49, 130, 189)',
                width: 2
            },
            fill: 'tozeroy',
            fillcolor: 'rgba(49, 130, 189, 0.2)'
        };
    };

    // Create markers for key points
    const createMarkers = (markers) => {
        return {
            x: markers.map(m => m.x),
            y: markers.map(m => m.y),
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: 'red',
                size: 8,
                symbol: 'circle'
            },
            showlegend: false
        };
    };

    // Create annotations for markers
    const createMarkerAnnotations = (markers) => {
        return markers.map(marker => ({
            x: marker.x,
            y: marker.y,
            xanchor: marker.xanchor || 'left',
            yanchor: marker.yanchor || 'middle',
            text: marker.label,
            showarrow: false,
            font: {
                size: marker.fontSize || 10
            },
            xshift: marker.xshift || 10,
            yshift: marker.yshift || 0
        }));
    };

    // Create parameter label
    const createParameterLabel = (x, y, text, position = 'center') => {
        return null; /*{
            x: x,
            y: y,
            xanchor: position,
            text: text,
            showarrow: false,
            bgcolor: 'rgba(255, 255, 0, 0.8)',
            bordercolor: 'rgba(0, 0, 0, 0.2)',
            borderwidth: 1,
            borderpad: 3,
            font: {
                size: 12
            }
        };*/
    };

    // Create vertical line shape
    const createVerticalLine = (x, y, lineStyle = { color: 'rgba(0, 0, 0, 0.5)', width: 1, dash: 'dot' }) => {
        return {
            type: 'line',
            x0: x,
            y0: 0,
            x1: x,
            y1: y,
            line: lineStyle
        };
    };

    // Function to generate distribution visualization data
    const updateVisualization = (type, params) => {
        if (!params) return;

        let data = [];
        let shapes = [];
        let annotations = [];
        let title = '';

        switch (type) {
            case 'fixed': {
                const value = getParam(params, 'value', 0);
                const xValues = [value - 1, value - 0.01, value, value + 0.01, value + 1];
                const yValues = [0, 0, 1, 0, 0];

                title = 'Fixed Value Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers
                const markers = [{ x: value, y: 0.5, label: `Value: ${value}` }];
                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                break;
            }
            case 'normal': {
                const mean = getParam(params, 'mean', 0);
                const stdDev = getParam(params, 'stdDev', 1);

                // Generate x values
                const min = mean - 4 * stdDev;
                const max = mean + 4 * stdDev;
                const xValues = generateXValues(min, max);

                // Calculate PDF values
                const yValues = xValues.map(x => jStat.normal.pdf(x, mean, stdDev));
                const peakY = jStat.normal.pdf(mean, mean, stdDev);

                title = 'Normal Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers and vertical lines for standard deviations
                const markers = [
                    { x: mean, y: peakY, label: 'μ' },
                    { x: mean + stdDev, y: jStat.normal.pdf(mean + stdDev, mean, stdDev), label: '+1σ' },
                    { x: mean - stdDev, y: jStat.normal.pdf(mean - stdDev, mean, stdDev), label: '-1σ' },
                    { x: mean + 2 * stdDev, y: jStat.normal.pdf(mean + 2 * stdDev, mean, stdDev), label: '+2σ' },
                    { x: mean - 2 * stdDev, y: jStat.normal.pdf(mean - 2 * stdDev, mean, stdDev), label: '-2σ' }
                ];

                // Add vertical lines
                shapes.push(
                    createVerticalLine(mean, peakY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(mean + stdDev, jStat.normal.pdf(mean + stdDev, mean, stdDev)),
                    createVerticalLine(mean - stdDev, jStat.normal.pdf(mean - stdDev, mean, stdDev)),
                    createVerticalLine(mean + 2 * stdDev, jStat.normal.pdf(mean + 2 * stdDev, mean, stdDev)),
                    createVerticalLine(mean - 2 * stdDev, jStat.normal.pdf(mean - 2 * stdDev, mean, stdDev))
                );

                // Add parameter markers and labels
                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    mean + 2 * stdDev,
                    peakY / 2,
                    `μ: ${mean.toFixed(2)}, σ: ${stdDev.toFixed(2)}`,
                    'right'
                ));

                break;
            }
            case 'lognormal': {
                const mu = getParam(params, 'mean', 0);
                const sigma = getParam(params, 'sigma', 0.5);

                // Generate x values
                const min = Math.max(0.01, Math.exp(mu - 4 * sigma));
                const max = Math.exp(mu + 4 * sigma);
                const xValues = generateXValues(min, max);

                // Calculate PDF values
                const yValues = xValues.map(x => jStat.lognormal.pdf(x, mu, sigma));

                // Calculate key points
                const mode = Math.exp(mu - sigma * sigma);
                const median = Math.exp(mu);
                const mean = Math.exp(mu + sigma * sigma / 2);
                const peakY = jStat.lognormal.pdf(mode, mu, sigma);

                // Calculate standard deviation
                const variance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
                const stdDev = Math.sqrt(variance);

                title = 'Lognormal Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers for key points
                const markers = [
                    { x: mode, y: peakY, label: 'Mode' },
                    { x: median, y: jStat.lognormal.pdf(median, mu, sigma), label: 'Median' },
                    { x: mean, y: jStat.lognormal.pdf(mean, mu, sigma), label: 'Mean' },
                    { x: mean + stdDev, y: jStat.lognormal.pdf(mean + stdDev, mu, sigma), label: '+1σ' },
                    { x: Math.max(0.001, mean - stdDev), y: jStat.lognormal.pdf(Math.max(0.001, mean - stdDev), mu, sigma), label: '-1σ' }
                ];

                // Add standard deviation lines
                shapes.push(
                    createVerticalLine(mean, jStat.lognormal.pdf(mean, mu, sigma), { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(mean + stdDev, jStat.lognormal.pdf(mean + stdDev, mu, sigma)),
                    createVerticalLine(Math.max(0.001, mean - stdDev), jStat.lognormal.pdf(Math.max(0.001, mean - stdDev), mu, sigma))
                );

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    mean,
                    peakY / 2,
                    `μ: ${mu.toFixed(2)}, σ: ${sigma.toFixed(2)}
StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                ));

                break;
            }
            case 'triangular': {
                const min = getParam(params, 'min', 0);
                const mode = getParam(params, 'mode', 5);
                const max = getParam(params, 'max', 10);

                // Generate x values
                const xValues = generateXValues(min - 0.1, max + 0.1);

                // Calculate PDF values
                const yValues = xValues.map(x => {
                    if (x < min || x > max) return 0;
                    if (x < mode) {
                        return 2 * (x - min) / ((max - min) * (mode - min));
                    } else {
                        return 2 * (max - x) / ((max - min) * (max - mode));
                    }
                });

                // Calculate peak height
                const peakY = 2 / (max - min);

                // Calculate mean and standard deviation
                const mean = (min + mode + max) / 3;
                const stdDev = Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);

                title = 'Triangular Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers for key points
                const markers = [
                    { x: min, y: 0, label: 'Min', yanchor: 'bottom', yshift: 10 },
                    { x: mode, y: peakY, label: 'Mode', xanchor: 'center', yanchor: 'bottom' },
                    { x: max, y: 0, label: 'Max', xanchor: 'right', yanchor: 'bottom', yshift: 10 },
                    { x: mean, y: yValues.find((_, i) => xValues[i] >= mean) || 0, label: 'Mean' }
                ];

                // Add mean and std dev lines
                shapes.push(
                    createVerticalLine(mean, yValues.find((_, i) => xValues[i] >= mean) || 0, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(mean + stdDev, yValues.find((_, i) => xValues[i] >= mean + stdDev) || 0),
                    createVerticalLine(mean - stdDev, yValues.find((_, i) => xValues[i] >= mean - stdDev) || 0)
                );

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    (min + max) / 2,
                    peakY / 2,
                    `Min: ${min}, Mode: ${mode}, Max: ${max} Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                ));

                break;
            }
            case 'uniform': {
                const min = getParam(params, 'min', 0);
                const max = getParam(params, 'max', 10);

                // Generate x values
                const xValues = generateXValues(min - 0.5, max + 0.5);

                // Calculate PDF values
                const height = 1 / (max - min);
                const yValues = xValues.map(x => {
                    return (x >= min && x <= max) ? height : 0;
                });

                // Calculate mean and standard deviation
                const mean = (min + max) / 2;
                const stdDev = Math.sqrt((max - min) * (max - min) / 12);

                title = 'Uniform Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers for key points
                const markers = [
                    { x: min, y: height, label: 'Min', xshift: 10 },
                    { x: max, y: height, label: 'Max', xanchor: 'right', xshift: -10 },
                    { x: mean, y: height, label: 'Mean', xanchor: 'center' },
                    { x: mean + stdDev, y: height / 2, label: '+1σ' },
                    { x: mean - stdDev, y: height / 2, label: '-1σ' }
                ];

                // Add standard deviation lines
                shapes.push(
                    createVerticalLine(mean, height, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(mean + stdDev, height),
                    createVerticalLine(mean - stdDev, height)
                );

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    (min + max) / 2,
                    height / 2,
                    `Min: ${min}, Max: ${max} Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                ));

                break;
            }
            case 'weibull': {
                const scale = getParam(params, 'scale', 1);
                const shape = getParam(params, 'shape', 2);

                // Generate x values
                const max = scale * Math.pow(-Math.log(0.01), 1 / shape);
                const xValues = generateXValues(0, max);

                // Calculate PDF values
                const yValues = xValues.map(x => {
                    if (x <= 0) return 0;
                    return (shape / scale) * Math.pow(x / scale, shape - 1) *
                        Math.exp(-Math.pow(x / scale, shape));
                });

                // Calculate mode
                let mode = 0;
                if (shape > 1) {
                    mode = scale * Math.pow((shape - 1) / shape, 1 / shape);
                }

                // Calculate peak
                const peakY = shape > 1 ?
                    (shape / scale) * Math.pow(mode / scale, shape - 1) * Math.exp(-Math.pow(mode / scale, shape)) :
                    yValues[1];

                // Calculate mean and standard deviation
                const mean = scale * jStat.gammafn(1 + 1 / shape);
                const variance = scale * scale * (jStat.gammafn(1 + 2 / shape) - Math.pow(jStat.gammafn(1 + 1 / shape), 2));
                const stdDev = Math.sqrt(variance);

                title = 'Weibull Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers for key points
                const markers = [
                    { x: mode, y: peakY, label: 'Mode' },
                    { x: mean, y: yValues.find((_, i) => xValues[i] >= mean) || 0, label: 'Mean' },
                    { x: mean + stdDev, y: yValues.find((_, i) => xValues[i] >= mean + stdDev) || 0, label: '+1σ' },
                    { x: Math.max(0.001, mean - stdDev), y: yValues.find((_, i) => xValues[i] >= Math.max(0.001, mean - stdDev)) || 0, label: '-1σ' }
                ];

                // Add standard deviation lines
                shapes.push(
                    createVerticalLine(mean, yValues.find((_, i) => xValues[i] >= mean) || 0, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(mean + stdDev, yValues.find((_, i) => xValues[i] >= mean + stdDev) || 0),
                    createVerticalLine(Math.max(0.001, mean - stdDev), yValues.find((_, i) => xValues[i] >= Math.max(0.001, mean - stdDev)) || 0)
                );

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    scale,
                    peakY / 2,
                    `Scale: ${scale.toFixed(2)}, Shape: ${shape.toFixed(2)} Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                ));

                break;
            }
            case 'exponential': {
                const lambda = getParam(params, 'lambda', 1);

                // Generate x values
                const max = -Math.log(0.01) / lambda;
                const xValues = generateXValues(0, max);

                // Calculate PDF values
                const yValues = xValues.map(x => {
                    if (x < 0) return 0;
                    return lambda * Math.exp(-lambda * x);
                });

                const peakY = lambda;

                // For exponential, mean and std dev are both 1/lambda
                const mean = 1 / lambda;
                const stdDev = 1 / lambda;

                title = 'Exponential Distribution';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers for key points
                const markers = [
                    { x: 0, y: peakY, label: 'Peak' },
                    { x: mean, y: lambda * Math.exp(-1), label: 'Mean (1σ)' },
                    { x: mean + stdDev, y: lambda * Math.exp(-2), label: '+1σ' }
                ];

                // Add standard deviation lines
                shapes.push(
                    createVerticalLine(mean, lambda * Math.exp(-1), { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(mean + stdDev, lambda * Math.exp(-2))
                );

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    mean * 2,
                    peakY / 2,
                    `λ: ${lambda.toFixed(2)}, Mean: ${mean.toFixed(2)} StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                ));

                break;
            }
            case 'poisson': {
                const lambda = getParam(params, 'lambda', 3);

                // For discrete distributions like Poisson, we use bars
                const max = Math.min(20, lambda * 3);
                const xValues = Array.from({ length: max + 1 }, (_, i) => i);

                // Calculate PMF values
                const yValues = xValues.map(x => {
                    let pmf = Math.exp(-lambda);
                    for (let i = 1; i <= x; i++) {
                        pmf *= lambda / i;
                    }
                    return pmf;
                });

                // For Poisson, mean = lambda, std dev = sqrt(lambda)
                const mean = lambda;
                const stdDev = Math.sqrt(lambda);

                title = 'Poisson Distribution';

                // Bars for PMF
                data.push(createMainCurve(xValues, yValues, 'bar'));

                // Add markers for key points
                const meanIndex = Math.round(mean);
                const stdDevPlus = Math.round(mean + stdDev);
                const stdDevMinus = Math.max(0, Math.round(mean - stdDev));

                const markers = [
                    { x: meanIndex, y: yValues[meanIndex], label: 'Mean', yanchor: 'bottom', yshift: 5 },
                    { x: stdDevPlus, y: yValues[stdDevPlus], label: '+1σ', yanchor: 'bottom', yshift: 5 },
                    { x: stdDevMinus, y: yValues[stdDevMinus], label: '-1σ', yanchor: 'bottom', yshift: 5 }
                ];

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    lambda * 1.5,
                    Math.max(...yValues) / 2,
                    `λ: ${lambda.toFixed(2)} Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                ));

                break;
            }
            case 'kaimal': {
                // For Kaimal, we'll use normal approximation for visualization
                const meanWindSpeed = getParam(params, 'meanWindSpeed', 10);
                const turbulenceIntensity = getParam(params, 'turbulenceIntensity', 10) / 100;

                // Generate wind speeds around the mean
                const stdDev = meanWindSpeed * turbulenceIntensity;
                const min = Math.max(0, meanWindSpeed - 3 * stdDev);
                const max = meanWindSpeed + 3 * stdDev;
                const xValues = generateXValues(min, max);

                // Use normal approximation for visualization
                const yValues = xValues.map(x => jStat.normal.pdf(x, meanWindSpeed, stdDev));
                const peakY = jStat.normal.pdf(meanWindSpeed, meanWindSpeed, stdDev);

                title = 'Kaimal Spectrum (Simplified View)';

                // Main curve
                data.push(createMainCurve(xValues, yValues));

                // Add markers for key points
                const markers = [
                    { x: meanWindSpeed, y: peakY, label: 'Mean Wind Speed' },
                    { x: meanWindSpeed + stdDev, y: jStat.normal.pdf(meanWindSpeed + stdDev, meanWindSpeed, stdDev), label: '+1σ' },
                    { x: meanWindSpeed - stdDev, y: jStat.normal.pdf(meanWindSpeed - stdDev, meanWindSpeed, stdDev), label: '-1σ' }
                ];

                // Add standard deviation lines
                shapes.push(
                    createVerticalLine(meanWindSpeed, peakY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }),
                    createVerticalLine(meanWindSpeed + stdDev, jStat.normal.pdf(meanWindSpeed + stdDev, meanWindSpeed, stdDev)),
                    createVerticalLine(meanWindSpeed - stdDev, jStat.normal.pdf(meanWindSpeed - stdDev, meanWindSpeed, stdDev))
                );

                data.push(createMarkers(markers));
                annotations = [...annotations, ...createMarkerAnnotations(markers)];

                // Add parameter summary
                annotations.push(createParameterLabel(
                    meanWindSpeed,
                    peakY / 2,
                    `Mean: ${meanWindSpeed.toFixed(1)} m/s Turbulence Intensity: ${(turbulenceIntensity * 100).toFixed(1)}% StdDev: ${stdDev.toFixed(2)} m/s`,
                    'center'
                ));

                break;
            }
            case 'gbm': {
                // Get parameters, handling percentage inputs
                const initialValue = getParam(params, 'value', 100);
                const driftPercent = getParam(params, 'drift', 5);
                const volatilityPercent = getParam(params, 'volatility', 20);

                // Convert from percentage to decimal
                const drift = driftPercent / 100;
                const volatility = volatilityPercent / 100;
                const timeStep = getParam(params, 'timeStep', 1);

                // Time horizon for projection (years)
                const years = 10;
                const timePoints = Array.from({ length: years + 1 }, (_, i) => i);

                // Calculate expected mean path: S(t) = S0 * exp(μt)
                const meanPath = timePoints.map(t => initialValue * Math.exp(drift * t));

                // Calculate standard deviation at each time point
                // For GBM, the variance grows with: S0^2 * exp(2μt) * (exp(σ^2*t) - 1)
                const stdDevPath = timePoints.map(t => {
                    if (t === 0) return 0; // No variance at t=0
                    const variance = initialValue * initialValue *
                        Math.exp(2 * drift * t) *
                        (Math.exp(volatility * volatility * t) - 1);
                    return Math.sqrt(variance);
                });

                // Calculate confidence intervals
                const upperCI_1sigma = timePoints.map((_, i) => meanPath[i] + stdDevPath[i]);
                const lowerCI_1sigma = timePoints.map((_, i) => Math.max(0, meanPath[i] - stdDevPath[i]));
                const upperCI_2sigma = timePoints.map((_, i) => meanPath[i] + 2 * stdDevPath[i]);
                const lowerCI_2sigma = timePoints.map((_, i) => Math.max(0, meanPath[i] - 2 * stdDevPath[i]));

                // Generate 5 sample paths for illustration
                const numPaths = 5;
                const samplePaths = [];

                for (let p = 0; p < numPaths; p++) {
                    const path = [initialValue];
                    let value = initialValue;

                    for (let t = 1; t <= years; t++) {
                        const adjustedDrift = drift - (volatility * volatility) / 2;
                        const randomComponent = volatility * Math.sqrt(timeStep) * jStat.normal.sample(0, 1);
                        value = value * Math.exp(adjustedDrift * timeStep + randomComponent);
                        path.push(value);
                    }

                    samplePaths.push(path);
                }

                title = 'Geometric Brownian Motion';

                // Add confidence bands (filled area)
                data.push({
                    x: [...timePoints, ...timePoints.slice().reverse()],
                    y: [...upperCI_2sigma, ...lowerCI_2sigma.slice().reverse()],
                    fill: 'toself',
                    fillcolor: 'rgba(0, 0, 255, 0.1)',
                    line: { color: 'transparent' },
                    name: '95% Confidence',
                    showlegend: true
                });

                data.push({
                    x: [...timePoints, ...timePoints.slice().reverse()],
                    y: [...upperCI_1sigma, ...lowerCI_1sigma.slice().reverse()],
                    fill: 'toself',
                    fillcolor: 'rgba(0, 0, 255, 0.2)',
                    line: { color: 'transparent' },
                    name: '68% Confidence',
                    showlegend: true
                });

                // Add expected path (mean)
                data.push({
                    x: timePoints,
                    y: meanPath,
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color: 'rgb(255, 0, 0)',
                        width: 2
                    },
                    name: 'Expected Value'
                });

                // Add sample paths
                for (let p = 0; p < samplePaths.length; p++) {
                    data.push({
                        x: timePoints,
                        y: samplePaths[p],
                        type: 'scatter',
                        mode: 'lines',
                        line: {
                            color: 'rgba(0, 0, 0, 0.3)',
                            width: 1
                        },
                        showlegend: p === 0,
                        name: p === 0 ? 'Sample Paths' : undefined
                    });
                }

                // Add annotations for drift and volatility
                annotations.push({
                    x: years / 2,
                    y: meanPath[years] * 1.1,
                    text: `Initial: ${initialValue.toFixed(2)}, Drift: ${driftPercent.toFixed(1)}%, Volatility: ${volatilityPercent.toFixed(1)}%`,
                    showarrow: false,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    bordercolor: 'rgba(0, 0, 0, 0.1)',
                    borderwidth: 1,
                    borderpad: 4,
                    font: { size: 10 }
                });

                // Update layout for better time series display
                title = 'Geometric Brownian Motion';
                const xaxisTitle = 'Years';
                const yaxisTitle = addonAfter ? `Value (${addonAfter})` : 'Value';
                const showLegendFlag = true;
                const legendSettings = {
                    x: 0.05,
                    y: 0.95,
                    bgcolor: 'rgba(255, 255, 255, 0.5)'
                };

                break;
            }
            default:
                return;
        }

        // Set plot layout
        // Set plot layout
        const layout = {
            title: title,
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
                title: distributionType === 'gbm' ? 'Years' : (addonAfter ? `Value (${addonAfter})` : 'Value')
            },
            yaxis: {
                title: distributionType === 'gbm' ? (addonAfter ? `Value (${addonAfter})` : 'Value') : 'Probability Density'
            },
            annotations: annotations,
            shapes: shapes,
            showlegend: distributionType === 'gbm' ? true : false
        };

        if (distributionType === 'gbm') {
            layout.legend = {
                x: 0.05,
                y: 0.95,
                bgcolor: 'rgba(255, 255, 255, 0.5)'
            };
        }

        setPlotData(data);
        setPlotLayout(layout);
    };



    // If parameters are not valid, show a warning instead of the plot
    if (!validationResult.isValid) {
        return (
            <Alert
                message="Visualization not available"
                description={validationResult.message || "Please provide all required parameters to visualize this distribution."}
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