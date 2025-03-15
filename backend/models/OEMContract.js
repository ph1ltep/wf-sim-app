// backend/models/OEMContract.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OEMContractSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  startYear: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  endYear: {
    type: Number,
    required: true,
    min: 1,
    default: 5
  },
  fixedFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isPerTurbine: {
    type: Boolean,
    default: true
  },
  oemScope: {
    type: Schema.Types.ObjectId,
    ref: 'OEMScope',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the 'updatedAt' field
OEMContractSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Ensure endYear is not less than startYear
  if (this.endYear < this.startYear) {
    this.endYear = this.startYear;
  }
  
  next();
});

module.exports = mongoose.model('OEMContract', OEMContractSchema);