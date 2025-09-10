# Condensed Physics-Based Parameters (Failure Rate Impact Only)

## 🏭 **PRODUCT SPECIFICATIONS** (Turbine/Component Design)

```yaml
# Universal Design Parameters (All Components)
design_life_years: 25                   # Sets wear-out phase timing
iec_class_rating: "IIB"                 # Design load spectrum basis
wohler_curve_slope_m: 4.0              # Material fatigue sensitivity (steel=4, composite=10)
safety_factor_design: 1.5              # Design margin affects actual vs rated loads

# Component-Specific Critical Parameters
gearbox:
  bearing_L10_hours: 175000             # Primary failure mechanism
  gear_stages: 3                        # Multiple failure points
  
generator:  
  insulation_class_temp_c: 155          # Failure threshold temperature
  cooling_method: "air" | "liquid"      # Thermal management capability
  
main_bearing:
  dynamic_load_rating_kn: 8500         # Load capacity before damage
  bearing_type: "spherical_roller"      # Load distribution pattern
  
blade_set:
  blade_length_m: 58.5                 # Moment arm for fatigue loads
  material_type: "GFRP" | "CFRP"       # Changes wohler_slope to 10
  
power_electronics:
  junction_temp_max_c: 125             # Semiconductor failure limit
  switching_frequency_khz: 3.5         # Thermal cycling frequency
```

## 🌍 **SITE CONDITIONS** (Environmental Load Factors)

```yaml
# Primary Load Drivers
turbulence_intensity: 0.16             # CUBIC impact on fatigue (TI³)
annual_mean_wind_speed_ms: 8.0         # Drives capacity factor
wind_shear_exponent: 0.14              # Asymmetric rotor loading
capacity_factor_site: 0.35             # Operating cycle frequency

# Environmental Stress Factors  
temperature_range_celsius: [-20, 40]    # Thermal cycling amplitude
daily_temp_cycling_k: 15               # Daily thermal stress
start_stop_cycles_annual: 200          # Control system cycling
corrosion_category: "C2"               # Environmental degradation rate

# Load Factor Formulas
turbulence_load_factor = (TI_site / 0.16)³
thermal_cycling_factor = (temp_range_site / 60)²  
capacity_factor_load = (CF_site / 0.35)^1.5
site_load_multiplier = TLF × TCF × CFL
```

## ⚙️ **COMPONENT-SPECIFIC PARAMETERS** (Failure Pattern Modifiers)

```yaml
# Universal Parameters (All Components)
fleet_baseline_failure_rate: 0.022     # Industry benchmark by component type
infant_mortality_rate_factor: 0.5      # Multiplier for years 1-2
wear_out_start_factor: 0.85            # Starts at 85% of design_life
wear_out_acceleration_factor: 2.5      # Rate multiplier in wear-out phase

# Component-Specific Load Sensitivities
gearbox:
  torque_sensitivity_exponent: 2.0     # Torque² relationship to bearing wear
  oil_temperature_threshold_c: 70      # Above this: 3x acceleration
  bearing_count_multiplier: 8          # Multiple failure points

generator:
  thermal_cycling_exponent: 2.0        # Temperature cycling sensitivity  
  power_cycling_exponent: 0.5          # Start/stop impact (Coffin-Manson)
  cooling_effectiveness: 0.85          # Thermal management factor

main_bearing:
  load_sensitivity_exponent: 1.8       # Non-linear load-to-wear relationship
  contamination_sensitivity: 2.0       # Particulate damage amplification
  lubrication_factor: 1.2              # Grease vs oil difference

blade_set:
  fatigue_exponent: 10                  # Composite fatigue slope (vs 4 for steel)
  lightning_annual_probability: 0.1     # Additional failure mode
  uv_degradation_annual: 0.01          # Surface degradation rate

power_electronics:
  junction_temp_exponent: 3.0          # Arrhenius relationship
  switching_cycle_exponent: 0.5        # Power cycling damage
  voltage_stress_factor: 1.0           # Derating effectiveness
```

## 🧮 **FAILURE RATE CALCULATION FORMULAS**

```yaml
# Step 1: Component Load Factor
component_load_factor:
  gearbox: site_load_multiplier^torque_sensitivity_exponent × oil_thermal_factor
  generator: thermal_cycling_factor^2 × power_cycling_factor^0.5 × cooling_factor
  main_bearing: site_load_multiplier^1.8 × contamination_factor × lube_factor  
  blade_set: turbulence_load_factor × lightning_factor × uv_factor
  electronics: thermal_factor^3 × power_factor^0.5 × voltage_factor

# Step 2: Three-Phase Rate Calculation
if year ≤ 2:
    phase_rate = fleet_baseline_failure_rate × 0.5
elif year ≤ (design_life × 0.85):  
    phase_rate = fleet_baseline_failure_rate
else:
    wear_progression = ((year - design_life×0.85) / design_life)²
    phase_rate = fleet_baseline_failure_rate × (1 + 2.5 × wear_progression)

# Step 3: Final Annual Failure Probability  
annual_failure_rate[year] = phase_rate × component_load_factor

# Component-Specific Adjustments
if component == "gearbox" and oil_temp > 70°C:
    annual_failure_rate[year] × 3.0
    
if component == "generator" and junction_temp > insulation_limit:
    annual_failure_rate[year] × 5.0
    
if component == "main_bearing" and load > dynamic_rating:
    annual_failure_rate[year] × (load/rating)^1.8
    
if component == "blade_set" and material == "CFRP":
    wohler_slope = 10  # vs 4 for steel components
```

## 📊 **CALIBRATION PARAMETERS**

```yaml
# Fleet Calibration (Industry Benchmarking)
fleet_data_weight: 0.6                 # Confidence in industry data
site_correlation_factors:              # Observed multipliers from fleet
  high_turbulence_sites: 1.4           # TI > 0.18
  complex_terrain: 1.3                 # Mountain/ridge sites  
  offshore: 1.1                        # Marine environment
  cold_climate: 1.2                    # < -10°C sites

# Project Historical Calibration (If Available)
historical_data_weight: 0.4            # Confidence in project data
observed_vs_expected_multiplier: 1.0   # Calibration factor from actual failures
calibration_confidence: "low" | "medium" | "high"  # Based on sample size
```

This condensed structure focuses only on parameters that mathematically impact the annual failure probability calculation, eliminating descriptive or secondary factors while maintaining the physics-based relationships essential for accurate reliability modeling.

---

## 🎯 **DISTRIBUTION CONSTRUCTION METHODOLOGY**

### **Question: Parameter Transformation to Three-Phase Weibull**

Given all these input parameters, how do we transform it into a distribution? How does all this info translate into 3 sets of weibull shape and scale params and eventually combine into a single distribution that we can look at % probability of failure per year?

### **Answer: Three-Phase Weibull Distribution Construction**

## 🎯 **CONCEPTUAL FRAMEWORK**

The key insight is that we're not creating one Weibull distribution, but rather **three sequential distributions** that represent different failure physics, then combining them into a **piecewise hazard function** that gives us annual failure probabilities.

## 📊 **PARAMETER TRANSFORMATION LOGIC**

### **Step 1: From Inputs to Phase Boundaries**
```yaml
# Time Domain Segmentation
infant_mortality_end = 2.0  # Fixed based on manufacturing processes
useful_life_end = design_life_years × wear_out_start_factor  # 25 × 0.85 = 21.25 years
wear_out_continues = project_lifetime  # Could go to 30+ years

# Phase Duration Calculation  
phase_1_duration = infant_mortality_end
phase_2_duration = useful_life_end - infant_mortality_end  
phase_3_duration = project_lifetime - useful_life_end
```

### **Step 2: From Site/Component Inputs to Load-Adjusted Baseline**
```yaml
# Baseline Rate Transformation
adjusted_baseline_rate = (
    fleet_baseline_failure_rate ×  
    site_load_multiplier ×
    component_load_factor
)

# Example for SGRE SG5.0-145 Gearbox:
# 0.022 × 1.15 × 1.0 = 0.0253 adjusted baseline
```

### **Step 3: Phase-Specific Weibull Parameter Generation**

#### **Phase 1: Infant Mortality (Decreasing Hazard Rate)**
```yaml
# Weibull Parameters for Manufacturing/Installation Defects
infant_mortality_weibull:
  shape_beta_1 = 0.5 to 0.8  # β < 1 = decreasing hazard (burn-in period)
  
  # Scale parameter from desired failure rate
  target_cumulative_failures_2yr = adjusted_baseline_rate × infant_mortality_rate_factor × 2
  # For our example: 0.0253 × 0.5 × 2 = 0.0253 cumulative probability by year 2
  
  scale_eta_1 = solve_for_eta(target_cumulative = 0.0253, beta = 0.7, time = 2)
  # eta_1 ≈ 15.8 years (but most failures occur in first 2 years due to β < 1)
```

#### **Phase 2: Useful Life (Constant Hazard Rate)**  
```yaml
# Exponential Distribution (Special Case of Weibull with β = 1)
useful_life_weibull:
  shape_beta_2 = 1.0  # Constant hazard rate (random failures)
  
  # Scale parameter directly from annual rate
  annual_rate_phase_2 = adjusted_baseline_rate
  scale_eta_2 = 1 / annual_rate_phase_2
  # For our example: eta_2 = 1/0.0253 = 39.5 years
```

#### **Phase 3: Wear-Out (Increasing Hazard Rate)**
```yaml  
# Weibull Parameters for Fatigue/Aging Failures
wear_out_weibull:
  shape_beta_3 = 2.5 to 3.5  # β > 1 = increasing hazard (aging)
  
  # Acceleration factor applied
  target_rate_at_design_life = adjusted_baseline_rate × wear_out_acceleration_factor
  # 0.0253 × 2.5 = 0.0633 annual rate at year 25
  
  # Scale parameter calibrated to hit target rate at specific time
  scale_eta_3 = calibrate_eta(target_rate = 0.0633, beta = 3.0, time_from_phase_start = 4)
  # eta_3 ≈ 12 years (from start of wear-out phase)
```

## ⚙️ **DISTRIBUTION COMBINATION METHODOLOGY**

### **Approach: Piecewise Hazard Function (Not Mixed Distribution)**

We **don't** create a single mixed Weibull. Instead, we create a **time-dependent hazard function**:

```yaml
# Hazard Rate Function h(t)
hazard_rate(year):
  if year ≤ 2:
    return weibull_hazard(year, beta_1, eta_1)
  elif year ≤ 21.25:  
    return weibull_hazard(year-2, beta_2, eta_2)  # Reset time origin
  else:
    return weibull_hazard(year-21.25, beta_3, eta_3)  # Reset time origin

# Annual Failure Probability from Hazard Rate
annual_failure_probability(year) = hazard_rate(year)  # For small rates

# OR more precisely:
annual_failure_probability(year) = 1 - exp(-hazard_rate(year))
```

### **Survival Function Construction**
```yaml
# Cumulative Survival (Probability of NO failure by year t)
survival_function(year):
  if year ≤ 2:
    S1 = exp(-integrate(hazard_rate, 0, year))
  elif year ≤ 21.25:
    S1 = exp(-integrate(hazard_rate_phase1, 0, 2))  # Survived phase 1
    S2 = exp(-integrate(hazard_rate_phase2, 2, year))  # Surviving phase 2  
    return S1 × S2
  else:
    S1 = exp(-integrate(hazard_rate_phase1, 0, 2))
    S2 = exp(-integrate(hazard_rate_phase2, 2, 21.25))  
    S3 = exp(-integrate(hazard_rate_phase3, 21.25, year))
    return S1 × S2 × S3

# Annual Failure Probability
annual_failure_prob(year) = survival_function(year-1) - survival_function(year)
```

## 🔍 **PARAMETER CALIBRATION PROCESS**

### **Working Backwards from Target Behavior**

```yaml
# Desired Behavior Pattern (Example)
target_annual_rates:
  year_1: 0.011    # 50% of baseline (infant mortality)
  year_10: 0.025   # Baseline rate (useful life)  
  year_25: 0.063   # 2.5x baseline (wear-out)

# Calibration Process:
step_1_infant_mortality:
  # Choose β₁ = 0.7 (decreasing hazard)  
  # Solve for η₁ such that average rate years 1-2 = 0.011
  
step_2_useful_life:
  # Set β₂ = 1.0 (constant hazard)
  # Set η₂ = 1/0.025 = 40 years
  
step_3_wear_out:
  # Choose β₃ = 3.0 (increasing hazard)
  # Solve for η₃ such that rate at year 4 of wear-out phase = 0.063
```

### **Site/Component Factor Integration**
```yaml
# How Site Factors Modify Weibull Parameters:

turbulence_impact:
  # Higher turbulence increases load cycling
  if TI_ratio > 1.0:
    beta_3 += 0.5 × (TI_ratio - 1)  # Steeper wear-out curve
    eta_1 /= TI_ratio^0.5           # Earlier infant mortality
    
temperature_cycling_impact:
  # Thermal stress affects all phases
  thermal_factor = (temp_range_actual / temp_range_design)^2
  eta_2 /= thermal_factor           # Shorter useful life
  beta_3 += 0.3 × (thermal_factor - 1)  # More aggressive wear-out

component_specific_adjustments:
  if component == "gearbox":
    # Bearing L10 life dominates wear-out phase
    bearing_life_years = bearing_L10_hours / (8760 × capacity_factor)  
    eta_3 = bearing_life_years × 0.8  # Scale parameter tied to L10
    
  if component == "blade_set" and material == "CFRP":
    beta_3 = 4.0  # Steeper failure curve for composites
    lightning_additional_rate = lightning_probability × 0.1
```

## 🎯 **FINAL OUTPUT GENERATION**

### **Year-by-Year Calculation Process**
```yaml
# For each year 1 to 30:
for year in range(1, 31):
  
  # Step 1: Determine which phase
  if year ≤ infant_mortality_end:
    phase = "infant_mortality"
    t_phase = year
    beta, eta = beta_1, eta_1
    
  elif year ≤ useful_life_end:  
    phase = "useful_life"
    t_phase = year - infant_mortality_end
    beta, eta = beta_2, eta_2
    
  else:
    phase = "wear_out"  
    t_phase = year - useful_life_end
    beta, eta = beta_3, eta_3
  
  # Step 2: Calculate hazard rate for this phase
  hazard = (beta / eta) × (t_phase / eta)^(beta - 1)
  
  # Step 3: Convert to annual failure probability
  annual_failure_prob[year] = 1 - exp(-hazard)
  
  # Step 4: Apply component-specific adjustments
  if component == "gearbox" and oil_temp > threshold:
    annual_failure_prob[year] *= 3.0
```

## 💡 **KEY INSIGHTS**

### **Why Three Phases Work**
1. **Different Physics**: Manufacturing defects vs. random failures vs. fatigue damage
2. **Different Time Scales**: Days/months vs. years vs. decades  
3. **Different Sensitivities**: Installation quality vs. operating conditions vs. cumulative damage
4. **Different Predictability**: Known burn-in vs. steady state vs. accelerating degradation

### **Critical Design Decisions**
```yaml
phase_boundaries:
  infant_mortality_end: "Fixed at 2 years" # Based on industry experience
  wear_out_start: "85% of design life"     # IEC fatigue methodology
  
parameter_hierarchy:
  most_critical: "wear_out_start_factor"   # Drives economics
  most_sensitive: "turbulence_intensity"   # Cubic relationship  
  most_uncertain: "beta_3 (wear-out shape)" # Limited field data
  
validation_targets:
  industry_benchmarks: "Match fleet failure rates by age"
  physics_consistency: "Monotonic hazard in wear-out phase"  
  financial_realism: "P90 costs within financing limits"
```

The beauty of this approach is that all our complex site conditions and component parameters ultimately flow into just **six Weibull parameters** (β₁,η₁,β₂,η₂,β₃,η₃) that capture the complete lifecycle reliability behavior, but the calculation process gives us the annual failure probabilities we need for Monte Carlo financial modeling.

---

## 🔍 **CALIBRATION REALISM & DATA INTEGRATION CHALLENGES**

### **Questions: Data Availability & Model Calibration**

There are a lot of correlation factors, component specific inputs and calibration parameters. How do we get this as right as possible? For example, for the site calibration stuff, how realistic are your factors and will this change at every site or is somewhat predictably related to each other? Do we have enough industry/expert data to make decent estimates? Also, if we have fleet data to for the same part of the WTG's lifetime, how could we add a calibration to this mechanism. What if we wanted to extrapolate the remaining life based on the first few years of a existing project (rather than arbritrary fleet data that certainly have different site parameters)?

### **Answer: Critical Assessment & Revised Approach**

## 🎯 **CRITICAL ASSESSMENT: DATA AVAILABILITY & REALISM**

### **Site Correlation Factor Reality Check**

The correlation factors I proposed are **oversimplified** and need significant refinement:

#### **Current Proposal Issues:**
```yaml
# PROBLEMATIC: Independent multipliers
high_turbulence_sites: 1.4    # Too simplistic
complex_terrain: 1.3          # Ignores correlations  
offshore: 1.1                 # Based on limited data
cold_climate: 1.2             # Threshold effects ignored
```

#### **Reality: Site Factors Are Highly Correlated**
```yaml
# BETTER: Correlated site characterization
site_complexity_matrix:
  flat_onshore_low_TI:        # Baseline case
    turbulence: 0.12-0.16
    terrain_factor: 1.0
    accessibility: 1.0
    failure_multiplier: 0.85   # Actually lower than "standard"
    
  complex_onshore_high_TI:    # Mountain/ridge sites  
    turbulence: 0.18-0.24      # Correlated with terrain
    terrain_factor: 1.4
    accessibility: 0.7         # Limited crane access
    failure_multiplier: 1.8    # Combined effect, not additive
    
  offshore_moderate_TI:       # Marine environment
    turbulence: 0.14-0.18      # Actually lower over water
    corrosion_acceleration: 2.5 # Dominant factor
    accessibility: 0.3         # Weather windows
    failure_multiplier: 1.3    # Dominated by logistics, not loads
```

### **Industry Data Availability Assessment**

#### **What We Actually Have (Realistic)**
```yaml
reliable_data_sources:
  WMEP_germany:
    sample_size: ~15000 turbines
    time_coverage: 1990-2015    # Mostly older technology
    failure_events: ~25000      # Good for statistical inference
    limitations: "Pre-modern turbine designs"
    
  VTT_finland: 
    sample_size: ~3000 turbines
    time_coverage: 2000-2020
    failure_events: ~8000
    limitations: "Cold climate bias, smaller sample"
    
  insurance_databases:
    coverage: "Global, modern turbines"
    limitations: "Proprietary, biased toward large claims"
    accessibility: "Industry partnerships only"

# CRITICAL GAP: Modern offshore turbines (post-2015)
data_gaps:
  modern_offshore: "Less than 5000 turbine-years available"
  component_interactions: "Almost no public data"
  site_specific_correlations: "Proprietary OEM data only"
```

#### **What We're Missing (Honest Assessment)**
```yaml
critical_unknowns:
  phase_3_parameters:
    confidence: "LOW"           # Most turbines haven't reached wear-out
    data_sources: "Accelerated testing, older turbines"
    uncertainty_range: "±50% on wear-out rates"
    
  component_correlations:
    confidence: "VERY LOW"      # Theoretical models only
    gearbox_generator_correlation: "0.15-0.35 estimated"
    validation_data: "Insufficient sample size"
    
  site_load_multipliers:
    confidence: "MEDIUM"        # Physics-based, limited validation
    turbulence_cubic_law: "Well established in theory"
    field_validation: "Only 3-5 sites with adequate data"
```

## 🔧 **REVISED CALIBRATION METHODOLOGY**

### **Multi-Level Calibration Framework**

#### **Level 1: Physics-Based Priors (Always Available)**
```yaml
physics_based_parameters:
  # These we can estimate from first principles
  turbulence_impact_exponent: 3.0      # Fatigue theory, well-established
  bearing_L10_relationship: "IEC 61400-4"  # Regulatory standard
  temperature_cycling_arrhenius: 0.7    # Material science, validated
  
  # Uncertainty quantification built in
  parameter_uncertainty:
    turbulence_exponent: [2.8, 3.2]    # 95% confidence interval
    bearing_L10_factor: [0.8, 1.2]     # Safety factor uncertainty
    arrhenius_activation: [0.6, 0.8]   # Material variability
```

#### **Level 2: Industry Fleet Calibration (If Available)**
```yaml
fleet_calibration_approach:
  data_requirements:
    minimum_sample_size: 1000           # Turbine-years per component
    minimum_failure_events: 50          # For statistical significance
    temporal_coverage: 15               # Years to observe all phases
    
  calibration_method: "Hierarchical Bayesian"
  # Accounts for site heterogeneity while pooling information
  
  implementation:
    site_clustering:
      # Group similar sites to increase sample size
      cluster_1: "Flat onshore, TI<0.16"
      cluster_2: "Complex onshore, TI>0.18" 
      cluster_3: "Offshore, all conditions"
      
    parameter_estimation:
      # Update physics-based priors with fleet data
      prior_weight: 0.3               # Physics gets 30% weight
      data_weight: 0.7                # Fleet data gets 70% weight
      convergence_criterion: "R-hat < 1.05"
```

#### **Level 3: Project-Specific Calibration (Most Valuable)**
```yaml
project_calibration_scenarios:
  
  early_life_data: # Years 1-5 available
    observable_parameters:
      infant_mortality_rate: "DIRECT"  # We've seen this phase
      useful_life_early: "DIRECT"     # Beginning of phase 2
      site_load_factor: "INDIRECT"    # Infer from performance
      
    calibration_approach:
      method: "Maximum likelihood + Bayesian updating"
      infant_mortality: "Recalibrate β₁, η₁ directly"
      useful_life: "Update λ₂ with high confidence"
      wear_out_prediction: "Fleet-calibrated + site adjustment"
      
    uncertainty_handling:
      phase_1_confidence: "HIGH"      # Observed data
      phase_2_confidence: "MEDIUM"    # Partial observation
      phase_3_confidence: "LOW"       # Extrapolation only

  mid_life_data: # Years 1-15 available  
    observable_parameters:
      all_phases: "Phase 1&2 complete, Phase 3 starting"
      component_interactions: "Observable in data"
      maintenance_effectiveness: "Quantifiable"
      
    calibration_approach:
      method: "Survival analysis with competing risks"
      confidence_level: "HIGH"        # Most parameters observed
      extrapolation_uncertainty: "MEDIUM"  # Only late wear-out unknown
```

### **Practical Implementation Strategy**

#### **Tiered Parameter Confidence**
```yaml
parameter_classification:
  
  tier_1_high_confidence:
    # Physics-based, well-validated
    - turbulence_load_exponent: 3.0
    - bearing_L10_baseline: 175000_hours
    - phase_1_duration: 2_years
    - phase_2_beta: 1.0
    uncertainty: ±10%
    
  tier_2_medium_confidence:
    # Industry data available, some validation
    - baseline_failure_rates_by_component
    - wear_out_start_factor: 0.85
    - infant_mortality_factor: 0.5
    uncertainty: ±25%
    
  tier_3_low_confidence:
    # Estimated, limited validation
    - component_correlation_coefficients  
    - wear_out_acceleration_factors
    - site_interaction_effects
    uncertainty: ±50%
```

#### **Adaptive Calibration Process**
```yaml
calibration_workflow:
  
  step_1_initialize:
    # Start with physics-based priors
    source: "First principles + IEC standards"
    confidence: "Medium for load relationships, low for failure rates"
    
  step_2_fleet_update:
    # IF fleet data available
    method: "Bayesian hierarchical model"
    benefit: "Improves baseline rates, reduces uncertainty by ~30%"
    
  step_3_project_specific:
    # As project data becomes available
    years_1_3: "Update infant mortality parameters"
    years_4_8: "Update useful life rates"  
    years_9_15: "Begin wear-out calibration"
    years_16+: "Full model validation"
    
  step_4_continuous_improvement:
    # Model becomes more accurate over time
    recalibration_frequency: "Annual"
    parameter_drift_detection: "Statistical process control"
    model_validation: "Holdout testing on recent data"
```

## 🎯 **REVISED MODEL ARCHITECTURE**

### **Core Changes to Original Proposal**

#### **1. Replace Independent Site Multipliers with Site Archetypes**
```yaml
# BEFORE: Independent factors
site_factors = TI_factor × terrain_factor × climate_factor

# AFTER: Site archetype classification
site_archetype_parameters:
  archetype_1_simple_onshore:
    turbulence_range: [0.12, 0.16]
    load_multiplier: 0.90
    accessibility_factor: 1.0
    primary_failure_modes: ["bearing_wear", "fatigue"]
    
  archetype_2_complex_onshore:
    turbulence_range: [0.18, 0.24]
    load_multiplier: 1.60          # Non-linear interaction
    accessibility_factor: 0.70
    primary_failure_modes: ["fatigue", "extreme_loads", "lightning"]
    
  archetype_3_offshore:
    turbulence_range: [0.14, 0.18]
    load_multiplier: 1.20
    accessibility_factor: 0.40     # Weather windows dominate
    primary_failure_modes: ["corrosion", "bearing_wear"]
```

#### **2. Uncertainty Quantification Throughout**
```yaml
# Every parameter gets uncertainty bounds
parameter_structure:
  value: 0.022                    # Point estimate
  distribution: "lognormal"       # Parameter uncertainty distribution
  confidence_interval: [0.018, 0.027]  # 95% CI
  data_source: "WMEP + VTT"      # Traceability
  last_updated: "2024-01-15"
  sample_size: 1247              # Underlying data quality
```

#### **3. Dynamic Calibration Interface**
```yaml
calibration_api:
  # Method signatures for different calibration approaches
  
  initialize_from_physics():
    # Pure physics-based initialization
    confidence: "LOW-MEDIUM"
    use_case: "New component types, no historical data"
    
  calibrate_from_fleet(fleet_database, site_archetype):
    # Industry-wide calibration
    confidence: "MEDIUM"  
    use_case: "Standard components, similar sites"
    
  calibrate_from_project(project_failures, operational_years):
    # Project-specific calibration
    confidence: "HIGH for observed phases"
    use_case: "Existing projects, remaining life estimation"
    
  update_with_new_data(new_failures, current_model):
    # Continuous improvement
    method: "Bayesian updating"
    use_case: "Model maintenance, ongoing projects"
```

## 🔍 **VALIDATION & REALITY CHECKING**

### **Model Validation Framework**
```yaml
validation_requirements:
  
  statistical_validation:
    # Standard statistical tests
    kolmogorov_smirnov: "Distribution shape validation"
    likelihood_ratio: "Model comparison"
    cross_validation: "Out-of-sample prediction accuracy"
    
  industry_benchmarks:
    # Must reproduce known industry patterns
    component_failure_ranking: "Gearbox > Generator > Bearing > Blades"
    age_related_trends: "Low early, flat middle, increasing late"
    site_type_differences: "Offshore > Complex > Simple onshore"
    
  physics_consistency:
    # Must respect physical laws
    monotonic_wear_out: "Hazard rate increases in phase 3"
    load_sensitivity: "Higher loads → higher failure rates"
    temperature_relationships: "Arrhenius behavior for thermal effects"
    
  financial_realism:
    # Results must make economic sense
    p90_cost_estimates: "Within typical financing limits"
    maintenance_optimization: "Predicts optimal replacement timing"
    insurance_pricing: "Consistent with actuarial models"
```

## 💡 **PRACTICAL RECOMMENDATIONS**

### **Implementation Strategy**
```yaml
phase_1_minimum_viable_model:
  # What we can build with current data limitations
  scope: "Major components, onshore sites only"
  parameters: "Physics-based + limited fleet calibration"
  uncertainty: "Explicitly quantified and communicated"
  validation: "Against available historical data"
  
phase_2_enhanced_calibration:
  # As more data becomes available
  fleet_partnerships: "Partner with OEMs/operators for data sharing"
  site_monitoring: "Detailed measurement campaigns"
  component_testing: "Accelerated aging studies"
  
phase_3_predictive_maintenance:
  # Ultimate goal
  real_time_updates: "SCADA integration for condition monitoring"
  machine_learning: "Pattern recognition in operational data"
  digital_twins: "Component-specific models"
```

### **Critical Success Factors**
1. **Honest Uncertainty Communication**: Don't oversell model accuracy
2. **Continuous Calibration**: Model improves as data accumulates  
3. **Physics Foundation**: Maintain physical realism even with limited data
4. **Practical Validation**: Focus on decisions that matter to wind farm economics
5. **Industry Partnerships**: Critical for accessing proprietary failure data

The key insight is that we need to **start with what we can validate** (physics-based relationships, basic site effects) and **build calibration capability** that improves the model as more data becomes available, rather than trying to achieve perfect accuracy from day one with insufficient data.

---

## 🔬 **REFINED COMPONENT FAILURE RATE SIMULATOR ARCHITECTURE**

### **Questions: Enhanced Input Requirements & Scope Refinement**

For corrosion rate, do we need to add inputs for salinity and humidity? These are easy to obtain especially if we're not too exactly sensitive. Weather data can provide it.

What other direct from OEM specs would we need for the other major components? For example, clearly blade length is a must.

For the monte-carlo integration data flow, I don't want to simulate the entire wind farm or WTG. I want to limit it to simulating the component failure probability per year. The app already ties everything together to simulate the business case.

The goal of this brainstorming is not related to a specific business case, so reaching specific IRRs or bps doesn't matter. We want to focus on building the realistic and capable failure rate simulator we can. The app does the rest.

### **Answer: Enhanced Physics-Based Approach**

## 🌍 **ENHANCED SITE DATA UTILIZATION**

### **Corrosion-Specific Inputs** (Easily Obtainable from Weather Data)

```yaml
enhanced_environmental_inputs:
  # Existing site data
  turbulence_intensity: 0.16
  mean_wind_speed: 8.0
  temperature_range: [-20, 40]
  rainfall_mm_year: 800
  
  # ADDED: Corrosion-critical factors
  salinity_level: "low" | "moderate" | "high" | "marine"  # Distance from coast classification
  relative_humidity_avg: 0.65        # Standard weather station data
  uv_radiation_index: 6.5            # Solar radiation data (affects polymers)
  
# Enhanced corrosion rate physics calculation
corrosion_acceleration = base_rate × humidity_factor × salinity_factor × temperature_factor
where:
  humidity_factor = (RH_actual / 0.65)^1.5      # Exponential relationship
  salinity_factor = {"low": 1.0, "moderate": 1.5, "high": 2.5, "marine": 4.0}
  temperature_factor = exp((T_avg - 15) / 25)   # Arrhenius-type acceleration
```

## ⚙️ **COMPREHENSIVE OEM SPECIFICATION REQUIREMENTS**

### **Gearbox**
```yaml
gearbox_oem_specs:
  bearing_L10_hours: 175000          # IEC 61400-4 standard - CRITICAL
  gear_stages: 3                     # Multiple failure points
  bearing_count_critical: 8          # High/intermediate speed bearings
  gear_ratio: 97.2                   # Load distribution
  oil_temperature_max: 70            # Thermal failure threshold
  torque_rating_nm: 2847000         # Design load capacity
  oil_type: "ISO_320"               # Viscosity affects bearing performance
```

### **Generator**
```yaml
generator_oem_specs:
  insulation_class: "F"             # Temperature rating (155°C) - CRITICAL
  cooling_method: "air" | "liquid"   # Heat dissipation capability
  bearing_type: "ball" | "roller"    # Different L10 calculations
  bearing_count: 2                   # Front and rear bearings
  rated_temperature_rise: 80        # K above ambient design
  rotor_type: "permanent_magnet" | "wound"  # Different failure modes
  winding_material: "copper" | "aluminum"  # Thermal coefficients
```

### **Main Bearing**
```yaml
main_bearing_oem_specs:
  bearing_type: "spherical_roller" | "tapered_roller"  # Load capacity pattern
  dynamic_load_rating_kn: 8500      # C-rating for fatigue - CRITICAL
  static_load_rating_kn: 12000      # C0-rating for shock loads
  bore_diameter_mm: 500             # Stress concentration factor
  lubrication_method: "grease" | "oil"  # Service interval impact
  sealing_type: "labyrinth" | "contact"  # Environmental protection
```

### **Blade Set**  
```yaml
blade_oem_specs:
  blade_length_m: 58.5              # CRITICAL: Moment arm for loads
  material_type: "GFRP" | "CFRP" | "hybrid"  # Fatigue slope (4 vs 10)
  root_diameter_m: 3.2              # Load concentration area
  max_chord_m: 4.1                  # Aerodynamic profile
  design_tip_speed: 85              # m/s - fatigue cycle frequency
  lightning_protection: "receptor" | "down_conductor"  # Strike survival
  leading_edge_material: "polyurethane" | "steel"  # Erosion resistance
```

### **Power Electronics**
```yaml
power_electronics_oem_specs:
  converter_type: "full" | "partial"
  semiconductor_type: "IGBT" | "SiC"  # Different thermal limits
  junction_temp_max: 125            # CRITICAL: Failure threshold
  switching_frequency_khz: 3.5      # Thermal cycling rate
  cooling_type: "air" | "liquid"    # Heat management
  power_cycling_capability: 1e6     # Design cycles to failure
```

## 🎯 **FOCUSED COMPONENT-LEVEL MONTE CARLO**

### **Simplified Architecture: Component Failure Rates Only**

```yaml
component_failure_simulator_scope:
  
  # INPUT: Focused on component-level parameters
  inputs:
    - site_physics_data (including enhanced corrosion factors)
    - component_oem_specifications
    - calibration_data (if available from similar parks)
    
  # PROCESSING: Generate three-phase Weibull parameters per component
  processing_pipeline:
    step_1: "Calculate physics-based site load factors"
    step_2: "Apply component-specific OEM specifications"  
    step_3: "Generate (β₁,η₁,β₂,η₂,β₃,η₃) for each major component"
    step_4: "Create 30-year annual failure probability arrays"
    step_5: "Apply uncertainty quantification via Monte Carlo"
    
  # OUTPUT: Component failure rate distributions (your app handles the rest)
  outputs:
    gearbox_annual_failure_rates: [p10_array, p50_array, p90_array]
    generator_annual_failure_rates: [p10_array, p50_array, p90_array] 
    main_bearing_annual_failure_rates: [p10_array, p50_array, p90_array]
    blade_set_annual_failure_rates: [p10_array, p50_array, p90_array]
    power_electronics_annual_failure_rates: [p10_array, p50_array, p90_array]
```

### **Monte Carlo Parameter Uncertainty Sampling**

```yaml
component_uncertainty_quantification:
  
  # Sample uncertain parameters for realistic variation
  for monte_carlo_iteration in range(10000):
    
    # Site factor uncertainties
    sampled_site_factors:
      turbulence_measurement_error: ±5%     # Typical measurement uncertainty
      temperature_cycling_variation: ±10%   # Local microclimate effects
      corrosion_factor_estimation: ±20%     # Environmental assessment uncertainty
      
    # Component parameter uncertainties  
    sampled_component_factors:
      bearing_L10_manufacturing_scatter: ±20%  # Industry standard variation
      material_property_variation: ±10%       # Quality control limits
      load_model_uncertainty: ±15%           # Physics model approximation
      
    # Generate failure rates for this parameter combination
    component_failure_rates[iteration] = calculate_three_phase_weibull(
      sampled_site_factors + sampled_component_factors
    )
  
  # Extract percentile bands for each component and year
  final_output = extract_percentiles(component_failure_rates, [10, 50, 90])
```

## 🔄 **ENHANCED CALIBRATION WITH OPERATIONAL DATA**

### **Park-to-Park Similarity Transfer**

```yaml
enhanced_calibration_methodology:
  
  # Improved site similarity vector (includes corrosion factors)
  site_characterization:
    - turbulence_intensity_normalized: 0.30    # Highest weight (fatigue impact)
    - temperature_cycling_factor: 0.20         # Thermal stress
    - salinity_exposure_level: 0.15            # Corrosion critical
    - humidity_classification: 0.15            # Environmental degradation
    - wind_speed_normalized: 0.10              # Operating frequency
    - terrain_uv_factors: 0.10                 # Material degradation
    
  # Calibration confidence based on similarity
  calibration_transfer_rules:
    very_similar: (similarity_score < 0.15) → confidence = 90%
    moderately_similar: (0.15 ≤ score < 0.30) → confidence = 70%
    dissimilar: (score ≥ 0.30) → use_fleet_data_only
    
  # Operational data integration by lifecycle phase  
  calibration_by_operational_years:
    years_1_3: "Direct infant mortality parameter updates (β₁, η₁)"
    years_4_8: "Useful life rate calibration with high confidence"
    years_9_15: "Early wear-out trend detection and extrapolation"
    years_16+: "Full three-phase validation and refinement"
```

## 💡 **CORE VALUE PROPOSITION**

### **Physics-Maximized Component Failure Rate Simulator**

**Replace arbitrary constant failure rates with:**
- **Physics-based calculations** from readily available site and OEM data
- **Three-phase realistic behavior** capturing actual component lifecycle patterns  
- **Uncertainty quantification** providing P10/P50/P90 failure rate bands
- **Calibration capability** improving accuracy with operational experience
- **Seamless integration** with existing wind farm business case simulation

**Technical Focus:**
- **Input**: Enhanced site conditions + comprehensive OEM specifications
- **Process**: Physics-based three-phase Weibull parameter generation
- **Output**: Component-level annual failure probability distributions
- **Integration**: Your sophisticated app handles turbine/farm/business modeling

This approach builds the most realistic component failure rate foundation possible, letting your existing business case simulation platform leverage dramatically improved reliability projections for more accurate wind farm economic analysis.