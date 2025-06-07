# Table Theming System Documentation - v3.0

## Overview

The table theming system has been redesigned with a **semantic state-first architecture** to reduce maintenance overhead while improving predictability and orientation-agnostic design. This system supports both InlineEditTable and MetricsTable with consistent class hierarchies and state management.

## Core Architecture Decision

**Key Principle**: Semantic classes follow a strict hierarchy where Ant Design provides the foundation, and each layer only defines what it needs to change. States supersede markers, enabling predictable styling outcomes.

## Styling Hierarchy (Override Chain)

The system follows a clear cascade where each layer can override the previous:

```
1. Ant Design Base Styles (FOUNDATION - lowest precedence)
   ↓ (overrides)
2. Content Type Styles (.content.*)
   ↓ (overrides)  
3. Content Position Styles (.content.header overrides .content.data)
   ↓ (overrides)
4. Marker Styles (.marker.*) 
   ↓ (overrides)
5. State Styles (.state.*) - SUPERSEDES markers
   ↓ (overrides)
6. Combined State-Position (.state.header.*, .state.summary.*, .state.totals.*)
   ↓ (overrides)
7. Theme Object-Level Overrides (additionalStyles in composeTheme)
   ↓ (overrides)
8. Component Inline Style Injection (thresholds, marker colors) - HIGHEST precedence
```

### Example Override Chain:
```html
<!-- Selected milestone column header -->
<div class="content content.header marker.milestone state.selected state.header.selected"
     style="--marker-color: #52c41a;">
  Year +2
</div>
```

## Class Structure

### Content Types (Base Layer)
```css
.content              /* Base content styling */
.content.data         /* Data cell styling */
.content.header       /* Header cell styling - ALWAYS overrides .content.data */
.content.summary      /* Summary cells (bottom row horizontal, right col vertical) */
.content.totals       /* Totals cells (right col horizontal, bottom row vertical) */
```

### Marker Classes (Before States)
```css
.marker.milestone     /* Timeline milestone markers */
.marker.phase         /* Phase markers */
.marker.construction  /* Construction phase markers */
```

### State Classes (Override Markers)
```css
.state.selected       /* Selected column/row */
.state.primary        /* Primary column/row */
```

### State-Position Combinations (Highest Specificity)
```css
.state.header.selected    /* Selected header styling */
.state.header.primary     /* Primary header styling */
.state.summary.selected   /* Selected summary styling */
.state.totals.selected    /* Selected totals styling */
```

### Container Classes
```css
.table-theme-container    /* Theme container */
.table-base              /* Table base class */
```

## Class Concatenation System

**Key Principle**: CSS classes are defined separately and concatenated together in HTML elements. The cascade hierarchy is achieved through CSS specificity and source order, NOT through nested selectors.

### HTML Class Application Example:
```html
<!-- Selected milestone column header -->
<div class="table-base content content.header marker.milestone state.selected state.header.selected"
     style="--marker-color: #52c41a;">
  Year +2
</div>
```

### CSS Definition Pattern:
```css
/* Each class defined separately - NO nesting */
.table-base { /* base table styling */ }
.content { /* base content styling */ }
.content.header { /* header content styling */ }
.marker.milestone { /* milestone marker styling */ }
.state.selected { /* selected state styling */ }
.state.header.selected { /* selected header state styling */ }
```

**CSS Cascade Resolution**: 
- More specific classes (.state.header.selected) override less specific (.state.selected)
- Later classes in source order override earlier ones with same specificity
- Marker styles can be overridden by state styles due to source order

## Orientation-Agnostic Design

The class system works identically for both horizontal and vertical orientations:

### Horizontal Mode (Years as Columns)
- **Headers**: Top row contains year headers with `.content.header`
- **Selected Column**: Entire year column gets `.state.selected`
- **Markers**: Year columns with markers get `.marker.milestone`
- **Summary**: Bottom row gets `.content.summary`
- **Totals**: Right-most column gets `.content.totals`

### Vertical Mode (Years as Rows)  
- **Headers**: Left column contains year headers with `.content.header`
- **Selected Row**: Entire year row gets `.state.selected`
- **Markers**: Year rows with markers get `.marker.milestone`
- **Summary**: Right-most column gets `.content.summary`
- **Totals**: Bottom row gets `.content.totals`

## State Inheritance Logic

When a column/row is selected in either orientation:

1. **Header cells get**: `.content.header` + `.marker.*` + `.state.selected` + `.state.header.selected`
2. **Data cells get**: `.content.data` + `.marker.*` + `.state.selected`
3. **Summary cells get**: `.content.summary` + `.marker.*` + `.state.selected` + `.state.summary.selected`
4. **Totals cells get**: `.content.totals` + `.marker.*` + `.state.selected` + `.state.totals.selected`

**Key Rule**: `.state.selected` supersedes `.content.data` but not `.content.header`

## Available Themes

All themes implement the same semantic classes with theme-appropriate visual styling:

### Standard Theme
- **Purpose**: Clean styling close to Ant Design defaults
- **Characteristics**: Minimal overrides, relies heavily on Ant Design base

### Compact Theme  
- **Purpose**: Dense data entry and editing
- **Characteristics**: Tight padding (4-6px), small fonts (12-13px), clear borders

### Metrics Theme
- **Purpose**: Financial and numerical data display
- **Characteristics**: Center-aligned, rounded selection styling, emphasis on data hierarchy

### Timeline Theme
- **Purpose**: Timeline data with enhanced marker support
- **Characteristics**: Enhanced markers with visual indicators, phase-appropriate spacing

## Implementation Plan

### Files Requiring Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `TableThemes.md` | **Complete Rewrite** | This document - new architecture documentation |
| `TableThemeEngine.js` | **Extensive Refactoring** | New class generation utilities, hierarchy management |
| `TableThemes.js` | **Extensive Refactoring** | Complete CSS rewrite with semantic classes |
| `inline/TableConfiguration.js` | **Extensive Refactoring** | Update to use new class system, alignment with MetricsTable |
| `metrics/TableConfiguration.js` | **Moderate Refactoring** | Align patterns with InlineEditTable, use new classes |
| `metrics/MetricsCell.jsx` | **Minor Updates** | Apply new classes on top of existing component classes |
| `inline/EditableCell.jsx` | **Minor Updates** | Apply new classes on top of existing component classes |

### Detailed Change Requirements

#### TableThemeEngine.js - Extensive Refactoring
**New Functions Required:**
- `detectCellPosition(position)` - Detect summary/totals/header/data positions
- `getContentClasses(position)` - Generate content type classes
- `getMarkerClasses(marker)` - Generate marker classes (updated pattern)
- `getStateClasses(states, position)` - Generate state classes with position combinations
- `getCellClasses(config)` - Master function combining all class types
- `getMarkerStyles(marker)` - Generate CSS custom properties for markers

**Functions to Update:**
- `useTableTheme()` - Add new utility exports
- Update existing marker utilities to work with new hierarchy

#### TableThemes.js - Extensive Refactoring
**Complete CSS Rewrite Required:**
- Replace all existing granular classes with semantic hierarchy
- Implement new hierarchy for all 4 themes (standard, compact, metrics, timeline)
- Use CSS specificity to override Ant Design: `.table-base .ant-table-cell`
- Add CSS custom property support: `var(--marker-color)`
- Start with `.marker.milestone` only (expand later)

**CSS Structure Per Theme:**
```css
/* Content types */
.content { }
.content.data { }
.content.header { }
.content.summary { }
.content.totals { }

/* Markers */
.marker.milestone { }

/* States */
.state.selected { }
.state.primary { }

/* State-position combinations */
.state.header.selected { }
.state.header.primary { }
.state.summary.selected { }
.state.totals.selected { }
```

#### inline/TableConfiguration.js - Extensive Refactoring
**Functions to Update:**
- `generateHorizontalConfiguration()` - Use new `getCellClasses()` system
- `generateVerticalConfiguration()` - Use new `getCellClasses()` system  
- `generateTableColumns()` - Apply classes consistently across orientations
- Update render functions to use semantic classes
- Remove inline styles where possible, move to theme system
- Maintain `getCellData()` pattern for orientation switching

**Class Application Pattern:**
```javascript
// Replace current pattern:
const markerClasses = marker ? getMarkerClasses(marker, 'cell') : '';

// With new pattern:
const cellClasses = getCellClasses({
  position: { rowIndex, colIndex, totalRows, totalCols, isHeaderRow, isHeaderCol },
  states: { selected: isSelected, primary: isPrimary },
  marker: marker
});
```

#### metrics/TableConfiguration.js - Moderate Refactoring
**Align with InlineEditTable patterns:**
- Adopt same `getCellClasses()` usage pattern
- Move inline styles to theme system where possible
- Keep threshold coloring as inline injection (highest precedence)
- Maintain existing `generateMetricsTableColumns()` function signature
- Update `renderHeaderCell()` to use semantic classes

**Key Consistency Requirements:**
- Same class application pattern as InlineEditTable
- Same marker handling approach
- Same state management (selected/primary columns)

#### Component Updates - Minor Changes
**EditableCell.jsx & MetricsCell.jsx:**
- Receive complete class string from TableConfiguration
- Apply additional component-specific classes on top
- Maintain existing functionality and props
- No breaking changes to component APIs

### Migration Strategy

#### Phase 1: Core Infrastructure
1. Update TableThemeEngine.js with new utilities
2. Update TableThemes.js with semantic classes
3. Test class generation and CSS output

#### Phase 2: Table Integration  
1. Update InlineEditTable TableConfiguration.js
2. Update MetricsTable TableConfiguration.js
3. Ensure pattern consistency between table types

#### Phase 3: Component Integration
1. Update EditableCell.jsx and MetricsCell.jsx
2. Test complete integration
3. Visual regression testing

#### Phase 4: Cleanup
1. Remove unused granular classes
2. Remove old utility functions
3. Update imports and references

## Technical Considerations

### CSS Custom Properties
- `--marker-color` set at column/row level via CSS classes
- Individual cells can override if needed via inline styles
- Available throughout hierarchy for consistent marker theming

### Ant Design Override Strategy
- Use CSS specificity: `.table-base .ant-table-cell` pattern
- Load our styles after Ant Design
- Only override what we need to change
- Preserve Ant Design functionality as foundation

### Marker System
- Support dynamic marker types via class generation
- Start with `.marker.milestone` only (currently in use)
- Don't predefine all possibilities in themes
- Separate marker classes: `.marker.milestone .state.selected`

### Performance Considerations
- CSS-in-JS remains cached per theme
- Reduced total classes improve CSS parsing
- Semantic hierarchy improves cascade efficiency
- No performance regression expected

### Backward Compatibility
**Breaking Changes:**
- All theme CSS classes change
- TableConfiguration render functions change  
- Class application patterns change
- Import statements may need updates

**Preserved Features:**
- Theme switching functionality
- Marker color injection
- State management (selected/primary)
- EditableCell and MetricsCell APIs
- Component prop interfaces

## Testing Requirements

### Visual Regression Testing
- Test all 4 themes before/after changes
- Test horizontal/vertical orientation switching
- Test marker system functionality
- Test selected/primary column states
- Test summary/totals positioning

### Functional Testing
- Verify theme portability between table types
- Test marker color injection
- Test state inheritance logic
- Validate CSS hierarchy precedence
- Test threshold coloring override

### Integration Testing
- InlineEditTable with all themes
- MetricsTable with all themes
- EditableCell functionality preservation
- Component prop interface stability

## Future Extensibility

### Adding New Themes
```javascript
// CSS follows same semantic structure
newTheme: {
  '.content': { /* base styling */ },
  '.content.header': { /* header styling */ },
  '.state.selected': { /* selection styling */ },
  '.marker.milestone': { /* marker styling */ }
}
```

### Adding New Marker Types
```javascript
// Dynamic class generation supports new types
const newMarker = { type: 'deadline', color: '#ff4d4f' };
// Automatically generates: .marker.deadline
```

### Adding New States
```css
/* Easy to extend state system */
.state.highlighted { /* new state */ }
.state.header.highlighted { /* state-position combination */ }
```

This architecture maintains all existing functionality while significantly improving maintainability and predictability of the theming system.


# Table Theming System v3.0 Implementation Plan | 2025-01-07

**Legend:** ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

## Phase 1: Core Infrastructure 🏗️ 🏷️Critical
- ☐ P1-1 Update TableThemeEngine.js with new class generation utilities
- ☐ P1-2 Create detectCellPosition() function
- ☐ P1-3 Create getContentClasses() function  
- ☐ P1-4 Create getMarkerClasses() function (updated pattern)
- ☐ P1-5 Create getStateClasses() function with position combinations
- ☐ P1-6 Create getCellClasses() master function
- ☐ P1-7 Update getMarkerStyles() for CSS custom properties
- ☐ P1-8 Update useTableTheme() hook with new utilities

## Phase 2: CSS Theme Definitions 🎨 🏷️Critical  
- ☐ P2-1 Update TableThemes.js createThemeStyles() function
- ☐ P2-2 Implement standard theme with semantic hierarchy
- ☐ P2-3 Implement compact theme with semantic hierarchy
- ☐ P2-4 Implement metrics theme with semantic hierarchy
- ☐ P2-5 Implement timeline theme with semantic hierarchy
- ☐ P2-6 Add CSS custom property support for markers
- ☐ P2-7 Test CSS generation and hierarchy precedence

## Phase 3: InlineEditTable Integration 📊 🏷️Critical
- ☐ P3-1 Update inline/TableConfiguration.js imports
- ☐ P3-2 Update generateHorizontalConfiguration() with getCellClasses()
- ☐ P3-3 Update generateVerticalConfiguration() with getCellClasses()
- ☐ P3-4 Update render functions to use semantic classes
- ☐ P3-5 Remove inline styles where moved to themes
- ☐ P3-6 Update EditableCell.jsx class application
- ☐ P3-7 Test horizontal/vertical orientation switching

## Phase 4: MetricsTable Integration 📈 🏷️Critical
- ☐ P4-1 Update metrics/TableConfiguration.js imports
- ☐ P4-2 Align generateMetricsTableColumns() with InlineEditTable patterns
- ☐ P4-3 Update renderHeaderCell() to use semantic classes
- ☐ P4-4 Move inline styles to theme system where possible
- ☐ P4-5 Update MetricsCell.jsx class application
- ☐ P4-6 Preserve threshold coloring as inline injection
- ☐ P4-7 Test state changes (selected/primary) functionality

## Phase 5: Testing & Validation 🧪 🏷️High
- ☐ P5-1 Visual regression test all themes
- ☐ P5-2 Test marker system functionality  
- ☐ P5-3 Test state inheritance logic
- ☐ P5-4 Test theme portability between table types
- ☐ P5-5 Validate CSS hierarchy precedence
- ☐ P5-6 Test EditableCell and MetricsCell integration

## Phase 6: Cleanup & Documentation 🔥 🏷️Medium
- ☐ P6-1 Remove unused granular classes from themes
- ☐ P6-2 Remove old utility functions from TableThemeEngine
- ☐ P6-3 Update any remaining import statements
- ☐ P6-4 Update TableThemes.md with implementation results
- ☐ P6-5 Performance validation - ensure no regressions

---

## Technical Considerations

### New Class Hierarchy & Precedence Chain
```
1. Ant Design Base Styles (foundation)
   ↓
2. Marker Styles (.marker.*) - HIGHEST theme precedence  
   ↓
3. Content Type Styles (.content.*)
   ↓
4. Content Position Styles (.content.header, .content.summary, .content.totals)
   ↓
5. State Styles (.state.*)
   ↓
6. Combined State-Position (.state.header.*, .state.summary.*, .state.totals.*)
   ↓
7. Theme Object-Level Overrides (additionalStyles in composeTheme)
   ↓
8. Component Inline Style Injection (thresholds, marker colors)
```

**Class Structure:**
```css
/* Markers - HIGHEST theme precedence */
.marker.milestone           /* Milestone marker styling */
.marker.phase              /* Phase marker styling */ 
.marker.construction       /* Construction marker styling */

/* Content Types */
.content                   /* Base content styling */
.content.data             /* Data cell styling */
.content.header           /* Header cell styling */
.content.summary          /* Summary cells (bottom row horiz, right col vert) */
.content.totals           /* Totals cells (right col horiz, bottom row vert) */

/* States */
.state.selected           /* Selected column/row */
.state.primary            /* Primary column/row */

/* State-Position Combinations */
.state.header.selected    /* Selected header styling */
.state.header.primary     /* Primary header styling */
.state.summary.selected   /* Selected summary styling */
.state.totals.selected    /* Selected totals styling */

/* CSS Custom Properties */
--marker-color            /* Injected marker color for themes to use */
```

### Code Patterns to Maintain
- Keep getCellData() pattern from both tables
- Maintain onHeaderCell/onCell pattern consistency  
- Preserve marker color injection via CSS custom properties
- Keep theme composition and override patterns
- Maintain EditableCell integration approach

### Breaking Changes Expected
- All theme CSS classes change
- TableConfiguration.js render functions change
- Class application in MetricsCell.jsx changes
- Marker class names may change
- Some inline styles move to theme classes