# Backend Structure Analysis - Repair Package System Phase 1 Implementation

## Backend Organization Patterns

### Directory Structure
```
backend/
├── scripts/                    # Seed scripts
├── controllers/               # Request handlers 
├── routes/                   # API route definitions
├── services/                 # Business logic
├── middlewares/              # Request processing
├── utils/                    # Helper functions
├── config/                   # Database & app config
└── app.js                    # Main application file

schemas/                      # OUTSIDE backend/ 
├── yup/                      # Yup validation schemas
└── mongoose/                 # Mongoose model generation
```

### Key Pattern: Yup-First Architecture
- **Yup schemas** define validation and structure
- **Mongoose models** auto-generated from Yup via `yupToMongoose()`
- **Controllers** use Mongoose models for database operations
- **Routes** use `validateMiddleware()` for request validation

## Existing Model Patterns

### 1. Schema File Organization
**Yup Schema Example** (`schemas/yup/locationDefaults.js`):
```javascript
const LocationDefaultsSchema = Yup.object().shape({
    country: Yup.string().required().trim(),
    countryCode: Yup.string().required().trim(),
    // ... field definitions with validation & defaults
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date()),
});
```

**Mongoose Model Example** (`schemas/mongoose/locationDefaults.js`):
```javascript
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const LocationDefaultsSchemaYup = require('../yup/locationDefaults');

const LocationDefaultsSchema = yupToMongoose(LocationDefaultsSchemaYup);

LocationDefaultsSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const LocationDefaults = mongoose.model('LocationDefaults', LocationDefaultsSchema);
module.exports = LocationDefaults;
```

### 2. API Route Patterns
**Standard CRUD Routes** (`backend/routes/locationRoutes.js`):
```javascript
const { validateMiddleware } = require('../utils/validate');
const { LocationDefaultsSchema } = require('../../schemas/yup/locationDefaults');

// Standard CRUD pattern
router.get('/', getAllLocations);                    // List all
router.get('/:id', getLocationById);                // Get by ID  
router.post('/', validateMiddleware(LocationDefaultsSchema), createLocation);
router.put('/:id', validateMiddleware(LocationDefaultsSchema), updateLocation);
router.delete('/:id', deleteLocation);
```

### 3. Controller Patterns
**Standard Controller Structure** (`backend/controllers/locationController.js`):
```javascript
const LocationDefaults = require('../../schemas/mongoose/locationDefaults');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

const getAllLocations = async (req, res) => {
  try {
    const locations = await LocationDefaults.find().sort({ country: 1 });
    res.json(formatSuccess(locations, 'Locations retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch locations', 500, [error.message]));
  }
};

// Similar pattern for create, update, delete
```

### 4. Seed Script Patterns  
**Seed Script Structure** (`backend/scripts/seedLocations.js`):
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const LocationDefaults = require('../../schemas/mongoose/locationDefaults');
const { connectDB } = require('../config/db');

const locationData = [/* array of default data */];

const seedDatabase = async () => {
  try {
    await connectDB();
    await LocationDefaults.deleteMany({});  // Clear existing
    const result = await LocationDefaults.insertMany(locationData);
    console.log(`Successfully seeded ${result.length} records`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
```

## Current Models Analysis

### Existing Models Following This Pattern:
1. **LocationDefaults** - Financial parameters by country
2. **OEMScope** - Service scope definitions  
3. **MajorComponent** - Component definitions with failure rates
4. **Scenario** - Complete project scenarios
5. **ComponentFailureRates** - Component-specific failure data

### Route Registration Pattern
**Main Routes File** (`backend/routes/index.js`):
```javascript
router.use('/scenarios', scenarioRoutes);
router.use('/locations', locationRoutes);
router.use('/oemscopes', oemScopeRoutes);
router.use('/components', majorComponentRoutes);
```

## Phase 1 Implementation Plan

### 1. Yup Schema Creation

**File: `schemas/yup/repairPackage.js`**
```javascript
const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

const RepairPackageSchema = Yup.object().shape({
    name: Yup.string().required('Package name is required').trim(),
    description: Yup.string().trim().default(''),
    category: Yup.string()
        .oneOf(['basic', 'standard', 'comprehensive', 'premium'], 'Invalid package category')
        .default('standard'),
    
    // Cost structure using existing distribution patterns
    costs: Yup.object().shape({
        componentReplacement: DistributionTypeSchema.default(() => ({
            type: 'fixed', parameters: { value: 50000 }
        })),
        craneMobilization: DistributionTypeSchema.default(() => ({
            type: 'fixed', parameters: { value: 25000 }
        })),
        craneDailyRate: DistributionTypeSchema.default(() => ({
            type: 'fixed', parameters: { value: 5000 }
        })),
        repairDurationDays: DistributionTypeSchema.default(() => ({
            type: 'triangular', parameters: { min: 3, mode: 7, max: 14 }
        })),
        specialistLabor: DistributionTypeSchema.default(() => ({
            type: 'fixed', parameters: { value: 15000 }
        })),
        downtimeRevenuePerDay: DistributionTypeSchema.default(() => ({
            type: 'fixed', parameters: { value: 8000 }
        }))
    }).required(),
    
    // Applicability constraints
    appliesTo: Yup.object().shape({
        componentCategories: Yup.array()
            .of(Yup.string().oneOf(['drivetrain', 'electrical', 'rotor', 'mechanical', 'control']))
            .default([]),
        turbineTypes: Yup.array()
            .of(Yup.string().oneOf(['geared', 'direct-drive']))
            .default(['geared', 'direct-drive'])
    }).required(),
    
    isActive: Yup.boolean().default(true),
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date()),
});

module.exports = RepairPackageSchema;
```

**File: `schemas/yup/globalCostDistribution.js`**
```javascript
const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

const GlobalCostDistributionSchema = Yup.object().shape({
    category: Yup.string()
        .oneOf(['crane', 'labor', 'parts', 'logistics', 'downtime'], 'Invalid cost category')
        .required('Cost category is required'),
    
    subcategory: Yup.string().trim().default(''),
    
    // Regional and market factors
    region: Yup.string()
        .oneOf(['europe', 'north-america', 'asia-pacific', 'global'], 'Invalid region')
        .default('global'),
    
    // Cost distribution definition
    costDistribution: DistributionTypeSchema.required('Cost distribution is required'),
    
    // Applicability and constraints
    appliesTo: Yup.object().shape({
        turbineTypes: Yup.array().of(Yup.string()).default(['geared', 'direct-drive']),
        componentCategories: Yup.array().of(Yup.string()).default([]),
        minTurbineSize: Yup.number().min(0).default(0), // MW
        maxTurbineSize: Yup.number().min(0).default(20) // MW
    }).required(),
    
    // Metadata
    description: Yup.string().trim().default(''),
    source: Yup.string().trim().default(''), // Data source/reference
    confidence: Yup.string()
        .oneOf(['low', 'medium', 'high'], 'Invalid confidence level')
        .default('medium'),
    
    isActive: Yup.boolean().default(true),
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date()),
});

module.exports = GlobalCostDistributionSchema;
```

### 2. Mongoose Models

**File: `schemas/mongoose/repairPackage.js`**
```javascript
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const RepairPackageSchemaYup = require('../yup/repairPackage');

const RepairPackageSchema = yupToMongoose(RepairPackageSchemaYup);

RepairPackageSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for performance
RepairPackageSchema.index({ category: 1, isActive: 1 });
RepairPackageSchema.index({ 'appliesTo.componentCategories': 1 });

const RepairPackage = mongoose.model('RepairPackage', RepairPackageSchema);
module.exports = RepairPackage;
```

**File: `schemas/mongoose/globalCostDistribution.js`**
```javascript
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const GlobalCostDistributionSchemaYup = require('../yup/globalCostDistribution');

const GlobalCostDistributionSchema = yupToMongoose(GlobalCostDistributionSchemaYup);

GlobalCostDistributionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for performance
GlobalCostDistributionSchema.index({ category: 1, region: 1, isActive: 1 });
GlobalCostDistributionSchema.index({ 'appliesTo.componentCategories': 1 });

const GlobalCostDistribution = mongoose.model('GlobalCostDistribution', GlobalCostDistributionSchema);
module.exports = GlobalCostDistribution;
```

### 3. Controllers

**File: `backend/controllers/repairPackageController.js`**
```javascript
const RepairPackage = require('../../schemas/mongoose/repairPackage');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

const getAllRepairPackages = async (req, res) => {
  try {
    const { category, active } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';
    
    const packages = await RepairPackage.find(filter).sort({ category: 1, name: 1 });
    res.json(formatSuccess(packages, 'Repair packages retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch repair packages', 500, [error.message]));
  }
};

const getRepairPackageById = async (req, res) => {
  try {
    const package = await RepairPackage.findById(req.params.id);
    if (!package) {
      return res.status(404).json(formatError('Repair package not found', 404, []));
    }
    res.json(formatSuccess(package, 'Repair package retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch repair package', 500, [error.message]));
  }
};

const createRepairPackage = async (req, res) => {
  try {
    // Check for duplicate name
    const existingPackage = await RepairPackage.findOne({ name: req.body.name });
    if (existingPackage) {
      return res.status(400).json(formatError('A repair package with this name already exists', 400, ['Duplicate name']));
    }

    const newPackage = new RepairPackage(req.body);
    await newPackage.save();

    const data = { _id: newPackage._id, createdAt: newPackage.createdAt, updatedAt: newPackage.updatedAt };
    res.status(201).json(formatSuccess(data, 'Repair package created successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to create repair package', 500, [error.message]));
  }
};

const updateRepairPackage = async (req, res) => {
  try {
    // Check for duplicate name (excluding current package)
    if (req.body.name) {
      const existingPackage = await RepairPackage.findOne({ 
        name: req.body.name, 
        _id: { $ne: req.params.id } 
      });
      if (existingPackage) {
        return res.status(400).json(formatError('A repair package with this name already exists', 400, ['Duplicate name']));
      }
    }

    const updatedPackage = await RepairPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedPackage) {
      return res.status(404).json(formatError('Repair package not found', 404, []));
    }

    const data = { _id: updatedPackage._id, createdAt: updatedPackage.createdAt, updatedAt: updatedPackage.updatedAt };
    res.json(formatSuccess(data, 'Repair package updated successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to update repair package', 500, [error.message]));
  }
};

const deleteRepairPackage = async (req, res) => {
  try {
    const deletedPackage = await RepairPackage.findByIdAndDelete(req.params.id);
    if (!deletedPackage) {
      return res.status(404).json(formatError('Repair package not found', 404, []));
    }

    const data = { _id: deletedPackage._id, createdAt: deletedPackage.createdAt, updatedAt: deletedPackage.updatedAt };
    res.json(formatSuccess(data, 'Repair package deleted successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to delete repair package', 500, [error.message]));
  }
};

module.exports = {
  getAllRepairPackages,
  getRepairPackageById,
  createRepairPackage,
  updateRepairPackage,
  deleteRepairPackage,
};
```

### 4. Routes

**File: `backend/routes/repairPackageRoutes.js`**
```javascript
const express = require('express');
const router = express.Router();
const { validateMiddleware } = require('../utils/validate');
const RepairPackageSchema = require('../../schemas/yup/repairPackage');

const {
  getAllRepairPackages,
  getRepairPackageById,
  createRepairPackage,
  updateRepairPackage,
  deleteRepairPackage
} = require('../controllers/repairPackageController');

// GET /api/repair-packages - Get all repair packages
router.get('/', getAllRepairPackages);

// GET /api/repair-packages/:id - Get repair package by ID
router.get('/:id', getRepairPackageById);

// POST /api/repair-packages - Create a new repair package
router.post('/', validateMiddleware(RepairPackageSchema), createRepairPackage);

// PUT /api/repair-packages/:id - Update repair package
router.put('/:id', validateMiddleware(RepairPackageSchema), updateRepairPackage);

// DELETE /api/repair-packages/:id - Delete repair package
router.delete('/:id', deleteRepairPackage);

module.exports = router;
```

### 5. Seed Scripts

**File: `backend/scripts/seedRepairPackages.js`**
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const RepairPackage = require('../../schemas/mongoose/repairPackage');
const { connectDB } = require('../config/db');

const repairPackageData = [
  {
    name: 'Basic Repair Package',
    description: 'Essential repair services for common failures',
    category: 'basic',
    costs: {
      componentReplacement: { type: 'triangular', parameters: { min: 30000, mode: 50000, max: 80000 } },
      craneMobilization: { type: 'triangular', parameters: { min: 15000, mode: 25000, max: 40000 } },
      craneDailyRate: { type: 'triangular', parameters: { min: 3000, mode: 5000, max: 8000 } },
      repairDurationDays: { type: 'triangular', parameters: { min: 2, mode: 5, max: 10 } },
      specialistLabor: { type: 'triangular', parameters: { min: 8000, mode: 15000, max: 25000 } },
      downtimeRevenuePerDay: { type: 'triangular', parameters: { min: 5000, mode: 8000, max: 12000 } }
    },
    appliesTo: {
      componentCategories: ['electrical', 'control'],
      turbineTypes: ['geared', 'direct-drive']
    }
  },
  {
    name: 'Standard Repair Package',
    description: 'Comprehensive repair services for major components',
    category: 'standard',
    costs: {
      componentReplacement: { type: 'triangular', parameters: { min: 50000, mode: 100000, max: 200000 } },
      craneMobilization: { type: 'triangular', parameters: { min: 25000, mode: 35000, max: 50000 } },
      craneDailyRate: { type: 'triangular', parameters: { min: 4000, mode: 6000, max: 10000 } },
      repairDurationDays: { type: 'triangular', parameters: { min: 3, mode: 7, max: 14 } },
      specialistLabor: { type: 'triangular', parameters: { min: 15000, mode: 25000, max: 40000 } },
      downtimeRevenuePerDay: { type: 'triangular', parameters: { min: 8000, mode: 12000, max: 18000 } }
    },
    appliesTo: {
      componentCategories: ['drivetrain', 'mechanical', 'rotor'],
      turbineTypes: ['geared', 'direct-drive']
    }
  },
  {
    name: 'Premium Repair Package',
    description: 'Full-service repair with expedited parts and specialized crews',
    category: 'premium', 
    costs: {
      componentReplacement: { type: 'triangular', parameters: { min: 150000, mode: 300000, max: 500000 } },
      craneMobilization: { type: 'triangular', parameters: { min: 40000, mode: 60000, max: 80000 } },
      craneDailyRate: { type: 'triangular', parameters: { min: 8000, mode: 12000, max: 18000 } },
      repairDurationDays: { type: 'triangular', parameters: { min: 5, mode: 10, max: 21 } },
      specialistLabor: { type: 'triangular', parameters: { min: 25000, mode: 50000, max: 80000 } },
      downtimeRevenuePerDay: { type: 'triangular', parameters: { min: 12000, mode: 20000, max: 30000 } }
    },
    appliesTo: {
      componentCategories: ['drivetrain', 'rotor', 'mechanical', 'electrical', 'control'],
      turbineTypes: ['geared', 'direct-drive']
    }
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB successfully');

    await RepairPackage.deleteMany({});
    console.log('Deleted existing repair package data');

    const result = await RepairPackage.insertMany(repairPackageData);
    console.log(`Successfully seeded ${result.length} repair package records`);

    console.log('\nSeeded repair packages:');
    result.forEach(pkg => {
      console.log(`- ${pkg.name} (${pkg.category}): ${pkg.appliesTo.componentCategories.join(', ')}`);
    });

    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
```

### 6. Route Registration

**Update `backend/routes/index.js`:**
```javascript
const repairPackageRoutes = require('./repairPackageRoutes');
const globalCostRoutes = require('./globalCostRoutes');

// Add to existing routes
router.use('/repair-packages', repairPackageRoutes);
router.use('/global-costs', globalCostRoutes);
```

## Implementation Checklist

### Phase 1 Files to Create:
1. ✅ `schemas/yup/repairPackage.js` - Yup validation schema
2. ✅ `schemas/yup/globalCostDistribution.js` - Global cost schema
3. ✅ `schemas/mongoose/repairPackage.js` - Mongoose model
4. ✅ `schemas/mongoose/globalCostDistribution.js` - Mongoose model  
5. ✅ `backend/controllers/repairPackageController.js` - API logic
6. ✅ `backend/controllers/globalCostController.js` - Cost API logic
7. ✅ `backend/routes/repairPackageRoutes.js` - Route definitions
8. ✅ `backend/routes/globalCostRoutes.js` - Cost route definitions
9. ✅ `backend/scripts/seedRepairPackages.js` - Seed data
10. ✅ `backend/scripts/seedGlobalCosts.js` - Cost seed data

### Integration Points:
- Update `backend/routes/index.js` to register new routes
- Follow existing error handling patterns with `responseFormatter`
- Use existing validation middleware patterns
- Follow existing naming conventions and file organization

### Testing Strategy:
- Create comprehensive seed data covering all component categories
- Test CRUD operations for both models
- Validate distribution parameter handling
- Verify constraint validations work correctly

This analysis provides a complete roadmap for implementing Phase 1 following the established patterns in the codebase.