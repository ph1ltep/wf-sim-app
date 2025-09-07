# Failure Rates Units Mismatch Analysis

## VERIFIED FINDINGS:

### **1. Table Column Headers vs Distribution Field Units**

**FailureRates.jsx Table (Line 539-547):**
- Column header: `'Rate/Year'`
- Display format: `formatDistribution()` shows percentage (e.g., "2.50%")
- Code: `{(rate * 100).toFixed(2)}%` - multiplies by 100 and adds % symbol

**DistributionFieldV3 Configuration (Lines 69-70):**
- `addonAfter="failures/year"`
- `tooltip="Annual probability of component failure"`
- `valueType="percentage"`

**DISCONNECT**: Table shows "Rate/Year" but displays as percentage, while DistributionFieldV3 shows "failures/year" in addon text.

### **2. Schema Default Values and Units**

**componentFailureRates.js defaults:**
- Blades: lambda: 0.008, value: 0.008
- Blade Bearings: lambda: 0.014, value: 0.014  
- Transformers: lambda: 0.010, value: 0.010
- Gearboxes: lambda: 0.025, value: 0.025
- Generators: lambda: 0.020, value: 0.020
- Converters: lambda: 0.022, value: 0.022
- Main Bearings: lambda: 0.018, value: 0.018
- Yaw Systems: lambda: 0.012, value: 0.012

**INTERPRETATION**: Values like 0.025 represent 2.5% annual failure probability OR 0.025 failures/year per component.

### **3. Exponential Distribution Parameter Handling**

**exponential.js metadata (Lines 274-298):**
- `value` parameter: "Mean value" with tooltip "Mean value of the distribution (1/lambda)"
- `lambda` parameter: "Rate parameter of the exponential distribution"
- For exponential: mean = 1/lambda, so if lambda=0.025, mean = 40 years

**MATHEMATICAL RELATIONSHIP**: 
- Lambda (rate) = failures per unit time
- Mean = 1/lambda = expected time between failures
- If lambda = 0.025 failures/year, mean time between failures = 40 years

### **4. Simulation Results Display**

**FailureRatesSimulation.jsx (Line 261):**
- `units="failures/year"`
- Shows results consistently as "failures/year"

**CONSISTENCY**: Simulation page correctly shows "failures/year" units.

## PATTERN ANALYSIS:

### **Established Codebase Patterns:**
1. **Schema defaults**: Use decimal values (0.008-0.025) representing annual failure rates
2. **Mathematical foundation**: Exponential distribution with lambda as rate parameter
3. **Simulation display**: Consistently uses "failures/year"
4. **Table formatting**: Converts to percentage for display (multiplies by 100)

### **Units Interpretation Chain:**
```
Schema: 0.025 (failures/year) 
↓
Table: 2.50% (percentage display)
↓  
Distribution Field: Shows as "failures/year" addon
↓
Simulation: "failures/year" units
```

## UNCERTAINTIES & GAPS:

1. **Quantity Factor Calculation**: Need to verify how component quantities (e.g., 300 turbines × 3 blades = 900 total blades) affect failure rate calculations in simulation engine
2. **User Mental Model**: Unclear if users expect to input "probability per component per year" or "total expected failures per year across all components"
3. **Rate vs Probability Distinction**: Whether 0.025 represents:
   - Probability (2.5% chance per component per year) 
   - Rate (0.025 events per component per year)
   - These are approximately equal for small values but mathematically different

## RECOMMENDATIONS:

### **Immediate Fixes:**
1. **Standardize table column header**: Change "Rate/Year" to "Failure Rate" or "Annual Rate"
2. **Consistent addon text**: Use either "failures/year" or "%/year" consistently across all interfaces
3. **Clear tooltips**: Specify whether input represents "per component" or "total expected"

### **Validation Needed:**
1. **Backend calculation**: Verify simulation engine correctly applies quantity multiplication
2. **User testing**: Confirm expected input format (rate vs probability vs percentage)
3. **Documentation**: Add clear examples of how 0.025 input translates to expected failures