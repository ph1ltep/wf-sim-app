const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const { OEMScopeSchema: OEMScopeSchemaYup } = require('../yup/oemScope');

// Generate Mongoose schema from Yup schema
const OEMScopeSchema = yupToMongoose(OEMScopeSchemaYup);

// Pre-save hook to update 'updatedAt'
OEMScopeSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create and export Mongoose model
const OEMScope = mongoose.model('OEMScope', OEMScopeSchema);
module.exports = OEMScope;