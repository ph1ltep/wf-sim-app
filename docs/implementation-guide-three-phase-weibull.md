# Three-Phase Weibull Component Failure Model Implementation Guide

## Overview

This guide details the implementation of the physics-based three-phase Weibull component failure model as described in [prd-three-phase-weibull-component-failure-model.md](./prd-three-phase-weibull-component-failure-model.md). The implementation integrates sophisticated physics-based reliability modeling with the existing Wind Finance Simulator architecture.

## Architecture Decisions

### Core Implementation Strategy
- **Distribution System**: New `failure_rate_weibull` distribution type integrated with DistributionFieldV3
- **API Architecture**: New `/api/physics/simulate` route to handle complex dependency calculations
- **Data Storage**: Environment parameters in dedicated sections, component-specific physics in Equipment
- **Visualization**: Custom three-phase bathtub curve with simplified parameter visualization
- **Migration**: Replace all failure rate distributions with physics-aware versions

### Key Design Principles
1. **Leverage Existing Patterns**: Build on established DistributionFieldV3, ContextField, and schema patterns
2. **Clean Separation**: Site conditions in Environment, component specs in Equipment, physics calculations in backend
3. **Performance Optimization**: Calculate physics dependencies once, reuse across all components
4. **Maintain Backward Compatibility**: Follow existing schema evolution patterns with defaults

## Parameter Storage and UI Location Map

### 🚨 CRITICAL: Update UI Path References Only

This implementation requires **updating ContextField path references** in React components to align with the new UI structure and prevent broken interfaces.

### UI Path Updates Required

| Parameter | Current UI Path | New UI Path | Action |
|-----------|-----------------|-------------|--------|
| **windVariability** | `settings.modules.revenue.windVariability` | `settings.project.environment.weather.windVariability` | Update ContextField path |
| **turbulenceIntensity** | `settings.modules.revenue.turbulenceIntensity` | `settings.project.environment.siteConditions.turbulenceIntensity` | Update ContextField path |
| **surfaceRoughness** | `settings.modules.revenue.surfaceRoughness` | `settings.project.environment.siteConditions.surfaceRoughness` | Update ContextField path |
| **kaimalScale** | `settings.modules.revenue.kaimalScale` | `settings.project.environment.siteConditions.kaimalScale` | Update ContextField path |

### Complete Parameter Reference Table (Updated Paths)

| Parameter | PRD Section | Storage Path | UI Location | Field Type | Default Value |
|-----------|-------------|--------------|-------------|------------|---------------|
| **Site Environmental** | | | | | |
| Mean Wind Speed | 3.1.1 | `settings.project.environment.weather.windVariability` | Environment/Weather | Distribution | 8.5 m/s |
| Turbulence Intensity | 3.1.2 | `settings.project.environment.siteConditions.turbulenceIntensity` | Environment/Site Conditions | Distribution | 0.16 |
| Surface Roughness | 3.1.2b | `settings.project.environment.siteConditions.surfaceRoughness` | Environment/Site Conditions | Number | 0.03 |
| Kaimal Scale | 3.1.2c | `settings.project.environment.siteConditions.kaimalScale` | Environment/Site Conditions | Number | 8.1 |
| Temperature Range | 3.1.3 | `settings.project.environment.weather.temperatureRange` | Environment/Weather | Distribution | [-20, 40]°C |
| Daily Temp Swing | 3.1.4 | `settings.project.environment.weather.dailyTempSwing` | Environment/Weather | Distribution | 15°C |
| Air Density | 3.1.5 | `settings.project.environment.siteConditions.airDensity` | Environment/Site Conditions | Number | 1.225 kg/m³ |
| Relative Humidity | 3.1.6 | `settings.project.environment.weather.relativeHumidity` | Environment/Weather | Distribution | 0.65 |
| Salinity Level | 3.1.7 | `settings.project.environment.siteConditions.salinityLevel` | Environment/Site Conditions | Select | 'moderate' |
| Wind Shear Exponent | 3.1.8 | `settings.project.environment.siteConditions.windShearExponent` | Environment/Site Conditions | Number | 0.14 |
| Start/Stop Cycles | 3.1.9 | `settings.project.environment.siteConditions.startStopCyclesPerYear` | Environment/Site Conditions | Number | 200 |
| **Turbine Design** | | | | | |
| IEC Class | 3.2.1 | `settings.project.windFarm.turbineSpecs.iecClass` | Wind Farm (existing page) | Select | 'IIA' |
| Design Life | 3.2.2 | `settings.project.windFarm.turbineSpecs.designLifeYears` | Wind Farm (existing page) | Select | 25 |
| Rated Power | 3.2.3 | `settings.project.windFarm.turbineSpecs.ratedPowerMW` | Wind Farm (existing page) | Number | 5.0 |
| **Component-Specific (Gearbox)** | | | | | |
| Bearing L10 Life | 4.1.1 | `settings.project.equipment.failureRates.components.gearboxes.physicsParameters.bearingL10Hours` | Equipment/Specifications | Number | 175000 |
| Gear Stages | 4.1.2 | `settings.project.equipment.failureRates.components.gearboxes.physicsParameters.gearStages` | Equipment/Specifications | Number | 3 |
| Bearing Count | 4.1.3 | `settings.project.equipment.failureRates.components.gearboxes.physicsParameters.bearingCount` | Equipment/Specifications | Number | 8 |
| Oil Temp Max | 4.1.4 | `settings.project.equipment.failureRates.components.gearboxes.physicsParameters.oilTempMax` | Equipment/Specifications | Number | 70°C |
| Torque Rating | 4.1.5 | `settings.project.equipment.failureRates.components.gearboxes.physicsParameters.torqueRating` | Equipment/Specifications | Number | 2847 kNm |
| **Component-Specific (Generator)** | | | | | |
| Winding Insulation Class | 4.2.1 | `settings.project.equipment.failureRates.components.generators.physicsParameters.insulationClass` | Equipment/Specifications | Select | 'F' |
| Cooling Method | 4.2.2 | `settings.project.equipment.failureRates.components.generators.physicsParameters.coolingMethod` | Equipment/Specifications | Select | 'air' |
| Bearing L10 Life | 4.2.3 | `settings.project.equipment.failureRates.components.generators.physicsParameters.bearingL10Hours` | Equipment/Specifications | Number | 200000 |
| **Component-Specific (Blades)** | | | | | |
| Material Fatigue Limit | 4.3.1 | `settings.project.equipment.failureRates.components.blades.physicsParameters.fatigueLimitMPa` | Equipment/Specifications | Number | 100 |
| Surface Treatment | 4.3.2 | `settings.project.equipment.failureRates.components.blades.physicsParameters.surfaceTreatment` | Equipment/Specifications | Select | 'standard' |
| **Weibull Model Parameters** | | | | | |
| Phase 1 Shape (β₁) | 5.1.1 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phase1.shape` | Equipment/Failure Rates (expandable row) | Number | 0.6 |
| Phase 1 Scale (η₁) | 5.1.2 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phase1.scale` | Equipment/Failure Rates (expandable row) | Number | 2.1 |
| Phase 2 Shape (β₂) | 5.1.3 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phase2.shape` | Equipment/Failure Rates (expandable row) | Number | 1.0 |
| Phase 2 Scale (η₂) | 5.1.4 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phase2.scale` | Equipment/Failure Rates (expandable row) | Number | 25.0 |
| Phase 3 Shape (β₃) | 5.1.5 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phase3.shape` | Equipment/Failure Rates (expandable row) | Number | 3.0 |
| Phase 3 Scale (η₃) | 5.1.6 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phase3.scale` | Equipment/Failure Rates (expandable row) | Number | 28.0 |
| Continuity Tolerance | 5.2.1 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.phaseContinuityTolerance` | Equipment/Failure Rates (expandable row) | Number | 0.05 |
| Wear-out Multiplier | 5.2.2 | `settings.project.equipment.failureRates.components.{id}.distribution.parameters.wearOutMultiplier` | Equipment/Failure Rates (expandable row) | Number | 2.5 |

## New UI Structure

### Navigation Changes
```
Scenario/
├── Environment/              ← NEW top-level section
│   ├── Site Conditions       ← NEW: turbulence, wind, temperature, etc.
│   └── Weather               ← MOVED: from Economics/Environment
├── Wind Farm/                ← EXISTING: Add turbine specs here
├── Equipment/
│   ├── Specifications        ← NEW: Component-specific physics params
│   └── Failure Rates         ← EXISTING: Enhanced with physics distributions
└── Economics/
    ├── Revenue               ← EXISTING: Keep windVariability here
    └── (Environment REMOVED) ← MOVED to top-level Environment
```

## DistributionFieldV3 Integration

### Required Extensions

The current DistributionFieldV3 architecture fully supports the new distribution with minimal modifications:

#### 1. Distribution Registration
**File**: `/frontend/src/utils/distributions/index.js`
```javascript
// Add import
import { FailureRateWeibull } from './failureRateWeibull';

// Add to DISTRIBUTIONS object
failure_rate_weibull: FailureRateWeibull,

// Add to distributionTypes array
{ value: 'failure_rate_weibull', label: 'Three-Phase Weibull (Physics-Based)' }
```

#### 2. New Distribution Implementation
**File**: `/frontend/src/utils/distributions/failureRateWeibull.js`
```javascript
import { DistributionBase } from './distributionBase';
import { roundTo } from 'utils/formatUtils';

export const FailureRateWeibull = {
    ...DistributionBase.template,

    validate(parameters) {
        const phases = ['phase1', 'phase2', 'phase3'];
        const issues = [];

        phases.forEach(phase => {
            if (!parameters[phase] || parameters[phase].shape <= 0 || parameters[phase].scale <= 0) {
                issues.push(`${phase} requires positive shape and scale parameters`);
            }
        });

        return {
            isValid: issues.length === 0,
            message: issues,
            details: parameters
        };
    },

    getMetadata(currentValue = null) {
        return {
            name: "Three-Phase Weibull (Physics-Based)",
            description: "Component failure modeling with physics-based lifecycle phases",
            applications: "Wind turbine component reliability with infant mortality, useful life, and wear-out",
            defaultCurve: "cdf",
            nonNegativeSupport: true,
            minPointsRequired: 8,
            customVisualization: true, // Use custom bathtub curve
            parameters: [
                {
                    name: "phase1",
                    description: "Infant Mortality Phase (0-2 years)",
                    required: true,
                    fieldType: "object",
                    fieldProps: {
                        label: "Phase 1 (Infant Mortality)",
                        tooltip: "Early failure phase with decreasing hazard rate",
                        span: 24,
                        subParameters: [
                            {
                                name: "shape",
                                fieldType: "number",
                                fieldProps: {
                                    label: "Shape (β₁)",
                                    defaultValue: 0.6,
                                    min: 0.1,
                                    max: 2.0,
                                    step: 0.1
                                }
                            },
                            {
                                name: "scale",
                                fieldType: "number",
                                fieldProps: {
                                    label: "Scale (η₁)",
                                    defaultValue: 2.1,
                                    min: 0.1,
                                    max: 10.0,
                                    step: 0.1
                                }
                            }
                        ]
                    }
                },
                // Similar structure for phase2 and phase3
                {
                    name: "phaseContinuityTolerance",
                    description: "Maximum discontinuity allowed between phases",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Phase Continuity Tolerance",
                        tooltip: "Maximum hazard rate jump between phases",
                        defaultValue: 0.05,
                        min: 0.01,
                        max: 0.20,
                        step: 0.01,
                        span: 12
                    }
                },
                {
                    name: "wearOutMultiplier",
                    description: "Wear-out acceleration factor",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Wear-out Multiplier",
                        tooltip: "Factor by which wear-out phase exceeds useful life",
                        defaultValue: 2.5,
                        min: 1.5,
                        max: 5.0,
                        step: 0.1,
                        span: 12
                    }
                }
            ]
        };
    },

    // Custom visualization - returns null to disable standard plot
    generatePDF() {
        return null; // Will trigger custom visualization component
    },

    generateCDF() {
        return null; // Will trigger custom visualization component
    },

    // Required template methods - simplified for physics model
    calculateMean(parameters) {
        // Approximate mean time to failure based on three phases
        return 15; // Average turbine component MTTF
    },

    calculateStdDev(parameters) {
        // Approximate standard deviation
        return 8;
    }
};
```

#### 3. Custom Visualization Component
**File**: `/frontend/src/components/visualizations/ThreePhaseWeibullVisualization.jsx`
```jsx
import React from 'react';
import Plot from 'react-plotly.js';

const ThreePhaseWeibullVisualization = ({ parameters, height = 300 }) => {
    const { phase1, phase2, phase3 } = parameters;

    // Generate simplified bathtub curve for visualization only
    const generateBathtubCurve = () => {
        const years = Array.from({length: 30}, (_, i) => i + 1);
        const hazardRates = years.map(year => {
            if (year <= 2) {
                // Phase 1: Decreasing hazard (infant mortality)
                return calculateSimpleWeibullHazard(year, phase1.shape, phase1.scale);
            } else if (year <= 22) {
                // Phase 2: Constant hazard (useful life)
                return calculateSimpleWeibullHazard(year - 2, phase2.shape, phase2.scale);
            } else {
                // Phase 3: Increasing hazard (wear-out)
                return calculateSimpleWeibullHazard(year - 22, phase3.shape, phase3.scale);
            }
        });

        return { x: years, y: hazardRates };
    };

    const calculateSimpleWeibullHazard = (t, shape, scale) => {
        // Simplified hazard function: h(t) = (β/η) * (t/η)^(β-1)
        return (shape / scale) * Math.pow(t / scale, shape - 1);
    };

    const curveData = generateBathtubCurve();

    return (
        <div>
            <Plot
                data={[{
                    x: curveData.x,
                    y: curveData.y,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Hazard Rate',
                    line: {
                        color: '#1890ff',
                        width: 2
                    }
                }]}
                layout={{
                    title: {
                        text: 'Three-Phase Weibull Hazard Rate (Visualization Only)',
                        font: { size: 14 }
                    },
                    xaxis: {
                        title: 'Years',
                        gridcolor: '#f0f0f0'
                    },
                    yaxis: {
                        title: 'Annual Failure Rate',
                        gridcolor: '#f0f0f0'
                    },
                    height: height,
                    margin: { l: 60, r: 20, t: 40, b: 40 },
                    plot_bgcolor: 'white',
                    annotations: [
                        {
                            x: 1, y: Math.max(...curveData.y) * 0.8,
                            text: 'Phase 1<br>Infant Mortality',
                            showarrow: false,
                            font: { size: 10 }
                        },
                        {
                            x: 12, y: Math.min(...curveData.y.slice(2, 20)) * 1.2,
                            text: 'Phase 2<br>Useful Life',
                            showarrow: false,
                            font: { size: 10 }
                        },
                        {
                            x: 26, y: Math.max(...curveData.y.slice(22)) * 0.8,
                            text: 'Phase 3<br>Wear-out',
                            showarrow: false,
                            font: { size: 10 }
                        }
                    ]
                }}
                config={{
                    displayModeBar: false,
                    responsive: true
                }}
            />
            <div style={{
                fontSize: '12px',
                color: '#666',
                textAlign: 'center',
                marginTop: '8px'
            }}>
                ⚠️ Simplified curve for parameter visualization only.
                Physics calculations occur during simulation.
            </div>
        </div>
    );
};

export default ThreePhaseWeibullVisualization;
```

#### 4. DistributionFieldV3 Integration
**File**: `/frontend/src/components/distributionFields/DistributionFieldV3.jsx` (modification)
```jsx
// Add import for custom visualization
import ThreePhaseWeibullVisualization from 'components/visualizations/ThreePhaseWeibullVisualization';

// Modify renderVisualization method (around line 594)
const renderVisualization = () => {
    if (!showVisualization) return null;

    // Handle custom visualization for failure_rate_weibull
    if (distributionType === 'failure_rate_weibull') {
        return (
            <div style={{ marginTop: 16 }}>
                <ThreePhaseWeibullVisualization
                    parameters={distributionValue.parameters || {}}
                    height={250}
                />
            </div>
        );
    }

    // Standard DistributionPlot for other types
    return (
        <div style={{ marginTop: 16 }}>
            <DistributionPlot
                distribution={distributionValue}
                // ... existing props
            />
        </div>
    );
};
```

## Backend Physics Engine Implementation

### **Architecture Overview**
The physics engine follows the same extensible pattern as `monte-carlo-v2/distributions/` but for complex multi-parameter physics models. It orchestrates dependencies internally and provides a clean API for physics-based calculations.

```
/backend/services/physics/
├── index.js                          ← Physics engine factory
├── physicsEngine.js                  ← Central orchestrator
├── models/
│   ├── physicsModelBase.js          ← Base class for all physics models
│   ├── threePhaseWeibull.js         ← Three-phase Weibull failure model
│   └── [future models]              ← Extensible for other physics models
└── utils/
    ├── loadFactorCalculations.js    ← Shared physics utilities
    └── continuityConstraints.js     ← Shared math functions
```

### 1. Physics Request Schema

**File**: `/schemas/yup/physicsRequest.js`
```javascript
const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');
const { CubeSourceDataSchema } = require('./cubeData'); // Assuming this exists

const PhysicsRequestSchema = Yup.object().shape({
  model: Yup.string().oneOf(['three-phase-weibull']).required(),

  components: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().required(),
      type: Yup.string().oneOf(['gearboxes', 'generators', 'blades', 'mainBearings']).required(),
      parameters: Yup.object().required() // Component-specific physics params
    })
  ).min(1).required(),

  // Loose inputs - validated by individual models
  inputs: Yup.object().required(),

  // Typed dependencies - handled uniformly by engine
  dependencies: Yup.object().shape({
    distributions: Yup.array().of(DistributionTypeSchema).optional(),
    sources: Yup.array().of(CubeSourceDataSchema).optional()
  }).optional(),

  settings: Yup.object().shape({
    iterations: Yup.number().min(1000).max(50000).default(10000),
    years: Yup.number().min(1).max(50).default(25),
    percentiles: Yup.array().of(Yup.number().min(1).max(99)).default([5, 25, 50, 75, 95]),
    seed: Yup.number().optional()
  })
});

module.exports = { PhysicsRequestSchema };
```

### 2. Physics API Routes

**File**: `/backend/routes/physicsRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const { validateMiddleware } = require('../utils/validate');
const { PhysicsRequestSchema } = require('../../schemas/yup/physicsRequest');
const {
    simulatePhysics,
    getPhysicsModels
} = require('../controllers/physicsController');

// POST /api/physics/simulate - Physics-based simulation
router.post('/simulate', validateMiddleware(PhysicsRequestSchema), simulatePhysics);

// GET /api/physics/models - Available physics models
router.get('/models', getPhysicsModels);

module.exports = router;
```

**File**: `/backend/routes/index.js` (modification)
```javascript
// Add physics routes
const physicsRoutes = require('./physicsRoutes');
app.use('/api/physics', physicsRoutes);
```

### 3. Physics Controller

**File**: `/backend/controllers/physicsController.js`
```javascript
const { createPhysicsEngine } = require('../services/physics');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

const simulatePhysics = async (req, res) => {
  try {
    // Request already validated by middleware
    const { model, components, inputs, dependencies = {}, settings = {} } = req.body;

    // Create and execute physics model
    const engine = createPhysicsEngine();
    const results = await engine.simulate(model, components, inputs, dependencies, settings);

    res.json(formatSuccess('Physics simulation completed', results));
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json(formatError('Invalid request format', error.errors));
    }
    res.status(500).json(formatError(error.message));
  }
};

const getPhysicsModels = async (req, res) => {
  try {
    const engine = createPhysicsEngine();
    const models = engine.getAvailableModels();

    res.json(formatSuccess('Available physics models', models));
  } catch (error) {
    res.status(500).json(formatError(error.message));
  }
};

module.exports = {
  simulatePhysics,
  getPhysicsModels
};
```

### 4. Physics Engine Core

**File**: `/backend/services/physics/index.js`
```javascript
const PhysicsEngine = require('./physicsEngine');
const ThreePhaseWeibullModel = require('./models/threePhaseWeibull');

const createPhysicsEngine = (settings = {}) => {
  const engine = new PhysicsEngine(settings);

  // Auto-register physics models (like distributions)
  engine.registerModel('three-phase-weibull', ThreePhaseWeibullModel);
  // Future: engine.registerModel('fatigue-lifecycle', FatigueLifeCycleModel);

  return engine;
};

module.exports = { createPhysicsEngine };
```

**File**: `/backend/services/physics/physicsEngine.js`
```javascript
const { createEngine } = require('../monte-carlo-v2');

class PhysicsEngine {
  constructor(settings) {
    this.settings = settings;
    this.models = new Map();
  }

  registerModel(name, modelClass) {
    this.models.set(name, modelClass);
  }

  async simulate(modelName, components, inputs, dependencies = {}, settings = {}) {
    const ModelClass = this.models.get(modelName);
    if (!ModelClass) {
      throw new Error(`Unknown physics model: ${modelName}`);
    }

    // Validate inputs against model requirements
    const validatedInputs = ModelClass.validateInputs(inputs);

    // Validate dependencies against model requirements
    ModelClass.validateDependencies(dependencies);

    // Pre-process dependencies uniformly
    const dependencyResults = await this.preprocessDependencies(dependencies, {
      ...this.settings,
      ...settings
    });

    // Execute model with clean, processed data
    const model = new ModelClass();
    return await model.execute(components, validatedInputs, dependencyResults, {
      ...this.settings,
      ...settings
    });
  }

  async preprocessDependencies(dependencies, settings) {
    const results = {};

    // Process distributions array through monte-carlo-v2
    if (dependencies.distributions && dependencies.distributions.length > 0) {
      const mcEngine = createEngine(settings);
      const mcResults = await mcEngine.simulate(dependencies.distributions);
      results.distributions = mcResults;
    }

    // Process sources array (CubeSourceDataSchema)
    if (dependencies.sources && dependencies.sources.length > 0) {
      results.sources = {};

      dependencies.sources.forEach(source => {
        // source is CubeSourceDataSchema with sourceId, data, etc.
        results.sources[source.sourceId] = this.processCubeSource(source, settings);
      });
    }

    return results;
  }

  processCubeSource(cubeSource, settings) {
    // cubeSource is CubeSourceDataSchema
    // Convert to per-iteration format for physics models
    const processed = {};

    for (let iteration = 1; iteration <= settings.iterations; iteration++) {
      // Sample from cube source data
      if (cubeSource.data && cubeSource.data.length > 0) {
        const randomIndex = Math.floor(Math.random() * cubeSource.data.length);
        processed[iteration] = cubeSource.data[randomIndex].value;
      } else {
        processed[iteration] = 0;
      }
    }

    return processed;
  }

  getAvailableModels() {
    const models = {};
    for (const [name, ModelClass] of this.models) {
      models[name] = ModelClass.getMetadata();
    }
    return models;
  }
}

module.exports = PhysicsEngine;
```

### 5. Physics Model Base Class

**File**: `/backend/services/physics/models/physicsModelBase.js`
```javascript
class PhysicsModelBase {
  static getMetadata() {
    throw new Error('getMetadata() must be implemented by physics model');
  }

  static getInputRequirements() {
    throw new Error('getInputRequirements() must be implemented by physics model');
  }

  static getDependencyRequirements() {
    return {
      distributions: [], // List of required distribution indices or names
      sources: []        // List of required source sourceIds
    };
  }

  static validateInputs(inputs) {
    const requirements = this.getInputRequirements();

    // Check for required fields
    for (const field of requirements.required || []) {
      if (!inputs[field]) {
        throw new Error(`Missing required input: ${field}`);
      }
    }

    // Validate field types/values if specified
    if (requirements.schema) {
      return requirements.schema.validate(inputs);
    }

    return inputs;
  }

  static validateDependencies(dependencies) {
    const requirements = this.getDependencyRequirements();

    // Check required distributions count
    if (requirements.distributions.length > 0) {
      if (!dependencies.distributions || dependencies.distributions.length < requirements.distributions.length) {
        throw new Error(`Requires ${requirements.distributions.length} distributions`);
      }
    }

    // Check required sources
    for (const sourceId of requirements.sources) {
      const hasSource = dependencies.sources?.some(source => source.sourceId === sourceId);
      if (!hasSource) {
        throw new Error(`Missing required source: ${sourceId}`);
      }
    }

    return true;
  }

  async execute(components, inputs, dependencyResults, settings) {
    throw new Error('execute() must be implemented by physics model');
  }
}

module.exports = PhysicsModelBase;
```

### 6. Three-Phase Weibull Model Implementation

**File**: `/backend/services/physics/models/threePhaseWeibull.js`
```javascript
const Yup = require('yup');
const PhysicsModelBase = require('./physicsModelBase');

class ThreePhaseWeibullModel extends PhysicsModelBase {
  static getMetadata() {
    return {
      name: 'Three-Phase Weibull Component Failure',
      description: 'Physics-based failure modeling with infant mortality, useful life, and wear-out phases',
      supportedComponents: ['gearboxes', 'generators', 'blades', 'mainBearings'],
      outputFormat: 'SimResultsSchema[]'
    };
  }

  static getInputRequirements() {
    return {
      required: ['siteConditions', 'turbineSpecs'],
      schema: Yup.object().shape({
        siteConditions: Yup.object().shape({
          windShearExponent: Yup.number().required(),
          airDensity: Yup.number().required(),
          salinityLevel: Yup.string().oneOf(['low', 'moderate', 'high', 'marine']).required(),
          startStopCyclesPerYear: Yup.number().default(200)
        }).required(),

        turbineSpecs: Yup.object().shape({
          iecClass: Yup.string().oneOf(['IA', 'IB', 'IIA', 'IIB']).required(),
          designLifeYears: Yup.number().oneOf([20, 25, 30]).required(),
          ratedPowerMW: Yup.number().required()
        }).required(),

        // Optional calibration data
        calibration: Yup.object().shape({
          operationalYears: Yup.number().nullable(),
          observedFailures: Yup.array().of(Yup.number()).default([]),
          fleetBaselineRate: Yup.number().nullable()
        }).optional()
      })
    };
  }

  static getDependencyRequirements() {
    return {
      distributions: [
        { index: 0, name: 'windVariability' },
        { index: 1, name: 'temperatureRange' },
        { index: 2, name: 'turbulenceIntensity' }
      ],
      sources: [] // Optional: ['historicalFailures', 'downtimeEvents']
    };
  }

  async execute(components, inputs, dependencyResults, settings) {
    // Inputs are already validated by engine
    // dependencyResults contains processed distribution and source data

    const results = {};

    for (const component of components) {
      results[component.id] = await this.calculateComponentFailures(
        component,
        inputs,
        dependencyResults,
        settings
      );
    }

    return results;
  }

  async calculateComponentFailures(component, inputs, dependencyResults, settings) {
    const results = {};

    for (let iteration = 1; iteration <= settings.iterations; iteration++) {
      // Extract dependency values for this iteration - clean, pre-processed
      const physicsInputs = {
        windSpeed: dependencyResults.distributions[0][iteration],
        tempRange: dependencyResults.distributions[1][iteration],
        turbulence: dependencyResults.distributions[2][iteration]
      };

      // If we have sources, extract those too
      if (dependencyResults.sources?.['historicalFailures']) {
        physicsInputs.historicalData = dependencyResults.sources['historicalFailures'][iteration];
      }

      // Calculate load factors using clean inputs
      const loadFactors = this.calculateLoadFactors({
        ...physicsInputs,
        component,
        siteConditions: inputs.siteConditions,
        turbineSpecs: inputs.turbineSpecs,
        calibration: inputs.calibration
      });

      // Generate three-phase Weibull parameters
      const phases = this.calculateThreePhaseParameters(loadFactors, component.parameters);

      // Calculate annual failure rates
      const annualRates = {};
      for (let year = 1; year <= settings.years; year++) {
        annualRates[year] = this.sampleThreePhaseWeibull(phases, year, iteration, year);
      }

      // Store iteration results
      Object.keys(annualRates).forEach(year => {
        if (!results[year]) results[year] = [];
        results[year].push(annualRates[year]);
      });
    }

    return this.processResultsToSchema(results, settings.percentiles);
  }

  calculateLoadFactors({ windSpeed, tempRange, turbulence, component, siteConditions, turbineSpecs, calibration }) {
    // Implement PRD Section 3 physics calculations
    const baseFactors = {
      wind: Math.pow(windSpeed / 8.5, 2),
      thermal: Math.pow(tempRange / 60, 2),
      turbulence: Math.pow(turbulence / 0.16, 3)
    };

    // Component-specific adjustments
    const componentFactors = this.getComponentSpecificFactors(component, siteConditions, turbineSpecs);

    return {
      ...baseFactors,
      ...componentFactors,
      combined: baseFactors.wind * baseFactors.thermal * baseFactors.turbulence * componentFactors.component
    };
  }

  getComponentSpecificFactors(component, siteConditions, turbineSpecs) {
    // Component-specific physics from PRD Section 4
    switch (component.type) {
      case 'gearboxes':
        return {
          component: this.calculateGearboxFactors(component.parameters, siteConditions),
          bearingLife: component.parameters.bearingL10Hours / 175000,
          stageMultiplier: 1 + 0.2 * (component.parameters.gearStages - 1)
        };

      case 'generators':
        return {
          component: this.calculateGeneratorFactors(component.parameters, siteConditions),
          thermalLimit: Math.pow(70 / component.parameters.maxOperatingTemp, 3),
          coolingFactor: component.parameters.coolingMethod === 'liquid' ? 0.8 : 1.0
        };

      case 'blades':
        return {
          component: this.calculateBladeFactors(component.parameters, siteConditions),
          fatigueFactor: component.parameters.fatigueLimitMPa / 100,
          surfaceFactor: component.parameters.surfaceTreatment === 'premium' ? 0.7 : 1.0
        };

      default:
        return { component: 1.0 };
    }
  }

  calculateThreePhaseParameters(loadFactors, componentParams) {
    // Apply load factors to base Weibull parameters with continuity constraints
    const baseFailureRate = 0.02; // 2% annual base rate
    const adjustedRate = baseFailureRate * loadFactors.combined;

    // Calculate three-phase parameters following PRD Section 5 methodology
    return {
      phase1: {
        shape: 0.6, // Fixed infant mortality shape
        scale: this.solveForContinuity(0.6, adjustedRate * 0.5, 2) // Lower rate in early years
      },
      phase2: {
        shape: 1.0, // Exponential (constant hazard)
        scale: 1 / adjustedRate
      },
      phase3: {
        shape: 3.0, // Fixed wear-out shape
        scale: this.solveForWearOut(3.0, adjustedRate * 2.5, 25) // Higher rate in later years
      }
    };
  }

  sampleThreePhaseWeibull(phases, year, iteration, yearInPhase) {
    // Determine current phase based on year and component lifecycle
    let currentPhase;
    if (year <= 2) {
      currentPhase = phases.phase1;
    } else if (year <= 22) {
      currentPhase = phases.phase2;
    } else {
      currentPhase = phases.phase3;
    }

    // Generate deterministic random for this specific iteration/year
    const random = this.getSeededRandom(iteration, year);

    // Weibull inverse transform sampling
    const { shape, scale } = currentPhase;
    return scale * Math.pow(-Math.log(1 - random), 1 / shape);
  }

  getSeededRandom(iteration, year) {
    // Deterministic random based on iteration and year
    const seedValue = `${iteration}-${year}`;
    let hash = 0;
    for (let i = 0; i < seedValue.length; i++) {
      const char = seedValue.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / Math.pow(2, 31);
  }

  processResultsToSchema(results, percentiles) {
    // Convert to SimResultsSchema format with percentiles
    const processedYears = {};

    Object.keys(results).forEach(year => {
      const yearValues = results[year].sort((a, b) => a - b);

      processedYears[year] = {
        values: yearValues,
        percentiles: percentiles.reduce((acc, p) => {
          const index = Math.floor((p / 100) * yearValues.length);
          acc[p] = yearValues[index];
          return acc;
        }, {}),
        mean: yearValues.reduce((sum, v) => sum + v, 0) / yearValues.length,
        stdDev: this.calculateStdDev(yearValues)
      };
    });

    return {
      type: 'failure_rate_weibull',
      years: processedYears,
      metadata: {
        physicsEnabled: true,
        model: 'three-phase-weibull'
      }
    };
  }

  calculateStdDev(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
}

module.exports = ThreePhaseWeibullModel;
```

### 7. Frontend Integration

The frontend `failure_rate_weibull` distribution calls the physics API with structured inputs:

```javascript
// Frontend physics request structure
const physicsRequest = {
  model: 'three-phase-weibull',

  components: [
    {
      id: 'gearbox_1',
      type: 'gearboxes',
      parameters: {
        bearingL10Hours: 175000,
        gearStages: 3,
        bearingCount: 8
      }
    }
  ],

  inputs: {
    siteConditions: {
      windShearExponent: 0.14,
      airDensity: 1.225,
      salinityLevel: 'moderate',
      startStopCyclesPerYear: 200
    },
    turbineSpecs: {
      iecClass: 'IIA',
      designLifeYears: 25,
      ratedPowerMW: 5.0
    }
  },

  dependencies: {
    // Array of DistributionTypeSchema
    distributions: [
      getValueByPath(['settings', 'project', 'environment', 'weather', 'windVariability']),
      getValueByPath(['settings', 'project', 'environment', 'weather', 'temperatureRange']),
      getValueByPath(['settings', 'project', 'environment', 'siteConditions', 'turbulenceIntensity'])
    ],

    // Array of CubeSourceDataSchema (optional)
    sources: [
      getCubeData({ sourceId: 'component_failures', percentile: 50 }),
      getCubeData({ sourceId: 'downtime_events', percentile: 75 })
    ]
  },

  settings: {
    iterations: 10000,
    years: 25,
    percentiles: [5, 25, 50, 75, 95]
  }
};
```

## Schema Definitions

### 1. Physics Simulation Request Schema
**File**: `/schemas/yup/physicsSimulation.js`
```javascript
const Yup = require('yup');
const { DistributionTypeSchema } = require('./distribution');

const PhysicsSimRequestSchema = Yup.object().shape({
    distributions: Yup.array()
        .of(Yup.object().shape({
            id: Yup.string().required(),
            type: Yup.string().oneOf(['failure_rate_weibull']).required(),
            parameters: Yup.object().required()
        }))
        .min(1, 'At least one distribution is required'),

    dependencies: Yup.array()
        .of(DistributionTypeSchema)
        .min(1, 'Physics simulation requires dependency distributions'),

    settings: Yup.object().shape({
        iterations: Yup.number().integer().min(1000).max(50000).default(10000),
        years: Yup.number().integer().min(1).max(50).default(25),
        seed: Yup.number().nullable(),
        percentiles: Yup.array().of(Yup.number().min(1).max(99)).default([5, 25, 50, 75, 95])
    })
});

module.exports = {
    PhysicsSimRequestSchema
};
```

### 2. Extended Distribution Schema
**File**: `/schemas/yup/distribution.js` (modification)
```javascript
const DistributionTypeSchema = Yup.object().shape({
    type: Yup.string().oneOf([
        'normal', 'lognormal', 'weibull', 'exponential', 'triangular',
        'uniform', 'poisson', 'gamma', 'fixed', 'kaimal', 'gbm',
        'failure_rate_weibull' // NEW physics-based distribution
    ]).required(),

    parameters: Yup.object().when('type', {
        is: 'failure_rate_weibull',
        then: Yup.object().shape({
            phase1: Yup.object().shape({
                shape: Yup.number().positive().required(),
                scale: Yup.number().positive().required()
            }).required(),
            phase2: Yup.object().shape({
                shape: Yup.number().positive().required(),
                scale: Yup.number().positive().required()
            }).required(),
            phase3: Yup.object().shape({
                shape: Yup.number().positive().required(),
                scale: Yup.number().positive().required()
            }).required(),
            phaseContinuityTolerance: Yup.number().min(0.01).max(0.2).default(0.05),
            wearOutMultiplier: Yup.number().min(1.5).max(5.0).default(2.5),
            physicsInputPaths: Yup.object().shape({
                windSpeed: Yup.string().default('settings.modules.revenue.windVariability'),
                temperatureRange: Yup.string().default('settings.project.environment.weather.temperatureRange'),
                turbulenceIntensity: Yup.string().default('settings.modules.revenue.turbulenceIntensity')
            }),
            componentPhysics: Yup.object().nullable() // Component-specific parameters
        }),
        // ... existing parameter schemas for other distribution types
    }),

    // ... rest of existing schema
});
```

## File Structure Changes

### New Files to Create
```
/docs/
├── implementation-guide-three-phase-weibull.md      ← This file

/frontend/src/
├── utils/distributions/
│   └── failureRateWeibull.js                        ← New distribution implementation
├── components/visualizations/
│   └── ThreePhaseWeibullVisualization.jsx           ← Custom bathtub curve visualization
├── pages/scenario/environment/
│   ├── SiteConditions.jsx                           ← New site conditions page
│   └── Weather.jsx                                  ← Moved from economics
└── pages/scenario/equipment/
    └── Specifications.jsx                           ← New component specs page

/backend/
├── routes/
│   └── physicsRoutes.js                             ← New physics simulation API
├── controllers/
│   └── physicsController.js                         ← Physics simulation controller
├── services/physics-monte-carlo/
│   ├── index.js                                     ← Physics engine factory
│   ├── physicsEngine.js                             ← Physics-aware Monte Carlo engine
│   └── distributions/
│       └── failureRateWeibull.js                    ← Backend physics distribution

/schemas/yup/
├── physicsSimulation.js                             ← Physics API request schema
└── distribution.js                                  ← Extended with failure_rate_weibull
```

### Files to Modify
```
/frontend/src/
├── utils/distributions/index.js                     ← Register new distribution
├── components/distributionFields/DistributionFieldV3.jsx ← Custom visualization support
├── components/layout/Navigation.jsx                 ← Add Environment section
└── pages/scenario/equipment/FailureRates.jsx        ← Enhanced with physics distributions

/backend/
├── routes/index.js                                  ← Mount physics routes
└── app.js                                          ← (No changes needed)

/schemas/yup/
├── scenario.js                                      ← Extended environment section
├── windFarm.js                                      ← Added turbine specs
└── componentFailureRates.js                        ← Added physicsParameters
```

## UI Reference Updates for Legacy Parameters

### 🎯 SIMPLIFIED: UI Component Reference Updates Only

No database migrations needed - we just need to update React component path references to prevent broken UI during development.

#### **Parameter Reference Updates Required**

| Parameter | Current ContextField Path | New UI Location | Action Required |
|-----------|---------------------------|-----------------|-----------------|
| **windVariability** | `settings.modules.revenue.windVariability` | Environment/Weather | Move ContextField to new page |
| **turbulenceIntensity** | `settings.modules.revenue.turbulenceIntensity` | Environment/Site Conditions | Move ContextField to new page |
| **surfaceRoughness** | `settings.modules.revenue.surfaceRoughness` | Environment/Site Conditions | Move ContextField to new page |
| **kaimalScale** | `settings.modules.revenue.kaimalScale` | Environment/Site Conditions | Move ContextField to new page |

### **UI Component Updates**

#### **Step 1: Remove from Revenue.jsx**
**File**: `/frontend/src/pages/scenario/economics/Revenue.jsx`

Find and remove these ContextField components:
```jsx
// Remove these from Revenue page
<ContextField path="settings.modules.revenue.windVariability" component={DistributionFieldV3} />
<ContextField path="settings.modules.revenue.turbulenceIntensity" component={InputNumber} />
<ContextField path="settings.modules.revenue.surfaceRoughness" component={InputNumber} />
<ContextField path="settings.modules.revenue.kaimalScale" component={InputNumber} />
```

#### **Step 2: Add to New Environment Pages**

**File**: `/frontend/src/pages/scenario/environment/Weather.jsx` (NEW FILE)
```jsx
// Add windVariability with updated path
<ContextField
  path="settings.project.environment.weather.windVariability"
  component={DistributionFieldV3}
  valueName="Wind Variability"
  showVisualization={true}
/>
```

**File**: `/frontend/src/pages/scenario/environment/SiteConditions.jsx` (NEW FILE)
```jsx
// Add these fields with updated paths
<ContextField
  path="settings.project.environment.siteConditions.turbulenceIntensity"
  component={InputNumber}
  label="Turbulence Intensity"
/>

<ContextField
  path="settings.project.environment.siteConditions.surfaceRoughness"
  component={InputNumber}
  label="Surface Roughness"
/>

<ContextField
  path="settings.project.environment.siteConditions.kaimalScale"
  component={InputNumber}
  label="Kaimal Scale"
/>
```

### **Navigation Update**

**File**: `/frontend/src/components/layout/Navigation.jsx`
```jsx
// Add Environment section
{
  key: 'environment',
  label: 'Environment',
  children: [
    { key: 'site-conditions', label: 'Site Conditions' },
    { key: 'weather', label: 'Weather' }
  ]
},
```

### **Search Commands for UI References**

Find frontend component references only:
```bash
# Find ContextField references in frontend components
grep -r "settings\.modules\.revenue\.windVariability" frontend/src/
grep -r "settings\.modules\.revenue\.turbulenceIntensity" frontend/src/
grep -r "settings\.modules\.revenue\.surfaceRoughness" frontend/src/
grep -r "settings\.modules\.revenue\.kaimalScale" frontend/src/
```

### **Development Strategy**

1. **Create new Environment pages** with updated paths
2. **Add navigation** to new pages
3. **Remove old ContextFields** from Revenue page
4. **Update schemas** to support new paths

Simple path reference updates - no data migration needed.

## Implementation Phases (Simplified)

### Phase 1: UI Structure & Basic Distribution (Week 1-2)
1. **New UI Pages**: Create Environment/Weather and Environment/Site Conditions pages
2. **Navigation Update**: Add Environment section to navigation
3. **Move ContextFields**: Move parameter fields from Revenue to new Environment pages (keeping existing paths)
4. **Basic Distribution**: Create `failure_rate_weibull` with simple visualization
5. **Registration**: Integrate new distribution with DistributionFieldV3

### Phase 2: Physics Backend (Week 3-4)
1. **Physics API**: Create `/api/physics/simulate` route and controller
2. **Physics Engine**: Build dependency-aware Monte Carlo engine
3. **Load Calculations**: Implement PRD physics formulas in backend distribution
4. **Integration Testing**: Verify API works with complex parameter dependencies

### Phase 3: UI Enhancement (Week 5-6)
1. **Equipment Specifications Page**: Create component-specific physics parameter forms
2. **Custom Visualization**: Implement three-phase bathtub curve display
3. **Enhanced Failure Rates**: Update existing failure rates page with physics integration
4. **Parameter Organization**: Add new physics parameters to appropriate UI sections

### Phase 4: Production Readiness (Week 7-8)
1. **Performance Optimization**: Cache calculations and optimize physics formulas
2. **Error Handling**: Comprehensive validation and user-friendly error messages
3. **Path Updates**: Optionally update ContextField paths to new schema locations
4. **Documentation**: Update user guides reflecting new parameter locations
5. **Testing**: Unit tests, integration tests, and functionality validation

## Fast/Simple Curve Interpretation for DistributionPlot

### Visualization Strategy
For the `failure_rate_weibull` distribution, we use a **custom three-phase bathtub curve** instead of standard PDF/CDF plots:

#### Key Features:
- **Phase Annotations**: Clear labels for Infant Mortality, Useful Life, and Wear-out phases
- **Simplified Calculation**: Uses basic Weibull hazard function with phase parameters for visualization only
- **Warning Message**: Clear indication that this is for parameter visualization, not actual simulation
- **Interactive Elements**: Hover tooltips showing phase parameters and transitions
- **Responsive Design**: Works on all screen sizes with appropriate scaling

#### Implementation Details:
- **No API Calls**: All visualization calculations done client-side using simple formulas
- **Real-time Updates**: Curve updates immediately as parameters change
- **Minimal Performance Impact**: Lightweight calculations suitable for real-time preview
- **Educational Value**: Helps users understand three-phase lifecycle concept

### Curve Calculation Logic:
```javascript
// Simplified hazard rate calculation (visualization only)
const hazardRate = (t, shape, scale) => (shape / scale) * Math.pow(t / scale, shape - 1);

// Three-phase assembly
const phases = [
    { years: [0, 2], params: phase1, label: 'Infant Mortality' },
    { years: [2, 22], params: phase2, label: 'Useful Life' },
    { years: [22, 30], params: phase3, label: 'Wear-out' }
];
```

This approach provides immediate visual feedback while keeping the complex physics calculations in the backend where they belong.

---

## Summary

This implementation guide provides a comprehensive roadmap for integrating the physics-based three-phase Weibull component failure model into the Wind Finance Simulator. The approach leverages existing architectural patterns while adding sophisticated reliability modeling capabilities.

**Key Benefits:**
- **Maintains Architecture**: Builds on proven DistributionFieldV3 and ContextField patterns
- **Performance Optimized**: Dependency calculations shared across components
- **User-Friendly**: Progressive enhancement with clear parameter organization
- **Scientifically Accurate**: Implements full PRD physics while keeping UI approachable
- **Production Ready**: Comprehensive error handling, validation, and testing strategy

The implementation can proceed incrementally, allowing for validation and refinement at each phase while maintaining full backward compatibility with existing functionality.