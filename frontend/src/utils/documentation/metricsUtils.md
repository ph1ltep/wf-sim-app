# Metrics Utils Documentation

## Overview

The metricsUtils.js module provides a centralized, extensible system for calculating and managing project metrics. It integrates seamlessly with ContextFields and ContextForm to automatically update calculated values when dependencies change, supporting both direct field updates and form-based batch updates.

## Core Features

- Centralized Calculations: All metric calculations in one place
- Automatic Updates: Metrics update automatically when field dependencies change
- Dual Mode Operation: Handles both direct field updates and form batch updates
- Prospective State Support: Calculate metrics with pending changes before committing
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

## Integration with ContextFields

### Direct Mode (Immediate Updates)
ContextFields with affectedMetrics prop automatically calculate and update metrics when field values change:

```jsx
// Single metric affected
<NumberField 
  path={['settings', 'modules', 'financing', 'debtRatio']}
  label="Debt Ratio"
  affectedMetrics={['wacc']}
/>

// Multiple metrics affected
<NumberField 
  path={['settings', 'project', 'windFarm', 'numWTGs']}
  label="Number of WTGs"
  affectedMetrics={['totalMW', 'grossAEP', 'netAEP', 'componentQuantities']}
/>
```

Behavior: When user changes the field value, metrics are calculated with the new value and both field + metrics are updated in a single batch call to updateByPath.

### Form Mode (Batch Updates on Submit)
ContextForm with affectedMetrics prop calculates metrics using ALL form field values when the form is submitted:

```jsx
// Form-level metric declaration
<ContextForm 
  path={['settings', 'modules', 'financing']}
  affectedMetrics={['wacc', 'debtToEquityRatio']}
>
  <NumberField path="debtRatio" label="Debt Ratio" />
  <NumberField path="costOfEquity" label="Cost of Equity" />
  <NumberField path="effectiveTaxRate" label="Tax Rate" />
</ContextForm>
```

Behavior: Metrics are calculated with the complete form state (all field values) when form is submitted, ensuring accurate calculations based on the full prospective state.

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

## Advanced Usage Examples

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

### Calculate Affected Metrics (Used by ContextFields)
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

### Batch Update Pattern (Used Internally)
```javascript
// ContextField integration pattern
const fieldUpdate = { 'settings.modules.financing.debtRatio': 80 };
const metricUpdates = calculateAffectedMetrics(['wacc'], null, fieldUpdate);
const batchUpdate = { ...fieldUpdate, ...metricUpdates };

// Single updateByPath call with field + metrics
await updateByPath(batchUpdate);
```

## Real-World Integration Examples

### Financing Module with Real-Time WACC
```jsx
const FinancingModule = () => {
  const wacc = getValueByPath(['settings', 'metrics', 'wacc'], 0);
  
  return (
    <div>
      {/* Real-time WACC display */}
      <Statistic title="WACC" value={wacc} suffix="%" />
      
      {/* Fields that affect WACC */}
      <PercentageField
        path={['settings', 'modules', 'financing', 'debtRatio']}
        label="Debt Ratio"
        affectedMetrics={['wacc', 'debtToEquityRatio']}
      />
      <PercentageField
        path={['settings', 'modules', 'financing', 'costOfEquity']}
        label="Cost of Equity"
        affectedMetrics={['wacc']}
      />
    </div>
  );
};
```

### Project Settings with Multiple Metrics
```jsx
const ProjectSettings = () => {
  const calculatedMetrics = getValueByPath(['settings', 'metrics'], {});
  
  return (
    <div>
      {/* Fields affecting project metrics */}
      <NumberField
        path={['settings', 'project', 'windFarm', 'numWTGs']}
        label="Number of WTGs"
        affectedMetrics={['totalMW', 'grossAEP', 'netAEP', 'componentQuantities']}
      />
      <NumberField
        path={['settings', 'project', 'windFarm', 'mwPerWTG']}
        label="MW per WTG"
        affectedMetrics={['totalMW', 'grossAEP', 'netAEP']}
      />
      
      {/* Display calculated metrics */}
      <ProjectMetrics calculatedValues={calculatedMetrics} />
    </div>
  );
};
```

### Form Mode with Complex Dependencies
```jsx
const FinancingForm = () => {
  return (
    <ContextForm 
      path={['settings', 'modules', 'financing']}
      affectedMetrics={['wacc', 'debtToEquityRatio']}
    >
      <FormSection title="Debt Parameters">
        <NumberField path="debtRatio" label="Debt Ratio" />
        <NumberField path="costOfOperationalDebt" label="Cost of Debt" />
      </FormSection>
      
      <FormSection title="Equity Parameters">
        <NumberField path="costOfEquity" label="Cost of Equity" />
        <NumberField path="effectiveTaxRate" label="Tax Rate" />
      </FormSection>
      
      {/* Metrics calculated with ALL form values on submit */}
    </ContextForm>
  );
};
```

## Adding New Metrics

### Step 1: Create Calculator Function
```javascript
// Add to metricsUtils.js
export const calculateLCOE = (financingParams, windFarmParams) => {
  if (!financingParams || !windFarmParams) return 0;
  
  const { capex, opex } = financingParams;
  const { netAEP } = windFarmParams;
  const projectLife = 20; // years
  
  const totalCosts = capex + (opex * projectLife);
  const totalEnergy = netAEP * projectLife;
  
  return totalCosts / totalEnergy; // $/MWh
};
```

### Step 2: Add to Registry
```javascript
// Add to METRIC_CALCULATORS in metricsUtils.js
const METRIC_CALCULATORS = {
  // existing metrics...
  lcoe: {
    calculator: calculateLCOE,
    dependencies: ['settings.modules.financing', 'settings.project.windFarm'],
    storePath: ['settings', 'metrics', 'lcoe']
  }
};
```

### Step 3: Use in Component
```jsx
<NumberField 
  path={['settings', 'modules', 'financing', 'capex']}
  label="CAPEX"
  affectedMetrics={['lcoe']} // Now includes your new metric
/>
```

## Performance Considerations

- Automatic Batching: All metric updates use single updateByPath calls
- Prospective Calculations: Metrics calculated before context updates
- Efficient Dependencies: Only declared metrics are calculated
- Form Isolation: Form mode prevents unnecessary recalculations during editing
- Error Isolation: Failed metric calculations don't break field updates

## Best Practices

### Do's
- Declare metrics at appropriate level: Field-level for individual impacts, form-level for complex dependencies
- Use prospective state: Always calculate metrics with pending changes, not current state
- Keep calculators pure: No side effects in calculator functions
- Handle edge cases: Check for null/undefined values in calculators
- Use descriptive metric names: Clear, meaningful names for easy identification

### Don'ts
- Don't mix modes: Avoid both field-level and form-level metrics in same form
- Don't calculate manually: Let ContextFields handle metric updates automatically
- Don't ignore dependencies: Ensure all required data paths are in dependencies array
- Don't mutate input data: Keep calculator functions pure and immutable

## Troubleshooting

### Metrics not updating
```jsx
// ✅ Correct: Declare affectedMetrics
<NumberField 
  path="debtRatio" 
  affectedMetrics={['wacc']}
/>

// ❌ Incorrect: Missing affectedMetrics
<NumberField path="debtRatio" />
```

### Form metrics calculating too early
```jsx
// ✅ Correct: Form-level declaration
<ContextForm affectedMetrics={['wacc']}>
  <NumberField path="debtRatio" />
  <NumberField path="costOfEquity" />
</ContextForm>

// ❌ Incorrect: Field-level in form mode
<ContextForm>
  <NumberField path="debtRatio" affectedMetrics={['wacc']} />
</ContextForm>
```

### Metrics showing stale values
```jsx
// ✅ Correct: Get metrics from context
const metrics = getValueByPath(['settings', 'metrics'], {});

// ❌ Incorrect: Manual calculation
const wacc = calculateWACC(financingData); // Bypasses automatic system
```