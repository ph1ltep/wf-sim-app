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
  years: {
    type: [Number],
    required: true,
    validate: {
      validator: function(years) {
        return Array.isArray(years) && years.length > 0;
      },
      message: 'Years array must have at least one year'
    }
  },
  // Keep startYear and endYear for backward compatibility, but use years array for new code
  startYear: {
    type: Number,
    min: 1,
    default: function() {
      return this.years && this.years.length > 0 ? Math.min(...this.years) : 1;
    }
  },
  endYear: {
    type: Number,
    min: 1,
    default: function() {
      return this.years && this.years.length > 0 ? Math.max(...this.years) : 5;
    }
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
  
  // If years array is provided but startYear/endYear are not explicitly set,
  // derive them from the years array
  if (this.years && this.years.length > 0) {
    this.startYear = Math.min(...this.years);
    this.endYear = Math.max(...this.years);
  }
  
  // If startYear/endYear are set but years array is empty,
  // generate years array from startYear and endYear
  if (!this.years || this.years.length === 0) {
    if (this.startYear && this.endYear && this.startYear <= this.endYear) {
      this.years = Array.from(
        { length: this.endYear - this.startYear + 1 },
        (_, index) => this.startYear + index
      );
    } else {
      // Default single year if no valid range
      this.years = [1];
    }
  }
  
  next();
});

module.exports = mongoose.model('OEMContract', OEMContractSchema);