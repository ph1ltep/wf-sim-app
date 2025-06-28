# Unified Cashflow Metrics System - Product Requirements Document

**Version:** 2.1  
**Date:** 2025-06-28  
**Project:** Wind Industry Service Contract Analysis Platform  
**Module:** Cash Flow Analysis Workspace  

---

## 1. Executive Summary

### 1.1 Purpose
Create a unified, scalable metrics system for the Cash Flow Analysis workspace that consolidates all financial, risk, operational, and sensitivity metrics into a single source of truth. This system will replace the current fragmented approach across multiple files and enable future cube-based analytics for comprehensive time-series and percentile management.

### 1.2 Business Drivers
- **Eliminate Code Duplication**: Remove duplicate calculation functions across `metricsUtils.js`, `financingMetrics.js`, and `finance/calculations.js`
- **Enable Scalability**: Easy addition of new metrics without touching existing code
- **Future-Proof Architecture**: Design for single-scenario cube storage managing all data sources, sensitivities, metrics across percentiles and time-series
- **Improve Maintainability**: Single registry-based system with standardized patterns
- **Enhance User Experience**: Consistent metric presentation and thresholds across all cards

### 1.3 Success Metrics
- Zero duplicate calculation functions across the codebase
- New metrics can be added in under 30 minutes via registry configuration
- All cards use unified metrics from CashflowContext
- System supports future cube-based analytics without structural changes
- Complete elimination of old metric calculation patterns
- Registry structure ready for cube context implementation

---

## 2. Current State Analysis

### 2.1 Existing Problems
**Fragmented Calculation Functions:**
- `frontend/src/utils/metricsUtils.js` - General metric infrastructure with METRIC_CALCULATORS registry
- `frontend/src/utils/financingMetrics.js` - Financial calculations (DSCR, IRR, NPV, Equity IRR)
- `frontend/src/utils/finance/calculations.js` - Overlapping financial calculations
- `frontend/src/utils/finance/sensitivityMetrics.js` - SUPPORTED_METRICS for DriverExplorerCard
- `frontend/src/utils/timeSeries/aggregation.js` - Static WIND_INDUSTRY_AGGREGATIONS mapping

**Inconsistent Patterns:**
- FinanceabilityCard uses local `enhancedFinanceMetrics()` with custom MetricsDataTable setup
- DriverExplorerCard uses fixed `SUPPORTED_METRICS` with hardcoded target metrics
- No unified approach for metric definitions, calculations, or display formatting

**Context Integration Issues:**
- CashflowContext handles cashflow data and sensitivity data but not computed metrics
- Cards perform local metric calculations instead of using centralized data
- No cache invalidation or dependency tracking for metric computations

**Current Function Usage:**
- `enhancedFinanceMetrics(aggregations, availablePercentiles, scenarioData, lineItems)` in FinanceabilityCard
- `SUPPORTED_METRICS` object mapping in DriverExplorerCard
- `WIND_INDUSTRY_AGGREGATIONS.npv` style access patterns throughout codebase

### 2.2 Technical Debt
- Functions like `calculateIRR`, `calculateNPV`, `calculateDSCR` exist in multiple files with slight variations
- Inconsistent error handling and validation patterns
- Mixed approaches to threshold evaluation and visual formatting
- Static WIND_INDUSTRY_AGGREGATIONS mapping that doesn't scale with new metrics
- No standardized input/output interfaces for calculations

---

## 3. Solution Architecture

### 3.1 Core Design Principles
**Single Source of Truth**: One registry containing all metric definitions, calculations, and metadata  
**Modular Structure**: Individual files per metric with standardized exports  
**Cube-Ready Design**: Architecture supports future percentile cube storage  
**Registry-Driven**: All functionality driven by registry configuration  
**Scalable Aggregation**: Move from static WIND_INDUSTRY_AGGREGATIONS to registry-based strategies
**Backward Compatibility**: NO backward compatibility - clean migration approach  

### 3.2 File Structure Design
```
frontend/src/utils/cashflow/metrics/
├── registry.js                           # CASHFLOW_METRICS_REGISTRY
├── processor.js                          # Data processing utilities
├── calculations/
│   ├── index.js                         # Wildcard exports (export * from './irr.js')
│   ├── irr.js                           # IRR calculation, formatting, thresholds
│   ├── npv.js                           # NPV calculation, formatting, thresholds
│   ├── dscr.js                          # DSCR calculation, formatting, thresholds
│   ├── lcoe.js                          # LCOE calculation, formatting, thresholds
│   ├── equityIrr.js                     # Equity IRR calculation
│   ├── llcr.js                          # LLCR calculation
│   ├── icr.js                           # ICR calculation
│   ├── payback.js                       # Payback period calculation
│   └── ...                             # Additional metrics as needed
└── documentation.md                      # Usage patterns and examples
```

### 3.3 Registry Structure & Integration Points
Each metric in `CASHFLOW_METRICS_REGISTRY` includes:
- **Calculation Function**: Standardized `calculate(input)` interface
- **Display Formatting**: `format(value, options)` and `formatImpact(impact, options)`
- **Threshold Configuration**: Wind industry standard thresholds with visual feedback
- **Usage Flags**: `['financeability', 'sensitivity', 'comparative', 'operational']`
- **Aggregation Strategy**: Registry-based (replacing static WIND_INDUSTRY_AGGREGATIONS)
- **Data Dependencies**: References to `CashflowDataSource.aggregations` keys
- **Cube Metadata**: Future cube implementation preparation

### 3.4 Data Flow Understanding

#### SOURCE REGISTRIES Structure
```typescript
// CASHFLOW_SOURCE_REGISTRY - Direct cashflow contributors
interface CashflowSourceEntry {
  id: string; // e.g., 'energyRevenue', 'contractFees'
  displayName: string;
  path: string[]; // ['simulation', 'inputSim', 'distributionAnalysis', 'energyPrice']
  references?: string[][]; // Optional additional data paths
  category: string;
  hasPercentiles: boolean; // Distribution data vs fixed data
  transformer?: string; // Function from TRANSFORMER_REGISTRY
  multipliers?: Array<{id: string; operation: string; path: string[]}>; 
  description: string;
}

// SENSITIVITY_SOURCE_REGISTRY - Indirect variables
interface SensitivitySourceEntry {
  id: string; // e.g., 'availability', 'windVariability'
  displayName: string;
  path: string[];
  category: string;
  hasPercentiles: boolean;
  dependencies: {
    affects: Array<{
      sourceId: string; // References CASHFLOW_SOURCE_REGISTRY .id
      impactType: 'multiplicative' | 'additive' | 'recalculation';
    }>;
  };
  description: string;
}
```

#### Distribution Analysis Data Structure
```typescript
// When hasPercentiles = true:
interface DistributionData {
  results: Array<{
    percentile: { value: number }; // 10, 25, 50, 75, 90
    data: Array<{year: number, value: number}>; // Time-series data
  }>;
  statistics: { mean: DataPoint[], stdDev: DataPoint[], ... };
}

// When hasPercentiles = false:
// Path points to: Array<DataPointSchema>, number, or object requiring transformer
```

#### Metrics to Aggregations Mapping
```typescript
// Metrics depend on CashflowDataSource.aggregations, not individual sources
interface CashflowDataSourceAggregations {
  totalCosts: { data: Array<DataPointSchema>; metadata: any };
  totalRevenue: { data: Array<DataPointSchema>; metadata: any };
  netCashflow: { data: Array<DataPointSchema>; metadata: any };
  // Future aggregations can be added here
}

// Metrics reference these aggregation keys:
// dependsOn: ['netCashflow'] -> uses aggregations.netCashflow.data
// dependsOn: ['totalCosts', 'totalRevenue'] -> uses both aggregations
```

---

## 4. Detailed Implementation Plan

### 4.1 Phase 1: Registry Infrastructure (Critical Priority)

#### Task 1.1: Core Registry Creation
**File:** `frontend/src/utils/cashflow/metrics/registry.js`

**Key Requirements:**
- Import all metric calculations using `import * as irrCalculations from './calculations/irr.js'`
- Define `CASHFLOW_METRICS_REGISTRY` with scalable aggregation strategies
- Replace static WIND_INDUSTRY_AGGREGATIONS with registry-based approach
- Include utility functions: `getMetricsByUsage()`, `getAllMetricKeys()`, `getMetricConfig()`

**Registry Structure:**
```javascript
export const CASHFLOW_METRICS_REGISTRY = {
  npv: {
    ...npvCalculations, // Spread: calculate, format, formatImpact, thresholds, evaluateThreshold, metadata
    category: 'financial',
    usage: ['financeability', 'sensitivity'],
    priority: 1,
    cubeConfig: {
      aggregation: {
        method: 'npv',
        options: { filter: 'all', discountRate: 0.08 }
      },
      dependsOn: ['netCashflow'], // References CashflowDataSource.aggregations keys
      preCompute: true,
      sensitivityRelevant: true,
      // Cube preparation metadata
      cubeMetadata: {
        timeSeriesRequired: true,
        percentileDependent: true,
        aggregatesTo: 'single_value'
      }
    }
  },
  
  irr: {
    ...irrCalculations,
    category: 'financial',
    usage: ['financeability', 'sensitivity'],
    priority: 2,
    cubeConfig: {
      aggregation: {
        method: 'first', // IRR is already aggregated
        options: { filter: 'all' }
      },
      dependsOn: ['netCashflow'],
      preCompute: true,
      sensitivityRelevant: true,
      cubeMetadata: {
        timeSeriesRequired: true,
        percentileDependent: true,
        aggregatesTo: 'single_value'
      }
    }
  }
  // ... other metrics
};

// Utility functions
export const getMetricsByUsage = (usageType) => {
  return Object.fromEntries(
    Object.entries(CASHFLOW_METRICS_REGISTRY)
      .filter(([key, config]) => config.usage.includes(usageType))
      .sort((a, b) => a[1].priority - b[1].priority)
  );
};

export const getAllMetricKeys = () => Object.keys(CASHFLOW_METRICS_REGISTRY);

export const getMetricConfig = (metricKey) => CASHFLOW_METRICS_REGISTRY[metricKey];

// Migration helper for WIND_INDUSTRY_AGGREGATIONS replacement
export const getAggregationStrategy = (metricKey) => {
  const config = CASHFLOW_METRICS_REGISTRY[metricKey];
  return config?.cubeConfig?.aggregation || null;
};
```

**Dependencies:** None  
**Estimated Effort:** 6 hours  
**Files Created:** 1 new file  

#### Task 1.2: Individual Metric Implementation Files
**Files:** `frontend/src/utils/cashflow/metrics/calculations/*.js`

**Standardized Export Structure:**
```javascript
// Each metric file exports (e.g., npv.js):
export const calculate = (input) => {
  const { cashflowData, scenarioData, options = {} } = input;
  
  // For simple aggregation metrics, use registry strategy
  const metricConfig = CASHFLOW_METRICS_REGISTRY?.npv;
  if (metricConfig?.cubeConfig?.aggregation) {
    const { method, options: defaultOptions } = metricConfig.cubeConfig.aggregation;
    const aggregationOptions = { ...defaultOptions, ...options };
    
    // Get data from CashflowDataSource.aggregations
    const timeSeriesData = cashflowData?.aggregations?.netCashflow?.data;
    if (!timeSeriesData) {
      return { value: null, error: 'Missing netCashflow data', metadata: { calculationMethod: 'npv' } };
    }
    
    // Use existing aggregateTimeSeries function
    const value = aggregateTimeSeries(timeSeriesData, method, aggregationOptions);
    return {
      value,
      error: null,
      metadata: {
        calculationMethod: 'npv',
        aggregationMethod: method,
        inputSources: metricConfig.cubeConfig.dependsOn
      }
    };
  }
  
  // For complex metrics, use custom calculation logic
  return customCalculationLogic(input);
};

export const format = (value, options = {}) => {
  if (value === null || value === undefined) return 'N/A';
  const { precision = 1, currency = 'USD' } = options;
  return `${currency} ${(value / 1000000).toFixed(precision)}M`;
};

export const formatImpact = (impact, options = {}) => {
  if (impact === null || impact === undefined) return 'N/A';
  const { precision = 1 } = options;
  const sign = impact >= 0 ? '+' : '';
  return `${sign}${(impact / 1000000).toFixed(precision)}M`;
};

export const thresholds = {
  excellent: { min: 5000000, color: 'success', description: 'Excellent NPV (≥$5M)' },
  good: { min: 2000000, color: 'success', description: 'Good NPV ($2M-$5M)' },
  acceptable: { min: 0, color: 'warning', description: 'Positive NPV ($0-$2M)' },
  poor: { min: -Infinity, color: 'error', description: 'Negative NPV (<$0)' }
};

export const evaluateThreshold = (value, scenarioData = {}) => {
  if (value === null || value === undefined) {
    return { level: 'unknown', color: 'default', description: 'No data' };
  }

  // Check for custom return targets
  const returnTargets = scenarioData?.settings?.returnTargets;
  if (returnTargets?.minNPV) {
    const target = returnTargets.minNPV;
    if (value >= target) {
      return { level: 'target_met', color: 'success', description: `Above target ($${(target/1000000).toFixed(1)}M)` };
    } else {
      return { level: 'below_target', color: 'warning', description: `Below target ($${(target/1000000).toFixed(1)}M)` };
    }
  }

  // Default threshold evaluation
  for (const [level, threshold] of Object.entries(thresholds)) {
    if (value >= threshold.min) {
      return { level, ...threshold };
    }
  }

  return { level: 'poor', ...thresholds.poor };
};

export const metadata = {
  name: 'Net Present Value',
  shortName: 'NPV',
  description: 'Present value of all future cash flows discounted at the cost of capital',
  units: 'currency',
  displayUnits: '$M',
  windIndustryStandard: true,
  calculationComplexity: 'medium'
};
```

**Critical Implementation Details:**
- Use existing `aggregateTimeSeries` function with registry-defined strategies
- Leverage existing `transformScenarioToCashflow` pipeline through `cashflowData` parameter
- Simple error handling: log errors, return `{value: null, error: message, metadata}`
- Reference `CashflowDataSource.aggregations` keys in `dependsOn` arrays
- Don't wrap simple operations in unnecessary functions

**Metrics Implementation Priority:**
1. `npv.js` - Use aggregation: `{method: 'npv', options: {filter: 'all'}}`
2. `irr.js` - Use aggregation: `{method: 'first', options: {filter: 'all'}}`
3. `dscr.js` - Use aggregation: `{method: 'min', options: {filter: 'operational'}}`
4. `lcoe.js` - Custom calculation (complex formula)
5. `equityIrr.js`, `llcr.js`, `icr.js`, `payback.js`

**Dependencies:** Task 1.1  
**Estimated Effort:** 16 hours (2 hours per metric)  
**Files Created:** 8+ new files  

#### Task 1.3: Data Processor Utilities
**File:** `frontend/src/utils/cashflow/metrics/processor.js`

**Key Functions:**
```javascript
export const validateMetricInput = (input, metricKey) => {
  if (!input) {
    console.warn(`No input provided for metric: ${metricKey}`);
    return false;
  }
  
  const hasRequiredData = input.cashflowData || input.timeSeries || input.aggregations;
  if (!hasRequiredData) {
    console.warn(`No data provided for metric: ${metricKey}`);
    return false;
  }
  
  return true;
};

export const calculateMetricFromRegistry = (metricKey, input) => {
  const metricConfig = CASHFLOW_METRICS_REGISTRY[metricKey];
  if (!metricConfig) {
    return { value: null, error: `Unknown metric: ${metricKey}`, metadata: {} };
  }
  
  if (!validateMetricInput(input, metricKey)) {
    return { value: null, error: 'Invalid input data', metadata: { calculationMethod: metricKey } };
  }
  
  try {
    return metricConfig.calculate(input);
  } catch (error) {
    console.error(`Metric ${metricKey} calculation failed:`, error.message);
    return {
      value: null,
      error: error.message,
      metadata: { calculationMethod: metricKey }
    };
  }
};

export const computeAllMetrics = async (cashflowData, scenarioData) => {
  const metrics = new Map();
  
  for (const [metricKey, metricConfig] of Object.entries(CASHFLOW_METRICS_REGISTRY)) {
    try {
      const result = calculateMetricFromRegistry(metricKey, { cashflowData, scenarioData });
      metrics.set(metricKey, result);
    } catch (error) {
      console.error(`Failed to compute metric ${metricKey}:`, error.message);
      metrics.set(metricKey, { 
        value: null, 
        error: error.message, 
        metadata: { calculationMethod: metricKey } 
      });
    }
  }
  
  return metrics;
};

export const getTimeSeriesFromCashflowData = (cashflowData, aggregationKey) => {
  return cashflowData?.aggregations?.[aggregationKey]?.data || null;
};

// Migration helper functions
export const migrateFromWindIndustryAggregations = (oldMetricKey) => {
  // Helper to migrate existing WIND_INDUSTRY_AGGREGATIONS usage
  const strategy = getAggregationStrategy(oldMetricKey);
  if (!strategy) {
    console.warn(`No registry strategy found for metric: ${oldMetricKey}`);
    return null;
  }
  return strategy;
};
```

**Dependencies:** Tasks 1.1, 1.2  
**Estimated Effort:** 8 hours  
**Files Created:** 1 new file  

#### Task 1.4: Schema Validation
**File:** `schemas/yup/cashflowMetrics.js`

**Schema Requirements:**
```javascript
const Yup = require('yup');

const MetricResultSchema = Yup.object().shape({
  value: Yup.mixed().nullable(),
  error: Yup.string().nullable(),
  metadata: Yup.object().shape({
    calculationMethod: Yup.string().required(),
    aggregationMethod: Yup.string().optional(),
    inputSources: Yup.array().of(Yup.string()).optional()
  }).required()
});

const AggregationStrategySchema = Yup.object().shape({
  method: Yup.string().oneOf(['sum', 'npv', 'mean', 'min', 'max', 'first', 'last', 'weighted_mean']).required(),
  options: Yup.object().shape({
    filter: Yup.string().oneOf(['all', 'operational', 'construction', 'early', 'late']).optional(),
    discountRate: Yup.number().optional(),
    weights: Yup.array().of(Yup.number()).optional(),
    precision: Yup.number().optional()
  }).optional()
});

const CubeMetadataSchema = Yup.object().shape({
  timeSeriesRequired: Yup.boolean().required(),
  percentileDependent: Yup.boolean().required(),
  aggregatesTo: Yup.string().oneOf(['single_value', 'time_series', 'complex_object']).required()
});

const MetricConfigSchema = Yup.object().shape({
  calculate: Yup.mixed().required(),
  format: Yup.mixed().required(),
  formatImpact: Yup.mixed().required(),
  thresholds: Yup.object().required(),
  evaluateThreshold: Yup.mixed().required(),
  metadata: Yup.object().required(),
  category: Yup.string().oneOf(['financial', 'risk', 'operational']).required(),
  usage: Yup.array().of(Yup.string().oneOf(['financeability', 'sensitivity', 'comparative'])).required(),
  priority: Yup.number().required(),
  cubeConfig: Yup.object().shape({
    aggregation: AggregationStrategySchema.optional(),
    dependsOn: Yup.array().of(Yup.string()).required(),
    preCompute: Yup.boolean().required(),
    sensitivityRelevant: Yup.boolean().required(),
    cubeMetadata: CubeMetadataSchema.required()
  }).required()
});

const CashflowMetricsRegistrySchema = Yup.object().test(
  'metrics-registry',
  'Must be a valid metrics registry',
  (value) => {
    if (!value || typeof value !== 'object') return false;
    
    return Object.entries(value).every(([key, config]) => {
      return typeof key === 'string' && MetricConfigSchema.isValidSync(config);
    });
  }
);

module.exports = {
  MetricResultSchema,
  AggregationStrategySchema,
  CubeMetadataSchema,
  MetricConfigSchema,
  CashflowMetricsRegistrySchema
};
```

**Key Validation Points:**
- Ensure aggregation method is valid
- Validate `dependsOn` references to known aggregation keys ('netCashflow', 'totalCosts', etc.)
- Check usage flags are valid
- Validate cube metadata for future implementation
- Minimal validation - don't over-engineer

**Dependencies:** Existing yup patterns  
**Estimated Effort:** 4 hours  
**Files Created:** 1 new file  

### 4.2 Phase 2: CashflowContext Integration (High Priority)

#### Task 2.1: Context Enhancement
**File:** `frontend/src/contexts/CashflowContext.jsx`

**Integration Requirements:**
- Add `computedMetrics` state alongside existing `cashflowData` and `sensitivityData`
- Integrate metrics computation into existing `refreshCashflowData` workflow
- Use existing percentile selection strategies
- Maintain existing error handling patterns

**Implementation Approach:**
```javascript
// Enhanced context state
const [computedMetrics, setComputedMetrics] = useState(null);
const [metricsLoading, setMetricsLoading] = useState(false);
const [metricsError, setMetricsError] = useState(null);

// Enhanced refresh function
const refreshCashflowData = useCallback(async (force = false) => {
  // ... existing cashflow data refresh logic
  
  // Add metrics computation after cashflow data is ready
  if (cashflowData && scenarioData) {
    try {
      setMetricsLoading(true);
      setMetricsError(null);
      
      const allMetrics = await computeAllMetrics(cashflowData, scenarioData);
      setComputedMetrics(allMetrics);
      
      console.log(`✅ Computed ${allMetrics.size} metrics successfully`);
    } catch (error) {
      console.error('❌ Metrics computation failed:', error);
      setMetricsError(error.message);
      setComputedMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  } else {
    // Clear metrics if no data available
    setComputedMetrics(null);
    setMetricsError(null);
  }
}, [cashflowData, scenarioData, /* other existing dependencies */]);

// Enhanced context value
const value = {
  // ... existing values
  computedMetrics,
  metricsLoading,
  metricsError,
  
  // Utility functions for cards
  getMetricsByUsage: (usageType) => {
    if (!computedMetrics) return {};
    const eligibleMetrics = getMetricsByUsage(usageType);
    const result = {};
    for (const [key, config] of Object.entries(eligibleMetrics)) {
      result[key] = {
        ...config,
        result: computedMetrics.get(key) || { value: null, error: 'Not computed', metadata: {} }
      };
    }
    return result;
  },
  
  getMetricResult: (metricKey) => {
    return computedMetrics?.get(metricKey) || { value: null, error: 'Not available', metadata: {} };
  },
  
  refreshMetrics: () => refreshCashflowData(true)
};
```

**Error Handling Strategy:**
- Metrics computation errors don't break existing cashflow functionality
- Cards receive error information and can display fallback content
- Individual metric failures don't prevent other metrics from computing
- Clear error messages logged for debugging

**Dependencies:** Phase 1 completion  
**Estimated Effort:** 6 hours  
**Files Modified:** 1 existing file  

#### Task 2.2: Cache Strategy
**Implementation Details:**
- Simple cache invalidation when `cashflowData` or `scenarioData` changes
- Use existing dependency tracking patterns from CashflowContext
- Metrics computed with same lifecycle as `cashflowData`
- No complex versioning - just recompute when underlying data changes

**Cache Invalidation Logic:**
```javascript
// Metrics are invalidated when:
// 1. cashflowData changes (new percentile selection, data refresh)
// 2. scenarioData changes (settings modifications)
// 3. Manual refresh requested

const prevCashflowDataRef = useRef();
const prevScenarioDataRef = useRef();

useEffect(() => {
  const cashflowChanged = cashflowData !== prevCashflowDataRef.current;
  const scenarioChanged = scenarioData !== prevScenarioDataRef.current;
  
  if (cashflowChanged || scenarioChanged) {
    prevCashflowDataRef.current = cashflowData;
    prevScenarioDataRef.current = scenarioData;
    
    // Recompute metrics
    refreshCashflowData();
  }
}, [cashflowData, scenarioData, refreshCashflowData]);
```

**Dependencies:** Task 2.1  
**Estimated Effort:** 4 hours  
**Files Modified:** 1 existing file  

### 4.3 Phase 3: Card Migration (High Priority)

#### Task 3.1: FinanceabilityCard Refactoring
**File:** `frontend/src/components/cards/FinanceabilityCard.jsx`

**Migration Strategy:**
- Remove local `enhancedFinanceMetrics()` calculation
- Use `computedMetrics` from CashflowContext instead
- Update `createFinancialMetricsConfig()` to use registry-based metrics
- Maintain existing MetricsDataTable integration and interface

**Before/After Pattern:**
```javascript
// BEFORE: Local calculation
const financingData = useMemo(() => {
  return enhancedFinanceMetrics(aggregations, availablePercentiles, scenarioData, lineItems);
}, [aggregations, availablePercentiles, scenarioData, lineItems]);

// AFTER: Registry-based from context
const { computedMetrics, getMetricsByUsage, metricsLoading, metricsError } = useCashflow();

const financeabilityMetrics = useMemo(() => {
  const eligibleMetrics = getMetricsByUsage('financeability');
  
  // Transform to expected MetricsDataTable format
  const metricsData = {};
  Object.entries(eligibleMetrics).forEach(([key, config]) => {
    const result = config.result;
    metricsData[key] = {
      value: result.value,
      error: result.error,
      metadata: result.metadata,
      // Maintain existing interface
      displayName: config.metadata.shortName,
      format: config.format,
      thresholds: config.thresholds
    };
  });
  
  return metricsData;
}, [computedMetrics]);

// Error handling for card display
if (metricsError) {
  return (
    <Card>
      <Alert 
        type="warning" 
        message="Metrics calculation failed" 
        description={metricsError}
        action={<Button onClick={refreshMetrics}>Retry</Button>}
      />
    </Card>
  );
}
```

**createFinancialMetricsConfig() Migration:**
```javascript
// Update config function to use registry data
export const createFinancialMetricsConfig = (context) => {
  const { financeabilityMetrics, availablePercentiles, currency = 'USD' } = context;
  
  // Build rows from registry metrics instead of local calculations
  const rowDefinitions = [];
  Object.entries(financeabilityMetrics).forEach(([key, metricData]) => {
    if (metricData.value !== null) {
      rowDefinitions.push({
        key,
        label: metricData.displayName,
        value: metricData.value,
        formatted: metricData.format(metricData.value, { currency }),
        threshold: metricData.thresholds ? evaluateThreshold(metricData.value) : null,
        error: metricData.error
      });
    }
  });
  
  // Maintain existing MetricsDataTable interface
  return {
    data: rowDefinitions,
    config: {
      // ... existing config options
    }
  };
};
```

**Dependencies:** Phase 2 completion  
**Estimated Effort:** 8 hours  
**Files Modified:** 1 existing file, 1 config file  

#### Task 3.2: DriverExplorerCard Refactoring
**File:** `frontend/src/components/cards/DriverExplorerCard.jsx`

**Migration Strategy:**
- Remove fixed `SUPPORTED_METRICS` references
- Use registry-based target metric selection from `getMetricsByUsage('sensitivity')`
- Update sensitivity analysis to use unified calculation engine
- Maintain existing tornado chart functionality and interface

**Key Changes:**
```javascript
// BEFORE: Fixed metrics
import { SUPPORTED_METRICS } from '../../../utils/finance/sensitivityMetrics';
const targetMetrics = Object.keys(SUPPORTED_METRICS);

// AFTER: Registry-based metrics
const sensitivityMetrics = useMemo(() => {
  return getMetricsByUsage('sensitivity');
}, [computedMetrics]);

// Target metric selection for tornado charts
const targetMetricOptions = useMemo(() => {
  return Object.entries(sensitivityMetrics).map(([key, config]) => ({
    value: key,
    label: config.metadata.shortName,
    description: config.metadata.description,
    // Include current computed value for context
    currentValue: config.result?.value,
    formatted: config.result?.value ? config.format(config.result.value) : 'N/A'
  }));
}, [sensitivityMetrics]);

// Sensitivity analysis integration
const sensitivityResults = useMemo(() => {
  if (!selectedTargetMetric || !sensitivityMetrics[selectedTargetMetric]) {
    return [];
  }
  
  const metricConfig = sensitivityMetrics[selectedTargetMetric];
  
  // Use existing sensitivity analysis with registry metric
  return calculateSensitivityAnalysis({
    targetMetric: selectedTargetMetric,
    metricConfig: metricConfig,
    variables: allVariables,
    percentileRange,
    aggregationMethod: metricConfig.cubeConfig.aggregation,
    // ... other existing parameters
  });
}, [selectedTargetMetric, sensitivityMetrics, allVariables, percentileRange]);
```
**Tornado Chart Integration:**
```javascript
// Update tornado chart to use registry formatting
const tornadoChartData = useMemo(() => {
  if (!sensitivityResults.length || !selectedTargetMetric) return null;
  
  const metricConfig = sensitivityMetrics[selectedTargetMetric];
  
  return prepareTornadoChartData(sensitivityResults, {
    metricKey: selectedTargetMetric,
    formatValue: metricConfig.format,
    formatImpact: metricConfig.formatImpact,
    units: metricConfig.metadata.displayUnits,
    thresholds: metricConfig.thresholds
  });
}, [sensitivityResults, selectedTargetMetric, sensitivityMetrics]);
```

**Dependencies:** Phase 2 completion  
**Estimated Effort:** 6 hours  
**Files Modified:** 1 existing file  





### 4.4 Phase 4: Legacy Cleanup (Medium Priority)

#### Task 4.1: Function Consolidation Audit
**Affected Files:**
- `frontend/src/utils/metricsUtils.js`
- `frontend/src/utils/financingMetrics.js`  
- `frontend/src/utils/finance/calculations.js`
- `frontend/src/utils/finance/sensitivityMetrics.js`
- `frontend/src/utils/timeSeries/aggregation.js` (remove WIND_INDUSTRY_AGGREGATIONS)

**Consolidation Process:**
1. **Identify References**: Use search tools to find all usage of:
   - `WIND_INDUSTRY_AGGREGATIONS.{metric}`
   - `calculateIRR`, `calculateNPV`, `calculateDSCR` functions
   - `SUPPORTED_METRICS` object access
   - `enhancedFinanceMetrics` function calls

2. **Migration Mapping:**
```javascript
// OLD -> NEW migration patterns:

// WIND_INDUSTRY_AGGREGATIONS usage:
// OLD: WIND_INDUSTRY_AGGREGATIONS.npv
// NEW: CASHFLOW_METRICS_REGISTRY.npv.cubeConfig.aggregation

// Direct function calls:
// OLD: calculateIRR(cashflows)
// NEW: CASHFLOW_METRICS_REGISTRY.irr.calculate({cashflowData, scenarioData})

// Metric selection:
// OLD: Object.keys(SUPPORTED_METRICS)
// NEW: Object.keys(getMetricsByUsage('sensitivity'))

// Enhanced metrics:
// OLD: enhancedFinanceMetrics(aggregations, percentiles, scenario, lineItems)
// NEW: getMetricsByUsage('financeability') from CashflowContext
```

3. **Update Process:**
   - Create migration helper functions in `processor.js`
   - Update imports across affected components
   - Test each change to ensure functionality preserved
   - Remove old functions only after all references updated

**Dependencies:** Phase 3 completion  
**Estimated Effort:** 14 hours  
**Files Modified:** 5+ existing files  

#### Task 4.2: Import Statement Updates
**Scope:** Update imports across 10+ component files

**Pattern Updates:**
```javascript
// BEFORE
import { calculateIRR, calculateNPV } from '../../../utils/financingMetrics';
import { SUPPORTED_METRICS } from '../../../utils/finance/sensitivityMetrics';
import { WIND_INDUSTRY_AGGREGATIONS } from '../../../utils/timeSeries/aggregation';

// AFTER
import { getMetricConfig, CASHFLOW_METRICS_REGISTRY } from '../../../utils/cashflow/metrics/registry';
import { computeAllMetrics, calculateMetricFromRegistry } from '../../../utils/cashflow/metrics/processor';

// For cards using CashflowContext:
const { computedMetrics, getMetricsByUsage } = useCashflow();
```

**Files Requiring Import Updates:**
- All cards using financial calculations
- Utility functions referencing WIND_INDUSTRY_AGGREGATIONS
- Components using SUPPORTED_METRICS
- Test files importing calculation functions

**Dependencies:** Task 4.1  
**Estimated Effort:** 6 hours  
**Files Modified:** 10+ existing files  

#### Task 4.3: Dead Code Removal
**Cleanup Tasks:**
```javascript
// Remove from metricsUtils.js:
const METRIC_CALCULATORS = { ... }; // DELETE
export const calculateMetric = (...); // DELETE - replaced by registry

// Remove from financingMetrics.js:
export const calculateIRR = (...); // DELETE - moved to irr.js
export const calculateNPV = (...); // DELETE - moved to npv.js
export const enhancedFinanceMetrics = (...); // DELETE - replaced by context

// Remove from sensitivityMetrics.js:
export const SUPPORTED_METRICS = { ... }; // DELETE - replaced by registry

// Remove from timeSeries/aggregation.js:
export const WIND_INDUSTRY_AGGREGATIONS = { ... }; // DELETE - moved to registry
```

**Clean Up Process:**
1. Verify no remaining references to deleted functions
2. Remove unused import statements
3. Update package dependencies if any become unused
4. Run comprehensive tests to ensure no breakage
5. Update JSDoc comments and documentation

**Dependencies:** Task 4.2  
**Estimated Effort:** 4 hours  
**Files Modified:** Multiple existing files  

### 4.5 Phase 5: Documentation & Testing (Medium Priority)

#### Task 5.1: Comprehensive Documentation
**File:** `frontend/src/utils/cashflow/metrics/documentation.md`

**Documentation Structure:**
```markdown
# Unified Cashflow Metrics System

## Overview
The unified metrics system provides a scalable, registry-based approach...

## Architecture
- Registry structure and configuration
- Integration with CashflowContext
- Data flow from sources to metrics

## Adding New Metrics
Step-by-step guide:
1. Create metric calculation file
2. Add to registry
3. Test functionality
4. Update cards if needed

## Migration Guide
How to migrate from old patterns:
- WIND_INDUSTRY_AGGREGATIONS -> registry aggregation
- Direct function calls -> registry-based calls
- Fixed metric lists -> usage-based filtering

## Usage Examples
### For Card Developers
```javascript
const { getMetricsByUsage } = useCashflow();
const metrics = getMetricsByUsage('financeability');
```

### For New Metrics
```javascript
// Create new metric file
export const calculate = (input) => { ... };
// Add to registry
export const CASHFLOW_METRICS_REGISTRY = {
  newMetric: { ...newMetricCalculations, ... }
};
```

## Troubleshooting
Common issues and solutions

**Dependencies:** All previous phases  
**Estimated Effort:** 8 hours  
**Files Created:** 1 new file  

#### Task 5.2: JSDoc Documentation
**Documentation Standards:**
```javascript
/**
 * Calculate financial metric using registry configuration
 * @param {string} metricKey - Key from CASHFLOW_METRICS_REGISTRY
 * @param {Object} input - Standardized input object
 * @param {CashflowDataSource} input.cashflowData - Transformed cashflow data
 * @param {ScenarioData} input.scenarioData - Raw scenario data
 * @param {Object} input.options - Optional calculation overrides
 * @returns {MetricResult} Standardized result with value, error, metadata
 * @example
 * const result = calculateMetricFromRegistry('npv', {
 *   cashflowData: transformedData,
 *   scenarioData: rawData
 * });
 */
export const calculateMetricFromRegistry = (metricKey, input) => { ... };
```

**Dependencies:** All implementation phases  
**Estimated Effort:** 6 hours  
**Files Modified:** All new files  

#### Task 5.3: Testing Strategy
**Test Coverage Requirements:**
- **Unit Tests**: Each metric calculation with various inputs
- **Integration Tests**: Registry and processor utilities with real data
- **End-to-End Tests**: Card functionality with new system
- **Performance Tests**: Ensure no regression in computation speed
- **Regression Tests**: Validate metric outputs match current system during migration

**Test Structure:**
```javascript
// Unit test example
describe('NPV Calculation', () => {
  test('calculates NPV correctly with standard inputs', () => {
    const input = {
      cashflowData: mockCashflowData,
      scenarioData: mockScenarioData
    };
    const result = calculateMetricFromRegistry('npv', input);
    expect(result.value).toBeCloseTo(expectedNPV, 2);
    expect(result.error).toBeNull();
  });
  
  test('handles missing data gracefully', () => {
    const input = { cashflowData: null };
    const result = calculateMetricFromRegistry('npv', input);
    expect(result.value).toBeNull();
    expect(result.error).toBeTruthy();
  });
});

// Integration test example
describe('CashflowContext Integration', () => {
  test('computes all metrics when cashflow data available', async () => {
    const { result } = renderHook(() => useCashflow(), {
      wrapper: CashflowProvider
    });
    
    // Trigger data refresh
    act(() => {
      result.current.refreshCashflowData();
    });
    
    await waitFor(() => {
      expect(result.current.computedMetrics).toBeTruthy();
      expect(result.current.computedMetrics.size).toBeGreaterThan(0);
    });
  });
});
```

**No Old vs New Comparison Testing**: Focus on functionality preservation rather than output comparison between old and new systems.

**Dependencies:** All implementation phases  
**Estimated Effort:** 12 hours  
**Files Created:** Multiple test files  

---

## 5. Technical Specifications

### 5.1 Standardized Metric Interface

#### Input Format (Using Existing CashflowDataSource)
```typescript
interface MetricInput {
  // Primary data source - use existing structure
  cashflowData?: CashflowDataSource; // From transformScenarioToCashflow
  
  // Direct aggregations access when needed
  aggregations?: {
    totalCosts: { data: Array<DataPointSchema>; metadata: any };
    totalRevenue: { data: Array<DataPointSchema>; metadata: any };
    netCashflow: { data: Array<DataPointSchema>; metadata: any };
  };
  
  // Context data for threshold evaluation
  scenarioData?: ScenarioData;
  
  // Simple options - don't over-engineer
  options?: {
    discountRate?: number; // Override default discount rate
    precision?: number; // Display precision
    currency?: string; // Currency for formatting
  };
}
```

#### Output Format (Consistent Error Handling)
```typescript
interface MetricResult {
  value: number | string | object | null;
  error: string | null; // Simple error message for logging/display
  metadata: {
    calculationMethod: string; // Metric key from registry
    aggregationMethod?: string; // Which aggregation method used
    inputSources?: string[]; // Which CashflowDataSource.aggregations keys used
    computationTime?: number; // Milliseconds for performance monitoring
    [key: string]: any; // Extensible for metric-specific metadata
  };
}
```

### 5.2 Registry Configuration Schema (Scalable Aggregation)

```typescript
interface MetricConfig {
  // Core functions (imported from individual metric files)
  calculate: (input: MetricInput) => MetricResult;
  format: (value: any, options?: FormatOptions) => string;
  formatImpact: (impact: number, options?: FormatOptions) => string;
  
  // Threshold evaluation for visual feedback
  thresholds: Record<string, ThresholdDefinition>;
  evaluateThreshold: (value: any, scenarioData?: ScenarioData) => ThresholdResult;
  
  // Descriptive metadata
  metadata: {
    name: string; // Full name: "Net Present Value"
    shortName: string; // Display name: "NPV"
    description: string; // Detailed description
    units: string; // Data type: "currency", "percentage", "ratio"
    displayUnits: string; // Display format: "$M", "%", "x"
    windIndustryStandard: boolean; // Industry compliance flag
    calculationComplexity: 'low' | 'medium' | 'high'; // Performance hint
  };
  
  // Categorization for filtering
  category: 'financial' | 'risk' | 'operational';
  usage: Array<'financeability' | 'sensitivity' | 'comparative'>;
  priority: number; // Display order within category
  
  // Cube configuration with aggregation strategy
  cubeConfig: {
    // Aggregation strategy - replaces static WIND_INDUSTRY_AGGREGATIONS
    aggregation?: {
      method: 'sum' | 'npv' | 'mean' | 'min' | 'max' | 'first' | 'last' | 'weighted_mean';
      options?: {
        filter?: 'all' | 'operational' | 'construction' | 'early' | 'late';
        discountRate?: number; // Default rate, can be overridden
        weights?: number[]; // For weighted averages
        precision?: number; // Calculation precision
      };
    };
    
    // Dependencies - which CashflowDataSource.aggregations this metric needs
    dependsOn: string[]; // e.g., ['netCashflow'], ['totalCosts', 'totalRevenue']
    
    // Computation flags
    preCompute: boolean; // Should be computed automatically
    sensitivityRelevant: boolean; // Usable in tornado charts
    
    // Future cube preparation metadata
    cubeMetadata: {
      timeSeriesRequired: boolean; // Needs time-series data
      percentileDependent: boolean; // Varies with percentile selection
      aggregatesTo: 'single_value' | 'time_series' | 'complex_object'; // Output type
    };
  };
}
```

### 5.3 Implementation Approach (Scalable Aggregation Strategy)

#### Registry-Based Aggregation Usage
```typescript
// Use existing aggregateTimeSeries with registry-defined strategy
export const calculate = (input: MetricInput): MetricResult => {
  try {
    const { cashflowData, scenarioData, options = {} } = input;
    
    // Get aggregation strategy from registry
    const metricConfig = CASHFLOW_METRICS_REGISTRY.npv;
    if (!metricConfig?.cubeConfig?.aggregation) {
      return { value: null, error: 'No aggregation strategy defined', metadata: { calculationMethod: 'npv' } };
    }
    
    const { method, options: defaultOptions } = metricConfig.cubeConfig.aggregation;
    
    // Allow scenario data to override default options
    const aggregationOptions = {
      ...defaultOptions,
      discountRate: scenarioData?.settings?.modules?.financing?.discountRate || defaultOptions.discountRate,
      ...options // Input options take highest precedence
    };
    
    // Get required data from CashflowDataSource
    const timeSeriesData = cashflowData?.aggregations?.netCashflow?.data;
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      return { value: null, error: 'Missing or invalid netCashflow data', metadata: { calculationMethod: 'npv' } };
    }
    
    // Use existing aggregateTimeSeries function
    const startTime = performance.now();
    const npvValue = aggregateTimeSeries(timeSeriesData, method, aggregationOptions);
    const computationTime = performance.now() - startTime;
    
    return {
      value: npvValue,
      error: null,
      metadata: {
        calculationMethod: 'npv',
        aggregationMethod: method,
        inputSources: metricConfig.cubeConfig.dependsOn,
        computationTime
      }
    };
  } catch (error) {
    console.error('NPV calculation failed:', error.message);
    return {
      value: null,
      error: error.message,
      metadata: { calculationMethod: 'npv' }
    };
  }
};
```

#### Generic Metric Calculator
```typescript
// Generic calculator that works for any metric using registry strategy
export const calculateMetricFromRegistry = (metricKey: string, input: MetricInput): MetricResult => {
  const metricConfig = CASHFLOW_METRICS_REGISTRY[metricKey];
  if (!metricConfig) {
    return { 
      value: null, 
      error: `Unknown metric: ${metricKey}`, 
      metadata: { calculationMethod: metricKey } 
    };
  }
  
  // Validate input
  if (!validateMetricInput(input, metricKey)) {
    return { 
      value: null, 
      error: 'Invalid input data', 
      metadata: { calculationMethod: metricKey } 
    };
  }
  
  try {
    // Use the metric's calculate function
    return metricConfig.calculate(input);
  } catch (error) {
    console.error(`Metric ${metricKey} calculation failed:`, error.message);
    return {
      value: null,
      error: error.message,
      metadata: { calculationMethod: metricKey }
    };
  }
};
```
#### Migration Helpers for WIND_INDUSTRY_AGGREGATIONS
```typescript
// Helper functions to ease migration from static mappings
export const getAggregationStrategy = (metricKey: string): AggregationStrategy | null => {
  const config = CASHFLOW_METRICS_REGISTRY[metricKey];
  return config?.cubeConfig?.aggregation || null;
};

export const getAllAggregationStrategies = (): Record<string, AggregationStrategy> => {
  const strategies: Record<string, AggregationStrategy> = {};
  
  Object.entries(CASHFLOW_METRICS_REGISTRY).forEach(([key, config]) => {
    if (config.cubeConfig.aggregation) {
      strategies[key] = config.cubeConfig.aggregation;
    }
  });
  
  return strategies;
};

// For existing code migration
export const migrateAggregationCall = (oldMetricKey: string, data: Array<DataPointSchema>, options?: any) => {
  const strategy = getAggregationStrategy(oldMetricKey);
  if (!strategy) {
    console.warn(`No aggregation strategy found for ${oldMetricKey}, using default 'sum'`);
    return aggregateTimeSeries(data, 'sum', options);
  }
  
  return aggregateTimeSeries(data, strategy.method, { ...strategy.options, ...options });
};
```

### 5.4 Wind Industry Standards Integration

**Metric Standards:**
- **IRR/NPV**: Standard project finance calculations with appropriate discount rates (8-12% typical)
- **DSCR/LLCR**: Debt service calculations aligned with project finance covenants (>1.3x typical)
- **LCOE**: Wind industry standard levelized cost methodology ($30-60/MWh typical)
- **Threshold Values**: Industry-standard return targets and risk thresholds
- **Units**: Consistent with wind industry reporting (%, $/MWh, ratio values)

**Aggregation Standards:**
- **Operational Filter**: Years > 0 for DSCR, operational cash flows
- **Construction Filter**: Years ≤ 0 for construction costs, capex
- **All Years Filter**: Complete project life for NPV, IRR calculations
- **NPV Discounting**: Proper discount rate application for present value calculations

**Error Handling Standards:**
- Log errors but don't break UI functionality
- Provide meaningful error messages for troubleshooting
- Graceful degradation when data is missing or invalid
- Clear indication when calculations couldn't be performed

---

## 6. Migration Strategy

### 6.1 No Backward Compatibility Approach
- Build complete new system before migration begins
- Migrate one card at a time with full testing
- Remove old code only after successful migration
- No alias functions or compatibility layers
- Feature branch development with comprehensive testing before merge

### 6.2 Migration Sequence
1. **Infrastructure First**: Complete registry and calculation files
2. **Context Integration**: Add metrics computation to CashflowContext  
3. **Card by Card**: Migrate FinanceabilityCard, then DriverExplorerCard
4. **Legacy Cleanup**: Remove all old calculation patterns including WIND_INDUSTRY_AGGREGATIONS
5. **Documentation**: Complete usage documentation and examples

**Migration Testing Strategy:**
- Each phase tested independently before proceeding
- Integration tests to ensure card functionality preserved
- Performance benchmarks to ensure no regression
- User acceptance testing to verify UI behavior unchanged

### 6.3 Error Handling During Migration
**Card Error Display:**
```javascript
// Cards should handle metrics errors gracefully
if (metricsError) {
  return (
    <Card title="Financeability Analysis">
      <Alert 
        type="warning" 
        message="Metrics calculation failed" 
        description={metricsError}
        action={
          <Button size="small" onClick={refreshMetrics}>
            Retry Calculation
          </Button>
        }
      />
    </Card>
  );
}

// Individual metric errors
const displayMetricValue = (metricKey, metricData) => {
  if (metricData.error) {
    return (
      <Tooltip title={`Calculation failed: ${metricData.error}`}>
        <Text type="secondary">Error</Text>
      </Tooltip>
    );
  }
  
  return metricData.format(metricData.value);
};
```

---

## 7. Risk Assessment & Mitigation

### 7.1 Technical Risks

**Risk**: Breaking existing functionality during migration  
**Mitigation**: Complete new system implementation before touching existing code, comprehensive testing

**Risk**: Performance degradation with unified system  
**Mitigation**: Use existing `aggregateTimeSeries` function, implement efficient caching, performance benchmarks

**Risk**: Complexity in aggregation strategy migration  
**Mitigation**: Create migration helpers, systematic find-and-replace process, test each metric individually

**Risk**: Context state management complexity  
**Mitigation**: Follow existing CashflowContext patterns, simple error handling, clear state lifecycle

### 7.2 Business Risks

**Risk**: Extended development timeline affecting other features  
**Mitigation**: Phased approach with independent phases, parallel development capability

**Risk**: User confusion during system transition  
**Mitigation**: No user-visible changes - backend refactoring only, maintain exact UI behavior

**Risk**: Data integrity issues during migration  
**Mitigation**: Comprehensive regression testing, validation of metric outputs

---

## 8. Success Criteria

### 8.1 Technical Success Criteria
- ✅ Zero duplicate calculation functions across entire codebase
- ✅ All metrics computed centrally in CashflowContext with error handling
- ✅ New metrics can be added with registry configuration only (< 30 minutes)
- ✅ System supports future cube implementation without structural changes
- ✅ Static WIND_INDUSTRY_AGGREGATIONS mapping completely removed
- ✅ Registry structure includes cube preparation metadata
- ✅ Performance maintained or improved vs current system
- ✅ Error handling provides clear feedback without breaking UI

### 8.2 Business Success Criteria  
- ✅ FinanceabilityCard functionality identical to current implementation
- ✅ DriverExplorerCard functionality identical to current implementation  
- ✅ No user-visible changes during migration
- ✅ Development team can add new metrics independently
- ✅ Clear documentation enables new team member onboarding
- ✅ Metrics system ready for future cube context implementation

---

## 9. Implementation Timeline

| Phase | Duration | Dependencies | Deliverables |
|-------|----------|--------------|-------------|
| **Phase 1: Registry Infrastructure** | 34 hours | None | Registry, metric files, schemas, cube metadata |
| **Phase 2: Context Integration** | 10 hours | Phase 1 | Enhanced CashflowContext with metrics |
| **Phase 3: Card Migration** | 14 hours | Phase 2 | Migrated cards using registry |
| **Phase 4: Legacy Cleanup** | 24 hours | Phase 3 | Clean codebase, removed duplicates |
| **Phase 5: Documentation & Testing** | 18 hours | Phase 4 | Complete documentation and tests |
| **Total** | **100 hours** | Sequential | Production-ready system |

**Estimated Timeline**: 12.5 working days for complete implementation

---

## 10. File Impact Summary

### Files to Create (15+ new files)
- `frontend/src/utils/cashflow/metrics/registry.js` - CASHFLOW_METRICS_REGISTRY with cube metadata
- `frontend/src/utils/cashflow/metrics/processor.js` - Data processing and migration helpers
- `frontend/src/utils/cashflow/metrics/calculations/index.js` - Wildcard exports
- `frontend/src/utils/cashflow/metrics/calculations/irr.js` - IRR with registry aggregation
- `frontend/src/utils/cashflow/metrics/calculations/npv.js` - NPV with registry aggregation
- `frontend/src/utils/cashflow/metrics/calculations/dscr.js` - DSCR with operational filter
- `frontend/src/utils/cashflow/metrics/calculations/lcoe.js` - LCOE custom calculation
- `frontend/src/utils/cashflow/metrics/calculations/equityIrr.js` - Equity IRR calculation
- `frontend/src/utils/cashflow/metrics/calculations/llcr.js` - LLCR calculation
- `frontend/src/utils/cashflow/metrics/calculations/icr.js` - ICR calculation
- `frontend/src/utils/cashflow/metrics/calculations/payback.js` - Payback period
- `schemas/yup/cashflowMetrics.js` - Registry and result validation
- `frontend/src/utils/cashflow/metrics/documentation.md` - Usage guide and examples

### Files to Modify (9+ existing files)
- `frontend/src/contexts/CashflowContext.jsx` - Add computedMetrics state and error handling
- `frontend/src/components/cards/FinanceabilityCard.jsx` - Use registry metrics from context
- `frontend/src/components/cards/DriverExplorerCard.jsx` - Use registry for sensitivity analysis
- `frontend/src/components/cards/configs/FinanceabilityConfig.js` - Update to use registry data
- `frontend/src/utils/metricsUtils.js` - Remove METRIC_CALCULATORS, update references
- `frontend/src/utils/financingMetrics.js` - Remove duplicate functions, add deprecation notices
- `frontend/src/utils/finance/calculations.js` - Consolidate into registry system
- `frontend/src/utils/finance/sensitivityMetrics.js` - Remove SUPPORTED_METRICS
- `frontend/src/utils/timeSeries/aggregation.js` - Remove WIND_INDUSTRY_AGGREGATIONS

### Files to Clean Up (Post-migration)
- Remove `enhancedFinanceMetrics` function and related code
- Remove duplicate `calculateIRR`, `calculateNPV`, `calculateDSCR` functions
- Remove `METRIC_CALCULATORS` object and associated logic
- Remove `SUPPORTED_METRICS` object and references
- Remove `WIND_INDUSTRY_AGGREGATIONS` object completely
- Update imports across 10+ component files
- Remove unused dependencies and exports

---

## 11. Future Cube Implementation - Design Assumptions & Architecture

*This section is for reference only and not part of current development scope*

### 11.1 Cube Conceptual Overview

The metrics cube will be a single-scenario, multi-dimensional data structure that manages all time-series data from CASHFLOW_SOURCE_REGISTRY and SENSITIVITY_SOURCE_REGISTRY, computing all financial metrics across all percentile combinations. This enables instant sensitivity analysis, percentile comparisons, and advanced analytics without real-time computation.

**Core Concept**: Pre-compute all metrics for all percentile combinations of all data sources within a single scenario, storing results in an efficient, queryable structure that can eventually be implemented as its own context.

**Scope Clarification**: The cube manages one scenario at a time but provides comprehensive coverage of:
- All data sources (CASHFLOW_SOURCE_REGISTRY + SENSITIVITY_SOURCE_REGISTRY)
- All percentile combinations for sources with distributions
- All time-series data and aggregated metrics
- All sensitivity relationships through `.affects` mappings

### 11.2 Single-Scenario Cube Architecture

#### Cube Structure for Comprehensive Data Management
```typescript
interface MetricsCube {
  // Single scenario metadata
  metadata: {
    scenarioId: string;
    dataHash: string; // Hash of all input time-series and fixed data
    computedAt: Date;
    sources: {
      cashflow: string[]; // All CASHFLOW_SOURCE_REGISTRY ids
      sensitivity: string[]; // All SENSITIVITY_SOURCE_REGISTRY ids
    };
    percentiles: number[]; // Available percentiles [10, 25, 50, 75, 90]
    metrics: string[]; // All computed metric keys from registry
  };
  
  // Comprehensive data storage
  data: {
    // Time-series data for all sources at all percentiles
    timeSeries: Map<string, Map<number, Array<DataPointSchema>>>; // sourceId -> percentile -> time-series
    
    // Aggregated data for all sources at all percentiles
    aggregated: Map<string, Map<number, AggregatedData>>; // sourceId -> percentile -> aggregated values
    
    // All metric results for all percentile combinations
    metrics: Map<string, Map<string, MetricResult>>; // cubeKey -> metricKey -> result
  };
  
  // Cube cells for sensitivity analysis (percentile combinations)
  cells: Map<string, CubeCell>; // Key: `${baselineP}-${varId}-${varP}`
  
  // Simple invalidation tracking
  invalidation: {
    fullRebuildNeeded: boolean;
    staleSourceIds: Set<string>;
    staleCells: Set<string>;
  };
}

interface CubeCell {
  dimensions: {
    baselinePercentile: number; // Primary percentile for non-varied sources
    sensitivityVariable?: string; // null for baseline, sourceId for sensitivity
    sensitivityPercentile?: number; // percentile for varied source
  };
  
  // All metrics computed for this percentile combination
  metrics: Map<string, MetricResult>; // metricKey -> computed result
  
  // Computation metadata
  computedAt: Date;
  errors: string[];
}
```

#### Distribution Analysis Data Structure  
```typescript
// When hasPercentiles = true, path points to distribution data:
interface DistributionData {
  distribution: DistributionTypeSchema; // Config for the distribution
  results: Array<{
    percentile: { value: number }; // 10, 25, 50, 75, 90
    data: Array<DataPointSchema>; // [{year: 1, value: 1000}, {year: 2, value: 1050}, ...]
  }>;
  statistics: {
    mean: Array<DataPointSchema>;
    stdDev: Array<DataPointSchema>;
    // ... other stats
  };
}

// When hasPercentiles = false, path points to:
// - Array<DataPointSchema> for time-series
// - number for fixed values  
// - object for complex data requiring transformer
```





#### Key Insights for Metrics System
1. **Use Existing Aggregation**: `aggregateTimeSeries` function already exists with wind industry methods
2. **Transformer Pipeline**: Data flows through transformers before reaching metrics
3. **Registry Affects**: SENSITIVITY entries have `.dependencies.affects` pointing to CASHFLOW `.id` values
4. **Simple Error Handling**: Log errors, don't over-validate or wrap simple functions

### 11.3 Cube Data Architecture (Simplified)

#### Single Cube Version with Fast Invalidation
```typescript
interface MetricsCube {
  // Metadata for invalidation
  metadata: {
    scenarioId: string;
    dataHash: string; // Simple hash of input data for fast invalidation
    computedAt: Date;
    sources: {
      cashflow: string[]; // CASHFLOW_SOURCE_REGISTRY ids used
      sensitivity: string[]; // SENSITIVITY_SOURCE_REGISTRY ids used
    };
    percentiles: number[]; // [10, 25, 50, 75, 90]
  };
  
  // Core cube data - no versioning complexity
  cells: Map<string, CubeCell>; // Key: `${baselineP}-${varId}-${varP}` 
  
  // Simple invalidation tracking
  invalidation: {
    fullRebuildNeeded: boolean;
    staleSourceIds: Set<string>; // Which sources changed
    staleCells: Set<string>; // Which cube cells need recomputation
  };
}

interface CubeCell {
  dimensions: {
    baselinePercentile: number;
    sensitivityVariable?: string; // null for baseline
    sensitivityPercentile?: number;
  };
  
  // Use existing aggregated metrics - don't reinvent
  metrics: Map<string, MetricResult>;
  
  // Simple error tracking
  errors: string[];
  computedAt: Date;
}
```

#### Fast Invalidation Strategy
```typescript
// Simple invalidation - no complex versioning
export const invalidateCube = (cube: MetricsCube, reason: string, changedSources?: string[]) => {
  if (!changedSources || changedSources.length === 0) {
    // Full rebuild needed
    cube.invalidation.fullRebuildNeeded = true;
    cube.invalidation.staleSourceIds.clear();
    cube.invalidation.staleCells.clear();
    return;
  }
  
  // Partial invalidation - mark affected sources and cells
  changedSources.forEach(sourceId => {
    cube.invalidation.staleSourceIds.add(sourceId);
    
    // Find all cube cells that use this source
    for (const [cellKey, cell] of cube.cells.entries()) {
      if (cellUsesSource(cell, sourceId)) {
        cube.invalidation.staleCells.add(cellKey);
      }
    }
  });
};

// Check if rebuild needed
export const isCubeStale = (cube: MetricsCube): boolean => {
  return cube.invalidation.fullRebuildNeeded || 
         cube.invalidation.staleCells.size > 0;
};
```

### 11.4 Cube Construction Strategy (Using Existing Functions)

#### Phase 1: Use Existing Transform Pipeline
```typescript
// Leverage existing transformScenarioToCashflow instead of reinventing
for (const baselinePercentile of availablePercentiles) {
  // Use existing CashflowContext transform
  const percentileSelection = { unified: baselinePercentile };
  const cashflowData = await transformScenarioToCashflow(
    scenarioData,
    CASHFLOW_SOURCE_REGISTRY,
    percentileSelection,
    getValueByPath
  );
  
  // Use existing metrics computation
  const metrics = await computeAllMetrics(cashflowData, scenarioData);
  
  cube.cells.set(`${baselinePercentile}--`, {
    dimensions: { baselinePercentile },
    metrics,
    errors: [],
    computedAt: new Date()
  });
}
```

#### Phase 2: Handle Sensitivity Variables with .affects
```typescript
// For each sensitivity variable, apply its .affects relationships
for (const sensitivityVar of allSensitivityVariables) {
  if (sensitivityVar.dependencies?.affects) {
    for (const baselinePercentile of availablePercentiles) {
      for (const sensitivityPercentile of availablePercentiles) {
        if (sensitivityPercentile === baselinePercentile) continue;
        
        // Build percentile selection with sensitivity override
        const percentileSelection = { unified: baselinePercentile };
        
        // Apply .affects to modify affected CASHFLOW sources
        sensitivityVar.dependencies.affects.forEach(affect => {
          if (affect.impactType === 'multiplicative') {
            // Override percentile for affected cashflow source
            percentileSelection[affect.sourceId] = sensitivityPercentile;
          }
          // Handle other impact types as needed
        });
        
        // Use existing transform pipeline
        const cashflowData = await transformScenarioToCashflow(
          scenarioData,
          CASHFLOW_SOURCE_REGISTRY,  
          percentileSelection,
          getValueByPath
        );
        
        const metrics = await computeAllMetrics(cashflowData, scenarioData);
        
        cube.cells.set(`${baselinePercentile}-${sensitivityVar.id}-${sensitivityPercentile}`, {
          dimensions: { baselinePercentile, sensitivityVariable: sensitivityVar.id, sensitivityPercentile },
          metrics,
          errors: [],
          computedAt: new Date()
        });
      }
    }
  }
}
```

### 11.5 Metrics System Integration (Don't Reinvent)

#### Use Existing Aggregation Functions
```typescript
// In individual metric files - use existing aggregateTimeSeries
export const calculate = (input: MetricInput): MetricResult => {
  try {
    // Use existing aggregation - don't reinvent
    const { timeSeries, options = {} } = input;
    
    if (!timeSeries?.netCashflow) {
      return { value: null, error: 'Missing netCashflow data', metadata: {} };
    }
    
    // Use registry aggregation strategy (replacing WIND_INDUSTRY_AGGREGATIONS)
    const metricConfig = CASHFLOW_METRICS_REGISTRY.npv;
    const { method, options: aggregationOptions } = metricConfig.cubeConfig.aggregation;
    
    const npvValue = aggregateTimeSeries(
      timeSeries.netCashflow,
      method,
      { ...aggregationOptions, ...options }
    );
    
    return {
      value: npvValue,
      error: null,
      metadata: {
        calculationMethod: 'npv',
        aggregationMethod: method,
        timeSeriesLength: timeSeries.netCashflow.length
      }
    };
  } catch (error) {
    // Simple error handling - log and return
    console.error('NPV calculation failed:', error);
    return {
      value: null,
      error: error.message,
      metadata: { calculationMethod: 'npv' }
    };
  }
};
```

#### Registry Configuration (Simplified)
```typescript
export const CASHFLOW_METRICS_REGISTRY = {
  irr: {
    ...irrCalculations,
    category: 'financial',
    usage: ['financeability', 'sensitivity'],
    priority: 1,
    
    // Simple cube config - use registry aggregation strategies
    cubeConfig: {
      // Replaces static WIND_INDUSTRY_AGGREGATIONS.irr
      aggregation: {
        method: 'first',
        options: { filter: 'all' }
      },
      
      // Time-series dependencies from CASHFLOW_SOURCE_REGISTRY
      dependsOn: ['netCashflow'], // Simple string references
      
      // Simple flags
      preCompute: true,
      sensitivityRelevant: true
    }
  },
  
  npv: {
    ...npvCalculations,
    category: 'financial',
    usage: ['financeability', 'sensitivity'],
    priority: 2,
    cubeConfig: {
      aggregation: {
        method: 'npv',
        options: { filter: 'all', discountRate: 0.08 }
      },
      dependsOn: ['netCashflow'],
      preCompute: true,
      sensitivityRelevant: true
    }
  }
  
  // No year-specific metrics for now - keep it simple
  // All metrics aggregate time-series to single values
};
```

### 11.6 Error Handling Strategy (Simple & Effective)

#### Graceful Error Handling Without Over-Engineering
```typescript
// In cube construction - log errors, continue processing
export const buildCubeCell = async (dimensions: CubeDimensions): Promise<CubeCell> => {
  const errors: string[] = [];
  const metrics = new Map<string, MetricResult>();
  
  try {
    // Use existing transform pipeline
    const cashflowData = await transformScenarioToCashflow(/* ... */);
    
    // Compute each metric individually - don't fail entire cell on one error
    for (const [metricKey, metricConfig] of Object.entries(CASHFLOW_METRICS_REGISTRY)) {
      try {
        const result = metricConfig.calculate(buildMetricInput(cashflowData));
        metrics.set(metricKey, result);
        
        // Log individual metric errors
        if (result.error) {
          errors.push(`${metricKey}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = `${metricKey} calculation failed: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        
        // Store null result so we know it was attempted
        metrics.set(metricKey, { value: null, error: error.message, metadata: {} });
      }
    }
  } catch (error) {
    // Major error - log and return minimal cell
    const errorMsg = `Cell computation failed: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }
  
  return {
    dimensions,
    metrics,
    errors,
    computedAt: new Date()
  };
};
```

#### Validation Strategy (Minimal)
```typescript
// Don't over-validate - use existing patterns
export const validateMetricInput = (input: MetricInput, metricKey: string): boolean => {
  // Simple validation - just check if required data exists
  if (!input) {
    console.warn(`No input provided for metric: ${metricKey}`);
    return false;
  }
  
  // Don't wrap simple operations in tiny functions
  const hasRequiredData = input.timeSeries || input.aggregations || input.cashflows;
  if (!hasRequiredData) {
    console.warn(`No time-series data provided for metric: ${metricKey}`);
    return false;
  }
  
  return true;
};
```

### 11.7 Expected Cube Benefits

#### Performance Improvements
- **Instant Tornado Charts**: Pre-computed sensitivity analysis eliminates real-time calculation delays
- **Rapid Percentile Comparisons**: All percentile combinations available immediately
- **Advanced Analytics**: Complex multi-variable analysis becomes feasible
- **Responsive UI**: No loading states for metric displays

#### Analytical Capabilities
- **Cross-Metric Correlation**: Analyze relationships between different financial metrics
- **Risk Profile Analysis**: Comprehensive risk assessment across all scenarios
- **Optimization Recommendations**: Identify optimal parameter combinations
- **Historical Trend Analysis**: Compare current cube against historical cubes

#### Scalability Benefits
- **Large Scenario Support**: Handle complex scenarios with many variables efficiently
- **Multi-User Performance**: Serve multiple users from same pre-computed cube
- **Advanced Filtering**: Complex queries without performance degradation
- **Future Algorithm Support**: Enable machine learning and advanced analytics

---

## 12. Future Considerations

### 12.1 Advanced Analytics Beyond Cube
System architecture supports future enhancements:
- Real-time metric computation as data changes
- Cross-metric correlation analysis  
- Historical trend analysis
- Automated threshold alerting
- Custom metric composition

### 12.2 Performance Optimization
Future optimization opportunities:
- Worker thread computation for large datasets
- Incremental metric updates
- Persistent caching strategies
- Lazy evaluation for unused metrics

---



## **Fresh Eyes Review - Additional Questions:**

### **1. Registry Circular Reference**
**Q:** In the metric calculation files, they reference `CASHFLOW_METRICS_REGISTRY[metricKey]` but they're also used to build that registry. How does this circular dependency work?

**A:** The registry imports the metric calculations and spreads them (`...npvCalculations`), so the metric files shouldn't reference the registry directly. Instead, the aggregation strategy should be passed as a parameter or retrieved through a different pattern to avoid circular imports.

### **2. Context Error Propagation**
**Q:** How do individual metric errors affect the overall `computedMetrics` state? Should a single metric failure invalidate all metrics or just that specific metric?

**A:** Individual metric failures should not invalidate the entire `computedMetrics` Map. Each metric should be stored with its error state, allowing successful metrics to display while failed ones show error indicators. This is already covered in the error handling examples.

### **3. Migration Testing Strategy**
**Q:** Without old vs new comparison testing, how do we ensure the migration doesn't introduce calculation errors?

**A:** Use snapshot testing to capture current metric outputs before migration, then validate new outputs match snapshots. Also implement regression tests with known input/output pairs to verify calculation accuracy.

### **4. CashflowDataSource Aggregations Dependency**
**Q:** The metrics depend on `CashflowDataSource.aggregations` keys like 'netCashflow', but what if new aggregations are needed? How extensible is this?

**A:** This is properly addressed - new aggregations can be added to the `transformScenarioToCashflow` pipeline and referenced in metric `dependsOn` arrays. The system is designed to be extensible at the aggregation level.

### **5. Cube Context vs CashflowContext Integration**
**Q:** The cube section mentions implementing as separate context, but how would this interact with the current CashflowContext integration?

**A:** This is well addressed in section 11.4 - the future CubeContext would provide the same interface as the current metrics computation, allowing CashflowContext to use cube data when available and fallback to current computation otherwise.

### **1. Registry Structure & Integration**
**Q:** How exactly does the new `CASHFLOW_METRICS_REGISTRY` integrate with the existing `CASHFLOW_SOURCE_REGISTRY`? The PRD shows metrics depending on sources like 'netCashflow', but how does this map to actual source IDs?

**A:** The `dependsOn` field in metrics should reference aggregated data types (like 'netCashflow', 'totalCosts') that come from the `CashflowDataSource.aggregations` structure, not directly from individual `CASHFLOW_SOURCE_REGISTRY` entries. The existing `transformScenarioToCashflow` function already creates these aggregations from multiple source entries.

### **2. Existing Function Migration**
**Q:** The PRD mentions removing `WIND_INDUSTRY_AGGREGATIONS` but doesn't show how existing code that uses `aggregateTimeSeries(data, WIND_INDUSTRY_AGGREGATIONS.npv.method, WIND_INDUSTRY_AGGREGATIONS.npv.options)` will be migrated.

**A:** Existing calls should be migrated to use the registry: `const strategy = CASHFLOW_METRICS_REGISTRY.npv.cubeConfig.aggregation; aggregateTimeSeries(data, strategy.method, strategy.options)`. This requires a systematic find-and-replace across the codebase.

### **3. CashflowContext Integration Details**
**Q:** How does the new `computedMetrics` state fit with the existing refresh cycle? The PRD shows adding metrics computation but doesn't explain the dependency chain or error propagation.

**A:** The `computedMetrics` should be computed after `cashflowData` is successfully created, using the same error handling pattern as existing context operations. If `transformScenarioToCashflow` fails, metrics computation should be skipped, and if metrics computation fails, it shouldn't break the existing cashflow data display.

### **4. Card Migration Specifics**
**Q:** FinanceabilityCard currently uses `enhancedFinanceMetrics()` which returns a complex object with percentile data. How does this map to the new registry-based approach?

**A:** The new approach should provide the same data structure but sourced from `computedMetrics`. The `createFinancialMetricsConfig()` function should be updated to extract metric values from the registry results while maintaining the same MetricsDataTable interface.

### **5. Sensitivity Analysis Integration**
**Q:** DriverExplorerCard uses `SUPPORTED_METRICS` for tornado charts. How does sensitivity analysis work with registry-based metrics, especially the `.affects` relationships?

**A:** Sensitivity analysis should use `getMetricsByUsage('sensitivity')` to get eligible metrics, then apply the existing sensitivity calculation logic. The `.affects` relationships in `SENSITIVITY_SOURCE_REGISTRY` determine which `CASHFLOW_SOURCE_REGISTRY` entries to vary, and the results feed into the metric calculations.

### **6. Error Handling Strategy**
**Q:** The PRD mentions "simple error handling" but doesn't specify how metric calculation errors should be displayed to users or how they affect card functionality.

**A:** Metric calculation errors should be logged but not break the UI. Cards should display fallback content or error indicators for failed metrics while showing successful ones. The `MetricResult.error` field should be used to communicate issues to the card components.

### **7. Backward Compatibility During Migration**
**Q:** The PRD says "no backward compatibility" but doesn't explain how to ensure cards keep working during the phased migration.

**A:** The migration should happen in feature branches with comprehensive testing. Each card should be migrated completely in one phase, tested thoroughly, then merged. During development, both old and new systems may coexist temporarily but not in production.

### **8. Performance & Caching**
**Q:** How will the new unified system's performance compare to the current approach? Will computing all metrics together be faster or slower?

**A:** Computing metrics together should be more efficient because it eliminates duplicate data processing. The caching strategy should store computed metrics with the same lifecycle as `cashflowData`, invalidating when underlying data changes. Memory usage should be similar or better due to reduced duplication.

### **9. Testing Strategy Details**
**Q:** What specific test coverage is needed to ensure the migration doesn't break existing functionality?

**A:** Tests should include: unit tests for each metric calculation, integration tests comparing old vs new metric results, end-to-end tests for each card's functionality, and performance benchmarks to ensure no regression. Snapshot testing should capture metric outputs for regression detection.

### **10. Future Cube Preparation**
**Q:** The cube section is marked "reference only" but how do current implementation decisions affect cube feasibility?

**A:** The registry structure should include cube-specific metadata (aggregation strategies, dependencies) even if not used immediately. The metric calculation interfaces should be designed to work with both current single-scenario and future multi-scenario cube approaches.

## **Additional Technical Clarifications Needed:**

### **Schema & Validation**
**Q:** How do the new `schemas/yup/cashflowMetrics.js` schemas integrate with existing validation patterns?

**A:** New schemas should follow existing patterns in `schemas/yup/cashflow.js`, using the same validation utility functions and error handling approaches. Runtime validation should be minimal to avoid performance impact.

### **Import & Export Patterns**
**Q:** The wildcard import strategy (`export * from './irr.js'`) - how does this work with the registry approach?

**A:** Individual metric files export their functions, then `registry.js` imports them with `import * as irrCalculations from './calculations/irr.js'` and spreads them into the registry object. This keeps metric implementations separate while making them registry-accessible.

### **Transformer Integration**
**Q:** How do existing transformers (like `contractsToAnnualCosts`) fit with the new metrics system?

**A:** Transformers remain unchanged - they convert raw data to time-series format. The metrics system works on the post-transform data from `CashflowDataSource`. Metrics don't need to know about transformers, they just consume the standardized time-series data.

---

*This PRD serves as the complete specification for implementing the Unified Cashflow Metrics System. All development work should follow this specification to ensure consistency and completeness.*