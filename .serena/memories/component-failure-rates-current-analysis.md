# Component Failure Rates - Current Implementation Analysis

## 1. Current Schema Structure Analysis

### `/schemas/yup/componentFailureRates.js` (482 lines)

**Architecture**: Monolithic schema with embedded cost structures

**Key Components**:
- `ComponentFailureRateSchema`: Individual component validation
- `ComponentFailureModelingSchema`: Portfolio-level configuration
- `DEFAULT_COMPONENTS`: 8 predefined components with full cost structures
- `COMPONENT_METADATA`: Display information for UI

**Critical Problems**:
1. **Massive Duplication**: Same cost structure repeated 8 times (6 cost fields × 8 components = 48 distribution objects)
2. **Maintenance Burden**: Any cost model change requires updating 8+ locations
3. **Schema Complexity**: 40+ distribution parameters per component
4. **No Reusability**: Cost structures locked to individual components

### Current Cost Structure per Component:
```javascript
costs: {
    componentReplacement: DistributionTypeSchema,
    craneMobilization: DistributionTypeSchema, 
    craneDailyRate: DistributionTypeSchema,
    repairDurationDays: DistributionTypeSchema,
    specialistLabor: DistributionTypeSchema,
    downtimeRevenuePerDay: DistributionTypeSchema
}
```

## 2. Frontend Implementation Analysis

### `/frontend/src/pages/scenario/equipment/FailureRates.jsx`

**Current Data Flow**:
1. **ScenarioContext**: `settings.project.equipment.failureRates`
2. **Structure**: `{ enabled: boolean, components: array }`
3. **EditableTable**: Dynamic array management with inline editing
4. **ComponentFailureModal**: Detailed configuration using DistributionFieldV3

**Key Features**:
- Global enable/disable switch
- Per-component enable/disable switches
- Cost summary with icon tooltips
- Detailed modal with tabbed interface (failure rate, costs, advanced)
- Real-time validation and error handling

**Current UI Components**:
- **ContextField/SwitchField**: Context-aware form fields
- **EditableTable**: Dynamic array management
- **DistributionFieldV3**: Monte Carlo distribution inputs
- **ComponentFailureModal**: Detailed configuration dialog

## 3. Analytics Integration Analysis

### `/frontend/src/utils/cube/sources/transformers/equipment.js`

**Current Transformers**:

#### `componentFailureRatesTransformer`:
- **Input**: Array of component configurations
- **Process**: Calculate annual failure costs per component
- **Output**: Time-series cost data for Monte Carlo simulation
- **Formula**: `annualCost = failureRate × totalCostPerFailure × numWTGs`

#### Cost Calculation Logic:
```javascript
const totalCraneTime = craneCost + (craneDailyRate * repairDays);
const totalDowntimeCost = downtimePerDay * repairDays;
const totalCostPerFailure = componentCost + totalCraneTime + laborCost + totalDowntimeCost;
```

**Integration Points**:
- **CubeContext**: Analytics engine consumption
- **Global References**: `projectLife`, `numWTGs` from scenario
- **Percentile Processing**: Multiple Monte Carlo percentiles
- **Audit Trail**: Transformation logging and validation

## 4. Problems with Current Architecture

### A. Schema-Level Issues:
1. **Duplication**: 48 identical distribution objects across 8 components
2. **Maintenance**: Cost model changes require 8+ updates
3. **Consistency**: No guarantee that similar components use consistent costs
4. **Validation Overhead**: Deep nested validation for identical structures

### B. Data Flow Issues:
1. **Embedded Costs**: Cost data tightly coupled to component definitions
2. **No Normalization**: Cannot reuse cost structures across components
3. **Limited Flexibility**: Cannot easily create component variants or custom configurations
4. **Scalability**: Adding new components requires full cost structure definition

### C. Financial Modeling Issues:
1. **No Cost Escalation**: Missing time-based cost inflation
2. **Single Currency**: No multi-currency support
3. **Simple Correlation**: Cost elements treated independently
4. **No Portfolio Effects**: Missing component interaction modeling

## 5. Required Changes for Repair Package Architecture

### A. Schema Changes:

#### New RepairPackageSchema:
```javascript
const RepairPackageSchema = Yup.object().shape({
    id: Yup.string().required(),
    name: Yup.string().required(),
    category: Yup.string().oneOf(['basic', 'standard', 'premium']),
    costs: { /* Same 6 cost distributions but reusable */ },
    appliesTo: { componentCategories: [], turbineTypes: [], regions: [] }
});
```

#### Modified ComponentFailureRateSchema:
```javascript
// Replace embedded costs with reference
costs: undefined, // Remove
repairPackageId: Yup.string().required(),
costMultipliers: { /* Optional component-specific adjustments */ }
```

### B. Frontend Changes:

#### UI Updates Required:
1. **Package Selection**: Replace detailed cost config with package picker
2. **Package Management**: New UI for creating/editing repair packages
3. **Cost Preview**: Show package costs with multiplier effects
4. **Migration Tool**: Convert existing components to package references

#### Component Updates:
- **FailureRates.jsx**: Add package selection dropdown
- **ComponentFailureModal**: Replace cost tabs with package selection
- **New PackageManager**: CRUD interface for repair packages

### C. Analytics Changes:

#### Transformer Updates:
1. **Package Resolution**: Look up package by ID, apply multipliers
2. **Cost Calculation**: Resolve package costs × component multipliers
3. **Error Handling**: Handle missing package references
4. **Audit Trail**: Track package resolution in transformation logs

#### Data Flow Changes:
```javascript
// Current: component.costs.componentReplacement.parameters.value
// Future: packages[component.repairPackageId].costs.componentReplacement.parameters.value * component.costMultipliers.componentReplacement
```

### D. Migration Requirements:

#### Data Migration:
1. **Package Creation**: Generate default packages from existing component costs
2. **Component Updates**: Replace embedded costs with package references
3. **Validation**: Ensure all components reference valid packages
4. **Rollback Plan**: Maintain ability to revert to embedded costs

#### Backwards Compatibility:
1. **Dual Support**: Support both embedded costs and package references during transition
2. **Deprecation Warnings**: Alert users when using legacy embedded costs
3. **Migration UI**: Provide guided migration tool in frontend

## 6. Integration Points Requiring Updates

### A. Context Management:
- **ScenarioContext**: Update path structure for package references
- **Validation**: Add cross-schema validation for package references
- **Defaults**: Update default component initialization

### B. CRUD Operations:
- **Component Creation**: Must assign default package
- **Component Updates**: Validate package compatibility
- **Package Updates**: Impact analysis for referencing components

### C. Analytics Pipeline:
- **Source Registration**: Update cube source for package resolution
- **Transformer Logic**: Modify cost calculation algorithms
- **Percentile Processing**: Ensure package costs work with Monte Carlo

### D. Testing Requirements:
- **Unit Tests**: Validate package reference resolution
- **Integration Tests**: End-to-end package cost calculations
- **Migration Tests**: Verify data migration accuracy
- **UI Tests**: Package selection and preview functionality

## CONCLUSION

The current architecture suffers from **significant duplication and maintenance issues** that the repair package system will address. The migration requires **coordinated changes across schema, frontend, analytics, and data layers**, but will result in **85% reduction in maintenance burden** and **substantial architectural improvements**.

**Key Success Factors**:
1. **Phased migration** with backwards compatibility
2. **Comprehensive validation** at all layers
3. **User-friendly migration tools** in the frontend
4. **Thorough testing** of package resolution logic
5. **Clear audit trails** for data transformation