# Table Theming System Documentation - v3.0 Final

## Overview

The table theming system provides a **semantic state-first architecture** with class concatenation for styling InlineEditTable and MetricsTable components. The system uses separate CSS class definitions that are concatenated in HTML to achieve a predictable hierarchy while minimizing maintenance overhead.

## Core Architecture

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Semantic Classes** | Class names describe purpose, not structure (`.content-header` vs `.year-column-header`) |
| **Class Concatenation** | CSS classes defined separately, combined in HTML (`class="table-base content content-cell content-row marker-milestone state-selected"`) |
| **Hierarchy via Specificity** | More specific classes override less specific ones (`.state-header-selected` > `.state-selected`) |
| **Minimal Overrides** | Only define what needs to change from Ant Design defaults |

### Styling Hierarchy (Override Chain)

```
1. Ant Design Base Styles (foundation - lowest precedence)
   ↓ overrides
2. Content Type Styles (.content)
   ↓ overrides
3. Content Structure Styles (.content-cell, .content-row, .content-col)
   ↓ overrides
4. Content Position Styles (.content-subheader, .content-header, .content-summary, .content-totals)
   ↓ overrides  
5. Marker Styles (.marker-*)
   ↓ overrides
6. State Styles (.state-*) - supersedes markers
   ↓ overrides
7. State-Position Combinations (.state-header-*, .state-summary-*, .state-totals-*)
   ↓ overrides
8. Content Tag Styles (.content-tag) - for Ant Design tags within tables
   ↓ overrides
9. Theme Object-Level Overrides (additionalStyles in composeTheme)
   ↓ overrides
10. Component Inline Style Injection (thresholds, marker colors) - highest precedence
```

## Class Structure

### Container Classes
- `.table-theme-container` - Theme container wrapper
- `.table-base` - Table base class, included in all cells

### Content Type Classes
- `.content` - Base content styling (minimal, let Ant Design handle most)

### Content Structure Classes (NEW)
- `.content-cell` - Individual cell styling (replaces old `.content-data`)
- `.content-row` - Row-level styling (horizontal orientation)
- `.content-col` - Column-level styling (vertical orientation)

### Content Position Classes
- `.content-subheader` - Sub-header styling (first column horizontal, first row vertical) - **MUTUALLY EXCLUSIVE with `.content-header`**
- `.content-header` - Main header styling (actual table headers) - **SUPERSEDES and EXCLUDES `.content-subheader`**
- `.content-summary` - Summary cells (bottom row horizontal, right column vertical)
- `.content-totals` - Totals cells (right column horizontal, bottom row vertical)

**Important**: `.content-header` and `.content-subheader` are mutually exclusive. A cell will get one OR the other, never both.

### Marker Classes
- `.marker-milestone` - Timeline milestone markers
- `.marker-phase` - Phase markers
- `.marker-construction` - Construction phase markers

### State Classes
- `.state-selected` - Selected column/row
- `.state-primary` - Primary column/row

### State-Position Combinations
- `.state-header-selected` - Selected header styling
- `.state-header-primary` - Primary header styling
- `.state-subheader-selected` - Selected subheader styling
- `.state-subheader-primary` - Primary subheader styling
- `.state-summary-selected` - Selected summary styling
- `.state-totals-selected` - Selected totals styling

### Content Tag Classes
- `.content-tag` - Ant Design tags within table cells

## Implementation

### Class Generation

Classes are generated using utility functions that return space-separated strings:

```javascript
// Generate complete classes for a data cell
const cellClasses = getCellClasses({
  position: { 
    rowIndex: 1, 
    colIndex: 2, 
    totalRows: 5, 
    totalCols: 4, 
    isHeaderRow: false, 
    isHeaderCol: false,
    orientation: 'horizontal'
  },
  states: { selected: true, primary: false },
  marker: { type: 'milestone', color: '#52c41a' },
  orientation: 'horizontal'
});
// Returns: "table-base content content-cell content-row marker-milestone state-selected"

// Generate classes for a subheader (first column in horizontal mode)
const subheaderClasses = getCellClasses({
  position: { 
    rowIndex: 1, 
    colIndex: 0,  // First column = subheader in horizontal mode
    totalRows: 5, 
    totalCols: 4, 
    isHeaderRow: false, 
    isHeaderCol: true,
    orientation: 'horizontal'
  },
  states: {},
  marker: null,
  orientation: 'horizontal'
});
// Returns: "table-base content content-cell content-row content-subheader"
```

### HTML Output Examples

```html
<!-- Selected milestone data cell in horizontal mode -->
<div class="table-base content content-cell content-row marker-milestone state-selected"
     style="--marker-color: #52c41a;">
  <span>Year +2</span>
  <Tag className="content-tag">COD</Tag>
</div>

<!-- Contract name subheader in horizontal mode -->
<div class="table-base content content-cell content-row content-subheader">
  Contract Alpha
</div>

<!-- Year header with marker in vertical mode -->
<div class="table-base content content-cell content-col content-subheader marker-milestone"
     style="--marker-color: #52c41a;">
  <span>Year +2</span>
  <Tag className="content-tag">COD</Tag>
</div>
```

### CSS Custom Properties

Marker colors are injected via CSS custom properties:

```css
.marker.milestone {
  border-left: 3px solid var(--marker-color, #52c41a);
  background-color: color-mix(in srgb, var(--marker-color, #52c41a) 5%, transparent);
}
```

## Available Themes

### Theme Comparison

| Theme | Purpose | Key Characteristics | Use Cases | Special Features |
|-------|---------|-------------------|-----------|------------------|
| **Standard** | Clean Ant Design styling | Minimal overrides, medium spacing | General purpose tables | Basic subheader styling |
| **Compact** | Dense data entry | Tight padding (4-6px), small fonts (12-13px), bordered selection | InlineEditTable, data input | Compact subheaders, smaller tags |
| **Metrics** | Financial data display | Center-aligned, rounded aesthetics, numerical focus | MetricsTable, financial dashboards | Left-aligned subheaders for labels |
| **Timeline** | Enhanced markers | Visual timeline indicators, pseudo-elements for milestones | Project timelines, construction phases | **Column spreading**, enhanced subheader borders |

### Theme Portability

Any theme works with any table type because all themes implement the same semantic classes:

```javascript
// InlineEditTable can use any theme
<InlineEditTable theme="metrics" />   // Center-aligned numbers
<InlineEditTable theme="timeline" />  // Enhanced markers

// MetricsTable can use any theme  
<MetricsTable theme="compact" />      // Dense borders
<MetricsTable theme="standard" />     // Clean minimal
```

## Orientation-Agnostic Design

The same class system works for both horizontal and vertical orientations:

### Horizontal Mode (Years as Columns)
- Headers: Top row (`.content.header`)
- Selected Column: Entire year column (`.state.selected`)
- Summary: Bottom row (`.content.summary`)
- Totals: Right-most column (`.content.totals`)

### Vertical Mode (Years as Rows)
- Headers: Left column (`.content.header`) 
- Selected Row: Entire year row (`.state.selected`)
- Summary: Right-most column (`.content.summary`)
- Totals: Bottom row (`.content.totals`)

## Integration Guide

### Table Components

Both InlineEditTable and MetricsTable use identical patterns:

```javascript
// 1. Generate semantic classes for each cell
const cellClasses = getCellClasses({ position, states, marker });

// 2. Apply to container element
<div className={cellClasses} style={getMarkerStyles(marker)}>
  <Component value={value} />
</div>

// 3. Use onHeaderCell/onCell for column-wide classes
onCell: (record, rowIndex) => ({
  className: getCellClasses({ position, states, marker }),
  style: getMarkerStyles(marker)
})
```

### Component Architecture

```
TableConfiguration.js
├── Generates semantic classes via getCellClasses()
├── Applies classes to container elements
└── Components focus on their core functionality
    ├── EditableCell: Editing logic + validation
    └── MetricsCell: Value formatting + threshold styling
```

## Theme Development

### Adding New Themes

1. **Define base configuration**:
```javascript
// In BASE_TABLE_THEMES
myTheme: {
  name: 'MyTheme',
  containerClass: 'table-theme-container',
  tableClass: 'table-base', 
  table: { size: 'small', bordered: true }
}
```

2. **Define CSS classes** (only override what's needed):
```javascript
// In createThemeStyles()
myTheme: {
  '.content': { fontSize: '14px' },
  '.state.selected': { backgroundColor: '#e6f7ff' },
  '.marker.milestone': { borderLeft: '3px solid var(--marker-color)' }
}
```

### Adding New Marker Types

Marker types are generated dynamically from data:

```javascript
const newMarker = { type: 'deadline', color: '#ff4d4f' };
// Automatically generates: .marker.deadline class
```

Add styling to themes as needed:
```css
.marker.deadline {
  border: '2px solid var(--marker-color)',
  background-color: 'transparent'
}
```

## Technical Details

### CSS Specificity Strategy

Classes are ordered by specificity to ensure proper cascade:

| Specificity | Class Example | Purpose | Notes |
|-------------|---------------|---------|-------|
| Low | `.content` | Base styling | Foundation layer |
| Low-Medium | `.content-cell`, `.content-row`, `.content-col` | Structure styling | Layout-specific |
| Medium | `.content-subheader` | Position styling | Orientation-aware |
| Medium-High | `.content-header` | Position styling | Supersedes subheader |
| High | `.marker-milestone` | Feature styling | Timeline markers |
| Higher | `.state-selected` | Interaction styling | User states |
| Highest | `.state-header-selected` | Combined feature + interaction | Most specific |

### Timeline Theme Column Spreading

The timeline theme includes special `.content-col` styling for improved layout:

```css
.content-col {
  minWidth: '120px',
  width: 'auto', 
  flex: '1 1 auto'  /* Columns spread across available width */
}
```

This ensures timeline columns distribute evenly across the screen width rather than bunching up on the left.

### Performance Considerations

- **CSS-in-JS caching**: Styles cached per theme instance
- **Minimal class generation**: Only generate classes when needed
- **Reduced CSS output**: ~60% fewer classes than previous system
- **Efficient cascade**: CSS specificity handles hierarchy

### Breaking Changes from v2.x

| Old Pattern | New Pattern | Reason |
|-------------|-------------|--------|
| Nested CSS selectors | Separate class definitions | Class concatenation system |
| Component-specific classes | Semantic content classes | Better reusability |
| Inline style overrides | Theme-based styling | Cleaner separation |
| Manual class composition | `getCellClasses()` utility | Consistent generation |

## Migration Notes

When updating existing components:

1. **Replace manual class composition** with `getCellClasses()`
2. **Move inline styles to themes** where possible
3. **Use semantic position data** instead of hardcoded classes
4. **Preserve threshold coloring** as inline injection (highest precedence)
5. **Update imports** to use new utilities from TableThemeEngine

## Best Practices

### Do ✅
- Use `getCellClasses()` for all cell class generation
- Apply semantic classes to container elements
- Preserve component focus (EditableCell = editing, MetricsCell = formatting)
- Use CSS custom properties for dynamic values (marker colors)
- Define only needed overrides in themes

### Don't ❌
- Don't generate classes manually
- Don't apply semantic classes directly to functional components
- Don't override Ant Design basics unless theme specifically needs it
- Don't use nested CSS selectors in theme definitions
- Don't create component-specific classes (use semantic ones)

This architecture provides a maintainable, predictable theming system that scales across table types while minimizing complexity and maximizing reusability.