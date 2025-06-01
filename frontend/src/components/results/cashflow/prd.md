 # Cash-Flow Analysis Workspace – Product Requirements Document
 Version: v3.0 | Date: 2025-05-31
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
 * Enhanced Percentile Lens: Global or per-module percentile selection governs all views
 * Multiplier System: Support for escalation rates, availability factors, and other multipliers applied to costs/revenues
 * Extensible Framework: Modular card system for easy addition of new analysis types
 * Cross-Module Integration: Aggregates data from Cost, Revenue, Contract, and Financing modules

 ---

 ## 2. Architecture Overview & Code Patterns

 ### 2.1 Context Segregation Strategy
 ScenarioContext (Data Storage Only):
 - Stores all raw simulation results, scenario settings, and user inputs
 - Provides getValueByPath() for reading data
 - Provides updateByPath() for saving computed metrics back to scenario
 - Never modified by CashflowContext - read-only relationship

 CashflowContext (UI State & Caching):
 - Manages percentile selection strategy (unified vs per-module)
 - Caches transformed CashflowDataSource object
 - Tracks manual refresh triggers and stale data detection
 - Provides refreshCashflowData() to trigger recomputation
 - Never stores raw simulation data - only processed/aggregated results

 ### 2.2 Code Patterns to Follow

 #### Context Integration Pattern:
 Reference: ScenarioContext.jsx and useScenario() hook
 javascript
 // Follow this pattern for CashflowContext
 const { getValueByPath, updateByPath } = useScenario();
 const { cashflowData, selectedPercentiles, refreshCashflowData } = useCashflow();
 

 #### Card Component Pattern:
 Reference: ContractScopeCard.jsx and DistributionCard.jsx
 - Use JS classes for base templates with static metadata methods
 - Props-based configuration for data paths and display options
 - Consistent card header with title, icon, and metadata display
 - Error boundaries and loading states for data dependencies

 #### Chart Component Pattern:
 Reference: ContractScopeChart.jsx and PercentileChart.jsx
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
 Reference: metricsUtils.js and chartUtils.js
 - Pure functions with no side effects
 - Consistent error handling and validation
 - Use lodash for data manipulation operations
 - Export named functions with clear parameter documentation

 ### 2.3 Data Flow Architecture

 ScenarioContext (Raw Data)
     ↓ (via getValueByPath, read-only)
 CASHFLOW_SOURCE_REGISTRY (Configuration)
     ↓ (transformScenarioToCashflow)
 CashflowDataSource (Cached in CashflowContext)
     ↓ (percentile selection + multipliers applied)
 Card Components (Visualization)
     ↓ (computed metrics saved back)
 ScenarioContext (via updateByPath)


 ---

 ## 3. Core Data Structures

 ### 3.1 Enhanced CashflowDataSource Schema
 ```javascript
 CashflowDataSource = {
   metadata: { 
     projectLife: number,
     currency: string,
     numWTGs: number,
     availablePercentiles: [10, 25, 50, 75, 90],
     lastUpdated: Date,
     multiplierDependencies: string[] // for transparency
   },
   lineItems: [
     {
       id: string, // 'baseOM', 'contractFees', 'energyRevenue'
       category: 'cost'|'revenue',
       subcategory: string, // 'operations', 'contracts', 'energy'
       name: string, // Display name
       
       // Raw data before multipliers (for transparency)
       rawPercentileData: Map<percentile, DataPointSchema[]>,
       rawFixedData: DataPointSchema[],
       
       // Final data after multipliers applied
       percentileData: Map<percentile, DataPointSchema[]>,
       fixedData: DataPointSchema[],
       
       // Multiplier audit trail
       appliedMultipliers: [
         { id: 'escalationRate', operation: 'compound', values: DataPointSchema[] }
       ],
       hasPercentileVariation: boolean
     }
   ],
   aggregations: {
     totalCosts: { percentileData: Map<percentile, DataPointSchema[]> },
     totalRevenue: { percentileData: Map<percentile, DataPointSchema[]> },
     netCashflow: { percentileData: Map<percentile, DataPointSchema[]> }
   },
   financeMetrics: {
     dscr: Map<percentile, DataPointSchema[]>, // Annual DSCR values
     llcr: Map<percentile, number>, // Loan life coverage ratio
     irr: Map<percentile, number>, // Internal rate of return
     npv: Map<percentile, number>, // Net present value
     covenantBreaches: Map<percentile, BreachSchema[]> // Covenant violations
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
       refreshFunction: null // no refresh needed for settings
     },
     {
       id: 'availabilityFactor',
       path: ['settings', 'project', 'windFarm', 'availabilityFactor'],
       category: 'performance',
       hasPercentiles: false,
       transformer: null,
       refreshFunction: null
     }
   ],
   costs: [
     {
       id: 'baseOM',
       path: ['simulation', 'inputSim', 'cashflow', 'annualCosts', 'components', 'baseOM'],
       category: 'operations',
       hasPercentiles: true,
       transformer: null,
       refreshFunction: 'refreshCashflowSimulation',
       multipliers: [
         { id: 'escalationRate', operation: 'compound', baseYear: 1, cumulative: true }
       ]
     }
   ],
   revenues: [
     {
       id: 'energyRevenue',
       path: ['simulation', 'inputSim', 'cashflow', 'annualRevenue'],
       category: 'energy',
       hasPercentiles: true,
       transformer: null,
       refreshFunction: 'refreshCashflowSimulation',
       multipliers: [
         { id: 'availabilityFactor', operation: 'multiply', baseYear: 1, cumulative: false },
         { id: 'escalationRate', operation: 'compound', baseYear: 1, cumulative: true }
       ]
     }
   ]
 }
 ```

 ### 3.3 Multiplier Operations
``` javascript
 const MULTIPLIER_OPERATIONS = {
   multiply: (baseValue, multiplierValue) => baseValue * multiplierValue,
   compound: (baseValue, rate, year, baseYear) => baseValue * Math.pow(1 + rate, year - baseYear),
   simple: (baseValue, rate, year, baseYear) => baseValue * (1 + rate * (year - baseYear))
 }
 
```
 ---

 ## 4. Enhanced Percentile Selection System

 ### 4.1 Selection Strategies
 Reference Pattern: PrimaryPercentileSelectField.jsx for UI component structure

 #### Unified Mode (Default):
 - Single percentile selection applies to ALL data sources
 - Simple dropdown: P10, P25, P50, P75, P90
 - Fast switching with cached data

 #### Per-Module Mode (Advanced):
 - Different percentiles for different source categories
 - Conservative analysis: Costs at P90, Revenues at P10, Multipliers at P50
 - Modal dialog or drawer for configuration

 ### 4.2 Percentile Interaction Logic
 When line item AND multiplier both have percentiles:
 - Match Strategy (Default): P10 cost × P10 escalation
 - Cross Strategy (Sensitivity): All combinations for variance analysis
 - Fixed Strategy (Simplified): Use median (P50) for all multipliers

 ### 4.3 PercentileSelector Component Requirements
 Reference: Follow Select component patterns from existing codebase
 - Dropdown for unified mode selection
 - "Advanced" button to open per-module configuration
 - Visual indicators showing current selection strategy
 - Validation to ensure selected percentiles exist in data

 ---

 ## 5. Card Framework Architecture

 ### 5.1 Base Class Templates
 Reference Pattern: Follow existing component patterns but use JS classes for inheritance

 ```javascript
 // Base class for detail cards (timeline, driver analysis, table)
 class CashflowDetailCard {
   constructor(dataSource, selectedPercentiles, focusedLineItems = []) {
     this.dataSource = dataSource;
     this.selectedPercentiles = selectedPercentiles;
     this.focusedLineItems = focusedLineItems;
   }
   
   // Static metadata for framework registration
   static getRequiredLineItems() { return []; } // ['baseOM', 'energyRevenue'] or ['all']
   static getRequiredMultipliers() { return []; } // ['escalationRate']
   static getCardType() { return 'detail'; }
   static getDisplayName() { return 'Base Detail Card'; }
   static getDescription() { return 'Base class for detail cards'; }
   
   // Instance methods
   getFilteredData() { /* filter dataSource by focusedLineItems */ }
   getMultiplierMetadata() { /* return applied multipliers info */ }
   validateData() { /* check required data availability */ }
   
   // Must be implemented by subclasses
   render() { throw new Error('render() must be implemented'); }
 }
 
 // Base class for summary cards (financeability, KPIs)
 class CashflowSummaryCard {
   constructor(dataSource, selectedPercentiles) {
     this.dataSource = dataSource;
     this.selectedPercentiles = selectedPercentiles;
   }
   
   static getCardType() { return 'summary'; }
   
   getAggregationMetadata() { /* return aggregation details */ }
   render() { throw new Error('render() must be implemented'); }
 }
 ```

 ### 5.2 Card Registration System
 Location: CashflowAnalysis.jsx main component
 ```javascript
 const CARD_REGISTRY = {
   timeline: {
     component: CashflowTimelineCard,
     enabled: true,
     order: 1,
     gridProps: { xs: 24, sm: 24, md: 24, lg: 12 }
   },
   financeability: {
     component: FinanceabilityCard,
     enabled: true,
     order: 2,
     gridProps: { xs: 24, sm: 24, md: 24, lg: 12 }
   },
   drivers: {
     component: DriverExplorerCard,
     enabled: true,
     order: 3,
     gridProps: { xs: 24, sm: 24, md: 12, lg: 8 }
   },
   table: {
     component: CashflowTableCard,
     enabled: true,
     order: 4,
     gridProps: { xs: 24, sm: 24, md: 12, lg: 16 }
   }
 }
 ```

 ---

 ## 6. Development Prioritization & Dependencies

 ### 6.1 Critical Path (Must Complete First):
 1. Core Framework & Data Architecture (CF-1 to CF-5)
    - Establishes foundation for all subsequent development
    - CashflowContext, schemas, transformation utilities
    - Base card classes and registry system

 2. Enhanced Percentile Selection System (PS-1 to PS-5)
    - ALL CARDS DEPEND ON THIS - must be completed early
    - Required for any card to display data correctly
    - Determines how multiplier interactions work

 3. Multiplier System Implementation (MS-1 to MS-5)
    - Required for realistic financial modeling
    - Needed before any card shows meaningful results
    - Essential for escalation and performance adjustments

 ### 6.2 Implementation Order:
 1. Framework Foundation → Test with mock data
 2. Percentile System → Validate percentile switching
 3. Multiplier System → Validate escalation effects
 4. Single Card (Timeline) → End-to-end validation
 5. Second Card (Financeability) → Framework extensibility test
 6. Remaining Cards → Feature completion

 ---

 ## 7. Detailed Component Specifications

 ### 7.1 Priority 1 Components (Answer Business Questions)

 #### CashflowTimelineCard (Question 1: "What does our cash timeline look like?")
 Reference: ContractScopeCard.jsx for card structure, PercentileChart.jsx for chart patterns
 - Chart Type: Stacked area chart with Plotly
 - Data Display: Revenue (positive), costs (negative), net cashflow line
 - Percentile Overlay: P10-P90 envelope ribbon around net cashflow
 - Interactions: Hover for annual breakdown, click to focus line items
 - Multiplier Transparency: Tooltip shows applied multipliers per line item

 #### FinanceabilityCard (Question 2: "Is the project financeable?")
 Reference: FormSection and FieldCard layouts for KPI organization
 - KPI Cards: IRR, NPV, DSCR minimum, LLCR (with percentile confidence)
 - DSCR Heat Strip: Annual DSCR visualization with covenant threshold
 - Covenant Alerts: Red flags for years with breaches
 - Stress Testing: Drawer component for sensitivity analysis

 #### DriverExplorerCard (Question 3: "What are the key value drivers?")
 Reference: Chart patterns from StatisticsChart.jsx
 - Tornado Chart: NPV sensitivity to input variables (with multipliers)
 - Impact Ranking: Variables sorted by impact magnitude
 - Multiplier Analysis: Show direct vs multiplied effects
 - Cross-Panel Linking: Highlight selected driver in other cards

 #### CashflowTableCard (Question 4: "What are the detailed breakdowns?")
 Reference: EditableTable component patterns
 - Columns: Year, Line Items (expandable), Selected Percentile, P10/P90 spread
 - Cumulative View: Toggle for cumulative vs annual values
 - Export Capability: CSV download for further analysis
 - Multiplier Columns: Show pre/post multiplier values

 ### 7.2 Supporting Components

 #### PercentileSelector
 Reference: PrimaryPercentileSelectField.jsx and Select patterns
 - Unified Mode: Simple dropdown with P10, P25, P50, P75, P90
 - Advanced Mode: Per-module configuration modal
 - Strategy Display: Badge showing current selection method
 - Validation: Ensure selected percentiles exist in available data

 #### DSCRHeatStrip
 Reference: Heatmap patterns from existing chart components
 - Annual DSCR: Color-coded bars for each project year
 - Covenant Line: Horizontal threshold line (typically 1.2 or 1.3)
 - Breach Indicators: Red highlighting for years below threshold
 - Hover Details: Exact DSCR values and margin above/below covenant

 ---

 ## 8. File Structure & Organization

 Follow existing patterns for maintainability:
```
 frontend/src/
 ├── contexts/
 │   └── CashflowContext.jsx                  # UI state & caching (follows ScenarioContext pattern)
 ├── components/
 │   ├── results/cashflow/
 │   │   ├── CashflowAnalysis.jsx            # Main page component (follows DistributionAnalysis pattern)
 │   │   ├── base/
 │   │   │   ├── CashflowDetailCard.js       # Base class for detail cards
 │   │   │   └── CashflowSummaryCard.js      # Base class for summary cards
 │   │   └── components/
 │   │       ├── PercentileSelector.jsx      # Enhanced percentile selection
 │   │       ├── DSCRHeatStrip.jsx          # Covenant visualization
 │   │       ├── FinancingStressTester.jsx  # Scenario testing drawer
 │   │       └── OMVarianceExplorer.jsx     # Cost variance analysis
 │   ├── cards/ (follow existing card organization)
 │   │   ├── CashflowTimelineCard.jsx       # Timeline visualization
 │   │   ├── FinanceabilityCard.jsx         # KPIs and covenants
 │   │   ├── DriverExplorerCard.jsx         # Value driver analysis
 │   │   └── CashflowTableCard.jsx          # Detailed breakdown table
 │   └── charts/ (follow existing chart organization)
 │       └── CashflowTimelineChart.jsx      # Chart implementation
 ├── utils/
 │   └── cashflowUtils.js                    # Transformation utilities (follows metricsUtils pattern)
 └── schemas/yup/
     └── cashflow.js                          # Data validation schemas
```

 ---

 ## 9. Extension Patterns for Future Development

 ### 9.1 Adding New Cost/Revenue Source
 Reference: Follow registry patterns established in codebase
 1. Add entry to CASHFLOW_SOURCE_REGISTRY.costs or .revenues
 2. Specify path to data in ScenarioContext
 3. Define multiplier dependencies if needed
 4. Create transformer function if complex mapping required
 5. Add refresh function for simulation-based sources

 ### 9.2 Adding New Multiplier
 1. Add to CASHFLOW_SOURCE_REGISTRY.multipliers
 2. Reference in dependent line items' multipliers array
 3. Add new operation type to MULTIPLIER_OPERATIONS if needed
 4. Update percentile interaction logic if required

 ### 9.3 Adding New Card
 Reference: Follow existing card patterns
 1. Extend CashflowDetailCard or CashflowSummaryCard base class
 2. Implement required static methods for metadata
 3. Create React component following existing card patterns
 4. Register in CARD_REGISTRY with grid layout properties
 5. Test with various percentile selection strategies

 ---

 ## 10. Success Criteria & Validation

 ### 10.1 Business Question Validation
 - Timeline Question: ≥90% of users can identify cash flow peaks/troughs within 30 seconds
 - Financeability Question: ≥90% of users can determine DSCR covenant compliance within 1 minute
 - Driver Question: ≥90% of users can identify top 3 value drivers within 2 minutes
 - Detail Question: ≥90% of users can export annual breakdowns within 1 minute

 ### 10.2 Technical Performance
 - Percentile switching responds in <500ms for typical datasets (20 years, 10 line items)
 - Framework supports new card addition without core code changes
 - Multiplier effects are transparent and auditable in all visualizations
 - System handles 30-year projects with 20+ cost sources without performance degradation

 ### 10.3 Framework Extensibility
 - New cost/revenue source addition requires only registry configuration
 - New multiplier type can be added with single function implementation
 - New card can be created by extending base class and registering
 - Error handling gracefully degrades with missing data sources

## 11. Q&A Summary - Architectural Decisions

 This section captures key questions asked during development planning and the decisions made to guide future development sessions.

 ### 11.1 Data Architecture & Context Management

 Q: How should CashflowContext interact with ScenarioContext? Should data be stored in both?
 A: Data segregation strategy established:
 - ScenarioContext: Stores ALL raw simulation results, scenario settings, user inputs (read-only for cashflow)
 - CashflowContext: Only UI state & caching (percentile selection, transformed CashflowDataSource object, manual refresh triggers)
 - No data duplication: CashflowContext uses getValueByPath() to read from ScenarioContext, never stores raw data
 - Location: CashflowContext belongs in src/contexts/ folder for consistency with existing context organization

 Q: Should we extend existing schemas or create parallel structures?
 A: Extend and reuse existing schemas wherever possible:
 - Use existing DataPointSchema for time series data (year/value pairs)
 - Use existing SimulationInfoSchema.results for percentile-based data
 - Use existing PercentileSchema for percentile definitions
 - Only create new schemas for cashflow-specific aggregations and finance metrics
 - Avoid parallel structures - stack new data into existing object structures rather than transform

 ### 11.2 Card Framework & Development Patterns

 Q: Should we use actual JS classes or React component interfaces for card templates?
 A: Use actual JS classes for base templates:
 - Provides clear inheritance and interface contracts
 - Easier to enforce required methods across card types
 - Better IDE support and documentation
 - Can use static methods for metadata (getRequiredLineItems, getRequiredMultipliers)
 - Follows best-practice patterns for extensible frameworks

 Q: Should cards register themselves or use central registry?
 A: Central registry maintained in CashflowAnalysis.jsx:
 - Avoid self-registration complexity for now
 - Easier to manage and debug during development
 - Central location makes card ordering and layout configuration simpler
 - Can evolve to self-registration later if needed

 ### 11.3 Multiplier System Design

 Q: How should multiplier precedence work when line items have multiple multipliers?
 A: Apply multipliers in declaration order:
 - Simple and predictable behavior
 - Easy to debug and understand
 - No complex precedence rules needed
 - Order can be adjusted in registry configuration if needed

 Q: How should percentile interaction work when both costs and multipliers have percentiles?
 A: Three strategies with Match as default:
 - Match Strategy (Default): P10 cost × P10 escalation (same percentile)
 - Cross Strategy (Sensitivity): All combinations for variance analysis
 - Fixed Strategy (Simplified): Use median (P50) for all multipliers
 - Enhanced PercentileSelector component needed to manage this complexity

 Q: Should multiplier line items appear in charts or just show their effects?
 A: Show effects only, but note usage in metadata:
 - Multipliers don't appear as separate chart series
 - Effects are visible in the final line item values
 - Multiplier usage noted in card metadata and hover tooltips
 - Transparency maintained through applied multipliers audit trail

 ### 11.4 Development Prioritization

 Q: Which card should we implement first to test the framework?
 A: CashflowTimelineCard chosen for first implementation:
 - Representative complexity without being overwhelming
 - Uses both percentile and fixed data sources
 - Requires aggregation logic (stacked chart)
 - Needs percentile switching capability
 - Tests multiplier effect visualization
 - Answers primary business question: "What does our cash timeline look like?"

 Q: Should percentile switching rebuild data or use cached transforms?
 A: Use cached transforms with pre-computed data:
 - All percentile data generated simultaneously during simulation
 - No need to recreate inputs - just switch display
 - Cashflow parent object contains all percentiles from simulation
 - Some costs/revenues are fixed (no percentiles) - line items support both modes
 - Manual refresh button triggers complete recalculation when needed

 ### 11.5 Line Item & Multiplier Support

 Q: Should line items support both percentile AND fixed data simultaneously?
 A: Yes, each line item supports both:
 - percentileData: Map<percentile, DataPointSchema[]> for simulation outputs
 - fixedData: DataPointSchema[] for contracts and fixed costs
 - hasPercentileVariation: boolean flag indicates which type
 - Enables mixing simulation results with fixed contract schedules

 Q: Should aggregations be computed on-demand or pre-computed?
 A: Pre-compute and cache during cashflow object creation:
 - Better performance for percentile switching
 - Consistent with overall caching strategy
 - Aggregations computed during transformScenarioToCashflow()
 - Memory vs performance tradeoff acceptable for wind project datasets

 ### 11.6 Error Handling & Data Validation

 Q: How should we handle missing data sources (e.g., module not configured)?
 A: Registry-based with refresh functions and graceful degradation:
 - Each registered line item can provide optional refreshFunction reference
 - Makes sense for simulation outputs that can be refreshed
 - Missing data sources show placeholder with clear error messages
 - Cards validate required data and show appropriate fallbacks
 - Framework continues to work with partial data availability

 Q: Do we need to detect when scenario data changes require cashflow rebuild?
 A: Manual refresh for now, automatic detection as future feature:
 - Manual refresh button triggers complete recalculation
 - Avoids complexity of change detection during initial development
 - Can add automatic stale detection in later versions
 - Refresh button follows existing UI patterns in codebase

 ### 11.7 Business Requirements Alignment

 Q: What are the four critical business questions this workspace must answer?
 A: Four questions serve as guiding principles for all development:
 1. "What does our cash timeline look like over the project life?" → CashflowTimelineCard priority
 2. "Is the project financeable at our required confidence level?" → FinanceabilityCard priority
 3. "What are the key value drivers affecting project returns?" → DriverExplorerCard priority
 4. "What are the detailed annual cash breakdowns?" → CashflowTableCard priority
 - All cards must clearly address one of these questions
 - Success metrics tied to user ability to answer these questions quickly
 - Framework extensibility validated by supporting additional analysis questions