// backend/scripts/seedRepairPackages.js

//command to execute: MONGO_URL=mdb.fthome.org MONGO_PASS=<password> MONGO_USER=<username> node backend/scripts/seedRepairPackages.js
require('dotenv').config();
const mongoose = require('mongoose');
const RepairPackage = require('../../schemas/mongoose/repairPackage');
const { connectDB } = require('../config/db');

// Default repair packages with realistic cost and complexity data
const repairPackageData = [
  {
    name: "Heavy Lift Major",
    description: "Gearbox, generator, main bearing replacements requiring heavy crane operations",
    category: "major",
    costs: {
      componentCostEUR: 400000,           // High-value major components
      craneMobilizationEUR: 120000,       // Crawler crane mobilization
      craneDailyRateEUR: 15000,          // Daily crawler crane rate
      specialistLaborDailyEUR: 2500,     // Specialized technicians daily rate
      specialtyToolingDailyEUR: 1500,    // Special tools daily rate
      additionalDailyCostEUR: 800,       // Other daily costs
      additionalPerEventCostEUR: 5000    // One-time event costs
    },
    crane: {
      required: true,
      type: "crawler",
      minimumDays: 3,
      baseDurationDays: 6
    },
    appliesTo: {
      componentCategories: ['gearbox', 'generator', 'main_bearing']
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Medium Lift Electrical",
    description: "Power electronics and transformer replacements with mobile crane support",
    category: "medium", 
    costs: {
      componentCostEUR: 85000,             // Medium-value electrical components
      craneMobilizationEUR: 60000,         // Mobile crane mobilization
      craneDailyRateEUR: 8000,            // Daily mobile crane rate
      specialistLaborDailyEUR: 1800,      // Electrical specialists daily rate
      specialtyToolingDailyEUR: 900,      // Testing equipment daily rate
      additionalDailyCostEUR: 500,        // Other daily costs
      additionalPerEventCostEUR: 2500     // One-time event costs
    },
    crane: {
      required: true,
      type: "mobile",
      minimumDays: 2,
      baseDurationDays: 3
    },
    appliesTo: {
      componentCategories: ['power_electronics', 'transformer']
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Light Mechanical", 
    description: "Yaw and pitch system repairs with light crane requirements",
    category: "minor",
    costs: {
      componentCostEUR: 35000,             // Lower-value mechanical components
      craneMobilizationEUR: 40000,         // Light mobile crane
      craneDailyRateEUR: 5000,            // Daily light crane rate
      specialistLaborDailyEUR: 1200,      // Mechanical specialists daily rate
      specialtyToolingDailyEUR: 600,      // Hydraulic tools daily rate
      additionalDailyCostEUR: 300,        // Other daily costs
      additionalPerEventCostEUR: 1500     // One-time event costs
    },
    crane: {
      required: true,
      type: "mobile",
      minimumDays: 1,
      baseDurationDays: 2
    },
    appliesTo: {
      componentCategories: ['yaw_system', 'pitch_system']
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "No Crane Electronic",
    description: "Control systems and sensor replacements requiring no crane operations",
    category: "electronic",
    costs: {
      componentCostEUR: 18000,             // Low-value electronic components
      craneMobilizationEUR: 0,             // No crane required
      craneDailyRateEUR: 0,               // No crane costs
      specialistLaborDailyEUR: 900,       // Electronics specialists daily rate
      specialtyToolingDailyEUR: 400,      // Testing equipment daily rate
      additionalDailyCostEUR: 200,        // Other daily costs
      additionalPerEventCostEUR: 800      // One-time event costs
    },
    crane: {
      required: false,
      type: "none",
      minimumDays: 0,
      baseDurationDays: 1
    },
    appliesTo: {
      componentCategories: ['control_system', 'sensors', 'scada']
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Blade Work Package",
    description: "Blade bearing and blade repair operations with specialized tower crane",
    category: "blade",
    costs: {
      componentCostEUR: 45000,             // Blade-specific components
      craneMobilizationEUR: 150000,        // Specialized tower crane
      craneDailyRateEUR: 20000,           // High tower crane daily rate
      specialistLaborDailyEUR: 2200,      // Blade repair specialists daily rate
      specialtyToolingDailyEUR: 1200,     // Blade tools daily rate
      additionalDailyCostEUR: 600,        // Other daily costs
      additionalPerEventCostEUR: 3500     // One-time event costs
    },
    crane: {
      required: true,
      type: "tower",
      minimumDays: 4,
      baseDurationDays: 7
    },
    appliesTo: {
      componentCategories: ['blade_bearings', 'blades', 'hub']
    },
    isDefault: true,
    isActive: true
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to MongoDB successfully');

    // Check for existing data
    const existingCount = await RepairPackage.countDocuments({});
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing repair packages. Skipping seed to avoid duplicates.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Insert new data
    const result = await RepairPackage.insertMany(repairPackageData);
    console.log(`Successfully seeded ${result.length} repair package records`);

    // Display summary of seeded data
    console.log('\nSeeded repair packages:');
    result.forEach(package => {
      console.log(`- ${package.name} (${package.category}): €${package.costs.componentCostEUR.toLocaleString()} component cost, ${package.crane.required ? package.crane.type : 'no'} crane`);
    });

    // Display category summary
    const categorySummary = {};
    result.forEach(package => {
      categorySummary[package.category] = (categorySummary[package.category] || 0) + 1;
    });
    
    console.log('\nPackages by category:');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} package${count > 1 ? 's' : ''}`);
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