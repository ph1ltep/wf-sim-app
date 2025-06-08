# Table Theming System Documentation - v3.1 Updated

## Overview

The table theming system provides a **semantic state-first architecture** with class concatenation for styling InlineEditTable and MetricsTable components. The system uses separate CSS class definitions that are concatenated in HTML to achieve a predictable hierarchy while minimizing maintenance overhead.

## Core Architecture

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Semantic Classes** | Class names describe purpose, not structure (`.content-header` vs `.year-column-header`) |
| **Class Concatenation** | CSS classes defined separately, combined in HTML (`class="table-base content content-cell marker-milestone state-selected"`) |
| **Hierarchy via Specificity** | More specific classes override less specific ones (`.state-header-selected` > `.state-selected`) |
| **Element-Appropriate Placement** | Classes applied to correct HTML elements (`content-row` on `<tr>`, `content-cell` on `<td>`) |

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

## Class Structure & Placement

### Container Classes
- `.table-theme-container` - Theme container wrapper
- `.table-base` - Table base class, included in all cells

### Content Type Classes
- `.content` - Base content styling (minimal, let Ant Design handle most)

### Content Structure Classes (UPDATED)
- `.content-cell` - Individual cell styling (applied to `<td>` elements)
- `.content-row` - Row-level styling (applied to `<tr>` elements via `onRow`)
- `.content-col` - Column-level styling (applied to cells in vertical orientation only)

**IMPORTANT:** Class placement has been corrected:
- `content-row` → Applied to `<tr>` elements via `onRow` prop
- `content-cell` → Applied to `<td>` elements via `onCell` prop  
- `content-col` → Applied to `<td>` elements in vertical orientation (not `<col>` elements)

### Content Position Classes
- `.content-subheader` - Sub-header styling (first column horizontal, first row vertical) - **MUTUALLY EXCLUSIVE with `.content-header`**
- `.content-header` - Main header styling (actual table headers) - **SUPERSEDES and EXCLUDES `.content-subheader`**
- `.content-summary` - Summary cells (bottom row horizontal, right column vertical)
- `.content-totals` - Totals cells (right column horizontal, bottom row vertical)

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
// Returns: "table-base content content-cell marker-milestone state-selected"

// Generate row classes for <tr> elements
const rowClasses = getRowClasses('horizontal');
// Returns: "content-row"
```

### HTML Class Application

**UPDATED:** Correct element targeting for classes:

```html
<!-- Correct class placement -->
<tr class="content-row">
  <td class="table-base content content-cell content-subheader">Contract Alpha</td>
  <td class="table-base content content-cell marker-milestone state-selected" 
      style="--marker-color: #52c41a;">
    Year +2
  </td>
</tr>
```

### Table Component Integration

Both InlineEditTable and MetricsTable use this pattern:

```javascript
// 1. Import the utilities
import { useTableTheme, getRowClasses } from './shared/TableThemeEngine';

// 2. Apply row classes via onRow
<Table
  onRow={(record) => ({
    className: getRowClasses(orientation)
  })}
  columns={columns}
  // ... other props
/>

// 3. Apply cell classes via onCell in column definitions
onCell: (record, rowIndex) => ({
  className: getCellClasses({ position, states, marker }),
  style: getMarkerStyles(marker)
})
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

## Ant Design Override Strategies

### Common Override Patterns

The theming system provides several strategies for overriding Ant Design's default behaviors:

#### 1. Row Hover Effects

**Default Ant Design Behavior:** Light gray background on row hover
**Our Override:** Respects existing cell colors and applies contextual darkening

```css
.ant-table-tbody > tr:hover > td {
  backgroundColor: color-mix(in srgb, currentColor 5%, var(--marker-color, transparent) 20%) !important;
}
```

**How it works:**
- `currentColor 5%` - Slightly darkens the existing background
- `var(--marker-color, transparent) 20%` - Blends in marker color when present
- Falls back to `transparent` when no marker color is set
- Respects all existing cell states (selected, markers, etc.)

#### 2. Disable Default Hover (Alternative)

```css
.ant-table-tbody > tr:hover > td {
  background-color: inherit !important;
}
```

#### 3. Selective Hover Re-enabling

```css
.ant-table-tbody > tr:hover > td.state-selected {
  backgroundColor: rgba(22, 119, 255, 0.12) !important;
}
```

#### 4. Header Styling Override

```css
.ant-table-thead > tr > th {
  padding: 4px 8px;
  backgroundColor: #fafafa;
  borderBottom: 1px solid #f0f0f0;
}
```

#### 5. Border and Spacing Overrides

```css
.ant-table-container {
  borderTop: none;
}

.ant-table-thead > tr > th::before {
  display: none; /* Remove column resize handles */
}
```

### Advanced Color Mixing Techniques

#### Using CSS `color-mix()` for Dynamic Colors

```css
/* Darken any background by 10% */
.my-cell:hover {
  backgroundColor: color-mix(in srgb, currentColor 90%, black 10%);
}

/* Blend with theme colors */
.marker-milestone {
  backgroundColor: color-mix(in srgb, var(--marker-color) 10%, transparent 90%);
}

/* Complex multi-color blending */
.state-selected:hover {
  backgroundColor: color-mix(in srgb, 
    var(--primary-color) 15%, 
    var(--marker-color, transparent) 10%, 
    currentColor 75%
  );
}
```

#### CSS Custom Properties for Dynamic Theming

```css
/* Set at component level */
.table-base {
  --primary-color: #1677ff;
  --primary-rgb: 22, 119, 255;
  --marker-color: transparent; /* Default, overridden per cell */
}

/* Use in styles */
.state-selected {
  backgroundColor: rgba(var(--primary-rgb), 0.08);
}
```

## Orientation-Agnostic Design

The same class system works for both horizontal and vertical orientations:

### Horizontal Mode (Years as Columns)
- Headers: Top row (`.content-header` on `<td>`)
- Row styling: Each `<tr>` gets `.content-row`
- Selected Column: Entire year column gets `.state-selected` on cells
- Summary: Bottom row gets `.content-summary`
- Totals: Right-most column gets `.content-totals`

### Vertical Mode (Years as Rows)
- Headers: Left column (`.content-header` on `<td>`)
- Row styling: Each `<tr>` gets `.content-row`
- Column styling: Cells also get `.content-col` when in vertical mode
- Selected Row: Entire year row gets `.state-selected` on cells
- Summary: Right-most column gets `.content-summary`
- Totals: Bottom row gets `.content-totals`

## CSS Custom Properties

Marker colors and theme values are injected via CSS custom properties:

```css
.marker-milestone {
  border-left: 3px solid var(--marker-color, #52c41a);
  background-color: color-mix(in srgb, var(--marker-color, #52c41a) 5%, transparent);
}
```

Applied via inline styles on elements:
```javascript
style={{
  '--marker-color': marker.color,
  '--primary-color': token.colorPrimary
}}
```

## Migration Notes

When updating existing components:

1. **Import getRowClasses** and apply via `onRow` prop on Table components
2. **Verify class placement** - `content-row` should only appear on `<tr>` elements
3. **Update hover overrides** - Use the new color-mix pattern for better color blending
4. **Test orientation switching** - Ensure classes apply correctly in both modes
5. **Preserve threshold coloring** as inline injection (highest precedence)

## Best Practices

### Do ✅
- Use `getCellClasses()` for all cell class generation
- Use `getRowClasses()` for row class generation via `onRow`
- Apply semantic classes to correct HTML elements
- Use CSS custom properties for dynamic values (marker colors)
- Use `color-mix()` for sophisticated color blending
- Test both orientations when making changes

### Don't ❌
- Don't apply `content-row` to `<td>` elements
- Don't try to use `<col>` elements for `content-col` classes
- Don't override Ant Design hover without considering existing cell states
- Don't use nested CSS selectors in theme definitions
- Don't hardcode colors when CSS custom properties are available

## Future Extensibility

### Adding New Hover Effects

```css
/* Custom hover pattern */
.my-theme .ant-table-tbody > tr:hover > td {
  backgroundColor: color-mix(in srgb, 
    var(--hover-color, #f0f0f0) 30%, 
    currentColor 70%
  ) !important;
  transition: background-color 0.2s ease;
}
```

### Adding New Marker Types

```javascript
// Dynamic class generation supports new types
const newMarker = { type: 'deadline', color: '#ff4d4f' };
// Automatically generates: .marker-deadline
```

### Adding New States

```css
/* Easy to extend state system */
.state-highlighted { 
  outline: 2px solid var(--highlight-color);
}
.state-header-highlighted { 
  background-color: color-mix(in srgb, var(--highlight-color) 15%, currentColor 85%);
}
```

This architecture maintains all existing functionality while providing sophisticated color handling and proper semantic class placement across all table elements.