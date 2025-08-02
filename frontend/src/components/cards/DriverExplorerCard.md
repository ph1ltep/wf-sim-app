# Driver Explorer Card - Product Requirements Document
Version: v2.3 | Date: 2025-06-25 | Author: Development Team

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

**Critical Data Flow**:
1. **Percentile Selection**: Uses unified percentile picker from CashflowContext (not separate percentile handling)
2. **Multiplier Application**: Apply escalation/multipliers to time-series FIRST
3. **Aggregation**: Aggregate the multiplier-adjusted time-series to get final metric values
4. **Impact Calculation**: Compare aggregated values to determine sensitivity impact

**Why this approach**:
- ✅ Uses existing percentile-based simulation results
- ✅ Simple to understand and explain to stakeholders
- ✅ Fast computation using existing data infrastructure
- ✅ Clear attribution to individual variables
- ✅ Aligns with existing CashflowContext percentile selection system
- ✅ Leverages existing multiplier system for time-series escalation

---

## 3. Dual Registry Architecture & Data Relationships

### Problem Statement
We need to analyze both **direct** and **indirect** variables affecting financial metrics:

- **Direct Variables**: Already in `CASHFLOW_SOURCE_REGISTRY` - create cash flows directly (energy price, contract fees, operational costs)
- **Indirect Variables**: Need `SENSITIVITY_SOURCE_REGISTRY` - affect calculations indirectly (availability → energy production → revenue)

### CASHFLOW_SOURCE_REGISTRY Integration
The Driver Explorer leverages existing `CASHFLOW_SOURCE_REGISTRY` entries as the primary source of sensitivity variables:

```javascript
// Example: Direct variable already in CASHFLOW_SOURCE_REGISTRY
{
    id: 'energyPrice',
    description: 'Electricity Price',
    category: 'revenue',
    hasPercentiles: true,
    path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyPrice'],
    multipliers: [
        {
            id: 'price_escalation',
            operation: 'compound',
            path: ['settings', 'modules', 'revenue', 'priceEscalation']
        }
    ]
}
```

**Data Flow for Direct Variables**:
1. Get time-series at P25 while others at P50
2. Apply existing multipliers (escalation, etc.)
3. Aggregate multiplier-adjusted time-series
4. Calculate financial metric (NPV, IRR, etc.)
5. Compare with P75 case to get impact

### SENSITIVITY_SOURCE_REGISTRY for Indirect Variables

For variables that don't directly create cash flows but affect financial calculations:

```javascript
export const SENSITIVITY_SOURCE_REGISTRY = {
    technical: [
        {
            id: 'availability',
            description: 'Wind Turbine Availability Factor',
            category: 'technical',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'availability'],
            affects: ['revenues.energy'], // References CASHFLOW_SOURCE_REGISTRY entry
            multipliers: [], // Inherits multipliers from affected entry
            data: {
                units: '%',
                impactType: 'multiplicative' // How it affects the target
            }
        },
        {
            id: 'windVariability',
            description: 'Wind Resource Variability',
            category: 'technical',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'],
            affects: ['revenues.energy'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'multiplicative'
            }
        }
    ],
    
    financial: [
        {
            id: 'interestRate',
            description: 'Debt Interest Rate',
            category: 'financing',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'interestRate'],
            affects: ['financing.debtService'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'recalculation' // Requires full debt schedule recalc
            }
        },
        {
            id: 'taxRate',
            description: 'Corporate Tax Rate',
            category: 'financing',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'taxRate'],
            affects: ['financing.taxShield'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'recalculation'
            }
        }
    ],
    
    operational: [
        {
            id: 'degradationRate',
            description: 'Annual Performance Degradation Rate',
            category: 'technical',
            hasPercentiles: false,
            path: ['settings', 'project', 'windFarm', 'degradationRate'],
            affects: ['revenues.energy'],
            multipliers: [],
            data: {
                units: '%/year',
                impactType: 'time_series_modifier'
            }
        }
    ]
};
```

### Variable Discovery Function

```javascript
/**
 * Discover all variables for sensitivity analysis from dual registry system
 * @param {Object} cashflowRegistry - CASHFLOW_SOURCE_REGISTRY
 * @param {Object} sensitivityRegistry - SENSITIVITY_SOURCE_REGISTRY
 * @returns {Array} Combined array of all sensitivity variables
 */
export const discoverAllSensitivityVariables = (cashflowRegistry, sensitivityRegistry) => {
    const variables = [];
    
    // Extract direct variables from CASHFLOW_SOURCE_REGISTRY
    ['multipliers', 'costs', 'revenues'].forEach(section => {
        if (cashflowRegistry[section]) {
            cashflowRegistry[section].forEach(source => {
                if (source.hasPercentiles) {
                    variables.push({
                        id: source.id,
                        label: source.description || source.id,
                        category: source.category,
                        path: source.path,
                        hasPercentiles: true,
                        variableType: section.slice(0, -1), // 'revenues' -> 'revenue'
                        source: 'direct',
                        registryCategory: section,
                        multipliers: source.multipliers || [],
                        units: source.data?.units || ''
                    });
                }
            });
        }
    });
    
    // Extract indirect variables from SENSITIVITY_SOURCE_REGISTRY
    ['technical', 'financial', 'operational'].forEach(section => {
        if (sensitivityRegistry[section]) {
            sensitivityRegistry[section].forEach(source => {
                if (source.hasPercentiles) {
                    variables.push({
                        id: source.id,
                        label: source.description || source.id,
                        category: source.category,
                        path: source.path,
                        hasPercentiles: true,
                        variableType: source.category,
                        source: 'indirect',
                        registryCategory: section,
                        affects: source.affects || [],
                        multipliers: source.multipliers || [],
                        units: source.data?.units || '',
                        impactType: source.data?.impactType || 'multiplicative'
                    });
                }
            });
        }
    });
    
    return variables;
};
```

---

## 4. Time-Series Aggregation Strategy

### The Challenge
Financial metrics are provided as time-series spanning project lifetime (20+ years). Sensitivity analysis needs single values for impact comparison.

### Multiplier-First Approach
**Critical**: Multipliers must be applied BEFORE aggregation to ensure accurate impact calculation.

```javascript
/**
 * Complete data flow for sensitivity analysis
 */
const calculateVariableImpact = (variable, targetMetric, percentileRange) => {
    // 1. Get base case (P50)
    const baseTimeSeries = getTimeSeriesAtPercentile(variable, 50);
    const baseWithMultipliers = applyMultipliers(baseTimeSeries, variable.multipliers);
    const baseValue = aggregateTimeSeries(baseWithMultipliers, getAggregationMethod(targetMetric));
    
    // 2. Get low case (P25)
    const lowTimeSeries = getTimeSeriesAtPercentile(variable, 25);
    const lowWithMultipliers = applyMultipliers(lowTimeSeries, variable.multipliers);
    const lowValue = aggregateTimeSeries(lowWithMultipliers, getAggregationMethod(targetMetric));
    
    // 3. Get high case (P75)
    const highTimeSeries = getTimeSeriesAtPercentile(variable, 75);
    const highWithMultipliers = applyMultipliers(highTimeSeries, variable.multipliers);
    const highValue = aggregateTimeSeries(highWithMultipliers, getAggregationMethod(targetMetric));
    
    // 4. Calculate impact
    return {
        variable: variable.label,
        variableId: variable.id,
        baseValue,
        lowValue,
        highValue,
        impact: Math.abs(highValue - lowValue),
        percentileRange: { lower: 25, upper: 75, base: 50 }
    };
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

### Filter Options for Wind Industry

| Filter | Description | Typical Use |
|--------|-------------|-------------|
| `all` | All project years | NPV, IRR calculations |
| `operational` | Years > 0 | DSCR, operational cash flows |
| `construction` | Years ≤ 0 | Construction costs, capex |
| `early` | Years 1-5 | Early operational performance |
| `late` | Years 15+ | Late-life performance |

### Implementation

```javascript
// frontend/src/utils/timeSeries/aggregation.js
export const aggregateTimeSeries = (data, method, options = {}) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const {
        filter = 'all',
        discountRate = 0,
        precision = 2,
        weights = null
    } = options;

    // Apply period filters
    let filteredData = data;
    switch (filter) {
        case 'operational': 
            filteredData = data.filter(d => d.year > 0); 
            break;
        case 'construction': 
            filteredData = data.filter(d => d.year <= 0); 
            break;
        case 'early': 
            filteredData = data.filter(d => d.year > 0 && d.year <= 5); 
            break;
        case 'late': 
            filteredData = data.filter(d => d.year > 15); 
            break;
        default:
            filteredData = data;
    }

    const values = filteredData.map(d => d.value).filter(v => typeof v === 'number');
    if (values.length === 0) return null;

    let result;
    switch (method) {
        case 'mean':
            if (weights && weights.length === values.length) {
                const weightedSum = values.reduce((sum, val, i) => sum + (val * weights[i]), 0);
                const weightSum = weights.reduce((sum, w) => sum + w, 0);
                result = weightedSum / weightSum;
            } else {
                result = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
            break;
        case 'min':
            result = Math.min(...values);
            break;
        case 'max':
            result = Math.max(...values);
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
        case 'first':
            result = values[0];
            break;
        case 'last':
            result = values[values.length - 1];
            break;
        default:
            throw new Error(`Unsupported aggregation method: ${method}`);
    }

    return precision > 0 ? Number(result.toFixed(precision)) : result;
};

// Wind industry specific aggregation strategies
export const WIND_INDUSTRY_AGGREGATIONS = {
    npv: { method: 'npv', options: { filter: 'all' } },
    irr: { method: 'first', options: { filter: 'all' } },
    equityIRR: { method: 'first', options: { filter: 'all' } },
    minDSCR: { method: 'min', options: { filter: 'operational' } },
    avgDSCR: { method: 'mean', options: { filter: 'operational' } },
    llcr: { method: 'first', options: { filter: 'all' } },
    paybackPeriod: { method: 'first', options: { filter: 'all' } },
    lcoe: { method: 'first', options: { filter: 'all' } },
    totalCashflow: { method: 'sum', options: { filter: 'operational' } },
    breakEvenYear: { method: 'first', options: { filter: 'all' } }
};
```

---

## 5. Enhanced Metrics Support

### SUPPORTED_METRICS Configuration

All metrics include `impactFormat` for proper display and `thresholds` for visual feedback:

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
    
    irr: {
        label: 'Project IRR',
        format: 'percentage',
        path: ['irr'],
        aggregation: 'value',
        units: '%',
        description: 'Internal Rate of Return for project',
        impactFormat: (value) => `${(value * 100).toFixed(1)}%`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'minIRR'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 5,
                description: 'IRR below minimum target'
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
    },
    
    equityIRR: {
        label: 'Equity IRR',
        format: 'percentage',
        path: ['equityIRR'],
        aggregation: 'value',
        units: '%',
        description: 'Internal Rate of Return for equity investors',
        impactFormat: (value) => `${(value * 100).toFixed(1)}%`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'minEquityIRR'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 4,
                description: 'Equity IRR below minimum target'
            }
        ]
    },
    
    avgDSCR: {
        label: 'Average DSCR',
        format: 'ratio',
        path: ['dscr'],
        aggregation: 'mean',
        aggregationOptions: { filter: 'operational' },
        units: 'x',
        description: 'Average Debt Service Coverage Ratio during operations',
        impactFormat: (value) => `${value.toFixed(2)}x`,
        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'dscr', 'target'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('caution'), fontWeight: 600 } : null,
                priority: 3,
                description: 'Average DSCR below target'
            }
        ]
    },
    
    llcr: {
        label: 'LLCR',
        format: 'ratio',
        path: ['llcr'],
        aggregation: 'value',
        units: 'x',
        description: 'Loan Life Coverage Ratio',
        impactFormat: (value) => `${value.toFixed(2)}x`,
        thresholds: [
            {
                path: ['settings', 'modules', 'financing', 'llcr', 'target'],
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('caution'), fontWeight: 600 } : null,
                priority: 3,
                description: 'LLCR below target'
            }
        ]
    },
    
    paybackPeriod: {
        label: 'Payback Period',
        format: 'years',
        path: ['paybackPeriod'],
        aggregation: 'value',
        units: 'years',
        description: 'Time to recover initial investment',
        impactFormat: (value) => `${value.toFixed(1)} years`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'maxPayback'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 2,
                description: 'Payback period exceeds maximum target'
            }
        ]
    },
    
    lcoe: {
        label: 'LCOE',
        format: 'currency',
        path: ['lcoe'],
        aggregation: 'value',
        units: '$/MWh',
        description: 'Levelized Cost of Energy',
        impactFormat: (value) => `$${value.toFixed(2)}/MWh`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'maxLCOE'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 3,
                description: 'LCOE exceeds maximum target'
            }
        ]
    },
    
    totalCashflow: {
        label: 'Total Cash Flow',
        format: 'currency',
        path: ['cashflow'],
        aggregation: 'sum',
        aggregationOptions: { filter: 'operational' },
        units: '$',
        description: 'Total operational cash flows',
        impactFormat: (value) => `$${(value / 1000000).toFixed(1)}M`,
        thresholds: []
    },
    
    breakEvenYear: {
        label: 'Break Even Year',
        format: 'years',
        path: ['breakEvenYear'],
        aggregation: 'value',
        units: 'years',
        description: 'Year when cumulative cash flow turns positive',
        impactFormat: (value) => `Year ${value.toFixed(0)}`,
        thresholds: [
            {
                path: ['settings', 'returnTargets', 'maxBreakEven'],
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 2,
                description: 'Break-even year exceeds maximum target'
            }
        ]
    }
};
```

---

## 6. Theming Integration & Color Strategy

### Core Theming Principles
1. **UI Components**: Use Ant Design for buttons, selects, cards, alerts, etc.
2. **Financial Charts**: Use `getFinancialColorScheme()` for consistent financial color coding
3. **Category Colors**: Use `getCategoryColorScheme()` for variable type differentiation
4. **Threshold Indicators**: Use `colorRule` functions for visual feedback on metric thresholds

### Color Scheme Implementation

```javascript
// frontend/src/utils/charts/colors.js additions

/**
 * Get standardized category color scheme for sensitivity variables
 * @param {string} category - Variable category
 * @returns {string} Color hex code
 */
export const getCategoryColorScheme = (category) => {
    const categoryColors = {
        // Direct variable types (from CASHFLOW_SOURCE_REGISTRY)
        'revenue': '#52c41a',      // Green
        'cost': '#ff4d4f',         // Red
        'multiplier': '#1890ff',   // Blue
        
        // Indirect variable types (from SENSITIVITY_SOURCE_REGISTRY)
        'technical': '#722ed1',    // Purple
        'financing': '#fa8c16',    // Orange
        'operational': '#13c2c2',  // Cyan
        
        // Subcategories
        'escalation': '#1890ff',   // Blue
        'pricing': '#52c41a',      // Green
        'contract': '#fa541c',     // Orange-red
        
        // Defaults
        'unknown': '#8c8c8c',      // Gray
        'default': '#d9d9d9'       // Light gray
    };
    
    return categoryColors[category] || categoryColors.default;
};

/**
 * Generate chart color palette for large variable sets
 * @param {Array} variables - Array of variables
 * @param {string} highlightedVariable - Variable ID to highlight
 * @returns {Array} Array of color hex codes
 */
export const generateChartColorPalette = (variables, highlightedVariable = null) => {
    if (variables.length <= 8) {
        // Use category-based coloring for small sets
        return variables.map(variable => {
            if (variable.id === highlightedVariable) {
                return getSemanticColor('primary', 7); // Highlight color
            }
            return getCategoryColorScheme(variable.category);
        });
    } else {
        // Use generated palette for large sets
        const baseColors = [
            '#1890ff', '#52c41a', '#fa541c', '#722ed1',
            '#13c2c2', '#fa8c16', '#eb2f96', '#f5222d'
        ];
        
        return variables.map((variable, index) => {
            if (variable.id === highlightedVariable) {
                return getSemanticColor('primary', 7);
            }
            return baseColors[index % baseColors.length];
        });
    }
};
```

### Threshold-Based Visual Feedback

```javascript
/**
 * Evaluate metric thresholds and apply visual styling
 * @param {number} value - Metric value
 * @param {Object} metricConfig - Configuration from SUPPORTED_METRICS
 * @param {Function} getValueByPath - Function to get threshold values
 * @returns {Object} Style object with color and fontWeight
 */
export const evaluateMetricThresholds = (value, metricConfig, getValueByPath) => {
    if (!metricConfig.thresholds || metricConfig.thresholds.length === 0) {
        return null;
    }
    
    // Sort thresholds by priority (higher priority first)
    const sortedThresholds = metricConfig.thresholds.sort((a, b) => b.priority - a.priority);
    
    for (const threshold of sortedThresholds) {
        const thresholdValue = getValueByPath(threshold.path);
        if (thresholdValue === null || thresholdValue === undefined) continue;
        
        const transformedValue = threshold.transform ? 
            threshold.transform(thresholdValue) : thresholdValue;
        
        const meetsCondition = threshold.comparison === 'below' ? 
            value < transformedValue : value > transformedValue;
            
        if (meetsCondition && threshold.colorRule) {
            return threshold.colorRule(value, transformedValue);
        }
    }
    
    return null;
};
```

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

### Enhanced Tornado Chart Implementation

```javascript
// frontend/src/utils/charts/financial.js
export const prepareTornadoChartData = ({
    sensitivityResults,
    targetMetric,
    highlightedDriver,
    metricConfig
}) => {
    if (!sensitivityResults || !sensitivityResults.length || !metricConfig) {
        return null;
    }

    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);
    
    // Generate colors using new color scheme
    const colors = generateChartColorPalette(sortedResults, highlightedDriver);

    const data = [{
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.impact),
        y: sortedResults.map(r => r.variable),
        text: sortedResults.map(r => metricConfig.impactFormat(r.impact)),
        textposition: 'auto',
        marker: {
            color: colors,
            line: { color: '#fff', width: 1 }
        },
        customdata: sortedResults,
        hovertemplate:
            '<b>%{y}</b><br>' +
            `${metricConfig.label} Impact: %{text}<br>` +
            'Base (P%{customdata.percentileRange.base}): %{customdata.baseValue}<br>' +
            'Low (P%{customdata.percentileRange.lower}): %{customdata.lowValue}<br>' +
            'High (P%{customdata.percentileRange.upper}): %{customdata.highValue}<br>' +
            'Variable Range: %{customdata.variableValues.low} → %{customdata.variableValues.high}<br>' +
            'Confidence: %{customdata.percentileRange.confidenceInterval}%<br>' +
            'Type: %{customdata.displayCategory}<br>' +
            'Source: %{customdata.source}' +
            '<extra></extra>'
    }];

    const layout = {
        title: '',
        xaxis: {
            title: `${metricConfig.label} Impact`,
            tickformat: metricConfig.units === 'currency' ? '$,.0s' :
                metricConfig.units === 'percentage' ? '.1%' : '.2f',
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: 'Variables',
            showgrid: false,
            automargin: true
        },
        margin: { t: 20, b: 80, l: 120, r: 80 },
        height: Math.max(400, sortedResults.length * 40 + 100),
        plot_bgcolor: '#fafafa',
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };

    return { data, layout, config };
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
3. **Percentile Range Selector**: Dynamic based on ScenarioContext configured percentiles (minimum 3), respect CashflowContext baseline
4. **Aggregation Method**: Min/Max/Mean for time-series metrics
5. **Enhanced Hover**: Detailed impact info with variable ranges and units
6. **Category Filtering**: Show/hide Technical, Financial, Commercial variables

### Percentile Configuration Strategy
The Driver Explorer Card dynamically adapts to percentile configurations:

**ScenarioContext Integration**:
- Use configured percentiles from ScenarioContext (e.g., P10, P25, P50, P75, P90)
- Support minimum of 3 percentiles, scale to any number configured
- Define high/low percentiles as outer bounds of available range
- Use CashflowContext baseline percentile as center point

**Dynamic Range Selection**:
```javascript
// Example with 5 configured percentiles: [10, 25, 50, 75, 90]
const configuredPercentiles = scenarioContext.percentiles; // [10, 25, 50, 75, 90]
const baselinePercentile = cashflowContext.selectedPercentile; // 50 (unified) or per-source
const minPercentile = Math.min(...configuredPercentiles); // 10
const maxPercentile = Math.max(...configuredPercentiles); // 90

// User can select any range within configured bounds
const defaultLow = configuredPercentiles[1]; // 25 (second lowest)
const defaultHigh = configuredPercentiles[configuredPercentiles.length - 2]; // 75 (second highest)
```

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

## 11. Implementation Task List

**Legend:** ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

### 1. Core Infrastructure 🏗️ 🏷️Critical
### Status: ✅ COMPLETED

- ☑ **CI-1** Create `frontend/src/utils/timeSeries/aggregation.js` with all supported aggregation methods (`mean`, `min`, `max`, `sum`, `npv`, `first`, `last`) and wind industry strategies
- ☑ **CI-2** Create `frontend/src/contexts/SensitivityRegistry.js` with `SENSITIVITY_SOURCE_REGISTRY` using proper schema structure with `.data` property and fixed `.affects` references to specific `.id` values
- ☑ **CI-3** Add `SensitivitySourceSchema` and `SensitivityRegistrySchema` to `schemas/yup/cashflow.js` with clean, single schema structure (no confusing wrappers)
- ☑ **CI-4** Implement optimized `calculateSensitivityAnalysis()` with dual registry support (separate parameters), multiplier-first approach, and comprehensive error handling
- ☑ **CI-5** Create wind industry aggregation strategies with proper filter and option handling, integrated into CI-1 implementation

### 2. Metrics & Theming Configuration 🎨 🏷️Critical
### Status: ✅ COMPLETED

- ☑ **MTC-1** Update `SUPPORTED_METRICS` with `impactFormat` functions and comprehensive `thresholds` configuration
- ☑ **MTC-2** Implement threshold `colorRule` functions using `getFinancialColorScheme` for visual feedback, moved `evaluateMetricThresholds` to proper location (`sensitivityMetrics.js`)
- ☑ **MTC-3** Add LCOE calculation function to `frontend/src/utils/finance/calculations.js` with proper wind industry methodology
- ☑ **MTC-4** Create `getCategoryColorScheme()` function in `colors.js` with standardized category colors following existing format (hex colors in comments)
- ☑ **MTC-5** Use existing `generateChartColorPalette()` without modifications - no changes needed, existing implementation is optimal

### 3. Enhanced Sensitivity Analysis Engine 🧮 🏷️Critical
### Status: ✅ COMPLETED

- ☑ **SAE-1** Enhance `frontend/src/utils/finance/sensitivityAnalysis.js` with dual registry support (CASHFLOW + SENSITIVITY registries)
- ☑ **SAE-2** Implement dynamic percentile configuration from ScenarioContext using `getSensitivityRangeFromSimulation()` utility function (simplified, no over-engineering)
- ☑ **SAE-3** Add time-series aggregation integration for multi-year financial metrics (already integrated via `aggregateTimeSeries`)
- ☑ **SAE-4** Create threshold evaluation system with Return Targets integration using existing `evaluateMetricThresholds` function
- ☑ **SAE-5** Add comprehensive error handling with input validation and graceful degradation

**Files to Create/Modify:**
- `frontend/src/utils/finance/sensitivityAnalysis.js` (major enhancement)

### 4. Chart Components & Visualization 📊 🏷️Critical
### Status: ✅ COMPLETED

- ☑ **CCV-1** Enhanced `prepareTornadoChartData()` with smart coloring (≤8 vars: category colors, >8 vars: generated palette)
- ☑ **CCV-2** Enhanced chart interaction handlers with opacity effects and better click handling  
- ☑ **CCV-3** Created `SENSITIVITY_CHART_TYPES` registry with tornado/heatmap support and validation
- ☑ **CCV-4** Implemented responsive sizing, mobile-friendly interactions, and export options
- ☑ **CCV-5** Added comprehensive hover templates with percentile ranges, confidence levels, and metadata
- ☑ **CCV-6** Reorganized code into proper `charts/sensitivity/` structure for maintainability

### 5. Driver Explorer Card Component Enhancement 🎯 🏷️Critical
### Status: ✅ COMPLETED

- ☑ **DEC-1** Debug and enhance existing `DriverExplorerCard.jsx` following established patterns from FinanceabilityCard
- ☑ **DEC-2** Fix controls row with metric selector, percentile range selector, and aggregation method picker
- ☑ **DEC-3** Implement proper data flow from CashflowContext with pre-computed sensitivity data
- ☑ **DEC-4** Add insights panel with analysis summary showing top drivers and variance analysis
- ☑ **DEC-5** Ensure integration with existing card registry system in CashflowAnalysis.jsx

### 6. CashflowContext Integration 🔄 🏷️High
- ☐ **CCI-1** Add sensitivity data computation to CashflowContext refresh workflow following established patterns
- ☐ **CCI-2** Store `sensitivityData` alongside existing cash flow data in context state
- ☐ **CCI-3** Follow established FinanceabilityCard and CashflowTimelineCard patterns for data access
- ☐ **CCI-4** Integrate sensitivity computation into existing refresh chain (no separate caching)
- ☐ **CCI-5** Ensure sensitivity data refreshes when cash flow data refreshes

**Files to Create/Modify:**
- `frontend/src/contexts/CashflowContext.jsx` (modify)

### 7. Component Creation & Support 🔧 🏷️Medium
- ☐ **CCS-1** Enhance existing `SensitivityRangeSelector` component with proper percentile discovery
- ☐ **CCS-2** Create `InsightsPanel` component for analysis summary and key findings display
- ☐ **CCS-3** Enhance existing config utilities in `DriverExplorerConfig.js` with table and footer configurations
- ☐ **CCS-4** Add proper error boundaries and loading states with meaningful error messages
- ☐ **CCS-5** Create educational footer content explaining sensitivity methodology

**Files to Create/Modify:**
- `frontend/src/components/results/cashflow/components/SensitivityRangeSelector.jsx` (enhance)
- `frontend/src/components/cards/components/InsightsPanel.jsx` (create)
- `frontend/src/components/cards/configs/DriverExplorerConfig.js` (enhance)

### 8. Testing & Quality Assurance 🧪 🏷️Low  
- ☐ **TQA-1** Add comprehensive unit tests for `aggregateTimeSeries()` function with all supported methods and filters
- ☐ **TQA-2** Test sensitivity analysis calculations with various registry configurations and edge cases
- ☐ **TQA-3** Validate chart interactions and data flow between components
- ☐ **TQA-4** Test CashflowContext integration and refresh patterns
- ☐ **TQA-5** Performance testing with large variable sets (20+ variables)

### 9. Cleanup & Documentation 🔥 🏷️Low
- 🔥 **CLD-1** Remove or fix broken existing DriverExplorerCard implementation if incompatible
- 🔥 **CLD-2** Clean up unused imports and legacy sensitivity analysis patterns
- ☐ **CLD-3** Update component exports in `frontend/src/components/cards/index.js`
- ☐ **CLD-4** Create usage documentation for time-series aggregation utility
- ☐ **CLD-5** Document sensitivity analysis methodology and Return Targets integration

---

## 12. Quality Gates & Acceptance Criteria

### Functional Requirements ✅
- **Variable Discovery**: Successfully extract variables from both CASHFLOW and SENSITIVITY registries
- **Multiplier-First Processing**: Apply multipliers to time-series before aggregation for accurate impact calculation
- **Sensitivity Calculation**: Accurate one-at-a-time analysis with proper impact ranking
- **Chart Visualization**: Clear tornado chart with proper formatting, colors, and hover details
- **Percentile Integration**: Respect CashflowContext percentile selection (unified with rest of workspace)
- **Time-Series Aggregation**: Proper handling of multi-year financial metrics with all supported methods
- **Error Handling**: Graceful degradation with helpful error messages

### Technical Success ✅
- **Performance**: Sub-second response times for interactive changes
- **Reliability**: Zero crashes or data loss during normal operation
- **Extensibility**: New variables can be added through registry configuration only
- **Integration**: Seamless workflow integration with existing Cash Flow workspace
- **Data Flow**: Proper multiplier application before aggregation ensures accurate impact calculations

### User Experience ✅
- **Clarity**: Business stakeholders can understand impact rankings without technical knowledge
- **Interactivity**: Rich hover information with proper units, ranges, and impact formatting
- **Responsiveness**: Works well on different screen sizes
- **Visual Feedback**: Color-coded variables by category and threshold-based styling
- **Educational Value**: Clear explanation of methodology and confidence intervals

### Wind Industry Compliance ✅
- **Metric Standards**: Support for standard wind project financial metrics (NPV, IRR, DSCR, LLCR, LCOE)
- **Time Period Filters**: Proper operational vs construction period filtering
- **Aggregation Methods**: Industry-appropriate aggregation strategies for each metric type
- **Threshold Integration**: Integration with Return Targets for automatic risk assessment
- **Multiplier Support**: Proper escalation and pricing multiplier application

---

## 13. Success Metrics

### Business Impact
- **Decision Support**: Stakeholders can identify top 3-5 value drivers affecting project returns
- **Risk Management**: Clear visibility into which variables create highest financial risk
- **Optimization Focus**: Actionable insights for improving project performance
- **Communication**: Executive-ready visualizations for investment committee presentations

### Technical Implementation
- **Data Accuracy**: Multiplier-first approach ensures accurate impact calculations
- **Performance**: Fast computation using pre-computed CashflowContext data
- **Maintainability**: Registry-driven approach makes adding new variables straightforward
- **Consistency**: Follows established patterns from other Cash Flow workspace cards

### User Adoption
- **Ease of Use**: Non-technical users can interpret results without training
- **Actionability**: Results directly inform contract negotiations and design decisions
- **Integration**: Natural workflow integration with existing cash flow analysis
- **Educational Value**: Users understand methodology and can explain results to stakeholders

---

## 14. Files Summary

### Files to Create:
- `frontend/src/utils/timeSeries/aggregation.js` - Complete time-series aggregation utility
- `frontend/src/contexts/SensitivityRegistry.js` - SENSITIVITY_SOURCE_REGISTRY definition
- `frontend/src/components/charts/SensitivityCharts.jsx` - Chart components and registry (future)
- `frontend/src/components/cards/components/InsightsPanel.jsx` - Analysis summary component

### Files to Modify:
- `schemas/yup/cashflow.js` - Add SensitivitySourceRegistrySchema
- `frontend/src/utils/charts/colors.js` - Add category colors and palette generation
- `frontend/src/utils/finance/sensitivityMetrics.js` - Enhanced SUPPORTED_METRICS 
- `frontend/src/utils/finance/calculations.js` - Add LCOE calculation
- `frontend/src/utils/finance/sensitivityAnalysis.js` - Enhanced with dual registry and multiplier-first approach
- `frontend/src/utils/charts/financial.js` - Enhanced tornado chart preparation
- `frontend/src/contexts/CashflowContext.jsx` - Add sensitivity data computation
- `frontend/src/components/cards/DriverExplorerCard.jsx` - Major enhancement following established patterns
- `frontend/src/components/cards/configs/DriverExplorerConfig.js` - Enhanced configuration utilities
- `frontend/src/components/results/cashflow/components/SensitivityRangeSelector.jsx` - Enhanced component
- `frontend/src/components/cards/index.js` - Updated exports

---

## 15. Implementation Notes

### Critical Dependencies
- **Multiplier System**: Must apply multipliers before aggregation for accurate calculations
- **Registry Architecture**: Dual registry system (CASHFLOW + SENSITIVITY) for comprehensive variable coverage
- **CashflowContext Integration**: Follow established patterns from FinanceabilityCard and CashflowTimelineCard
- **Percentile Unity**: Use same percentile selection as rest of Cash Flow workspace

### Key Technical Decisions
1. **Multiplier-First Approach**: Apply escalation/multipliers to time-series, then aggregate results
2. **Registry-Based Discovery**: Leverage existing CASHFLOW_SOURCE_REGISTRY plus new SENSITIVITY_SOURCE_REGISTRY
3. **Context Integration**: Pre-compute sensitivity data in CashflowContext refresh cycle
4. **Visual Design**: Category-based coloring for ≤8 variables, generated palette for >8 variables
5. **Threshold Integration**: Automatic visual feedback based on Return Targets configuration

### Development Workflow
- Start with Core Infrastructure (CI tasks) to establish foundation
- Move to Metrics & Theming (MTC tasks) for proper display
- Implement Enhanced Sensitivity Engine (SAE tasks) for core calculations
- Build Chart Components (CCV tasks) for visualization
- Enhance Driver Explorer Card (DEC tasks) for user interface
- Integrate with CashflowContext (CCI tasks) for data flow
- Add supporting components (CCS tasks) for complete functionality
- Test and document (TQA/CLD tasks) for production readiness

This PRD provides complete specification for implementing the Driver Explorer Card feature with proper integration into the existing Cash Flow Analysis workspace while following established architectural patterns and wind industry best practices.

## Current Status Details

### Key Deliverables Completed:

#### ✅ Time-Series Aggregation (`aggregation.js`)
- All 7 aggregation methods implemented per PRD
- Wind industry period filters: `operational`, `construction`, `early`, `late`
- WIND_INDUSTRY_AGGREGATIONS mapping for all financial metrics
- Weighted mean support and NPV discounting
- Clean JSDoc documentation, no over-engineering

#### ✅ Sensitivity Registry (`SensitivityRegistry.js`)  
- SENSITIVITY_SOURCE_REGISTRY with technical/financial/operational categories
- Fixed `.affects` property to reference specific CASHFLOW_SOURCE_REGISTRY `.id` values
- Dual registry discovery function with separate parameters (no array complications)
- Proper multiplier support for escalating variables

#### ✅ Schema Implementation (`cashflow.js`)
- Clean `SensitivitySourceSchema` and `SensitivityRegistrySchema`
- No confusing wrapper schemas or over-engineering
- Extends base patterns consistently

#### ✅ Optimized Sensitivity Analysis (`sensitivityAnalysis.js`)
- Multiplier-first approach (critical for accurate impact calculations)
- Clean, coherent structure with single main function
- Separate registry parameters for clarity
- Comprehensive utility functions for filtering and processing

### Architecture Decisions Finalized:
- **Multiplier-First**: Apply escalation/multipliers to time-series BEFORE aggregation
- **Dual Registry**: CASHFLOW_SOURCE_REGISTRY (direct) + SENSITIVITY_SOURCE_REGISTRY (indirect)
- **Separate Parameters**: Functions take cashflowRegistry and sensitivityRegistry separately
- **Clean Schemas**: Single, focused schema structure without unnecessary wrappers
- **Wind Industry Focus**: All aggregations follow wind project finance standards

#### ✅ Enhanced SUPPORTED_METRICS (`sensitivityMetrics.js`)
- Complete configuration for all wind industry financial metrics
- `impactFormat` functions for proper display (e.g., `$2.1M`, `3.2%`, `1.25x`)
- Comprehensive `thresholds` with `colorRule` functions calling `getFinancialColorScheme`
- Priority-based threshold evaluation for visual feedback
- Return Targets integration for automatic risk assessment

#### ✅ Threshold Evaluation System (`sensitivityMetrics.js`)
- `evaluateMetricThresholds()` function properly located in sensitivityMetrics.js
- Uses existing threshold evaluation pattern from TableConfiguration.js
- Integrates with Return Targets configuration
- Supports both path-based and fixed thresholds
- Priority-based style application

#### ✅ LCOE Calculation (`calculations.js`)
- `calculateLCOE()` function with proper wind industry methodology
- `calculateLCOEFromCashflow()` for integration with existing data structures
- Present value calculations with discount rate support
- Comprehensive error handling and validation

#### ✅ Category Color Scheme (`colors.js`)
- `getCategoryColorScheme()` following existing getFinancialColorScheme format
- Hex colors in comments matching established patterns
- Standardized colors for direct vs indirect variable types
- Technical/financial/operational category support
- Proper fallback handling

#### ✅ Smart Chart Coloring Strategy
- Use existing `generateChartColorPalette()` without modifications
- Category-based coloring for ≤8 variables using `getCategoryColorScheme()`
- Generated palette for >8 variables using existing function
- Highlight color support for selected variables

### Architecture Decisions Finalized:
- **Proper Code Organization**: `evaluateMetricThresholds` in sensitivityMetrics.js, not colors.js
- **Follow Existing Patterns**: getCategoryColorScheme matches getFinancialColorScheme format
- **Don't Over-Engineer**: Use existing generateChartColorPalette without changes
- **Threshold Integration**: Complete integration with Return Targets configuration
- **Visual Feedback**: Automatic color coding based on financial thresholds

### Files Created/Modified:
- ✅ `frontend/src/utils/finance/sensitivityMetrics.js` (enhanced - metrics + thresholds + evaluation)
- ✅ `frontend/src/utils/finance/calculations.js` (modified - LCOE functions added)
- ✅ `frontend/src/utils/charts/colors.js` (modified - getCategoryColorScheme added)

### Integration Points:
- **Return Targets**: Threshold evaluation reads from settings.returnTargets configuration
- **Financial Colors**: Uses existing getFinancialColorScheme for consistent theming
- **Table System**: Compatible with existing MetricsDataTable threshold evaluation
- **Chart System**: Integrates with existing chart color palette generation

#### ✅ Simplified Percentile Configuration (`percentileUtils.js`)
- `getSensitivityRangeFromSimulation()` function takes whole simulation config object
- Uses existing `getDefaultSensitivityRange()` function internally
- No over-engineering - passes PercentileSchema array directly
- Returns simple `{ lower, upper, base }` object

#### ✅ Enhanced Sensitivity Analysis Engine (`sensitivityAnalysis.js`)
- Complete rewrite with multiplier-first approach (critical for accuracy)
- Dual registry support with separate parameters (cashflow + sensitivity)
- Dynamic percentile range calculation from ScenarioContext
- Time-series aggregation integration for multi-year metrics
- Comprehensive error handling and input validation

#### ✅ Threshold Evaluation Integration (`sensitivityMetrics.js`)
- Uses existing `evaluateMetricThresholds` function from MTC-2
- Return Targets integration for automatic risk assessment
- Priority-based threshold evaluation with visual feedback
- Proper color rule application using `getFinancialColorScheme`

#### ✅ Core Data Flow Architecture
- **Multiplier-First**: Apply escalation/multipliers to time-series BEFORE aggregation
- **Registry Discovery**: Extract variables from both CASHFLOW and SENSITIVITY registries
- **Percentile Processing**: Get time-series at different percentiles for comparison
- **Impact Calculation**: Compare aggregated metric values to determine sensitivity
- **Result Formatting**: Sort by impact magnitude with comprehensive metadata

### Architecture Decisions Finalized:
- **Simplified Interface**: Pass simulation config object directly, no complex parameters
- **Use Existing Functions**: Leverage `getDefaultSensitivityRange` and `evaluateMetricThresholds`
- **No Over-Engineering**: Removed unnecessary wrapper functions and validation layers. Uses existing functions, passes objects directly
- **Multiplier-First Flow**: Critical for accurate impact calculations with escalation
- **Dual Registry Support**: Clean separation of direct vs indirect variables

### Files Created/Modified:
- ✅ `frontend/src/utils/finance/sensitivityAnalysis.js` (complete rewrite - optimized)
- ✅ `frontend/src/utils/finance/percentileUtils.js` (enhanced - added `getSensitivityRangeFromSimulation`)

### Integration Points:
- **ScenarioContext**: Reads percentiles array and primaryPercentile directly
- **Registry System**: Uses `discoverAllSensitivityVariables` from dual registry architecture
- **Time-Series Aggregation**: Integrates with `aggregateTimeSeries` utility from CI tasks
- **Threshold System**: Uses `evaluateMetricThresholds` from MTC tasks
- **Multiplier System**: Applies multipliers before aggregation for accurate calculations

### Performance Characteristics:
- **Fast Computation**: Pre-computed aggregation strategies for each metric type
- **Memory Efficient**: Minimal data transformation, reuse time-series arrays
- **Error Resilient**: Graceful handling of missing data and invalid inputs
- **Scalable**: Supports any number of variables and percentiles from ScenarioContext

#### ✅ Chart Type Registry (`registry.js`)
- `SENSITIVITY_CHART_TYPES` with tornado and heatmap definitions
- `getOptimalChartType()` for automatic chart selection based on metric and variable count
- `validateChartConfig()` for data validation against chart requirements
- `getSuitableChartTypes()` for multiple chart type recommendations

#### ✅ Enhanced Tornado Chart Implementation (`tornado.js`)
- Smart coloring algorithm: ≤8 variables use category colors, >8 use generated palette
- Enhanced hover templates with percentile ranges, confidence levels, and metadata
- Interactive highlighting with opacity effects and smooth transitions
- Responsive height calculation based on variable count
- Professional export options with high-resolution image support

#### ✅ Smart Color System (`colors.js`)
- `generateSmartColors()` with automatic category vs palette selection
- `getSensitivityColorPalette()` optimized for sensitivity analysis
- `generateHighlightOpacity()` for visual feedback effects
- `generateImpactColors()` for impact-level based coloring

#### ✅ Common Chart Utilities (`common.js`)
- `getBaseChartConfig()` for standardized chart configuration
- `formatSensitivityData()` for data preparation and sorting
- `generateSensitivityHoverTemplate()` for consistent hover information
- `validateSensitivityData()` for comprehensive data validation
- `calculateChartDimensions()` for responsive sizing

#### ✅ Code Reorganization & Clean Architecture
- Moved sensitivity-specific code from generic `financial.js` to dedicated folder
- Created clean public API through `index.js` exports
- Maintained generic financial chart utilities in original location
- Established clear separation of concerns

### Architecture Decisions Finalized:
- **Feature-Based Organization**: All sensitivity chart code isolated in `charts/sensitivity/` folder
- **Single Responsibility**: Each file has focused purpose (registry, tornado, colors, common)
- **Extensible Design**: Easy to add new chart types (heatmap, scatter, waterfall)
- **Clean API**: Simple imports like `import { prepareTornadoChartData } from 'utils/charts/sensitivity'`
- **Smart Coloring Strategy**: Automatic adaptation between category-based and generated palettes
- **Professional Quality**: Wind industry-appropriate formatting and interactions

### Files Created:
- ✅ `frontend/src/utils/charts/sensitivity/registry.js` (chart type definitions and validation)
- ✅ `frontend/src/utils/charts/sensitivity/tornado.js` (complete tornado chart implementation)
- ✅ `frontend/src/utils/charts/sensitivity/colors.js` (smart coloring algorithms)
- ✅ `frontend/src/utils/charts/sensitivity/common.js` (shared chart utilities)
- ✅ `frontend/src/utils/charts/sensitivity/index.js` (clean public API exports)

### Files Updated:
- ✅ `frontend/src/utils/charts/financial.js` (cleaned up, focused on generic financial utilities)

#### ✅ Complete DriverExplorerCard Rewrite (`DriverExplorerCard.jsx`)
- Built from scratch using actual existing functions (no assumptions about non-existent code)
- Uses real `calculateSensitivityAnalysis()` from `sensitivityAnalysis.js`
- Integrates with `discoverAllSensitivityVariables()` from `SensitivityRegistry.js`
- Follows established patterns from FinanceabilityCard and CashflowTimelineCard
- Comprehensive error handling for missing data, transform errors, and edge cases

#### ✅ Enhanced Controls Row Implementation
- Target metric selector using real `SUPPORTED_METRICS` and `createMetricSelectorOptions()`
- Integrated `SensitivityRangeSelector` component for percentile range selection
- Responsive layout with proper spacing and loading state management
- Real-time updates with immediate sensitivity recalculation

#### ✅ Proper CashflowContext Data Flow
- Uses `useCashflow()` hook with `sourceRegistry` for CASHFLOW_SOURCE_REGISTRY access
- Integrates with `useScenario()` for `getValueByPath` and distribution analysis access
- Proper memoization for performance optimization with complex calculations
- Follows established data access patterns without assumptions

#### ✅ InsightsPanel Component Creation
- Top 3 impact drivers with visual ranking and interactive highlighting
- Summary statistics (total variables, confidence level, max/avg impact)
- Variable type breakdown with proper categorization and color coding
- Interactive highlighting feedback linked to chart selections
- Professional card-based layout with responsive design

#### ✅ Enhanced Configuration System
- `createDriverAnalysisFooter()` for educational content
- `createDriverInsights()` utility functions for insights panel data
- Support for future table integration and chart configuration options
- Extensible configuration patterns for easy feature additions

### Architecture Decisions Finalized:
- **Real Function Integration**: Uses only functions that actually exist in codebase
- **No Assumptions**: Completely rebuilt from scratch, ignoring outdated code references
- **Established Patterns**: Follows exact patterns from FinanceabilityCard and CashflowTimelineCard
- **Performance Optimized**: Proper memoization and state management for complex calculations
- **Error Resilient**: Comprehensive error boundaries and graceful degradation
- **Interactive Design**: Chart highlighting, variable selection, and real-time parameter updates

### Files Created/Enhanced:
- ✅ `frontend/src/components/cards/DriverExplorerCard.jsx` (complete rewrite from scratch)
- ✅ `frontend/src/components/cards/components/InsightsPanel.jsx` (created new component)
- ✅ `frontend/src/components/cards/configs/DriverExplorerConfig.js` (enhanced configuration utilities)

### Integration Points:
- **Real Sensitivity Analysis**: Uses actual `calculateSensitivityAnalysis()` function with proper parameters
- **Registry Discovery**: Integrates with real `discoverAllSensitivityVariables()` from dual registry system
- **Chart Components**: Uses completed `charts/sensitivity/` components with tornado chart implementation
- **Context Integration**: Proper `useCashflow()` and `useScenario()` hook usage following established patterns
- **Distribution Data**: Accesses real distribution analysis from `['simulation', 'inputSim', 'distributionAnalysis']`