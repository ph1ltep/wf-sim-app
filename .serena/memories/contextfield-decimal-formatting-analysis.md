# ContextField Decimal Formatting Issue Analysis

## Problem Summary
The failure rate field has formatting issues where:
1. Precision (2 decimal places) not being respected 
2. Commas appearing to the right of the decimal point (incorrect formatting)
3. Affects PercentageField with `decimalStorage={true}`

## Key Components Involved

### 1. PercentageField (lines 168-197 in index.js)
- Uses `decimalStorage={true}` for failure rates
- Has `decimalTransform` that converts: 0.008 ↔ 0.8%
- Wraps NumberField component
- Passes `precision={2}` through props

### 2. NumberField (lines 65-106 in index.js) 
- **CRITICAL ISSUE IDENTIFIED**: Default formatter/parser logic
- Line 81: `const defaultFormatter = (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')`
- Line 84: `const defaultParser = (value) => value?.replace(/,/g, '')`
- Passes precision to InputNumber via componentProps

### 3. ContextField Transform Chain
- `decimalTransform.toDisplay`: 0.008 → 0.8 (for display)
- InputNumber with precision=2 formats: 0.8
- `defaultFormatter` adds commas: "0,8" (WRONG!)
- `decimalTransform.toStorage`: back to decimal

## Root Cause Analysis

The issue is in NumberField's `defaultFormatter` (line 81):
```javascript
const defaultFormatter = (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
```

This regex `\B(?=(\d{3})+(?!\d))` adds commas for thousand separators, but it doesn't account for decimal numbers properly. For a value like "0.8", it treats the digits after decimal as if they need comma separation.

For "0.8":
- The regex sees "8" and treats it as needing comma separation
- Results in "0,8" instead of "0.8"

## The Transform Flow Problem
1. Storage: 0.008 (decimal stored value)
2. Display transform: 0.008 × 100 = 0.8 
3. InputNumber precision=2: still 0.8
4. NumberField formatter: "0.8" → "0,8" (BROKEN!)
5. User sees: "0,8%" instead of "0.8%"

## Usage Context
- Used in FailureRatesSimulation.jsx with precision={2}, decimalStorage={true}
- Used in DistributionFieldV3.jsx for percentage fields
- Used in renderParameterFields.js for distribution parameters