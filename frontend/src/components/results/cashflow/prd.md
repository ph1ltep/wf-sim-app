 # Cashflow Analysis Development Plan | v4.0 | 2025-06-01
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
 - 🔥 PS-3 Removed complex percentile interaction logic (over-engineered)
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
 ## 8. Advanced Cards Implementation 💰 🏷️Medium
 - ☐ AC-1 Create FinanceabilityCard.jsx with KPI dashboard layout
 - ☐ AC-2 Implement DSCR timeline visualization with covenant thresholds
 - ☐ AC-3 Add covenant breach detection and alerting
 - ☐ AC-4 Create confidence interval displays for financial metrics
 - ☐ AC-5 Add stress testing capabilities for financing scenarios
 ## 9. Enhanced Finance Calculations 📈 🏷️Medium
 - ☐ FC-1 Replace placeholder IRR calculation with proper financial formula
 - ☐ FC-2 Implement accurate NPV calculation with discount rates
 - ☐ FC-3 Create proper DSCR calculation using debt service schedules
 - ☐ FC-4 Add LLCR (Loan Life Coverage Ratio) calculation
 - ☐ FC-5 Implement covenant breach probability analysis across percentiles
 ## 10. Additional Data Sources 📋 🏷️Low
 - ☐ ADS-1 Complete major repairs integration from CostModule settings
 - ☐ ADS-2 Add insurance premium costs from RiskModule settings
 - ☐ ADS-3 Implement reserve funds provision scheduling
 - ☐ ADS-4 Add degradation factors for revenue streams
 - ☐ ADS-5 Integrate financing costs and debt service schedules
 ## 11. Driver Analysis & Sensitivity 🔍 🏷️Low
 - ☐ DA-1 Create DriverExplorerCard.jsx with tornado chart visualization
 - ☐ DA-2 Implement NPV sensitivity analysis for key input variables
 - ☐ DA-3 Add ranking of variables by impact magnitude
 - ☐ DA-4 Create cross-panel linking to highlight selected drivers
 - ☐ DA-5 Add scenario comparison capabilities
 ## 12. Detailed Breakdown & Export 📊 🏷️Low
 - ☐ DB-1 Create CashflowTableCard.jsx with detailed annual breakdowns
 - ☐ DB-2 Add expandable line item details with multiplier effects
 - ☐ DB-3 Implement CSV export functionality for analysis
 - ☐ DB-4 Add cumulative vs annual view toggle
 - ☐ DB-5 Create summary statistics and variance analysis
 ---
 ## Files Completed/Modified:
 ✅ COMPLETED:
```
 frontend/src/
 ├── contexts/CashflowContext.jsx                    # Context with percentile management
 ├── components/
 │   ├── common/Sider.jsx                            # Added cashflow route
 │   ├── results/cashflow/
 │   │   ├── CashflowAnalysis.jsx                    # Main dashboard component
 │   │   └── components/
 │   │       ├── PercentileSelector.jsx              # Unified/per-source selection
 │   │       └── AuditTrailViewer.jsx                # Calculation transparency
 │   └── cards/
 │       └── CashflowTimelineCard.jsx                # Timeline with audit trail
 ├── utils/
 │   ├── cashflowUtils.js                            # Core transformation utilities
 │   └── cashflow/
 │       ├── transform.js                            # Main orchestrator with reduced logging
 │       ├── contractUtils.js                        # Centralized contract processing
 │       ├── transformers/
 │       │   ├── index.js                            # Transformer registry
 │       │   ├── contractTransformer.js              # Contract fee processing
 │       │   ├── costTransformer.js                  # Major repairs, insurance, reserves
 │       │   ├── distributionTransformer.js          # Distribution → time series
 │       │   └── simulationTransformer.js            # Simulation result extraction
 │       └── multipliers/
 │           ├── index.js                            # Multiplier application logic
 │           └── operations.js                       # Operation functions
 └── schemas/yup/
     └── cashflow.js                                  # Simplified validation schemas

 App.js                                               # Updated 
 ```
 routing and providers

 🎯 NEXT TO CREATE:
```
 frontend/src/components/cards/
 ├── FinanceabilityCard.jsx                          # KPI dashboard with DSCR analysis
 ├── DriverExplorerCard.jsx                          # Sensitivity analysis (future)
 └── CashflowTableCard.jsx                           # Detailed breakdown table (future)
```
 ---
 ## Technical Considerations & Patterns:
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
 - Additional cost sources: Complete major repairs, insurance, reserves integration
 - Registry maintenance: Easy addition of new data sources via configuration
 ### Development Workflow:
 - Cards validate data and show helpful errors instead of crashing
 - All calculations have complete audit trails via AuditTrailViewer
 - Percentile selection works seamlessly between unified and per-source strategies
 - Error boundaries prevent component crashes and show recovery options
 - Transformation pipeline handles missing data gracefully with warnings