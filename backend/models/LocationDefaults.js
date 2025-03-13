// backend/models/LocationDefaults.js
const mongoose = require('mongoose');

// Comprehensive list of major world currencies
const CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'HKD', 'NZD',
  'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
  'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP',
  'AED', 'COP', 'SAR', 'MYR', 'RON', 'ARS', 'BGN', 'DZD', 'EGP', 'HRK',
  'MAD', 'NGN', 'PKR', 'QAR', 'UAH', 'VND'
];

const LocationDefaultsSchema = new mongoose.Schema({
  country: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
  },
  countryCode: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  inflationRate: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 2.0
  },
  capacityFactor: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 35
  },
  energyPrice: { 
    type: Number, 
    required: true,
    min: 0,
    default: 50
  },
  currency: { 
    type: String, 
    required: true,
    enum: CURRENCY_CODES,
    default: 'USD'
  },
  foreignCurrency: {
    type: String,
    required: true,
    enum: CURRENCY_CODES,
    default: 'EUR'
  },
  exchangeRate: { 
    type: Number, 
    required: true,
    min: 0,
    default: 1.0,
    description: 'Exchange rate to foreign currency'
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
LocationDefaultsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LocationDefaults', LocationDefaultsSchema);