# Driver Explorer Card - Product Requirements Document
Version: v2.0 | Date: 2025-06-24 | Author: Development Team

---

## 1. Purpose & Business Goals

### Primary Business Question
**"What are the key value drivers affecting project returns?"**

This card answers the critical question that helps wind project stakeholders understand which variables have the greatest impact on financial performance, enabling better risk management and optimization strategies.

### Core Objectives
- **Risk Identification**: Identify variables that create the highest financial risk/opportunity
- **Decision Support**: Provide data-driven insights for contract negotiations and design decisions  
- **Performance Optimization**: Guide focus areas for improving project returns
- **Stakeholder Communication**: Present clear, quantified impact rankings for executive review

---

## 2. Technical Approach & Data Strategy

### Sensitivity Analysis Methodology

We implement **One-at-a-Time Sensitivity Analysis** that leverages existing Monte Carlo simulation results:

**How it works**: For each variable, compare target metric values between lower percentile (P25) and upper percentile (P75) while holding all other variables at their base case (P50).

**Why this approach**:
- ✅ Uses existing percentile-based simulation results
- ✅ Simple to understand and explain to stakeholders
- ✅ Fast computation using existing data infrastructure
- ✅ Clear attribution to individual variables
- ✅ Aligns with existing CashflowContext percentile selection system

**Data Requirements**:
- Existing percentile simulation results (P10, P25, P50, P75, P90)
- Target metric values for each percentile from CashflowContext
- Variable metadata from dual registry system

---

## 3. Dual Registry Architecture

### Problem Statement
Adding sensitivity variables to `CASHFLOW_SOURCE_REGISTRY` would contaminate cash flow tables with indirect variables that don't directly create cash flows.

### Solution: Dual Registry System

#### CASHFLOW_SOURCE_REGISTRY (Unchanged)
Remains focused on direct cash flow generation:
```javascript
CASHFLOW_SOURCE_REGISTRY = {
  data: { projectLife: [...], numWTGs: [...], currency: [...] },
  multipliers: [
    { id: 'electricityPrice', path: [...], hasPercentiles: true },
    { id: 'escalationRate', path: [...], hasPercentiles: true }
  ],
  costs: [ /* direct cost sources */ ],
  revenues: [ /* direct revenue sources */ ]
}
```

#### SENSITIVITY_SOURCE_REGISTRY (New)
Contains indirect variables for sensitivity analysis:
```javascript
SENSITIVITY_SOURCE_REGISTRY = {
  data: { /* Same global data structure */ },
  
  technical: [
    {
      id: 'availability',
      path: ['simulation', 'inputSim', 'distributionAnalysis', 'availability'],
      category: 'technical',
      hasPercentiles: true,
      transformer: null, // No direct cash flow transformation
      multipliers: [],
      description: 'Wind turbine availability factor'
    },
    {
      id: 'windVariability',
      path: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'],
      category: 'technical', 
      hasPercentiles: true,
      transformer: null,
      multipliers: [],
      description: 'Wind resource variability affecting energy production'
    },
    {
      id: 'capacityFactor',
      path: ['settings', 'project', 'windFarm', 'capacityFactor'],
      category: 'technical',
      hasPercentiles: false,
      transformer: null,
      multipliers: [],
      description: 'Net capacity factor of wind farm'
    }
  ],
  
  financial: [
    {
      id: 'costOfEquity',
      path: ['settings', 'modules', 'financing', 'costOfEquity'],
      category: 'financing',
      hasPercentiles: false,
      transformer: null,
      multipliers: [],
      description: 'Required return rate for equity investors'
    },
    {
      id: 'debtRatio',
      path: ['settings', 'modules', 'financing', 'debtRatio'],
      category: 'financing',
      hasPercentiles: false,
      transformer: null,
      multipliers: [],
      description: 'Debt to total capital ratio'
    }
  ]
}
```

### Schema Compatibility
Both registries use the same `CashflowSourceRegistrySchema` with minor enhancement:

```javascript
// schemas/yup/cashflow.js - Enhanced schema
const CashflowSourceRegistrySchema = Yup.object().shape({
    data: RegistryDataSchema.required(),
    multipliers: Yup.array().of(RegistrySourceSchema).default([]),
    costs: Yup.array().of(RegistrySourceSchema).default([]),
    revenues: Yup.array().of(RegistrySourceSchema).default([]),
    // NEW: Additional sections for sensitivity variables
    technical: Yup.array().of(RegistrySourceSchema).default([]),
    financial: Yup.array().of(RegistrySourceSchema).default([])
});

const SensitivitySourceRegistrySchema = CashflowSourceRegistrySchema;
```

### Variable Discovery Implementation
```javascript
const discoverAllSensitivityVariables = (registries) => {
  const registryArray = Array.isArray(registries) ? registries : [registries];
  const variables = [];
  
  registryArray.forEach(registry => {
    // Extract from all sections using same logic
    ['multipliers', 'costs', 'revenues', 'technical', 'financial'].forEach(section => {
      if (registry[section]) {
        registry[section].forEach(source => {
          if (source.hasPercentiles) {
            variables.push({
              id: source.id,
              label: source.description,
              category: source.category,
              path: source.path,
              source: registry === CASHFLOW_SOURCE_REGISTRY ? 'direct' : 'indirect',
              hasPercentiles: true,
              registrySection: section
            });
          }
        });
      }
    });
  });
  
  return variables;
};

// Usage:
const allVariables = discoverAllSensitivityVariables([
  CASHFLOW_SOURCE_REGISTRY, 
  SENSITIVITY_SOURCE_REGISTRY
]);
```

---

## 4. Time-Series Aggregation Strategy

### The Challenge
Financial metrics are provided as time-series spanning project lifetime (20+ years). Sensitivity analysis needs single values for impact comparison.

### Reusable Aggregation Function
Create `frontend/src/utils/timeSeries/aggregation.js`:

```javascript
/**
 * Optimized time-series aggregation utility
 * @param {Array} data - Time series data [{year, value}, ...]
 * @param {string} method - Aggregation method
 * @param {Object} options - Additional options
 * @returns {number|null} Aggregated value
 */
export const aggregateTimeSeries = (data, method, options = {}) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  const {
    filter = 'all',           // 'all', 'operational', 'construction', 'early', 'late'
    discountRate = 0,         // For NPV calculations
    precision = 2,            // Decimal places
    weights = null            // Custom weights array
  } = options;

  // Apply filters (optimized single pass)
  let filteredData = data;
  switch (filter) {
    case 'operational': filteredData = data.filter(d => d.year > 0); break;
    case 'construction': filteredData = data.filter(d => d.year <= 0); break;
    case 'early': filteredData = data.filter(d => d.year > 0 && d.year <= 5); break;
    case 'late': filteredData = data.filter(d => d.year > 15); break;
  }

  if (filteredData.length === 0) return null;
  
  const values = filteredData.map(d => d.value).filter(v => typeof v === 'number');
  if (values.length === 0) return null;

  let result;
  
  switch (method) {
    case 'mean': 
      result = values.reduce((sum, val) => sum + val, 0) / values.length;
      break;
    case 'min': 
      result = Math.min(...values);
      break;
    case 'max': 
      result = Math.max(...values);
      break;
    case 'p10':
      const sorted = [...values].sort((a, b) => a - b);
      result = sorted[Math.floor(values.length * 0.1)];
      break;
    case 'p90':
      const sorted90 = [...values].sort((a, b) => a - b);
      result = sorted90[Math.floor(values.length * 0.9)];
      break;
    case 'sum': 
      result = values.reduce((sum, val) => sum + val, 0);
      break;
    case 'npv':
      result = filteredData.reduce((npv, d) => {
        const discountFactor = Math.pow(1 + discountRate, -d.year);
        return npv + (d.value * discountFactor);
      }, 0);
      break;
    default:
      throw new Error(`Unsupported aggregation method: ${method}`);
  }

  return precision > 0 ? Number(result.toFixed(precision)) : Math.round(result);
};

// Usage examples:
// aggregateTimeSeries(dscrData, 'min', { filter: 'operational' })
// aggregateTimeSeries(cashflows, 'npv', { discountRate: 0.08 })
// aggregateTimeSeries(revenue, 'sum', { filter: 'operational' })
```

### Wind Industry Aggregation Strategies

| Metric | Aggregation Method | Rationale |
|--------|-------------------|-----------|
| NPV, IRR | Use final value | Already lifetime aggregated metrics |
| DSCR, ICR | `min` with `operational` filter | Lenders care about worst-case covenant compliance |
| LCOE | `mean` with lifecycle weighting | Standard levelized cost methodology |
| Cash Flow | `sum` for lifetime totals | Cumulative impact analysis |
| Payback Period | Use calculated value | Point-in-time metric |

---

## 5. Enhanced Metrics Support

### Updated SUPPORTED_METRICS
```javascript
// frontend/src/utils/finance/sensitivityMetrics.js
export const SUPPORTED_METRICS = {
  npv: { 
    label: 'NPV', 
    format: 'currency', 
    path: ['npv'],
    aggregation: 'value', // Already single value
    units: '$',
    description: 'Net Present Value of project cash flows'
  },
  irr: { 
    label: 'Project IRR', 
    format: 'percentage', 
    path: ['irr'],
    aggregation: 'value',
    units: '%',
    description: 'Internal Rate of Return for total project'
  },
  equityIRR: { 
    label: 'Equity IRR', 
    format: 'percentage', 
    path: ['equityIRR'],
    aggregation: 'value',
    units: '%',
    description: 'Internal Rate of Return for equity investors'
  },
  minDSCR: { 
    label: 'Minimum DSCR', 
    format: 'ratio', 
    path: ['dscr'],
    aggregation: 'min',
    aggregationOptions: { filter: 'operational' },
    units: 'x',
    description: 'Lowest Debt Service Coverage Ratio during operations'
  },
  paybackPeriod: { 
    label: 'Payback Period', 
    format: 'years', 
    path: ['paybackPeriod'],
    aggregation: 'value',
    units: 'years',
    description: 'Time to recover initial investment'
  },
  llcr: { 
    label: 'LLCR', 
    format: 'ratio', 
    path: ['llcr'],
    aggregation: 'value',
    units: 'x',
    description: 'Loan Life Coverage Ratio'
  },
  lcoe: { 
    label: 'LCOE', 
    format: 'currency', 
    path: ['lcoe'],
    aggregation: 'value',
    units: '$/MWh',
    description: 'Levelized Cost of Energy'
  }
};
```

### LCOE Calculation Implementation
Add to `frontend/src/utils/finance/calculations.js`:

```javascript
/**
 * Calculate Levelized Cost of Energy (LCOE)
 * LCOE = (Total Lifetime Costs) / (Total Lifetime Energy Production)
 * @param {Object} cashflowData - Complete cashflow data
 * @param {Object} options - Calculation options  
 * @returns {number} LCOE in $/MWh
 */
export const calculateLCOE = (cashflowData, options = {}) => {
  const { discountRate = 0.08 } = options;
  
  if (!cashflowData?.aggregations) return 0;
  
  // Get lifetime costs (present value)
  const costs = cashflowData.aggregations.totalCosts?.data || [];
  const totalCosts = aggregateTimeSeries(costs, 'npv', { discountRate });
  
  // Get lifetime energy production (present value)
  const energyRevenue = cashflowData.lineItems?.find(item => item.id === 'energyRevenue');
  if (!energyRevenue?.data) return 0;
  
  // Assume energy data is in MWh, extract from revenue using electricity price
  const electricityPrice = 50; // $/MWh - get from multipliers or context
  const energyMWh = energyRevenue.data.map(d => ({ 
    year: d.year, 
    value: d.value / electricityPrice 
  }));
  
  const totalEnergy = aggregateTimeSeries(energyMWh, 'npv', { discountRate });
  
  return totalEnergy > 0 ? totalCosts / totalEnergy : 0;
};
```

---

## 6. Multi-Chart Support Architecture

### Chart Type Registry
```javascript
// frontend/src/components/charts/SensitivityCharts.jsx
export const SENSITIVITY_CHART_TYPES = {
  tornado: {
    label: 'Impact Ranking',
    description: 'Single-value impact comparison',
    component: TornadoChart,
    dataType: 'aggregated',
    defaultFor: ['npv', 'irr', 'lcoe', 'paybackPeriod', 'equityIRR'],
    icon: 'BarChartOutlined'
  },
  heatmap: {
    label: 'Time-Series Analysis',
    description: 'Year-by-year impact visualization', 
    component: SensitivityHeatmap,
    dataType: 'timeSeries',
    defaultFor: ['dscr', 'icr', 'cashflow'],
    icon: 'HeatMapOutlined'
  }
};

export const getDefaultChartType = (targetMetric) => {
  for (const [chartType, config] of Object.entries(SENSITIVITY_CHART_TYPES)) {
    if (config.defaultFor.includes(targetMetric)) {
      return chartType;
    }
  }
  return 'tornado'; // fallback
};
```

### Chart Selection Logic
- **Tornado Chart**: Default for aggregated single-value metrics
- **Heatmap**: Recommended for time-series metrics when user wants year-by-year analysis
- **User Override**: Always allow manual chart type selection via dropdown

---

## 7. User Interface Design

### Responsive Layout (No Summary Table)
Focus on rich chart visualization with enhanced interactivity:

```
┌─────────────────────────────────────────────────────────────┐
│ Driver Explorer Card          [Chart: Tornado ▼] [⚙ Settings] │
├─────────────────────────────────────────────────────────────┤
│ Controls: [Metric: NPV ▼] [Range: P25-P75 ▼] [Agg: min ▼]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Enhanced Chart Visualization                               │
│  • Rich hover: "Electricity Price: $45→$65/MWh = $2.1M NPV"│
│  • Variable categories: Color-coded bars                    │
│  • Impact values: Formatted with proper units              │
│  • Source indicators: Direct vs Indirect impact markers    │
│                                                             │
│  Interactive Features:                                      │
│  • Click variables for detailed breakdown                   │
│  • Filter by category (Technical/Financial/Commercial)     │
│  • Sort by impact magnitude or alphabetically              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Insights: "6 variables • Top 3 account for 67% of variance" │
└─────────────────────────────────────────────────────────────┘
```

### Interactive Elements
1. **Chart Type Selector**: Tornado vs Heatmap with intelligent defaults
2. **Target Metric Dropdown**: All supported metrics with descriptions
3. **Percentile Range Selector**: P10-P90, P25-P75, P5-P95 presets
4. **Aggregation Method**: Min/Max/Mean for time-series metrics
5. **Enhanced Hover**: Detailed impact info with variable ranges and units
6. **Category Filtering**: Show/hide Technical, Financial, Commercial variables

---

## 9. CashflowContext Integration & Data Storage

### Follow Established Refresh Patterns
The Driver Explorer Card integrates with CashflowContext following the established init/refresh workflow:

```javascript
// CashflowContext enhancement for sensitivity data caching
const CashflowProvider = ({ children }) => {
  // ... existing state
  const [sensitivityCache, setSensitivityCache] = useState(null);
  const [sensitivityMetadata, setSensitivityMetadata] = useState(null);

  // Enhance existing refresh function
  const refreshCashflowData = useCallback((force = false) => {
    // ... existing refresh logic
    
    // Clear sensitivity cache when cashflow data refreshes
    setSensitivityCache(null);
    setSensitivityMetadata(null);
  }, [/* existing dependencies */]);

  // New: sensitivity-specific caching
  const cacheSensitivityResults = useCallback((results, metadata) => {
    setSensitivityCache(results);
    setSensitivityMetadata({
      ...metadata,
      lastCalculated: new Date().toISOString(),
      variableCount: results.length
    });
  }, []);

  const value = {
    // ... existing context values
    sensitivityCache,
    sensitivityMetadata,
    cacheSensitivityResults
  };

  return <CashflowContext.Provider value={value}>{children}</CashflowContext.Provider>;
};
```

### Component Integration Pattern
```javascript
// DriverExplorerCard integration with CashflowContext
const DriverExplorerCard = ({ cashflowData, selectedPercentiles }) => {
  const { 
    refreshCashflowData, 
    sensitivityCache, 
    sensitivityMetadata,
    cacheSensitivityResults 
  } = useCashflow();
  
  const { scenarioData } = useScenario();

  // Check if we need to refresh based on established patterns
  const needsRefresh = useMemo(() => {
    if (!sensitivityCache || !sensitivityMetadata) return true;
    
    // Check if percentile selection changed
    const currentPercentileHash = JSON.stringify(selectedPercentiles);
    const cachedPercentileHash = sensitivityMetadata.percentileHash;
    
    return currentPercentileHash !== cachedPercentileHash;
  }, [sensitivityCache, sensitivityMetadata, selectedPercentiles]);

  // Follow CashflowContext loading states
  const [loading, setLoading] = useState(false);

  // Sensitivity calculation with caching
  const sensitivityResults = useMemo(() => {
    if (!needsRefresh && sensitivityCache) {
      return sensitivityCache;
    }

    if (!cashflowData?.financeMetrics || !scenarioData) {
      return [];
    }

    setLoading(true);

    try {
      const results = calculateSensitivityAnalysis({
        variables: allVariables,
        targetMetric,
        percentileRange,
        aggregationMethod,
        financingData: cashflowData.financeMetrics,
        scenarioData
      });

      // Cache results following established patterns
      const metadata = {
        percentileHash: JSON.stringify(selectedPercentiles),
        targetMetric,
        aggregationMethod,
        variableCount: allVariables.length
      };

      cacheSensitivityResults(results, metadata);
      setLoading(false);
      
      return results;
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
      setLoading(false);
      return [];
    }
  }, [needsRefresh, sensitivityCache, /* other dependencies */]);

  // Subscribe to CashflowContext refresh events
  useEffect(() => {
    // When cashflow data refreshes, sensitivity cache is automatically cleared
    // No additional action needed due to context integration
  }, [cashflowData]);

  // ... rest of component
};
```

### Simplified Data Validation
```javascript
// Minimal validation following established patterns
const validateSensitivityInputs = (variables, financingData, targetMetric) => {
  // Simple checks - CashflowContext init already validates percentiles
  if (!variables.length) {
    return { valid: false, message: 'No sensitivity variables available' };
  }
  
  if (!financingData || !financingData[targetMetric]) {
    return { valid: false, message: `${targetMetric} data not available` };
  }
  
  return { valid: true };
};

// Usage in component
const validation = validateSensitivityInputs(allVariables, cashflowData?.financeMetrics, targetMetric);
if (!validation.valid) {
  return (
    <Alert 
      type="info" 
      message="Sensitivity Analysis Unavailable"
      description={validation.message}
    />
  );
}
```

### Cache Storage Format
Store sensitivity results in CashflowContext with this structure:
```javascript
// sensitivityCache format
{
  targetMetric: 'npv',
  results: [
    {
      variableId: 'electricityPrice',
      variableName: 'Electricity Price',
      category: 'commercial',
      source: 'direct',
      impact: 2100000,
      baseValue: 150000000,
      lowValue: 148500000,
      highValue: 151500000,
      formattedImpact: '$2.1M',
      percentileRange: { lower: 25, upper: 75, base: 50 }
    },
    // ... more results
  ]
}

// sensitivityMetadata format
{
  lastCalculated: '2025-06-24T10:30:00.000Z',
  percentileHash: '{"strategy":"unified","unified":50,...}',
  targetMetric: 'npv',
  aggregationMethod: 'min',
  variableCount: 8,
  calculationTime: 150 // ms
}
```

This approach:
- ✅ Follows established CashflowContext patterns
- ✅ Leverages existing refresh/init workflow  
- ✅ Caches expensive calculations appropriately
- ✅ Minimal validation (relies on CashflowContext validation)
- ✅ Integrates seamlessly with percentile selection system

---

## 9. Integration Requirements

### CashflowContext Integration
```javascript
// Follow established patterns
const { cashflowData, refreshCashflowData, selectedPercentiles } = useCashflow();

// Subscribe to percentile changes
useEffect(() => {
  if (selectedPercentiles) {
    // Recalculate sensitivity analysis
    refreshSensitivityAnalysis();
  }
}, [selectedPercentiles]);

// Respect percentile strategy (unified vs per-source)
const getEffectivePercentile = (variableId) => {
  if (selectedPercentiles.strategy === 'unified') {
    return selectedPercentiles.unified;
  } else {
    return selectedPercentiles.perSource[variableId] || 50;
  }
};
```

### Audit Trail Support
- **Calculation Transparency**: Show how impacts are calculated
- **Aggregation Details**: Explain time-series to single-value conversions
- **Variable Attribution**: Link back to registry sources and simulation results
- **Percentile Traceability**: Show which percentiles were used for each variable

---

## 10. Performance & Optimization

### Computation Strategy
- **Memoized Results**: Cache sensitivity calculations with proper dependency arrays
- **Debounced Updates**: 300ms delay for rapid UI changes (percentile, aggregation)
- **Incremental Refresh**: Only recalculate when target metric, percentiles, or aggregation changes
- **Optimized Aggregation**: Single-pass time-series processing

### Memory Management
- **Registry Caching**: Variable lists computed once and cached
- **Chart Optimization**: Only render selected chart type to reduce memory
- **Data Efficiency**: Minimal data transformation, reuse existing structures

---

## 11. Error Handling & Validation

### Data Validation
```javascript
const validateSensitivityData = (variables, financingData, targetMetric) => {
  if (!variables.length) {
    return { valid: false, error: 'No variables with percentiles found. Enable percentile analysis in scenario settings.' };
  }
  
  if (!financingData[targetMetric]) {
    return { valid: false, error: `No ${targetMetric} data available. Run cash flow analysis first.` };
  }
  
  const hasValidData = variables.some(v => getVariableData(v.path));
  if (!hasValidData) {
    return { valid: false, error: 'No valid variable data found. Check distribution analysis completion.' };
  }
  
  return { valid: true };
};
```

### Error States & Recovery
- **No Variables**: Guide user to enable percentile analysis
- **Missing Metrics**: Explain how to generate financial metrics
- **Invalid Data**: Provide specific troubleshooting steps
- **Calculation Errors**: Graceful degradation with retry options

---

## 12. Wind Industry Standards & Conventions

### Variable Categories
- **Technical**: Wind speed, availability, capacity factor, degradation
- **Commercial**: Electricity prices, contract escalation, market factors
- **Financial**: Cost of capital, debt terms, tax rates
- **Operational**: O&M costs, insurance, major repairs

### Display Conventions
- **Currency**: Project base currency with M/k scaling
- **Percentages**: Two decimal places (8.25%)
- **Ratios**: Two decimal places (1.35x)
- **Years**: One decimal place (7.3 years)
- **Energy**: MWh for production, $/MWh for LCOE

### Impact Magnitude Thresholds
- **High Impact**: >20% of base metric value
- **Medium Impact**: 5-20% of base metric value  
- **Low Impact**: <5% of base metric value

---

## 13. Future V2 Enhancements

### Advanced Statistical Analysis
- **Monte Carlo Variance Decomposition**: True variable attribution with correlations
- **Interaction Effects**: Identify variables that amplify each other's impacts
- **Non-linear Analysis**: Capture asymmetric impacts across percentile ranges
- **Statistical Significance**: Confidence intervals for impact rankings

### Enhanced Visualizations
- **Waterfall Charts**: Cumulative impact breakdown showing variable contributions
- **Scatter Plot Matrix**: Variable correlations and interaction visualization  
- **3D Surface Plots**: Two-variable interaction effects
- **Time-Series Sensitivity**: Year-by-year driver importance evolution

### Advanced Features
- **Scenario Comparison**: Compare driver impacts across different scenarios
- **Optimization Recommendations**: Suggest variable targets for optimal returns
- **Risk-Adjusted Rankings**: Weight impacts by controllability and probability
- **Cross-Panel Communication**: Highlight selected drivers in timeline and financial cards
- **Export Capabilities**: Generate sensitivity analysis reports for stakeholders

---

## 2. Dual Registry System Enhancement

### New Files to Create:
- ☐ `frontend/src/utils/timeSeries/aggregation.js` - Comprehensive time-series aggregation utility
- ☐ `frontend/src/contexts/SensitivityRegistry.js` - SENSITIVITY_SOURCE_REGISTRY definition
- ☐ `frontend/src/components/charts/SensitivityCharts.jsx` - Chart components and registry
- ☐ `frontend/src/components/cards/DriverExplorerCard.jsx` - Complete rebuild of main component
- ☐ `frontend/src/components/cards/components/ControlsRow.jsx` - Sensitivity analysis controls
- ☐ `frontend/src/components/cards/components/InsightsPanel.jsx` - Results summary component

### Files to Modify:
- ☐ `schemas/yup/cashflow.js` - Add SensitivitySourceRegistrySchema using RegistrySourceSchema
- ☐ `frontend/src/utils/finance/sensitivityMetrics.js` - Add LCOE, thresholds, and aggregation metadata
- ☐ `frontend/src/utils/finance/calculations.js` - Add calculateLCOE function
- ☐ `frontend/src/utils/finance/sensitivityAnalysis.js` - Enhanced with dual registry and aggregation
- ☐ `frontend/src/contexts/CashflowContext.jsx` - Add sensitivity caching infrastructure
- ☐ `frontend/src/components/cards/index.js` - Export updated DriverExplorerCard

### Files to Remove/Clean:
🔥 Cleanup Tasks:
- ☐ DEL-1 Remove existing placeholder DriverExplorerCard.jsx implementation and mock functions
- ☐ DEL-2 Clean up unused imports and legacy sensitivity analysis patterns
- ☐ DEL-3 Remove hardcoded variable categories and replace with registry-driven approach
- ☐ DEL-4 Remove any temporary or development-only console.log statements

---

## Implementation Patterns & Code Standards

### Time-Series Aggregation Patterns
```javascript
// Standard usage pattern - always uses DataPointSchema format
import { aggregateTimeSeries } from '../utils/timeSeries/aggregation';

// Risk-based analysis (wind industry standard)
const worstCaseDSCR = aggregateTimeSeries(dscrData, 'min', { filter: 'operational' });
const averageRevenue = aggregateTimeSeries(revenueData, 'operationalMean');

// Present value calculations
const npvCashflow = aggregateTimeSeries(cashflowData, 'npv', { discountRate: 0.08 });

// Statistical analysis (new comprehensive methods)
const volatility = aggregateTimeSeries(priceData, 'std');
const coefficientOfVariation = aggregateTimeSeries(returnData, 'cv');
const dataRange = aggregateTimeSeries(valueData, 'range');

// Wind industry specific
const earlyYearPerformance = aggregateTimeSeries(performanceData, 'earlyYears');
const weightedAverage = aggregateTimeSeries(data, 'weighted', { weights: [0.3, 0.4, 0.3] });
```

### Registry Processing Patterns
```javascript
// Always support both single registry and array of RegistrySourceSchema objects
const discoverVariables = (registries) => {
  const registryArray = Array.isArray(registries) ? registries : [registries];
  
  return registryArray.flatMap(registry => 
    extractVariablesFromSources(registry.technical || [], 'indirect')
      .concat(extractVariablesFromSources(registry.financial || [], 'indirect'))
      .concat(extractVariablesFromSources(registry.multipliers || [], 'direct'))
      .concat(extractVariablesFromSources(registry.costs || [], 'direct'))
      .concat(extractVariablesFromSources(registry.revenues || [], 'direct'))
  );
};

// Usage flexibility
discoverVariables([CASHFLOW_SOURCE_REGISTRY, SENSITIVITY_SOURCE_REGISTRY]); // All variables
discoverVariables(SENSITIVITY_SOURCE_REGISTRY); // Indirect variables only
```

### Threshold Evaluation Patterns
```javascript
// Context-aware thresholds using scenario data
import { evaluateMetricThresholds } from '../utils/finance/sensitivityMetrics';

// Apply thresholds to sensitivity results
const resultsWithThresholds = sensitivityResults.map(result => ({
  ...result,
  thresholdStyle: evaluateMetricThresholds(targetMetric, result.impact, scenarioData),
  baseValueStyle: evaluateMetricThresholds(targetMetric, result.baseValue, scenarioData)
}));

// Use in chart rendering
const getBarColor = (result) => {
  if (result.thresholdStyle?.color) {
    return result.thresholdStyle.color;
  }
  return getDefaultCategoryColor(result.category);
};
```

### CashflowContext Caching Patterns
```javascript
// Follow established patterns from FinanceabilityCard
const DriverExplorerCard = ({ cashflowData, selectedPercentiles }) => {
  const { sensitivityCache, cacheSensitivityResults, refreshCashflowData } = useCashflow();
  
  // Efficient caching with proper dependencies
  const sensitivityResults = useMemo(() => {
    const cacheKey = `${targetMetric}-${JSON.stringify(percentileRange)}-${aggregationMethod}`;
    
    if (sensitivityCache?.[cacheKey] && !needsRefresh) {
      return sensitivityCache[cacheKey];
    }

    const results = calculateSensitivityAnalysis({...params});
    cacheSensitivityResults(cacheKey, results);
    return results;
  }, [targetMetric, percentileRange, aggregationMethod, cashflowData, selectedPercentiles]);

  // Subscribe to refresh events
  useEffect(() => {
    // Cache automatically cleared by CashflowContext refresh
  }, [refreshCashflowData]);
};
```

### Component State Management
```javascript
// Follow established patterns from existing cards
const [targetMetric, setTargetMetric] = useState('npv');
const [chartType, setChartType] = useState(() => getDefaultChartType('npv'));
const [loading, setLoading] = useState(false);

// Intelligent defaults with proper memoization
const defaultAggregationMethod = useMemo(() => {
  const metricConfig = SUPPORTED_METRICS[targetMetric];
  return metricConfig?.aggregation === 'value' ? 'value' : 'min';
}, [targetMetric]);

// Debounce rapid changes
const debouncedUpdate = useCallback(
  debounce((newParams) => {
    setLoading(true);
    // Update parameters
    setLoading(false);
  }, 300),
  []
);
```

### Error Handling Standards
```javascript
// Comprehensive validation with helpful messages
const validation = validateSensitivityInputs(variables, financingData, targetMetric);
if (!validation.valid) {
  return (
    <Alert
      type="info"
      message="Sensitivity Analysis Unavailable"
      description={validation.message}
      action={
        validation.actionLabel && (
          <Button size="small" onClick={validation.actionHandler}>
            {validation.actionLabel}
          </Button>
        )
      }
    />
  );
}

// Graceful degradation for calculation errors
try {
  const results = calculateSensitivityAnalysis(params);
  return results;
} catch (error) {
  console.error('Sensitivity calculation failed:', error);
  return [];
}
```

### Chart Component Integration
```javascript
// Consistent chart component interface with threshold support
const TornadoChart = ({ data, targetMetric, onVariableSelect, scenarioData }) => {
  // Apply thresholds to chart data
  const chartData = data.map(result => ({
    ...result,
    barColor: getThresholdColor(result.impact, targetMetric, scenarioData),
    textColor: getContrastColor(result.barColor)
  }));

  return (
    <Plot
      data={prepareTornadoData(chartData)}
      layout={getTornadoLayout(targetMetric)}
      config={{ responsive: true }}
      onClick={onVariableSelect}
    />
  );
};
```

---

## Quality Gates & Acceptance Criteria

### Functional Requirements
- ✅ **Time-Series Aggregation**: Accurate aggregation with comprehensive methods (mean, min, max, std, cv, range, etc.)
- ✅ **Dual Registry Discovery**: Successfully extract variables from both CASHFLOW_SOURCE_REGISTRY and SENSITIVITY_SOURCE_REGISTRY
- ✅ **Threshold Evaluation**: Context-aware thresholds using scenario data with proper color coding
- ✅ **Sensitivity Calculation**: Accurate one-at-a-time analysis with proper impact ranking
- ✅ **Chart Visualization**: Clear tornado chart with threshold-based formatting
- ✅ **CashflowContext Integration**: Proper caching and refresh patterns following established workflows

### Performance Requirements
- ✅ **Initial Load**: < 2 seconds for typical variable sets (10-15 variables)
- ✅ **Interaction Response**: < 300ms for metric/aggregation changes
- ✅ **Memory Usage**: Efficient caching without memory leaks
- ✅ **Chart Rendering**: Smooth interactions with large variable sets (20+ variables)

### User Experience Requirements
- ✅ **Clarity**: Business stakeholders can understand impact rankings and thresholds
- ✅ **Interactivity**: Rich hover information with proper units and context
- ✅ **Responsiveness**: Works well on different screen sizes
- ✅ **Integration**: Seamless integration with existing Cash Flow workspace

### Technical Requirements
- ✅ **Code Quality**: Follows established patterns from FinanceabilityCard and CashflowTimelineCard
- ✅ **Reusability**: Time-series aggregation utility usable throughout application
- ✅ **Maintainability**: Registry-driven approach makes adding variables straightforward
- ✅ **Testing**: Comprehensive unit tests for core calculations and edge cases

This updated PRD now addresses all your requirements: enhanced time-series aggregation with comprehensive methods, proper schema approach using RegistrySourceSchema, threshold implementation following existing patterns, simplified validation, and proper CashflowContext integration with caching. ☐ CCI-3 Implement getEffectivePercentile function respecting unified vs per-source strategies
- ☐ CCI-4 Add proper loading states following FinanceabilityCard and CashflowTimelineCard patterns
- ☐ CCI-5 Cache sensitivity results with proper dependency management and memoization
- ☐ CCI-6 Add audit trail support for sensitivity calculations and aggregation methods

## 9. Performance & Optimization 🚀 🏷️Medium
- ☐ PO-1 Implement memoized sensitivity calculations with proper dependency arrays
- ☐ PO-2 Add debounced updates (300ms) for rapid UI changes (percentile, chart type, aggregation)
- ☐ PO-3 Optimize registry variable discovery with caching and single-pass processing
- ☐ PO-4 Add loading states and skeleton screens for better UX during calculations
- ☐ PO-5 Implement incremental refresh - only recalculate when inputs actually change
- ☐ PO-6 Optimize chart rendering with lazy loading and conditional rendering

## 10. Error Handling & Validation 🔧 🏷️Medium
- ☐ EHV-1 Implement validateSensitivityData function with comprehensive data validation
- ☐ EHV-2 Add graceful degradation for missing or invalid variable data
- ☐ EHV-3 Create helpful error messages with specific troubleshooting guidance
- ☐ EHV-4 Handle boundary conditions (zero variance, single variables, missing percentiles)
- ☐ EHV-5 Add error recovery options and retry mechanisms
- ☐ EHV-6 Create error boundaries following established card component patterns

## 11. Testing & Quality Assurance 🧪 🏷️Low
- ☐ TQA-1 Add unit tests for aggregateTimeSeries function with all methods and edge cases
- ☐ TQA-2 Test calculateSensitivityAnalysis with various registry configurations
- ☐ TQA-3 Validate chart interactions and proper data flow between components
- ☐ TQA-4 Test with missing data scenarios and error conditions
- ☐ TQA-5 Add regression tests for impact ranking consistency and aggregation accuracy
- ☐ TQA-6 Performance testing with large variable sets (20+ variables)

## 12. Documentation & Examples 📚 🏷️Low
- ☐ DOC-1 Create comprehensive usage documentation for time-series aggregation utility
- ☐ DOC-2 Document dual registry system with examples and best practices
- ☐ DOC-3 Add sensitivity analysis methodology explanation for business stakeholders
- ☐ DOC-4 Create troubleshooting guide for common configuration issues
- ☐ DOC-5 Document chart type selection guidelines and when to use each visualization
- ☐ DOC-6 Add wind industry context and interpretation guide for sensitivity results

---

## Files to Create/Modify

### New Files to Create:
- ☐ `frontend/src/utils/timeSeries/aggregation.js` - Reusable time-series aggregation utility
- ☐ `frontend/src/contexts/SensitivityRegistry.js` - SENSITIVITY_SOURCE_REGISTRY definition
- ☐ `frontend/src/components/charts/SensitivityCharts.jsx` - Chart components and registry
- ☐ `frontend/src/components/cards/DriverExplorerCard.jsx` - Complete rebuild of main component
- ☐ `frontend/src/components/cards/components/ControlsRow.jsx` - Sensitivity analysis controls
- ☐ `frontend/src/components/cards/components/InsightsPanel.jsx` - Results summary component

### Files to Modify:
- ☐ `schemas/yup/cashflow.js` - Enhance CashflowSourceRegistrySchema with technical/financial sections
- ☐ `frontend/src/utils/finance/sensitivityMetrics.js` - Add LCOE and aggregation metadata to SUPPORTED_METRICS
- ☐ `frontend/src/utils/finance/calculations.js` - Add calculateLCOE function
- ☐ `frontend/src/utils/finance/sensitivityAnalysis.js` - Enhanced with dual registry and aggregation support
- ☐ `frontend/src/components/cards/index.js` - Export updated DriverExplorerCard

### Files to Remove/Clean:
🔥 Cleanup Tasks:
- ☐ DEL-1 Remove existing placeholder DriverExplorerCard.jsx implementation and mock functions
- ☐ DEL-2 Clean up unused imports and legacy sensitivity analysis patterns
- ☐ DEL-3 Remove hardcoded variable categories and replace with registry-driven approach
- ☐ DEL-4 Remove any temporary or development-only console.log statements

---

## Implementation Patterns & Code Standards

### Time-Series Aggregation Patterns
```javascript
// Standard usage pattern
import { aggregateTimeSeries } from '../utils/timeSeries/aggregation';

// Risk-based analysis (wind industry standard)
const worstCaseDSCR = aggregateTimeSeries(dscrData, 'min', { filter: 'operational' });
const averageRevenue = aggregateTimeSeries(revenueData, 'mean', { filter: 'operational' });

// Present value calculations
const npvCashflow = aggregateTimeSeries(cashflowData, 'npv', { discountRate: 0.08 });

// Statistical analysis
const volatility = aggregateTimeSeries(priceData, 'std');
const riskRange = aggregateTimeSeries(returnData, 'range');
```

### Registry Discovery Patterns
```javascript
// Always support both single registry and array
const discoverVariables = (registries) => {
  const registryArray = Array.isArray(registries) ? registries : [registries];
  // Process all registries with same logic
};

// Usage flexibility
discoverVariables(CASHFLOW_SOURCE_REGISTRY); // Direct variables only
discoverVariables([CASHFLOW_SOURCE_REGISTRY, SENSITIVITY_SOURCE_REGISTRY]); // All variables
```

### Component State Management
```javascript
// Follow established patterns from FinanceabilityCard
const [targetMetric, setTargetMetric] = useState('npv');
const [loading, setLoading] = useState(false);

// Memoize expensive calculations
const sensitivityResults = useMemo(() => {
  return calculateSensitivityAnalysis({...params});
}, [variables, targetMetric, percentileRange, financingData]);

// Debounce rapid changes
const debouncedUpdate = useCallback(
  debounce((newParams) => {
    setSensitivityParams(newParams);
  }, 300),
  []
);
```

### Error Handling Standards
```javascript
// Comprehensive validation with helpful messages
const validation = validateSensitivityData(variables, financingData, targetMetric);
if (!validation.valid) {
  return (
    <Alert
      type="warning"
      message="Sensitivity Analysis Unavailable"
      description={validation.error}
      action={validation.action && <Button onClick={validation.action.handler}>{validation.action.label}</Button>}
    />
  );
}
```

### Chart Component Integration
```javascript
// Consistent chart component interface
const ChartComponent = SENSITIVITY_CHART_TYPES[chartType].component;

<ChartComponent
  data={sensitivityResults}
  targetMetric={targetMetric}
  onVariableSelect={handleVariableSelect}
  themeColors={chartTheme}
  loading={loading}
/>
```

### Audit Trail Integration
```javascript
// Follow AuditTrailViewer patterns from existing cards
const auditData = {
  calculation: 'Sensitivity Analysis',
  method: 'One-at-a-time',
  targetMetric: SUPPORTED_METRICS[targetMetric].label,
  percentileRange: `P${percentileRange.lower}-P${percentileRange.upper}`,
  aggregationMethod: aggregationMethod,
  variableCount: variables.length,
  lastUpdated: new Date().toISOString()
};

<AuditTrailViewer data={auditData} />
```

---

## Quality Gates & Acceptance Criteria

### Functional Requirements
- ✅ **Variable Discovery**: Successfully extract variables from both registries
- ✅ **Sensitivity Calculation**: Accurate one-at-a-time analysis with proper impact ranking
- ✅ **Chart Visualization**: Clear tornado chart with proper formatting and hover details
- ✅ **Percentile Integration**: Respect CashflowContext percentile selection strategies
- ✅ **Time-Series Aggregation**: Proper handling of multi-year financial metrics
- ✅ **Error Handling**: Graceful degradation with helpful error messages

### Performance Requirements
- ✅ **Initial Load**: < 2 seconds for typical variable sets (10-15 variables)
- ✅ **Interaction Response**: < 300ms for percentile/aggregation changes
- ✅ **Memory Usage**: Efficient caching without memory leaks
- ✅ **Chart Rendering**: Smooth interactions with large variable sets (20+ variables)

### User Experience Requirements
- ✅ **Clarity**: Business stakeholders can understand impact rankings without technical knowledge
- ✅ **Interactivity**: Rich hover information with proper units and formatting
- ✅ **Responsiveness**: Works well on different screen sizes
- ✅ **Integration**: Seamless integration with existing Cash Flow workspace

### Technical Requirements
- ✅ **Code Quality**: Follows established patterns from FinanceabilityCard and CashflowTimelineCard
- ✅ **Reusability**: Time-series aggregation utility can be used throughout application
- ✅ **Maintainability**: Registry-driven approach makes adding new variables straightforward
- ✅ **Testing**: Comprehensive unit tests for core calculations and edge cases

---

## Success Metrics

### Business Impact
- **Decision Support**: Stakeholders can identify top 3-5 value drivers affecting project returns
- **Risk Management**: Clear visibility into which variables create highest financial risk
- **Optimization Focus**: Actionable insights for improving project performance

### Technical Success
- **Performance**: Sub-second response times for interactive changes
- **Reliability**: Zero crashes or data loss during normal operation
- **Extensibility**: New variables can be added through registry configuration only

### User Adoption
- **Ease of Use**: Non-technical users can interpret results without training
- **Actionability**: Results directly inform contract negotiations and design decisions
- **Integration**: Natural workflow integration with existing cash flow analysis

This PRD provides comprehensive guidance for implementing a production-ready Driver Explorer Card that addresses all technical requirements while maintaining clean separation of concerns and following established application patterns.