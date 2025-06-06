 # Table and Utils Refactoring Plan | v1.0 | 2025-01-27

 Legend: ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

 ## 1. Core Table Infrastructure 🎨 🏷️High
 - ☑ TI-1 Create components/tables/shared/ directory with common table utilities
 - ☑ TI-2 Extract shared styling system to components/tables/shared/TableTheme.js
 - ☑ TI-3 Create components/tables/shared/TableDataOps.js for common data operations
 - ☑ TI-4 Create components/tables/shared/TableValidation.js for validation utilities
 - ☑ TI-5 Create components/tables/shared/index.js with all exports

 ## 2. Card Configuration Extraction 📋 🏷️High
 - ☑ CC-1 Create components/cards/configs/ directory structure
 - ☑ CC-2 Extract FinanceabilityCard table config to configs/FinanceabilityConfig.js
 - ☑ CC-3 Extract CashflowTimelineCard chart config to configs/CashflowTimelineConfig.js
 - ☑ CC-4 Update card components to use external configurations

 ## 3. Utils Reorganization 🔧 🏷️High
 - ☑ UR-1 Create utils/tables/ for reusable table utilities
 - ☑ UR-2 Create utils/finance/ for finance-specific calculations
 - ☑ UR-3 Move generic functions from cashflowUtils.js to appropriate locations
 - ☑ UR-4 Split financialChartsUtils.js into generic vs finance-specific parts

 ## 4. InlineEditTable Updates 📝 🏷️Medium
 - ☑ IET-1 Update InlineEditTable to use shared styling system
 - ☑ IET-2 Extract inline table configurations to shared utilities
 - ☐ IET-3 Standardize data processing patterns with shared utilities

 ## 5. MetricsTable Updates 📊 🏷️Medium
 - ☐ MT-1 Update MetricsTable to use shared styling system
 - ☐ MT-2 Move finance-specific logic to card configurations
 - ☐ MT-3 Standardize threshold evaluation with shared utilities

 ## 6. Testing and Integration 🧪 🏷️Medium
 - ☐ TI-1 Test FinanceabilityCard with new configuration structure
 - ☐ TI-2 Test CashflowTimelineCard with extracted configurations
 - ☐ TI-3 Test InlineEditTable in CapexDrawdownCard and CostModule
 - ☐ TI-4 Verify all imports and exports are working correctly

 ---

 ## Files to Remove/Delete 🗑️
 - 🔥 CL-1 Remove finance-specific functions from utils/cashflowUtils.js after moving
 - 🔥 CL-2 Remove generic chart functions from utils/financialChartsUtils.js after splitting

 ---

 ## Project Context & Implementation Details

 ### What We're Trying to Achieve
 We're refactoring the table and utility structure to enforce strict separation of concerns between reusable components and card-specific logic. The goal is to create a maintainable, standardized structure where:

 1. Table Components (InlineEditTable, MetricsTable) are completely agnostic to specific card functionality
 2. Card-Specific Logic lives in dedicated configuration files that use factory functions
 3. Utilities are properly organized between generic (reusable) and domain-specific functions
 4. Styling is standardized with theme-based approach using Ant Design as primary with CSS-in-JS support

 ### Rules We're Following
 1. Strict Separation of Concerns: Reusable components (tables, utils) cannot contain card-specific logic
 2. Factory Functions for Card Configs: Since cards need dynamic data (availablePercentiles, currency, etc.), configurations are factory functions that take context and return configuration objects
 3. Hybrid Utils Organization: Core reusable utilities in root utils/, domain-specific in utils/domains/ (finance, cashflow, etc.)
 4. Theme-Based Styling: Component-specific design system with configurable variants. Tables support multiple themes via useTableTheme() hook
 5. Maintain Existing Functionality: Cannot break existing working code - refactor only, no feature changes
 6. Test Throughout: Each task group should be tested before moving to next

 ### Architectural Patterns Chosen

 #### Table Infrastructure
 - Shared Styling System: TableThemes.js (definitions) + TableTheme.js (hooks/utilities)
 - Theme Structure: CSS Classes + Theme Provider 

##### Theme Hierarchy Should be:
```
Base Theme (lowest specificity)
  ↓
Card-Level Overrides (medium specificity)  
  ↓
Dynamic/State Overrides (highest specificity)
```
 - Common Data Operations: Shared utilities for time series transformation, percentile handling, column generation
 - Simplified Validation: Essential validation only (cell values, unique keys, structure) - removed over-complex business rules

 #### Configuration Architecture
 - Factory Functions: createFinancialMetricsConfig(context), createTimelineChartConfig(context)
 - Context Pattern: Functions take { financingData, availablePercentiles, primaryPercentile, currency, onColumnSelect } and return config objects
 - External Config Files: components/cards/configs/ with separate files per card
 - Clean Separation: Data transformation (utils) vs display configuration (configs)

 #### Import/Export Strategy
 - Barrel Exports: Each directory has index.js with clear exports
 - Avoid Naming Conflicts: Consistent naming patterns, domain prefixes where needed
 - Minimal Dependencies: Cards import from ./configs, tables import from shared

 ### Files Structure Created

 frontend/src/
 ├── components/
 │   ├── tables/
 │   │   └── shared/              # ✅ COMPLETED
 │   │       ├── TableThemes.js   # Theme definitions
 │   │       ├── TableTheme.js    # Theme hooks & utilities  
 │   │       ├── TableDataOps.js  # Data transformation utilities
 │   │       ├── TableValidation.js # Essential validation only
 │   │       ├── index.js         # Barrel exports
 │   │       ├── ColumnGenerators.js
 │   │       ├── FormatUtils.js
 │   │       ├── TableConfiguration.js
 │   │       ├── TimelineUtils.js
 │   │       └── TimeSeriesOps.js
 │   └── cards/
 │       └── configs/             # ✅ COMPLETED  
 │           ├── FinanceabilityConfig.js  # Financial metrics table config
 │           ├── CashflowTimelineConfig.js # Timeline chart config
 │           └── index.js         # Barrel exports
 └── utils/
     ├── tables/                  # ☐ TO CREATE - reusable table utilities
     └── finance/                 # ☐ TO CREATE - finance-specific utilities


 ### Implementation Status & Where We Left Off

 #### Completed Work
 1. Core Table Infrastructure ✅ - Created complete shared table system with themes, data ops, validation
 2. Card Configuration Extraction ✅ - Moved card-specific logic to external factory functions

 #### Key Implementations
 - Theme System: useTableTheme('compact') provides Ant Design + custom styling, createCustomTheme('metrics', overrides) for card extensions
 - Data Operations: createPercentileColumns(), transformTimeSeriesForTable(), formatValue() etc.
 - Card Configs: createFinancialMetricsConfig({ financingData, availablePercentiles, ... }) returns { data, config }
 - Validation: Simplified to validateCellValue(), validateTableStructure(), validatePercentageSum()

 #### Current State
 - Both FinanceabilityCard and CashflowTimelineCard successfully use external configurations
 - Shared table infrastructure ready for use by both table types
 - Fixed React hooks error in chart error handling (moved error handling to render logic, not early return)

 ### Next Steps: Utils Reorganization (Task Group #3)

 #### Utils That Need Moving
 1. From cashflowUtils.js (keep domain-specific, move generic):
    - Keep: calculateCovenantAnalysis(), prepareDSCRChartData(), getBankabilityRiskLevel() (finance-specific)
    - Move to utils/tables/: createConfidenceStatistic(), generic formatting functions
    - Move to utils/finance/: Financial calculation helpers

 2. From financialChartsUtils.js (split generic vs finance):
    - Keep: prepareFinancialTimelineData(), getFinancialColorScheme() (finance-specific)
    - Move to utils/charts/: addRefinancingAnnotations(), hexToRgb() (generic chart utilities)

 #### Target Structure for Utils

 utils/
 ├── tables/              # Generic table utilities
 │   ├── formatting.js    # Value formatting, type detection
 │   ├── operations.js    # Search, sort, filter operations  
 │   └── index.js
 ├── finance/             # Finance domain utilities
 │   ├── calculations.js  # Financial calculations
 │   ├── analysis.js      # Covenant analysis, risk assessment
 │   └── index.js  
 ├── charts/              # Generic chart utilities
 │   ├── annotations.js   # Chart annotations, refinancing windows
 │   ├── colors.js        # Color utilities, hex conversion
 │   └── index.js
 └── cashflow/            # Keep existing well-organized structure
     └── [existing files]   # Already well organized


 ### Testing Requirements
 Each task group must be tested before proceeding:
 - FinanceabilityCard financial metrics table works with external config
 - CashflowTimelineCard chart renders with external config
 - No broken imports or missing functions
 - All existing functionality preserved

 ### Critical Notes for Continuation
 1. Do not break existing functionality - this is pure refactoring
 2. Test after each task group before moving to next
 3. Ask for missing files if imports reference unknown files
 4. Follow factory function pattern for card configs - they need dynamic context
 5. Use shared table infrastructure in future table updates (groups 4-5)
 6. Handle React hooks properly - no conditional returns before all hooks are called

 Ready to continue with Task Group #3: Utils Reorganization - next task is UR-1: Create utils/tables/ for reusable table utilities.