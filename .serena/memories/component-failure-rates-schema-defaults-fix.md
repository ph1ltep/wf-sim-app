# Component Failure Rates Schema Defaults Fix

## Issue Fixed
The ComponentFailureModelingSchema had incomplete DEFAULT_COMPONENTS that only included failureRate but missing the complete costs structure. This caused duplication between schema and React component.

## Changes Made

### 1. Updated schemas/yup/componentFailureRates.js
- Enhanced DEFAULT_COMPONENTS array to include complete cost structures for all 8 components
- Added timeSeriesParameters: { value: [] } to all failureRate defaults for consistency
- Component-specific cost parameters with realistic values:
  - **Gearbox**: $500K replacement, complex crane needs, 6-day repair
  - **Generator**: $350K replacement, 5-day repair
  - **Main Bearing**: $180K replacement, 8-day complex repair
  - **Power Electronics**: $95K replacement, simpler crane needs, 3-day repair
  - **Blade Bearings**: $45K replacement, 4-day repair
  - **Yaw System**: $35K replacement, simpler crane, 2-day repair
  - **Control System**: $18K replacement, no crane needed, 1.5-day repair
  - **Transformer**: $75K replacement, 3.5-day repair

### 2. Updated frontend/src/pages/scenario/equipment/FailureRates.jsx
- Removed duplicated DEFAULT_COMPONENTS array (lines 59-156)
- Added import: `import { DEFAULT_COMPONENTS } from 'schemas/yup/componentFailureRates';`
- Now uses schema-defined defaults as single source of truth

## Result
- New scenarios automatically get proper default components with complete cost structures
- No more duplication between schema and React component
- Schema properly drives all defaults via ComponentFailureModelingSchema.default()
- React component uses schema defaults via direct import

## Validation Needed
- Test creating new scenarios to verify complete component initialization
- Verify all cost fields populate correctly from schema defaults
- Confirm EditableTable displays complete component data