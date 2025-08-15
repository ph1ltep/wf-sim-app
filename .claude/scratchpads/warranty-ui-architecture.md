# Warranty Configuration UI Architecture Design

## Problem Analysis

### Warranty Complexity Dimensions
1. **Time-varying terms** - Different rules across project lifetime periods
2. **Component-specific coverage** - Different warranties for different components
3. **Multiple cap types** - Event caps, financial caps, rolling caps  
4. **Coverage exclusions/inclusions** - Complex rule definitions
5. **Duration modifications** - Downtime impact reductions
6. **Strategic spares** - Pre-positioning effects on warranty performance

### Key UI Design Challenges
- Making complex multi-dimensional configuration understandable
- Visualizing time-varying warranty coverage effectively
- Showing real-time impact on different cost components
- Balancing power-user complexity with beginner usability
- Progressive disclosure of advanced features

## UI Architecture Strategy

### 1. Progressive Disclosure Hierarchy

#### Level 1: Warranty Templates (Beginner Mode)
- Pre-configured industry standard warranty packages
- Simple toggle selection with clear descriptions
- Immediate preview of key terms and financial impact

#### Level 2: Component-Specific Configuration (Intermediate)
- Component category tabs (Gearbox, Generator, Blades, etc.)
- Per-component warranty term configuration
- Time-period aware settings

#### Level 3: Advanced Custom Configuration (Expert)
- Full multi-dimensional warranty matrix
- Complex cap structures and exclusions
- Strategic spares and pre-positioning modeling

### 2. Core UI Patterns

#### WarrantyConfigurationCard
- Uses Antd Card with tabbed interface
- Integrates with existing ContextField patterns
- Supports both template and custom modes

#### WarrantyTimelineVisualization
- Interactive timeline showing warranty coverage periods
- Component-specific coverage visualization
- Real-time financial impact preview

#### WarrantyTermMatrix
- Multi-dimensional configuration grid
- Component × Time Period × Coverage Type
- Progressive disclosure of complexity

#### WarrantyImpactPreview
- Real-time calculation of warranty effects
- Integration with existing cost/failure modeling
- Monte Carlo simulation support

### 3. Data Structure Design

```javascript
// Warranty Configuration Schema
warrantyConfiguration: {
  // Mode selection
  configurationMode: 'template' | 'component' | 'advanced',
  
  // Template-based configuration
  template: {
    selectedTemplate: 'comprehensive' | 'basic' | 'performance' | 'custom',
    customizations: {} // Template modifications
  },
  
  // Component-specific warranties
  componentWarranties: {
    [componentType]: {
      enabled: boolean,
      coveragePeriods: [{
        startYear: number,
        endYear: number,
        terms: WarrantyTerms
      }],
      exclusions: [],
      inclusions: [],
      strategicSpares: {}
    }
  },
  
  // Advanced configuration
  advanced: {
    multiComponentTerms: {},
    complexCaps: {},
    performanceGuarantees: {}
  }
}

// Warranty Terms Structure
WarrantyTerms: {
  // Coverage types
  comprehensiveCoverage: boolean,
  componentSpecificCoverage: {},
  performanceGuarantees: {},
  
  // Financial caps
  caps: {
    eventCaps: DistributionType,
    annualCaps: DistributionType,
    rollingCaps: {},
    lifetimeCaps: DistributionType
  },
  
  // Duration modifications
  downtimeReductions: {
    guaranteedResponseTime: DistributionType,
    guaranteedRepairTime: DistributionType,
    liquidatedDamages: {}
  },
  
  // Strategic provisions
  strategicSpares: {
    prePositioning: boolean,
    spareComponents: [],
    logistics: {}
  }
}
```

### 4. Component Integration Strategy

#### Leveraging Existing Patterns
- **ContextField** for all form inputs with warranty path integration
- **DistributionFieldV3** for uncertainty modeling in warranty terms
- **EditableTable** for time-varying warranty periods
- **FormSection/FormRow/FormCol** for layout consistency

#### New Components Needed
1. **WarrantyTemplateSelector** - Template selection with preview
2. **WarrantyTimelinePicker** - Interactive time period selection
3. **ComponentWarrantyMatrix** - Multi-dimensional configuration
4. **WarrantyImpactVisualization** - Real-time financial impact
5. **WarrantyTermsBuilder** - Advanced term construction

## Implementation Phases

### Phase 1: Foundation & Templates
1. Basic warranty schema integration
2. Template selector component
3. Simple warranty impact calculation
4. Integration with existing cost modeling

### Phase 2: Component-Specific Configuration
1. Component-based warranty configuration
2. Time-varying warranty terms
3. Enhanced impact visualization
4. Monte Carlo integration

### Phase 3: Advanced Features
1. Complex cap structures
2. Strategic spares modeling
3. Performance guarantee tracking
4. Advanced exclusion/inclusion rules

## Key Design Principles

1. **Context-Aware Defaults** - Smart defaults based on component type and project characteristics
2. **Real-Time Feedback** - Immediate visualization of warranty impact on costs
3. **Progressive Complexity** - Clear path from simple to advanced configuration
4. **Financial Integration** - Deep integration with existing cost and failure models
5. **Industry Standards** - Pre-built templates for common warranty structures
6. **Uncertainty Support** - Distribution-based warranty term modeling

## Success Metrics

1. **Usability** - Beginners can configure basic warranties in <5 minutes
2. **Power User Efficiency** - Advanced users can model complex warranties
3. **Accuracy** - Warranty impact calculations integrate seamlessly with Monte Carlo
4. **Maintainability** - Leverages existing component patterns and contexts
5. **Extensibility** - Easy to add new warranty types and terms