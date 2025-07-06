# Cube System Documentation

## Overview

The Cube system is a financial data processing pipeline that transforms scenario data into structured cashflow analysis. It processes sources through transformers and multipliers to generate time-series data for wind industry financial modeling.

## Core Architecture

### Data Flow Pipeline
```
CASHFLOW_SOURCE_REGISTRY → computeSourceData() → CubeSourceDataSchema[] → CubeContext
```

1. **Registry Definition**: Sources defined with paths, transformers, multipliers
2. **Processing**: Sources sorted by type/priority and processed sequentially
3. **Storage**: Results stored as `sourceData` in CubeContext
4. **Access**: Components access data via `getData()` function

## Registry Structure

### Source Types & Processing Order

| Type | Priority Range | Description | Requirements |
|------|----------------|-------------|--------------|
| `direct` | 1-99 | Raw data sources | Must have `path`, no `multipliers` |
| `indirect` | 100-199 | Data with multipliers | Must have `path` and `multipliers` |
| `virtual` | 200+ | Calculated sources | Must have `transformer`, no `path` |

### Source Configuration

```javascript
{
    id: 'energyRevenue',                    // Unique identifier
    priority: 99,                           // Processing order within type
    path: ['simulation', 'data', 'energy'], // Data extraction path
    hasPercentiles: true,                   // Whether source varies by percentile
    references: [                           // Additional data dependencies
        { id: 'financing', path: ['settings', 'financing'] }
    ],
    transformer: transformerFunction,       // Data transformation function
    multipliers: [                         // Mathematical operations
        { id: 'escalationRate', operation: 'compound', baseYear: 1 }
    ],
    metadata: {
        name: 'Energy Revenue',
        type: 'indirect',
        cashflowGroup: 'revenue',          // cost|revenue|asset|liability|none
        category: 'energy',
        description: 'Revenue from energy sales',
        customPercentile: 50,              // Fallback percentile
        formatter: (value) => `$${value.toFixed(1)}M`
    }
}
```

## Transformers

### Data Filtering Functions

#### `filterCubeSourceData(processedData, filters)`
Optimized filtering for processed cube sources.

```javascript
import { filterCubeSourceData } from './common.js';

// Filter by cashflow group
const costSources = filterCubeSourceData(processedData, {
    cashflowGroup: 'cost'
});

// Filter by multiple criteria
const constructionCosts = filterCubeSourceData(processedData, {
    type: 'indirect',
    category: 'construction',
    metadata: { customField: 'value' }
});

// Filter by source IDs
const specificSources = filterCubeSourceData(processedData, {
    sourceIds: ['capexDrawdown', 'debtDrawdown']
});
```

**Filter Options:**

| Filter | Type | Description |
|--------|------|-------------|
| `sourceId` | string | Single source ID |
| `sourceIds` | string[] | Multiple source IDs |
| `type` | string | Source metadata type |
| `cashflowGroup` | string | Source cashflow group |
| `category` | string | Source category |
| `metadata` | object | Custom metadata fields |

#### `aggregateCubeSourceData(sources, availablePercentiles, options)`
Aggregates multiple cube sources into single time-series.

```javascript
import { aggregateCubeSourceData } from './common.js';

// Sum multiple cost sources
const totalCosts = aggregateCubeSourceData(costSources, availablePercentiles, {
    operation: 'sum',
    customPercentile: context.customPercentile
});

// Calculate net cashflow (revenue - costs)
const netCashflow = aggregateCubeSourceData([revenueSource, negativeCostSource], availablePercentiles, {
    operation: 'sum'  // Revenue + (-costs) = net
});
```

**Aggregation Operations:**

| Operation | Formula | Use Case |
|-----------|---------|----------|
| `sum` | Sum all values | Default aggregation |
| `subtract` | Subtract subsequent from first | Revenue - costs |
| `multiply` | Multiply all values | Compound effects |

#### `adjustSourceDataValues(sourceData, adjustFunction)`
Transforms values using inline function. Handles CubeSourceDataSchema, SimResultsSchema, or DataPointSchema.

```javascript
import { adjustSourceDataValues } from './common.js';

// Make values negative
const negativeCosts = adjustSourceDataValues(costSource, (percentile, year, value) => -value);

// Apply conditional scaling
const adjustedData = adjustSourceDataValues(data, (percentile, year, value) => {
    return percentile > 50 ? value * 1.1 : value * 0.9;
});

// Time-based adjustment
const escalatedData = adjustSourceDataValues(data, (percentile, year, value) => {
    const escalationRate = year > 5 ? 0.03 : 0.02;
    return value * Math.pow(1 + escalationRate, year);
});
```

### Function Signature
```javascript
function transformer(sourceData, context) {
    // sourceData: Raw data from getValueByPath() or null for virtual sources
    // context: {hasPercentiles, availablePercentiles, allReferences, processedData, options, id, metadata, customPercentile}
    // Returns: Array of SimResultsSchema objects
}
```

### Context Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `hasPercentiles` | boolean | Whether source has percentile variation |
| `availablePercentiles` | number[] | Available percentiles [10,25,50,75,90] |
| `allReferences` | object | Combined global + local references |
| `processedData` | CubeSourceDataSchema[] | Previously processed sources |
| `options` | object | Custom transformer parameters |
| `customPercentile` | object\|null | Custom percentile configuration |

### Common Transformer Patterns

```javascript
// Virtual aggregation transformer
export const totalCost = (sourceData, context) => {
    const costSources = filterCubeSourceData(context.processedData, {
        cashflowGroup: 'cost'
    });
    
    return aggregateCubeSourceData(costSources, context.availablePercentiles, {
        operation: 'sum',
        customPercentile: context.customPercentile
    });
};

// Data transformation transformer
export const capexDrawdown = (sourceData, context) => {
    // Process sourceData into SimResultsSchema array
    // Handle percentile expansion and validation
    return results;
};
```

## Multipliers

### Operations

| Operation | Formula | Use Case |
|-----------|---------|----------|
| `multiply` | `value × multiplier` | Simple scaling |
| `compound` | `value × (1 + rate)^(year - baseYear)` | Annual escalation |
| `simple` | `value × (1 + rate × (year - baseYear))` | Linear growth |
| `summation` | `value + multiplier` | Adding values |

### Configuration
```javascript
{
    id: 'escalationRate',           // Reference to multiplier source
    operation: 'compound',          // Operation type
    baseYear: 1,                   // Starting year for calculations
    filter: (year, value, percentile) => year > 0  // Optional filter function
}
```

### Processing Logic
1. **Value Lookup**: Find multiplier data in `processedData` then `allReferences`
2. **Type Detection**: Handle scalar, DataPointSchema[], or SimResultsSchema[]
3. **Filter Application**: Apply filter to source data before multiplication
4. **Operation Execution**: Apply mathematical operation per data point
5. **Audit Trail**: Record applied multipliers with actual percentiles used

## Custom Percentiles

Custom percentiles enable mixed-percentile analysis using percentile 0 as a placeholder.

### Configuration Format
```javascript
customPercentile = {
    "escalationRate": 25,    // Use 25th percentile for escalation
    "energyRevenue": 75      // Use 75th percentile for revenue
}
```

### Processing Behavior
- **Data Sources**: Percentile 0 copies data from specified percentile
- **Transformers**: Receive customPercentile in context for processing
- **Multipliers**: Percentile 0 lookups use mapped percentile values
- **Audit Trail**: Records actual percentile used, not 0

## Audit Trail System

### Structure & Usage

The audit trail tracks all transformations applied to source data, providing transparency for financial calculations.

#### Audit Trail Schema
```javascript
audit: {
    appliedMultipliers: [
        {
            id: 'escalationRate',              // Multiplier source ID
            operation: 'compound',             // Operation performed
            values: DataPointSchema[],         // Original multiplier values used
            baseYear: 1,                      // Base year for calculation
            cumulative: false,                // Whether effect is cumulative
            actualPercentile: 25              // Actual percentile used (custom percentiles)
        }
    ]
}
```

#### Manual Audit Trail Creation in Transformers

Transformers are responsible for creating their own audit trails when they perform calculations:

```javascript
export const customTransformer = (sourceData, context) => {
    const { processedData, availablePercentiles } = context;
    
    // Perform calculations
    const results = performCalculations(sourceData);
    
    // Create audit trail for manual calculations
    const auditTrail = {
        appliedMultipliers: [],
        customCalculations: [
            {
                operation: 'debt_service_calculation',
                inputs: {
                    principal: totalPrincipal,
                    interestRate: operationalRate,
                    loanDuration: loanDuration
                },
                formula: 'PMT(rate, periods, principal)',
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    // Return data with audit information in metadata
    return results.map(item => ({
        ...item,
        metadata: {
            ...item.metadata,
            auditTrail: auditTrail
        }
    }));
};
```

#### Accessing Audit Information

```javascript
// Get audit trail from processed source
const energySource = sourceData.find(source => source.id === 'energyRevenue');
const audit = energySource.audit;

// Check what multipliers were applied
audit.appliedMultipliers.forEach(multiplier => {
    console.log(`Applied ${multiplier.operation} using ${multiplier.id}`);
    if (multiplier.actualPercentile) {
        console.log(`Used ${multiplier.actualPercentile}th percentile instead of 0`);
    }
});

// Access through getData results
const data = getData({ sourceId: 'energyRevenue', percentile: 50 });
const metadata = data['energyRevenue'].metadata;
if (metadata.auditTrail) {
    console.log('Custom calculations performed:', metadata.auditTrail.customCalculations);
}
```

#### Best Practices for Audit Trails

1. **Record Key Calculations**: Document complex financial formulas and assumptions
2. **Track Data Sources**: Record which processed sources were used as inputs
3. **Note Custom Logic**: Explain any business rule applications
4. **Preserve Lineage**: Maintain chain of data transformations

```javascript
// Example: Comprehensive audit trail in debt service calculation
export const debtService = (sourceData, context) => {
    const financing = context.allReferences.financing;
    
    // Get dependency data
    const interestSources = filterCubeSourceData(context.processedData, {
        sourceId: 'operationalInterest'
    });
    const principalSources = filterCubeSourceData(context.processedData, {
        sourceId: 'operationalPrincipal'  
    });
    
    // Perform aggregation
    const result = aggregateCubeSourceData([...interestSources, ...principalSources], 
        context.availablePercentiles, {
            operation: 'sum',
            customPercentile: context.customPercentile
        });
    
    // Add comprehensive audit trail
    const auditTrail = {
        calculation: 'debt_service_aggregation',
        inputs: {
            operationalInterest: interestSources[0]?.id,
            operationalPrincipal: principalSources[0]?.id,
            financingParameters: {
                loanDuration: financing.loanDuration,
                interestRate: financing.costOfOperationalDebt,
                amortizationType: financing.amortizationType
            }
        },
        formula: 'debt_service = operational_interest + operational_principal',
        dependencies: ['operationalInterest', 'operationalPrincipal'],
        timestamp: new Date().toISOString()
    };
    
    // Attach audit to result metadata
    return result.map(item => ({
        ...item,
        metadata: {
            ...item.metadata,
            auditTrail: auditTrail
        }
    }));
};
```

## Data Schemas

### Core Data Types

| Schema | Purpose | Key Fields |
|--------|---------|-----------|
| `SimResultsSchema` | Time-series data point | `{year, value, percentile: {value}}` |
| `DataPointSchema` | Simple time-series point | `{year, value}` |
| `CubeSourceDataSchema` | Processed source output | `{id, percentileSource: SimResultsSchema[], metadata, audit}` |

### Audit Trail Structure
```javascript
// Automatic audit trail (from multipliers)
audit: {
    appliedMultipliers: [
        {
            id: 'escalationRate',
            operation: 'compound',
            values: DataPointSchema[],      // Original multiplier values
            baseYear: 1,
            actualPercentile: 25            // Actual percentile used (for custom percentiles)
        }
    ]
}

// Manual audit trail (from transformers)
metadata: {
    auditTrail: {
        calculation: 'debt_service_calculation',
        inputs: { principal: 1000000, rate: 0.05 },
        formula: 'PMT(rate, periods, principal)', 
        dependencies: ['operationalInterest', 'operationalPrincipal'],
        timestamp: '2025-01-01T00:00:00.000Z'
    }
}
```

## CubeContext Usage

### Initialization
```javascript
import { useCube } from '../contexts/CubeContext';

const { sourceData, getData, customPercentile, setCustomPercentile, refreshCubeData } = useCube();
```

### Data Access Patterns

```javascript
// Single source, all percentiles - key = percentile
const energyData = getData({ sourceId: 'energyRevenue' });
// Returns: { "10": {data: DataPointSchema[], metadata}, "25": {...}, ... }

// All sources, single percentile - key = sourceId
const medianData = getData({ percentile: 50 });
// Returns: { "energyRevenue": {data: DataPointSchema[], metadata}, "escalationRate": {...} }

// Specific source + percentile
const specificData = getData({ sourceId: 'energyRevenue', percentile: 50 });
// Returns: { "energyRevenue": {data: DataPointSchema[], metadata} }

// Advanced filtering with metadata
const costData = getData({ 
    percentile: 50, 
    metadata: { cashflowGroup: 'cost', category: 'construction' } 
});

// Error handling pattern
const data = getData({ sourceId: 'energyRevenue' });
if (Object.keys(data).length === 0) {
    console.warn('No data available for energyRevenue');
}
```

### Custom Percentile Management
```javascript
// Enable custom percentiles
setCustomPercentile({ "escalationRate": 25, "energyRevenue": 75 });

// Update specific sources
updateCustomPercentile({ "escalationRate": 10 });

// Disable custom percentiles
setCustomPercentile(null);
```

### State Management
```javascript
const { 
    isLoading,           // Currently processing data
    isRefreshing,        // Refresh cycle active
    isDataOutOfDate,     // Scenario changed since last refresh
    lastRefresh,         // Timestamp of last successful refresh
    refreshCubeData      // Manual refresh trigger
} = useCube();
```

## Performance Considerations

### Optimization Strategies
- **Single Pass Processing**: Sources processed once in dependency order
- **Map-Based Aggregation**: O(1) lookup for year-percentile combinations  
- **Early Filtering**: Most selective filters applied first
- **Reference Caching**: Global references loaded once, reused across sources
- **Audit Trail Efficiency**: Minimal data stored, computed on demand

### Best Practices
- Use `filterCubeSourceData()` for efficient source filtering
- Leverage `aggregateCubeSourceData()` for mathematical operations
- Cache `getData()` results when possible
- Minimize custom percentile changes during analysis
- Use metadata filtering for targeted data access

## Error Handling

### Processing Errors
- **Invalid Sources**: Logged and skipped, processing continues
- **Missing References**: Warnings logged, empty values used
- **Transformer Failures**: Error logged, source skipped
- **Schema Validation**: Immediate error throwing for data integrity

### Recovery Patterns
```javascript
try {
    const data = getData({ sourceId: 'energyRevenue' });
    if (Object.keys(data).length === 0) {
        // Handle no data case
        console.warn('No energy revenue data available');
    }
} catch (error) {
    console.error('Data access failed:', error);
    // Fallback to default values or retry
}
```