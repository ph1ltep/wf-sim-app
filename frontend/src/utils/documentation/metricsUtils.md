# Metrics Utils Documentation

## Overview

The metricsUtils.js module provides a centralized, extensible system for calculating and managing project metrics. It integrates with ContextFields to automatically update calculated values when dependencies change, supporting both direct field updates and form-based batch updates.

## Core Features

- Centralized Calculations: All metric calculations in one place
- Prospective State Support: Calculate metrics with pending changes before committing
- Dual Mode Operation: Handles both direct field updates and form batch updates
- Context Integration: Seamless updates to scenario context
- Extensible Registry: Easy to add new metrics
- Batch Updates: Efficient single-context update for all metrics
- Error Handling: Robust error handling and logging

## Available Metrics

| Metric | Description | Dependencies | Storage Path |
|--------|-------------|--------------|--------------|
| wacc | Weighted Average Cost of Capital | financing, currency | settings.metrics.wacc |
| totalMW | Total project capacity | wind farm | settings.metrics.totalMW |
| grossAEP | Gross Annual Energy Production | wind farm | settings.metrics.grossAEP |
| netAEP | Net AEP after losses | wind farm | settings.metrics.netAEP |
| componentQuantities | Component counts by type | wind farm | settings.metrics.componentQuantities |
| debtToEquityRatio | Debt-to-equity ratio | financing | settings.metrics.debtToEquityRatio |

## Prospective Changes Format

### Direct Mode (Single Field Update)
```javascript
// Single field change affecting metrics
const prospectiveChanges = {
  'settings.modules.financing.debtRatio': 75
};
```

### Form Mode (Batch Field Updates)
```javascript
// ALL form fields included for accurate metric calculation
const prospectiveChanges = {
  'settings.modules.financing.debtRatio': 75,
  'settings.modules.financing.costOfEquity': 8.5,
  'settings.modules.financing.effectiveTaxRate': 25,
  'settings.project.windFarm.numWTGs': 30,
  'settings.project.windFarm.mwPerWTG': 3.0
};
```

Important: In form mode, include ALL form field values so metrics calculate with the complete prospective state, not just individual field changes.

## Usage Examples

### Calculate Individual Metric
```javascript
import { calculateMetric } from '../utils/metricsUtils';

// Direct mode - single field change
const wacc = calculateMetric('wacc', scenarioData, {
  'settings.modules.financing.debtRatio': 75
});

// Form mode - all pending form values
const wacc = calculateMetric('wacc', null, allFormFieldValues);
```

### Calculate Affected Metrics (Recommended for ContextFields)
```javascript
import { calculateAffectedMetrics } from '../utils/metricsUtils';

// Direct mode - single field affecting multiple metrics
const updates = calculateAffectedMetrics(
  ['wacc', 'debtToEquityRatio'], 
  null, 
  { 'settings.modules.financing.debtRatio': 75 }
);
// Returns: { 'settings.metrics.wacc': 5.23, 'settings.metrics.debtToEquityRatio': 3.0 }

// Form mode - multiple fields affecting multiple metrics
const updates = calculateAffectedMetrics(
  ['wacc', 'totalMW', 'netAEP'], 
  null,
  {
    'settings.modules.financing.costOfEquity': 8.5,
    'settings.modules.financing.debtRatio': 70,
    'settings.project.windFarm.numWTGs': 30,
    'settings.project.windFarm.mwPerWTG': 3.0,
    'settings.project.windFarm.capacityFactor': 40
  }
);
```

### Batch Update with Field Changes
```javascript
// ContextField integration pattern
const fieldUpdate = { 'settings.modules.financing.debtRatio': 80 };
const metricUpdates = calculateAffectedMetrics(['wacc'], null, fieldUpdate);
const batchUpdate = { ...fieldUpdate, ...metricUpdates };

 // Single updateByPath call with field + metrics
await updateByPath(batchUpdate);
```

## Adding New Metrics

### Registry Addition (Recommended)
```javascript
// In metricsUtils.js METRIC_CALCULATORS
lcoe: {
  calculator: calculateLCOE,
  dependencies: ['settings.modules.financing', 'settings.project.windFarm'],
  storePath: ['settings', 'metrics', 'lcoe']
}

// Add the calculator function
export const calculateLCOE = (financingParams, windFarmParams) => {
  // calculation logic using both parameter sets
  return lcoeValue;
};
```

## ContextField Integration

ContextFields use the affectedMetrics prop to declare which metrics they affect:

```javascript
// Direct mode - immediate calculation and update
<NumberField 
  path={['settings', 'modules', 'financing', 'debtRatio']}
  affectedMetrics={['wacc', 'debtToEquityRatio']}
  label="Debt Ratio"
/>

// Form mode - metrics calculated with all form values on submit
<ContextForm affectedMetrics={['wacc', 'totalMW', 'netAEP']}>
  <NumberField path={[...]} />
  <NumberField path={[...]} />
  <NumberField path={[...]} />
</ContextForm>
```

## Best Practices

- Form Mode: Always include ALL form field values in prospectiveChanges
- Direct Mode: Include only the changing field in prospectiveChanges
- Batch Updates: Use single updateByPath call with field + metric updates
- Dependencies: Clearly define what data each metric needs
- Storage Paths: Use consistent metric storage location
- Error Handling: Handle edge cases and null values in calculators