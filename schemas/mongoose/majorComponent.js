// schemas/mongoose/majorComponent.js
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const MajorComponentSchemaYup = require('../yup/majorComponent');

const MajorComponentSchema = yupToMongoose(MajorComponentSchemaYup, {
    // Overrides for DB-specific features
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
});

// Pre-save hook to update the 'updatedAt' field
MajorComponentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Export both the model and the schema
const MajorComponent = mongoose.model('MajorComponent', MajorComponentSchema);

module.exports = {
    MajorComponent,
    MajorComponentSchema,
};