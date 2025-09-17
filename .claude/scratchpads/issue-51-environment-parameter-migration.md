# Issue #51: Environment Parameter Migration

**GitHub Issue**: https://github.com/ph1ltep/wf-sim-app/issues/51

## Overview
Move environment parameters from Revenue section to new Environment navigation structure. This is a MOVE operation (not duplication) with proper cleanup.

## Parameter Migration Map
| Parameter | FROM | TO | Type |
|-----------|------|----|----- |
| windVariability | `settings.modules.revenue.windVariability` | `settings.project.environment.weather.windVariability` | Distribution |
| turbulenceIntensity | `settings.modules.revenue.turbulenceIntensity` | `settings.project.environment.siteConditions.turbulenceIntensity` | Distribution |
| surfaceRoughness | `settings.modules.revenue.surfaceRoughness` | `settings.project.environment.siteConditions.surfaceRoughness` | Number |
| kaimalScale | `settings.modules.revenue.kaimalScale` | `settings.project.environment.siteConditions.kaimalScale` | Number |

## New Environment Parameters (Add)
| Parameter | Path | Type | Default |
|-----------|------|------|---------|
| airDensity | `settings.project.environment.siteConditions.airDensity` | Number | 1.225 |
| windShearExponent | `settings.project.environment.siteConditions.windShearExponent` | Number | 0.14 |
| salinityLevel | `settings.project.environment.siteConditions.salinityLevel` | Select | 'moderate' |
| startStopCyclesPerYear | `settings.project.environment.siteConditions.startStopCyclesPerYear` | Number | 200 |
| temperatureRange | `settings.project.environment.weather.temperatureRange` | Number | 60 |
| dailyTempSwing | `settings.project.environment.weather.dailyTempSwing` | Number | 15 |
| relativeHumidity | `settings.project.environment.weather.relativeHumidity` | Number | 0.65 |

## Analysis Results
✅ **Environment section already exists** at `/scenario/economics/environment`
✅ **windVariability already migrated** to `settings.project.environment.windVariability`
❌ **Missing parameters**: turbulenceIntensity, surfaceRoughness, kaimalScale (not in UI yet)
❌ **Type inconsistency**: Missing params are Yup.number() but should be DistributionTypeSchema

## Implementation Tasks
- [x] Create new branch for issue #51
- [x] Analyze current schema structure and parameter locations
- [x] Analyze existing navigation and revenue components
- [ ] **PRIORITY**: Update schema - move 3 remaining parameters from revenue to environment
- [ ] **PRIORITY**: Convert parameters from Yup.number() to DistributionTypeSchema
- [ ] Add missing parameters to existing Environment.jsx component
- [ ] Remove old parameter references from revenue schema
- [ ] Fix simulation page path reference for windVariability
- [ ] Add new environment parameters (airDensity, windShearExponent, etc.)
- [ ] Test parameter functionality in Environment section
- [ ] Update acceptance criteria checklist

## Key Constraints
- Simple moves with proper defaults
- No migration utilities needed
- Remove old references completely (cleanup)
- Use scalar values for environmental parameters where appropriate
- Maintain functionality throughout migration

## Branch
To be created: `feature/issue-51-environment-parameter-migration`