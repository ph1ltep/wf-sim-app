# DistributionFieldV3 Percentage Value Handling Analysis

## VERIFIED FINDINGS:

### How DistributionFieldV3 Handles `valueType="percentage"`

**Component Structure:**
- DistributionFieldV3 (lines 358-369) conditionally renders `PercentageField` when `valueType === 'percentage'`
- PercentageField is defined in `/frontend/src/components/contextFields/index.js` (lines 168-187)

### PercentageField Implementation:
```javascript
export const PercentageField = ({
  path,
  label,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  ...rest
}) => (
  <NumberField
    path={path}
    label={label}
    tooltip={tooltip}
    min={min}
    max={max}
    step={step}
    addonAfter="%" // Display % as addon
    {...rest}
  />
);
```

**CRITICAL DISCOVERY:** PercentageField is just a wrapper around NumberField with:
- Default range: 0-100
- Addon display: "%" 
- **NO VALUE TRANSFORMATION** between storage and display

### Value Flow Analysis:

**Storage Layer (Schema Defaults):**
- componentFailureRates.js shows failure rates stored as decimal values
- Example: `lambda: 0.008` (0.8% stored as 0.008)
- Example: `lambda: 0.025` (2.5% stored as 0.025)

**Display Layer (PercentageField):**
- Takes stored value directly from context
- NO multiplication by 100 for percentage display
- If stored as 0.008, displays as "0.008%"
- If stored as 0.025, displays as "0.025%"

### Current Usage Pattern:

**FailureRates.jsx (lines 54-71):**
```javascript
<DistributionFieldV3
  path={['settings', 'project', 'equipment', 'failureRates', 'components', record.id, 'distribution']}
  valueType="percentage"
  step={0.001}
  addonAfter="% chance/year"
/>
```

**Schema Values (componentFailureRates.js):**
```javascript
// Blades component
parameters: { lambda: 0.008, value: 0.008 }
// This means 0.8% failure rate stored as 0.008

// Gearboxes component  
parameters: { lambda: 0.025, value: 0.025 }
// This means 2.5% failure rate stored as 0.025
```

## PATTERN ANALYSIS:

### Established Codebase Convention:
Based on analysis of multiple percentage field usages:

1. **Financial Percentages** (Financing.jsx):
   - Debt ratios, interest rates typically stored as percentage values (0-100)
   - Example: 75% debt ratio stored as 75, not 0.75

2. **Failure Rate Percentages** (Component failure rates):
   - Stored as decimal probability values (0-1 range)  
   - Example: 0.8% stored as 0.008, not 0.8

### Value Conversion Requirements:

**NO AUTOMATIC CONVERSION EXISTS** - PercentageField displays raw stored values

**Current Behavior:**
- Stored: 0.008 → Displayed: "0.008%"
- User sees: "0.008%" (confusing - should be "0.8%")

**Expected Behavior:**  
- Stored: 0.008 → Displayed: "0.8%" 
- User sees: "0.8%" (intuitive percentage display)

## UNCERTAINTIES & GAPS:

1. **Transform Implementation**: PercentageField does NOT implement value transformation
2. **Schema Consistency**: Need to determine if schema defaults should be updated or if UI should transform
3. **User Experience Impact**: Current display (0.008%) vs expected (0.8%) creates confusion
4. **Backward Compatibility**: Changing transformation affects existing data interpretation

## RECOMMENDATIONS:

### Option 1: Update PercentageField with Transformation
Add bidirectional transform to PercentageField:
- Storage: percentage value ÷ 100 (0.8% → 0.008)
- Display: decimal value × 100 (0.008 → 0.8%)

### Option 2: Update Schema Default Values
Scale up schema defaults to match percentage display:
- Change `lambda: 0.008` to `lambda: 0.8` in defaults
- Requires data migration for existing scenarios

### Option 3: Use Different Field Type
Create specialized FailureRateField with appropriate transformation logic

**RECOMMENDATION: Option 1** - Update PercentageField with transformation logic for consistency with user expectations while maintaining backward compatibility with existing stored decimal values.