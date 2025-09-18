# Data Model: Physics Engine for Three-Phase Weibull Component Failure Modeling

## Core Entities

### PhysicsModel
**Purpose**: Represents a specific failure modeling approach with validation and execution capabilities
**Fields**:
- `modelType`: String (e.g., "three-phase-weibull") - Primary identifier
- `version`: String - Model version for compatibility tracking
- `metadata`: Object - Documentation, formulas, references
- `inputSchema`: Object - Yup validation schema for input parameters
- `outputSchema`: Object - Expected response structure

**Validation Rules**:
- modelType must be registered in physics model registry
- version must follow semver format
- inputSchema must be valid Yup schema
- metadata must include scientific references

**State Transitions**: Immutable - models are versioned, not modified

### EnvironmentalParameters
**Purpose**: Site conditions that affect component loading and failure rates
**Fields**:
- `siteId`: String - Reference to wind farm site
- `windVariability`: Distribution - Mean wind speed distribution
- `turbulenceIntensity`: Distribution - Turbulence intensity factor
- `temperatureRange`: Number - Design temperature range (°C)
- `dailyTempSwing`: Number - Daily temperature variation (°C)
- `relativeHumidity`: Number - Relative humidity (0-1)
- `salinityLevel`: Enum ['low', 'moderate', 'high', 'marine']
- `windShearExponent`: Number - Wind profile shear coefficient
- `surfaceRoughness`: Number - Site surface roughness (m)
- `airDensity`: Number - Air density (kg/m³)
- `kaimalScale`: Number - Kaimal turbulence scale parameter

**Validation Rules**:
- turbulenceIntensity between 0.05 and 0.30
- temperatureRange between 20°C and 80°C
- dailyTempSwing between 5°C and 30°C
- relativeHumidity between 0.3 and 1.0
- windShearExponent between 0.05 and 0.40
- All numeric values must be positive

**Relationships**:
- Belongs to WindFarmSite (one-to-one)
- Used by LoadFactor calculations (one-to-many)

### ComponentSpecifications
**Purpose**: Physical and operational characteristics of wind turbine components
**Fields**:
- `componentId`: String - Unique component identifier
- `componentType`: Enum ['gearbox', 'generator', 'blades', 'main-bearing', 'power-electronics']
- `physicsParameters`: Object - Component-specific physics parameters
- `designLife`: Number - Design life in years
- `ratedConditions`: Object - Rated operational conditions

**Component-Specific Physics Parameters**:

**Gearbox**:
- `bearingL10Hours`: Number - L10 bearing life rating (hours)
- `gearStages`: Number - Number of gear stages
- `bearingCount`: Number - Total bearing count
- `oilTempMax`: Number - Maximum oil temperature (°C)
- `torqueRating`: Number - Torque rating (kNm)

**Generator**:
- `insulationClass`: Enum ['B', 'F', 'H'] - Insulation temperature class
- `coolingMethod`: Enum ['air', 'liquid', 'hybrid'] - Cooling system type
- `bearingL10Hours`: Number - Bearing life rating
- `windingResistance`: Number - Winding resistance (ohms)

**Blades**:
- `fatigueLimitMPa`: Number - Material fatigue limit (MPa)
- `surfaceTreatment`: Enum ['standard', 'enhanced', 'anti-erosion'] - Surface coating
- `materialType`: Enum ['GFRP', 'CFRP'] - Composite material type
- `bladeLength`: Number - Blade length (m)

**Validation Rules**:
- Component type must have corresponding physics parameters
- All numeric parameters must be within engineering limits
- Design life between 15 and 30 years
- Physics parameters validated per component type

**Relationships**:
- Belongs to TurbineSpecification (many-to-one)
- Used in PhysicsCalculation (one-to-many)

### IECClassParameters
**Purpose**: Standard design reference values for different wind turbine classes
**Fields**:
- `iecClass`: Enum ['IA', 'IB', 'IIA', 'IIB', 'IIIA', 'IIIB', 'S'] - IEC wind class
- `vref`: Number - Reference wind speed (m/s)
- `turbulenceIntensityRef`: Number - Reference turbulence intensity
- `vave`: Number - Average wind speed (m/s)
- `temperatureRangeRef`: Number - Design temperature range (°C)
- `windShearExponentRef`: Number - Reference wind shear
- `airDensityRef`: Number - Standard air density (kg/m³)
- `category`: Enum ['high_wind', 'medium_wind', 'low_wind', 'site_specific']

**Validation Rules**:
- Class S allows null values for site-specific parameters
- Standard classes must have all reference values defined
- Reference values must be within IEC 61400-1 specified ranges

**Relationships**:
- Used by LoadFactor calculations (lookup table)
- Referenced by TurbineSpecification (many-to-one)

### LoadFactor
**Purpose**: Environmental and operational multipliers that adjust base failure rates
**Fields**:
- `calculationId`: String - Unique calculation identifier
- `environmentalFactors`: Object - Environmental load multipliers
- `componentFactors`: Object - Component-specific load factors
- `combinedLoadFactor`: Number - Overall load multiplier
- `calculatedAt`: Date - Calculation timestamp

**Environmental Factors**:
- `turbulenceLoadFactor`: Number - Turbulence-induced fatigue factor
- `thermalLoadFactor`: Number - Temperature cycling factor
- `corrosionFactor`: Number - Humidity/salinity corrosion factor
- `windShearFactor`: Number - Wind profile asymmetric loading factor

**Component Factors** (vary by component type):
- `bearingLifeAdjustment`: Number - Bearing specification adjustment
- `materialDegradationFactor`: Number - Temperature/environment effects
- `dynamicLoadFactor`: Number - Operational condition adjustments

**Validation Rules**:
- All load factors must be positive numbers
- Combined load factor typically between 0.1 and 10.0
- Calculation timestamp required for cache invalidation

**Relationships**:
- Calculated from EnvironmentalParameters (many-to-one)
- Used in PhaseParameter generation (one-to-many)

### PhaseParameters
**Purpose**: Shape and scale parameters for each of the three Weibull distribution phases
**Fields**:
- `phaseId`: String - Unique phase calculation identifier
- `componentType`: String - Component type being modeled
- `phase1`: Object - Infant mortality phase parameters
- `phase2`: Object - Useful life phase parameters
- `phase3`: Object - Wear-out phase parameters
- `continuityTolerance`: Number - Phase transition smoothness tolerance
- `wearOutMultiplier`: Number - Wear-out acceleration factor

**Phase Structure** (for each phase):
- `shape`: Number - Weibull shape parameter (β)
- `scale`: Number - Weibull scale parameter (η)
- `timeRange`: Object - Phase duration range (years)

**Validation Rules**:
- Phase 1 shape fixed at 0.6 (decreasing hazard)
- Phase 2 shape fixed at 1.0 (constant hazard)
- Phase 3 shape fixed at 3.0 (increasing hazard)
- Scale parameters must ensure continuity constraints
- Time ranges must not overlap

**Relationships**:
- Generated from LoadFactor calculations (many-to-one)
- Used by PhysicsCalculationResult (one-to-one)

### PhysicsCalculationRequest
**Purpose**: Input request for physics-based failure rate calculation
**Fields**:
- `requestId`: String - Unique request identifier
- `model`: String - Physics model type ('three-phase-weibull')
- `components`: Array - List of component IDs to calculate
- `inputs`: Object - Environmental and component parameters
- `dependencies`: Object - External data dependencies (optional)
- `settings`: Object - Calculation settings (iterations, precision)

**Validation Rules**:
- Model must be registered and available
- Components array must not be empty
- Inputs must match model's input schema
- Settings must include valid iteration count (1000-100000)

### PhysicsCalculationResult
**Purpose**: Output response from physics calculation with metadata
**Fields**:
- `requestId`: String - Matching request identifier
- `success`: Boolean - Calculation success status
- `data`: Object - Physics calculation results
- `metadata`: Object - Calculation metadata
- `error`: String - Error message if calculation failed
- `fallback`: Object - Simplified model results (optional)

**Data Structure** (when successful):
- `failureRateDistribution`: Object - Three-phase Weibull parameters
- `loadFactors`: Object - Applied environmental/component factors
- `phaseTransitions`: Object - Phase boundary information
- `validationMetrics`: Object - Scientific accuracy indicators

**Metadata Structure**:
- `model`: String - Physics model used
- `version`: String - Model version
- `iterations`: Number - Monte Carlo iterations performed
- `calculationTime`: Number - Processing time (ms)
- `scientificReferences`: Array - Applied formula references

**Validation Rules**:
- Success must be boolean
- If success=false, error message required
- If success=true, data structure must match model output schema
- Calculation time must be recorded for performance monitoring

## Entity Relationships

```
WindFarmSite
├── EnvironmentalParameters (1:1)
└── TurbineSpecification (1:many)
    └── ComponentSpecifications (1:many)
        └── PhysicsCalculationRequest (many:1)
            └── LoadFactor (1:1)
                └── PhaseParameters (1:1)
                    └── PhysicsCalculationResult (1:1)

IECClassParameters (lookup table)
└── Referenced by LoadFactor calculations

PhysicsModel (registry)
└── Validates PhysicsCalculationRequest
```

## Database Schema Notes

### MongoDB Collections
- `physicsModels` - Model registry and metadata
- `environmentalParameters` - Site condition data
- `componentSpecifications` - Component physics parameters
- `iecClassParameters` - IEC standard reference data
- `physicsCalculations` - Request/response audit log
- `loadFactorCache` - Cached environmental calculations

### Indexes Required
- `physicsCalculations.requestId` (unique)
- `environmentalParameters.siteId` (unique)
- `componentSpecifications.componentId` (unique)
- `loadFactorCache.parametersHash` (for cache lookups)
- `physicsCalculations.createdAt` (for cleanup/archival)

### Data Retention
- Physics calculations: 90 days (audit trail)
- Load factor cache: 24 hours (performance)
- Model definitions: Permanent (versioned)
- Component specifications: Permanent (project lifecycle)