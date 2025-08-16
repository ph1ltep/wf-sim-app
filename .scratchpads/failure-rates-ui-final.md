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
1. **Component Name** (20%): Clean text-only display (icons removed for cleaner design)
2. **Category** (15%): Separate column with color-coded tags (drivetrain, electrical, rotor, mechanical, control)
3. **Enabled** (10%): Icon column with check/close indicators for quick status identification
4. **Failure Rate** (18%): Summary display (e.g., "2.50% annual" or "Not configured")
5. **Cost Summary** (20%): New icon-based display showing configured cost components with tooltips
6. **Actions** (17%): Configure, Edit, Delete buttons for component management

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

## Data Structure (Updated)

### Schema Location
`settings.project.equipment.failureRates`

### Component Structure
```javascript
const ComponentFailureRateSchema = Yup.object().shape({
  id: Yup.string().required('Component ID is required'),
  name: Yup.string().required('Component name is required'),
  category: Yup.string().oneOf(['drivetrain', 'electrical', 'rotor', 'mechanical', 'control']).required(),
  enabled: Yup.boolean().default(false),
  
  // Single failure rate field - all input modes via DistributionFieldV3
  failureRate: DistributionTypeSchema.default(() => ({
    type: 'exponential',
    parameters: { lambda: 0.025, value: 0.025 }
  })),
  
  // Enhanced cost components with 6 cost types
  costs: Yup.object().shape({
    componentReplacement: DistributionTypeSchema,
    craneMobilization: DistributionTypeSchema,
    craneDailyRate: DistributionTypeSchema,
    repairDurationDays: DistributionTypeSchema,
    specialistLabor: DistributionTypeSchema,
    downtimeRevenuePerDay: DistributionTypeSchema
  })
});
```

### Default Components (Extensible)
**8 Default Major Components:**
1. **gearbox**: Default 2.5% annual rate (drivetrain category)
2. **generator**: Default 2.0% annual rate (electrical category)
3. **mainBearing**: Default 1.8% annual rate (drivetrain category)
4. **powerElectronics**: Default 2.2% annual rate (electrical category)
5. **bladeBearings**: Default 1.5% annual rate (rotor category)
6. **yawSystem**: Default 1.2% annual rate (mechanical category)
7. **controlSystem**: Default 0.8% annual rate (control category)
8. **transformer**: Default 1.0% annual rate (electrical category)

**Category Color Coding:**
- Drivetrain: Blue
- Electrical: Orange
- Rotor: Green
- Mechanical: Purple
- Control: Cyan

**Extensible Design:** Architecture supports adding custom components through EditableTable interface

## UI Components Required

### Primary Components
1. **EditableTable** - Main table using proven EditableTable pattern (no custom table needed)
2. **ComponentFailureModal** - Modal form with tabbed interface for detailed configuration
3. **FailureRateSummaryCard** - Overview metrics card

### Enhanced Table Features
4. **Category Tags** - Color-coded category display using Antd Tag component
5. **Enabled Status Icons** - CheckOutlined/CloseOutlined icon display
6. **Cost Summary Icons** - Six cost component icons with detailed tooltips:
   - Component Replacement (DollarOutlined)
   - Crane Mobilization (ToolOutlined)
   - Crane Daily Rate (BankOutlined)
   - Repair Duration (ClockCircleOutlined)
   - Specialist Labor (UserOutlined)
   - Downtime Revenue (ExclamationCircleOutlined)

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