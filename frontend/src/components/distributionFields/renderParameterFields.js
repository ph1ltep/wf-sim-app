// src/components/distributionFields/renderParameterFields.js
import React from 'react';
import {
    NumberField,
    PercentageField,
    CurrencyField
} from '../contextFields';
import { DistributionUtils } from '../../utils/distributions';

/**
 * Renders parameter fields for a distribution based on its metadata
 *
 * @param {string} distributionType - Type of distribution
 * @param {Array} parametersPath - Path to the parameters object in context
 * @param {Object} options - Additional options
 * @param {string} options.addonAfter - Text to display after value inputs (only for main value)
 * @param {number} options.step - Step increment for numeric inputs
 * @param {string} options.valueType - Type of value field (number, percentage, currency)
 * @param {boolean} options.renderValueSeparately - Whether value field is rendered separately
 * @param {string} options.label - Override for the field label
 * @param {Object} options.currentParameters - Current parameter values to inform defaults
 * @returns {Array} Array of parameter field components
 */
const renderParameterFields = (distributionType, parametersPath, options = {}) => {
    // Default options
    const {
        addonAfter,
        step = 1,
        valueType = 'number',
        renderValueSeparately = true,
        defaultValue,
        label,
        currentParameters = {}
    } = options;

    // Get current value to pass to getMetadata
    const currentValue = currentParameters?.value !== undefined ? currentParameters.value : undefined;

    // Get distribution metadata using the utility function, passing the current value
    const metadata = DistributionUtils.getMetadata(distributionType, currentValue);

    if (!metadata || !metadata.parameters) {
        return [<div key="no-params">No parameters available for this distribution</div>];
    }

    // Filter parameters if value is rendered separately
    const parameters = renderValueSeparately
        ? metadata.parameters.filter(param => param.name !== 'value')
        : metadata.parameters;

    // If no parameters left, return empty array
    if (parameters.length === 0) {
        return [];
    }

    // Render appropriate field based on field type
    const renderField = (param, path) => {
        // Only apply style if width is explicitly provided
        const style = param.fieldProps.width ? { width: param.fieldProps.width } : undefined;

        const fieldProps = {
            path,
            label: label || param.fieldProps.label || param.description,
            tooltip: param.fieldProps.tooltip,
            min: param.fieldProps.min,
            max: param.fieldProps.max,
            step: param.fieldProps.step || step,
            precision: param.fieldProps.precision,
            defaultValue: param.fieldProps.defaultValue,
            required: param.required
        };

        // Only add style if it's defined
        if (style) {
            fieldProps.style = style;
        }

        // For parameter fields, use addonAfter from metadata if provided
        if (param.fieldProps.addonAfter) {
            fieldProps.addonAfter = param.fieldProps.addonAfter;
        }

        switch (param.fieldType) {
            case 'percentage':
                return <PercentageField key={param.name} {...fieldProps} />;
            case 'currency':
                return <CurrencyField key={param.name} {...fieldProps} />;
            case 'number':
            default:
                return <NumberField key={param.name} {...fieldProps} />;
        }
    };

    // Return array of rendered fields
    return parameters.map(param => renderField(param, [...parametersPath, param.name]));
};

export default renderParameterFields;