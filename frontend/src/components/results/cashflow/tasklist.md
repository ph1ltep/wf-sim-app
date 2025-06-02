 # Cash-Flow Analysis Workspace – Development Plan | v4.3 | 2025-06-02
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
 - ◐ CP-5 Integrate construction costs with financing debt drawdown calculations

 ## 9. FinanceabilityCard Implementation 💰 🏷️High
 - ☐ FC-1 Create FinanceabilityCard.jsx with KPI dashboard layout
 - ☐ FC-2 Implement basic DCF calculations with WACC discounting
 - ☐ FC-3 Add debt service schedule calculations using financing parameters
 - ☐ FC-4 Create DSCR timeline with covenant threshold visualization
 - ☐ FC-5 Add confidence interval displays for key financial metrics (P10-P90)
 - ☐ FC-6 Implement covenant breach probability analysis across percentiles

 ## 10. Enhanced Finance Calculations 📈 🏷️Medium
 - ☐ EFC-1 Replace placeholder IRR calculation with proper NPV iteration method
 - ☐ EFC-2 Implement accurate NPV calculation with project-specific discount rates
 - ☐ EFC-3 Create proper DSCR calculation using actual debt service schedules
 - ☐ EFC-4 Add LLCR (Loan Life Coverage Ratio) calculation
 - ☐ EFC-5 Integrate grace period effects on debt service calculations

 ## 11. Schema and Context Updates 🗂️ 🏷️Medium
 - ☑ SCU-1 Update scenario schema with constructionPhase and limits fields
 - ☑ SCU-2 Add capex drawdown source to CASHFLOW_SOURCE_REGISTRY
 - ☐ SCU-3 Update financing calculations to use construction timeline
 - ☑ SCU-4 Add validation for drawdown schedule percentages (InlineEditTable handles this)

 ## 12. Additional Data Sources 📋 🏷️Low
 - ☑ ADS-1 Complete major repairs integration from CostModule settings
 - ☑ ADS-2 Add insurance premium costs from RiskModule settings
 - ☑ ADS-3 Implement reserve funds provision scheduling
 - ☐ ADS-4 Add degradation factors for revenue streams
 - ☐ ADS-5 Integrate financing costs and debt service schedules

 ## 13. Driver Analysis & Sensitivity 🔍 🏷️Low
 - ☐ DA-1 Create DriverExplorerCard.jsx with tornado chart visualization
 - ☐ DA-2 Implement NPV sensitivity analysis for key input variables
 - ☐ DA-3 Add ranking of variables by impact magnitude
 - ☐ DA-4 Create cross-panel linking to highlight selected drivers
 - ☐ DA-5 Add scenario comparison capabilities

 ## 14. Detailed Breakdown & Export 📊 🏷️Low
 - ☐ DB-1 Create CashflowTableCard.jsx with detailed annual breakdowns
 - ☐ DB-2 Add expandable line item details with multiplier effects
 - ☐ DB-3 Implement CSV export functionality for analysis
 - ☐ DB-4 Add cumulative vs annual view toggle
 - ☐ DB-5 Create summary statistics and variance analysis

 ## 15. UI Component Cleanup 🧹 🏷️Low
 - 🔥 UCC-1 Remove unused CashflowSummaryCard and CashflowDetailCard base classes
 - ☐ UCC-2 Update card registry to reflect direct React component pattern
 - ☐ UCC-3 Standardize card prop interfaces across all components

 ## 16. V2 Advanced Features 🚀 🏷️Future
 - ☐ V2-1 Advanced terminal value calculations with multiple exit scenarios
 - ☐ V2-2 Tax shield benefits modeling from debt financing structure
 - ☐ V2-3 Monthly-level cash flow accuracy for construction phase
 - ☐ V2-4 Advanced debt modeling with variable rate structures
 - ☐ V2-5 Integration with external market data APIs for pricing
 - ☐ V2-6 Multi-scenario Monte Carlo analysis with correlation modeling
 - ☐ V2-7 Advanced sensitivity analysis with interaction effects
 - ☐ V2-8 Real-time covenant monitoring and alerting system

 ---

 ## Files to Remove/Delete 🗑️
 - 🔥 UCC-1 Remove frontend/src/components/results/cashflow/xbase/xCashflowSummaryCard.jsx
 - 🔥 UCC-1 Remove frontend/src/components/results/cashflow/xbase/xCashflowDetailCard.jsx

 ---

 ## Technical Considerations & Patterns

 ### Established Code Patterns:
 - Context Management: CashflowContext reads from ScenarioContext (read-only), manages UI state
 - Component Structure: Direct React components with props, abandoned JS class inheritance
 - Data Transformation: Registry → transformers → multipliers → aggregation pipeline
 - Error Handling: Graceful degradation with Alert components, comprehensive error boundaries
 - Audit Transparency: Complete calculation trails with AuditTrailViewer component

 ### Performance Considerations:
 - Memoized calculations: useMemo for expensive chart data preparation
 - Debounced refreshes: Timeout-based refresh triggers to prevent infinite loops
 - Cached transformations: Pre-computed aggregations stored in context
 - Minimal re-renders: Careful dependency arrays and React.useEffect patterns

 ### Extension Requirements:
 - Registry-based sources: Add new cost/revenue via CASHFLOW_SOURCE_REGISTRY configuration
 - Transformer functions: Standardized interface for new data type processing
 - Card components: Simple React component pattern following CashflowTimelineCard
 - Multiplier operations: Pluggable operations with complete audit trails

 ### Key Simplifications Made:
 - Removed complex percentile interactions: Single percentile per source, no cross-analysis
 - Abandoned JS class inheritance: Direct React components for better maintainability
 - Simplified data structure: Cards get {data: DataPoint[], metadata: {...}} instead of complex Maps
 - Essential logging only: Reduced verbose debugging to key development information

 ### Critical Dependencies & Next Session Focus:
 - FinanceabilityCard: Next priority to complete business question #2
 - Enhanced finance metrics: Replace IRR/NPV placeholders with proper calculations
 - Construction cost integration: Add capex drawdown to cashflow transformation
 - Registry maintenance: Easy addition of new data sources via configuration

 ### Development Workflow:
 - Cards validate data: Show helpful errors instead of crashing
 - Complete audit trails: All calculations via AuditTrailViewer
 - Percentile selection: Works seamlessly between unified and per-source strategies
 - Error boundaries: Prevent component crashes and show recovery options
 - Transformation pipeline: Handles missing data gracefully with warnings

 ---

 ## Current Status Summary
 Completed: Core framework (100%), percentile system (100%), multiplier implementation (100%), data transformation pipeline (100%), timeline card with audit trails (100%), construction phase integration (95%), and comprehensive error handling (100%).

 Next Priority: FinanceabilityCard implementation (Task FC-1) to address business question #2: "Is the project financeable at our required confidence level?"

 Ready for Cleanup: Remove unused base classes (UCC-1) before proceeding with new card development.