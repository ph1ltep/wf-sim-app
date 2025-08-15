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

### Component Failure Schema - Clean & Simple
```javascript
const ComponentFailureSchema = Yup.object().shape({
  enabled: Yup.boolean().default(false),
  
  // Single failure rate field - leverages full DistributionFieldV3 capabilities
  failureRate: DistributionTypeSchema.default(() => ({
    type: 'exponential', // or 'weibull', 'fixed', 'lognormal'
    parameters: { lambda: 0.025, value: 0.025 },
    timeSeriesMode: false, // Enable for aging effects
    timeSeriesParameters: { value: [] } // DataPointSchema arrays for time-varying
  })),
  
  // Cost components using existing distribution system
  costs: Yup.object().shape({
    componentReplacement: DistributionTypeSchema.default(() => ({
      type: 'lognormal',
      parameters: { mu: 13.1, sigma: 0.4, value: 500000 }
    })),
    craneMobilization: DistributionTypeSchema.default(() => ({
      type: 'triangular',
      parameters: { min: 80000, mode: 120000, max: 200000, value: 120000 }
    })),
    craneDailyRate: DistributionTypeSchema.default(() => ({
      type: 'normal',
      parameters: { mean: 15000, stdDev: 3000, value: 15000 }
    })),
    repairDurationDays: DistributionTypeSchema.default(() => ({
      type: 'gamma',
      parameters: { shape: 3, scale: 2, value: 6 }
    })),
    specialistLabor: DistributionTypeSchema.default(() => ({
      type: 'normal',
      parameters: { mean: 35000, stdDev: 10000, value: 35000 }
    })),
    downtimeRevenuePerDay: DistributionTypeSchema.default(() => ({
      type: 'normal',
      parameters: { mean: 200, stdDev: 50, value: 200 }
    }))
  })
});

// Portfolio-level configuration  
const ComponentFailureModelingSchema = Yup.object().shape({
  enabled: Yup.boolean().default(false),
  
  // 8 standardized components
  components: Yup.object().shape({
    gearbox: ComponentFailureSchema.default(() => ({})),
    generator: ComponentFailureSchema.default(() => ({})),
    mainBearing: ComponentFailureSchema.default(() => ({})),
    powerElectronics: ComponentFailureSchema.default(() => ({})),
    bladeBearings: ComponentFailureSchema.default(() => ({})),
    yawSystem: ComponentFailureSchema.default(() => ({})),
    controlSystem: ComponentFailureSchema.default(() => ({})),
    transformer: ComponentFailureSchema.default(() => ({}))
  })
});
```

## Warranty Modeling (Future - Out of MVP Scope)

### **Data Structure Consideration for Future**
Schema designed to support warranty integration via matrix approach:
- Annual warranty effects matrix (year × cost category × coverage)
- Applied via cube source transformer 
- **NOT implemented in MVP - failure rates calculated independently**

## UI Implementation (Leveraging Existing Components)

### FailureRates.jsx Page Structure
```javascript
const FailureRates = () => (
  <div>
    <ComponentFailureGlobalCard />
    <ComponentFailureList>
      {COMPONENT_TYPES.map(component => (
        <ComponentFailureCard key={component} componentType={component} />
      ))}
    </ComponentFailureList>
    <FailureCostSummaryCard /> {/* Simple visualization */}
  </div>
);

// Clean component using existing DistributionFieldV3
const ComponentFailureCard = ({ componentType }) => {
  const basePath = `settings.componentFailure.components.${componentType}`;
  
  return (
    <Card title={COMPONENT_NAMES[componentType]}>
      <ContextField path={`${basePath}.enabled`} fieldType="boolean" />
      
      {/* Single failure rate field - all input modes supported */}
      <DistributionFieldV3
        path={[basePath, 'failureRate']}
        label="Annual Failure Rate"
        addonAfter="failures/year"
        distributionOptions={[
          { value: 'fixed', label: 'Fixed Rate' },
          { value: 'exponential', label: 'Constant Rate' },
          { value: 'weibull', label: 'Aging Effects' },
          { value: 'lognormal', label: 'General Uncertainty' }
        ]}
        showTimeSeriesToggle={true}
        allowCurveToggle={true}
        showVisualization={true}
      />
      
      <Collapse ghost>
        <Panel key="costs" header="Cost Components">
          <DistributionFieldV3
            path={[basePath, 'costs', 'componentReplacement']}
            label="Component Replacement Cost"
            addonAfter="USD"
          />
          <DistributionFieldV3
            path={[basePath, 'costs', 'craneMobilization']} 
            label="Crane Mobilization Cost"
            addonAfter="USD"
          />
          {/* Additional cost fields */}
        </Panel>
      </Collapse>
    </Card>
  );
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

## File Structure - Simplified
- Schema: `/schemas/yup/componentFailure.js` (minimal - leverages existing)
- UI Page: `/frontend/src/pages/scenario/equipment/FailureRates.jsx`
- Cube Sources: Enhanced `/frontend/src/utils/cube/sources/registry.js`
- Transformers: `/frontend/src/utils/cube/sources/transformers/componentFailure.js`