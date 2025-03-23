// backend/scripts/seedMajorComponents.js
require('dotenv').config();
const mongoose = require('mongoose');
const MajorComponent = require('../models/MajorComponent');
const { connectDB } = require('../config/db');

// Default major components data
const defaultComponents = [
  {
    name: 'Blades',
    description: 'Wind turbine blades',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 3,
    defaultFailureRate: 2,
    isDefault: true
  },
  {
    name: 'Blade Bearings',
    description: 'Bearings that attach blades to the hub and allow pitch control',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 3, 
    defaultFailureRate: 1.5,
    isDefault: true
  },
  {
    name: 'Transformers',
    description: 'Power transformers for grid connection',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 1,
    defaultFailureRate: 1,
    isDefault: true
  },
  {
    name: 'Gearboxes',
    description: 'Mechanical gearboxes that increase rotational speed',
    appliesTo: { geared: true, directDrive: false },
    quantityPerWTG: 1,
    defaultFailureRate: 3,
    isDefault: true
  },
  {
    name: 'Generators',
    description: 'Electric generators that produce power',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 1,
    defaultFailureRate: 2.5,
    isDefault: true
  },
  {
    name: 'Converters',
    description: 'Power electronics for converting variable AC to grid-compatible power',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 1,
    defaultFailureRate: 2,
    isDefault: true
  },
  {
    name: 'Main Bearings',
    description: 'Main shaft bearings',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 1,
    defaultFailureRate: 1.8,
    isDefault: true
  },
  {
    name: 'Yaw Systems',
    description: 'Systems that rotate nacelle to face the wind',
    appliesTo: { geared: true, directDrive: true },
    quantityPerWTG: 1,
    defaultFailureRate: 1.2,
    isDefault: true
  }
];

// Function to seed the database
async function seedMajorComponents() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Checking for existing components...');
    const count = await MajorComponent.countDocuments();
    
    if (count > 0) {
      console.log(`Found ${count} existing components. Checking for updates...`);
      
      // Update existing components or add new ones
      for (const component of defaultComponents) {
        await MajorComponent.findOneAndUpdate(
          { name: component.name },
          component,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`Upserted: ${component.name}`);
      }
    } else {
      console.log('No existing components found. Creating defaults...');
      await MajorComponent.insertMany(defaultComponents);
      console.log(`Inserted ${defaultComponents.length} default components`);
    }
    
    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding major components:', error);
    process.exit(1);
  }
}

/**
 * Helper function to create default failure models for a scenario
 * @param {string} platformType - 'geared' or 'direct-drive'
 * @returns {Array} Array of default failure model objects
 */
async function createDefaultFailureModels(platformType = 'geared') {
  try {
    // Get components applicable to this platform type
    const query = {};
    query[`appliesTo.${platformType}`] = true;
    
    const components = await MajorComponent.find(query);
    
    // Create a failure model for each component
    return components.map(component => ({
      designLife: 20,
      totalLifetime: 25,
      componentCount: component.quantityPerWTG * 20, // Assuming 20 WTGs
      percentiles: [10, 50, 90],
      assumedFailureRate: component.defaultFailureRate / 100, // Convert from percentage
      majorComponent: {
        name: component.name,
        description: component.description,
        appliesTo: component.appliesTo,
        quantityPerWTG: component.quantityPerWTG,
        defaultFailureRate: component.defaultFailureRate
      },
      historicalData: {
        type: 'none',
        data: []
      }
    }));
  } catch (error) {
    console.error('Error creating default failure models:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  seedMajorComponents,
  createDefaultFailureModels
};

// If called directly, run the seed function
if (require.main === module) {
  seedMajorComponents();
}