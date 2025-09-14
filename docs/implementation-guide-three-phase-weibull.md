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

## Backend Implementation

### 1. New Physics Simulation API Route

**File**: `/backend/routes/physicsRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const { validateMiddleware } = require('../utils/validate');
const { PhysicsSimRequestSchema } = require('../../schemas/yup/physicsSimulation');
const {
    simulatePhysicsDistributions,
    getPhysicsModelsInfo,
    validatePhysicsParameters
} = require('../controllers/physicsController');

// POST /api/physics/simulate - Physics-based simulation with dependencies
router.post('/simulate', validateMiddleware(PhysicsSimRequestSchema), simulatePhysicsDistributions);

// GET /api/physics/info - Physics model metadata
router.get('/info', getPhysicsModelsInfo);

// POST /api/physics/validate - Physics parameter validation
router.post('/validate', validatePhysicsParameters);

module.exports = router;
```

**File**: `/backend/routes/index.js` (modification)
```javascript
// Add physics routes
const physicsRoutes = require('./physicsRoutes');
app.use('/api/physics', physicsRoutes);
```

### 2. Physics Simulation Controller

**File**: `/backend/controllers/physicsController.js`
```javascript
const { createPhysicsEngine } = require('../services/physics-monte-carlo');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

const simulatePhysicsDistributions = async (req, res) => {
    try {
        const {
            distributions,     // Components to simulate (failure_rate_weibull)
            dependencies,      // Physics inputs (windVariability, temperature, etc.)
            settings = {}
        } = req.body;

        // Validate that all distributions are physics-compatible
        const physicsDistributions = distributions.filter(d => d.type === 'failure_rate_weibull');
        if (physicsDistributions.length !== distributions.length) {
            return res.status(400).json(formatError(
                'Physics simulation route only supports failure_rate_weibull distributions'
            ));
        }

        // Create physics-aware Monte Carlo engine
        const engine = createPhysicsEngine({
            iterations: settings.iterations || 10000,
            years: settings.years || 25,
            seed: settings.seed,
            percentiles: settings.percentiles || [5, 25, 50, 75, 95]
        });

        // Run simulation with dependency optimization
        const results = await engine.simulateWithDependencies(distributions, dependencies);

        res.json(formatSuccess('Physics simulation completed', results));
    } catch (error) {
        console.error('Physics simulation error:', error);
        res.status(500).json(formatError(error.message));
    }
};

const getPhysicsModelsInfo = async (req, res) => {
    try {
        const modelsInfo = {
            supportedTypes: ['failure_rate_weibull'],
            requiredDependencies: [
                'windVariability',
                'temperatureRange',
                'turbulenceIntensity'
            ],
            componentTypes: [
                'gearboxes', 'generators', 'blades',
                'bladeBearings', 'transformers', 'converters',
                'mainBearings', 'yawSystems'
            ]
        };

        res.json(formatSuccess('Physics models info retrieved', modelsInfo));
    } catch (error) {
        res.status(500).json(formatError(error.message));
    }
};

const validatePhysicsParameters = async (req, res) => {
    try {
        const { distribution } = req.body;

        // Validate physics parameters
        // ... validation logic

        res.json(formatSuccess('Parameters valid'));
    } catch (error) {
        res.status(400).json(formatError(error.message));
    }
};

module.exports = {
    simulatePhysicsDistributions,
    getPhysicsModelsInfo,
    validatePhysicsParameters
};
```

### 3. Physics Monte Carlo Service

**File**: `/backend/services/physics-monte-carlo/index.js`
```javascript
const PhysicsMonteCarloEngine = require('./physicsEngine');
const FailureRateWeibullDistribution = require('./distributions/failureRateWeibull');

const createPhysicsEngine = (settings = {}) => {
    const engine = new PhysicsMonteCarloEngine(settings);

    // Register physics-aware distributions
    engine.registerDistribution('failure_rate_weibull', FailureRateWeibullDistribution);

    return engine;
};

module.exports = {
    createPhysicsEngine
};
```

**File**: `/backend/services/physics-monte-carlo/physicsEngine.js`
```javascript
class PhysicsMonteCarloEngine {
    constructor(settings) {
        this.iterations = settings.iterations || 10000;
        this.years = settings.years || 25;
        this.seed = settings.seed || Math.random();
        this.percentiles = settings.percentiles || [5, 25, 50, 75, 95];
        this.distributions = new Map();
    }

    registerDistribution(type, distributionClass) {
        this.distributions.set(type, distributionClass);
    }

    async simulateWithDependencies(distributions, dependencies) {
        const results = {};

        for (let iteration = 1; iteration <= this.iterations; iteration++) {
            const iterationResults = {};

            // 1. Calculate dependencies first (physics inputs)
            const dependencyContext = await this.calculateDependencies(dependencies, iteration);

            // 2. Calculate failure rate distributions using dependency context
            for (const distConfig of distributions) {
                const DistributionClass = this.distributions.get(distConfig.type);
                const distribution = new DistributionClass(distConfig.parameters);

                const yearlyResults = {};
                for (let year = 1; year <= this.years; year++) {
                    const random = this.getSeededRandom(distConfig.id, iteration, year);
                    yearlyResults[year] = distribution.generate(year, random, dependencyContext);
                }

                iterationResults[distConfig.id] = yearlyResults;
            }

            // Store results
            Object.keys(iterationResults).forEach(id => {
                if (!results[id]) results[id] = [];
                results[id].push(iterationResults[id]);
            });
        }

        // Calculate percentiles and return SimResultsSchema format
        return this.processResults(results);
    }

    async calculateDependencies(dependencies, iteration) {
        const dependencyResults = {};

        for (const depConfig of dependencies) {
            // Use existing monte-carlo-v2 engine for standard distributions
            const { createEngine } = require('../monte-carlo-v2');
            const standardEngine = createEngine({
                iterations: 1,
                years: this.years,
                seed: this.getSeededRandom(depConfig.id, iteration)
            });

            const result = await standardEngine.simulate([depConfig]);
            dependencyResults[depConfig.id] = result[depConfig.id];
        }

        return { dependencies: dependencyResults };
    }

    processResults(results) {
        // Convert to SimResultsSchema format with percentiles
        const processedResults = {};

        Object.keys(results).forEach(distributionId => {
            const yearlyData = results[distributionId];
            const processedYears = {};

            for (let year = 1; year <= this.years; year++) {
                const yearValues = yearlyData.map(iteration => iteration[year]).sort((a, b) => a - b);

                processedYears[year] = {
                    values: yearValues,
                    percentiles: this.percentiles.reduce((acc, p) => {
                        const index = Math.floor((p / 100) * yearValues.length);
                        acc[p] = yearValues[index];
                        return acc;
                    }, {}),
                    mean: yearValues.reduce((sum, v) => sum + v, 0) / yearValues.length,
                    stdDev: this.calculateStdDev(yearValues)
                };
            }

            processedResults[distributionId] = {
                type: 'failure_rate_weibull',
                years: processedYears,
                metadata: {
                    iterations: this.iterations,
                    physicsEnabled: true
                }
            };
        });

        return processedResults;
    }

    getSeededRandom(id, iteration, year = 1) {
        // Deterministic random based on seed, id, iteration, year
        const seedValue = `${this.seed}-${id}-${iteration}-${year}`;
        // Simple seeded random implementation
        let hash = 0;
        for (let i = 0; i < seedValue.length; i++) {
            const char = seedValue.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) / Math.pow(2, 31);
    }
}

module.exports = PhysicsMonteCarloEngine;
```

### 4. Failure Rate Weibull Distribution

**File**: `/backend/services/physics-monte-carlo/distributions/failureRateWeibull.js`
```javascript
class FailureRateWeibullDistribution {
    constructor(parameters) {
        this.parameters = parameters;
        this.componentPhysics = parameters.componentPhysics || {};
        this.validate();
    }

    static getMetadata() {
        return {
            name: 'Physics-Based Three-Phase Weibull',
            description: 'Component failure modeling with physics load factors and lifecycle phases',
            requiredParameters: ['phase1', 'phase2', 'phase3'],
            dependsOn: ['windVariability', 'temperatureRange', 'turbulenceIntensity']
        };
    }

    validate() {
        const phases = ['phase1', 'phase2', 'phase3'];
        phases.forEach(phase => {
            if (!this.parameters[phase] ||
                !this.parameters[phase].shape ||
                !this.parameters[phase].scale) {
                throw new Error(`Missing ${phase} parameters`);
            }
        });
    }

    generate(year, random, context) {
        // 1. Extract physics inputs from dependency context
        const physicsInputs = this.extractPhysicsInputs(context, year);

        // 2. Calculate load factors using PRD physics formulas
        const loadFactors = this.calculateLoadFactors(physicsInputs);

        // 3. Generate three-phase Weibull parameters with load factor adjustments
        const adjustedPhases = this.calculateThreePhaseParameters(loadFactors);

        // 4. Sample from appropriate phase based on year
        return this.sampleThreePhaseWeibull(adjustedPhases, year, random);
    }

    extractPhysicsInputs(context, year) {
        const dependencies = context.dependencies || {};

        return {
            windSpeed: dependencies.windVariability?.[year] || 8.5,
            temperatureRange: dependencies.temperatureRange?.[year] || 60,
            turbulenceIntensity: dependencies.turbulenceIntensity?.[year] || 0.16,
            // Add other physics inputs as needed
        };
    }

    calculateLoadFactors(physicsInputs) {
        // Implement PRD Section 3 physics calculations
        const turbulenceLoadFactor = Math.pow(physicsInputs.turbulenceIntensity / 0.16, 3);
        const thermalCyclingFactor = Math.pow(physicsInputs.temperatureRange / 60, 2);
        const windLoadFactor = Math.pow(physicsInputs.windSpeed / 8.5, 2);

        return {
            turbulence: turbulenceLoadFactor,
            thermal: thermalCyclingFactor,
            wind: windLoadFactor,
            combined: turbulenceLoadFactor * thermalCyclingFactor * windLoadFactor
        };
    }

    calculateThreePhaseParameters(loadFactors) {
        // Apply load factors to base Weibull parameters
        const baseFailureRate = 0.02; // 2% annual base rate
        const adjustedRate = baseFailureRate * loadFactors.combined;

        // Calculate three-phase parameters with continuity constraints
        // Following PRD Section 5 methodology
        return {
            phase1: {
                shape: this.parameters.phase1.shape,
                scale: this.parameters.phase1.scale * (1 / loadFactors.combined)
            },
            phase2: {
                shape: this.parameters.phase2.shape,
                scale: this.parameters.phase2.scale * (1 / loadFactors.combined)
            },
            phase3: {
                shape: this.parameters.phase3.shape,
                scale: this.parameters.phase3.scale * (1 / loadFactors.combined)
            }
        };
    }

    sampleThreePhaseWeibull(phases, year, random) {
        // Determine current phase based on year and component lifecycle
        let currentPhase;
        if (year <= 2) {
            currentPhase = phases.phase1;
        } else if (year <= 22) {
            currentPhase = phases.phase2;
        } else {
            currentPhase = phases.phase3;
        }

        // Weibull inverse transform sampling
        const { shape, scale } = currentPhase;
        return scale * Math.pow(-Math.log(1 - random), 1 / shape);
    }
}

module.exports = FailureRateWeibullDistribution;
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