 # Cash-Flow Analysis Workspace – Product Requirements Document
 Version: v4.0 | Date: 2025-06-01
 Author: Development Team
 ---
 ## 1. Purpose & Vision
 Create an extensible analyst workspace that converts Monte-Carlo simulation results into clear, actionable insights for four critical business questions in wind industry service contracts:
 ### Primary Business Questions (Guiding Principles):
 1. "What does our cash timeline look like over the project life?" → CashflowTimelineCard
 2. "Is the project financeable at our required confidence level?" → FinanceabilityCard
 3. "What are the key value drivers affecting project returns?" → DriverExplorerCard
 4. "What are the detailed annual cash breakdowns?" → CashflowTableCard
 ### Core Features:
 * Enhanced Percentile Lens: Global or per-source percentile selection governs all views
 * Multiplier System: Support for escalation rates, availability factors, and other multipliers applied to costs/revenues
 * Extensible Framework: Modular card system for easy addition of new analysis types
 * Cross-Module Integration: Aggregates data from Cost, Revenue, Contract, and Financing modules
 * Audit Trail Transparency: Complete calculation visibility with multiplier effects and percentile selections
 ---
 ## 2. Architecture Overview & Code Patterns
 ### 2.1 Context Segregation Strategy
 ScenarioContext (Data Storage Only):
 - Stores all raw simulation results, scenario settings, and user inputs
 - Provides getValueByPath() for reading data
 - Provides updateByPath() for saving computed metrics back to scenario
 - Never modified by CashflowContext - read-only relationship
 CashflowContext (UI State & Caching):
 - Manages percentile selection strategy (unified vs per-source)
 - Caches transformed CashflowDataSource object
 - Tracks manual refresh triggers and stale data detection
 - Provides refreshCashflowData() to trigger recomputation
 - Never stores raw simulation data - only processed/aggregated results
 ### 2.2 Implemented Code Patterns
 #### Context Integration Pattern:
 Reference: ScenarioContext.jsx and useScenario() hook
 javascript
 // Established pattern for CashflowContext
 const { getValueByPath, updateByPath } = useScenario();
 const { cashflowData, selectedPercentiles, refreshCashflowData } = useCashflow();
 
 #### Card Component Pattern:
 Reference: CashflowTimelineCard.jsx (simplified approach)
 - Direct React components instead of JS class inheritance
 - Props-based configuration for data paths and display options
 - Consistent card header with title, icon, and metadata display
 - Error boundaries and loading states for data dependencies
 #### Chart Component Pattern:
 Reference: PercentileChart.jsx and existing chart components
 - Use Plotly for advanced visualizations (timeline charts, heatmaps)
 - Use recharts for simple charts (bar charts, line charts)
 - Memoize expensive chart data transformations
 - Provide hover tooltips with detailed breakdowns
 #### Layout Pattern:
 Reference: contextFields/layouts/index.js and examples
 - Use FormSection, FieldCard, ResponsiveFieldRow for consistent spacing
 - Follow existing breakpoint patterns for responsive design
 - Use FieldGroup and InlineFieldGroup for component organization
 #### Utility Functions Pattern:
 Reference: cashflowUtils.js and contractUtils.js
 - Pure functions with no side effects
 - Consistent error handling and validation
 - Use lodash for data manipulation operations
 - Export named functions with clear parameter documentation
 ### 2.3 Data Flow Architecture
```
 ScenarioContext (Raw Data)
     ↓ (via getValueByPath, read-only)
 CASHFLOW_SOURCE_REGISTRY (Configuration)
     ↓ (transformScenarioToCashflow)
 CashflowDataSource (Cached in CashflowContext)
     ↓ (percentile selection + multipliers applied)
 Card Components (Visualization)
     ↓ (computed metrics saved back)
 ScenarioContext (via updateByPath)
```
 ---
 ## 3. Core Data Structures
 ### 3.1 Simplified CashflowDataSource Schema
``` javascript
 CashflowDataSource = {
   metadata: { 
     projectLife: number,
     currency: string,
     numWTGs: number,
     availablePercentiles: [10, 25, 50, 75, 90],
     lastUpdated: Date,
     percentileStrategy: {
       strategy: 'unified'|'perSource',
       selections: Object // sourceId -> percentile or {unified: percentile}
     }
   },
   lineItems: [
     {
       id: string, // 'contractFees', 'energyRevenue'
       category: 'cost'|'revenue',
       subcategory: string, // 'contracts', 'energy'
       name: string, // Display name
       
       // Simplified: Single data array for selected percentile
       data: DataPointSchema[], // [{year: 1, value: 1000}, ...]
       
       // Metadata about calculation
       metadata: {
         selectedPercentile: number,
         hasPercentileVariation: boolean,
         appliedMultipliers: AppliedMultiplierSchema[],
         description: string
       }
     }
   ],
   aggregations: {
     totalCosts: { data: DataPointSchema[], metadata: {...} },
     totalRevenue: { data: DataPointSchema[], metadata: {...} },
     netCashflow: { data: DataPointSchema[], metadata: {...} }
   },
   financeMetrics: {
     dscr: { data: DataPointSchema[], metadata: {covenantThreshold: 1.3} },
     irr: { value: number, metadata: {...} },
     npv: { value: number, metadata: {...} },
     covenantBreaches: { data: BreachSchema[], metadata: {...} }
   }
 }
 ```
 ### 3.2 Source Registry Configuration
 ```javascript
 CASHFLOW_SOURCE_REGISTRY = {
   multipliers: [
     {
       id: 'escalationRate',
       path: ['settings', 'modules', 'cost', 'escalationRate'],
       category: 'escalation',
       hasPercentiles: true,
       transformer: 'distributionToTimeSeries',
       description: 'Annual cost escalation rate'
     },
     {
       id: 'electricityPrice',
       path: ['simulation', 'inputSim', 'distributionAnalysis', 'electricityPrice'],
       category: 'pricing',
       hasPercentiles: true,
       transformer: null,
       description: 'Electricity price per MWh'
     }
   ],
   costs: [
     {
       id: 'contractFees',
       path: ['settings', 'modules', 'contracts', 'oemContracts'],
       category: 'contracts',
       hasPercentiles: false,
       transformer: 'contractsToAnnualCosts',
       multipliers: [
         { id: 'escalationRate', operation: 'compound', baseYear: 1 }
       ],
       description: 'OEM service contract fees (total project costs)'
     },
     {
       id: 'majorRepairs',
       path: ['settings', 'modules', 'cost', 'majorRepairEvents'],
       category: 'maintenance',
       hasPercentiles: false,
       transformer: 'majorRepairsToAnnualCosts',
       multipliers: [{ id: 'escalationRate', operation: 'compound', baseYear: 1 }],
       description: 'Major repair events and costs'
     },
     {
       id: 'reserveFunds',
       path: ['settings', 'modules', 'risk', 'reserveFunds'],
       category: 'reserves',
       hasPercentiles: false,
       transformer: 'reserveFundsToProvision',
       multipliers: [],
       description: 'Reserve fund provisions (allocated but not spent)',
       displayNote: 'Shown as provision allocation, not immediate cash outflow'
     }
   ],
   revenues: [
     {
       id: 'energyRevenue',
       path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction'],
       category: 'energy',
       hasPercentiles: true,
       transformer: null,
       multipliers: [
         { id: 'electricityPrice', operation: 'multiply', baseYear: 1 },
         { id: 'escalationRate', operation: 'compound', baseYear: 1 }
       ],
       description: 'Energy production revenue (MWh × Price × Escalation)'
     }
   ]
 }
 ```
 ### 3.3 Multiplier Operations
 ```javascript
 const MULTIPLIER_OPERATIONS = {
   multiply: (baseValue, multiplierValue) => baseValue * multiplierValue,
   compound: (baseValue, rate, year, baseYear) => baseValue * Math.pow(1 + rate/100, year - baseYear),
   simple: (baseValue, rate, year, baseYear) => baseValue * (1 + rate/100 * (year - baseYear))
 }
 ```
 ---
 ## 4. Simplified Percentile Selection System
 ### 4.1 Selection Strategies
 Reference Pattern: PercentileSelector.jsx for UI component structure
 #### Unified Mode (Default):
 - Single percentile selection applies to ALL data sources
 - Simple dropdown: P10, P25, P50, P75, P90
 - Fast switching with cached data
 #### Per-Source Mode (Advanced):
 - Different percentiles for different source categories
 - Conservative analysis: Costs at P90, Revenues at P10
 - Modal dialog for configuration
 ### 4.2 Implementation Details
 - Percentiles are read from scenario settings (settings.simulation.percentiles)
 - Primary percentile from settings.simulation.primaryPercentile
 - Per-source selection allows different percentile per individual data source
 - Simple match strategy: each source uses its selected percentile for both data and multipliers
 ---
 ## 5. Card Framework Architecture
 ### 5.1 Simplified Component Approach
 Abandoned JS class inheritance in favor of direct React components:
 ```javascript
 // Simple card component pattern
 const CashflowTimelineCard = ({ cashflowData, selectedPercentiles }) => {
   // Data validation
   if (!cashflowData) return <Empty />;
   
   // Chart preparation
   const chartData = useMemo(() => prepareChartData(cashflowData), [cashflowData]);
   
   // Render with error boundaries
   return (
     <Card title="Timeline" extra={<AuditButton />}>
       <Plot data={chartData.data} layout={chartData.layout} />
     </Card>
   );
 };
 ```
 ### 5.2 Card Registry System
 Location: CashflowAnalysis.jsx main component
 ```javascript
 const CASHFLOW_CARD_REGISTRY = {
   timeline: {
     component: CashflowTimelineCard,
     enabled: true,
     gridProps: { span: 24 }
   }
 }
 ```
 ---
 ## 6. Implementation Priorities & Status
 ### 6.1 Completed (Critical Path):
 1. ✅ Core Framework & Data Architecture - Foundation established
 2. ✅ Enhanced Percentile Selection System - Unified and per-source selection
 3. ✅ Multiplier System Implementation - Escalation, pricing multipliers
 4. ✅ Data Transformation Pipeline - Complete transformation with audit trails
 5. ✅ Navigation & Framework Validation - Timeline card working end-to-end
 6. ✅ Data Source Implementation - Proper revenue calculation, contract fees, cost sources
 ### 6.2 Next Priorities:
 1. Financeability Card - DSCR analysis, covenant compliance, KPI dashboard
 2. Enhanced Finance Metrics - Replace placeholder calculations with real formulas
 3. Additional Cost Sources - Complete major repairs, insurance, reserve funds integration
 4. Driver Explorer Card - Sensitivity analysis and value driver identification
 5. Table Card - Detailed breakdowns with export capability
 ---
 ## 7. Detailed Component Specifications
 ### 7.1 CashflowTimelineCard (✅ COMPLETED)
 Reference: CashflowTimelineCard.jsx for implementation patterns
 - Chart Type: Line chart with Plotly (revenue positive, costs negative, net cashflow)
 - Data Display: Revenue (green), costs (red), net cashflow (blue) with zero line
 - Audit Trail: Complete calculation transparency via AuditTrailViewer
 - Interactions: Hover for annual breakdown, audit button for calculation details
 - Multiplier Transparency: Shows applied multipliers in metadata
 ### 7.2 FinanceabilityCard (🎯 NEXT PRIORITY)
 Reference: Existing KPI patterns and financial metric displays
 - KPI Cards: IRR, NPV, DSCR minimum, LLCR (with percentile confidence)
 - DSCR Visualization: Annual DSCR timeline with covenant threshold
 - Covenant Alerts: Red flags for years with breaches
 - Confidence Intervals: Show P10-P90 ranges for key metrics
 ---
 ## 8. File Structure & Organization (Current State)
```
 frontend/src/
 ├── contexts/
 │   └── CashflowContext.jsx                  # ✅ UI state & caching
 ├── components/
 │   ├── results/cashflow/
 │   │   ├── CashflowAnalysis.jsx            # ✅ Main page component
 │   │   └── components/
 │   │       ├── PercentileSelector.jsx      # ✅ Percentile selection
 │   │       └── AuditTrailViewer.jsx        # ✅ Calculation transparency
 │   └── cards/
 │       └── CashflowTimelineCard.jsx        # ✅ Timeline visualization
 ├── utils/
 │   ├── cashflowUtils.js                    # ✅ Core utilities
 │   └── cashflow/
 │       ├── transform.js                    # ✅ Main transformation orchestrator
 │       ├── contractUtils.js                # ✅ Contract processing logic
 │       ├── transformers/                   # ✅ Data transformation functions
 │       └── multipliers/                    # ✅ Multiplier operations
 └── schemas/yup/
     └── cashflow.js                          # ✅ Data validation schemas
```
 ---
 ## 9. Key Architectural Decisions & Q&A
 ### 9.1 Data Architecture Decisions
 Q: Should we use complex percentile interaction strategies?
 A: NO - Simplified to single percentile selection per source
 - Each source uses its selected percentile for both data and multipliers
 - Removed cross-analysis and complex interaction modes
 - Much simpler to understand and implement
 Q: Should we use JS classes or React components for cards?
 A: React components - Abandoned JS class inheritance
 - Direct React components are simpler and more maintainable
 - Props-based configuration instead of class methods
 - Better integration with React patterns and hooks
 Q: How should we handle missing simulation data?
 A: Graceful degradation with informative messages
 - Components show helpful alerts instead of crashing
 - Comprehensive error boundaries catch rendering errors
 - Transformation continues with partial data availability
 ### 9.2 Performance & Optimization Decisions
 Q: Should we pre-compute all percentile combinations?
 A: NO - Compute only selected percentiles on demand
 - Much more efficient memory usage
 - Faster initial load times
 - Simpler data structures
 Q: How should we handle multiplier calculations?
 A: Sequential application with audit trails
 - Apply multipliers in declaration order
 - Track complete calculation history for transparency
 - Store both raw and final values for comparison
 ### 9.3 Extension & Maintenance Decisions
 Q: How should we add new data sources?
 A: Registry-based configuration with standardized transformers
 - Add entries to CASHFLOW_SOURCE_REGISTRY
 - Create transformer functions following established patterns
 - Automatic integration with percentile and multiplier systems
 Q: How should we handle different contract fee structures?
 A: Centralized contract processing logic
 - Shared utilities between timeline and heatmap components
 - Handles both fixed fees and time-series contracts
 - Proper per-turbine to total conversion
 ---
 ## 10. Success Criteria & Current Status
 ### 10.1 Business Question Validation
 - ✅ Timeline Question: Users can identify cash flow peaks/troughs with working timeline card
 - 🎯 Financeability Question: Next priority - DSCR covenant compliance analysis
 - ⏳ Driver Question: Planned - identify top value drivers
 - ⏳ Detail Question: Planned - export annual breakdowns
 ### 10.2 Technical Performance (Current Status)
 - ✅ Percentile switching: Responds quickly for typical datasets
 - ✅ Framework extensibility: Timeline card validates end-to-end flow
 - ✅ Multiplier transparency: Complete audit trails implemented
 - ✅ Error handling: Graceful degradation with missing data
 ### 10.3 Framework Validation (Completed)
 - ✅ Data transformation: Complete pipeline from scenario to cards
 - ✅ Card integration: Timeline card working with real data
 - ✅ Audit transparency: Users can see exactly how numbers are calculated
 - ✅ Error recovery: System continues working with partial data
 ---
 ## 11. Next Session Continuation Guide
 ### 11.1 Immediate Next Steps
 1. FinanceabilityCard implementation - Create KPI dashboard with DSCR analysis
 2. Enhanced finance metrics - Replace placeholder IRR/NPV calculations with real formulas
 3. Additional cost sources - Complete major repairs and insurance integration
 4. Performance optimization - Profile and optimize transformation pipeline if needed
 ### 11.2 Key Files to Focus On
 - frontend/src/components/cards/FinanceabilityCard.jsx (create next)
 - frontend/src/utils/cashflowUtils.js (enhance finance calculations)
 - frontend/src/contexts/CashflowContext.jsx (add any needed registry entries)
 ### 11.3 Architecture Patterns to Maintain
 - Simple card components with props-based configuration
 - Registry-based data sources for easy extension
 - Comprehensive error handling with graceful degradation
 - Audit trail transparency for all calculations
 - Minimal logging focused on essential development information
 ### 11.4 Key Implementation Notes
 - Cards receive simple {data: DataPoint[], metadata: {...}} structure
 - All multiplier effects are pre-calculated in transformation pipeline
 - Contract fees are properly normalized to totals (not per-turbine)
 - Percentile selection works with both unified and per-source strategies
 - Comprehensive error boundaries prevent crashes with missing data