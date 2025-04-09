// schemas/yup/majorComponent.js
const Yup = require('yup');

const MajorComponentSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .trim(),
    description: Yup.string()
        .trim(),
    appliesTo: Yup.object().shape({
        geared: Yup.boolean().default(true),
        directDrive: Yup.boolean().default(true),
    }).default(() => ({ geared: true, directDrive: true })),
    quantityPerWTG: Yup.number()
        .min(0, 'Quantity per WTG must be at least 0')
        .required('Quantity per WTG is required')
        .default(1),
    defaultFailureRate: Yup.number()
        .min(0, 'Default failure rate must be at least 0')
        .max(1, 'Default failure rate must not exceed 1')
        .default(0.01),
    createdAt: Yup.date()
        .default(() => new Date()),
    updatedAt: Yup.date()
        .default(() => new Date()),
});

module.exports = MajorComponentSchema;