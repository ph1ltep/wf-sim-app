// src/components/contextFields/PrimaryPercentileSelectField.jsx
import React, { useEffect } from 'react';
import { useScenario } from '../../contexts/ScenarioContext';
import { SelectField } from './';

/**
 * Special select field for selecting primary percentile from existing percentiles
 * @param {string[]} basePath - Base path to simulation settings
 * @param {string} label - Field label
 * @param {string} tooltip - Tooltip text
 */
const PrimaryPercentileSelectField = ({
    basePath,
    label = "Primary Percentile",
    tooltip = "Select the main percentile to use for visualization and analysis",
    style,
    ...rest
}) => {
    const { getValueByPath, updateByPath } = useScenario();

    // Get percentiles and primary percentile from context
    const percentiles = getValueByPath([...basePath, 'percentiles'], []);
    const primaryPercentile = getValueByPath([...basePath, 'primaryPercentile']);

    // Generate options for the dropdown
    const options = percentiles.map(p => ({
        value: p.value,
        label: `P${p.value} (${p.description.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())})`
    }));

    // Ensure primary percentile is valid
    useEffect(() => {
        if (percentiles.length > 0) {
            const percentileExists = percentiles.some(p => p.value === primaryPercentile);

            // If primary percentile doesn't exist in the array, set it to the first percentile
            if (!percentileExists) {
                updateByPath([...basePath, 'primaryPercentile'], percentiles[0].value);
            }
        }
    }, [percentiles, primaryPercentile, updateByPath, basePath]);

    return (
        <SelectField
            path={[...basePath, 'primaryPercentile']}
            label={label}
            tooltip={tooltip}
            options={options}
            style={{ width: '100%', ...style }}
            required
            {...rest}
        />
    );
};

export default PrimaryPercentileSelectField;