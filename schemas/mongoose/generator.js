const mongoose = require('mongoose');
const Yup = require('yup');

const yupToMongoose = (yupSchema, overrides = {}) => {
    const fields = {};
    const shape = yupSchema.describe().fields;

    for (const [key, descriptor] of Object.entries(shape)) {
        const field = {};

        // Type mapping
        switch (descriptor.type) {
            case 'string':
                field.type = String;
                if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
                if (descriptor.tests.some(t => t.name === 'oneOf')) field.enum = descriptor.tests.find(t => t.name === 'oneOf').params.values;
                if (descriptor.tests.some(t => t.name === 'min')) field.minlength = descriptor.tests.find(t => t.name === 'min').params.min;
                if (descriptor.tests.some(t => t.name === 'max')) field.maxlength = descriptor.tests.find(t => t.name === 'max').params.max;
                break;
            case 'number':
                field.type = Number;
                if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
                if (descriptor.tests.some(t => t.name === 'min')) field.min = descriptor.tests.find(t => t.name === 'min').params.min;
                if (descriptor.tests.some(t => t.name === 'max')) field.max = descriptor.tests.find(t => t.name === 'max').params.max;
                break;
            case 'boolean':
                field.type = Boolean;
                if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
                break;
            case 'date':
                field.type = Date;
                if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
                break;
            case 'array':
                if (descriptor.innerType) {
                    const innerSchema = reconstructYupSchema(descriptor.innerType);
                    if (descriptor.innerType.type === 'object') {
                        field.type = [yupToMongoose(innerSchema)];
                    } else if (descriptor.innerType.type === 'number') {
                        field.type = [Number];
                    } else if (descriptor.innerType.type === 'string') {
                        field.type = [String];
                    } else if (descriptor.innerType.type === 'mixed') {
                        field.type = [mongoose.Schema.Types.Mixed];
                    } else {
                        field.type = [innerSchema]; // Fallback for unhandled inner types
                    }
                } else {
                    field.type = [mongoose.Schema.Types.Mixed]; // Fallback for undefined innerType
                }
                if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
                if (descriptor.tests.some(t => t.name === 'min')) field.minLength = descriptor.tests.find(t => t.name === 'min').params.min;
                break;
            case 'object':
                if (descriptor.fields) {
                    const nestedSchema = reconstructYupSchema(descriptor);
                    field.type = yupToMongoose(nestedSchema);
                } else {
                    field.type = mongoose.Schema.Types.Mixed; // Empty object fallback
                }
                if (descriptor.tests.some(t => t.name === 'required')) field.required = true;
                break;
            case 'mixed':
                field.type = mongoose.Schema.Types.Mixed;
                break;
            default:
                field.type = mongoose.Schema.Types.Mixed; // Fallback for unknown types
        }

        // Handle nullable fields
        if (descriptor.tests.some(t => t.name === 'nullable')) {
            field.default = field.default === undefined ? null : field.default;
        }

        // Default value
        if (descriptor.default !== undefined) {
            field.default = typeof descriptor.default === 'function' ? descriptor.default : descriptor.default;
        }

        fields[key] = field;
    }

    return new mongoose.Schema({ ...fields, ...overrides });
};

// Helper function to reconstruct a Yup schema from a descriptor
const reconstructYupSchema = (descriptor) => {
    switch (descriptor.type) {
        case 'string':
            let stringSchema = Yup.string();
            if (descriptor.tests.some(t => t.name === 'required')) stringSchema = stringSchema.required();
            if (descriptor.tests.some(t => t.name === 'oneOf')) stringSchema = stringSchema.oneOf(descriptor.tests.find(t => t.name === 'oneOf').params.values);
            if (descriptor.tests.some(t => t.name === 'min')) stringSchema = stringSchema.min(descriptor.tests.find(t => t.name === 'min').params.min);
            if (descriptor.tests.some(t => t.name === 'max')) stringSchema = stringSchema.max(descriptor.tests.find(t => t.name === 'max').params.max);
            if (descriptor.tests.some(t => t.name === 'nullable')) stringSchema = stringSchema.nullable();
            if (descriptor.default !== undefined) stringSchema = stringSchema.default(descriptor.default);
            return stringSchema;
        case 'number':
            let numberSchema = Yup.number();
            if (descriptor.tests.some(t => t.name === 'required')) numberSchema = numberSchema.required();
            if (descriptor.tests.some(t => t.name === 'min')) numberSchema = numberSchema.min(descriptor.tests.find(t => t.name === 'min').params.min);
            if (descriptor.tests.some(t => t.name === 'max')) numberSchema = numberSchema.max(descriptor.tests.find(t => t.name === 'max').params.max);
            if (descriptor.tests.some(t => t.name === 'nullable')) numberSchema = numberSchema.nullable();
            if (descriptor.default !== undefined) numberSchema = numberSchema.default(descriptor.default);
            return numberSchema;
        case 'boolean':
            let booleanSchema = Yup.boolean();
            if (descriptor.tests.some(t => t.name === 'required')) booleanSchema = booleanSchema.required();
            if (descriptor.tests.some(t => t.name === 'nullable')) booleanSchema = booleanSchema.nullable();
            if (descriptor.default !== undefined) booleanSchema = booleanSchema.default(descriptor.default);
            return booleanSchema;
        case 'date':
            let dateSchema = Yup.date();
            if (descriptor.tests.some(t => t.name === 'required')) dateSchema = dateSchema.required();
            if (descriptor.tests.some(t => t.name === 'nullable')) dateSchema = dateSchema.nullable();
            if (descriptor.default !== undefined) dateSchema = dateSchema.default(descriptor.default);
            return dateSchema;
        case 'array':
            if (descriptor.innerType) {
                const innerSchema = reconstructYupSchema(descriptor.innerType);
                let arraySchema = Yup.array().of(innerSchema);
                if (descriptor.tests.some(t => t.name === 'required')) arraySchema = arraySchema.required();
                if (descriptor.tests.some(t => t.name === 'min')) arraySchema = arraySchema.min(descriptor.tests.find(t => t.name === 'min').params.min);
                if (descriptor.tests.some(t => t.name === 'nullable')) arraySchema = arraySchema.nullable();
                if (descriptor.default !== undefined) arraySchema = arraySchema.default(descriptor.default);
                return arraySchema;
            }
            return Yup.array().of(Yup.mixed());
        case 'object':
            if (descriptor.fields) {
                const shape = Object.fromEntries(
                    Object.entries(descriptor.fields).map(([k, v]) => [k, reconstructYupSchema(v)])
                );
                let objectSchema = Yup.object().shape(shape);
                if (descriptor.tests.some(t => t.name === 'required')) objectSchema = objectSchema.required();
                if (descriptor.tests.some(t => t.name === 'nullable')) objectSchema = objectSchema.nullable();
                if (descriptor.default !== undefined) objectSchema = objectSchema.default(descriptor.default);
                return objectSchema;
            }
            return Yup.object();
        case 'mixed':
            return Yup.mixed();
        default:
            return Yup.mixed(); // Fallback for unhandled types
    }
};

module.exports = yupToMongoose;