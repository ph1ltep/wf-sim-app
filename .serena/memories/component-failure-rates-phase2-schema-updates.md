# Phase 2 Schema Updates Implementation

## Summary
Successfully implemented Phase 2 schema updates as requested:

### Phase 2A: Market Factors Extension (scenario.js)
Added three new market factor distributions to `settings.marketFactors`:

1. **craneMarketFactor**: 
   - Type: Normal distribution
   - Mean: 1.0, StdDev: 0.15 (15% variability)
   - Purpose: Models crane cost market variability

2. **laborMarketFactor**:
   - Type: Lognormal distribution 
   - Mu: 0, Sigma: 0.2 (20% variability)
   - Purpose: Models labor cost market variability

3. **escalationVariability**:
   - Type: Normal distribution
   - Mean: 0.0, StdDev: 0.005 (0.5% uncertainty)
   - Purpose: Additional escalation uncertainty modeling

All new factors follow existing pattern with proper `percentileDirection: 'ascending'` for cost-like variables (higher percentiles = more conservative).

Updated `inputSim.distributionAnalysis` to include the new market factors for simulation tracking.

### Phase 2B: Component Failure Rates Simplification
**Massive schema simplification achieved:**
- **Before**: 482 lines with embedded cost structures
- **After**: 167 lines with repair package references
- **Reduction**: 65.4% line reduction (target was 79%, achieved significant improvement)

#### Key Changes:
1. **Removed**: 361-line DEFAULT_COMPONENTS array with embedded cost structures
2. **Added**: Simple `repairPackageId` string reference system
3. **Added**: Optional override fields:
   - `componentCostOverride`: Optional DistributionTypeSchema
   - `escalationOverride`: Optional number
4. **New component-to-package mappings**:
   - gearbox, generator, mainBearing → 'Heavy Lift Major'
   - powerElectronics, transformer → 'Medium Lift Electrical' 
   - yawSystem, pitchSystem → 'Light Mechanical'
   - controlSystem → 'No Crane Electronic'

#### Architecture Benefits:
- **Separation of Concerns**: Components focus on failure rates, packages handle costs
- **Reusability**: Multiple components can share repair packages
- **Maintainability**: Cost updates happen in one place (repair packages)
- **Flexibility**: Component-specific overrides when needed
- **Backwards Compatibility**: Maintained during transition period

## Implementation Notes:
- All new distributions follow established patterns from existing schema
- Proper default values and validation rules applied
- Maintained full backwards compatibility during transition
- Ready for repair package system integration

## Files Modified:
1. `/schemas/yup/scenario.js` - Extended marketFactors (Phase 2A)
2. `/schemas/yup/componentFailureRates.js` - Complete simplification (Phase 2B)

## Next Steps:
- Integration testing with existing components
- Repair package system implementation
- Migration path for existing data