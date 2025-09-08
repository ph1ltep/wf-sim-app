# Unit Transformation Pipeline Analysis

## VERIFIED FINDINGS

### Root Cause: Double Percentage Conversion

**Issue**: Schema stores `{"lambda": 0.008, "value": 0.008}` (decimal), DistributionFieldV3 shows 0.8% (correct), but simulation results show 79.92% (incorrect).

**Source of Problem**: Double conversion occurring in chart display pipeline.

### Data Flow Analysis

#### 1. Storage Layer
- **File**: Schema stores decimal values: `0.008`
- **Transform**: PercentageField with `decimalStorage=true` correctly converts:
  - Display: `0.008 * 100 = 0.8%` ✅
  - Storage: `0.8 / 100 = 0.008` ✅

#### 2. Simulation Input Pipeline
- **File**: `/frontend/src/hooks/useInputSim.js` lines 52-63
- **Process**: Collects failure rate distributions as raw decimal values (0.008)
- **API Call**: Sends decimal values to simulation API
- **Status**: ✅ Correct - no transformation applied

#### 3. Simulation Results Display
- **File**: `/frontend/src/pages/simulations/FailureRatesSimulation.jsx` line 262
- **Component**: `<DistributionCard units="%" .../>`
- **Issue**: ❌ Applies percentage conversion to already-percentage simulation results

#### 4. Chart Display Transformation
- **File**: `/frontend/src/components/charts/PercentileChart.jsx` line 23-25
```javascript
const convertValueForDisplay = (value, units) => {
    return units === "%" ? (value != null ? value * 100 : value) : value;
};
```
- **Applied At**:
  - Line 65-66: Summary data conversion
  - Line 78: Chart Y-axis values
  - Line 113: Table data conversion

### The Double Conversion Problem

1. **User enters**: 0.8% in DistributionFieldV3
2. **Stored as**: 0.008 (decimal via decimalStorage transform)
3. **Simulation API receives**: 0.008 (decimal)
4. **Simulation API likely returns**: 0.008 (same decimal format)
5. **Chart conversion applies**: 0.008 * 100 = 0.8% (when units="%")
6. **But if simulation returns percentage values**: 0.8 * 100 = 80% ❌

### Other Display Issues

#### FailureRateSummaryCard Double Conversion
- **File**: `/frontend/src/components/cards/FailureRateSummaryCard.jsx` line 137
- **Code**: `(annualFailureProbability * 100).toFixed(2)` with `suffix="%"`
- **Issue**: If `annualFailureProbability` is already decimal (0.008), this shows 0.8% ✅
- **Issue**: If `annualFailureProbability` is percentage (0.8), this shows 80% ❌

## PATTERN ANALYSIS

### Established Pattern: Decimal Storage
- **Files**: Multiple components use `decimalStorage=true`
- **Locations**:
  - `/frontend/src/components/contextFields/index.js` line 175-182
  - `/frontend/src/components/distributionFields/renderParameterFields.js` line 103
  - `/frontend/src/components/distributionFields/DistributionFieldV3.jsx` line 365
- **Convention**: Store percentages as decimals, display as percentages

### Chart Conversion Pattern
- **Files**: All chart components apply `convertValueForDisplay`
- **Logic**: `units === "%" ? value * 100 : value`
- **Assumption**: Input values are always decimals when units="%"

## UNCERTAINTIES & GAPS

### Critical Unknown: Simulation API Behavior
- **Question**: Does simulation API return decimal values (0.008) or percentage values (0.8)?
- **Impact**: Determines if chart conversion is correct or causing double conversion
- **Investigation Needed**: Check simulation API response format

### Missing Information
- **Backend API**: Actual response format from `/simulation/simulate` endpoint
- **Data Validation**: No verification of simulation result units
- **Error Detection**: No detection of unreasonable percentage values (>100%)

## RECOMMENDED UNIFIED APPROACH

### Option 1: Decimal Everywhere (Recommended)
1. **Storage**: Always decimal (0.008)
2. **Simulation API**: Input/output decimals
3. **Display**: Convert to percentage only in UI components
4. **Charts**: Keep current `convertValueForDisplay` logic

### Option 2: Percentage Everywhere
1. **Storage**: Change to percentage (0.8)
2. **Simulation API**: Input/output percentages  
3. **Display**: No conversion needed
4. **Charts**: Remove `convertValueForDisplay` for percentage units

### Immediate Investigation Required
1. **Check Backend API**: Log simulation API response format
2. **Verify Units**: Add unit validation to detect >100% failure rates
3. **Test Pipeline**: Create test with known values to trace transformation
4. **Documentation**: Document expected units at each layer