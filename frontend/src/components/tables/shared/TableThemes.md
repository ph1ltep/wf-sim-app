 # Table Theming System Documentation - v2.0
 
 ## Overview
 
 The table theming system provides a standardized, hierarchical approach to styling tables across the application. It supports multiple table types (MetricsTable, InlineEditTable) with consistent state classes while allowing each theme to define its complete visual implementation.
 
 ## Core Architecture Decision
 
 **Key Principle**: Each theme is self-contained and defines complete styling. There are no universal base classes that get overridden. Ant Design provides the foundation, and each theme only overrides what it needs to change.
 
 ## Styling Hierarchy (Override Chain)
 
 The system follows a clear cascade of styling precedence:
 
 ```
 1. Ant Design Base Theme (foundation - handles all basic table behavior)
    ↓
 2. Our Theme System (theme-specific CSS classes - complete per theme)
    ↓  
 3. Card/Component Level Overrides (CSS-in-JS additionalStyles)
    ↓
 4. Inline Styles from Props/Data (marker colors, threshold overrides)
 ```
 
 ### Example Override Chain:
 ```javascript
 // 1. Ant Design provides all base table functionality
 <Table size="small" bordered={true} /> // Ant Design handles padding, borders, etc.
 
 // 2. Theme system adds specific styling per theme
 <Table className="table-base" /> // compact theme has different .cell-selected than metrics
 
 // 3. Card/component adds specific overrides
 <InlineEditTable 
   additionalStyles={{
     '.marker-type-construction': { backgroundColor: '#fa8c16' }
   }}
 />
 
 // 4. Data-driven inline styles (highest priority)
 <div style={{ '--marker-color': marker.color }} />
 ```
 
 ## Available Themes
 
 ### Standard Theme
 - **Purpose**: Clean, minimal styling close to Ant Design defaults
 - **Use Case**: General purpose tables where Ant Design styling is sufficient
 - **Characteristics**: Minimal overrides, medium Ant Design sizing
 - **Class Names**: Uses standard `.cell-selected`, `.header-primary` etc.
 
 ### Compact Theme  
 - **Purpose**: Dense data entry and editing with clear visual boundaries
 - **Use Case**: InlineEditTable, data input forms, CapexDrawdownCard
 - **Characteristics**: Tight padding (4-6px), small fonts (12-13px), bordered, fafafa headers
 - **Class Names**: Same semantic classes as other themes, different visual implementation
 
 ### Metrics Theme
 - **Purpose**: Financial and numerical data display with emphasis on data hierarchy
 - **Use Case**: MetricsTable, FinanceabilityCard, financial dashboards
 - **Characteristics**: Center-aligned headers/cells, compact padding, rounded selection styling
 - **Class Names**: Same semantic classes, optimized for numerical data display
 
 ### Timeline Theme
 - **Purpose**: Timeline data with construction phases and project milestones
 - **Use Case**: CapexDrawdownCard with timeline markers, project phase tables
 - **Characteristics**: Enhanced marker support, timeline-specific spacing, phase indicators
 - **Class Names**: Extended marker classes for timeline-specific features
 
 ## Standardized State Classes
 
 All themes implement the same semantic state classes but with theme-appropriate styling:
 
 ```css
 /* Selection and Primary States - implemented differently per theme */
 .cell-selected           /* Selected cell/column - blue in compact, rounded in metrics */
 .cell-primary            /* Primary cell emphasis - bold weight across all themes */
 .cell-primary-selected   /* Combined primary + selected - theme-specific combination */
 .header-selected         /* Selected header - border in compact, shadow in metrics */
 .header-primary          /* Primary header - blue color and bold across themes */
 .header-primary-selected /* Both primary and selected - enhanced styling per theme */
 .header-clickable        /* Cursor pointer, hover transitions - consistent across themes */
 ```
 
 ## Dynamic Marker System
 
 Markers use a composable class system with data-driven color overrides:
 
 ```css
 /* Base marker classes - implemented per theme */
 .marker-cell             /* Any cell with marker - theme defines base styling */
 .marker-row              /* Any row with marker */
 .marker-column           /* Any column with marker */
 .marker-header           /* Header with marker */
 
 /* Type-based modifiers (dynamic generation) */
 .marker-type-milestone   /* Type = milestone - theme defines milestone appearance */
 .marker-type-phase       /* Type = phase - theme defines phase appearance */
 .marker-type-event       /* Type = event - theme defines event appearance */
 
 /* Key-based modifiers (dynamic generation) */
 .marker-key-cod          /* Key = cod - theme can override for specific events */
 .marker-key-ntp          /* Key = ntp */
 .marker-key-construction /* Key = construction */
 
 /* Tag-based modifiers (dynamic generation) */
 .marker-tag-cod          /* Tag = COD - display-specific styling */
 .marker-tag-ntp          /* Tag = NTP */
 ```
 
 #### Marker Object Structure:
 ```javascript
 {
   year: 1,
   color: '#1677ff',       // Optional: overrides theme via inline styles (highest priority)
   type: 'milestone',      // Used for .marker-type-* classes
   key: 'cod',            // Used for .marker-key-* classes  
   tag: 'COD'             // Display label, used for .marker-tag-* classes
 }
 ```
 
 #### Dynamic Class Generation:
 ```javascript
 import { getMarkerClasses, getMarkerStyles } from './shared/TableThemeEngine';
 
 const markerClasses = getMarkerClasses(marker, 'cell');
 // Returns: "marker-cell marker-type-milestone marker-key-cod marker-tag-cod"
 
 const markerStyles = getMarkerStyles(marker);
 // Returns: { '--marker-color': '#1677ff', backgroundColor: 'rgba(22, 119, 255, 0.08)' }
 ```
 
 ## Theme Implementation Pattern
 
 Each theme is completely self-contained in the `createThemeStyles()` function:
 
 ```javascript
 const themeStyles = {
   compact: {
     '.table-theme-container': { position: 'relative', width: '100%' },
     '.table-base': { width: '100%' },
     '.ant-table-thead > tr > th': { 
       padding: '4px 8px', 
       backgroundColor: '#fafafa',
       fontSize: '12px'
     },
     '.cell-selected': {
       backgroundColor: 'rgba(22, 119, 255, 0.08)',
       borderLeft: '2px solid rgba(22, 119, 255, 0.6)'
     },
     '.marker-type-milestone': {
       borderLeft: '3px solid var(--marker-color)'
     }
   },
   metrics: {
     // Completely different implementation of same classes
     '.cell-selected': {
       backgroundColor: 'rgba(22, 119, 255, 0.08)' // No borders for metrics
     },
     '.header-selected': {
       borderRadius: '4px 4px 0 0',
       boxShadow: '0 2px 0px rgba(22, 119, 255, 0.2)' // Different style
     }
   }
 };
 ```
 
 ## Usage Patterns
 
 ### Basic Theme Application
 ```javascript
 import { useTableTheme } from './shared/TableThemeEngine';
 
 const MyTable = () => {
   const theme = useTableTheme('compact');
   
   return (
     <div className={theme.containerClass}>
       <style jsx global>{theme.cssRules}</style>
       <Table className={theme.tableClass} size={theme.tableProps.size} />
     </div>
   );
 };
 ```
 
 ### Theme with Card-Level Overrides
 ```javascript
 const CapexDrawdownCard = () => {
   const baseTheme = useTableTheme('timeline');
   const finalTheme = composeTheme(baseTheme, {
     additionalStyles: {
       '.marker-type-construction': {
         backgroundColor: '#fa8c16',
         borderColor: '#fa8c16'
       }
     }
   });
   
   return (
     <div className={finalTheme.containerClass}>
       <style jsx global>{finalTheme.cssRules}</style>
       <InlineEditTable theme={finalTheme} />
     </div>
   );
 };
 ```
 
 ### Marker Color Handling
 
 #### With Color (Data Override - Highest Priority):
 ```javascript
 const marker = {
   color: '#ff4d4f',  // Inline style override beats theme
   type: 'milestone',
   key: 'cod'
 };
 
 // Renders with theme classes + inline color override
 <div 
   className="marker-cell marker-type-milestone marker-key-cod"
   style={{ 
     '--marker-color': '#ff4d4f',
     backgroundColor: 'rgba(255, 77, 79, 0.08)'
   }}
 />
 ```
 
 #### Without Color (Theme Provides Styling):
 ```javascript
 const marker = {
   // No color property - theme handles everything
   type: 'milestone',
   key: 'cod'
 };
 
 // Relies entirely on theme CSS
 <div className="marker-cell marker-type-milestone marker-key-cod" />
 ```
 
 ## Component Integration
 
 ### MetricsTable
 ```javascript
 <MetricsTable
   data={metricsData}
   config={tableConfig}
   theme="metrics"                    // Uses metrics theme
   additionalStyles={{                // Card-level overrides
     '.cell-primary': { fontWeight: 700 }
   }}
 />
 ```
 
 ### InlineEditTable
 ```javascript
 <InlineEditTable
   path={['settings', 'contracts']}
   theme="compact"                    // Uses compact theme
   timelineMarkers={[                 // Data-driven markers with colors
     { year: 0, color: '#52c41a', type: 'milestone', key: 'cod', tag: 'COD' }
   ]}
   containerClassName="card-table"    // Additional container class
 />
 ```
 
 ## Theme Portability
 
 **Key Feature**: Any theme works with any table type because all themes implement the same semantic classes.
 
 ```javascript
 // InlineEditTable can use any theme
 <InlineEditTable theme="standard" />  // Minimal Ant Design styling
 <InlineEditTable theme="compact" />   // Dense editing (default)
 <InlineEditTable theme="metrics" />   // Center-aligned numbers
 <InlineEditTable theme="timeline" />  // Enhanced markers
 
 // MetricsTable can use any theme
 <MetricsTable theme="compact" />      // Dense borders
 <MetricsTable theme="metrics" />      // Financial optimized (default)
 <MetricsTable theme="standard" />     // Clean minimal
 ```
 
 ## CSS Custom Properties
 
 The system uses CSS custom properties for dynamic marker colors:
 
 ```css
 .marker-cell {
   border-color: var(--marker-color, #1890ff);
   background-color: color-mix(in srgb, var(--marker-color, #1890ff) 8%, transparent);
 }
 ```
 
 Custom properties are set via:
 1. **Theme CSS**: Default colors per marker type
 2. **Card overrides**: `additionalStyles` in `composeTheme()`
 3. **Data-driven colors**: `marker.color` via inline styles (highest priority)
 
 ## Best Practices
 
 ### Theme Selection
 - **Use `compact`** for InlineEditTable, data entry, editing with clear boundaries
 - **Use `metrics`** for MetricsTable, financial data, center-aligned numerical display
 - **Use `timeline`** for CapexDrawdownCard, project phases, timeline data
 - **Use `standard`** for general tables where Ant Design defaults are sufficient
 
 ### Color Handling
 - **Prefer data-driven colors** for markers via `marker.color` (overrides theme)
 - **Use theme defaults** for consistent component styling without marker colors
 - **Use CSS custom properties** (`--marker-color`) for theme-level defaults
 
 ### Class Usage
 - **Always include base classes**: `.table-theme-container`, `.table-base`
 - **Use semantic state classes**: `.cell-primary`, `.header-selected` (same across themes)
 - **Compose marker classes**: `.marker-cell .marker-type-milestone .marker-key-cod`
 - **Let Ant Design handle basics**: sizing, borders, base typography via props
 
 ### Performance
 - **CSS-in-JS is cached** by theme engine per theme
 - **Inline styles minimal** - only for data-driven overrides (marker colors, thresholds)
 - **Theme switching is efficient** - no universal classes to recalculate
 
 ## Anti-Patterns to Avoid
 
 ❌ **Don't create universal base classes** that get overridden by themes
 ❌ **Don't use size modifier classes** - let Ant Design and theme handle sizing
 ❌ **Don't override Ant Design basics** unless theme specifically needs different behavior
 ❌ **Don't use inline styles** except for data-driven values (colors, thresholds)
 ❌ **Don't create theme-agnostic utility classes** - keep styling within themes
 
 ## Extension Points
 
 ### Adding New Themes
 ```javascript
 // In TableThemes.js BASE_TABLE_THEMES
 myTheme: {
   name: 'MyTheme',
   containerClass: 'table-theme-container',
   tableClass: 'table-base',
   table: { size: 'small', bordered: true }
 }
 
 // In createThemeStyles() themeStyles object
 myTheme: {
   '.table-theme-container': { /* base container */ },
   '.cell-selected': { /* your selection style */ },
   '.header-primary': { /* your primary header style */ },
   '.marker-type-milestone': { /* your marker style */ }
   // Define complete styling for your theme
 }
 ```
 
 ### Adding New Marker Types
 ```javascript
 // CSS classes generated automatically from marker data
 const newMarker = {
   type: 'deadline',      // Creates .marker-type-deadline
   key: 'final-payment',  // Creates .marker-key-final-payment
   tag: 'FINAL'           // Creates .marker-tag-final
 };
 
 // Add styling to themes that need it
 '.marker-type-deadline': {
   border: '2px solid var(--marker-color)',
   backgroundColor: 'transparent'
 }
 ```
 
 ## Migration Notes
 
 When updating themes or adding new components:
 
 1. **Each theme is independent** - changes to one theme don't affect others
 2. **State classes are standardized** - `.cell-selected` works across all themes
 3. **Marker system is composable** - new marker types work with existing themes
 4. **Ant Design provides foundation** - don't override what you don't need to change
 5. **Data-driven overrides win** - `marker.color` always beats theme colors
 
 ## Troubleshooting
 
 ### Theme not applying
 - Check `useTableTheme()` is called with correct theme name
 - Verify `<style jsx global>{theme.cssRules}</style>` is included
 - Ensure container has correct `className={theme.containerClass}`
 
 ### Marker colors not showing
 - Check marker object has `color` property for overrides
 - Verify theme defines `.marker-type-*` classes for fallbacks
 - Ensure `getMarkerStyles()` inline styles are applied
 
 ### Selection not working
 - Verify theme implements `.cell-selected`, `.header-primary` etc.
 - Check component applies state classes correctly
 - Ensure no conflicting CSS overrides state classes