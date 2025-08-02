# Cube Metrics System API Documentation v2.0

## Overview

The Cube Metrics System transforms time-series cube source data into scalar business metrics. It features declarative configuration, dependency resolution, parameterized aggregations, custom transformers, and automatic validation.

## Processing Pipeline & Execution Order

The metrics system executes in a specific order to ensure dependencies are available when needed:

### 1. Reference Loading
Global and local references are loaded from scenario data using `getValueByPath()`.

### 2. Metric Processing Order
Metrics are processed in two phases:
- **Direct Metrics** (type: 'direct') - Process first, depend only on sources and references
- **Indirect Metrics** (type: 'indirect') - Process second, can depend on other metrics

Within each type, metrics are sorted by ascending priority value.

### 3. Per-Metric Processing Steps
For each metric, the following steps execute in order:

1. **Dependency Resolution** - Resolve all source, metric, and reference dependencies
2. **Aggregations** - Apply aggregation operations to time-series data → scalar values
3. **Transformer** - Apply custom transformation logic using full context
4. **Default Values** - Set values from aggregations if transformer absent/incomplete
5. **Operations** - Apply post-processing operations using other metrics/references

## Data Flow & Types

### Input/Output Data Types

| Stage | Input Type | Output Type | Purpose |
|-------|------------|-------------|---------|
| **Aggregations** | Time-series arrays (`DataPointSchema[]`) | Scalar values + stats | Reduce time-series to single values per percentile |
| **Transformers** | Full context (sources, metrics, references) | Any format → normalized to `CubeMetricResultSchema[]` | Custom business logic with complete data access |
| **Operations** | Scalar values from base metric | Scalar values | Post-process using other metrics/references |

### Aggregation Data Flow
```javascript
// Input: Time-series data per percentile
sources.netCashflow[50].data = [
  {year: 1, value: 100000},
  {year: 2, value: 120000}
]

// Aggregation processes each percentile separately
// Output: Scalar result per percentile + stats
aggregationResults[0] = {
  percentile: {value: 50},
  value: 0, // Set by transformer or default
  stats: {
    npvValue: 180000,    // From NPV aggregation
    avgValue: 110000     // From mean aggregation
  }
}
```

### Transformer Context Access
Transformers receive comprehensive context and can return flexible formats:
```javascript
// Full context access
const transformer = (dependencies, context) => {
  // Access resolved sources, metrics, references
  const cashflowData = dependencies.sources.projectCashflow[50].data;
  const financingParams = dependencies.references.financing;
  const existingMetric = dependencies.metrics.projectIRR;
  
  // Return any format - automatically normalized
  return 12.5; // Scalar → replicated per percentile
  // OR return full array for percentile-specific values
};
```

### Dependency Access Pattern
All data is accessed through the consolidated `dependencies` object:

```javascript
// ✅ Source data access (per percentile)
const netCashflowP50 = dependencies.sources.netCashflow[50].data;
const projectCashflowP75 = dependencies.sources.projectCashflow[75].data;

// ✅ Metric data access (previously computed metrics)
const projectIRRMetric = dependencies.metrics.projectIRR;
const projectIRRValue = extractPercentileMetric(projectIRRMetric, 50)?.value || 0;

// ✅ Reference data access (consolidated global + local)
const discountRate = dependencies.references.financing.costOfEquity;
const projectLife = dependencies.references.projectLife;
```

## Core Processing API

### `computeMetricsData()`
Main processing pipeline that transforms metrics registry into computed metric data.

**Parameters**:
```javascript
computeMetricsData(
  metricsRegistry,      // CubeMetricsRegistrySchema
  availablePercentiles, // number[] - [10, 25, 50, 75, 90]
  getValueByPath,       // Function - (path: string[]) => any
  getSourceData,        // Function - (filters) => sourceData
  customPercentile      // Object|null - {sourceId: percentileValue}
)
```

**Returns**: `CubeMetricDataSchema[]`

**Processing Order**: Direct metrics (type: 'direct') first, then indirect metrics (type: 'indirect'), sorted by priority within each type.

---

## Registry Configuration

### Metrics Registry Schema
```javascript
const METRICS_REGISTRY = {
  references: [
    { id: 'financing', path: ['settings', 'modules', 'financing'] }
  ],
  
  metrics: [
    {
      id: 'projectIRR',
      priority: 100,
      dependencies: [
        { id: 'projectCashflow', type: 'source' },
        { id: 'financing', type: 'reference' }
      ],
      aggregations: [],
      transformer: calculateProjectIRR,
      operations: [],
      metadata: {
        name: 'Project IRR',
        type: 'direct',
        description: 'Internal rate of return for project cash flows',
        formatter: (value) => `${value.toFixed(2)}%`
      }
    }
  ]
}
```

### Dependency Types
| Type | Resolution Method | Input Data Type | Example Usage |
|------|------------------|-----------------|---------------|
| `source` | `getSourceData({sourceId})` | `{[percentile]: {data: DataPointSchema[]}}` | Time-series cube data per percentile |
| `metric` | Previously computed metrics | `CubeMetricDataSchema` | Access other calculated metrics |
| `reference` | Global/local references via `getValueByPath()` | `any` | Scenario configuration parameters |

---

## Aggregation System

### Operations Overview
Aggregations take time-series data from cube sources and convert them to scalar values. Each operation processes the time-series data for each percentile separately, producing a scalar result that gets stored in the `stats` object.

| Operation | Input | Output | Parameters | Description |
|-----------|-------|--------|------------|-------------|
| `min` | `DataPointSchema[]` | `number` | None | Minimum value across all time points |
| `max` | `DataPointSchema[]` | `number` | None | Maximum value across all time points |
| `mean` | `DataPointSchema[]` | `number` | None | Average value across all time points |
| `sum` | `DataPointSchema[]` | `number` | None | Total sum of all time points |
| `stdev` | `DataPointSchema[]` | `number` | None | Standard deviation of values |
| `npv` | `DataPointSchema[]` | `number` | `discountRate: number` | Net Present Value calculation |
| `reduce` | `DataPointSchema[]` | `any` | `reducer: Function, initialValue: any` | Custom reducer function |

### How Aggregations Work
1. **Input**: Time-series data from cube sources (`{year, value}` arrays)
2. **Processing**: Each percentile's time-series is processed independently
3. **Output**: Scalar values stored in `aggregationResults[percentile].stats[outputKey]`
4. **Usage**: Transformers access via `context.aggregationResults` or used as default values

### Parameterized Aggregations
Parameters are resolved **once per metric** (not per percentile) using function callbacks that receive access to references and processed metrics:

```javascript
aggregations: [
  {
    sourceId: 'projectCashflow',
    operation: 'npv',
    outputKey: 'npvValue',
    isDefault: true,
    parameters: {
      discountRate: (refs, metrics) => {
        // Access financing parameters and apply risk adjustment
        const baseRate = (refs.financing.costOfEquity || 8) / 100;
        const riskPremium = (refs.riskAssessment?.premium || 0) / 100;
        return baseRate + riskPremium;
      }
    },
    filter: (year, value, refs) => year >= 0 // Only include operational years
  }
]
```

**Parameter Function Signature**: `(refs: Object, metrics: Object) => parameterValue`
- Called once per metric to resolve parameter values
- `refs`: Consolidated global and local references
- `metrics`: Previously computed metrics
- Return value is cached and used for all percentiles

**Filter Function Signature**: `(year: number, value: number, refs: Object) => boolean`
- Called for each data point to determine inclusion
- Return `true` to include the data point in aggregation

---

## Transformer System

### Purpose & Capabilities
Transformers are custom functions that implement business logic for calculating metrics. They have access to all resolved dependencies (sources, metrics, references) and aggregation results, making them powerful for complex calculations that can't be achieved through simple aggregations.

### Function Signature & Data Access
```javascript
transformer(dependencies, context) => any // Auto-normalized to CubeMetricResultSchema[]

// Dependencies object - Direct access to all data:
{
  sources: { 
    [sourceId]: { 
      [percentile]: { data: DataPointSchema[], metadata: Object } 
    } 
  },
  metrics: { [metricId]: CubeMetricDataSchema },
  references: { ...globalReferences, ...localReferences }
}

// Context object - Processing context and utilities:
{
  availablePercentiles: number[],
  aggregationResults: CubeMetricResultSchema[], // Results from aggregations
  customPercentile: Object|null,
  addAuditEntry: Function
}
```

### Return Value Flexibility
The `validateMetricDataStructure` function automatically normalizes any transformer return value:

| Return Type | Normalization | Use Case |
|-------------|---------------|----------|
| `CubeMetricResultSchema[]` | No change (already correct) | Full percentile-specific control |
| `CubeMetricResultSchema` | Replicated per percentile | Same calculation for all percentiles |
| `number` | Wrapped as value, replicated | Simple scalar metrics |
| `Object` | Used as value, replicated | Complex value objects |
| `string/boolean` | Converted to number, replicated | Primitive type conversion |

### Access Patterns for Different Data Types

```javascript
export const calculateProjectIRR = (dependencies, context) => {
  const { availablePercentiles, aggregationResults, addAuditEntry } = context;
  
  // Access source time-series data per percentile
  const cashflowP50 = dependencies.sources.projectCashflow[50].data;
  
  // Access other computed metrics
  const npvMetric = dependencies.metrics.projectNPV;
  const npvP75 = extractPercentileMetric(npvMetric, 75)?.value || 0;
  
  // Access aggregation results (scalars with stats)
  const aggregationP50 = aggregationResults.find(r => r.percentile.value === 50);
  const npvFromAggregation = aggregationP50?.stats?.npvValue || 0;
  
  // Access scenario parameters
  const discountRate = dependencies.references.financing.costOfEquity;
  
  // Process each percentile or return single value
  return availablePercentiles.map(percentile => {
    const cashflowData = dependencies.sources.projectCashflow[percentile].data;
    const irr = calculateIRR(cashflowData);
    
    return {
      percentile: { value: percentile },
      value: irr,
      stats: { cashflowYears: cashflowData.length }
    };
  });
};
```

---

## Operations System

### Purpose & Constraints
Operations are post-processing functions that modify metric results using values from other metrics or references. They operate on **scalar values only** and are applied after transformers have completed.

### Function Signature & Data Flow
```javascript
operation(baseValue, percentile, targetValue, references, metrics) => number

// Parameters:
// baseValue: number - Current metric value for this percentile
// percentile: number - Current percentile being processed (e.g., 50)
// targetValue: number|any - Value from target metric/reference for this percentile
// references: Object - Consolidated global and local references
// metrics: Object - All computed metrics (for advanced operations)
```

### Configuration & Target Resolution
```javascript
operations: [
  {
    id: 'projectIRR', // Target metric or reference ID
    operation: (baseValue, percentile, projectIRRValue, references, metrics) => {
      // Calculate IRR spread: Equity IRR - Project IRR
      return baseValue - projectIRRValue; // Both are scalar values
    }
  },
  {
    id: 'marketRate', // Reference ID
    operation: (baseValue, percentile, marketRate, references) => {
      // Risk premium over market rate
      return baseValue - marketRate;
    }
  }
]
```

### Target Value Resolution
Operations automatically resolve target values based on the `id`:

1. **Reference targets**: `targetValue = references[id]` (direct scalar access)
2. **Metric targets**: `targetValue = metrics[id].percentileMetrics.find(pm => pm.percentile.value === percentile).value`

This ensures operations always receive scalar values, maintaining simplicity and performance.

---

## Default Values & Fallback Logic

### Fallback Hierarchy
When transformers are absent, return incomplete results, or fail, the system uses this priority order:

1. **Transformer Result** - If transformer exists and returns valid, complete data
2. **Default Aggregation** - Uses aggregation marked with `isDefault: true`
3. **First Available Aggregation** - Uses first aggregation if no defaults specified
4. **Zero Value** - If no aggregations exist

### How Aggregation Results Become Default Values
Aggregation results are stored in the `stats` object of each percentile. When used as defaults:

```javascript
// Aggregation configuration
aggregations: [
  { sourceId: 'dscr', operation: 'min', outputKey: 'minValue', isDefault: false },
  { sourceId: 'dscr', operation: 'mean', outputKey: 'avgValue', isDefault: true },
  { sourceId: 'dscr', operation: 'max', outputKey: 'maxValue', isDefault: false }
]

// Resulting metric structure (when no transformer)
{
  percentile: { value: 50 },
  value: 1.35, // Uses 'avgValue' from isDefault: true aggregation
  stats: {
    minValue: 1.12,  // Available in stats
    avgValue: 1.35,  // Also in stats + used as main value
    maxValue: 1.58   // Available in stats
  }
}
```

### Transformer Access to Aggregation Results
Transformers can access aggregation results through the context:

```javascript
const transformer = (dependencies, context) => {
  const { aggregationResults } = context;
  
  // Access aggregation results per percentile
  const p50Results = aggregationResults.find(r => r.percentile.value === 50);
  const minDSCR = p50Results?.stats?.minValue || 0;
  const avgDSCR = p50Results?.stats?.avgValue || 0;
  
  // Use in custom calculation logic
  return customCalculation(minDSCR, avgDSCR);
};
```

---

## Helper Functions

### `extractPercentileMetric(metricData, percentile)`
Extract specific percentile result from computed metric data.

**Input**: `CubeMetricDataSchema` object, `number` percentile  
**Output**: `CubeMetricResultSchema` object or `null`

```javascript
const projectIRRMetric = dependencies.metrics.projectIRR;
const p50Result = extractPercentileMetric(projectIRRMetric, 50);
const irrValue = p50Result?.value || 0;
const irrStats = p50Result?.stats || {};
```

### `calculateIRR(cashflows)`
Calculate Internal Rate of Return from cashflow array using Newton-Raphson method.

**Input**: `Array<{year: number, value: number}>` cashflow data  
**Output**: `number` IRR as percentage

```javascript
const cashflows = [
  { year: 0, value: -1000000 }, // Initial investment
  { year: 1, value: 200000 },   // Annual returns
  { year: 2, value: 300000 }
];
const irr = calculateIRR(cashflows); // Returns 8.5 for 8.5%
```

### `validateMetricDataStructure(metricData, availablePercentiles)`
Automatically normalize any transformer return value to proper `CubeMetricResultSchema[]` format.

**Input**: `any` transformer result, `Array<number>` percentiles  
**Output**: `CubeMetricResultSchema[]` normalized array

This function is called automatically by the processor - transformers don't need to call it directly.

---

## Data Access

### CubeContext Integration
```javascript
const { getMetricsData } = useCube();

// Get all percentiles for one metric
const projectIRRData = getMetricsData({ metricId: 'projectIRR' });
// Returns: { 50: {value: 12.5, metadata}, 75: {value: 15.2, metadata} }

// Get all metrics for one percentile  
const medianMetrics = getMetricsData({ percentile: 50 });
// Returns: { projectIRR: {value: 12.5, metadata}, equityIRR: {value: 18.3, metadata} }
```

---

## Common Patterns

### Simple Aggregation-Only Metric
```javascript
{
  id: 'minDSCR',
  dependencies: [{ id: 'dscr', type: 'source' }],
  aggregations: [
    { sourceId: 'dscr', operation: 'min', outputKey: 'value', isDefault: true }
  ],
  transformer: null // Use aggregation result
}
```

### Complex Transformer with Dependencies
```javascript
{
  id: 'equityIRR',
  dependencies: [
    { id: 'equityCashflow', type: 'source' },
    { id: 'projectIRR', type: 'metric' }
  ],
  transformer: calculateEquityIRR,
  // Transformer can access both source data and other metrics
}
```

### NPV with Parameterized Discount Rate
```javascript
{
  id: 'projectNPV',
  dependencies: [
    { id: 'projectCashflow', type: 'source' },
    { id: 'financing', type: 'reference' }
  ],
  aggregations: [
    {
      sourceId: 'projectCashflow',
      operation: 'npv',
      outputKey: 'npvValue',
      isDefault: true,
      parameters: {
        discountRate: (refs) => refs.financing.costOfEquity / 100
      }
    }
  ]
}
```

---

## Error Handling

### Validation Errors
- **Dependency resolution**: Missing sources/metrics/references
- **Transformer validation**: Invalid return format (automatically normalized)
- **Operation execution**: Function return value validation
- **Schema validation**: Complete metric data structure

### Graceful Degradation
- Missing data returns zero values with error stats
- Invalid transformer results are normalized automatically
- Failed operations preserve base values

---

## Performance

- **Sub-100ms Processing**: Typical metrics computation time
- **Dependency Caching**: Resolved dependencies cached per metric
- **Automatic Normalization**: No manual result formatting required
- **Memory Efficient**: Minimal data duplication through direct access patterns

This streamlined system provides sophisticated financial metrics analysis while maintaining performance and developer experience.