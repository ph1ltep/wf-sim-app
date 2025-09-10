# Product Requirements Document: Three-Phase Weibull Component Failure Rate Model

## 1. Executive Summary

### 1.1 Purpose
Design a physics-based component failure rate model that generates realistic annual failure probabilities for major wind turbine components over a 30-year operational lifetime, replacing simplistic constant failure rates with industry-accurate three-phase (bathtub curve) behavior.

### 1.2 Core Value Proposition
- **Physics-first approach**: Maximize calculations from available site and turbine data
- **Three-phase lifecycle modeling**: Infant mortality, useful life, and wear-out phases
- **Calibration capability**: Improve accuracy using operational data from similar projects
- **Uncertainty quantification**: Provide confidence bands for risk assessment

### 1.3 Scope
- **In Scope**: Component-level failure probability calculations (% per year)
- **Out of Scope**: Turbine/farm integration, business case modeling, failure consequence analysis

## 2. Technical Architecture

### 2.1 Model Structure
The model implements a **piecewise hazard function** using three sequential Weibull distributions:

```yaml
Three-Phase Structure:
  Phase 1 - Infant Mortality: Years 0-2, β < 1 (decreasing hazard)
  Phase 2 - Useful Life: Years 2-(0.85×design_life), β = 1 (constant hazard)
  Phase 3 - Wear-out: Years (0.85×design_life)-30, β > 1 (increasing hazard)
```

### 2.2 Data Flow
```
Site Data + OEM Specs → Physics Calculations → Load Factors → 
Weibull Parameters (β,η) → Annual Failure Rates → SimResultsSchema
```

## 3. Input Parameters

### 3.1 Site Conditions

| Parameter | Type | Range/Values | Default | Source | Impact |
|-----------|------|--------------|---------|---------|---------|
| turbulence_intensity | float | 0.08-0.30 | 0.16 | Site assessment | Cubic relationship to fatigue (TI³) |
| mean_wind_speed_ms | float | 5.0-12.0 | 8.0 | Met mast data | Capacity factor → cycles |
| wind_shear_exponent | float | 0.05-0.30 | 0.14 | Site measurement | Asymmetric loading |
| temperature_range_c | [float, float] | [-40, 50] | [-20, 40] | Weather station | Thermal cycling stress |
| daily_temp_swing_c | float | 5-30 | 15 | Weather data | Daily thermal fatigue |
| air_density_kg_m3 | float | 0.9-1.3 | 1.225 | Site calculation | Aerodynamic loads |
| salinity_level | enum | low/moderate/high/marine | moderate | Distance to coast | Corrosion factor |
| relative_humidity | float | 0.3-0.95 | 0.65 | Weather station | Corrosion acceleration |
| rainfall_mm_year | float | 100-3000 | 800 | Climate data | Washing/corrosion |
| start_stop_cycles_year | int | 50-500 | 200 | Grid analysis | Thermal/mechanical cycling |

### 3.2 Turbine Specifications

| Parameter | Type | Range/Values | Default | Notes |
|-----------|------|--------------|---------|-------|
| design_life_years | int | 20, 25, 30 | 25 | Type certificate |
| iec_class | enum | IA/IB/IIA/IIB/IIIA/IIIB/S | IIA | Design envelope |
| rated_power_mw | float | 2.0-15.0 | 5.0 | Turbine model |

### 3.3 Component-Specific Parameters

#### 3.3.1 Gearbox (if applicable)
| Parameter | Type | Range/Values | Default (SGRE) | Critical for |
|-----------|------|--------------|----------------|--------------|
| bearing_L10_hours | int | 100000-300000 | 175000 | Wear-out timing |
| gear_stages | int | 1-4 | 3 | Failure points |
| bearing_count | int | 4-12 | 8 | Multiple failures |
| oil_temp_max_c | float | 60-90 | 70 | Thermal threshold |
| torque_rating_knm | float | 1000-10000 | 2847 | Load capacity |

#### 3.3.2 Generator
| Parameter | Type | Range/Values | Default (SGRE) | Critical for |
|-----------|------|--------------|----------------|--------------|
| insulation_class | enum | B/F/H | F (155°C) | Temperature limit |
| cooling_method | enum | air/liquid | air | Heat management |
| bearing_type | enum | ball/roller | roller | L10 calculation |
| rated_temp_rise_k | float | 60-100 | 80 | Thermal capacity |

#### 3.3.3 Main Bearing
| Parameter | Type | Range/Values | Default (SGRE) | Critical for |
|-----------|------|--------------|----------------|--------------|
| bearing_type | enum | spherical_roller/tapered | spherical_roller | Load pattern |
| dynamic_rating_kn | float | 5000-15000 | 8500 | Fatigue capacity |
| lubrication | enum | grease/oil | grease | Service life |

#### 3.3.4 Blade Set
| Parameter | Type | Range/Values | Default (SGRE) | Critical for |
|-----------|------|--------------|----------------|--------------|
| blade_length_m | float | 30-80 | 70 | Moment arm |
| material_type | enum | GFRP/CFRP/hybrid | GFRP | Fatigue slope |
| lightning_protection | enum | receptor/conductor | receptor | Strike survival |
| design_tip_speed_ms | float | 70-100 | 85 | Cycle frequency |

#### 3.3.5 Power Electronics
| Parameter | Type | Range/Values | Default (SGRE) | Critical for |
|-----------|------|--------------|----------------|--------------|
| converter_type | enum | full/partial | full | Stress level |
| junction_temp_max_c | float | 125-175 | 125 | Failure threshold |
| switching_freq_khz | float | 1-10 | 3.5 | Thermal cycling |

### 3.4 Calibration Parameters (Optional)

| Parameter | Type | Description | Impact |
|-----------|------|-------------|---------|
| operational_years | int | Years of available data | Calibration confidence |
| observed_failures | array | [year, component_type] pairs | Direct parameter update |
| source_park_similarity | float | 0-1 similarity score | Transfer confidence |
| fleet_baseline_rate | float | Industry average rate | Prior for Bayesian update |

## 4. Physics-Based Calculations

### 4.1 Load Factor Calculations

```yaml
Primary Physics Relationships:
  turbulence_load_factor = (TI_actual / TI_design)³
  thermal_cycling_factor = (temp_range_actual / temp_range_design)²
  capacity_factor_load = (CF_actual / CF_design)^1.5
  
  corrosion_acceleration = humidity_factor × salinity_factor × temp_factor
  where:
    humidity_factor = (RH / 0.65)^1.5
    salinity_factor = {low: 1.0, moderate: 1.5, high: 2.5, marine: 4.0}
    temp_factor = exp((T_avg - 15) / 25)
```

### 4.2 Component-Specific Adjustments

```yaml
Gearbox:
  bearing_life_years = L10_hours / (8760 × capacity_factor)
  oil_thermal_factor = if temp > 70°C: 3.0, else: 1.0
  stages_multiplier = 1 + 0.2 × (stages - 1)

Generator:
  thermal_limit_factor = (junction_temp / insulation_limit)³
  cooling_effectiveness = {air: 0.85, liquid: 0.95}

Main Bearing:
  load_factor = (actual_load / dynamic_rating)^1.8
  lubrication_factor = {grease: 1.2, oil: 1.0}

Blades:
  material_wohler_slope = {GFRP: 10, CFRP: 14, steel: 4}
  lightning_additional_rate = 0.1 × protection_effectiveness

Power Electronics:
  junction_cycling = (ΔT_junction / 40)^2.5
  power_cycling = (cycles_actual / cycles_design)^0.5
```

## 5. Three-Phase Weibull Parameter Generation

### 5.1 Parameter Calculation Flow

```yaml
Step 1 - Calculate Adjusted Baseline:
  adjusted_rate = fleet_baseline × site_load_factor × component_factor

Step 2 - Generate Phase Parameters:
  Phase 1 (Infant Mortality):
    β₁ = 0.5 to 0.8
    η₁ = solve for 50% lower rate than baseline
    duration = 2 years (fixed)
  
  Phase 2 (Useful Life):
    β₂ = 1.0 (exponential)
    η₂ = 1 / adjusted_baseline_rate
    duration = 2 to (design_life × 0.85)
  
  Phase 3 (Wear-out):
    β₃ = 2.5 to 3.5
    η₃ = calibrated to 2.5× baseline at design_life
    duration = (design_life × 0.85) to 30 years
```

### 5.2 Annual Failure Probability Calculation

```yaml
For each year t in [1, 30]:
  if t ≤ 2:
    phase = 1
    t_phase = t
  elif t ≤ design_life × 0.85:
    phase = 2
    t_phase = t - 2
  else:
    phase = 3
    t_phase = t - (design_life × 0.85)
  
  hazard_rate = (β[phase] / η[phase]) × (t_phase / η[phase])^(β[phase] - 1)
  annual_failure_prob[t] = 1 - exp(-hazard_rate)
```

## 6. Output Specification

### 6.1 Primary Output Structure

```yaml
component_failure_rates:
  gearbox:
    annual_probabilities: [0.011, 0.012, 0.020, ..., 0.095]  # 30 values
    cumulative_probability: 0.487  # Sum of annual probabilities
    phase_transitions: [2, 21]  # Year boundaries
    
  generator:
    annual_probabilities: [0.008, 0.009, 0.015, ..., 0.067]
    cumulative_probability: 0.398
    phase_transitions: [2, 21]
    
  # ... similar for other components
```

### 6.2 Integration with SimResultsSchema

The backend will transform component arrays into SimResultsSchema objects compatible with the existing Monte Carlo engine, handling uncertainty bands through the distribution sampling process.

## 7. Calibration Methodology

### 7.1 Site Similarity Assessment

```yaml
Similarity Vector Weights:
  turbulence_intensity: 30%  # Dominant fatigue driver
  temperature_cycling: 20%   # Thermal stress
  salinity_exposure: 15%     # Corrosion
  humidity: 15%             # Environmental degradation
  wind_speed: 10%           # Operating cycles
  other_factors: 10%        # Secondary effects

Transfer Confidence:
  similarity < 0.15: 90% confidence
  0.15 ≤ similarity < 0.30: 70% confidence
  similarity ≥ 0.30: Use fleet baseline only
```

### 7.2 Operational Data Integration

```yaml
By Years Available:
  Years 1-3: Update infant mortality (β₁, η₁) directly
  Years 4-8: Calibrate useful life rate with high confidence
  Years 9-15: Detect wear-out trend, extrapolate remaining life
  Years 16+: Full validation of all three phases
```

## 8. Validation Requirements

### 8.1 Physics Validation
- Turbulence cubic relationship matches IEC 61400-1
- Bearing L10 life calculations align with ISO 281
- Thermal relationships follow Arrhenius/Coffin-Manson laws

### 8.2 Statistical Validation
- Monotonic hazard rate in wear-out phase
- Cumulative failures match SGRE operational data ±15%
- Phase transitions occur at expected lifecycle points

### 8.3 Component Ranking
Expected failure rate hierarchy (highest to lowest):
1. Gearbox (2.0-2.5% average)
2. Generator (1.5-2.0% average)
3. Power Electronics (1.0-1.5% average)
4. Main Bearing (0.8-1.2% average)
5. Blades (0.5-1.0% average per blade)

## 9. Implementation Phases

### Phase 1: Core Model (Priority)
- Implement three-phase Weibull parameter generation
- Add physics-based load factor calculations
- Generate annual failure probability arrays
- Support gearbox and generator (highest impact components)

### Phase 2: Full Component Coverage
- Add main bearing, blades, power electronics
- Implement component-specific physics adjustments
- Add environmental degradation factors

### Phase 3: Calibration Framework
- Site similarity matching algorithm
- Operational data integration
- Bayesian parameter updating
- Confidence weighting system

### Phase 4: Maintenance Impact (Future)
- Component age reset on replacement
- Preventive maintenance effectiveness factors
- Condition-based maintenance adjustments

## 10. Key Design Decisions

### 10.1 Fixed Assumptions
- Infant mortality duration: 2 years (industry standard)
- Wear-out start: 85% of design life (IEC fatigue methodology)
- Phase transitions: Hard boundaries (not gradual)

### 10.2 Physics-First Principles
- All load factors derived from measurable site data
- No arbitrary correlation factors
- Component interactions minimal (no cascading failures)

### 10.3 Integration Constraints
- Output format: Simple annual probability arrays
- Backend handles distribution sampling and uncertainty
- Component independence maintained for simplicity

## Appendix A: Default Fleet Baseline Rates

| Component | Annual Rate | Source |
|-----------|------------|--------|
| Gearbox | 2.2% | SGRE fleet data |
| Generator | 1.5% | SGRE fleet data |
| Main Bearing | 1.0% | Industry average |
| Blade (per blade) | 0.8% | Industry average |
| Power Electronics | 1.2% | Industry average |

## Appendix B: Uncertainty Ranges

| Parameter Type | Typical Uncertainty | Handling |
|----------------|-------------------|----------|
| Site measurements | ±5-10% | Monte Carlo sampling |
| Material properties | ±10-15% | Manufacturing tolerance |
| Load models | ±15-20% | Physics approximation |
| Calibration transfer | ±20-30% | Similarity-weighted |

---

This PRD focuses exclusively on the component failure rate model design, providing clear specifications for implementation while maintaining flexibility for integration with your existing Monte Carlo backend infrastructure.