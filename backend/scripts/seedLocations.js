// backend/scripts/seedLocations.js

//command to execute: MONGO_URL=mdb.fthome.org MONGO_PASS=<password> MONGO_USER=<username> node backend/scripts/seedLocations.js
require('dotenv').config();
const mongoose = require('mongoose');
const LocationDefaults = require('../../schemas/mongoose/locationDefaults');
const { connectDB } = require('../config/db');

// Updated location data with WACC-related financial parameters
const locationData = [
  {
    country: 'India',
    countryCode: 'in',
    inflationRate: 5.0,
    costOfConstructionDebt: 8.5,    // Higher due to development market risk
    costOfOperationalDebt: 7.5,     // Slightly lower post-COD
    costofEquity: 12.0,             // Emerging market equity premium
    debtRatio: 75.0,                // High leverage typical in Indian renewables
    effectiveTaxRate: 25.17,        // Corporate tax + surcharges
    capacityFactor: 28,
    energyPrice: 3000,              // INR/MWh
    currency: 'INR',
    exchangeRate: 89,               // INR per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'New Zealand',
    countryCode: 'nz',
    inflationRate: 2.0,
    costOfConstructionDebt: 4.5,    // Stable developed market
    costOfOperationalDebt: 4.0,     // Lower operational risk
    costofEquity: 8.5,              // Developed market, moderate risk
    debtRatio: 70.0,                // Conservative leverage
    effectiveTaxRate: 28.0,         // Corporate tax rate
    capacityFactor: 35,
    energyPrice: 80,                // NZD/MWh
    currency: 'NZD',
    exchangeRate: 1.75,             // NZD per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'Australia',
    countryCode: 'au',
    inflationRate: 2.5,
    costOfConstructionDebt: 4.0,    // Very stable market, strong renewables support
    costOfOperationalDebt: 3.5,     // Low operational risk
    costofEquity: 8.0,              // Developed market, low country risk
    debtRatio: 70.0,                // Standard project finance leverage
    effectiveTaxRate: 30.0,         // Corporate tax rate
    capacityFactor: 38,
    energyPrice: 70,                // AUD/MWh
    currency: 'AUD',
    exchangeRate: 1.65,             // AUD per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'Thailand',
    countryCode: 'th',
    inflationRate: 1.5,
    costOfConstructionDebt: 6.5,    // Emerging market with govt support
    costOfOperationalDebt: 6.0,     // Moderate risk profile
    costofEquity: 10.5,             // Emerging market premium
    debtRatio: 70.0,                // Standard for Thai renewables
    effectiveTaxRate: 20.0,         // Corporate tax rate
    capacityFactor: 25,
    energyPrice: 2500,              // THB/MWh
    currency: 'THB',
    exchangeRate: 37,               // THB per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'Philippines',
    countryCode: 'ph',
    inflationRate: 3.0,
    costOfConstructionDebt: 7.5,    // Higher emerging market risk
    costOfOperationalDebt: 7.0,     // Currency and regulatory risk
    costofEquity: 11.5,             // Higher risk premium
    debtRatio: 65.0,                // More conservative due to risks
    effectiveTaxRate: 25.0,         // Regular corporate income tax
    capacityFactor: 30,
    energyPrice: 5000,              // PHP/MWh
    currency: 'PHP',
    exchangeRate: 60,               // PHP per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'South Korea',
    countryCode: 'kr',
    inflationRate: 2.0,
    costOfConstructionDebt: 3.5,    // Low interest rate environment
    costOfOperationalDebt: 3.0,     // Very stable operational market
    costofEquity: 7.5,              // Developed market, low risk
    debtRatio: 75.0,                // High leverage, stable market
    effectiveTaxRate: 25.0,         // Corporate tax rate
    capacityFactor: 28,
    energyPrice: 100000,            // KRW/MWh
    currency: 'KRW',
    exchangeRate: 1420,             // KRW per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'Indonesia',
    countryCode: 'id',
    inflationRate: 4.0,
    costOfConstructionDebt: 8.0,    // Emerging market, infrastructure risk
    costOfOperationalDebt: 7.5,     // Currency and operational risk
    costofEquity: 12.5,             // High emerging market premium
    debtRatio: 65.0,                // Conservative due to risks
    effectiveTaxRate: 22.0,         // Corporate tax rate
    capacityFactor: 25,
    energyPrice: 1000000,           // IDR/MWh
    currency: 'IDR',
    exchangeRate: 16500,            // IDR per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'China',
    countryCode: 'cn',
    inflationRate: 2.5,
    costOfConstructionDebt: 5.5,    // Government-supported renewables
    costOfOperationalDebt: 5.0,     // Strong policy support
    costofEquity: 9.5,              // Moderate risk, policy support
    debtRatio: 80.0,                // Very high leverage typical
    effectiveTaxRate: 25.0,         // Corporate income tax
    capacityFactor: 30,
    energyPrice: 500,               // CNY/MWh
    currency: 'CNY',
    exchangeRate: 7.6,              // CNY per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'Japan',
    countryCode: 'jp',
    inflationRate: 0.5,
    costOfConstructionDebt: 2.5,    // Ultra-low interest rate environment
    costOfOperationalDebt: 2.0,     // Very stable, mature market
    costofEquity: 6.5,              // Low risk, developed market
    debtRatio: 70.0,                // Conservative Japanese approach
    effectiveTaxRate: 30.62,        // Corporate tax + local taxes
    capacityFactor: 25,
    energyPrice: 20000,             // JPY/MWh
    currency: 'JPY',
    exchangeRate: 160,              // JPY per EUR
    foreignCurrency: 'EUR'
  },
  {
    country: 'Pakistan',
    countryCode: 'pk',
    inflationRate: 6.0,
    costOfConstructionDebt: 12.0,   // High country risk, currency volatility
    costOfOperationalDebt: 11.5,    // Significant operational risks
    costofEquity: 15.0,             // Very high risk premium
    debtRatio: 60.0,                // Conservative due to high risks
    effectiveTaxRate: 29.0,         // Corporate tax rate
    capacityFactor: 28,
    energyPrice: 10000,             // PKR/MWh
    currency: 'PKR',
    exchangeRate: 298,              // PKR per EUR
    foreignCurrency: 'EUR'
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB successfully');

    // OPTIONAL: Clear existing data (commented by default)
    // Uncomment the next two lines to clear existing location data before seeding
    await LocationDefaults.deleteMany({});
    console.log('Deleted existing location data');

    // Insert new data
    const result = await LocationDefaults.insertMany(locationData);
    console.log(`Successfully seeded ${result.length} location records`);

    // Display summary of seeded data
    console.log('\nSeeded locations:');
    result.forEach(location => {
      console.log(`- ${location.country} (${location.countryCode}): ${location.debtRatio}% debt ratio, ${location.costofEquity}% cost of equity`);
    });

    // Disconnect
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();