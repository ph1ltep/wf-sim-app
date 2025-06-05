// schemas/yup/metrics.js - Essential MetricsDataTable schemas only
const Yup = require('yup');

// Main table configuration schema - the complex object that needs validation
const MetricsTableConfigSchema = Yup.object().shape({
    columns: Yup.array().of(Yup.object().shape({
        key: Yup.string().required('Column key is required'),
        label: Yup.string().required('Column label is required'),
        valueField: Yup.string().nullable(),
        value: Yup.mixed().nullable(),
        selectable: Yup.boolean().default(true),
        primary: Yup.boolean().default(false)
    })).required('Columns must be defined'),
    onColumnSelect: Yup.mixed().nullable(),
    selectedColumn: Yup.string().nullable(),
    size: Yup.string().oneOf(['small', 'middle', 'large']).default('small')
});

// Row data schema - ensure basic structure
const MetricsRowSchema = Yup.object().shape({
    key: Yup.string().required('Row key is required'),
    label: Yup.string().required('Label is required')
    // Dynamic fields (P10, P25, etc.) validated at runtime
});

module.exports = {
    MetricsTableConfigSchema,
    MetricsRowSchema
};