 # Cash-Flow Analysis Workspace Development Plan | v3.0 | 2025-05-31

 Legend: ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

 ## 1. Core Framework & Data Architecture 🏗️ 🏷️High
 - ☐ CF-1 Create CashflowContext.jsx with source registry, multiplier system, and caching logic
 - ☐ CF-2 Define enhanced CashflowDataSource schema with multiplier support in schemas/yup/cashflow.js
 - ☐ CF-3 Create cashflowUtils.js with transformation, aggregation, and multiplier functions
 - ☐ CF-4 Implement base CashflowDetailCard and CashflowSummaryCard classes with multiplier metadata
 - ☐ CF-5 Create central card registry and multiplier operations in CashflowAnalysis.jsx

 ## 2. Enhanced Percentile Selection System 🎯 🏷️High
 - ☐ PS-1 Create PercentileSelector.jsx component with global and per-module selection
 - ☐ PS-2 Implement percentile strategy logic (unified vs per-module selection)
 - ☐ PS-3 Add percentile interaction logic for multiplier combinations
 - ☐ PS-4 Create percentile configuration persistence in CashflowContext
 - ☐ PS-5 Add percentile selection validation and conflict detection

 ## 3. Multiplier System Implementation 🔢 🏷️High
 - ☐ MS-1 Implement multiplier source registry and validation
 - ☐ MS-2 Create multiplier operation functions (compound, simple, multiply)
 - ☐ MS-3 Implement applyMultipliers() transformation pipeline
 - ☐ MS-4 Add multiplier dependency tracking and metadata preservation
 - ☐ MS-5 Create multiplier visualization helpers and transparency features

 ## 4. Data Transformation Pipeline 🔄 🏷️High
 - ☐ DT-1 Implement transformScenarioToCashflow() with multiplier support
 - ☐ DT-2 Create line item extractors for percentile, fixed, and multiplier data sources
 - ☐ DT-3 Implement aggregation computation with multiplier effects
 - ☐ DT-4 Create finance metrics calculator with multiplier-adjusted values
 - ☐ DT-5 Add transformer functions for complex sources with multiplier dependencies

 ## 5. Navigation & Main Component 🧭 🏷️High
 - ☐ NAV-1 Add "Cashflow Analysis" route to Sider under Results section
 - ☐ NAV-2 Create CashflowAnalysis.jsx with enhanced percentile selector
 - ☐ NAV-3 Implement manual refresh trigger with multiplier recalculation
 - ☐ NAV-4 Add card grid layout with multiplier metadata display

 ## 6. First Implementation: Timeline Card 📈 🏷️High
 - ☐ TL-1 Create CashflowTimelineCard.jsx with multiplier effect visualization
 - ☐ TL-2 Implement CashflowTimelineChart.jsx with stacked area chart
 - ☐ TL-3 Add percentile ribbon overlay with multiplier variance
 - ☐ TL-4 Implement hover with line-item breakdown and multiplier details
 - ☐ TL-5 Add enhanced percentile switching with multiplier recalculation

 ## 7. Framework Validation: Financeability Card 💰 🏷️Medium
 - ☐ FB-1 Create FinanceabilityCard.jsx with multiplier-aware metrics
 - ☐ FB-2 Implement KPI cards with percentile strategy support
 - ☐ FB-3 Create DSCRHeatStrip.jsx with multiplier effect visualization
 - ☐ FB-4 Add covenant breach detection with multiplier impact analysis
 - ☐ FB-5 Validate framework extensibility with multiplier complexity

 ## 8. Source Registry Configuration 📋 🏷️Medium
 - ☐ SR-1 Define CASHFLOW_SOURCE_REGISTRY with multiplier dependencies
 - ☐ SR-2 Configure escalation, availability, and other multiplier sources
 - ☐ SR-3 Implement refresh functions for multiplier and dependent sources
 - ☐ SR-4 Create error handling for missing multipliers and circular dependencies
 - ☐ SR-5 Add multiplier validation and dependency health checks

 ## 9. Advanced Features 🔧 🏷️Low
 - ☐ AF-1 Create DriverExplorerCard.jsx with multiplier impact analysis
 - ☐ AF-2 Implement CashflowTableCard.jsx with multiplier breakdown columns
 - ☐ AF-3 Add FinancingStressTester.jsx with multiplier scenario testing
 - ☐ AF-4 Create OMVarianceExplorer.jsx with multiplier variance analysis

 ## 10. Documentation & Testing 📝 🏷️Low
 - ☐ DOC-1 Create comprehensive framework and multiplier system documentation
 - ☐ DOC-2 Document card extension patterns with multiplier examples
 - ☐ DOC-3 Add unit tests for multiplier operations and transformations
 - ☐ DOC-4 Create integration tests for percentile and multiplier interactions