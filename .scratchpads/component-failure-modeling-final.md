# Component Failure Rate Modeling - Optimized PRD

## Overview  
Component failure rate modeling MVP leveraging existing distribution system. No new modeling approaches needed - DistributionFieldV3 handles all input modes.

## Validated Existing Capabilities ✅
- **DistributionFieldV3** supports: fixed values, uncertainty distributions, time series, curve fitting
- **Weibull/Exponential/Poisson** distributions perfect for failure rate modeling
- **Time-varying parameters** fully supported in Monte Carlo engine
- **Curve fitting** exists at distribution level for historical data
- **DataPointSchema** handles time series configurations

## Core Architecture: Simplified Modular Cube Sources

### Cube Sources (Priority 9)
```javascript
{
  id: 'componentFailureRates',        // Annual failure events per component
  id: 'componentReplacementCosts',    // Cost per replacement
  id: 'craneCosts',                   // Mobilization + daily rates
  id: 'downtimeCosts'                 // Revenue loss costs
}
```

### Combined Sources (Priority 750)
```javascript
{
  id: 'totalComponentFailureCosts',
  multipliers: [
    { id: 'componentFailureRates', operation: 'multiply' },
    { id: 'componentReplacementCosts', operation: 'multiply' },
    { id: 'craneCosts', operation: 'summation' },
    { id: 'downtimeCosts', operation: 'multiply' }
  ]
}
```

## Optimized Data Structure (Leveraging Existing System)

### Component Failure Schema - Clean & Simple (UPDATED)
```javascript
const ComponentFailureRateSchema = Yup.object().shape({
  id: Yup.string().required('Component ID is required'),
  name: Yup.string().required('Component name is required'),
  category: Yup.string().oneOf(['drivetrain', 'electrical', 'rotor', 'mechanical', 'control']).required(),
  enabled: Yup.boolean().default(false),
  
  // Single failure rate field - leverages full DistributionFieldV3 capabilities
  failureRate: DistributionTypeSchema.default(() => ({
    type: 'exponential', // or 'weibull', 'fixed', 'lognormal'
    parameters: { lambda: 0.025, value: 0.025 },
    timeSeriesMode: false, // Enable for aging effects
    timeSeriesParameters: { value: [] }, // DataPointSchema arrays for time-varying
    metadata: { percentileDirection: 'ascending' }
  })),
  
  // Enhanced cost components - 6 cost types for comprehensive modeling
  costs: Yup.object().shape({
    componentReplacement: DistributionTypeSchema.default(() => ({
      type: 'lognormal',
      parameters: { mu: 13.1, sigma: 0.4, value: 500000 },
      metadata: { percentileDirection: 'ascending' }
    })),
    craneMobilization: DistributionTypeSchema.default(() => ({
      type: 'triangular',
      parameters: { min: 80000, mode: 120000, max: 200000, value: 120000 },
      metadata: { percentileDirection: 'ascending' }
    })),
    craneDailyRate: DistributionTypeSchema.default(() => ({
      type: 'normal',
      parameters: { mean: 15000, stdDev: 3000, value: 15000 },
      metadata: { percentileDirection: 'ascending' }
    })),
    repairDurationDays: DistributionTypeSchema.default(() => ({
      type: 'gamma',
      parameters: { shape: 3, scale: 2, value: 6 }, // 6 days average
      metadata: { percentileDirection: 'ascending' }
    })),
    specialistLabor: DistributionTypeSchema.default(() => ({
      type: 'normal',
      parameters: { mean: 35000, stdDev: 10000, value: 35000 },
      metadata: { percentileDirection: 'ascending' }
    })),
    downtimeRevenuePerDay: DistributionTypeSchema.default(() => ({
      type: 'normal',
      parameters: { mean: 200, stdDev: 50, value: 200 }, // $/MWh/day
      metadata: { percentileDirection: 'descending' } // Revenue loss
    }))
  }).default(() => ({}))
}).default(() => ({}));

// Portfolio-level configuration (UPDATED - Dynamic Array Structure)
const ComponentFailureModelingSchema = Yup.object().shape({
  enabled: Yup.boolean().default(false),
  
  // Dynamic array of components for EditableTable pattern
  components: Yup.array().of(ComponentFailureRateSchema).default(() => DEFAULT_COMPONENTS)
}).default(() => ({ enabled: false, components: DEFAULT_COMPONENTS }));

// DEFAULT_COMPONENTS array with 8 standardized components including categories
const DEFAULT_COMPONENTS = [
  {
    id: 'gearbox',
    name: 'Gearbox',
    category: 'drivetrain',
    enabled: false,
    failureRate: { type: 'exponential', parameters: { lambda: 0.025, value: 0.025 } }
  },
  {
    id: 'generator', 
    name: 'Generator',
    category: 'electrical',
    enabled: false,
    failureRate: { type: 'exponential', parameters: { lambda: 0.020, value: 0.020 } }
  }
  // ... (additional 6 components)
];
```

## Warranty Modeling (Future - Out of MVP Scope)

### **Data Structure Consideration for Future**
Schema designed to support warranty integration via matrix approach:
- Annual warranty effects matrix (year × cost category × coverage)
- Applied via cube source transformer 
- **NOT implemented in MVP - failure rates calculated independently**

## UI Implementation (Leveraging Existing Components)

### FailureRates.jsx Page Structure (UPDATED - EditableTable Pattern)
```javascript
const FailureRates = () => (
  <div>
    <GlobalConfigurationCard /> {/* Enable/disable failure modeling */}
    <EditableTableCard>
      <EditableTable
        path="settings.project.equipment.failureRates.components"
        columns={[componentName, category, enabled, failureRate, costSummary, actions]}
        formFields={componentFormFields}
        itemName="Component"
        keyField="id"
      />
    </EditableTableCard>
    <FailureRateSummaryCard /> {/* Simple visualization */}
    <ComponentFailureModal /> {/* Detailed configuration modal */}
  </div>
);

// Table columns with enhanced design (NO ICONS for components)
const columns = [
  {
    title: 'Component Name',
    dataIndex: 'name',
    render: (name) => <div style={{ fontWeight: 500 }}>{name}</div>
  },
  createTagColumn('category', 'Category', {
    colorMap: CATEGORY_COLORS,
    render: (category) => (
      <Tag color={CATEGORY_COLORS[category]}>
        {category?.charAt(0).toUpperCase() + category?.slice(1)}
      </Tag>
    )
  }),
  createIconColumn('Enabled', [{
    key: 'enabled',
    icon: <CheckOutlined />,
    tooltip: 'Component is enabled for failure modeling',
    color: '#52c41a'
  }]),
  {
    title: 'Cost Summary',
    render: (_, record) => getCostSummary(record) // 6 cost icons with tooltips
  }
];

// Cost summary with 6 cost component icons
const getCostSummary = (component) => {
  const COST_ICONS = {
    componentReplacement: <DollarOutlined style={{ color: '#1890ff' }} />,
    craneMobilization: <ToolOutlined style={{ color: '#52c41a' }} />,
    craneDailyRate: <BankOutlined style={{ color: '#fa8c16' }} />,
    repairDurationDays: <ClockCircleOutlined style={{ color: '#722ed1' }} />,
    specialistLabor: <UserOutlined style={{ color: '#eb2f96' }} />,
    downtimeRevenuePerDay: <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
  };
  // Return configured cost icons with tooltips
};
```

### ScenarioContext Integration
```javascript
// Simple path structure
const basePath = 'settings.componentFailure';

// Enable component failure modeling
await updateByPath(`${basePath}.enabled`, true);
await updateByPath(`${basePath}.components.gearbox.enabled`, true);

// Configure failure rate (leverages existing DistributionTypeSchema)
await updateByPath(`${basePath}.components.gearbox.failureRate`, {
  type: 'weibull',
  parameters: { scale: 10000, shape: 1.5, value: 0.025 },
  timeSeriesMode: false
});
```

## Key Advantages Validated

### 1. Leverages Existing Cube Strengths ✅
- Uses proven multiplier chains and transformer patterns
- Maintains percentile integrity across combined sources
- Excellent performance with selective recalculation

### 2. Modular Risk Modeling ✅  
- Separate uncertainty for each failure aspect
- Independent configuration and validation
- Extensible for new components or cost categories

### 3. Financial Industry Alignment ✅
- Gross vs net exposure transparency (lender requirement)
- Component-specific risk modeling (investor requirement)
- Warranty as risk transfer not cost reduction (institutional requirement)

### 4. Implementation Flexibility ✅
- Phase 1: Simple fixed rates with cost distributions
- Phase 2: Time-varying rates and advanced modeling  
- Phase 3: Component correlations and cascading failures

## MVP Implementation Scope - Optimized

### **IN SCOPE - MVP Deliverables:**
1. **Single failure rate schema** using existing DistributionTypeSchema (no new modeling approaches)
2. **Cost component schema** leveraging existing distribution system
3. **UI interface** using DistributionFieldV3 (supports all input modes automatically)
4. **Cube source definitions** for modular failure components  
5. **Basic transformers** for cost multiplication
6. **Simple visualization** card showing computed total costs

### **OUT OF SCOPE - Future Features:**
- Warranty integration and matrix processing
- Component correlations and cascading failures
- Advanced optimization and sensitivity analysis

### **MVP Boundary & Benefits:**
- ✅ **Zero new distribution infrastructure** - leverages existing system completely
- ✅ **Single schema approach** - just ComponentFailureSchema with DistributionTypeSchema fields
- ✅ **All input modes supported** - fixed, distributions, time series, curve fitting via DistributionFieldV3
- ✅ **Future warranty ready** - schema supports warranty matrix integration
- ✅ **Performance optimized** - existing Monte Carlo handles time-varying parameters efficiently

## Summary: Optimized Approach

**Key Insight Validated:** Your existing distribution system already handles all failure rate modeling needs perfectly. No new infrastructure required.

**What Changed:**
- ❌ **Removed**: Multiple modeling approaches (simple/statistical/timeSeries) 
- ❌ **Removed**: Custom curve fitting implementation
- ❌ **Removed**: Complex schema with conditional validation
- ✅ **Added**: Single clean schema using proven DistributionTypeSchema
- ✅ **Added**: Direct DistributionFieldV3 integration for all input modes
- ✅ **Added**: Leverage existing Weibull/Exponential distributions for failure modeling

**Implementation Simplicity:**
- **Schema**: 50 lines instead of 200+ (leverages existing validation)
- **UI**: DistributionFieldV3 handles all complexity (fixed, distributions, time series, curve fitting)
- **Backend**: Existing Monte Carlo engine processes everything automatically
- **Performance**: Optimal - no new infrastructure overhead

## File Structure - Updated
- Schema: `/schemas/yup/componentFailureRates.js` (UPDATED - removed icon field, enhanced cost structure)
- UI Page: `/frontend/src/pages/scenario/equipment/FailureRates.jsx` (UPDATED - EditableTable pattern)
- Modal: `/frontend/src/pages/scenario/equipment/ComponentFailureModal.jsx` (detailed configuration)
- Summary Card: `/frontend/src/components/cards/FailureRateSummaryCard.jsx`
- Cube Sources: Enhanced `/frontend/src/utils/cube/sources/registry.js`
- Transformers: `/frontend/src/utils/cube/sources/transformers/componentFailure.js`