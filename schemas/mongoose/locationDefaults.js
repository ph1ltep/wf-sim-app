// schemas/mongoose/locationDefaults.js
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const LocationDefaultsSchemaYup = require('../yup/locationDefaults');

// Comprehensive list of major world currencies (same as in LocationDefaults.js)
const CURRENCY_CODES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP',
    'AED', 'COP', 'SAR', 'MYR', 'NOY', 'ARS', 'BGN', 'DZD', 'EGP', 'HRK',
    'MAD', 'NGN', 'PKR', 'QAR', 'UAH', 'VND'
];

const LocationDefaultsSchema = yupToMongoose(LocationDefaultsSchemaYup, {
    // Overrides for DB-specific features
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
    // Add description field to exchangeRate (not validated in Yup)
    exchangeRate: {
        type: Number,
        required: true,
        min: 0,
        default: 1.0,
        description: 'Exchange rate to foreign currency'
    },
});

// Pre-save hook to update the 'updatedAt' field
LocationDefaultsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const LocationDefaults = mongoose.model('LocationDefaults', LocationDefaultsSchema);

module.exports = LocationDefaults;