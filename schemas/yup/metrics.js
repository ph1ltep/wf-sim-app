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

const MetricsTableColumnConfigSchema = Yup.object().shape({
    columns: Yup.array().of(Yup.object().shape({
        key: Yup.string().required('Column key is required'),
        label: Yup.string().required('Column label is required'),
        value: Yup.mixed().nullable(),
        selectable: Yup.boolean().default(true),
        primary: Yup.boolean().default(false),
        marker: Yup.object().shape({
            type: Yup.string().default('primary'),
            color: Yup.string().default('blue'),
            tag: Yup.string().default('Primary')
        }).nullable(),
    }).default([])
    ),
    onColumnSelect: Yup.mixed().nullable(),
    selectedColumn: Yup.string().nullable(),
    primaryPercentile: Yup.string().nullable(),
    size: Yup.string().oneOf(['small', 'middle', 'large']).default('small'),
    showHeader: Yup.boolean().default(true),

});

const MetricsTableRowConfigSchema = Yup.object().shape({
    rows: Yup.array().of(Yup.object().shape({
        metricId: Yup.string().required('Row key is required'),
        label: Yup.string().required('Label is required'),
        valueField: Yup.string().default('value'),
        valueformatter: Yup.mixed().optional(), //default is to use metric's formatter.
        tags: Yup.array().of(Yup.object().shape({
            text: Yup.string().required('Tag text is required'),
            color: Yup.string().oneOf(['blue', 'green', 'red', 'orange', 'purple']).required('Tag color is required')
        })).default([]),
        tooltip: Yup.object().shape({
            title: Yup.string().required('Tooltip title is required'),
            content: Yup.string().nullable(),
            icon: Yup.string()
        }).nullable(),
    })).default([]),
    showRowLabels: Yup.boolean().default(true),
});

module.exports = {
    MetricsTableConfigSchema,
    MetricsRowSchema
};