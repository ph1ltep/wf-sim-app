# Quickstart: Physics Engine Testing and Validation

## Overview
This guide provides step-by-step validation scenarios for the physics engine implementation, derived from the feature specification user stories. Each scenario can be executed independently to verify specific functionality.

## Prerequisites
- Backend server running with physics API endpoints
- Access to test data and environmental parameters
- API testing tool (Postman, curl, or automated tests)

## Test Scenario 1: Gearbox Physics Calculation

### Given: Wind farm scenario with environmental parameters
**Setup environmental conditions:**
```json
{
  "environmental": {
    "turbulenceIntensity": 0.18,
    "temperatureRange": 65,
    "dailyTempSwing": 20,
    "relativeHumidity": 0.75,
    "salinityLevel": "moderate",
    "windShearExponent": 0.16
  }
}
```

### When: Analyst selects three-phase Weibull modeling for gearbox
**API Request:**
```bash
curl -X POST http://localhost:3001/api/v1/physics/calculate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "model": "three-phase-weibull",
    "components": ["gearbox_001"],
    "inputs": {
      "environmental": {
        "turbulenceIntensity": 0.18,
        "temperatureRange": 65,
        "dailyTempSwing": 20,
        "relativeHumidity": 0.75,
        "salinityLevel": "moderate",
        "windShearExponent": 0.16
      },
      "component": {
        "componentType": "gearbox",
        "bearingL10Hours": 175000,
        "oilTempMax": 75,
        "gearStages": 3,
        "bearingCount": 8,
        "torqueRating": 2847
      },
      "design": {
        "iecClass": "IIA",
        "designLifeYears": 25
      }
    },
    "settings": {
      "iterations": 10000,
      "precision": 0.01
    }
  }'
```

### Then: System generates failure rate distributions with physics calculations
**Expected Response Validation:**
- `success: true`
- `data.failureRateDistribution` contains three phases
- `data.loadFactors.turbulenceLoadFactor` > 1.0 (elevated turbulence)
- `data.loadFactors.thermalLoadFactor` > 1.0 (elevated temperature)
- `data.validationMetrics.phaseContinuity: true`
- `metadata.calculationTime` < 2000ms

**Key Validation Points:**
- Bearing life adjustment factor incorporates L10 hours
- Oil temperature factor reflects 75°C vs 70°C baseline
- Load factors show physics-based environmental impacts

## Test Scenario 2: IEC Class Parameter Validation

### Given: Different IEC turbine classes
**Test multiple IEC classes:**

**Class IIA (medium wind):**
```json
{
  "design": {
    "iecClass": "IIA",
    "designLifeYears": 25
  }
}
```

**Class IIIA (low wind):**
```json
{
  "design": {
    "iecClass": "IIIA",
    "designLifeYears": 25
  }
}
```

### When: Physics modeling is applied
**Execute calculations for both classes with identical environmental conditions:**
```bash
# Test Class IIA
curl -X POST http://localhost:3001/api/v1/physics/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "three-phase-weibull",
    "components": ["generator_001"],
    "inputs": {
      "environmental": {
        "turbulenceIntensity": 0.16,
        "temperatureRange": 60,
        "relativeHumidity": 0.65
      },
      "component": {
        "componentType": "generator",
        "insulationClass": "F",
        "coolingMethod": "air",
        "bearingL10Hours": 200000
      },
      "design": {
        "iecClass": "IIA"
      }
    }
  }'

# Test Class IIIA
# (Same request with "iecClass": "IIIA")
```

### Then: System uses appropriate design reference parameters
**Expected Behavior:**
- Class IIA: `vref = 42.5 m/s`, `windShearExponentRef = 0.14`
- Class IIIA: `vref = 37.5 m/s`, `windShearExponentRef = 0.20`
- Load factors differ between classes due to different reference values
- Response metadata indicates correct IEC class applied

**Validation:**
- Load factors should differ between IEC classes for identical conditions
- Class IIIA should show higher load factors (more stressed design)

## Test Scenario 3: Site-Specific Environmental Conditions

### Given: Environmental conditions exceeding design parameters
**Extreme environmental test case:**
```json
{
  "environmental": {
    "turbulenceIntensity": 0.25,
    "temperatureRange": 75,
    "dailyTempSwing": 25,
    "relativeHumidity": 0.85,
    "salinityLevel": "marine"
  }
}
```

### When: Failure rates are calculated
**API Request with extreme conditions:**
```bash
curl -X POST http://localhost:3001/api/v1/physics/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "three-phase-weibull",
    "components": ["blades_001"],
    "inputs": {
      "environmental": {
        "turbulenceIntensity": 0.25,
        "temperatureRange": 75,
        "dailyTempSwing": 25,
        "relativeHumidity": 0.85,
        "salinityLevel": "marine",
        "windShearExponent": 0.18
      },
      "component": {
        "componentType": "blades",
        "fatigueLimitMPa": 100,
        "surfaceTreatment": "standard",
        "materialType": "GFRP",
        "bladeLength": 85
      },
      "design": {
        "iecClass": "IIA"
      }
    }
  }'
```

### Then: System applies appropriate load multipliers
**Expected Load Factor Calculations:**
- Turbulence load factor: `(0.25 / 0.16)³ = 3.81` (cube law)
- Temperature load factor: `>2.0` (elevated temperature cycling)
- Corrosion factor: `4.0` (marine salinity multiplier)
- Combined load factor: `>15.0` (significant environmental stress)

**Validation Points:**
- All load factors > 1.0 (conditions exceed design parameters)
- Physics formulas applied correctly (cube law for turbulence)
- Response time still < 2000ms despite complex calculations

## Test Scenario 4: Multiple Component Types

### Given: Multiple component types (gearbox, generator, blades)
**Multi-component calculation request:**
```json
{
  "components": ["gearbox_001", "generator_001", "blades_001"],
  "inputs": {
    "environmental": {
      "turbulenceIntensity": 0.16,
      "temperatureRange": 60,
      "relativeHumidity": 0.65,
      "salinityLevel": "moderate"
    }
  }
}
```

### When: Physics modeling is enabled
**Execute multi-component calculation:**
```bash
curl -X POST http://localhost:3001/api/v1/physics/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "three-phase-weibull",
    "components": ["gearbox_001", "generator_001", "blades_001"],
    "inputs": {
      "environmental": {
        "turbulenceIntensity": 0.16,
        "temperatureRange": 60,
        "relativeHumidity": 0.65,
        "salinityLevel": "moderate"
      },
      "component": {
        "multiComponent": true,
        "gearbox": {
          "componentType": "gearbox",
          "bearingL10Hours": 175000,
          "oilTempMax": 70
        },
        "generator": {
          "componentType": "generator",
          "insulationClass": "F",
          "bearingL10Hours": 200000
        },
        "blades": {
          "componentType": "blades",
          "fatigueLimitMPa": 100,
          "surfaceTreatment": "standard"
        }
      },
      "design": {
        "iecClass": "IIA"
      }
    }
  }'
```

### Then: Each component uses specific physics parameters
**Validation Requirements:**
- Response contains separate calculations for each component
- Gearbox calculation uses bearing/oil parameters
- Generator calculation uses insulation/cooling parameters
- Blade calculation uses material/fatigue parameters
- All phases maintain continuity constraints
- Component-specific load factors applied correctly

## Edge Case Testing

### Test Case 1: Missing Environmental Parameters
```bash
curl -X POST http://localhost:3001/api/v1/physics/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "three-phase-weibull",
    "components": ["gearbox_001"],
    "inputs": {
      "environmental": {
        "turbulenceIntensity": 0.16
      },
      "component": {
        "componentType": "gearbox"
      }
    }
  }'
```

**Expected Response:**
- `success: false`
- `error: "VALIDATION_ERROR"`
- `message:` describes missing required parameters
- `details:` lists specific missing fields

### Test Case 2: Parameters Outside Valid Range
```bash
curl -X POST http://localhost:3001/api/v1/physics/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "three-phase-weibull",
    "components": ["generator_001"],
    "inputs": {
      "environmental": {
        "turbulenceIntensity": 0.50,
        "temperatureRange": 100,
        "relativeHumidity": 1.5
      },
      "component": {
        "componentType": "generator"
      }
    }
  }'
```

**Expected Response:**
- `success: false`
- `error: "PHYSICS_CALCULATION_FAILED"`
- `message:` explains parameter range violations
- `fallback:` contains simplified model results

### Test Case 3: Unrealistic Physics Results
Test conditions that would result in impossible failure rates (e.g., negative scale parameters).

**Expected Behavior:**
- System detects mathematical inconsistencies
- Returns error with explanation
- Provides fallback using simplified statistical model

## Performance Validation

### Load Factor Caching Test
1. Execute identical environmental calculations multiple times
2. First request: >1000ms calculation time
3. Subsequent requests: <100ms (cache hit)
4. Verify cache hit rate via `/physics/cache/stats` endpoint

### Concurrent Request Test
1. Execute 10+ simultaneous physics calculations
2. All requests complete within 2000ms
3. No memory leaks or resource exhaustion
4. Response accuracy maintained under load

## Scientific Accuracy Validation

### Industry Benchmark Comparison
1. Use SGRE operational data as baseline
2. Execute physics calculations with equivalent conditions
3. Validate results within ±15% of benchmark data
4. Ensure `validationMetrics.industryBenchmarkMatch` > 0.85

### Formula Verification
1. Test known environmental conditions with documented outcomes
2. Verify turbulence cube law: 25% TI increase → 95% load increase
3. Validate temperature 10°C rule: 10°C increase → 2x degradation
4. Confirm marine corrosion: 4x factor for marine environments

## Success Criteria
- All test scenarios execute successfully
- Response times < 2000ms for all calculations
- Scientific accuracy within ±15% of industry benchmarks
- Error handling provides meaningful messages
- Cache performance shows >80% hit rate for repeated calculations
- Multi-component calculations maintain mathematical consistency