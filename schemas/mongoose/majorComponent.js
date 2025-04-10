const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const MajorComponentSchemaYup = require('../yup/majorComponent');

// Generate Mongoose schema from Yup schema
const MajorComponentSchema = yupToMongoose(MajorComponentSchemaYup);

// Pre-save hook to update 'updatedAt'
MajorComponentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create Mongoose model and export with schema
const MajorComponent = mongoose.model('MajorComponent', MajorComponentSchema);

module.exports = {
    MajorComponent,
    MajorComponentSchema,
};