# Issue #41 - Component Failure Rate Modeling Implementation Plan

**GitHub Issue**: https://github.com/ph1ltep/wf-sim-app/issues/41
**Status**: In Progress  
**Assignee**: Claude Code Agent
**Estimated Duration**: 2-3 hours for MVP implementation

## Issue Summary
Implement component failure rate modeling for wind turbine major components using existing distribution system and proven UI patterns. Enable configuration of failure rates for 8 default components with cost modeling and extensible architecture.

## Prior Art Analysis ✅

### Existing Infrastructure to Leverage
- **DistributionFieldV3**: ✅ Fully functional, supports all input modes (fixed, distributions, time series)
- **DistributionTypeSchema**: ✅ Complete schema with Weibull/Exponential distributions (perfect for failure rates)
- **EditableTable**: ✅ Proven pattern from ServiceContracts - perfect for master-detail layout
- **ScenarioContext**: ✅ State management system ready for integration
- **project.equipment**: ✅ Schema location already exists in scenario settings

### Reference Documents
- Architecture: `.scratchpads/component-failure-modeling-final.md` ✅ Reviewed
- UI Design: `.scratchpads/failure-rates-ui-final.md` ✅ Reviewed
- Backend Infrastructure: Basic failure model CRUD exists, needs enhancement

## Implementation Strategy

### Phase-Based Approach (Following Issue Requirements)
1. **Phase 1**: Schema & Data Structure 
2. **Phase 2**: UI Components (Master-Detail Pattern)
3. **Phase 3**: Cube Integration & Calculations
4. **Phase 4**: Integration & Navigation
5. **Phase 5**: Testing & Polish

### MVP Session Goals (Current Implementation)
**Target**: Working MVP demonstrating core functionality in 2-3 hours

#### Immediate Tasks (Prioritized)
1. **Schema Creation** (30 min)
   - Create `/schemas/yup/componentFailureRates.js`
   - Update scenario schema: `settings.project.equipment.failureRates`
   - Generate mongoose schema

2. **Basic UI Components** (45 min)
   - Create `/frontend/src/pages/scenario/equipment/FailureRates.jsx`
   - Implement ComponentFailureRatesTable (EditableTable pattern)
   - Create ComponentFailureModal with DistributionFieldV3
   - 8 default components with enable/disable

3. **State Integration** (15 min)
   - ScenarioContext integration for data persistence
   - Test data flow schema → UI → context → backend

4. **Basic Summary** (15 min)
   - Simple FailureRateSummaryCard
   - Show enabled components and basic cost estimates

## Technical Implementation Details

### Schema Structure (Simplified for MVP)
```javascript
const ComponentFailureRateSchema = Yup.object().shape({
  enabled: Yup.boolean().default(false),
  failureRate: DistributionTypeSchema.default(() => ({
    type: 'exponential',
    parameters: { lambda: 0.025, value: 0.025 }
  })),
  costs: Yup.object().shape({
    componentReplacement: DistributionTypeSchema,
    craneMobilization: DistributionTypeSchema,
    craneDailyRate: DistributionTypeSchema,
    specialistLabor: DistributionTypeSchema,
    downtimeRevenue: DistributionTypeSchema
  })
});
```

### Default Components (8 Industry Standards)
1. **gearbox**: 2.5% annual (geared platforms only)
2. **generator**: 2.0% annual
3. **mainBearing**: 1.8% annual
4. **powerElectronics**: 2.2% annual
5. **bladeBearings**: 1.5% annual
6. **yawSystem**: 1.2% annual
7. **controlSystem**: 0.8% annual
8. **transformer**: 1.0% annual

### UI Pattern (Proven from ServiceContracts)
- **Master View**: EditableTable showing all components
- **Detail View**: Modal with DistributionFieldV3 for configuration
- **Progressive Disclosure**: Enable/disable without modal, detailed config in modal

### Files to Create/Modify
```
schemas/yup/componentFailureRates.js          [NEW]
schemas/mongoose/componentFailureRates.js     [NEW] 
schemas/yup/scenario.js                       [MODIFY - add equipment.failureRates]
frontend/src/pages/scenario/equipment/        [NEW DIRECTORY]
frontend/src/pages/scenario/equipment/FailureRates.jsx [NEW]
frontend/src/components/tables/ComponentFailureRatesTable.jsx [NEW]
frontend/src/components/modals/ComponentFailureModal.jsx [NEW]
frontend/src/components/cards/FailureRateSummaryCard.jsx [NEW]
```

## Success Criteria for MVP
- ✅ 8 default components configurable with enable/disable
- ✅ DistributionFieldV3 supports failure rate input (fixed, distributions, time series)
- ✅ Space-efficient master-detail UI following ServiceContracts pattern
- ✅ Data persists in ScenarioContext with proper schema validation
- ✅ Basic summary showing configured components and estimated costs
- ✅ Extensible architecture ready for cube integration (Phase 3)

## Future Implementation (Out of MVP Scope)
- Cube sources for Monte Carlo integration
- Advanced cost calculations and multipliers
- Warranty integration (separate issue)
- Component correlations and cascading failures
- Navigation menu integration
- Comprehensive testing suite

## Risk Mitigation
- **Leverage existing patterns**: Using proven DistributionFieldV3 and EditableTable patterns reduces implementation risk
- **Incremental development**: Each phase delivers working functionality
- **Schema-first approach**: Robust data validation from the start
- **Reference implementation**: ServiceContracts provides exact UI pattern to follow

## Next Steps After MVP
1. Cube source integration (componentFailureRates, componentReplacementCosts)
2. Combined source creation (totalComponentFailureCosts)
3. Navigation menu integration
4. Advanced testing and validation
5. Performance optimization
6. Documentation updates

---
**Implementation Started**: 2025-08-15
**Last Updated**: 2025-08-15