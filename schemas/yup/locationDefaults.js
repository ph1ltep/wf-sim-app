// schemas/yup/locationDefaults.js
const Yup = require('yup');

// Comprehensive list of major world currencies (same as in LocationDefaults.js)
const CURRENCY_CODES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP',
    'AED', 'COP', 'SAR', 'MYR', 'RON', 'ARS', 'BGN', 'DZD', 'EGP', 'HRK',
    'MAD', 'NGN', 'PKR', 'QAR', 'UAH', 'VND'
];

const LocationDefaultsSchema = Yup.object().shape({
    country: Yup.string()
        .required('Country is required')
        .trim(),
    countryCode: Yup.string()
        .required('Country code is required')
        .trim(),
    inflationRate: Yup.number()
        .min(-5, 'Inflation rate must be at least -5')
        .max(100, 'Inflation rate must not exceed 100')
        .required('Inflation rate is required')
        .default(2.0),
    costOfConstructionDebt: Yup.number()
        .min(-5, 'Inflation rate must be at least -5')
        .max(100, 'Inflation rate must not exceed 100')
        .required('Inflation rate is required')
        .default(2.5),
    costOfOperationalDebt: Yup.number()
        .min(-5, 'Inflation rate must be at least -5')
        .max(100, 'Inflation rate must not exceed 100')
        .required('Inflation rate is required')
        .default(2.5),
    costofEquity: Yup.number()
        .min(-5, 'Inflation rate must be at least -5')
        .max(100, 'Inflation rate must not exceed 100')
        .required('Inflation rate is required')
        .default(2.0),
    debtRatio: Yup.number()
        .min(0, 'Inflation rate must be at least -5')
        .max(100, 'Inflation rate must not exceed 100')
        .required('Inflation rate is required')
        .default(70.0),
    effectiveTaxRate: Yup.number()
        .min(-5, 'Inflation rate must be at least -5')
        .max(100, 'Inflation rate must not exceed 100')
        .required('Inflation rate is required')
        .default(15.0),
    capacityFactor: Yup.number()
        .min(0, 'Capacity factor must be at least 0')
        .max(100, 'Capacity factor must not exceed 100')
        .required('Capacity factor is required')
        .default(35),
    energyPrice: Yup.number()
        .min(0, 'Energy price must be at least 0')
        .required('Energy price is required')
        .default(50),
    currency: Yup.string()
        .oneOf(CURRENCY_CODES, 'Invalid currency code')
        .required('Currency is required')
        .default('USD'),
    foreignCurrency: Yup.string()
        .oneOf(CURRENCY_CODES, 'Invalid foreign currency code')
        .required('Foreign currency is required')
        .default('EUR'),
    exchangeRate: Yup.number()
        .min(0, 'Exchange rate must be at least 0')
        .required('Exchange rate is required')
        .default(1.0),
    createdAt: Yup.date()
        .default(() => new Date()),
    updatedAt: Yup.date()
        .default(() => new Date()),
});

module.exports = LocationDefaultsSchema;