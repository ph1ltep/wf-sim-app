# Repair Package System - Phase 2 & 3 Implementation

**Issue**: [#43 - Implement Repair Package System](https://github.com/ph1ltep/wf-sim-app/issues/43)

## Current Status
- ✅ **Phase 1 Complete**: Backend foundation with RepairPackage CRUD API and seed data

## Phase 2: Schema Updates
### Tasks to Complete:
1. **Add market factors to scenario schema**: 
   - Add `craneMarketFactor`, `laborMarketFactor`, `escalationVariability` to `settings.marketFactors`
   - Extend existing marketFactors in scenario.js

2. **Update componentFailureRates schema**:
   - Add `repairPackageId` field to reference backend packages
   - Add optional override fields (`componentCostOverride`, `escalationOverride`)
   - Remove embedded cost distributions (massive simplification)
   - Keep only failure rate distribution + package reference

3. **Schema validation**:
   - Ensure repair package references work correctly
   - Test schema changes don't break existing functionality

## Phase 3: Frontend Configuration/Defaults UI
### Tasks to Complete:
1. **RepairPackages page**:
   - Create new page under Configuration/Defaults
   - CRUD interface similar to Location Defaults/OEM Contracts
   - List view with filtering by category, default status
   
2. **Package editor interface**:
   - Form for editing package details (name, description, category)
   - Cost configuration (componentCostEUR, crane costs, labor)
   - Crane configuration (type, minimum days, duration)
   - Distribution editors for complexity (component + repair)
   - Component applicability settings

3. **Advanced features**:
   - Clone/duplicate functionality for packages
   - Package assignment validation
   - Default package management

## Implementation Strategy
- **Phase 2**: Use `schemas` agent for schema architecture changes
- **Phase 3**: Use `builder` agent for React UI implementation
- **Sequential approach**: Complete Phase 2 first, then Phase 3
- **Test each phase**: Ensure schemas work before building UI

## Architecture Notes
- Market factors go in existing `settings.marketFactors` (alongside escalationRate)
- Component failure rates simplified from 400+ lines to ~50 lines
- Repair packages managed like other Configuration/Defaults (LocationDefaults pattern)
- Frontend follows established patterns for consistency