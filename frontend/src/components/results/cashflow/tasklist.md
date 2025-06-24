# Cash-Flow Analysis Workspace – Development Plan | v4.5 | 2025-06-05
Legend: ☐ Not Started ◐ In-Progress ☑ Done 🔥 Cleanup

## 1. Core Framework & Data Architecture 🏗️ 🏷️High
- ☑ CF-1 Create CashflowContext.jsx with source registry and caching logic
- ☑ CF-2 Define simplified CashflowDataSource schema in schemas/yup/cashflow.js
- ☑ CF-3 Create cashflowUtils.js with transformation and aggregation functions
- ☑ CF-4 Implement simplified card component pattern (abandoned JS classes)
- ☑ CF-5 Create CashflowAnalysis.jsx main component with card registry

## 2. Enhanced Percentile Selection System 🎯 🏷️High
- ☑ PS-1 Create PercentileSelector.jsx component with unified and per-source selection
- ☑ PS-2 Implement simplified percentile strategy logic in CashflowContext
- ☑ PS-3 Removed complex percentile interaction logic (over-engineered)
- ☑ PS-4 Add percentile validation and conflict detection

## 3. Multiplier System Implementation 🔢 🏷️High
- ☑ MS-1 Implement multiplier source registry with proper data source paths
- ☑ MS-2 Create multiplier operation functions (compound, simple, multiply)
- ☑ MS-3 Implement simplified applyMultipliers() transformation pipeline
- ☑ MS-4 Add multiplier dependency tracking and audit trail metadata

## 4. Data Transformation Pipeline 🔄 🏷️High
- ☑ DT-1 Implement transformScenarioToCashflow() with proper data source handling
- ☑ DT-2 Create line item extractors for simulation and configuration data sources
- ☑ DT-3 Implement aggregation computation with proper totals calculation
- ☑ DT-4 Create placeholder finance metrics calculator (IRR, NPV, DSCR)

## 5. Navigation & Framework Validation 🧭 🏷️High
- ☑ NAV-1 Add "Cashflow Analysis" route to Sider component and App.js routing
- ☑ NAV-2 Complete CashflowAnalysis.jsx with percentile selector integration
- ☑ TL-1 Create CashflowTimelineCard.jsx with Plotly timeline visualization
- ☑ TL-2 Implement audit trail viewer for calculation transparency

## 6. Data Source Implementation 📊 🏷️High
- ☑ DS-1 Update registry with proper revenue calculation (energy × price × escalation)
- ☑ DS-2 Fix contract fee transformer to handle per-turbine totals correctly
- ☑ DS-3 Add transformer functions for major repairs, insurance, and reserve funds
- ☑ DS-4 Centralize contract processing logic in contractUtils.js
- ☑ DS-5 Add AuditTrailViewer component for complete calculation transparency

## 7. Error Handling & Optimization 🔧 🏷️Medium
- ☑ EH-1 Add comprehensive error boundaries and graceful degradation
- ☑ EH-2 Fix infinite render loops with proper useEffect dependencies
- ☑ EH-3 Improve data validation and transformer error handling
- ☑ EH-4 Reduce logging to essential development information with emojis

## 8. Construction Phase Implementation 🏗️🏷️High
- ☑ CP-1 Extend Cost Module schema with constructionPhase section using DataPointSchema
- ☑ CP-2 Create CapexDrawdownCard component for Investment tab
- ☑ CP-3 Add capex drawdown schedule transformer to cashflow pipeline
- ☑ CP-4 Update CashflowTimelineCard to display negative years (construction phase)
- ☑ CP-5 Integrate construction costs with financing debt drawdown calculations

## 9. Transformer Signature Standardization 🔧 🏷️High
- ☑ TS-1 Update CASHFLOW_SOURCE_REGISTRY to use .path + .references array structure
- ☑ TS-2 Standardize all transformer signatures to (dataSource, dataReferences, sourceConfig)
- ☑ TS-3 Update transformScenarioToCashflow to separate primary and reference data
- ☑ TS-4 Update all transformer functions (contract, cost, financing, distribution, simulation)
- ☑ TS-5 Add registry schema validation using existing validate functions
- ☑ TS-6 Test unified and per-source percentile modes with new system

## 10. MetricsDataTable Framework 📊 🏷️High
- ☑ MT-1 Create schemas/yup/metrics.js with essential table schemas
- ☑ MT-2 Create frontend/src/components/tables/metrics/index.js main exports
- ☑ MT-3 Create frontend/src/components/tables/metrics/MetricsDataTable.jsx main component
- ☑ MT-4 Create frontend/src/components/tables/metrics/TableConfiguration.js config utilities
- ☑ MT-5 Create frontend/src/components/tables/metrics/MetricsCell.jsx cell rendering component
- ☑ MT-6 Create frontend/src/components/tables/metrics/DataOperations.js data transformation utilities
- ☑ MT-7 Implement rich tooltip support with icons and threshold-based color coding
- ☑ MT-8 Add column selection functionality with configurable valueField callbacks

## 11. Financial Chart Utilities 📈 🏷️High
- ☑ FC-1 Create frontend/src/utils/financialChartsUtils.js finance-specific chart functions
- ☑ FC-2 Create frontend/src/utils/financingMetrics.js extract and enhance financing calculations
- ☑ FC-3 Add Interest Coverage Ratio (ICR) and Average DSCR calculations
- ☑ FC-4 Add covenant step-down handling and timeline annotations
- ☑ FC-5 Integrate enhanced finance metrics into cashflow transformation pipeline
- ☑ FC-6 Add prepareFinancialTimelineData() for multi-metric charts (DSCR + LLCR + ICR)
- ☑ FC-7 Add prepareDualAxisChartData() for cash flows + ratios visualization
- ☑ FC-8 Add refinancing window and covenant annotation utilities

## 12. FinanceabilityCard Enhancement 💰 🏷️High
- ☑ FE-1 Replace inline summary table with MetricsDataTable component
- ☑ FE-2 Add all percentiles display with Project IRR, Equity IRR, NPV, Min DSCR, LLCR
- ☑ FE-3 Implement column selection for chart filtering by percentile
- ☑ FE-4 Add LLCR and ICR to DSCR timeline chart (multi-metric visualization)
- ☑ FE-5 Add covenant step-down annotations and grace period markers
- ☑ FE-6 Implement threshold-based color coding for covenant breaches
- ☑ FE-7 Add enhanced tooltips with financial metric explanations

## 13. CashflowTimelineCard Enhancement 📈 🏷️High
- ☑ CT-1 Add debt service payments to timeline (secondary axis)
- ☑ CT-2 Add free cash flow to equity calculation and display
- ☑ CT-3 Add refinancing window annotations for typical refinancing periods
- ☑ CT-4 Implement dual-axis chart layout with proper scaling
- ☑ CT-5 Add interactive controls for toggling debt service and equity cashflow display
- ☑ CT-6 Enhance metadata footer with additional display options

## 14. Enhanced Finance Calculations 📈 🏷️Medium
- ☑ EFC-1 Replace placeholder IRR calculation with proper NPV iteration method
- ☑ EFC-2 Implement accurate NPV calculation with project-specific discount rates
- ☑ EFC-3 Create proper DSCR calculation using actual debt service schedules
- ☑ EFC-4 Add LLCR (Loan Life Coverage Ratio) calculation
- ☑ EFC-5 Add Equity IRR calculation for sponsor-level returns
- ☑ EFC-6 Integrate grace period effects on debt service calculations

## 15. Schema and Context Updates 🗂️ 🏷️Medium
- ☑ SCU-1 Update scenario schema with constructionPhase and limits fields
- ☑ SCU-2 Add capex drawdown source to CASHFLOW_SOURCE_REGISTRY
- ☑ SCU-3 Update financing calculations to use construction timeline
- ☑ SCU-4 Add validation for drawdown schedule percentages (InlineEditTable handles this)
- ☑ SCU-5 Add CashflowSourceRegistrySchema to schemas/yup/cashflow.js
- ☑ SCU-6 Add MetricsDataTable schemas to schemas/yup/metrics.js

## 16. Additional Data Sources 📋 🏷️Low
- ☑ ADS-1 Complete major repairs integration from CostModule settings
- ☑ ADS-2 Add insurance premium costs from RiskModule settings
- ☑ ADS-3 Implement reserve funds provision scheduling
- ☑ ADS-4 Add financing costs and debt service schedules integration
- ☐ ADS-5 Add degradation factors for revenue streams
- ☐ ADS-6 Integrate operational expenditure escalation patterns

## 17. Driver Analysis & Sensitivity 🔍 🏷️Low
- ☐ DA-1 Create DriverExplorerCard.jsx with tornado chart visualization
- ☐ DA-2 Implement NPV sensitivity analysis for key input variables
- ☐ DA-3 Add ranking of variables by impact magnitude
- ☐ DA-4 Create cross-panel linking to highlight selected drivers
- ☐ DA-5 Add scenario comparison capabilities
- ☐ DA-6 Integrate with MetricsDataTable for driver value display

## 18. Detailed Breakdown & Export 📊 🏷️Low
- ☐ DB-1 Create CashflowTableCard.jsx with detailed annual breakdowns
- ☐ DB-2 Add expandable line item details with multiplier effects
- ☐ DB-3 Implement CSV export functionality for analysis
- ☐ DB-4 Add cumulative vs annual view toggle
- ☐ DB-5 Create summary statistics and variance analysis
- ☐ DB-6 Use MetricsDataTable for detailed breakdowns display

## 19. UI Component Cleanup 🧹 🏷️Low
- 🔥 UCC-1 Remove unused CashflowSummaryCard and CashflowDetailCard base classes
- ☑ UCC-2 Update card registry to reflect direct React component pattern
- ☑ UCC-3 Standardize card prop interfaces across all components
- ☐ UCC-4 Refactor common chart utilities to use financialChartsUtils.js
- ☐ UCC-5 Clean up unused imports and legacy code patterns

## 20. Documentation & Patterns 📚 🏷️Medium
- ☐ DOC-1 Create cashflow registry documentation with source configuration patterns
- ☐ DOC-2 Document MetricsDataTable usage patterns and configuration options
- ☐ DOC-3 Create financial chart utilities usage guide with examples
- ☐ DOC-4 Document multi-percentile data access patterns for different card types
- ☐ DOC-5 Add troubleshooting guide for registry configuration and transformer functions
- ☐ DOC-6 Create MetricsDataTable schema documentation with threshold examples

## 21. Performance & Optimization 🚀 🏷️Medium
- ☐ PO-1 Profile MetricsDataTable rendering performance with large datasets
- ☐ PO-2 Optimize financial chart rendering for multiple percentiles
- ☐ PO-3 Add memoization to expensive financial calculations
- ☐ PO-4 Implement virtual scrolling for large percentile datasets
- ☐ PO-5 Add loading states and skeleton screens for table components

## 22. V2 Advanced Features 🚀 🏷️Future
- ☐ V2-1 Advanced terminal value calculations with multiple exit scenarios
- ☐ V2-2 Tax shield benefits modeling from debt financing structure
- ☐ V2-3 Monthly-level cash flow accuracy for construction phase
- ☐ V2-4 Advanced debt modeling with variable rate structures
- ☐ V2-5 Integration with external market data APIs for pricing
- ☐ V2-6 Multi-scenario Monte Carlo analysis with correlation modeling
- ☐ V2-7 Advanced sensitivity analysis with interaction effects
- ☐ V2-8 Real-time covenant monitoring and alerting system
- ☐ V2-9 DSCR rolling averages and grace period covenant logic
- ☐ V2-10 Monte Carlo stress testing across multiple scenarios
- ☐ V2-11 Credit rating estimation algorithms
- ☐ V2-12 Debt sizing optimization tools
- ☐ V2-13 Tax shield modeling for project finance structures
- ☐ V2-14 Full lifecycle DCF analysis with detailed asset valuation models
- ☐ V2-15 Advanced MetricsDataTable features (sorting, filtering, grouping)
- ☐ V2-16 Interactive financial dashboard with drag-drop components
- ☐ V2-17 Export capabilities for financial models (Excel, PDF reports)
- ☐ V2-18 Advanced covenant step-down modeling with market conditions
- ☐ V2-19 Integration with external credit rating and pricing models
- ☐ V2-20 Advanced refinancing optimization and timing analysis

---

## Technical Considerations & Patterns

### Established Code Patterns:
- Context Management: CashflowContext reads from ScenarioContext (read-only), manages UI state
- Component Structure: Direct React components with props, abandoned JS class inheritance
- Data Transformation: Registry → transformers → multipliers → aggregation pipeline
- Error Handling: Graceful degradation with Alert components, comprehensive error boundaries
- Audit Transparency: Complete calculation trails with AuditTrailViewer component
- NEW: MetricsDataTable pattern: Schema-driven table with conditional formatting and column selection
- NEW: Financial Chart Utilities: Specialized charting functions for multi-metric financial analysis
- NEW: Enhanced Finance Metrics: ICR, Average DSCR, Equity IRR integrated into pipeline
- NEW: Transformer signatures: (dataSource, dataReferences, sourceConfig) standardized pattern

### Performance Considerations:
- Memoized calculations: useMemo for expensive chart data preparation and financial calculations
- Debounced refreshes: Timeout-based refresh triggers to prevent infinite loops
- Cached transformations: Pre-computed aggregations stored in context
- Minimal re-renders: Careful dependency arrays and React.useEffect patterns
- NEW: MetricsDataTable optimization: Efficient threshold evaluation and column generation
- NEW: Chart data preparation: Optimized for multiple percentiles with selective rendering

### Extension Requirements:
- Registry-based sources: Add new cost/revenue via CASHFLOW_SOURCE_REGISTRY configuration
- Transformer functions: Standardized interface for new data type processing
- Card components: Simple React component pattern following established cards
- Multiplier operations: Pluggable operations with complete audit trails
- NEW: MetricsDataTable usage: Schema-driven table for any percentile-based metrics
- NEW: Financial chart extensions: Multi-metric charts with covenant annotations
- NEW: Enhanced finance metrics: Easy addition of new financial calculations
- NEW: Registry structure: .path (primary) + .references (array) + schema validation

### Key Simplifications Made:
- Removed complex percentile interactions: Single percentile per source, no cross-analysis
- Abandoned JS class inheritance: Direct React components for better maintainability
- Simplified data structure: Cards get {data: DataPoint[], metadata: {...}} instead of complex Maps
- Essential logging only: Reduced verbose debugging to key development information
- NEW: Pragmatic schema usage: Only complex objects get Yup schemas, simpler objects use JSDoc
- NEW: Unified transformer signatures: All use same (dataSource, dataReferences, sourceConfig) pattern

### Critical Dependencies & Architecture:
- FinanceabilityCard: COMPLETED - comprehensive bankability analysis with MetricsDataTable
- CashflowTimelineCard: COMPLETED - enhanced with dual-axis and debt service visualization
- Enhanced finance metrics: COMPLETED - ICR, Average DSCR, Equity IRR integrated
- MetricsDataTable system: COMPLETED - reusable table component with rich features
- Financial chart utilities: COMPLETED - specialized charting functions for finance
- Construction cost integration: COMPLETED - capex drawdown fully integrated
- Registry maintenance: COMPLETED - standardized with schema validation
- NEW: Multi-percentile support: Complete percentile selection and filtering across components
- NEW: Threshold-based formatting: Automatic color coding and risk assessment

### Development Workflow:
- Cards validate data: Show helpful errors instead of crashing
- Complete audit trails: All calculations via AuditTrailViewer
- Percentile selection: Works seamlessly between unified and per-source strategies
- Error boundaries: Prevent component crashes and show recovery options
- Transformation pipeline: Handles missing data gracefully with warnings
- NEW: MetricsDataTable validation: Schema validation with runtime error handling
- NEW: Financial chart preparation: Robust data handling with fallbacks
- NEW: Enhanced finance calculations: Comprehensive error handling and fallback values
- NEW: Schema validation: Registry structure validated on load with helpful error messages

---

## Current Status Summary
Completed: Core framework (100%), percentile system (100%), multiplier implementation (100%), data transformation pipeline (100%), timeline card with audit trails (100%), construction phase integration (100%), comprehensive error handling (100%), transformer signature standardization (100%), MetricsDataTable framework (100%), enhanced financial calculations (100%), FinanceabilityCard enhancement (100%), CashflowTimelineCard enhancement (100%).

Next Priority: DriverExplorerCard implementation (Task DA-1) to address business question #3: "What are the key value drivers affecting project returns?"

Ready for Cleanup: Remove unused base classes (UCC-1) and legacy code patterns.

NEW COMPLETIONS:
- MetricsDataTable Framework: Fully generalized table component with schema validation, conditional formatting, column selection, and rich tooltips
- Enhanced Financial Analysis: ICR, Average DSCR, Equity IRR calculations integrated into pipeline
- Multi-Metric Charts: DSCR + LLCR + ICR visualization with covenant annotations and percentile filtering
- Dual-Axis Timeline: Cash flows + debt service with refinancing windows and interactive controls
- World-Class Investment Analysis: Comprehensive financial metrics suitable for both project finance and corporate finance decisions

Architecture Status: The cashflow analysis system now provides enterprise-grade financial analysis capabilities with interactive filtering, comprehensive metric coverage, and professional-quality visualizations suitable for investment committee presentations and financing negotiations.