# Market Factors Dynamic Object Keys Pattern Analysis

## VERIFIED FINDINGS

### Storage Structure Pattern
**Settings Storage (Configuration):**
```
settings.project.economics.marketFactors.factors = {
  "baseEscalationRate": { id: "baseEscalationRate", name: "...", distribution: {...} },
  "factor_xyz": { id: "factor_xyz", name: "...", distribution: {...} },
  // Dynamic component IDs as object keys
}
```

**Simulation Storage (Results):**
```
simulation.inputSim.marketFactors = {
  "baseEscalationRate": { distribution: {...}, results: [...] },
  "factor_xyz": { distribution: {...}, results: [...] },
  // Same component IDs as object keys
}
```

### Key Pattern Analysis
1. **Dynamic Key Generation**: Component IDs become object keys directly
2. **Object Structure**: NOT arrays - objects with dynamic keys
3. **ID Consistency**: Same ID used in both settings and simulation paths
4. **Access Pattern**: `Object.values()` to convert to arrays for UI display

### Schema Definition (from /schemas/yup/scenario.js:170-176)
```javascript
factors: Yup.mixed().default(() => {
    // Convert default array to object with dynamic keys
    return DEFAULT_MARKET_FACTORS.reduce((acc, factor) => {
        acc[factor.id] = factor;
        return acc;
    }, {});
})
```

### useInputSim.js Collection Pattern (Lines 43-50)
```javascript
// Add market factor distributions from dynamic key object structure
const marketFactorsObject = scenarioData.settings.project?.economics?.marketFactors?.factors || {};
// Convert object values to array and filter out non-object entries
const marketFactorsArray = Object.values(marketFactorsObject).filter(factor => 
    factor && typeof factor === 'object' && factor.distribution
);
marketFactorsArray.forEach(factor => {
    distributions.push(factor.distribution);
});
```

### useInputSim.js Storage Pattern (Lines 128-131)
```javascript
if (marketFactorIds.includes(key)) {
    // Store market factor results with dynamicKeys option
    const path = ['simulation', 'inputSim', 'marketFactors', key];
    marketFactorsUpdates.push({ path, value: result });
}
```

### MarketFactors.jsx UI Pattern (Lines 106-113)
```javascript
// Get market factors object and convert to array for table display
const marketFactorsObject = useMemo(() => {
    const factors = getValueByPath(['settings', 'project', 'economics', 'marketFactors', 'factors'], {});
    return factors;
}, [getValueByPath]);

const marketFactorsArray = useMemo(() => {
    return Object.values(marketFactorsObject);
}, [marketFactorsObject]);
```

### DistributionFieldV3 Path Pattern (Line 80)
```javascript
path={['settings', 'project', 'economics', 'marketFactors', 'factors', record.id, 'distribution']}
```

## PATTERN ANALYSIS

### Established Pattern Consistency (3+ Examples)
1. **Object with Dynamic Keys**: All examples use `{ [componentId]: componentData }` structure
2. **Object.values() Conversion**: Consistent pattern to convert to arrays for UI
3. **ID as Key**: Component ID becomes the object key directly
4. **Distribution Storage**: Each component has a `distribution` property
5. **Simulation Results**: Same key structure used in simulation storage

### Component ID Generation Pattern
- Format: `factor_${timestamp}_${random}` for new factors
- Example: `factor_1234567890_abc`
- Default: `baseEscalationRate` for base factor

### updateByPath with Dynamic Keys
- Uses `{ dynamicKeys: true }` option for simulation results
- Allows dynamic key creation in simulation.inputSim.marketFactors

## RECOMMENDATIONS

### For Failure Rates Implementation
The failure rates should follow the EXACT same pattern:

**Settings Path:**
```
settings.project.equipment.failureRates.components = {
  "component_xyz": { id: "component_xyz", name: "...", distribution: {...}, enabled: true },
  // Component IDs as object keys
}
```

**Simulation Path:**
```
simulation.inputSim.failureRates = {
  "component_xyz": { distribution: {...}, results: [...] },
  // Same component IDs as object keys
}
```

**UI Collection Pattern:**
```javascript
const failureRatesObject = getValueByPath(['settings', 'project', 'equipment', 'failureRates', 'components'], {});
const failureRatesArray = Object.values(failureRatesObject).filter(component => 
    component && typeof component === 'object' && component.enabled && component.distribution
);
```

**DistributionFieldV3 Path:**
```javascript
path={['settings', 'project', 'equipment', 'failureRates', 'components', record.id, 'distribution']}
```

## VERIFIED CONSTRAINTS

1. **Object Structure Required**: Must be object with dynamic keys, NOT array
2. **ID Consistency**: Same component ID must be used as object key in both settings and simulation
3. **Object.values() Pattern**: UI must convert object to array for display
4. **Dynamic Keys Option**: Simulation updates must use `{ dynamicKeys: true }`
5. **Filter Pattern**: Must filter by enabled status and validate object structure

## FILES REFERENCED
- `/frontend/src/pages/scenario/economics/MarketFactors.jsx` (Lines 80, 106-113)
- `/frontend/src/hooks/useInputSim.js` (Lines 43-50, 128-131)
- `/schemas/yup/scenario.js` (Lines 170-176)
- `/frontend/src/pages/simulations/MarketFactorsSimulation.jsx` (Lines 49-56)