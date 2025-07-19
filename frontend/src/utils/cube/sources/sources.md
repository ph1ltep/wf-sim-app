# Cube Sources System API Documentation v2.0

## Overview

The Cube Sources System is a high-performance financial data processing pipeline that transforms scenario data into structured time-series analysis. It features source type categorization, custom percentile handling, mathematical multipliers, transformer functions, and comprehensive audit trails with sub-100ms processing performance.

## Processing Pipeline & Execution Order

The sources system executes in a specific order to ensure dependencies are available when needed:

### 1. Reference Loading
Global and local references are loaded from scenario data using `getValueByPath()` function.

### 2. Source Processing Order
Sources are processed in three phases based on their type, **regardless of priority values**:
- **Direct Sources** (type: 'direct') - Process first, extract raw scenario data
- **Indirect Sources** (type: 'indirect') - Process second, apply multipliers to data
- **Virtual Sources** (type: 'virtual') - Process third, use transformers for calculated data

Within each type, sources are sorted by ascending priority value.

### 3. Per-Source Processing Steps
For each source, the following steps execute in order:

1. **Validation** - Validate source type configuration against requirements
2. **Reference Loading** - Load local references and combine with global ones
3. **Data Extraction** - Extract source data using `getValueByPath()` (direct/indirect only)
4. **Custom Percentile Processing** - Add percentile 0 data if custom percentiles enabled
5. **Transformer Application** - Apply transformer function (virtual sources or data conversion)
6. **Multiplier Application** - Apply mathematical operations (indirect sources only)
7. **Schema Validation** - Validate final result against `CubeSourceDataSchema`

## Data Flow & Types

### Input/Output Data Types by Source Type

| Source Type | Input Requirement | Transformer Input | Multiplier Input | Output Type |
|-------------|-------------------|-------------------|------------------|-------------|
| **Direct** | `path` (required) | Raw scenario data | Not allowed | `SimResultsSchema[]` |
| **Indirect** | `path` + `multipliers` | Raw scenario data | `SimResultsSchema[]` | `SimResultsSchema[]` |
| **Virtual** | `transformer` (required) | `null` (no path) | Not allowed | `SimResultsSchema[]` |

### Source Type Validation Rules

| Type | Requirements | Purpose | Example Use Cases |
|------|-------------|---------|------------------|
| `direct` | Must have `path`, no `multipliers` | Raw scenario data extraction | Distribution results, configuration values |
| `indirect` | Must have `path` and `multipliers` | Data with mathematical operations | Revenue with price multipliers, costs with escalation |
| `virtual` | Must have `transformer`, no `path` | Calculated/derived data | Aggregations, complex calculations, financial metrics |

### Data Structure Flow
```javascript
// 1. Raw scenario data (from getValueByPath)
scenarioData = [
  {name: "energyProduction", percentile: {value: 50}, data: [{year: 1, value: 100000}]}
]

// 2. After transformer processing → SimResultsSchema[]
transformedData = [
  {name: "energyProduction", percentile: {value: 50}, data: [{year: 1, value: 100000}]}
]

// 3. After multiplier application → SimResultsSchema[]
multipliedData = [
  {name: "energyRevenue", percentile: {value: 50}, data: [{year: 1, value: 5000000}]} // 100000 * $50/MWh
]

// 4. Final output → CubeSourceDataSchema
finalResult = {
  id: "energyRevenue",
  percentileSource: multipliedData,
  metadata: {...},
  audit: {trail: [...], references: {...}}
}
```

## Core Processing API

### `computeSourceData()`
Main processing pipeline that transforms registry configuration into processed cube data with full audit trails.

**Parameters**:
```javascript
computeSourceData(
  sourceRegistry,       // CubeSourceRegistrySchema
  availablePercentiles, // number[] - [10, 25, 50, 75, 90]
  getValueByPath,       // Function - (path: string[]) => any
  customPercentile      // Object|null - {sourceId: percentileValue}
)
```

**Returns**: `CubeSourceDataSchema[]` - Array of processed sources with audit trails

**Processing Performance**: Target sub-100ms for typical scenario processing

---

## Registry Configuration

### Source Registry Schema
```javascript
const CASHFLOW_SOURCE_REGISTRY = {
  references: [
    { id: 'projectLife', path: ['settings', 'general', 'projectLife'] },
    { id: 'financing', path: ['settings', 'modules', 'financing'] }
  ],
  
  sources: [
    {
      id: 'energyRevenue',
      priority: 99,
      path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction', 'results'],
      hasPercentiles: true,
      references: [],
      transformer: null,
      multipliers: [
        { id: 'electricityPrice', operation: 'multiply', baseYear: 1 },
        { id: 'escalationRate', operation: 'compound', baseYear: 1 }
      ],
      metadata: {
        type: 'indirect',
        visualGroup: 'ppa',
        cashflowType: 'inflow',
        accountingClass: 'revenue',
        projectPhase: 'operations',
        description: 'Energy production revenue with price and escalation',
        formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
      }
    }
  ]
}
```

### Metadata Classification System
The metadata system provides structured categorization for filtering and visualization:

| Field | Options | Purpose |
|-------|---------|---------|
| `type` | `direct`, `indirect`, `virtual` | Processing type validation |
| `visualGroup` | Custom grouping | UI organization and filtering |
| `cashflowType` | `inflow`, `outflow`, `none` | Cash flow direction |
| `accountingClass` | `devex`, `capex`, `opex`, `financing_cost`, `revenue`, etc. | Accounting categorization |
| `projectPhase` | `pre_development`, `development`, `construction`, `operations`, `decommissioning` | Project lifecycle phase |

---

## Transformer System

### Purpose & Capabilities
Transformers are custom functions that convert raw data into `SimResultsSchema[]` format. They have access to all resolved dependencies and can implement complex business logic for data transformation and calculation.

### Function Signature & Context Access
```javascript
transformer(sourceData, context) => SimResultsSchema[]

// sourceData: any - Raw data from getValueByPath() or null for virtual sources
// context: Object - Complete processing context
{
  addAuditEntry: Function,                    // Add audit trail entries
  processedData: CubeSourceDataSchema[],      // Previously processed sources
  availablePercentiles: number[],             // Available percentiles
  allReferences: Object,                      // Combined global + local references
  hasPercentiles: boolean,                    // Whether source has percentile variation
  metadata: Object,                           // Source metadata
  customPercentile: Object|null               // Custom percentile configuration
}
```

### Data Access Patterns in Transformers
```javascript
export const netCashflow = (sourceData, context) => {
  const { processedData, availablePercentiles, customPercentile, addAuditEntry, allReferences } = context;
  
  // Access other processed sources by ID
  const revenueSources = filterCubeSourceData(processedData, { sourceId: 'totalRevenue' });
  const costSources = filterCubeSourceData(processedData, { sourceId: 'totalCost' });
  
  // Access reference data
  const projectLife = allReferences.projectLife || 20;
  const financing = allReferences.financing;
  
  // Use helper functions for data manipulation
  const negativeCostSource = adjustSourceDataValues(costSources[0], (percentile, year, value) => -value);
  
  // Aggregate multiple sources
  const result = aggregateCubeSourceData([revenueSources[0], negativeCostSource], availablePercentiles, {
    operation: 'sum',
    customPercentile
  }, addAuditEntry);
  
  return result;
};
```

### Transformer Helper Functions
The system provides utility functions for common transformer operations:

| Function | Input Types | Output Type | Purpose |
|----------|-------------|-------------|---------|
| `filterCubeSourceData()` | `CubeSourceDataSchema[]`, filters | `CubeSourceDataSchema[]` | Filter processed sources |
| `aggregateCubeSourceData()` | `CubeSourceDataSchema[]`, operation | `SimResultsSchema[]` | Aggregate multiple sources |
| `adjustSourceDataValues()` | Source data, function | Modified data | Apply inline transformations |
| `normalizeIntoSimResults()` | `DataPointSchema[]`, percentiles | `SimResultsSchema[]` | Convert fixed data to percentile format |
| `extractPercentileData()` | `SimResultsSchema[]`, percentile | `DataPointSchema[]` | Extract specific percentile data |

---

## Multiplier System

### Purpose & Operations
Multipliers apply mathematical operations to time-series data, enabling calculations like inflation, escalation, pricing, and scaling. They operate on `SimResultsSchema[]` data and support custom percentile configurations.

### Available Operations & Formulas

| Operation | Formula | Input Type | Use Case | Example |
|-----------|---------|------------|----------|---------|
| `multiply` | `value × multiplier` | Scalar or time-series | Simple scaling | Quantity × Unit Price |
| `compound` | `value × (1 + rate)^(year-baseYear)` | Rate as decimal | Annual growth/inflation | Cost escalation over time |
| `simple` | `value × (1 + rate × (year-baseYear))` | Rate as decimal | Linear growth | Simple interest calculations |
| `summation` | `value + multiplier` | Scalar or time-series | Fixed additions | Base cost + fixed fees |

### Multiplier Configuration & Processing
```javascript
multipliers: [
  {
    id: 'electricityPrice',        // Reference to multiplier data source
    operation: 'multiply',         // Operation type
    baseYear: 1,                  // Starting year for calculations (compound/simple only)
    filter: (year, value, percentile) => year > 0  // Optional filter function
  },
  {
    id: 'escalationRate',
    operation: 'compound',
    baseYear: 1,
    // No filter - applies to all years
  }
]
```

### Multiplier Value Resolution
Multipliers can source values from three locations:

1. **Processed Sources**: Previously processed `CubeSourceDataSchema` objects
2. **References**: Global or local reference data (scalars or time-series)
3. **Custom Percentile Handling**: Automatic percentile 0 processing for mixed-percentile analysis

### Value Lookup Optimization
The system creates optimized lookup functions based on multiplier data format:

```javascript
// Scalar multiplier (same value for all years/percentiles)
const scalarLookup = (year, percentile) => 50; // $50/MWh

// Time-series multiplier (varies by year, same across percentiles)
const timeSeriesLookup = (year, percentile) => yearValueMap.get(year);

// Percentile multiplier (varies by both year and percentile)
const percentileLookup = (year, percentile) => {
  const actualPercentile = percentile === 0 ? customPercentile[multiplierId] : percentile;
  return lookupMap.get(`${year}-${actualPercentile}`);
};
```

---

## Custom Percentiles System

### Purpose & Configuration
Custom percentiles enable mixed-percentile analysis by creating percentile 0 placeholders that reference specific percentiles for each source. This allows scenarios like conservative cost estimates (P10) combined with optimistic revenue projections (P90).

### Configuration Example
```javascript
setCustomPercentile({
  "escalationRate": 25,    // Use P25 for escalation
  "energyRevenue": 75,     // Use P75 for revenue  
  "omCosts": 10           // Use P10 for O&M costs
});
```

### Processing Behavior
1. **Percentile 0 Creation**: System adds percentile 0 entries to effective percentiles list
2. **Data Copying**: Copies data from specified percentiles to percentile 0
3. **Transparent Processing**: Transformers and multipliers handle percentile 0 transparently
4. **Audit Trail Accuracy**: Records actual percentiles used (not 0) in audit trails

### Implementation in Sources
```javascript
// Source data with custom percentile
const addCustomPercentileData = (sourceData, sourceId, customPercentile) => {
  const targetPercentile = customPercentile[sourceId];
  if (!targetPercentile) return sourceData;

  const sourceItem = sourceData.find(item => item.percentile.value === targetPercentile);
  if (!sourceItem) return sourceData;

  const customItem = {
    ...sourceItem,
    percentile: { value: 0 },
    metadata: { ...sourceItem.metadata, customPercentile: targetPercentile }
  };

  return [...sourceData, customItem];
};
```

---

## Audit Trail System

### Purpose & Features
The audit trail system provides complete transparency for all data transformations, enabling debugging, validation, and lineage tracking with performance monitoring.

### Audit Trail Factory
```javascript
createAuditTrail(sourceId, preferredPercentile, dataSamplingEnabled)
```

**Returns**: `{addAuditEntry: Function, getTrail: Function, getReferences: Function}`

### Adding Audit Entries
```javascript
addAuditEntry(step, details, dependencies, sourceData, type, typeOperation)

// Parameters:
// step: string - Step name/identifier
// details: string - Description of the operation
// dependencies: string[] - Source IDs used as inputs
// sourceData: any - Optional data sample for debugging
// type: string - Operation category ('transform', 'multiply', 'aggregate', etc.)
// typeOperation: string - Specific operation ('sum', 'compound', 'complex', etc.)
```

### Audit Data Structure
```javascript
{
  timestamp: number,           // Processing timestamp
  step: string,               // Step name/identifier
  details: string,            // Operation description
  dependencies: string[],     // Source IDs used as inputs
  dataSample: {              // Optional data sample
    percentile: number,
    data: any
  },
  type: string,              // Operation category
  typeOperation: string,     // Specific operation
  duration: number           // Calculated step duration in ms
}
```

---

## Data Access & Query Functions

### `getData()` - Flexible Source Data Retrieval
Optimized data retrieval with multiple filter options and dynamic return formats.

```javascript
const { getData } = useCube();

// Get all percentiles for one source
const energyData = getData({ sourceId: 'energyRevenue' });
// Returns: { 10: {data: [...], metadata}, 25: {data: [...], metadata}, ... }

// Get all sources for one percentile
const medianData = getData({ percentile: 50 });
// Returns: { energyRevenue: {data: [...], metadata}, totalCost: {data: [...], metadata}, ... }

// Get specific source-percentile combination
const specificData = getData({ sourceId: 'energyRevenue', percentile: 50 });
// Returns: { energyRevenue: {data: [...], metadata} }

// Filter by metadata
const costSources = getData({ percentile: 50, metadata: { cashflowType: 'outflow' } });
// Returns: { totalCost: {data: [...], metadata}, omCosts: {data: [...], metadata}, ... }
```

### Filter Options
| Filter | Type | Purpose | Example |
|--------|------|---------|---------|
| `sourceId` | `string` | Single source by ID | `'energyRevenue'` |
| `sourceIds` | `string[]` | Multiple sources by IDs | `['totalRevenue', 'totalCost']` |
| `percentile` | `number` | Single percentile across sources | `50` |
| `metadata` | `Object` | Filter by metadata fields | `{cashflowType: 'inflow'}` |

### Return Format Logic
| Filter Combination | Output Keys | Use Case |
|-------------------|-------------|----------|
| `{sourceId}` | Percentile values (10, 25, 50...) | All percentiles for one source |
| `{percentile}` | Source IDs | All sources for one percentile |
| `{sourceId, percentile}` | Source ID | Single source-percentile combo |
| `{metadata}` | Source IDs (filtered) | Sources matching criteria |

---

## Error Handling & Validation

### Source Type Validation
```javascript
const validateSourceType = (source) => {
  const { type } = source.metadata;
  
  switch (type) {
    case 'direct':
      return source.path && (!source.multipliers || source.multipliers.length === 0);
    case 'indirect':
      return source.path && source.multipliers && source.multipliers.length > 0;
    case 'virtual':
      return !source.path && source.transformer;
    default:
      return false;
  }
};
```

### Data Structure Validation
```javascript
const validateSourceDataStructure = (sourceData, hasPercentiles, availablePercentiles) => {
  // Validates and normalizes to SimResultsSchema[]
  // Handles: SimResultsSchema[], DataPointSchema[], single objects
  // Converts and expands to all percentiles as needed
};
```

### Error Categories & Handling
| Error Type | Handling | Example |
|------------|----------|---------|
| **Configuration Errors** | Log and skip source | Invalid source type configuration |
| **Data Extraction Errors** | Log and continue | Path not found in scenario data |
| **Transformer Errors** | Log and return empty | Transformer function throws error |
| **Multiplier Errors** | Log and skip multiplier | Multiplier source not found |
| **Validation Errors** | Log and attempt correction | Invalid SimResultsSchema format |

---

## Performance Optimization

### Processing Metrics & Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Total Processing Time** | <100ms | Typical scenario with 20+ sources |
| **Memory Efficiency** | 50%+ reduction | Compared to legacy systems |
| **Percentile Switching** | <10ms | UI responsiveness for custom percentiles |
| **Cache Management** | Smart invalidation | Version-based cache control |

### Optimization Techniques
1. **Source Type Ordering** - Process dependencies first automatically
2. **Value Lookup Caching** - Pre-compute lookup functions for multipliers
3. **Reference Consolidation** - Single object for all reference access
4. **Batch Validation** - Validate arrays efficiently with Yup
5. **Memory Management** - Reuse objects and minimize allocations

---

## Common Patterns & Examples

### Simple Direct Source (Raw Data)
```javascript
{
  id: 'escalationRate',
  type: 'direct',
  path: ['simulation', 'inputSim', 'distributionAnalysis', 'escalationRate', 'results'],
  hasPercentiles: true,
  // No transformer, no multipliers - just extract and normalize
}
```

### Indirect Source with Multipliers
```javascript
{
  id: 'energyRevenue',
  type: 'indirect',
  path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction', 'results'],
  hasPercentiles: true,
  multipliers: [
    { id: 'electricityPrice', operation: 'multiply', baseYear: 1 },
    { id: 'escalationRate', operation: 'compound', baseYear: 1 }
  ]
  // Transform: energyProduction × electricityPrice × escalation
}
```

### Virtual Source with Complex Calculation
```javascript
{
  id: 'netCashflow',
  type: 'virtual',
  transformer: netCashflow,
  // No path - uses transformer to calculate from other processed sources
  // Access totalRevenue and totalCost, subtract to get net cashflow
}
```

### Aggregation Virtual Source
```javascript
{
  id: 'totalCost',
  type: 'virtual',
  transformer: totalCost,
  // Aggregates all sources with cashflowType: 'outflow'
  // Uses filterCubeSourceData and aggregateCubeSourceData helpers
}
```

This comprehensive system provides high-performance, flexible financial data processing with complete transparency and robust error handling, forming the foundation for the cube metrics system.