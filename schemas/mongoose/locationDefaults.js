const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const LocationDefaultsSchemaYup = require('../yup/locationDefaults');

// Generate Mongoose schema from Yup schema
const LocationDefaultsSchema = yupToMongoose(LocationDefaultsSchemaYup);

// Pre-save hook to update 'updatedAt'
LocationDefaultsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create and export Mongoose model
const LocationDefaults = mongoose.model('LocationDefaults', LocationDefaultsSchema);
module.exports = LocationDefaults;