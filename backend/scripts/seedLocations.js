// backend/scripts/seedLocations.js

//command to execute: MONGO_URL=mdb.fthome.org MONGO_PASS= MONGO_USER= node backend/scripts/seedOEMScopes.js
require('dotenv').config();
const mongoose = require('mongoose');
const LocationDefaults = require('../models/LocationDefaults');
const { connectDB } = require('../config/db');

// Default location data
const locationData = [
  {
    country: 'India',
    countryCode: 'in',
    inflationRate: 5.0,        // Approx. 10-year CPI average (World Bank, IMF estimates)
    capacityFactor: 28,        // Typical onshore wind capacity factor
    energyPrice: 3000,         // Approx. INR 3/kWh PPA rate, converted to INR/MWh
    currency: 'INR',           // Indian Rupee
    exchangeRate: 89,          // INR per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'New Zealand',
    countryCode: 'nz',
    inflationRate: 2.0,        // Approx. 10-year CPI average
    capacityFactor: 35,        // Typical wind capacity factor
    energyPrice: 80,           // Approx. NZD/MWh based on wind PPA rates
    currency: 'NZD',           // New Zealand Dollar
    exchangeRate: 1.75,        // NZD per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'Australia',
    countryCode: 'au',
    inflationRate: 2.5,        // Approx. 10-year CPI average
    capacityFactor: 38,        // High wind capacity factor due to strong resources
    energyPrice: 70,           // Approx. AUD/MWh based on wind PPA rates
    currency: 'AUD',           // Australian Dollar
    exchangeRate: 1.65,        // AUD per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'Thailand',
    countryCode: 'th',
    inflationRate: 1.5,        // Approx. 10-year CPI average
    capacityFactor: 25,        // Typical onshore wind capacity factor
    energyPrice: 2500,         // Approx. THB/MWh based on renewable PPA rates
    currency: 'THB',           // Thai Baht
    exchangeRate: 37,          // THB per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'Philippines',
    countryCode: 'ph',
    inflationRate: 3.0,        // Approx. 10-year CPI average
    capacityFactor: 30,        // Typical wind capacity factor
    energyPrice: 5000,         // Approx. PHP/MWh based on wind PPA rates
    currency: 'PHP',           // Philippine Peso
    exchangeRate: 60,          // PHP per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'South Korea',
    countryCode: 'kr',
    inflationRate: 2.0,        // Approx. 10-year CPI average
    capacityFactor: 28,        // Typical onshore wind capacity factor
    energyPrice: 100000,       // Approx. KRW/MWh based on wind PPA rates
    currency: 'KRW',           // South Korean Won
    exchangeRate: 1420,        // KRW per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'Indonesia',
    countryCode: 'id',
    inflationRate: 4.0,        // Approx. 10-year CPI average
    capacityFactor: 25,        // Typical onshore wind capacity factor
    energyPrice: 1000000,      // Approx. IDR/MWh based on renewable PPA rates
    currency: 'IDR',           // Indonesian Rupiah
    exchangeRate: 16500,       // IDR per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'China',
    countryCode: 'cn',
    inflationRate: 2.5,        // Approx. 10-year CPI average
    capacityFactor: 30,        // Typical onshore wind capacity factor
    energyPrice: 500,          // Approx. CNY/MWh based on wind PPA rates
    currency: 'CNY',           // Chinese Yuan
    exchangeRate: 7.6,         // CNY per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'Japan',
    countryCode: 'jp',
    inflationRate: 0.5,        // Approx. 10-year CPI average (low due to deflation periods)
    capacityFactor: 25,        // Typical onshore wind capacity factor
    energyPrice: 20000,        // Approx. JPY/MWh based on wind PPA rates
    currency: 'JPY',           // Japanese Yen
    exchangeRate: 160,         // JPY per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  },
  {
    country: 'Pakistan',
    countryCode: 'pk',
    inflationRate: 6.0,        // Approx. 10-year CPI average
    capacityFactor: 28,        // Typical onshore wind capacity factor
    energyPrice: 10000,        // Approx. PKR/MWh based on wind PPA rates
    currency: 'PKR',           // Pakistani Rupee
    exchangeRate: 298,         // PKR per EUR, approximate as of March 2025
    foreignCurrency: 'EUR'     // Foreign currency is Euro
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB successfully');

    // Clear existing data
    await LocationDefaults.deleteMany({});
    console.log('Deleted existing location data');

    // Insert new data
    const result = await LocationDefaults.insertMany(locationData);
    console.log(`Successfully seeded ${result.length} location records`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Database connection closed');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();