// src/components/contextFields/DistributionPlot.jsx
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import * as jStat from 'jstat';

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

    useEffect(() => {
        updateVisualization(distributionType, parameters);
    }, [distributionType, parameters]);

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
                    `Min: ${min}, Mode: ${mode}, Max: ${max}
Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
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
                    `Min: ${min}, Max: ${max}
Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
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
                    `Scale: ${scale.toFixed(2)}, Shape: ${shape.toFixed(2)}
Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
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
                    `λ: ${lambda.toFixed(2)}, Mean: ${mean.toFixed(2)}
StdDev: ${stdDev.toFixed(2)}`,
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
                    `λ: ${lambda.toFixed(2)}
Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
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
                    `Mean: ${meanWindSpeed.toFixed(1)} m/s
Turbulence Intensity: ${(turbulenceIntensity * 100).toFixed(1)}%
StdDev: ${stdDev.toFixed(2)} m/s`,
                    'center'
                ));

                break;
            }
            default:
                return;
        }

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
                t: 50,
                pad: 4
            },
            xaxis: {
                title: addonAfter ? `Value (${addonAfter})` : 'Value'
            },
            yaxis: {
                title: 'Probability Density'
            },
            annotations: annotations,
            shapes: shapes,
            showlegend: false
        };

        setPlotData(data);
        setPlotLayout(layout);
    };

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