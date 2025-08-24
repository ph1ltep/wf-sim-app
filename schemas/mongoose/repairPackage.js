const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const { RepairPackageSchema } = require('../yup/repairPackage');

// Generate Mongoose schema from Yup schema
const RepairPackageMongooseSchema = yupToMongoose(RepairPackageSchema);

// Add indexes for performance
RepairPackageMongooseSchema.index({ name: 1 }, { unique: true });
RepairPackageMongooseSchema.index({ category: 1 });
RepairPackageMongooseSchema.index({ isActive: 1 });
RepairPackageMongooseSchema.index({ isDefault: 1 });
RepairPackageMongooseSchema.index({ createdAt: 1 });

// Compound indexes for filtering
RepairPackageMongooseSchema.index({ category: 1, isActive: 1 });
RepairPackageMongooseSchema.index({ isDefault: 1, isActive: 1 });

// Pre-save hook to update 'updatedAt'
RepairPackageMongooseSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create and export Mongoose model
const RepairPackage = mongoose.model('RepairPackage', RepairPackageMongooseSchema);
module.exports = RepairPackage;