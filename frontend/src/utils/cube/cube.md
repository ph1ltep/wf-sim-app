# Cube System API Documentation v2.0

## Overview

The Cube system is a high-performance financial data processing pipeline that transforms scenario data into structured time-series analysis. It features advanced audit trails, custom percentile handling, and sub-100ms processing performance.

---

## Core Processing API

### `computeSourceData()`
Main processing pipeline that transforms registry configuration into processed cube data with full audit trails and performance tracking.

**Parameters**:
```
sourceRegistry: CubeSourceRegistrySchema
  ├─ Registry with references and sources

availablePercentiles: number[]
  ├─ Available percentiles [10, 25, 50, 75, 90]

getValueByPath: Function
  ├─ (path: string[]) => any
  └─ Scenario data extraction function

customPercentile?: Object | null
  ├─ {sourceId: percentileValue}
  └─ Custom percentile mapping
```

**Returns**: `CubeSourceDataSchema[]`
```
Array of processed sources with audit trails
```

```javascript
const data = computeSourceData(REGISTRY, [10, 25, 50, 75, 90], getValueByPath, {"escalationRate": 25});
```

---

## CubeContext API

### Context State Management
React context providing processed cube data, loading states, version tracking, and custom percentile configuration management.

**Available State**:
- `sourceData`: `CubeSourceDataSchema[]` - Processed cube data
- `isLoading`, `isRefreshing`: `boolean` - Processing states  
- `lastRefresh`: `Date|null` - Last refresh timestamp
- `cubeVersion`: `string|null` - Cache version for invalidation
- `customPercentile`: `Object|null`, `setCustomPercentile`: `Function` - Custom percentile management
- `refreshCubeData`: `Function` - Manual refresh trigger

```javascript
const { sourceData, getData, customPercentile, setCustomPercentile } = useCube();
```

### `getData()`
Optimized data retrieval with flexible filtering, metadata support, and multiple return formats based on filter criteria.

**Parameters**:
```
filters: Object
  ├─ sourceId?: string          - Single source ID
  ├─ sourceIds?: string[]       - Multiple source IDs  
  ├─ percentile?: number        - Single percentile value
  ├─ metadata?: Object          - Metadata filter criteria
  └─ cashflowGroup?: string     - Filter by cashflow group

options?: Object
  └─ Additional options (reserved for future use)
```

**Returns**: `Object` with dynamic keys based on filters
```
Dynamic object structure:
├─ Single source: {percentile: {data: DataPointSchema[], metadata}}
├─ Single percentile: {sourceId: {data: DataPointSchema[], metadata}}  
└─ Filtered sources: {sourceId: {data: DataPointSchema[], metadata}}
```

| Filter Type | Input | Output Keys | Use Case |
|-------------|-------|-------------|----------|
| `{sourceId: 'energyRevenue'}` | Single source | Percentile values (10, 25, 50...) | All percentiles for one source |
| `{percentile: 50}` | Single percentile | Source IDs | All sources for one percentile |
| `{sourceId: 'x', percentile: 50}` | Specific | Source ID | Single source-percentile combination |
| `{metadata: {cashflowGroup: 'cost'}}` | Metadata filter | Source IDs | Filtered sources by metadata |

```javascript
const allPercentiles = getData({sourceId: 'energyRevenue'}); // {10: {data, metadata}, 25: {...}}
const medianData = getData({percentile: 50}); // {energyRevenue: {data, metadata}, ...}
const specific = getData({sourceId: 'energyRevenue', percentile: 50}); // {energyRevenue: {data, metadata}}
```

---

## Registry Configuration

### Source Types
Three processing types with **fixed execution order**: `direct` → `indirect` → `virtual` (regardless of priority values). Priority only determines order within each type.

| Type | Priority Range | Requirements | Purpose |
|------|----------------|--------------|---------|
| `direct` | 1-99 | Must have `path`, no `multipliers` | Raw scenario data extraction |
| `indirect` | 100-199 | Must have `path` and `multipliers` | Data with mathematical operations |
| `virtual` | 200+ | Must have `transformer`, no `path` | Calculated/derived data |

**Processing Order**: All `direct` sources (by priority) → All `indirect` sources (by priority) → All `virtual` sources (by priority)

### Source Configuration Schema

```javascript
{
    id: 'energyRevenue',                    // Unique identifier
    priority: 99,                           // Processing order within type
    path: ['simulation', 'data', 'energy'], // Scenario data extraction path (direct/indirect only)
    hasPercentiles: true,                   // Whether source varies by percentile
    references: [{id: 'financing', path: ['settings', 'financing']}], // Local dependencies
    transformer: transformerFunction,       // Data transformation (virtual only)
    multipliers: [{id: 'escalationRate', operation: 'compound', baseYear: 1}], // Math operations
    metadata: {
        type: 'indirect',                   // direct|indirect|virtual
        cashflowGroup: 'revenue',          // cost|revenue|asset|liability|risk|opportunity|none
        category: 'energy',               // Custom categorization
        // ... other metadata
    }
}
```

---

## Transformer Functions

### Function Signature
Transformer functions process raw data into `SimResultsSchema[]` format with full context access and audit trail support.

**Parameters**:
```
sourceData: any
  ├─ Raw data from getValueByPath() for direct/indirect sources
  └─ null for virtual sources

context: Object
  ├─ addAuditEntry: Function        - Add audit trail entries
  ├─ processedData: CubeSourceDataSchema[] - Previously processed sources
  ├─ availablePercentiles: number[] - Available percentiles
  ├─ allReferences: Object          - Combined global + local references
  ├─ hasPercentiles: boolean        - Whether source has percentile variation
  ├─ metadata: Object               - Source metadata
  └─ customPercentile: Object|null  - Custom percentile configuration
```

**Returns**: `SimResultsSchema[]`
```
Array of time-series data points:
└─ [{year: number, value: number, percentile: {value: number}}]
```

```javascript
export const customTransformer = (sourceData, context) => {
    const { addAuditEntry, processedData, availablePercentiles, allReferences, 
            hasPercentiles, metadata, customPercentile } = context;
    
    // Use addAuditEntry() to record transformation steps and dependencies
    addAuditEntry('transformation_step', 'description', ['dependency1', 'dependency2']);
    
    return results; // Must return SimResultsSchema[]
};
```

### Helper Functions

#### `filterCubeSourceData()`
Optimized filtering for processed sources with multiple filter criteria and performance optimization.

**Input**: `CubeSourceDataSchema[]`, `Object` (filters)  
**Output**: `CubeSourceDataSchema[]`

| Filter Option | Type | Purpose |
|---------------|------|---------|
| `sourceId` | `string` | Single source by ID |
| `sourceIds` | `string[]` | Multiple sources by IDs |
| `cashflowGroup` | `string` | Filter by cashflow category |
| `category` | `string` | Filter by custom category |
| `metadata` | `Object` | Custom metadata matching |

```javascript
const costs = filterCubeSourceData(processedData, {cashflowGroup: 'cost'});
const specific = filterCubeSourceData(processedData, {sourceId: 'debtService'});
```

#### `aggregateCubeSourceData()`
Aggregate multiple sources into single time-series with operation selection, custom percentile support, and automatic audit trail creation.

**Input**: `CubeSourceDataSchema[]`, `number[]`, `Object` (options), `Function` (addAuditEntry)  
**Output**: `SimResultsSchema[]`

**Features**:
- Multiple aggregation operations (sum, subtract, multiply, divide)
- Custom percentile handling with automatic percentile 0 processing
- Automatic dependency tracking for audit trails
- Performance-optimized aggregation algorithms

**Options**:
- `operation`: 'sum'|'subtract'|'multiply'|'divide'
- `customPercentile`: Custom percentile configuration object

```javascript
const total = aggregateCubeSourceData(sources, percentiles, {operation: 'sum'}, addAuditEntry);
```

---

## Custom Percentiles

### Configuration & Behavior
Enable mixed-percentile analysis by creating percentile 0 placeholders that reference specific percentiles for each source.

**Use Case**: Conservative cost estimates (P10) combined with optimistic revenue projections (P90) for risk analysis.

```javascript
setCustomPercentile({
    "escalationRate": 25,    // Use P25 for escalation
    "energyRevenue": 75,     // Use P75 for revenue  
    "omCosts": 10           // Use P10 for O&M costs
});
```

**Processing Behavior**:
- Creates percentile 0 entries copying data from specified percentiles
- Transparent to transformers and multipliers
- Audit trails record actual percentiles used (not 0)
- Enables scenario analysis with mixed risk assumptions

---

## Audit Trail System

### `createAuditTrail()`
Factory function for creating performance-tracked audit trails with optional data sampling and step duration calculation.

**Input**: `string` (sourceId), `number` (percentile), `boolean` (sampling)  
**Output**: `{addAuditEntry: Function, getTrail: Function}`

```javascript
const {addAuditEntry, getTrail} = createAuditTrail('energyRevenue', 50, true);
addAuditEntry('step_name', 'description', ['dep1', 'dep2'], sampleData);
const auditTrail = getTrail(); // Returns trail with calculated durations
```

### Audit Data Storage
Audit trails should capture transformation transparency and calculation lineage.

**Required Data**:
- **Step identification**: Clear step names and descriptions
- **Dependencies**: Source IDs used as inputs for the calculation
- **Performance metrics**: Automatic timing and duration calculation
- **Data lineage**: Track data flow through transformation pipeline

**Optional Data**:
- **Data samples**: Sample input/output data for debugging
- **Calculation details**: Formulas, parameters, or business logic applied
- **Error information**: Failures, warnings, or edge cases encountered

### Output Structure

| Field | Type | Purpose |
|-------|------|---------|
| `timestamp` | `number` | Processing timestamp |
| `step` | `string` | Step name/identifier |
| `details` | `string` | Optional description |
| `dependencies` | `string[]` | Source IDs used as inputs |
| `dataSample` | `Object` | Optional data sample for debugging |
| `duration` | `number` | Calculated step duration in ms |

---

## Multiplier System

### Operations & Formulas
Mathematical operations applied to time-series data with automatic audit trail creation and custom percentile support.

| Operation | Formula | Use Case |
|-----------|---------|----------|
| `multiply` | `value × multiplier` | Simple scaling factors |
| `compound` | `value × (1 + rate)^(year-baseYear)` | Annual escalation, inflation |
| `simple` | `value × (1 + rate × (year-baseYear))` | Linear growth rates |
| `summation` | `value + multiplier` | Fixed value additions |

### Configuration Options

```javascript
{
    id: 'escalationRate',           // Reference to multiplier data source
    operation: 'compound',          // Operation type
    baseYear: 1,                   // Starting year for calculations
    filter: (year, value, percentile) => year > 0  // Optional filter function
}
```

**Features**:
- Automatic audit trail creation with dependency tracking
- Custom percentile support with actual percentile recording
- Optional filtering before multiplication
- Performance-optimized value lookup for large datasets

---

## Performance & Error Handling

### Performance Targets

| Metric | Target | Purpose |
|--------|--------|---------|
| Processing Speed | <100ms | Typical scenario processing |
| Memory Efficiency | 50%+ reduction | Compared to legacy systems |
| Percentile Switching | <10ms | UI responsiveness |
| Cache Management | Smart invalidation | Version-based cache control |

### Error Handling Patterns

```javascript
// Processing errors
try {
    const data = computeSourceData(registry, percentiles, getValueByPath);
} catch (error) {
    console.error('Processing failed:', error.message);
}

// Safe data access
const data = getData({sourceId: 'energyRevenue'});
if (Object.keys(data).length === 0) {
    // Handle missing data
}

// Transformer error handling
export const safeTransformer = (sourceData, context) => {
    try {
        return performTransformation(sourceData, context);
    } catch (error) {
        context.addAuditEntry('error', error.message);
        return []; // Graceful degradation
    }
};
```

---

## Development Best Practices

### Transformer Development
- **Return format**: Always return `SimResultsSchema[]` arrays, even empty for failures
- **Audit usage**: Use `addAuditEntry()` to record dependencies and key calculations  
- **Error handling**: Check for null/undefined data before processing
- **Helper functions**: Use `filterCubeSourceData()` and `aggregateCubeSourceData()` for common operations
- **Custom percentiles**: Handle percentile 0 transparently in calculations

### Registry Configuration  
- **Priority ranges**: Use type-based ranges (direct: 1-99, indirect: 100-199, virtual: 200+)
- **Dependencies**: Define `references` for data dependencies and transformer inputs
- **Type selection**: Choose `direct` for raw data, `indirect` for multiplied data, `virtual` for calculations
- **Metadata accuracy**: Set correct `cashflowGroup` and `category` for filtering and organization