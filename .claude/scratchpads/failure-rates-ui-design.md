# Component Failure Rates UI Design - Space-Efficient Configuration

## Design Overview

**Goal**: Create a space-efficient UI for configuring failure rates of 8 major wind turbine components with full editing capabilities.

**Key Requirements**:
- Compact view showing all 8 components at-a-glance
- Quick enable/disable toggle per component
- Integrated editing using DistributionFieldV3 and ContextField
- Table-based layout similar to InlineEditTable patterns
- Space-efficient design suitable for equipment failure rates page

## Component List (from backend/scripts/seedMajorComponents.js)

| Component | Quantity/WTG | Default Rate | Applies To | Description |
|-----------|--------------|--------------|------------|-------------|
| **Gearbox** | 1 | 3.0% | Geared only | Mechanical gearboxes that increase rotational speed |
| **Generator** | 1 | 2.5% | Both | Electric generators that produce power |
| **Main Bearing** | 1 | 1.8% | Both | Main shaft bearings |
| **Power Electronics** | 1 | 2.0% | Both | Power electronics (converters) for grid connection |
| **Blade Bearings** | 3 | 1.5% | Both | Bearings that attach blades to hub (pitch control) |
| **Yaw System** | 1 | 1.2% | Both | Systems that rotate nacelle to face wind |
| **Control System** | 1 | TBD | Both | Control and monitoring systems |
| **Transformer** | 1 | 1.0% | Both | Power transformers for grid connection |

## Data Structure Analysis

**Current Schema Path**: `settings.modules.cost.failureModels[]`

```javascript
// Each failure model in the array
{
  designLife: 20,
  componentCount: 100, // calculated from quantityPerWTG * numWTGs
  assumedFailureRate: 0.01, // as decimal
  majorComponent: {
    name: "Gearbox",
    description: "...",
    appliesTo: { geared: true, directDrive: false },
    quantityPerWTG: 1,
    defaultFailureRate: 3 // as percentage
  },
  historicalData: {
    type: 'none', // 'separate' | 'analysis' | 'none'
    data: [] // array of { year, failureRate }
  }
}
```

## UI Architecture Design

### 1. Master-Detail Layout Approach

```
┌─────────────────────────────────────────────────────────────────┐
│ Component Failure Rate Configuration                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────┐ ┌───────────────────────┐ │
│ │ COMPONENT LIST TABLE (Master)       │ │ EDIT PANEL (Detail)   │ │
│ │                                     │ │                       │ │
│ │ ┌─────────────────────────────────┐ │ │ Selected: Gearbox     │ │
│ │ │☑ Gearbox        │ 3.0% │ Edit  │ │ │                       │ │
│ │ │☑ Generator      │ 2.5% │ Edit  │ │ │ ContextField inputs   │ │
│ │ │☑ Main Bearing   │ 1.8% │ Edit  │ │ │ DistributionFieldV3   │ │
│ │ │☑ Power Elect.   │ 2.0% │ Edit  │ │ │                       │ │
│ │ │☐ Blade Bearings │ 1.5% │ Edit  │ │ │ [Save] [Cancel]       │ │
│ │ │☑ Yaw System     │ 1.2% │ Edit  │ │ │                       │ │
│ │ │☑ Control Sys.   │ 0.8% │ Edit  │ │ │                       │ │
│ │ │☑ Transformer    │ 1.0% │ Edit  │ │ │                       │ │
│ │ └─────────────────────────────────┘ │ │                       │ │
│ └─────────────────────────────────────┘ └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits**:
- All components visible at once
- Quick overview of enabled/disabled status
- Current failure rate values at-a-glance
- Focused editing area for selected component
- Space-efficient for 8 components

### 2. Component States & Visual Indicators

**Enabled Components**:
- ✅ Checkbox checked
- Normal text color
- Current failure rate displayed
- "Edit" button active

**Disabled Components**:
- ☐ Checkbox unchecked  
- Muted text color (gray)
- Rate shows as "Disabled"
- "Edit" button available but shows disabled state in panel

**Platform Filtering**:
- Gearbox: Only visible for "geared" platform type
- All others: Always visible

### 3. Failure Rate Display Strategy

**In Table View (Compact)**:
- Fixed values: "2.5%"
- Distributions: "2.1% - 2.8%" (P10-P90 range)
- Disabled: "Disabled"
- No data: "Not Set"

**Visual Encoding**:
- Fixed rates: Plain text
- Distribution rates: Small distribution icon + range
- Modified from default: Bold or colored text
- Validation errors: Red text/border

### 4. Editing Panel Design

When a component is selected for editing:

```
┌─────────────────────────────────────┐
│ Configure: Gearbox Failure Rates    │
├─────────────────────────────────────┤
│                                     │
│ ☑ Component Enabled                 │
│   ├─ ContextField toggle             │
│                                     │
│ Design Life (years)                 │
│   ├─ ContextField numeric input     │
│                                     │
│ Failure Rate Model                  │
│   ├─ DistributionFieldV3           │
│   │   ├─ Fixed: 3.0%               │
│   │   ├─ Normal: μ=3.0, σ=0.5     │  
│   │   ├─ Weibull: α=30, β=2       │
│   │   └─ Historical Data...        │
│                                     │
│ Historical Data (optional)          │
│   ├─ InlineEditTable for time      │
│       series data                  │
│                                     │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │    Save     │ │     Cancel     │ │
│ └─────────────┘ └─────────────────┘ │
└─────────────────────────────────────┘
```

## Technical Implementation Strategy

### 1. Component Structure

```javascript
// Main component
const ComponentFailureRatesConfig = () => {
  // State
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Context
  const { getValueByPath, updateByPath } = useScenario();
  
  // Data
  const failureModels = getValueByPath(['settings', 'modules', 'cost', 'failureModels'], []);
  const platformType = getValueByPath(['settings', 'project', 'windFarm', 'wtgPlatformType'], 'geared');
  const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20);
  
  // Component configuration
  const components = useMemo(() => getComponentsForPlatform(platformType), [platformType]);
  
  // Render master-detail layout
  return (
    <div className="component-failure-config">
      <ComponentListTable 
        components={components}
        failureModels={failureModels}
        onEdit={handleEdit}
        selectedComponent={selectedComponent}
      />
      <ComponentEditPanel
        component={selectedComponent}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};
```

### 2. Data Management Strategy

**ScenarioContext Integration**:
- Path: `['settings', 'modules', 'cost', 'failureModels']`
- Each component maps to an item in the failureModels array
- Enable/disable by adding/removing items from array
- Individual settings via nested ContextField paths

**Component Enable/Disable Logic**:
```javascript
// Check if component is enabled
const isComponentEnabled = (componentName) => {
  return failureModels.some(model => model.majorComponent.name === componentName);
};

// Enable component
const enableComponent = async (componentName) => {
  const newModel = createDefaultFailureModel(componentName, platformType, numWTGs);
  const updatedModels = [...failureModels, newModel];
  await updateByPath(['settings', 'modules', 'cost', 'failureModels'], updatedModels);
};

// Disable component
const disableComponent = async (componentName) => {
  const updatedModels = failureModels.filter(model => model.majorComponent.name !== componentName);
  await updateByPath(['settings', 'modules', 'cost', 'failureModels'], updatedModels);
};
```

### 3. Integration with Existing Components

**ContextField Usage**:
```jsx
// Enable/disable toggle
<ContextField
  path={`settings.modules.cost.failureModels[${index}].enabled`}
  fieldType="switch"
  label="Component Enabled"
/>

// Design life input
<ContextField
  path={`settings.modules.cost.failureModels[${index}].designLife`}
  fieldType="number"
  label="Design Life (years)"
  inputProps={{ min: 1, max: 50 }}
/>
```

**DistributionFieldV3 Usage**:
```jsx
// Failure rate distribution
<DistributionFieldV3
  path={`settings.modules.cost.failureModels[${index}].failureRateDistribution`}
  label="Failure Rate Model"
  helpText="Configure the failure rate as fixed value or probability distribution"
  distributionTypes={['fixed', 'normal', 'weibull', 'exponential']}
  defaultType="fixed"
/>
```

**InlineEditTable for Historical Data**:
```jsx
// Time series historical data
<InlineEditTable
  path={['settings', 'modules', 'cost', 'failureModels', index, 'historicalData', 'data']}
  dataFieldOptions={[
    { value: 'failureRate', label: 'Failure Rate (%)', type: 'number' }
  ]}
  yearRange={{ min: 1, max: 20 }}
  orientation="horizontal"
  showDataFieldSelector={false}
/>
```

## Space Efficiency Optimizations

### 1. Responsive Layout
- Desktop: Side-by-side master-detail (60/40 split)
- Tablet: Vertical stack with collapsible edit panel
- Mobile: Modal overlay for editing

### 2. Compact Table Design
- Fixed-width columns optimized for content
- Icons instead of text where appropriate
- Hover states for additional information
- Progressive disclosure for advanced options

### 3. Smart Defaults
- Platform-aware component filtering
- Auto-calculate component counts based on numWTGs
- Sensible default failure rate distributions
- Lazy loading of edit panel content

## Summary Metrics Integration

**Display Summary Information**:
- Total expected annual failures across all components
- Total expected annual costs from failures  
- Most critical components (highest risk)
- Coverage percentage (enabled vs total components)

```javascript
// Summary calculations
const calculateSummaryMetrics = (failureModels, numWTGs) => {
  const totalAnnualFailures = failureModels.reduce((sum, model) => {
    return sum + (model.assumedFailureRate * model.componentCount);
  }, 0);
  
  const enabledComponents = failureModels.length;
  const totalComponents = getComponentsForPlatform(platformType).length;
  const coveragePercentage = (enabledComponents / totalComponents) * 100;
  
  return { totalAnnualFailures, coveragePercentage };
};
```

This design provides a comprehensive, space-efficient solution for configuring component failure rates while leveraging existing UI patterns and maintaining consistency with the application's architecture.