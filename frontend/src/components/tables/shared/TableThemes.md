 # Table Theming System Documentation
 
 ## Overview
 
 The table theming system provides a standardized, hierarchical approach to styling tables across the application. It supports multiple table types (MetricsTable, InlineEditTable) with consistent base classes while allowing for component-specific features and overrides.
 
 ## Styling Hierarchy (Override Chain)
 
 The system follows a clear cascade of styling precedence:
 
 ```
 1. Ant Design Base Theme (lowest priority)
    ↓
 2. Our Table Theme System (CSS classes)
    ↓  
 3. Card/Component Level Overrides (CSS-in-JS or additional classes)
    ↓
 4. Inline Styles from Props/Data (highest priority)
 ```
 
 ### Example Override Chain:
 ```javascript
 // 1. Ant Design provides base table styling
 <Table /> // Default Ant Design appearance
 
 // 2. Theme system adds our styling
 <Table className="table-base table-size-small" />
 
 // 3. Card/component adds specific overrides
 <InlineEditTable 
   additionalStyles={{
     '.marker-type-construction': { backgroundColor: '#fa8c16' }
   }}
 />
 
 // 4. Data-driven inline styles (highest priority)
 <div style={{ color: marker.color }} />
 ```
 
 ## Core Theme Architecture
 
 ### Base Universal Classes
 ```css
 .table-theme-container     /* Wrapper container for theme scoping */
 .table-base               /* Base table element styling */
 ```
 
 ### Size/Density Modifiers
 ```css
 .table-size-small         /* Compact: 4-6px padding, 12-13px font */
 .table-size-medium        /* Standard: 8-12px padding, 14px font */
 .table-size-large         /* Spacious: 12-16px padding, 15px font */
 ```
 
 ### Cell/Header State Classes
 ```css
 .cell-selected           /* Selected cell/column background */
 .cell-primary            /* Primary cell emphasis (bold, color) */
 .cell-primary-selected   /* Combined primary + selected styling */
 .header-selected         /* Selected header styling */
 .header-primary          /* Primary header emphasis */
 .header-primary-selected /* Combined primary + selected header */
 .header-clickable        /* Cursor pointer, hover transitions */
 ```
 
 ### Content Type Classes
 ```css
 .year-column             /* Year display formatting */
 .year-header             /* Year header formatting */
 .metric-label            /* Metric name/label cells */
 .metric-value            /* Metric data cells */
 .contract-name           /* Contract/item name cells */
 ```
 
 ### Dynamic Marker System
 
 Markers use a composable class system that combines base classes with dynamic modifiers:
 
 ```css
 /* Base marker classes */
 .marker-cell             /* Any cell with marker */
 .marker-row              /* Any row with marker */
 .marker-column           /* Any column with marker */
 .marker-header           /* Header with marker */
 
 /* Type-based modifiers (dynamic) */
 .marker-type-milestone   /* Type = milestone */
 .marker-type-phase       /* Type = phase */
 .marker-type-event       /* Type = event */
 
 /* Key-based modifiers (dynamic) */
 .marker-key-cod          /* Key = cod */
 .marker-key-ntp          /* Key = ntp */
 .marker-key-construction /* Key = construction */
 
 /* Tag-based modifiers (dynamic) */
 .marker-tag-cod          /* Tag = COD */
 .marker-tag-ntp          /* Tag = NTP */
 ```
 
 #### Marker Object Structure:
 ```javascript
 {
   year: 1,
   color: '#1677ff',       // Optional: overrides theme colors via inline styles
   type: 'milestone',      // Used for .marker-type-* classes
   key: 'cod',            // Used for .marker-key-* classes  
   tag: 'COD'             // Display label, used for .marker-tag-* classes
 }
 ```
 
 #### Dynamic Class Generation:
 ```javascript
 const getMarkerClasses = (marker, context = 'cell') => {
   const classes = [`marker-${context}`];
   
   if (marker.type) classes.push(`marker-type-${marker.type}`);
   if (marker.key) classes.push(`marker-key-${marker.key}`);
   if (marker.tag) classes.push(`marker-tag-${marker.tag.toLowerCase()}`);
   
   return classes.join(' ');
 };
 ```
 
 ### Component-Specific Add-ons
 ```css
 .metric-tag              /* Small tags in metric headers */
 .timeline-enabled        /* Table with timeline features */
 .financial-data          /* Table optimized for financial display */
 ```
 
 ## Available Themes
 
 ### Standard Theme
 - **Purpose**: Clean, minimal styling close to Ant Design defaults
 - **Use Case**: General purpose tables
 - **Characteristics**: Medium spacing, minimal borders
 
 ### Compact Theme  
 - **Purpose**: Dense data entry and editing
 - **Use Case**: InlineEditTable, data input forms
 - **Characteristics**: Tight spacing, clear borders, edit-focused
 
 ### Metrics Theme
 - **Purpose**: Financial and numerical data display
 - **Use Case**: MetricsTable, dashboards, financial analysis
 - **Characteristics**: Center-aligned numbers, emphasis on data hierarchy
 
 ## Usage Patterns
 
 ### Basic Theme Application
 ```javascript
 import { useTableTheme } from './shared/TableThemeEngine';
 
 const MyTable = () => {
   const theme = useTableTheme('compact');
   
   return (
     <div className={theme.containerClass}>
       <style jsx global>{theme.cssRules}</style>
       <Table className={theme.tableClass} />
     </div>
   );
 };
 ```
 
 ### Theme with Card-Level Overrides
 ```javascript
 const MyCard = () => {
   const baseTheme = useTableTheme('metrics');
   const finalTheme = composeTheme(baseTheme, {
     containerClass: 'my-card-table',
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
       <MetricsTable theme={finalTheme} />
     </div>
   );
 };
 ```
 
 ### Marker Color Handling
 
 #### With Color (Data Override - Highest Priority):
 ```javascript
 const marker = {
   color: '#ff4d4f',  // Inline style override
   type: 'milestone',
   key: 'cod'
 };
 
 // Renders with inline styles
 <div 
   className="marker-cell marker-type-milestone marker-key-cod"
   style={{ 
     '--marker-color': '#ff4d4f',
     backgroundColor: 'rgba(255, 77, 79, 0.15)'
   }}
 />
 ```
 
 #### Without Color (Theme Fallback):
 ```javascript
 const marker = {
   // No color property
   type: 'milestone',
   key: 'cod'
 };
 
 // Relies on CSS theme styling
 <div className="marker-cell marker-type-milestone marker-key-cod" />
 ```
 
 ```css
 /* Theme provides fallback colors */
 .marker-type-milestone {
   --marker-color: #1890ff;
   background-color: rgba(24, 144, 255, 0.08);
 }
 ```
 
 ## Component Integration
 
 ### MetricsTable
 ```javascript
 <MetricsTable
   data={metricsData}
   config={tableConfig}
   theme="metrics"                    // Built-in theme
   additionalStyles={{                // Card-level overrides
     '.cell-primary': { fontWeight: 700 }
   }}
 />
 ```
 
 ### InlineEditTable
 ```javascript
 <InlineEditTable
   path={['settings', 'contracts']}
   theme="compact"                    // Built-in theme
   timelineMarkers={[                 // Data-driven markers
     { year: 0, color: '#52c41a', type: 'milestone', key: 'cod', tag: 'COD' }
   ]}
   containerClassName="card-table"    // Additional container class
 />
 ```
 
 ## CSS Custom Properties
 
 The system uses CSS custom properties for dynamic values:
 
 ```css
 .marker-cell {
   border-color: var(--marker-color, #1890ff);
   background-color: color-mix(in srgb, var(--marker-color, #1890ff) 8%, transparent);
 }
 ```
 
 Custom properties can be set via:
 1. **Theme CSS**: Default values in theme definitions
 2. **Component Styles**: Card-level overrides via additionalStyles  
 3. **Inline Styles**: Data-driven values (highest priority)
 
 ## Best Practices
 
 ### Theme Selection
 - **Use `compact`** for data entry, editing, and dense information
 - **Use `metrics`** for financial data, dashboards, and numerical analysis
 - **Use `standard`** for general purpose tables and simple displays
 
 ### Color Handling
 - **Prefer data-driven colors** for markers (via marker.color)
 - **Use theme defaults** for consistent component styling
 - **Use CSS custom properties** for dynamic theming
 
 ### Class Composition
 - **Always include base classes**: `.table-theme-container`, `.table-base`
 - **Add size modifiers** as needed: `.table-size-small`
 - **Use semantic state classes**: `.cell-primary`, `.header-selected`
 - **Compose marker classes**: `.marker-cell .marker-type-milestone .marker-key-cod`
 
 ### Performance
 - **CSS-in-JS is cached** by the theme engine
 - **Inline styles are minimal** and only used for data-driven overrides
 - **Class composition** is more performant than multiple style recalculations
 
 ## Migration Notes
 
 When migrating existing tables:
 
 1. **Replace inline styles** with appropriate CSS classes
 2. **Move color logic** to CSS custom properties where possible
 3. **Use data-driven overrides** only for truly dynamic values
 4. **Test theme switching** to ensure compatibility
 
 ## Extension Points
 
 ### Adding New Themes
 ```javascript
 // In TableThemes.js
 export const BASE_TABLE_THEMES = {
   myCustomTheme: {
     name: 'MyCustom',
     containerClass: 'table-theme-container',
     tableClass: 'table-base',
     table: { size: 'small', bordered: true }
   }
 };
 ```
 
 ### Adding New Marker Types
 ```javascript
 // CSS classes are generated automatically
 const newMarker = {
   type: 'deadline',      // Creates .marker-type-deadline
   key: 'final-payment',  // Creates .marker-key-final-payment
   tag: 'FINAL'           // Creates .marker-tag-final
 };
 ```
 
 ### Custom Component Classes
 ```css
 /* Add to theme definitions */
 .my-special-cell {
   /* Custom styling */
 }
 ```