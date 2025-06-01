 # Cash-Flow Analysis Workspace Development Plan | v3.0 | 2025-05-31

 Legend: ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

 ## 1. Core Framework & Data Architecture 🏗️ 🏷️High
 - ☐ CF-1 Create CashflowContext.jsx with source registry, multiplier system, and caching logic
   - Follow ScenarioContext.jsx pattern for state management
   - Implement CASHFLOW_SOURCE_REGISTRY configuration
   - Add manual refresh trigger and stale data detection
   - Cache transformed CashflowDataSource object
   - Provide useCashflow() hook following useScenario() pattern
 - ☐ CF-2 Define enhanced CashflowDataSource schema with multiplier support in schemas/yup/cashflow.js
   - Extend existing DataPointSchema and PercentileSchema
   - Add lineItems with rawPercentileData/percentileData structure
   - Include aggregations and financeMetrics with Map<percentile, data> format
   - Add multiplier metadata tracking for transparency
 - ☐ CF-3 Create cashflowUtils.js with transformation, aggregation, and multiplier functions
   - Follow metricsUtils.js patterns for pure functions
   - Implement transformScenarioToCashflow() main transformer
   - Add MULTIPLIER_OPERATIONS (multiply, compound, simple)
   - Create aggregation calculators for totalCosts, totalRevenue, netCashflow
   - Add finance metrics calculators (DSCR, LLCR, IRR, NPV)
 - ☐ CF-4 Implement base CashflowDetailCard and CashflowSummaryCard classes with multiplier metadata
   - Use JS classes with static methods for metadata
   - Follow ContractScopeCard.jsx patterns for component structure
   - Include getRequiredLineItems(), getRequiredMultipliers() static methods
   - Add validation and error handling for missing data
 - ☐ CF-5 Create central card registry and multiplier operations in CashflowAnalysis.jsx
   - Follow DistributionAnalysis.jsx patterns for main component
   - Implement CARD_REGISTRY with grid layout configurations
   - Add card rendering loop with error boundaries
   - Include manual refresh button and stale data indicators

 ## 2. Enhanced Percentile Selection System 🎯 🏷️High
 - ☐ PS-1 Create PercentileSelector.jsx component with global and per-module selection
   - Follow PrimaryPercentileSelectField.jsx patterns for UI
   - Implement unified mode (single dropdown) and advanced mode (per-module config)
   - Add modal/drawer for advanced configuration
   - Include validation for available percentiles in data
 - ☐ PS-2 Implement percentile strategy logic (unified vs per-module selection)
   - Add strategy state management in CashflowContext
   - Implement match, cross, and fixed strategies for multiplier interactions
   - Create percentile resolution logic for line items with multipliers
   - Add strategy persistence and default configurations
 - ☐ PS-3 Add percentile interaction logic for multiplier combinations
   - Implement match strategy (P10 cost × P10 escalation) as default
   - Add cross strategy for sensitivity analysis (all combinations)
   - Create fixed strategy (median multipliers for all percentiles)
   - Add conflict detection and resolution
 - ☐ PS-4 Create percentile configuration persistence in CashflowContext
   - Store selected percentiles and strategy in context state
   - Add validation for percentile availability in dataset
   - Implement fallback to available percentiles when selection invalid
   - Add configuration export/import for advanced users
 - ☐ PS-5 Add percentile selection validation and conflict detection
   - Validate selected percentiles exist in all required data sources
   - Add warnings for missing percentile data
   - Implement graceful degradation with available percentiles
   - Create user feedback for invalid selections

 ## 3. Multiplier System Implementation 🔢 🏷️High
 - ☐ MS-1 Implement multiplier source registry and validation
   - Add multipliers section to CASHFLOW_SOURCE_REGISTRY
   - Include escalationRate, availabilityFactor, and other common multipliers
   - Add validation for multiplier data availability
   - Implement error handling for missing multiplier sources
 - ☐ MS-2 Create multiplier operation functions (compound, simple, multiply)
   - Implement MULTIPLIER_OPERATIONS object with operation functions
   - Add compound growth calculation: value × (1 + rate)^years
   - Add simple multiplication: value × multiplier
   - Add simple additive: value × (1 + rate × years)
   - Include parameter validation and error handling
 - ☐ MS-3 Implement applyMultipliers() transformation pipeline
   - Create multiplier application logic in declaration order
   - Support both percentile and fixed multiplier data
   - Add baseYear and cumulative parameters for growth calculations
   - Preserve original raw data for transparency
   - Generate appliedMultipliers metadata for audit trail
 - ☐ MS-4 Add multiplier dependency tracking and metadata preservation
   - Track which multipliers were applied to each line item
   - Store multiplier values used in calculations for transparency
   - Add dependency validation to prevent circular references
   - Create multiplier impact analysis for visualization
 - ☐ MS-5 Create multiplier visualization helpers and transparency features
   - Add multiplier metadata display in card headers
   - Create tooltip content showing applied multipliers
   - Implement multiplier effect highlighting in charts
   - Add transparency indicators for multiplied vs raw data

 ## 4. Data Transformation Pipeline 🔄 🏷️High
 - ☐ DT-1 Implement transformScenarioToCashflow() with multiplier support
   - Extract data from ScenarioContext using getValueByPath()
   - Process each source in CASHFLOW_SOURCE_REGISTRY
   - Apply multipliers in declaration order
   - Generate metadata and validation results
   - Return complete CashflowDataSource object
 - ☐ DT-2 Create line item extractors for percentile, fixed, and multiplier data sources
   - Handle SimulationInfoSchema results for percentile data
   - Extract fixed values from settings and configuration
   - Process multiplier sources (distributions, fixed values, time series)
   - Apply transformer functions for complex data mappings
   - Add error handling for missing or invalid data
 - ☐ DT-3 Implement aggregation computation with multiplier effects
   - Calculate totalCosts by summing all cost line items per percentile
   - Calculate totalRevenue by summing all revenue line items per percentile
   - Compute netCashflow as totalRevenue - totalCosts per percentile
   - Handle mixed percentile/fixed data in aggregations
   - Preserve multiplier effects in aggregated results
 - ☐ DT-4 Create finance metrics calculator with multiplier-adjusted values
   - Calculate annual DSCR using debt service and cash flow data
   - Compute LLCR using debt balance and future cash flows
   - Calculate IRR using netCashflow and initial investment
   - Compute NPV using discount rate and netCashflow
   - Add covenant breach detection for DSCR thresholds
 - ☐ DT-5 Add transformer functions for complex sources with multiplier dependencies
   - Create contractsToAnnualCosts() for OEM contract processing
   - Add distributionToTimeSeries() for distribution parameter conversion
   - Implement failureEventsToAnnualCosts() for risk event processing
   - Add escalationToMultiplier() for escalation rate processing
   - Include error handling and validation for all transformers

 ## 5. Navigation & Main Component 🧭 🏷️High
 - ☐ NAV-1 Add "Cashflow Analysis" route to Sider under Results section
   - Modify Sider.jsx to add new menu item
   - Follow existing route patterns for /results/cashflow
   - Add appropriate icon (BarChartOutlined or LineChartOutlined)
   - Update router configuration for new route
 - ☐ NAV-2 Create CashflowAnalysis.jsx with enhanced percent
 - ☐ NAV-2 Create CashflowAnalysis.jsx with enhanced percentile selector
   - Follow DistributionAnalysis.jsx pattern for main page component
   - Integrate PercentileSelector component in page header
   - Add CashflowContext provider wrapping
   - Implement card grid layout using ResponsiveFieldRow patterns
   - Include loading states and error boundaries for each card
 - ☐ NAV-3 Implement manual refresh trigger with multiplier recalculation
   - Add refresh button following existing button patterns
   - Trigger complete cashflow data transformation on refresh
   - Show loading spinner during recalculation
   - Display last updated timestamp
   - Add stale data detection and warnings
 - ☐ NAV-4 Add card grid layout with multiplier metadata display
   - Use FormSection and FieldCard layouts for consistent spacing
   - Implement responsive grid using existing breakpoint patterns
   - Add card loading skeletons following Ant Design patterns
   - Include multiplier transparency indicators in card headers
   - Add card enable/disable toggles for customization

 ## 6. First Implementation: Timeline Card 📈 🏷️High
 - ☐ TL-1 Create CashflowTimelineCard.jsx with multiplier effect visualization
   - Extend CashflowDetailCard base class
   - Follow ContractScopeCard.jsx patterns for card structure
   - Implement getRequiredLineItems() to return ['all']
   - Add multiplier metadata display in card header
   - Include error handling for missing timeline data
 - ☐ TL-2 Implement CashflowTimelineChart.jsx with stacked area chart
   - Use Plotly for advanced stacked area visualization
   - Follow ContractScopeChart.jsx patterns for chart implementation
   - Create revenue (positive) and cost (negative) stacked areas
   - Add net cashflow line overlay
   - Implement responsive chart sizing and mobile compatibility
 - ☐ TL-3 Add percentile ribbon overlay with multiplier variance
   - Create P10-P90 confidence envelope around net cashflow line
   - Use semi-transparent fill following PercentileChart.jsx patterns
   - Add percentile switching with smooth transitions
   - Include multiplier effect indicators in ribbon variance
   - Add legend explaining confidence intervals
 - ☐ TL-4 Implement hover with line-item breakdown and multiplier details
   - Create detailed hover tooltips showing annual breakdown
   - Include line item contributions (cost categories, revenue streams)
   - Display applied multipliers and their values for hovered year
   - Add percentage contribution calculations
   - Follow existing hover patterns from chart components
 - ☐ TL-5 Add enhanced percentile switching with multiplier recalculation
   - Connect to PercentileSelector component state
   - Implement real-time chart updates on percentile change
   - Recalculate multiplier effects for new percentile combination
   - Add smooth transitions between percentile views
   - Include loading indicators during recalculation

 ## 7. Framework Validation: Financeability Card 💰 🏷️Medium
 - ☐ FB-1 Create FinanceabilityCard.jsx with multiplier-aware metrics
   - Extend CashflowSummaryCard base class
   - Follow FieldCard and FormSection layouts for KPI organization
   - Calculate IRR, NPV, DSCR, LLCR with multiplier-adjusted cashflows
   - Add confidence intervals showing percentile ranges
   - Include multiplier impact indicators in metric displays
 - ☐ FB-2 Implement KPI cards with percentile strategy support
   - Create individual KPI cards for each financial metric
   - Follow Statistic component patterns from Ant Design
   - Add color coding for covenant compliance (green/yellow/red)
   - Include percentile confidence ranges as secondary metrics
   - Add click actions to highlight drivers in other cards
 - ☐ FB-3 Create DSCRHeatStrip.jsx with multiplier effect visualization
   - Follow heatmap patterns from existing chart components
   - Create annual DSCR visualization as color-coded bars
   - Add covenant threshold line (typically 1.2 or 1.3)
   - Include breach indicators with detailed tooltip information
   - Add multiplier transparency showing pre/post multiplier DSCR
 - ☐ FB-4 Add covenant breach detection with multiplier impact analysis
   - Calculate covenant breaches for each percentile scenario
   - Create breach alerts with year and severity information
   - Add multiplier impact analysis showing which multipliers drive breaches
   - Include breach probability calculations across percentiles
   - Follow Alert component patterns for breach notifications
 - ☐ FB-5 Validate framework extensibility with multiplier complexity
   - Test card with various multiplier combinations
   - Validate percentile strategy handling
   - Ensure proper error handling for missing finance data
   - Test performance with large datasets
   - Document any framework limitations discovered

 ## 8. Source Registry Configuration 📋 🏷️Medium
 - ☐ SR-1 Define CASHFLOW_SOURCE_REGISTRY with multiplier dependencies
   - Configure baseOM, contractFees, energyRevenue, and other core sources
   - Add escalationRate and availabilityFactor multiplier configurations
   - Define transformer functions for complex data mappings
   - Include refreshFunction references for simulation-based sources
   - Add validation rules for each source type
 - ☐ SR-2 Configure escalation, availability, and other multiplier sources
   - Add escalationRate from cost module distribution settings
   - Configure availabilityFactor from wind farm performance settings
   - Include degradation rates for revenue streams
   - Add tax rate and financing multipliers
   - Configure time-dependent multipliers with proper base years
 - ☐ SR-3 Implement refresh functions for multiplier and dependent sources
   - Create refreshCashflowSimulation() for simulation-based sources
   - Add refreshContractData() for contract-based sources
   - Implement refreshFinancingMetrics() for finance calculations
   - Include error handling and validation for refresh operations
   - Add progress indicators for long-running refresh operations
 - ☐ SR-4 Create error handling for missing multipliers and circular dependencies
   - Add validation for multiplier data availability
   - Implement graceful degradation when multipliers missing
   - Create user-friendly error messages for configuration issues
   - Add dependency validation to prevent circular references
   - Include fallback values for missing multiplier data
 - ☐ SR-5 Add multiplier validation and dependency health checks
   - Validate multiplier data ranges and reasonableness
   - Check for required percentiles in multiplier sources
   - Add warnings for unusual multiplier values
   - Implement dependency graph validation
   - Create health check dashboard for source registry status

 ## 9. Advanced Features 🔧 🏷️Low
 - ☐ AF-1 Create DriverExplorerCard.jsx with multiplier impact analysis
   - Extend CashflowDetailCard base class
   - Implement tornado chart using Plotly horizontal bar charts
   - Calculate NPV sensitivity to each input variable including multipliers
   - Add cross-panel linking to highlight selected drivers
   - Include multiplier vs direct impact analysis
 - ☐ AF-2 Implement CashflowTableCard.jsx with multiplier breakdown columns
   - Extend CashflowDetailCard base class
   - Follow EditableTable patterns for table implementation
   - Add columns for pre/post multiplier values
   - Include cumulative vs annual view toggle
   - Add CSV export functionality for detailed analysis
 - ☐ AF-3 Add FinancingStressTester.jsx with multiplier scenario testing
   - Create drawer component following existing drawer patterns
   - Add scenario sliders for key multiplier adjustments
   - Implement real-time recalculation of finance metrics
   - Include scenario comparison table
   - Add scenario save/load functionality
 - ☐ AF-4 Create OMVarianceExplorer.jsx with multiplier variance analysis
   - Create component for cost variance analysis
   - Add box plots showing cost distribution ranges
   - Include multiplier effect breakdown by cost category
   - Add variance ranking and impact analysis
   - Implement variance trend analysis over project life

 ## 10. Documentation & Testing 📝 🏷️Low
 - ☐ DOC-1 Create comprehensive framework and multiplier system documentation
   - Document CashflowDataSource schema and transformation pipeline
   - Add multiplier system architecture and operation explanations
   - Include percentile selection strategy documentation
   - Create card extension guide with examples
   - Document performance considerations and optimization tips
 - ☐ DOC-2 Document card extension patterns with multiplier examples
   - Create step-by-step guide for adding new cards
   - Document base class methods and required implementations
   - Add examples of multiplier-aware card development
   - Include testing patterns for card validation
   - Document common pitfalls and solutions
 - ☐ DOC-3 Add unit tests for multiplier operations and transformations
   - Test MULTIPLIER_OPERATIONS functions with edge cases
   - Add tests for percentile interaction strategies
   - Test transformation pipeline with various data scenarios
   - Include performance tests for large datasets
   - Add regression tests for multiplier calculations
 - ☐ DOC-4 Create integration tests for percentile and multiplier interactions
   - Test complete data flow from ScenarioContext to cards
   - Add tests for percentile switching across all cards
   - Test multiplier dependency resolution
   - Include error handling and recovery tests
   - Add user interaction testing for percentile selector

 ---

 ## Files to Create/Modify:

```
 frontend/src/
 ├── contexts/CashflowContext.jsx                    # NEW - UI state & caching
 ├── components/
 │   ├── common/Sider.jsx                            # MODIFY - add cashflow route
 │   ├── results/cashflow/
 │   │   ├── CashflowAnalysis.jsx                    # NEW - main component
 │   │   ├── base/
 │   │   │   ├── CashflowDetailCard.js               # NEW - base detail card class
 │   │   │   └── CashflowSummaryCard.js              # NEW - base summary card class
 │   │   └── components/
 │   │       ├── PercentileSelector.jsx              # NEW - enhanced percentile selection
 │   │       ├── DSCRHeatStrip.jsx                   # NEW - covenant visualization
 │   │       ├── FinancingStressTester.jsx           # NEW - scenario testing drawer
 │   │       └── OMVarianceExplorer.jsx              # NEW - cost variance analysis
 │   ├── cards/
 │   │   ├── CashflowTimelineCard.jsx                # NEW - timeline visualization
 │   │   ├── FinanceabilityCard.jsx                  # NEW - KPIs and covenants
 │   │   ├── DriverExplorerCard.jsx                  # NEW - value driver analysis
 │   │   └── CashflowTableCard.jsx                   # NEW - detailed breakdown table
 │   └── charts/
 │       └── CashflowTimelineChart.jsx               # NEW - chart implementation
 ├── utils/
 │   └── cashflowUtils.js                            # NEW - transformation utilities
 └── schemas/yup/
     └── cashflow.js                                  # NEW - data validation schemas
```

 ---

 ## Technical Considerations & Patterns:

 ### Code Patterns to Follow:
 - Context Management: Follow ScenarioContext.jsx patterns for state and data access
 - Component Structure: Follow ContractScopeCard.jsx and DistributionCard.jsx for card layouts
 - Chart Implementation: Follow ContractScopeChart.jsx and PercentileChart.jsx for visualization
 - Layout Organization: Use contextFields/layouts patterns for consistent spacing and responsive design
 - Data Transformation: Follow metricsUtils.js patterns for pure functions and error handling
 - Form Integration: Follow ContextField.jsx patterns for user inputs and validation
 - Error Handling: Follow existing Alert and Empty component patterns for user feedback

 ### Performance Considerations:
 - Pre-compute aggregations during cashflow object creation (not on-demand)
 - Use Map<percentile, data> for O(1) percentile lookups
 - Memoize expensive chart calculations with React.memo and useMemo
 - Implement lazy loading for non-visible cards
 - Cache multiplier calculations to avoid recalculation on percentile switching

 ### Extension Requirements:
 - Registry-based source configuration for easy addition of new cost/revenue streams
 - Base class inheritance for consistent card development patterns
 - Pluggable multiplier operations for new calculation types
 - Configurable percentile strategies for different analysis needs
 - Transparent multiplier metadata for audit and debugging

 ### Critical Dependencies:
 - Percentile Selector MUST be completed before any cards - all cards depend on percentile selection
 - Multiplier System MUST be completed before realistic testing - essential for accurate financial modeling
 - Core Framework MUST be stable before card development - provides foundation for all subsequent work
 - Timeline Card serves as framework validation - proves extensibility and identifies missing features