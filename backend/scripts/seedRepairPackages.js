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
      componentCostEUR: 400000,      // High-value major components
      craneMobilizationEUR: 120000,  // Crawler crane mobilization
      craneDailyRateEUR: 15000,      // Daily crawler crane rate
      specialistLaborEUR: 35000      // Specialized technicians
    },
    crane: {
      required: true,
      type: "crawler",
      minimumDays: 3,
      baseDurationDays: 6
    },
    complexity: {
      component: {
        type: 'lognormal',
        parameters: { mu: 0, sigma: 0.3 }  // High technical risk variation
      },
      repair: {
        type: 'gamma',
        parameters: { shape: 3, scale: 0.3 }  // Moderate duration uncertainty
      }
    },
    baseEscalationRate: 0.03,
    appliesTo: {
      componentCategories: ['gearbox', 'generator', 'main_bearing'],
      turbineTypes: [],
      powerRangeKW: { min: 1500, max: 999999 }
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Medium Lift Electrical",
    description: "Power electronics and transformer replacements with mobile crane support",
    category: "medium", 
    costs: {
      componentCostEUR: 85000,       // Medium-value electrical components
      craneMobilizationEUR: 60000,   // Mobile crane mobilization
      craneDailyRateEUR: 8000,       // Daily mobile crane rate
      specialistLaborEUR: 20000      // Electrical specialists
    },
    crane: {
      required: true,
      type: "mobile",
      minimumDays: 2,
      baseDurationDays: 3
    },
    complexity: {
      component: {
        type: 'lognormal',
        parameters: { mu: 0, sigma: 0.2 }  // Medium technical risk
      },
      repair: {
        type: 'gamma',
        parameters: { shape: 2.5, scale: 0.25 }  // Lower duration uncertainty
      }
    },
    baseEscalationRate: 0.025,
    appliesTo: {
      componentCategories: ['power_electronics', 'transformer'],
      turbineTypes: [],
      powerRangeKW: { min: 850, max: 999999 }
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Light Mechanical", 
    description: "Yaw and pitch system repairs with light crane requirements",
    category: "minor",
    costs: {
      componentCostEUR: 35000,       // Lower-value mechanical components
      craneMobilizationEUR: 40000,   // Light mobile crane
      craneDailyRateEUR: 5000,       // Daily light crane rate
      specialistLaborEUR: 15000      // Mechanical specialists
    },
    crane: {
      required: true,
      type: "mobile",
      minimumDays: 1,
      baseDurationDays: 2
    },
    complexity: {
      component: {
        type: 'lognormal', 
        parameters: { mu: 0, sigma: 0.15 }  // Low technical risk
      },
      repair: {
        type: 'gamma',
        parameters: { shape: 4, scale: 0.2 }  // Very low duration uncertainty
      }
    },
    baseEscalationRate: 0.02,
    appliesTo: {
      componentCategories: ['yaw_system', 'pitch_system'],
      turbineTypes: [],
      powerRangeKW: { min: 600, max: 999999 }
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "No Crane Electronic",
    description: "Control systems and sensor replacements requiring no crane operations",
    category: "electronic",
    costs: {
      componentCostEUR: 18000,       // Low-value electronic components
      craneMobilizationEUR: 0,       // No crane required
      craneDailyRateEUR: 0,          // No crane costs
      specialistLaborEUR: 8000       // Electronics specialists
    },
    crane: {
      required: false,
      type: "none",
      minimumDays: 0,
      baseDurationDays: 1
    },
    complexity: {
      component: {
        type: 'lognormal',
        parameters: { mu: 0, sigma: 0.1 }  // Minimal technical risk
      },
      repair: {
        type: 'uniform',
        parameters: { min: 0.8, max: 1.2 }  // Predictable duration
      }
    },
    baseEscalationRate: 0.015,
    appliesTo: {
      componentCategories: ['control_system', 'sensors', 'scada'],
      turbineTypes: [],
      powerRangeKW: { min: 0, max: 999999 }
    },
    isDefault: true,
    isActive: true
  },
  {
    name: "Blade Work Package",
    description: "Blade bearing and blade repair operations with specialized tower crane",
    category: "blade",
    costs: {
      componentCostEUR: 45000,       // Blade-specific components
      craneMobilizationEUR: 150000,  // Specialized tower crane
      craneDailyRateEUR: 20000,      // High tower crane daily rate
      specialistLaborEUR: 25000      // Blade repair specialists
    },
    crane: {
      required: true,
      type: "tower",
      minimumDays: 4,
      baseDurationDays: 7
    },
    complexity: {
      component: {
        type: 'lognormal',
        parameters: { mu: 0, sigma: 0.25 }  // Weather-dependent complexity
      },
      repair: {
        type: 'gamma',
        parameters: { shape: 2, scale: 0.4 }  // High weather uncertainty
      }
    },
    baseEscalationRate: 0.035,
    appliesTo: {
      componentCategories: ['blade_bearings', 'blades', 'hub'],
      turbineTypes: [],
      powerRangeKW: { min: 1000, max: 999999 }
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