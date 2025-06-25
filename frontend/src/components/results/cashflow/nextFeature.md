# Driver Explorer Card - Product Requirements Document
Version: v2.2 | Date: 2025-06-25 | Author: Development Team

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
Remains focused on direct cash flow generation using `CashflowSourceRegistrySchema`:
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
Contains indirect variables for sensitivity analysis using `CashflowSourceRegistrySchema`:
```javascript
SENSITIVITY_SOURCE_REGISTRY = {
  data: { /* Same global data structure */ },
  
  technical: [
    {
      id: 'availability',
      path: ['simulation', 'inputSim', 'distributionAnalysis', 'availability'],
      category: 'technical',
      hasPercentiles: true,
      description: 'Wind turbine availability factor'
    }
  ],
  
  financial: [
    {
      id: 'costOfEquity',
      path: ['settings', 'modules', 'financing', 'costOfEquity'],
      category: 'financing',
      hasPercentiles: false,
      description: 'Required return rate for equity investors'
    }
  ]
}
```

### SENSITIVITY_SOURCE_REGISTRY Variable Definitions

| Variable ID | Category | Path | Has Percentiles | Dependencies | Description |
|------------|----------|------|----------------|--------------|-------------|
| `availability` | technical | `['simulation', 'inputSim', 'distributionAnalysis', 'availability']` | Yes | Distribution Analysis | Wind turbine availability factor |
| `windVariability` | technical | `['simulation', 'inputSim', 'distributionAnalysis', 'windVariability']` | Yes | Distribution Analysis | Wind resource variability affecting energy production |
| `capacityFactor` | technical | `['settings', 'project', 'windFarm', 'capacityFactor']` | No | Project Settings | Net capacity factor of wind farm |
| `degradationRate` | technical | `['settings', 'project', 'windFarm', 'degradationRate']` | No | Project Settings | Annual performance degradation rate |
| `costOfEquity` | financing | `['settings', 'modules', 'financing', 'costOfEquity']` | No | Financing Module | Required return rate for equity investors |
| `debtRatio` | financing | `['settings', 'modules', 'financing', 'debtRatio']` | No | Financing Module | Debt to total capital ratio |
| `interestRate` | financing | `['settings', 'modules', 'financing', 'interestRate']` | No | Financing Module | Debt interest rate |
| `taxRate` | financing | `['settings', 'modules', 'financing', 'taxRate']` | No | Financing Module | Corporate tax rate |
| `insuranceCost` | operational | `['settings', 'project', 'costs', 'insurance']` | No | Project Settings | Annual insurance cost |
| `landLeaseCost` | operational | `['settings', 'project', 'costs', 'landLease']` | No | Project Settings | Annual land lease payments |

### Variable Discovery Implementation
```javascript
const discoverAllSensitivityVariables = (registries) => {
  const registryArray = Array.isArray(registries) ? registries : [registries];
  const variables = [];
  
  registryArray.forEach(registry => {
    ['multipliers', 'costs', 'revenues', 'technical', 'financial'].forEach(section => {
      if (registry[section]) {
        registry[section].forEach(source => {
          if (source.hasPercentiles) {
            variables.push({
              id: source.id,
              label: source.description,
              category: source.category,
              path: source.path,
              source: registry === CASHFLOW_SOURCE_REGISTRY ? 'direct' : 'indirect'
            });
          }
        });
      }
    });
  });
  
  return variables;
};
```

---

## 4. Time-Series Aggregation Strategy

### The Challenge
Financial metrics are provided as time-series spanning project lifetime (20+ years). Sensitivity analysis needs single values for impact comparison.

### Reusable Aggregation Function
Create `frontend/src/utils/timeSeries/aggregation.js`:

```javascript
export const aggregateTimeSeries = (data, method, options = {}) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  const {
    filter = 'all',           // 'all', 'operational', 'construction', 'early', 'late'
    discountRate = 0,         // For NPV calculations
    precision = 2,            // Decimal places
    weights = null            // Custom weights array
  } = options;

  // Apply filters
  let filteredData = data;
  switch (filter) {
    case 'operational': filteredData = data.filter(d => d.year > 0); break;
    case 'construction': filteredData = data.filter(d => d.year <= 0); break;
    case 'early': filteredData = data.filter(d => d.year > 0 && d.year <= 5); break;
    case 'late': filteredData = data.filter(d => d.year > 15); break;
  }

  const values = filteredData.map(d => d.value).filter(v => typeof v === 'number');
  if (values.length === 0) return null;

  let result;
  switch (method) {
    case 'mean': result = values.reduce((sum, val) => sum + val, 0) / values.length; break;
    case 'min': result = Math.min(...values); break;
    case 'max': result = Math.max(...values); break;
    case 'sum': result = values.reduce((sum, val) => sum + val, 0); break;
    case 'npv':
      result = filteredData.reduce((npv, d) => {
        const discountFactor = Math.pow(1 + discountRate, -d.year);
        return npv + (d.value * discountFactor);
      }, 0);
      break;
    default: throw new Error(`Unsupported aggregation method: ${method}`);
  }

  return precision > 0 ? Number(result.toFixed(precision)) : Math.round(result);
};
```

### Supported Aggregation Methods

| Method | Description | Use Case | Options Required |
|--------|-------------|----------|------------------|
| `mean` | Average value across time series | General trend analysis | `filter` |
| `min` | Minimum value in time series | Risk analysis (worst case) | `filter` |
| `max` | Maximum value in time series | Opportunity analysis (best case) | `filter` |
| `sum` | Total sum across time series | Cumulative impact analysis | `filter` |
| `npv` | Net present value calculation | Present value analysis | `discountRate`, `filter` |
| `std` | Standard deviation | Volatility analysis | `filter` |
| `cv` | Coefficient of variation | Risk-adjusted analysis | `filter` |
| `range` | Max - Min | Risk range analysis | `filter` |
| `p10` | 10th percentile | Conservative analysis | `filter` |
| `p90` | 90th percentile | Optimistic analysis | `filter` |
| `weighted` | Weighted average | Custom weighting | `weights`, `filter` |
| `earlyYears` | Average of years 1-5 | Early performance | None (built-in filter) |
| `operationalMean` | Average of operational years | Operational performance | None (built-in filter) |

### Wind Industry Aggregation Strategies

| Metric | Aggregation Method | Rationale |
|--------|-------------------|-----------|
| NPV, IRR | Use final value | Already lifetime aggregated metrics |
| DSCR, ICR | `min` with `operational` filter | Lenders care about worst-case covenant compliance |
| LCOE | `mean` with lifecycle weighting | Standard levelized cost methodology |
| Cash Flow | `sum` for lifetime totals | Cumulative impact analysis |

---

## 5. Enhanced Metrics Support

### SUPPORTED_METRICS Configuration

| Metric Key | Label | Format | Path | Aggregation | Aggregation Options | Threshold References |
|------------|-------|---------|------|-------------|-------------------|-------------------|
| `npv` | NPV | currency | `['npv']` | value | None | `['settings', 'returnTargets', 'minNPV']` |
| `irr` | Project IRR | percentage | `['irr']` | value | None | `['settings', 'returnTargets', 'minIRR']` |
| `equityIRR` | Equity IRR | percentage | `['equityIRR']` | value | None | `['settings', 'returnTargets', 'minEquityIRR']` |
| `minDSCR` | Minimum DSCR | ratio | `['dscr']` | min | `{ filter: 'operational' }` | `['settings', 'modules', 'financing', 'dscr', 'covenant']` |
| `avgDSCR` | Average DSCR | ratio | `['dscr']` | mean | `{ filter: 'operational' }` | `['settings', 'modules', 'financing', 'dscr', 'target']` |
| `llcr` | LLCR | ratio | `['llcr']` | value | None | `['settings', 'modules', 'financing', 'llcr', 'target']` |
| `paybackPeriod` | Payback Period | years | `['paybackPeriod']` | value | None | `['settings', 'returnTargets', 'maxPayback']` |
| `lcoe` | LCOE | currency | `['lcoe']` | value | None | `['settings', 'returnTargets', 'maxLCOE']` |
| `totalCashflow` | Total Cash Flow | currency | `['cashflow']` | sum | `{ filter: 'operational' }` | None |
| `breakEvenYear` | Break Even Year | years | `['breakEvenYear']` | value | None | `['settings', 'returnTargets', 'maxBreakEven']` |

```javascript
export const SUPPORTED_METRICS = {
  npv: { 
    label: 'NPV',
    format: 'currency',
    path: ['npv'],
    aggregation: 'value',
    units: '$',
    description: 'Net Present Value of project cash flows',
    impactFormat: (value) => `$${(value / 1000000).toFixed(1)}M`,
    thresholds: [
      {
        path: ['settings', 'returnTargets', 'minNPV'],
        comparison: 'below',
        transform: (value) => value * 1000000,
        colorRule: (value, threshold) => value < threshold ? 
          { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
        priority: 4,
        description: 'NPV below minimum target'
      }
    ]
  },
  
  minDSCR: { 
    label: 'Minimum DSCR',
    format: 'ratio',
    path: ['dscr'],
    aggregation: 'min',
    aggregationOptions: { filter: 'operational' },
    units: 'x',
    description: 'Lowest Debt Service Coverage Ratio during operations',
    impactFormat: (value) => `${value.toFixed(2)}x`,
    thresholds: [
      {
        path: ['settings', 'modules', 'financing', 'dscr', 'covenant'],
        comparison: 'below',
        colorRule: (value, threshold) => value < threshold ?
          { color: getFinancialColorScheme('covenant'), fontWeight: 600 } : null,
        priority: 6,
        description: 'DSCR breaches debt covenant'
      }
    ]
  }
};
```

---

## 6. Theming Integration & Color Strategy

### Core Theming Principles
1. **UI Components**: Use Ant Design for buttons, selects, cards, alerts, etc.
2. **Charts & Tables**: Use our theming functions (`getFinancialColorScheme`, `getSemanticColor`, `generateChartColorPalette`)
3. **MetricsTables & InlineEditTables**: Use custom theming when these components are required for data display
4. **Metrics**: Define thresholds with `colorRule` functions that call theming utilities
5. **No Static Colors**: Don't embed colors in SUPPORTED_METRICS - use dynamic theming

### Chart Color Strategy
```javascript
// Use generateChartColorPalette() for many variables, categories for few
const getChartColor = (result, index, totalCount, highlightedId) => {
  if (result.variableId === highlightedId) {
    return getSemanticColor('primary', 7);
  }
  
  if (totalCount > 8) {
    return generateChartColorPalette(totalCount)[index];
  }
  
  return getCategoryColor(result.category); // Useful wrapper
};

// Category color mapping - USEFUL WRAPPER (encapsulates logic)
const getCategoryColor = (category) => {
  switch (category) {
    case 'revenue':
    case 'commercial':
      return getFinancialColorScheme('revenue');
    case 'costs':
    case 'operational': 
      return getFinancialColorScheme('costs');
    case 'financing':
      return getFinancialColorScheme('debtService');
    case 'technical':
      return getSemanticColor('info', 6);
    default:
      return getSemanticColor('neutral', 6);
  }
};
```

### Wrapper Function Guidelines

#### ✅ USEFUL Wrappers (Keep These):
- `getCategoryColor()` - Encapsulates complex category-to-color mapping
- `evaluateMetricThresholds()` - Handles complex threshold evaluation with context
- `formatCategoryLabel()` - Meaningful data transformation

#### ❌ USELESS Wrappers (Avoid These):
- Simple pass-through functions that just call existing utilities
- Functions that only access simple properties
- Wrappers that don't add any logic or transformation

---

## 7. Multi-Chart Support Architecture

### Chart Type Registry
```javascript
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
```

---

## 8. User Interface Design

### Responsive Layout
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
3. **Percentile Range Selector**: Start with available percentile range (P10-P90), respect CashflowContext baseline (unified vs per-source)
4. **Aggregation Method**: Min/Max/Mean for time-series metrics
5. **Enhanced Hover**: Detailed impact info with variable ranges and units
6. **Category Filtering**: Show/hide Technical, Financial, Commercial variables

---

## 9. CashflowContext Integration & Data Storage

### Follow Established Refresh Patterns
The Driver Explorer Card integrates with CashflowContext following the established patterns from FinanceabilityCard and CashflowTimelineCard:

```javascript
const DriverExplorerCard = () => {
  const { 
    cashflowData, 
    sensitivityData, 
    loading,
    error,
    refreshCashflowData 
  } = useCashflow();
  
  // Use existing data without change detection - react to refresh/init like other cards
  const sensitivityResults = useMemo(() => {
    if (!sensitivityData || !cashflowData?.financeMetrics) {
      return [];
    }

    return calculateSensitivityAnalysis({
      variables: allVariables,
      targetMetric,
      percentileRange,
      aggregationMethod,
      sensitivityData, // Pre-computed in CashflowContext
      financingData: cashflowData.financeMetrics
    });
  }, [sensitivityData, cashflowData, targetMetric, percentileRange, aggregationMethod]);
};
```

### CashflowContext Enhancement
Add sensitivity computation to existing refresh workflow:

```javascript
// In CashflowContext - add to existing refresh chain
const refreshCashflowData = useCallback(async (force = false) => {
  // ... existing refresh logic for cash flow data
  
  // Add sensitivity analysis computation after cash flow data is ready
  if (cashflowData && scenarioData) {
    const sensitivityResults = await computeSensitivityAnalysis({
      variables: discoveredVariables,
      scenarioData,
      cashflowData
    });
    
    setSensitivityData(sensitivityResults);
  }
}, [/* existing dependencies */]);
```

### Data Storage in CashflowContext
Store computed sensitivity data alongside existing cash flow data:

```javascript
const [sensitivityData, setSensitivityData] = useState(null);

const value = {
  // ... existing context values
  sensitivityData,
  setSensitivityData
};
```

---

## 10. Performance & Optimization

### Computation Strategy
- **Pre-computed in CashflowContext**: Sensitivity analysis computed during CashflowContext refresh/init cycle
- **Stored with Cash Flow Data**: Sensitivity results stored alongside existing cash flow data in context
- **Card-Level Filtering**: DriverExplorerCard applies metric selection, aggregation, and visualization without recomputing
- **Refresh Integration**: Follows same pattern as FinanceabilityCard and CashflowTimelineCard - no change detection needed

### Memory Management
- **Context Storage**: Sensitivity data stored in CashflowContext alongside other computed results
- **Registry Caching**: Variable lists computed once and cached during registry initialization
- **Chart Optimization**: Only render selected chart type to reduce memory
- **Data Efficiency**: Minimal data transformation at card level, reuse pre-computed results

---

## 11. Error Handling & Validation

### Data Validation
```javascript
const validateSensitivityData = (sensitivityData, targetMetric) => {
  if (!sensitivityData) {
    return { valid: false, error: 'Sensitivity analysis not available. Ensure cash flow analysis is complete.' };
  }
  
  if (!sensitivityData.variables?.length) {
    return { valid: false, error: 'No sensitivity variables found.' };
  }
  
  if (!sensitivityData.results?.[targetMetric]) {
    return { valid: false, error: `No sensitivity results available for ${targetMetric}.` };
  }
  
  return { valid: true };
};
```

### Error States & Recovery
- **No Sensitivity Data**: Show loading state or guide user to refresh cash flow analysis
- **Missing Target Metric**: Default to available metric or show metric selection
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

### Threshold-Based Impact Classification
Impact significance determined by threshold system referencing Return Targets:
- **Below Target**: Red coloring using `getFinancialColorScheme('poor')`
- **At Target**: Neutral coloring using standard metric colors
- **Above Target**: Green coloring using `getFinancialColorScheme('excellent')`
- **Covenant Breach**: Special highlighting using `getFinancialColorScheme('covenant')`

---

## 13. Quality Gates & Acceptance Criteria

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

## Implementation Task List

**Legend:** ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

### 1. Core Infrastructure 🏗️ 🏷️Critical
- ☐ CI-1 Create `frontend/src/utils/timeSeries/aggregation.js` with comprehensive aggregation methods
- ☐ CI-2 Create `frontend/src/contexts/SensitivityRegistry.js` with SENSITIVITY_SOURCE_REGISTRY
- ☐ CI-3 Enhance `schemas/yup/cashflow.js` to support technical/financial sections in registry schema
- ☐ CI-4 Implement `discoverAllSensitivityVariables()` function supporting dual registry discovery
- ☐ CI-5 Create reusable aggregation strategies for wind industry metrics (DSCR min, NPV sum, etc.)

### 2. Metrics & Theming Configuration 🎨 🏷️Critical
- ☐ MTC-1 Update `SUPPORTED_METRICS` with `impactFormat` and comprehensive `thresholds`
- ☐ MTC-2 Implement threshold `colorRule` functions using direct theming calls (`getFinancialColorScheme`)
- ☐ MTC-3 Add LCOE calculation function to `frontend/src/utils/finance/calculations.js`
- ☐ MTC-4 Create `getCategoryColor()` wrapper function for category-to-color mapping
- ☐ MTC-5 Implement smart chart coloring: `generateChartColorPalette()` for >8 variables, categories for ≤8

### 3. Sensitivity Analysis Engine 🧮 🏷️Critical
- ☐ SAE-1 Enhance `frontend/src/utils/finance/sensitivityAnalysis.js` with dual registry support
- ☐ SAE-2 Implement one-at-a-time sensitivity analysis using percentile-based approach
- ☐ SAE-3 Add time-series aggregation integration for multi-year financial metrics
- ☐ SAE-4 Create threshold evaluation system with Return Targets integration
- ☐ SAE-5 Add comprehensive error handling and data validation for edge cases

### 4. Chart Components & Visualization 📊 🏷️Critical
- ☐ CCV-1 Create `frontend/src/components/charts/SensitivityCharts.jsx` with chart type registry
- ☐ CCV-2 Implement `prepareTornadoChartData()` with smart coloring and enhanced hover templates
- ☐ CCV-3 Add chart interaction handlers for variable highlighting and selection
- ☐ CCV-4 Create heatmap chart component for time-series sensitivity analysis
- ☐ CCV-5 Implement responsive chart sizing and mobile-friendly interactions

### 5. Driver Explorer Card Component 🎯 🏷️Critical
- ☐ DEC-1 Build main `frontend/src/components/cards/DriverExplorerCard.jsx` component
- ☐ DEC-2 Create controls row with metric selector, percentile range, and aggregation method
- ☐ DEC-3 Implement chart type switching with intelligent defaults based on metric type
- ☐ DEC-4 Add insights panel with analysis summary and key findings
- ☐ DEC-5 Integrate with CashflowContext for data access following established patterns

### 6. CashflowContext Integration 🔄 🏷️Critical
- ☐ CCI-1 Add sensitivity data computation to CashflowContext refresh workflow
- ☐ CCI-2 Store `sensitivityData` alongside existing cash flow data in context state
- ☐ CCI-3 Follow FinanceabilityCard and CashflowTimelineCard patterns for data access
- ☐ CCI-4 Integrate sensitivity computation into existing refresh chain (no separate caching)
- ☐ CCI-5 Ensure sensitivity data refreshes when cash flow data refreshes

### 7. Supporting Components 🧩 🏷️High
- ☐ SC-1 Create `frontend/src/components/cards/components/ControlsRow.jsx` for sensitivity controls
- ☐ SC-2 Build `frontend/src/components/cards/components/InsightsPanel.jsx` for analysis summary
- ☐ SC-3 Add `SensitivityRangeSelector` with available percentile range (no presets, respect CashflowContext baseline)
- ☐ SC-4 Create variable category filtering component with checkbox groups
- ☐ SC-5 Implement variable search and sorting functionality

### 8. Performance & Optimization 🚀 🏷️Medium
- ☐ PO-1 Implement sensitivity data pre-computation in CashflowContext refresh cycle
- ☐ PO-2 Add memoization for card-level metric selection and aggregation
- ☐ PO-3 Optimize registry variable discovery with initialization caching
- ☐ PO-4 Add loading states that align with CashflowContext loading patterns
- ☐ PO-5 Ensure efficient data flow from context to card without redundant computation

### 9. Error Handling & Validation 🔧 🏷️Medium
- ☐ EHV-1 Implement focused `validateSensitivityData()` for computed sensitivity results
- ☐ EHV-2 Add graceful degradation when sensitivity data is not available
- ☐ EHV-3 Create helpful error messages aligned with CashflowContext error patterns
- ☐ EHV-4 Handle missing target metrics with automatic fallback selection
- ☐ EHV-5 Add retry mechanisms that integrate with CashflowContext refresh

### 10. Testing & Quality Assurance 🧪 🏷️Low
- ☐ TQA-1 Add comprehensive unit tests for `aggregateTimeSeries()` function with all supported methods
- ☐ TQA-2 Test sensitivity analysis calculations with various registry configurations
- ☐ TQA-3 Validate chart interactions and data flow between components
- ☐ TQA-4 Test CashflowContext integration and refresh patterns
- ☐ TQA-5 Performance testing with large variable sets (20+ variables)

### 11. Cleanup & Documentation 🔥 🏷️Low
- ☐ CLD-1 Remove existing placeholder DriverExplorerCard implementation
- ☐ CLD-2 Clean up unused imports and legacy sensitivity analysis patterns
- ☐ CLD-3 Update component exports in `frontend/src/components/cards/index.js`
- ☐ CLD-4 Create usage documentation for time-series aggregation utility
- ☐ CLD-5 Document sensitivity analysis methodology and Return Targets integration

---

## Files to Create/Modify

### New Files:
- `frontend/src/utils/timeSeries/aggregation.js` - Reusable time-series aggregation utility
- `frontend/src/contexts/SensitivityRegistry.js` - SENSITIVITY_SOURCE_REGISTRY definition
- `frontend/src/components/charts/SensitivityCharts.jsx` - Chart components and registry
- `frontend/src/components/cards/DriverExplorerCard.jsx` - Main component (complete rebuild)
- `frontend/src/components/cards/components/ControlsRow.jsx` - Sensitivity analysis controls
- `frontend/src/components/cards/components/InsightsPanel.jsx` - Results summary component

### Files to Modify:
- `schemas/yup/cashflow.js` - Enhance schema with technical/financial sections
- `frontend/src/utils/finance/sensitivityMetrics.js` - Add LCOE and enhanced SUPPORTED_METRICS
- `frontend/src/utils/finance/calculations.js` - Add calculateLCOE function
- `frontend/src/utils/finance/sensitivityAnalysis.js` - Enhanced with dual registry support
- `frontend/src/contexts/CashflowContext.jsx` - Add sensitivity data computation to refresh workflow
- `frontend/src/components/cards/index.js` - Export updated DriverExplorerCard

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