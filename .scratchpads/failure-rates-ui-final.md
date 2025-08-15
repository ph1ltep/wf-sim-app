# Component Failure Rate UI - Final Design

## Overview
Space-efficient UI for configuring 8 major wind turbine component failure rates using proven EditableTable + Modal patterns from Service Contracts.

## UI Architecture Decision: Master-Detail with Modal Editing

### Core Layout: Table Overview + Modal Detail
**Based on proven Service Contracts pattern**
- **Table view**: Compact overview of all 8 components with summary info
- **Modal editing**: Detailed configuration using DistributionFieldV3 when needed
- **Space efficient**: All components visible at-a-glance with quick enable/disable

### Table Columns Design
1. **Component** (25%): Name + icon (gearbox, generator, etc.)
2. **Enabled** (15%): Toggle switch for quick enable/disable
3. **Failure Rate** (25%): Summary display (e.g., "Weibull (μ=2.5%)" or "Fixed: 2.5%")
4. **Cost Impact** (20%): Annual expected cost summary
5. **Status** (15%): Configuration status icon (configured/default/error)

### Modal Edit Form (Tabbed Interface)
**Tab 1: Failure Rate Configuration**
- DistributionFieldV3 for failure rate (fixed, weibull, lognormal, etc.)
- Time series toggle for aging effects
- Historical data import capabilities

**Tab 2: Cost Components**
- Component replacement cost (DistributionFieldV3)
- Crane mobilization cost (DistributionFieldV3)
- Daily repair cost (DistributionFieldV3)
- Downtime revenue impact (DistributionFieldV3)

**Tab 3: Advanced Settings** (collapsible)
- Component count per turbine
- Design life assumptions
- Historical calibration data

## Data Structure (Simplified)

### Schema Location
`settings.project.equipment.failureRates`

### Component Structure
```javascript
const ComponentFailureRateSchema = Yup.object().shape({
  enabled: Yup.boolean().default(false),
  
  // Single failure rate field - all input modes via DistributionFieldV3
  failureRate: DistributionTypeSchema.default(() => ({
    type: 'exponential',
    parameters: { lambda: 0.025, value: 0.025 }
  })),
  
  // Cost components
  costs: Yup.object().shape({
    componentReplacement: DistributionTypeSchema,
    craneMobilization: DistributionTypeSchema,
    craneDailyRate: DistributionTypeSchema,
    specialistLabor: DistributionTypeSchema,
    downtimeRevenue: DistributionTypeSchema
  })
});
```

### Default Components (Extensible)
**8 Default Major Components:**
1. **gearbox**: Default 2.5% annual rate (geared platforms only)
2. **generator**: Default 2.0% annual rate
3. **mainBearing**: Default 1.8% annual rate  
4. **powerElectronics**: Default 2.2% annual rate
5. **bladeBearings**: Default 1.5% annual rate (3 per turbine)
6. **yawSystem**: Default 1.2% annual rate
7. **controlSystem**: Default 0.8% annual rate
8. **transformer**: Default 1.0% annual rate

**Extensible Design:** Architecture supports adding custom components (tower, cables, sensors, etc.)

## UI Components Required

### Primary Components
1. **ComponentFailureRatesTable** - Main table using EditableTable pattern
2. **ComponentFailureModal** - Modal form with tabbed interface
3. **FailureRateSummaryCard** - Overview metrics card

### Utility Components  
4. **ComponentFailureRow** - Table row component with summary display
5. **FailureRateDisplay** - Smart display for different distribution types
6. **ComponentToggle** - Enable/disable toggle with visual feedback

## Implementation Benefits

### Space Efficiency ✅
- All 8 components visible in compact table
- Modal only opens when needed for detailed configuration
- Progressive disclosure reduces cognitive load

### Leverages Existing Patterns ✅
- Proven EditableTable pattern from Service Contracts
- Existing DistributionFieldV3 handles all input complexity
- Standard ContextField integration with ScenarioContext

### User Experience ✅
- Quick overview of all component status
- Immediate enable/disable without modal
- Familiar editing workflow from Service Contracts
- Visual indicators for configuration status

### Technical Benefits ✅
- Minimal new components needed
- Reuses existing validation and state management
- Performance optimized (complex components only load in modal)
- Mobile responsive design

## File Structure
- Main Page: `/frontend/src/pages/scenario/equipment/FailureRates.jsx`
- Table Component: `/frontend/src/components/tables/ComponentFailureRatesTable.jsx`
- Modal Component: `/frontend/src/components/modals/ComponentFailureModal.jsx`
- Schema: `/schemas/yup/componentFailureRates.js`