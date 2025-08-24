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
    baseDurationDays: 6,
    costs: {
      material: { perEventEUR: 400000, perDayEUR: 0 },
      labor: { perEventEUR: 0, perDayEUR: 2500 },
      tooling: { perEventEUR: 0, perDayEUR: 1500 },
      crane: { perEventEUR: 120000, perDayEUR: 15000 },
      other: { perEventEUR: 5000, perDayEUR: 800 }
    },
    crane: {
      type: "crawler",
      minimumDays: 3
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
    baseDurationDays: 3,
    costs: {
      material: { perEventEUR: 85000, perDayEUR: 0 },
      labor: { perEventEUR: 0, perDayEUR: 1800 },
      tooling: { perEventEUR: 0, perDayEUR: 900 },
      crane: { perEventEUR: 60000, perDayEUR: 8000 },
      other: { perEventEUR: 2500, perDayEUR: 500 }
    },
    crane: {
      type: "mobile",
      minimumDays: 2
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
    baseDurationDays: 2,
    costs: {
      material: { perEventEUR: 35000, perDayEUR: 0 },
      labor: { perEventEUR: 0, perDayEUR: 1200 },
      tooling: { perEventEUR: 0, perDayEUR: 600 },
      crane: { perEventEUR: 40000, perDayEUR: 5000 },
      other: { perEventEUR: 1500, perDayEUR: 300 }
    },
    crane: {
      type: "mobile",
      minimumDays: 1
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
    baseDurationDays: 1,
    costs: {
      material: { perEventEUR: 18000, perDayEUR: 0 },
      labor: { perEventEUR: 0, perDayEUR: 900 },
      tooling: { perEventEUR: 0, perDayEUR: 400 },
      crane: { perEventEUR: 0, perDayEUR: 0 },
      other: { perEventEUR: 800, perDayEUR: 200 }
    },
    crane: {
      type: "none",
      minimumDays: 0
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
    baseDurationDays: 7,
    costs: {
      material: { perEventEUR: 45000, perDayEUR: 0 },
      labor: { perEventEUR: 0, perDayEUR: 2200 },
      tooling: { perEventEUR: 0, perDayEUR: 1200 },
      crane: { perEventEUR: 150000, perDayEUR: 20000 },
      other: { perEventEUR: 3500, perDayEUR: 600 }
    },
    crane: {
      type: "tower",
      minimumDays: 4
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

    await RepairPackage.deleteMany({});
    console.log('Deleted existing location data');


    // Insert new data
    const result = await RepairPackage.insertMany(repairPackageData);
    console.log(`Successfully seeded ${result.length} repair package records`);

    // Display summary of seeded data
    console.log('\nSeeded repair packages:');
    result.forEach(package => {
      const materialCost = package.costs?.material?.perEventEUR || 0;
      const hasCrane = (package.costs?.crane?.perEventEUR > 0) || (package.costs?.crane?.perDayEUR > 0);
      console.log(`- ${package.name} (${package.category}): €${materialCost.toLocaleString()} material cost, ${hasCrane ? package.crane.type : 'no'} crane, ${package.baseDurationDays} day${package.baseDurationDays !== 1 ? 's' : ''}`);
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