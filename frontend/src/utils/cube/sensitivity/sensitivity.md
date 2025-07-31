# Matrix-Based Sensitivity Analysis System
## Product Requirements Document v1.0

**Project**: Wind Industry Financial Analysis Platform  
**Feature**: Cube Sensitivity Analysis System  
**Date**: July 31, 2025  
**Status**: Design Phase

---

## Core Function Signatures & Implementation Guide

### Matrix Computation Processor (`utils/cube/sensitivity/processor.js`)

```javascript
/**
 * Compute sensitivity matrices from pre-computed metrics
 * @param {Function} getMetric - CubeContext getMetric function: (filters) => metricData
 * @param {Object} sensitivityRegistry - SENSITIVITY_ANALYSES_REGISTRY configuration
 * @param {number[]} availablePercentiles - Available percentiles from percentileInfo
 * @param {Object} metricsRegistry - METRICS_REGISTRY for sensitivity configuration
 * @returns {Object} CubeSensitivityDataSchema object
 */
export const computeSensitivityMatrices = async (getMetric, sensitivityRegistry, availablePercentiles, metricsRegistry) => {
  // Step 1: Get enabled metrics from METRICS_REGISTRY
  // - Filter metrics where sensitivity.enabled = true
  // - Extract metric IDs into enabledMetrics array
  // - Validate minimum 2 metrics required for matrix computation

  // Step 2: For each percentile in availablePercentiles:
  //   - Call getMetric({percentile}) to get all metrics for this percentile
  //   - Extract {value} for each enabled metric
  //   - Build metric values array: [metricA_value, metricB_value, metricC_value]

  // Step 3: Compute correlation matrix for this percentile:
  //   - Calculate Pearson correlation coefficient for each metric pair
  //   - Use formula: r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)
  //   - Store in Map with alphabetical key format: 'metricA-metricB'
  //   - Ensure no duplicate keys (always alphabetical order)

  // Step 4: Compute covariance matrix for this percentile:
  //   - Calculate covariance for each metric pair: cov(X,Y) = Σ((xi - x̄)(yi - ȳ)) / (n-1)
  //   - Build symmetric n×n matrix where n = enabledMetrics.length
  //   - Diagonal elements are variances, off-diagonal are covariances
  //   - Matrix[i][j] = covariance(enabledMetrics[i], enabledMetrics[j])

  // Step 5: Compute statistics for this percentile:
  //   - avgCorrelation: mean of all correlation values
  //   - maxCorrelation: maximum absolute correlation
  //   - minCorrelation: minimum absolute correlation  
  //   - significantPairs: count of |correlation| > significanceThreshold
  //   - totalVariance: sum of diagonal elements (variances)

  // Step 6: Build SensitivityMatrixResultSchema object for this percentile
  // Step 7: Repeat for all percentiles
  // Step 8: Return complete CubeSensitivityDataSchema with audit trail
};

/**
 * Generate correlation matrix key for metric pair
 * @param {string} metricA - First metric ID
 * @param {string} metricB - Second metric ID  
 * @returns {string} Alphabetically ordered key: 'metricA-metricB'
 */
export const generateMatrixKey = (metricA, metricB) => {
  // Ensure alphabetical ordering to prevent duplicate keys
  // Handle special characters and ensure consistent formatting
};

/**
 * Extract correlation value from matrix for metric pair
 * @param {Map} correlationMatrix - Correlation matrix Map
 * @param {string} metricA - First metric ID
 * @param {string} metricB - Second metric ID
 * @returns {number|null} Correlation value or null if not found
 */
export const getCorrelationValue = (correlationMatrix, metricA, metricB) => {
  // Generate proper key and lookup in Map
  // Handle case where correlation doesn't exist
};
```

### Analysis Transformers (`utils/cube/sensitivity/transformers/`)

```javascript
/**
 * Standard transformer input interface - all analysis transformers receive this
 * @typedef {Object} AnalysisTransformerContext
 * @property {Object} matrixData - SensitivityMatrixResultSchema object(s)
 * @property {Object} query - Original query parameters from getSensitivity()
 * @property {Object} config - Analysis-specific configuration from registry
 * @property {Function} addAuditEntry - Function to add audit trail entries
 */

/**
 * Tornado analysis transformer - extracts impact rankings from correlation matrix
 * @param {AnalysisTransformerContext} context - Standard transformer context
 * @returns {Object} Standardized analysis result with flexible analysisResults
 */
export const computeTornadoFromMatrix = (context) => {
  const { matrixData, query, config, addAuditEntry } = context;
  
  // Step 1: Extract target metrics from query.targetMetrics or use all enabled metrics
  // Step 2: For each target metric, get all correlations with other metrics
  // Step 3: Calculate impact using correlation coefficients and covariance data
  // Step 4: Rank input metrics by absolute impact/correlation strength
  // Step 5: Filter by impactThreshold from config
  // Step 6: Build rankings array with {targetMetric, inputMetric, correlation, impact, rank}
  
  // Return format:
  return {
    analysisType: 'tornado',
    percentiles: query.percentiles,
    metadata: {
      name: 'Tornado Analysis',
      description: 'Variable impact ranking from correlation matrix',
      computedAt: new Date(),
      targetMetrics: query.targetMetrics || matrixData.matrixMetadata.enabledMetrics
    },
    analysisResults: {
      rankings: [], // Flexible analysis-specific data
      statistics: {}
    },
    audit: {
      trail: [...],
      dependencies: matrixData.matrixMetadata.enabledMetrics
    }
  };
};

/**
 * Format transformer for tornado chart visualization
 * @param {Object} analysisResult - Output from computeTornadoFromMatrix
 * @param {Object} formatConfig - Format-specific configuration
 * @returns {Object} Chart-ready data structure
 */
export const formatTornadoChart = (analysisResult, formatConfig) => {
  // Transform analysisResults.rankings into chart library format
  // Add display names, colors, sorting
  // Return chart-specific data structure
};
```

### Interpolation Engine (`utils/cube/sensitivity/interpolation.js`)

```javascript
/**
 * Interpolate correlation value between computed percentiles
 * @param {Object} sensitivityData - Complete CubeSensitivityDataSchema  
 * @param {number} targetPercentile - Percentile to interpolate (e.g., 60)
 * @param {string} metricA - First metric ID
 * @param {string} metricB - Second metric ID
 * @param {string} [method='linear'] - Interpolation method
 * @returns {number|null} Interpolated correlation value
 */
export const interpolateCorrelation = (sensitivityData, targetPercentile, metricA, metricB, method = 'linear') => {
  // Step 1: Find bounding percentiles (e.g., P50 and P75 for target P60)
  // Step 2: Extract correlation values at bounding percentiles using generateMatrixKey()
  // Step 3: Apply linear interpolation: value = lower + (upper - lower) * ratio
  // Step 4: Return interpolated correlation coefficient
};

/**
 * Interpolate metric impact given target metric value change
 * @param {Object} sensitivityData - Complete sensitivity data
 * @param {string} targetMetric - Metric being changed
 * @param {number} targetValue - New value for target metric  
 * @param {number} baselinePercentile - Baseline percentile for comparison
 * @param {string[]} [impactMetrics] - Metrics to calculate impact for (optional)
 * @returns {Object} Impact analysis showing effect on other metrics
 */
export const interpolateMetricImpact = (sensitivityData, targetMetric, targetValue, baselinePercentile, impactMetrics) => {
  // Step 1: Get baseline values for all metrics at baselinePercentile
  // Step 2: Calculate percentage change in targetMetric from baseline
  // Step 3: For each impact metric, use correlation to estimate new value
  // Step 4: Formula: newValue = baseline + (correlation × percentageChange × baselineValue)
  // Step 5: Return impact analysis with before/after values and percentage changes
};
```

---

## Registry Configuration Guide

### Analysis Registry Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `analysisType` | string | Unique identifier for analysis | `'tornado'` |
| `name` | string | Display name for UI | `'Tornado Analysis'` |
| `transformer` | Function | Main analysis transformer function | `computeTornadoFromMatrix` |
| `enabled` | boolean | Whether analysis is active | `true` |
| `priority` | number | Computation order (lower = earlier) | `100` |
| `supportedFormats` | Array | Available output formats | `[{format: 'chart', transformer: formatTornadoChart}]` |
| `defaultConfig` | Object | Default parameters for analysis | `{rankingMethod: 'correlation', impactThreshold: 0.01}` |

### Metrics Registry Sensitivity Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `enabled` | boolean | Include metric in sensitivity analysis | `true` |
| `analyses` | string[] | Which analyses this metric participates in | `['tornado', 'correlation']` |
| `interpolation.method` | string | Interpolation method for this metric | `'linear'` |
| `customConfig` | Object | Analysis-specific overrides | `{tornadoWeight: 1.5}` |

---

## Matrix Key Format & Access Specification

### Correlation Matrix Key Format
- **Format**: `'metricA-metricB'` where metricA < metricB alphabetically
- **Purpose**: Avoid duplicate keys for symmetric correlations
- **Examples**:
  - ✅ `'equityIRR-projectIRR'` (alphabetical order)
  - ❌ `'projectIRR-equityIRR'` (wrong order)
- **Access**: Use `generateMatrixKey(metricA, metricB)` helper function

### Covariance Matrix Access
- **Format**: 2D array `matrix[row][col]` 
- **Mapping**: `matrixMetadata.enabledMetrics[index]` provides row/column metric IDs
- **Symmetry**: `matrix[i][j] === matrix[j][i]` (symmetric matrix)
- **Diagonal**: `matrix[i][i]` contains variance for `enabledMetrics[i]`

---

## Business Value & Use Cases

### Project Finance Questions This System Answers

#### 1. Risk Identification & Prioritization
**Question**: *"What are the key value drivers that most impact our project returns?"*

**Analysis**: Tornado analysis ranking metrics by correlation strength
**UI Implementation**: Horizontal tornado chart with metrics ranked by impact magnitude
**Business Value**: Helps asset owners focus due diligence and risk mitigation on highest-impact variables

**Example Output**:
```
Energy Revenue:     ████████████████ 94% correlation with Project IRR
Construction Cost:  ████████████     -78% correlation with Project IRR  
O&M Costs:         ██████           -45% correlation with Project IRR
```

#### 2. Scenario Planning & What-If Analysis
**Question**: *"If energy prices drop by 15%, how will this affect all our key financial metrics?"*

**Analysis**: Matrix-based impact propagation using correlation coefficients
**UI Implementation**: Interactive slider with real-time metric updates using interpolation
**Business Value**: Enables rapid scenario evaluation without full model re-computation

#### 3. Portfolio Risk Assessment
**Question**: *"Which metrics move together, and where are our correlation risks?"*

**Analysis**: Correlation matrix analysis with statistical significance testing
**UI Implementation**: Interactive correlation heatmap with clustering and filtering
**Business Value**: Identifies diversification opportunities and concentration risks in project portfolio

**Example Heatmap**:
```
              ProjectIRR  EquityIRR  ProjectNPV  DSCR
ProjectIRR         1.00      0.87      0.94     0.23
EquityIRR          0.87      1.00      0.78     0.18  
ProjectNPV         0.94      0.78      1.00     0.31
DSCR               0.23      0.18      0.31     1.00
```

#### 4. Financing Optimization
**Question**: *"How do changes in debt structure affect different return metrics?"*

**Analysis**: Multi-metric tornado analysis focused on financing-related variables
**UI Implementation**: Grouped tornado chart with financing metrics highlighted
**Business Value**: Optimizes capital structure decisions and debt covenant analysis

#### 5. Operational Risk Management
**Question**: *"What operational factors pose the greatest risk to project viability?"*

**Analysis**: Tornado analysis filtered by operational metrics (O&M costs, availability, performance)
**UI Implementation**: Risk dashboard with operational metrics tornado and threshold indicators
**Business Value**: Prioritizes operational risk management and performance monitoring

### UI/UX Implementation Patterns

#### Tornado Charts (Primary Use: Risk Ranking)
**Chart Type**: Horizontal bar chart with positive/negative bars
**Features**: 
- Sortable by impact magnitude or correlation strength
- Filterable by metric category (revenue, cost, financing)
- Click-through to detailed metric analysis
- Percentile selector for different risk scenarios

**Optimal Usage**: Risk identification, value driver analysis, sensitivity ranking

#### Correlation Heatmaps (Primary Use: Relationship Discovery)
**Chart Type**: 2D grid heatmap with color-coded correlation strength
**Features**:
- Interactive hover for exact correlation values
- Clustering to group related metrics
- Significance filtering (hide weak correlations)
- Percentile comparison view

**Optimal Usage**: Portfolio risk assessment, diversification analysis, relationship exploration

#### Network Graphs (Primary Use: Relationship Visualization)  
**Chart Type**: Force-directed network with metrics as nodes, correlations as edges
**Features**:
- Node size represents metric variance/importance
- Edge thickness represents correlation strength
- Interactive layout with clustering algorithms
- Filter by correlation strength thresholds

**Optimal Usage**: Complex relationship discovery, metric grouping, system understanding

#### Time-Series Correlation (Primary Use: Temporal Analysis)
**Chart Type**: Line chart showing correlation changes across percentiles
**Features**:
- Multiple metrics correlation trends
- Percentile range selector
- Statistical confidence intervals
- Breakpoint detection for relationship changes

**Optimal Usage**: Risk evolution analysis, percentile-dependent relationships, trend identification

### Dashboard Integration Strategy

#### 1. Executive Dashboard
- **Tornado chart**: Top 5 value drivers for key metrics (Project IRR, NPV)
- **Risk summary**: Correlation statistics and diversification metrics
- **Scenario impact**: Quick what-if analysis with interpolation

#### 2. Risk Management Dashboard  
- **Full tornado analysis**: All enabled metrics with filtering capabilities
- **Correlation heatmap**: Complete relationship matrix with clustering
- **Threshold monitoring**: Alerts for correlation changes between refreshes

#### 3. Financing Dashboard
- **Financing-focused tornado**: Impact of debt structure on different return metrics
- **Covenant analysis**: Correlation between DSCR and operational metrics
- **Capital structure optimization**: Interactive sensitivity to debt/equity ratios

---

## Executive Summary

The Matrix-Based Sensitivity Analysis System provides a unified, high-performance solution for pre-computing and analyzing variable relationships in financial modeling. By leveraging correlation and covariance matrices, the system eliminates analysis-specific implementations while enabling tornado charts, correlation analysis, and future sensitivity methods through a single data structure.

### Key Innovation
Instead of separate analysis implementations, all sensitivity relationships are stored in efficient matrix structures that serve multiple analysis types through configurable transformers.

---

## Problem Statement & Architecture Decision

### The Challenge
Traditional sensitivity analysis systems suffer from:
- **Analysis-specific implementations** leading to code duplication
- **Inconsistent data access patterns** across different analysis types  
- **Performance bottlenecks** from repeated metric calculations
- **Complex data structures** that don't align with existing cube patterns

### The Solution: Matrix-Based Architecture
Research in variance-based sensitivity analysis demonstrates that **correlation and covariance matrices can efficiently represent all variable relationships**. Our approach:

1. **Pre-compute correlation/covariance matrices** per percentile during cube refresh
2. **Store in unified matrix structure** following existing cube patterns  
3. **Use analysis transformers** to extract tornado, correlation, and other insights from same data
4. **Enable efficient interpolation** between percentiles using matrix operations

### Technical Foundation
Based on academic research showing that:
- **Covariance matrices quantify uncertainty propagation** between variables
- **Matrix operations optimize sensitivity calculations** for large-scale problems  
- **Variance-based decomposition** provides unified framework for multiple analysis types
- **Local sensitivity matrices** represent all system relationships efficiently

---

## System Architecture

### Data Flow Integration
```
Raw Scenario → Sources → Metrics → **Sensitivity Matrices** → Complete
```

The sensitivity analysis integrates as a new stage in the CubeContext pipeline, processing after metrics computation to build correlation and covariance matrices from pre-computed metric values.

### Core Components

#### 1. Matrix Computation Engine
- Computes correlation/covariance matrices per percentile
- Uses only metrics with `sensitivity.enabled = true`
- Stores results in cube-pattern array structure

#### 2. Analysis Transformer Registry  
- Configurable transformers for different analysis types
- Multiple format options per analysis (raw, chart, heatmap, etc.)
- Extensible system for future analysis methods

#### 3. Unified Query Interface
- Single `getSensitivity()` function following cube patterns
- Supports single/multiple percentiles via array interface
- Format-aware routing to appropriate transformers
- **Integration**: New hook `useSensitivityCube()` interfaces with CubeContext state

---

## Data Schema Design

### Core Matrix Storage Schema

```javascript
// Individual matrix result per percentile
const SensitivityMatrixResultSchema = Yup.object().shape({
  percentile: Yup.number().required('Percentile is required'),
  
  // Core matrix data - unified storage
  correlationMatrix: Yup.mixed().required('Correlation matrix Map is required'), // Map<string, number>
  covarianceMatrix: Yup.array().of(Yup.array().of(Yup.number())).required('Covariance matrix is required'),
  
  // Matrix metadata for efficient access
  matrixMetadata: Yup.object().shape({
    enabledMetrics: Yup.array().of(Yup.string()).required('Enabled sensitivity metrics from registry'),
    dimensions: Yup.number().required('Matrix dimension (n x n)'),
    computedAt: Yup.date().required('Computation timestamp')
  }).required('Matrix metadata is required'),
  
  // Pre-computed statistics
  statistics: Yup.object().shape({
    avgCorrelation: Yup.number().required('Average correlation across all pairs'),
    maxCorrelation: Yup.number().required('Maximum correlation value'),
    minCorrelation: Yup.number().required('Minimum correlation value'),
    significantPairs: Yup.number().required('Count of correlations above threshold'),
    totalVariance: Yup.number().required('Total variance across all metrics')
  }).required('Statistics are required')
});

// Main sensitivity data schema (following CubeSourceDataSchema pattern)
const CubeSensitivityDataSchema = Yup.object().shape({
  id: Yup.string().required('Sensitivity analysis ID is required'), // Always 'sensitivity'
  percentileMatrices: Yup.array().of(SensitivityMatrixResultSchema).default([]),
  metadata: CubeSensitivityMetadataSchema.required('Metadata is required'),
  audit: Yup.object().shape({
    trail: Yup.array().of(AuditTrailEntrySchema).default([]),
    dependencies: Yup.object().shape({
      enabledMetrics: Yup.array().of(Yup.string()).default([]),
      computationMethod: Yup.string().default('pearson')
    }).default({})
  }).required('Audit trail is required')
});
```

### Query Interface Schemas

```javascript
// Input schema for sensitivity queries
const SensitivityQuerySchema = Yup.object().shape({
  percentiles: Yup.array().of(Yup.number()).min(1, 'At least one percentile required'),
  analysisType: Yup.string().oneOf(['tornado', 'correlation', 'impact', 'custom']).required(),
  targetMetrics: Yup.array().of(Yup.string()).optional(),
  format: Yup.string().optional(), // Validated against transformer registry
  parameters: Yup.object().default(() => ({}))
});

// Analysis transformer registry schema
const SensitivityTransformerRegistrySchema = Yup.object().shape({
  analysisType: Yup.string().required('Analysis type is required'),
  name: Yup.string().required('Analysis name is required'),
  transformer: Yup.mixed().required('Transformer function is required'),
  enabled: Yup.boolean().default(true),
  priority: Yup.number().default(100),
  supportedFormats: Yup.array().of(Yup.object().shape({
    format: Yup.string().required('Format name is required'),
    transformer: Yup.mixed().required('Format transformer function is required'),
    description: Yup.string().required('Format description is required')
  })).default([]),
  defaultConfig: Yup.object().default(() => ({}))
});
```

---

## Data Structure Examples

### Matrix Storage Structure
```javascript
// Single sensitivityData object in CubeContext
sensitivityData = {
  id: 'sensitivity',
  percentileMatrices: [
    {
      percentile: 10,
      correlationMatrix: new Map([
        // Key format: 'metricA-metricB' (alphabetical order to avoid duplicates)
        ['equityIRR-projectIRR', 0.87],      // equityIRR vs projectIRR correlation
        ['projectIRR-projectNPV', 0.94],     // projectIRR vs projectNPV correlation  
        ['equityIRR-projectNPV', 0.78]       // equityIRR vs projectNPV correlation
      ]),
      covarianceMatrix: [
        //          projectIRR  equityIRR  projectNPV (ordered by matrixMetadata.enabledMetrics)
        [2.1,        1.8,       2.0    ],  // projectIRR row: [variance, covariance, covariance]
        [1.8,        3.2,       2.5    ],  // equityIRR row: [covariance, variance, covariance]
        [2.0,        2.5,       4.1    ]   // projectNPV row: [covariance, covariance, variance]
      ],
      matrixMetadata: {
        enabledMetrics: ['projectIRR', 'equityIRR', 'projectNPV'], // Row/column order for covariance matrix
        dimensions: 3,
        computedAt: new Date('2025-07-31T10:30:00Z')
      },
      statistics: {
        avgCorrelation: 0.86,
        maxCorrelation: 0.94,
        minCorrelation: 0.78,
        significantPairs: 3,
        totalVariance: 9.4
      }
    },
    {
      percentile: 25,
      // ... same structure for P25
    },
    {
      percentile: 50,
      // ... same structure for P50  
    }
    // ... for each available percentile
  ],
  metadata: {
    name: 'Sensitivity Matrix Analysis',
    analysisType: 'matrix',
    matrixConfig: {
      correlationMethod: 'pearson',
      significanceThreshold: 0.3,
      onlyEnabledMetrics: true
    }
  },
  audit: {
    trail: [
      {
        timestamp: Date.now(),
        step: 'matrix_computation',
        type: 'transform',
        details: 'Computed correlation matrix for 3 enabled metrics',
        dependencies: ['projectIRR', 'equityIRR', 'projectNPV']
      }
    ],
    dependencies: {
      enabledMetrics: ['projectIRR', 'equityIRR', 'projectNPV'],
      computationMethod: 'pearson'
    }
  }
}
```

### Registry Examples

#### Sensitivity Analyses Registry
```javascript
export const SENSITIVITY_ANALYSES_REGISTRY = {
  analyses: [
    {
      analysisType: 'tornado',
      name: 'Tornado Analysis',
      description: 'Variable impact ranking from correlation matrix',
      transformer: computeTornadoFromMatrix,
      enabled: true,
      priority: 100,
      supportedFormats: [
        {
          format: 'raw',
          transformer: formatTornadoRaw,
          description: 'Raw ranking data with correlations and impacts'
        },
        {
          format: 'chart',
          transformer: formatTornadoChart,
          description: 'Chart-ready data for tornado visualization'
        },
        {
          format: 'table',
          transformer: formatTornadoTable,
          description: 'Sortable table format'
        }
      ],
      defaultConfig: {
        rankingMethod: 'correlation',
        impactThreshold: 0.01,
        maxResults: 10
      }
    },
    
    {
      analysisType: 'correlation',
      name: 'Correlation Analysis', 
      description: 'Cross-metric correlation analysis',
      transformer: computeCorrelationFromMatrix,
      enabled: true,
      priority: 200,
      supportedFormats: [
        {
          format: 'raw',
          transformer: formatCorrelationRaw,
          description: 'Raw correlation matrix data'
        },
        {
          format: 'heatmap',
          transformer: formatCorrelationHeatmap,
          description: 'Heatmap-ready data structure'
        },
        {
          format: 'network',
          transformer: formatCorrelationNetwork,
          description: 'Network graph data'
        }
      ],
      defaultConfig: {
        significanceThreshold: 0.3,
        includeInsignificant: false
      }
    }
  ]
};
```

#### Metrics Registry Integration
```javascript
// Update to existing metrics in METRICS_REGISTRY
{
  id: 'projectIRR',
  // ... existing configuration
  sensitivity: {
    enabled: true,
    analyses: ['tornado', 'correlation'], // Which analyses this metric participates in
    interpolation: {
      method: 'linear'
    },
    customConfig: {
      tornadoWeight: 1.0, // Optional analysis-specific settings
      correlationGroup: 'financial' // Optional grouping for analysis
    }
  }
}
```

---

## Access Patterns & API Design

### Core Access Function
```javascript
/**
 * Get sensitivity analysis data with flexible filtering
 * @param {Object} filters - Query filters following SensitivityQuerySchema
 * @returns {Object} Analysis results in requested format
 */
const getSensitivity = (filters) => {
  // Implementation routes to appropriate transformer based on analysisType and format
};
```

### Usage Examples
```javascript
// Single percentile tornado analysis
const tornadoP50 = getSensitivity({
  percentiles: [50],
  analysisType: 'tornado',
  targetMetrics: ['projectIRR'],
  format: 'chart'
});
// Returns: Chart-ready tornado data for projectIRR at P50

// Multi-percentile correlation heatmap
const correlationTrend = getSensitivity({
  percentiles: [25, 50, 75],
  analysisType: 'correlation', 
  format: 'heatmap'
});
// Returns: Heatmap data showing correlation changes across percentiles

// Raw matrix access for custom analysis
const rawMatrix = getSensitivity({
  percentiles: [50],
  analysisType: 'correlation',
  format: 'raw'
});
// Returns: Direct access to correlation matrix and covariance data
```

---

## CubeContext Integration

### CubeContext Integration (Minimal Changes Required)

**New State Addition**:
```javascript
// Add to existing CubeContext state
const [sensitivityData, setSensitivityData] = useState(null); // CubeSensitivityDataSchema
```

**Refresh Stage Addition**:
```javascript
// Updated refresh stages in CubeContext (add 'sensitivity' before 'complete')
const refreshStages = [
  'idle', 
  'dependencies', 
  'sources', 
  'metrics', 
  'sensitivity',  // New stage - computes after metrics are available
  'complete'
];
```

### Sensitivity Refresh Implementation
```javascript
case 'sensitivity':
  console.log('🔄 CubeContext: Stage 4 - Computing sensitivity matrices...');
  try {
    const computedSensitivityData = await computeSensitivityMatrices(
      getMetric, // Access to all computed metrics
      SENSITIVITY_ANALYSES_REGISTRY,
      percentileInfo.available, // Use same percentiles as metrics system
      METRICS_REGISTRY // Access to sensitivity configuration
    );
    setSensitivityData(computedSensitivityData);
    console.log('✅ CubeContext: Sensitivity matrices computed successfully');
    setRefreshStage('complete');
  } catch (error) {
    console.error('❌ CubeContext: Failed to compute sensitivity data:', error);
    throw error;
  }
  break;
```

---

## Hook Design: useSensitivityCube

**Integration Pattern**: Similar to `useCubeMetrics()`, this hook provides the interface to access CubeContext sensitivity state without direct context manipulation.

```javascript
/**
 * Hook for accessing sensitivity analysis data with matrix-based operations
 * Provides unified interface for tornado, correlation, and custom sensitivity analyses
 * @returns {Object} Sensitivity analysis interface
 */
export const useSensitivityCube = () => {
  const { sensitivityData, percentileInfo, isLoading } = useCube();

  /**
   * Get sensitivity analysis results with flexible filtering and formatting
   * @param {Object} filters - Query configuration
   * @param {number[]} filters.percentiles - Percentiles to analyze (e.g., [50] or [25,50,75])
   * @param {string} filters.analysisType - Analysis type: 'tornado' | 'correlation' | 'impact' | 'custom'
   * @param {string[]} [filters.targetMetrics] - Specific metrics to analyze (optional, defaults to all enabled)
   * @param {string} [filters.format] - Output format (validated against transformer registry)
   * @param {Object} [filters.parameters] - Analysis-specific parameters
   * @returns {Object} Formatted analysis results with metadata
   */
  const getSensitivity = useCallback((filters) => {
    // 1. Validate query against SensitivityQuerySchema
    // 2. Check if requested percentiles exist in sensitivityData.percentileMatrices
    // 3. Validate analysisType exists in SENSITIVITY_ANALYSES_REGISTRY
    // 4. Validate format is supported by the analysis transformer
    // 5. Extract relevant matrix data for requested percentiles
    // 6. Apply analysis transformer to matrix data
    // 7. Apply format transformer if format specified
    // 8. Return formatted results with metadata
  }, [sensitivityData]);

  /**
   * Get raw correlation matrix for specified percentile(s)
   * @param {number|number[]} percentiles - Single percentile or array
   * @returns {Object} Raw correlation matrix data
   */
  const getCorrelationMatrix = useCallback((percentiles) => {
    // 1. Normalize percentiles to array format
    // 2. Extract correlationMatrix from each percentile's data
    // 3. Return raw Map objects or aggregated data for multiple percentiles
  }, [sensitivityData]);

  /**
   * Get covariance matrix for specified percentile(s) 
   * @param {number|number[]} percentiles - Single percentile or array
   * @returns {Object} Raw covariance matrix data with metric mapping
   */
  const getCovarianceMatrix = useCallback((percentiles) => {
    // 1. Normalize percentiles to array format
    // 2. Extract covarianceMatrix arrays from each percentile's data
    // 3. Include matrixMetadata.enabledMetrics for row/column mapping
    // 4. Return 2D arrays with metric labels
  }, [sensitivityData]);

  /**
   * Interpolate sensitivity values between computed percentiles
   * @param {Object} config - Interpolation configuration
   * @param {number} config.targetPercentile - Percentile to interpolate (e.g., 60)
   * @param {string} config.metricA - First metric ID
   * @param {string} config.metricB - Second metric ID  
   * @param {string} [config.method='linear'] - Interpolation method
   * @returns {number} Interpolated correlation/covariance value
   */
  const interpolateSensitivity = useCallback((config) => {
    // 1. Find bounding percentiles for targetPercentile
    // 2. Extract correlation values for metricA-metricB at bounding percentiles
    // 3. Apply interpolation method (linear, cubic, etc.)
    // 4. Return interpolated value
  }, [sensitivityData]);

  /**
   * Get tornado rankings for specific metric(s)
   * @param {Object} config - Tornado configuration
   * @param {number[]} config.percentiles - Percentiles to analyze
   * @param {string|string[]} config.targetMetrics - Target metric(s) for impact analysis
   * @param {string} [config.rankingMethod='correlation'] - Ranking method
   * @param {string} [config.format='raw'] - Output format
   * @returns {Object} Tornado rankings and impact data
   */
  const getTornadoAnalysis = useCallback((config) => {
    // 1. Use getSensitivity() with analysisType: 'tornado'
    // 2. Apply tornado-specific configuration and filtering
    // 3. Return formatted tornado results
  }, [getSensitivity]);

  /**
   * Get correlation analysis for metric relationships
   * @param {Object} config - Correlation configuration  
   * @param {number[]} config.percentiles - Percentiles to analyze
   * @param {string[]} [config.metrics] - Specific metrics (optional, defaults to all enabled)
   * @param {string} [config.format='raw'] - Output format
   * @param {boolean} [config.includeInsignificant=false] - Include weak correlations
   * @returns {Object} Correlation matrix and statistics
   */
  const getCorrelationAnalysis = useCallback((config) => {
    // 1. Use getSensitivity() with analysisType: 'correlation'  
    // 2. Apply correlation-specific filtering and thresholds
    // 3. Return formatted correlation results
  }, [getSensitivity]);

  /**
   * Get available analysis types and their supported formats
   * @returns {Object} Registry information for available analyses and formats
   */
  const getAvailableAnalyses = useCallback(() => {
    // 1. Query SENSITIVITY_ANALYSES_REGISTRY for enabled analyses
    // 2. Extract analysisType, supportedFormats, and descriptions
    // 3. Return structured information for UI components
  }, []);

  /**
   * Get sensitivity computation status and metadata
   * @returns {Object} Status information about sensitivity data
   */
  const getSensitivityStatus = useCallback(() => {
    // 1. Check if sensitivityData exists and is current
    // 2. Return computation timestamp, enabled metrics count, matrix dimensions
    // 3. Include performance statistics from metadata
  }, [sensitivityData, percentileInfo]);

  return {
    // Core access functions
    getSensitivity,
    getCorrelationMatrix,
    getCovarianceMatrix,
    interpolateSensitivity,
    
    // Analysis-specific helpers
    getTornadoAnalysis,
    getCorrelationAnalysis,
    
    // Utility functions  
    getAvailableAnalyses,
    getSensitivityStatus,
    
    // State information
    isLoading,
    sensitivityData,
    availablePercentiles: percentileInfo?.available || []
  };
};
```

---

## Implementation Features

### Core Capabilities

#### 1. Matrix-Based Sensitivity Analysis
- **Unified matrix storage** for all variable relationships
- **Pre-computed correlation/covariance matrices** per percentile
- **Efficient O(1) lookups** for any metric pair relationship
- **Memory-optimized storage** with sparse matrix support

#### 2. Analysis Transformer System
- **Registry-driven analysis types** (tornado, correlation, custom)
- **Multiple format support** per analysis (raw, chart, heatmap, table)
- **Extensible transformer architecture** for future analysis methods
- **Configuration-driven behavior** via registry settings

#### 3. Percentile-Based Analysis
- **Per-percentile matrix computation** aligned with metrics system
- **Cross-percentile comparison** capabilities
- **Linear interpolation** between computed percentiles
- **Consistent percentile handling** with existing cube system

#### 4. Performance Optimization
- **Single matrix computation** serves multiple analysis types
- **Pre-computed statistics** for common operations
- **Efficient data access patterns** following cube system conventions
- **Minimal memory footprint** with selective metric inclusion

### Advanced Features

#### 1. Multi-Metric Tornado Analysis
- **Cross-metric impact rankings** from correlation matrix
- **Configurable ranking methods** (correlation, impact, absolute)
- **Chart-ready output** for tornado visualizations
- **Threshold-based filtering** of significant relationships

#### 2. Dynamic Correlation Analysis  
- **Heatmap-ready correlation matrices** 
- **Network graph data generation** for relationship visualization
- **Statistical summaries** (avg correlation, significant pairs)
- **Threshold-based significance filtering**

#### 3. Interpolation Engine
- **Between-percentile estimation** using linear interpolation
- **Custom interpolation methods** configurable per metric
- **Efficient calculation** without stored intermediate values
- **Integration with analysis transformers**

---

## Implementation Sequence

### Phase 1: Foundation (Schema & Core)
1. **Update cube schemas** - Add sensitivity schemas to `schemas/yup/cube.js`
2. **Create analyses registry** - Define `SENSITIVITY_ANALYSES_REGISTRY`
3. **Update metrics registry** - Add sensitivity configuration to existing metrics
4. **Implement core processor** - Create `computeSensitivityMatrices()` function

### Phase 2: CubeContext Integration  
1. **Add sensitivity stage** - Update CubeContext refresh pipeline
2. **Implement matrix computation** - Build correlation/covariance matrices from metrics
3. **Add state management** - Include sensitivityData in CubeContext state
4. **Error handling** - Graceful fallbacks for missing/invalid data

### Phase 3: Access Layer
1. **Create useSensitivityCube hook** - Implement all access functions
2. **Build query interface** - Implement getSensitivity() with validation
3. **Add format transformers** - Create format-specific output functions
4. **Implement interpolation** - Add between-percentile calculation utilities

### Phase 4: Analysis Transformers
1. **Tornado transformer** - Extract rankings from correlation matrix
2. **Correlation transformer** - Format matrix data for different visualizations  
3. **Chart format transformers** - Convert data for UI components
4. **Validation & testing** - Ensure all transformers work with matrix data

### Phase 5: Integration & Optimization
1. **Performance testing** - Validate matrix computation performance
2. **Memory optimization** - Implement sparse matrix storage if needed
3. **UI integration** - Connect with existing chart/table components
4. **Documentation** - Complete API documentation and usage examples

---

## Technical Considerations

### Performance Characteristics

#### Computational Complexity
- **Matrix size**: O(N²) where N = number of enabled metrics
- **Memory usage**: ~8 bytes × N² × P (where P = number of percentiles)
- **Computation time**: O(N² × P) for correlation/covariance calculation
- **Query time**: O(1) for matrix lookups, O(N) for analysis transformations

#### Memory Optimization Triggers
- **Dense storage**: For ≤20 enabled metrics (standard use case)
- **Sparse storage**: For >20 enabled metrics (large installations)
- **Significance filtering**: Remove correlations below threshold to reduce storage

#### Error Handling Strategy
- **Missing sensitivity data**: Return empty results with clear error message
- **Insufficient metrics**: Require minimum 2 enabled metrics for matrix computation
- **Invalid percentiles**: Graceful fallback to nearest available percentile
- **Analysis failures**: Return raw matrix data when transformer fails

### Scalability Considerations
- **Sparse matrix storage** for large metric sets (50+ metrics)
- **Configurable significance thresholds** to reduce matrix density
- **Lazy computation** of format transformations
- **Caching strategy** for frequently accessed transformations

### Error Handling Strategy
- **Graceful degradation** when sensitivity data unavailable
- **Validation errors** for invalid query parameters
- **Matrix computation failures** with detailed error reporting
- **Transformer errors** with fallback to raw data

### Integration Requirements
- **Zero modification** to existing metrics system or functions
- **Minimal CubeContext changes**: Only add state and refresh stage
- **Consistent API patterns** following getData()/getMetric() conventions
- **New hook interface**: `useSensitivityCube()` provides access to CubeContext sensitivity state
- **Registry-driven**: No hardcoded analysis types, fully configurable via registry

---

## Success Metrics

### Functional Success
- ✅ **Unified data structure** serves tornado, correlation, and future analyses
- ✅ **Sub-100ms computation** time for sensitivity matrices  
- ✅ **Consistent API patterns** with existing cube system
- ✅ **Registry-driven extensibility** for new analysis types

### Performance Success  
- ✅ **O(1) sensitivity lookups** via matrix access
- ✅ **Linear memory scaling** with enabled metrics count
- ✅ **<1ms query response** for formatted analysis results
- ✅ **Efficient interpolation** between computed percentiles

### Usability Success
- ✅ **Simple query interface** with flexible percentile handling
- ✅ **Multiple output formats** per analysis type
- ✅ **Registry-based configuration** for analysis behavior
- ✅ **Clear error messages** for invalid queries

This matrix-based approach provides a unified, efficient, and extensible foundation for comprehensive sensitivity analysis while maintaining perfect alignment with existing cube system patterns and performance requirements.