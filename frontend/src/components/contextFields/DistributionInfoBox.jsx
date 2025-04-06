// src/components/contextFields/DistributionInfoBox.jsx
import React from 'react';
import { Alert, Typography, Space } from 'antd';

const { Text, Paragraph } = Typography;

/**
 * Component to display information about distribution types for wind energy applications
 * 
 * @param {Object} distribution - Distribution object with type and parameters
 */
const DistributionInfoBox = ({ distribution }) => {
    // If no distribution, return nothing
    if (!distribution || !distribution.type) {
        return null;
    }

    // Distribution information
    const distributionInfo = {
        fixed: {
            title: "Fixed Value",
            description: "Uses a single deterministic value with no variability.",
            windApplications: "Used for deterministic analysis, base case scenarios, or when uncertainty is accounted for separately.",
            examples: "Fixed power purchase agreement (PPA) prices, guaranteed availability levels, or contractual performance metrics.",
            suggestedParams: "Value: Set to the most likely or contractually agreed value."
        },
        normal: {
            title: "Normal Distribution",
            description: "Symmetric bell-shaped distribution defined by mean and standard deviation.",
            windApplications: "Ideal for modeling natural variations with equal probabilities of being above or below the mean.",
            examples: "Annual energy production, wind speed at hub height, component lifetimes, or operations costs.",
            suggestedParams: "Mean: Central expected value; StdDev: ~10-15% of mean for energy production, ~5-10% for component lifetimes."
        },
        lognormal: {
            title: "Lognormal Distribution",
            description: "Skewed distribution where logarithm of the variable follows normal distribution.",
            windApplications: "Good for modeling values that cannot be negative and have occasional large positive values.",
            examples: "Repair costs, downtime duration, time between failures, component repair times.",
            suggestedParams: "Mean: Natural log of the expected value; Sigma: 0.4-0.8 for repair costs, 0.3-0.6 for failure intervals."
        },
        triangular: {
            title: "Triangular Distribution",
            description: "Simple distribution defined by minimum, maximum, and most likely values.",
            windApplications: "Useful when data is limited but min, max, and most likely values are known from expert judgment.",
            examples: "Construction costs, project timelines, capacity factors, seasonal energy output variations.",
            suggestedParams: "Min: Absolute minimum; Mode: Most likely value; Max: Maximum reasonable value. For capacity factor: Min: 30%, Mode: 40%, Max: 50%."
        },
        uniform: {
            title: "Uniform Distribution",
            description: "Equal probability across all values in a defined range.",
            windApplications: "Used when all values in a range are equally likely or when uncertainty is high.",
            examples: "Energy price forecasts under high uncertainty, random component failures, initial bidding ranges.",
            suggestedParams: "Min: Lower bound; Max: Upper bound. For pricing scenarios, typically set to ±20% of expected value."
        },
        weibull: {
            title: "Weibull Distribution",
            description: "Versatile distribution commonly used in reliability and wind speed modeling.",
            windApplications: "The standard for modeling wind speed distributions and component reliability.",
            examples: "Wind speed distributions, component failure rates, turbine lifetime modeling.",
            suggestedParams: "Scale: 6-12 for wind speeds (m/s); Shape: 1.5-2.5 for wind speeds (higher for less variability), 1.5-3.0 for component failures."
        },
        exponential: {
            title: "Exponential Distribution",
            description: "Models time between independent events occurring at a constant rate.",
            windApplications: "Used for random failure events with constant failure rates.",
            examples: "Time between random equipment failures, maintenance visit intervals, grid outage events.",
            suggestedParams: "Lambda: Inverse of mean time between events. For failures: 0.05-0.2 (1/years) for major components."
        },
        poisson: {
            title: "Poisson Distribution",
            description: "Discrete distribution for the number of events in a fixed time interval.",
            windApplications: "Models the frequency of rare, independent events over time.",
            examples: "Number of lightning strikes, grid outages, major component failures per year, extreme weather events.",
            suggestedParams: "Lambda: Expected number of events per period. Typically 0.1-2 failures per turbine per year."
        },
        kaimal: {
            title: "Kaimal Spectrum",
            description: "Specialized model for wind turbulence following IEC 61400 standards.",
            windApplications: "Industry standard for modeling wind turbulence and its effect on turbine loads.",
            examples: "Wind turbulence modeling, load calculations, site-specific design adaptations.",
            suggestedParams: "Mean Wind Speed: Site average (5-10 m/s); Turbulence Intensity: 10-20% (Class A: 16%, Class B: 14%, Class C: 12%)."
        }
    };

    // Get info for the selected distribution
    const info = distributionInfo[distribution.type.toLowerCase()] || {
        title: "Unknown Distribution",
        description: "No information available for this distribution type.",
        windApplications: "",
        examples: "",
        suggestedParams: ""
    };

    return (
        <Alert
            type="info"
            message={info.title}
            description={
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph>{info.description}</Paragraph>

                    <Paragraph>
                        <Text strong>Wind Energy Applications:</Text> {info.windApplications}
                    </Paragraph>

                    <Paragraph>
                        <Text strong>Examples:</Text> {info.examples}
                    </Paragraph>

                    <Paragraph>
                        <Text strong>Suggested Parameters:</Text> {info.suggestedParams}
                    </Paragraph>
                </Space>
            }
            showIcon
        />
    );
};

export default DistributionInfoBox;