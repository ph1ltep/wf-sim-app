// schemas/mongoose/generator.js
const mongoose = require('mongoose');

const yupToMongoose = (yupSchema, overrides = {}) => {
    const fields = {};
    const shape = yupSchema.describe().fields;

    for (const [key, descriptor] of Object.entries(shape)) {
        const field = {};

        // Type mapping
        if (descriptor.type === 'string') {
            field.type = String;
            if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
            if (descriptor.tests.some(t => t.name === 'min')) field.minlength = descriptor.tests.find(t => t.name === 'min').params.min;
            if (descriptor.tests.some(t => t.name === 'enum')) field.enum = descriptor.tests.find(t => t.name === 'oneOf').params.values;
        } else if (descriptor.type === 'number') {
            field.type = Number;
            if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
            if (descriptor.tests.some(t => t.name === 'min')) field.min = descriptor.tests.find(t => t.name === 'min').params.min;
            if (descriptor.tests.some(t => t.name === 'max')) field.max = descriptor.tests.find(t => t.name === 'max').params.max;
        } else if (descriptor.type === 'boolean') {
            field.type = Boolean;
            if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
        } else if (descriptor.type === 'array') {
            const innerType = descriptor.innerType?.type;
            if (innerType === 'object') {
                field.type = [yupToMongoose(Yup.object().shape(descriptor.innerType.fields))];
            } else if (innerType === 'number') {
                field.type = [Number];
            } else if (innerType === 'string') {
                field.type = [String];
            }
            if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
        } else if (descriptor.type === 'object' && descriptor.fields) {
            field.type = yupToMongoose(Yup.object().shape(descriptor.fields));
            if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
        } else if (descriptor.type === 'mixed') { // Handle Mixed type
            field.type = mongoose.Schema.Types.Mixed;
        }

        // Default value
        if (descriptor.default !== undefined) {
            field.default = typeof descriptor.default === 'function' ? descriptor.default : () => descriptor.default;
        }

        fields[key] = field;
    }

    return new mongoose.Schema({ ...fields, ...overrides });
};

module.exports = yupToMongoose;