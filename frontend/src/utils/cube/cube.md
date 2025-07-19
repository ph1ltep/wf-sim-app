# Cube System General API Documentation v2.0

## Overview

The Cube System is a high-performance financial data processing pipeline that transforms scenario data into structured time-series analysis and scalar business metrics. It provides a unified interface for accessing both source data (time-series) and metrics data (scalars) with comprehensive audit trails, custom percentile handling, and sub-100ms processing performance.

## System Architecture

The Cube System consists of three main layers:

### 1. **Sources Layer** - Time-Series Data Processing
Transforms raw scenario data into structured time-series with multipliers, transformers, and aggregations.
- **Input**: Raw scenario data from paths
- **Output**: `CubeSourceDataSchema[]` - Time-series data per percentile
- **Documentation**: See [sources.md](./sources.md) for detailed API

### 2. **Metrics Layer** - Scalar Business Metrics
Converts time-series data into business metrics using aggregations, transformers, and operations.
- **Input**: `CubeSourceDataSchema[]` + references
- **Output**: `CubeMetricDataSchema[]` - Scalar values per percentile
- **Documentation**: See [metrics.md](./metrics.md) for detailed API

### 3. **Context Layer** - React Integration & Data Access
Provides React context, state management, and optimized data access functions.
- **Input**: Registry configurations + scenario data
- **Output**: React hooks and data access APIs
- **Documentation**: This document (sections below)

## Data Flow Pipeline

```javascript
// 1. Raw Scenario Data
scenarioData = {
  simulation: { inputSim: { distributionAnalysis: { energyProduction: {...} } } }
}

// 2. Sources Processing (see sources.md)
sourceData = computeSourceData(SOURCES_REGISTRY, percentiles, getValueByPath)
// → [{id: 'energyRevenue', percentileSource: [...], metadata: {...}, audit: {...}}]

// 3. Metrics Processing (see metrics.md)  
metricsData = computeMetricsData(METRICS_REGISTRY, percentiles, getValueByPath, getSourceData)
// → [{id: 'projectIRR', percentileMetrics: [...], metadata: {...}, audit: {...}}]

// 4. Context Integration (this document)
const { getData, getMetric } = useCube();
const revenueData = getData({sourceId: 'energyRevenue', percentile: 50});
const irrData = getMetric({metricId: 'projectIRR', percentile: 50});
```

---

## CubeContext API

### Context Provider Setup
```javascript
import { CubeProvider } from '../contexts/CubeContext';

// Wrap your app or analysis component
<CubeProvider>
  <CashflowAnalysis />
</CubeProvider>
```

### Hook Usage
```javascript
const {
  // Data state
  sourceData,           // CubeSourceDataSchema[] - Processed source data
  metricsData,         // CubeMetricDataSchema[] - Processed metrics data
  availablePercentiles, // number[] - [10, 25, 50, 75, 90]
  
  // Loading states
  isLoading,           // boolean - Initial loading state
  isRefreshing,        // boolean - Refresh in progress
  refreshStage,        // string - Current processing stage
  lastRefresh,         // Date|null - Last successful refresh
  
  // Custom percentile management
  customPercentile,    // Object|null - Custom percentile config
  setCustomPercentile, // Function - Set custom percentile mapping
  
  // Data access functions
  getData,             // Function - Access source data
  getMetric,           // Function - Access metrics data
  getAuditTrail,       // Function - Access audit trails
  
  // Actions
  refreshCubeData,     // Function - Trigger data refresh
  triggerRefresh       // Function - Force refresh
} = useCube();
```

### Context State Management
The CubeContext manages a sophisticated state machine with sequential processing stages:

| Stage | Purpose | Dependencies | Output |
|-------|---------|--------------|--------|
| `idle` | Default state | None | Ready for refresh |
| `dependencies` | Validate prerequisites | Scenario data | Dependency validation |
| `sources` | Process source data | Valid dependencies | `sourceData` |
| `metrics` | Process metrics data | `sourceData` | `metricsData` |
| `complete` | Finalize refresh | Both data sets | Updated timestamps |

---

## Data Access Functions

### `getData()` - Source Data Access
High-performance source data retrieval with flexible filtering and dynamic return formats.

**Function Signature**:
```javascript
getData(filters: Object) => Object
```

**Parameters**:
```javascript
{
  sourceId?: string,        // Single source ID
  sourceIds?: string[],     // Multiple source IDs
  percentile?: number,      // Single percentile value
  metadata?: Object         // Metadata filter criteria
}
```

**Return Format Logic**:
| Filter Combination | Output Keys | Example Usage |
|-------------------|-------------|---------------|
| `{sourceId}` | Percentile values (10, 25, 50...) | All percentiles for one source |
| `{percentile}` | Source IDs | All sources for one percentile |
| `{sourceId, percentile}` | Source ID | Single source-percentile combo |
| `{sourceIds, percentile}` | Source IDs (filtered) | Multiple sources for one percentile |

**Usage Examples**:
```javascript
// Get all percentiles for energy revenue
const energyData = getData({ sourceId: 'energyRevenue' });
// Returns: { 10: {data: [...], metadata}, 25: {data: [...], metadata}, ... }

// Get all sources for median percentile
const medianData = getData({ percentile: 50 });
// Returns: { energyRevenue: {data: [...], metadata}, totalCost: {data: [...], metadata}, ... }

// Get specific source-percentile combination
const specificData = getData({ sourceId: 'energyRevenue', percentile: 50 });
// Returns: { energyRevenue: {data: [...], metadata} }

// Get multiple sources for one percentile
const cashflowSources = getData({ 
  sourceIds: ['totalRevenue', 'totalCost', 'netCashflow'], 
  percentile: 75 
});
// Returns: { totalRevenue: {data: [...]}, totalCost: {data: [...]}, netCashflow: {data: [...]} }

// Filter by metadata
const inflowSources = getData({ 
  percentile: 50, 
  metadata: { cashflowType: 'inflow' } 
});
// Returns: { energyRevenue: {data: [...]}, otherRevenue: {data: [...]} }
```

### `getMetric()` - Metrics Data Access
Ultra-high-performance metrics data retrieval optimized for scalar business metrics.

**Function Signature**:
```javascript
getMetric(filters: Object) => Object
```

**Parameters**:
```javascript
{
  metricId?: string,        // Single metric ID
  metricIds?: string[],     // Multiple metric IDs
  percentile?: number,      // Single percentile value
  metadata?: Object         // Metadata filter criteria
}
```

**Performance Optimization**:
- **Mode 1** (Single metric, all percentiles): Direct find + single loop - **FASTEST**
- **Mode 2** (Single percentile, all metrics): Single pass with early continue - **FAST**
- **Mode 3** (Single metric + percentile): Direct lookup - **ULTRA FAST**
- **Mode 4** (Multiple metrics + percentile): Set-based lookup - **OPTIMIZED BATCH**

**Usage Examples**:
```javascript
// Get all percentiles for project IRR
const irrData = getMetric({ metricId: 'projectIRR' });
// Returns: { 10: {value: 8.2, stats: {...}, metadata}, 50: {value: 12.5, stats: {...}, metadata}, ... }

// Get all metrics for median percentile
const medianMetrics = getMetric({ percentile: 50 });
// Returns: { projectIRR: {value: 12.5, stats: {...}, metadata}, equityIRR: {value: 18.3, stats: {...}, metadata}, ... }

// Get specific metric-percentile combination (FASTEST)
const medianIRR = getMetric({ metricId: 'projectIRR', percentile: 50 });
// Returns: { projectIRR: {value: 12.5, stats: {...}, metadata} }

// Get multiple metrics for one percentile (BATCH OPTIMIZED)
const financialMetrics = getMetric({ 
  metricIds: ['projectIRR', 'equityIRR', 'projectNPV'], 
  percentile: 75 
});
// Returns: { projectIRR: {value: 15.2, ...}, equityIRR: {value: 22.1, ...}, projectNPV: {value: 450000, ...} }

// Filter by metadata
const profitabilityMetrics = getMetric({ 
  percentile: 50, 
  metadata: { visualGroup: 'profitability' } 
});
```

**Data Structure**: Each result contains:
```javascript
{
  value: number,           // Calculated metric value
  stats: Object,          // Additional statistics from aggregations/transformers
  metadata: Object        // Metric metadata (name, type, formatter, etc.)
}
```

---

## Custom Percentile Management

### Purpose & Benefits
Custom percentiles enable mixed-percentile analysis for scenario modeling:
- **Conservative Costs**: Use P10 (low) percentiles for cost estimates
- **Optimistic Revenue**: Use P90 (high) percentiles for revenue projections
- **Realistic Operations**: Use P50 (median) for operational parameters

### Configuration API
```javascript
const { customPercentile, setCustomPercentile, updateCustomPercentile } = useCube();

// Set complete custom percentile configuration
setCustomPercentile({
  "escalationRate": 25,    // Use P25 for escalation
  "energyRevenue": 75,     // Use P75 for energy revenue
  "omCosts": 10,          // Use P10 for O&M costs
  "constructionCosts": 90  // Use P90 for construction costs (conservative)
});

// Update individual source percentiles
updateCustomPercentile("energyRevenue", 90); // Switch to P90 for energy revenue

// Clear custom percentiles
setCustomPercentile(null);
```

### Implementation Details
1. **Percentile 0 Creation**: System creates percentile 0 entries that reference specified percentiles
2. **Transparent Processing**: All transformers and aggregations handle percentile 0 automatically
3. **Audit Trail Accuracy**: Records actual percentiles used (not 0) in audit trails
4. **Cache Invalidation**: Changing custom percentiles triggers data refresh

### Usage in Components
```javascript
const CustomPercentileControl = () => {
  const { customPercentile, updateCustomPercentile, availablePercentiles } = useCube();

  const handlePercentileChange = (sourceId, percentile) => {
    updateCustomPercentile(sourceId, percentile);
  };

  return (
    <div>
      {customPercentile && Object.entries(customPercentile).map(([sourceId, percentile]) => (
        <Select 
          key={sourceId}
          value={percentile}
          onChange={(value) => handlePercentileChange(sourceId, value)}
          options={availablePercentiles.map(p => ({ value: p, label: `P${p}` }))}
        />
      ))}
    </div>
  );
};
```

---

## Audit Trail System

### Purpose & Capabilities
Comprehensive audit trails provide complete transparency for all data transformations:
- **Data Lineage**: Track source dependencies for each calculation
- **Performance Monitoring**: Measure processing times per operation
- **Debugging Support**: Data samples and error tracking
- **Compliance**: Full transformation history for financial calculations

### Accessing Audit Trails
```javascript
const { getAuditTrail } = useCube();

// Get audit trails for specific sources
const auditData = getAuditTrail(['energyRevenue', 'totalCost', 'netCashflow']);

// Returns:
{
  energyRevenue: {
    trail: [
      {
        timestamp: 1640995200000,
        step: 'apply_multiplier_electricityPrice',
        details: 'Applied electricity price multiplier: $50.00/MWh',
        dependencies: ['energyProduction', 'electricityPrice'],
        type: 'multiply',
        typeOperation: 'multiply',
        duration: 2.3,
        dataSample: { percentile: 50, data: [{year: 1, value: 5000000}] }
      },
      // ... more audit entries
    ],
    references: {
      electricityPrice: 50,
      escalationRate: 0.025
    }
  },
  // ... other sources
}
```

### Audit Trail Integration
```javascript
import AuditTrailViewer from '../components/AuditTrailViewer';

const CashflowAnalysisCard = () => {
  const { getAuditTrail } = useCube();
  const [showAudit, setShowAudit] = useState(false);

  const auditData = getAuditTrail(['energyRevenue', 'totalCost']);

  return (
    <Card 
      title="Cashflow Analysis"
      extra={
        <Button 
          icon={<AuditOutlined />}
          onClick={() => setShowAudit(!showAudit)}
        >
          View Audit Trail
        </Button>
      }
    >
      {/* Chart content */}
      
      {showAudit && (
        <AuditTrailViewer 
          auditTrails={auditData}
          onClose={() => setShowAudit(false)}
        />
      )}
    </Card>
  );
};
```

### Audit Entry Structure
```javascript
{
  timestamp: number,           // Processing timestamp (ms)
  step: string,               // Operation identifier
  details: string,            // Human-readable description
  dependencies: string[],     // Source IDs used as inputs
  type: string,              // Operation category ('transform', 'multiply', 'aggregate')
  typeOperation: string,     // Specific operation ('sum', 'compound', 'complex')
  duration: number,          // Processing time in milliseconds
  dataSample?: {             // Optional data sample for debugging
    percentile: number,
    data: any
  }
}
```

---

## Performance & Optimization

### Processing Performance Targets
| Operation | Target Time | Measurement |
|-----------|-------------|-------------|
| **Total Cube Refresh** | <500ms | Complete sources + metrics processing |
| **Sources Processing** | <100ms | 20+ sources with transformers/multipliers |
| **Metrics Processing** | <100ms | 10+ metrics with dependencies |
| **getData() Call** | <1ms | Single percentile or source access |
| **getMetric() Call** | <0.5ms | Single metric or percentile access |

### Memory Optimization
- **Reference Consolidation**: Single object for all reference access
- **Cache-Friendly Access**: Sequential array processing for CPU cache efficiency
- **Object Reuse**: Minimize allocations in hot paths
- **Set-Based Lookups**: O(1) complexity for multiple ID filtering

### Caching Strategy
```javascript
// Version-based cache invalidation
const isDataOutOfDate = useMemo(() => {
  const currentVersion = scenarioData?.metadata?.lastModified || scenarioData?.metadata?.version;
  return cubeVersion !== currentVersion;
}, [cubeVersion, scenarioData]);

// Intelligent refresh triggering
useEffect(() => {
  if (isDataOutOfDate && !isLoading) {
    refreshCubeData();
  }
}, [isDataOutOfDate, isLoading]);
```

---

## Error Handling & Resilience

### Error Categories
| Error Type | Handling Strategy | User Experience |
|------------|------------------|-----------------|
| **Configuration Errors** | Log and skip invalid entries | Graceful degradation |
| **Data Extraction Errors** | Return empty with error stats | Clear error messaging |
| **Transformation Errors** | Fallback to aggregations | Automatic recovery |
| **Network/State Errors** | Retry with exponential backoff | Loading states |

### Error Boundary Integration
```javascript
import { ErrorBoundary } from 'react-error-boundary';

const CubeErrorFallback = ({ error, resetErrorBoundary }) => (
  <Alert
    type="error"
    message="Cube System Error"
    description={error.message}
    action={
      <Button onClick={resetErrorBoundary}>
        Retry Cube Processing
      </Button>
    }
  />
);

// Wrap cube-dependent components
<ErrorBoundary FallbackComponent={CubeErrorFallback}>
  <CubeProvider>
    <CashflowAnalysis />
  </CubeProvider>
</ErrorBoundary>
```

---

## Integration Patterns

### Component Integration Best Practices
```javascript
// ✅ Efficient data access pattern
const CashflowChart = () => {
  const { getData, getMetric, isLoading } = useCube();
  
  // Get only needed data with specific filters
  const cashflowData = useMemo(() => {
    return getData({ 
      sourceIds: ['totalRevenue', 'totalCost', 'netCashflow'], 
      percentile: selectedPercentile 
    });
  }, [getData, selectedPercentile]);
  
  const irrMetrics = useMemo(() => {
    return getMetric({ 
      metricIds: ['projectIRR', 'equityIRR'], 
      percentile: selectedPercentile 
    });
  }, [getMetric, selectedPercentile]);

  if (isLoading) return <Spin />;
  
  return <Chart data={cashflowData} metrics={irrMetrics} />;
};
```

### Conditional Rendering with Loading States
```javascript
const FinancialDashboard = () => {
  const { sourceData, metricsData, isLoading, refreshStage } = useCube();

  // Progressive loading with stage-specific content
  if (isLoading) {
    return (
      <div>
        <Spin tip={`Processing ${refreshStage}...`} />
        <Progress 
          percent={getStageProgress(refreshStage)} 
          status="active" 
        />
      </div>
    );
  }

  return (
    <>
      {sourceData && <CashflowTimelineCard />}
      {metricsData && <FinancialMetricsCard />}
    </>
  );
};
```

---

## Advanced Usage

### Dynamic Registry Configuration
```javascript
// Runtime registry modification for different analysis modes
const useAnalysisMode = (mode) => {
  const { refreshCubeData } = useCube();
  
  const switchAnalysisMode = useCallback((newMode) => {
    // Modify registries based on analysis mode
    if (newMode === 'detailed') {
      METRICS_REGISTRY.metrics.push(...DETAILED_METRICS);
    } else {
      METRICS_REGISTRY.metrics = BASE_METRICS;
    }
    
    // Trigger refresh with new configuration
    refreshCubeData();
  }, [refreshCubeData]);

  return { switchAnalysisMode };
};
```

### Performance Monitoring
```javascript
const usePerformanceMonitoring = () => {
  const { lastRefresh, refreshStage } = useCube();
  
  useEffect(() => {
    if (refreshStage === 'complete' && lastRefresh) {
      const processingTime = Date.now() - lastRefresh.getTime();
      
      // Log performance metrics
      console.log(`🔥 Cube processing completed in ${processingTime}ms`);
      
      // Send to analytics if needed
      analytics.track('cube_processing_time', { duration: processingTime });
    }
  }, [refreshStage, lastRefresh]);
};
```

This comprehensive system provides enterprise-grade financial data processing with React integration, complete transparency through audit trails, and optimized performance for real-time financial analysis applications.