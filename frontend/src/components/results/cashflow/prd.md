 # Cash-Flow Analysis Workspace – Product Requirements Document
 Version: v2.0 | Date: 2025-05-31
 Author: Development Team

 ---

 ## 1. Purpose & Vision
 Create an extensible analyst workspace that converts Monte-Carlo simulation results into clear, actionable insights on cash timing, financeability, value drivers, and project financials for wind industry service contracts.

 ### Core Features:
 * Enhanced Percentile Lens: Global or per-module percentile selection governs all views
 * Multiplier System: Support for escalation rates, availability factors, and other multipliers applied to costs/revenues
 * Extensible Framework: Modular card system for easy addition of new analysis types
 * Cross-Module Integration: Aggregates data from Cost, Revenue, Contract, and Financing modules

 ---

 ## 2. Architecture Overview

 ### 2.1 Data Flow Architecture

 ScenarioContext (Data Storage)
     ↓ (via getValueByPath)
 Source Registry (Configuration)
     ↓ (transformation pipeline)
 CashflowDataSource (Processed Object)
     ↓ (with multipliers applied)
 Card Components (Visualization)


 ### 2.2 Core Data Structure
 javascript
 CashflowDataSource = {
   metadata: { projectLife, currency, numWTGs, percentiles },
   lineItems: [
     {
       id: string,
       category: 'cost'|'revenue',
       subcategory: string,
       name: string,
       rawPercentileData: Map<percentile, DataPointSchema[]>,
       rawFixedData: DataPointSchema[],
       percentileData: Map<percentile, DataPointSchema[]>, // after multipliers
       fixedData: DataPointSchema[], // after multipliers
       appliedMultipliers: [{ id, operation, values }],
       hasPercentileVariation: boolean
     }
   ],
   aggregations: {
     totalCosts: { percentileData: Map<percentile, DataPointSchema[]> },
     totalRevenue: { percentileData: Map<percentile, DataPointSchema[]> },
     netCashflow: { percentileData: Map<percentile, DataPointSchema[]> }
   },
   financeMetrics: {
     dscr: Map<percentile, DataPointSchema[]>,
     irr: Map<percentile, number>,
     npv: Map<percentile, number>,
     covenantBreaches: Map<percentile, BreachSchema[]>
   }
 }
 

 ### 2.3 Source Registry System
 javascript
 CASHFLOW_SOURCE_REGISTRY = {
   multipliers: [
     {
       id: 'escalationRate',
       path: ['settings', 'modules', 'cost', 'escalationRate'],
       category: 'escalation',
       hasPercentiles: true,
       transformer: 'distributionToTimeSeries'
     }
   ],
   costs: [
     {
       id: 'baseOM',
       path: ['simulation', 'inputSim', 'cashflow', 'annualCosts'],
       category: 'operations',
       hasPercentiles: true,
       multipliers: [
         {
           id: 'escalationRate',
           operation: 'compound',
           baseYear: 1,
           cumulative: true
         }
       ],
       refreshFunction: 'refreshSimulationResults'
     }
   ],
   revenues: [ /* same structure */ ]
 }
 

 ### 2.4 Multiplier Operations
 - multiply: Simple multiplication (value × multiplier)
 - compound: Compound growth (value × (1 + rate)^years)
 - simple: Simple additive (value × (1 + rate × years))

 ---

 ## 3. Enhanced Percentile Selection System

 ### 3.1 Selection Modes
 1. Unified Mode: Single percentile applies to all data sources
 2. Per-Module Mode: Different percentiles for different modules/sources
    - Costs: P90 (conservative)
    - Revenues: P10 (conservative)
    - Multipliers: P50 (median)

 ### 3.2 Percentile Interaction Logic
 When both line item and multiplier have percentiles:
 - Match Strategy: P10 cost × P10 escalation (recommended default)
 - Cross Strategy: All combinations (for sensitivity analysis)
 - Fixed Strategy: Use fixed percentile for multipliers

 ---

 ## 4. Card Framework Architecture

 ### 4.1 Base Classes
 javascript
 class CashflowDetailCard {
   constructor(dataSource, selectedPercentiles, focusedLineItems) {}
   static getRequiredLineItems() { return []; }
   static getRequiredMultipliers() { return []; }
   render() { return ReactComponent; }
   getMultiplierMetadata() { return {}; }
 }
 
 class CashflowSummaryCard {
   constructor(dataSource, selectedPercentiles) {}
   render() { return ReactComponent; }
   getAggregationMetadata() { return {}; }
 }
 

 ### 4.2 Card Registration System
 javascript
 const CARD_REGISTRY = {
   timeline: {
     component: CashflowTimelineCard,
     type: 'detail',
     title: 'Cash-Flow Timeline',
     description: 'Stacked waterfall visualization',
     requiredLineItems: ['all'],
     requiredMultipliers: ['escalationRate']
   },
   financeability: {
     component: FinanceabilityCard,
     type: 'summary', 
     title: 'Financeability Dashboard',
     description: 'KPIs and covenant analysis'
   }
 }
 

 ---

 ## 5. Core Components Specification

 ### 5.1 Panel Components

 | Component | Type | Key Features |
 |-----------|------|--------------|
 | CashflowTimelineCard | Detail | Stacked area chart, percentile ribbons, multiplier effects |
 | FinanceabilityCard | Summary | KPI cards, DSCR heat-strip, covenant breach alerts |
 | DriverExplorerCard | Detail | Tornado chart, multiplier impact analysis |
 | CashflowTableCard | Detail | Detailed breakdown, multiplier columns, export capability |

 ### 5.2 Supporting Components

 | Component | Purpose |
 |-----------|---------|
 | PercentileSelector | Enhanced percentile selection with strategy modes |
 | DSCRHeatStrip | Covenant visualization with multiplier variance |
 | FinancingStressTester | Scenario testing with multiplier adjustments |
 | OMVarianceExplorer | Cost variance analysis with multiplier breakdown |

 ---

 ## 6. Functional Requirements

 | ID | Requirement | Priority |
 |----|-------------|----------|
 | FR-1 | System shall support global and per-module percentile selection with near-instant switching | High |
 | FR-2 | System shall apply multipliers (escalation, availability, etc.) to dependent line items in declaration order | High |
 | FR-3 | Timeline visualization shall show stacked cashflows with percentile variance envelopes | High |
 | FR-4 | Financeability dashboard shall calculate DSCR, LLCR, IRR, NPV with multiplier effects and flag covenant breaches | High |
 | FR-5 | System shall provide transparent multiplier metadata showing what multipliers were applied to each line item | High |
 | FR-6 | Framework shall support easy addition of new cost/revenue sources via registry configuration | High |
 | FR-7 | Framework shall support easy addition of new card types via base class extension | Medium |
 | FR-8 | System shall cache processed cashflow data and provide manual refresh capability | Medium |
 | FR-9 | All components shall remain responsive on screens ≥ 1280px with graceful mobile degradation | Medium |
 | FR-10 | Driver explorer shall rank input variables by NPV impact including multiplier effects | Low |

 ---

 ## 7. Data Integration Points

 ### 7.1 Input Data Sources
 - SimulationInfoSchema: Percentile-based results from Monte Carlo simulations
 - Cost Module: Base O&M, failure events, major repairs, escalation rates
 - Revenue Module: Energy production, electricity prices, degradation rates
 - Contracts Module: OEM contract fees, time series schedules
 - Financing Module: Debt parameters, tax rates, WACC calculations

 ### 7.2 Output Data Products
 - Processed CashflowDataSource: Unified data structure for all cards
 - Aggregated Metrics: Total costs, revenues, net cashflows by percentile
 - Finance Metrics: DSCR, LLCR, IRR, NPV with covenant analysis
 - Multiplier Metadata: Transparency tracking of applied multipliers

 ---

 ## 8. File Structure

```
 frontend/src/
 ├── contexts/CashflowContext.jsx
 ├── components/
 │   ├── results/cashflow/
 │   │   ├── CashflowAnalysis.jsx              # Main component
 │   │   ├── base/
 │   │   │   ├── CashflowDetailCard.js        # Base detail card class
 │   │   │   └── CashflowSummaryCard.js       # Base summary card class
 │   │   └── components/
 │   │       ├── PercentileSelector.jsx       # Enhanced percentile selection
 │   │       ├── DSCRHeatStrip.jsx           # Covenant visualization
 │   │       ├── FinancingStressTester.jsx   # Scenario testing
 │   │       └── OMVarianceExplorer.jsx      # Variance analysis
 │   ├── cards/
 │   │   ├── CashflowTimelineCard.jsx        # Stacked timeline
 │   │   ├── FinanceabilityCard.jsx          # KPIs and covenants
 │   │   ├── DriverExplorerCard.jsx          # Tornado analysis
 │   │   └── CashflowTableCard.jsx           # Detailed breakdown
 │   └── charts/
 │       └── CashflowTimelineChart.jsx       # Chart implementation
 ├── utils/cashflowUtils.js                   # Transformation utilities
 └── schemas/yup/cashflow.js                  # Data schemas
```

 ---

 ## 9. Extension Patterns

 ### 9.1 Adding New Cost/Revenue Source
 1. Add entry to CASHFLOW_SOURCE_REGISTRY
 2. Specify multiplier dependencies if needed
 3. Create transformer function if complex mapping required
 4. Add refresh function for simulation-based sources

 ### 9.2 Adding New Multiplier
 1. Add to multipliers section in registry
 2. Reference in dependent line items' multipliers array
 3. Add new operation type if needed in MULTIPLIER_OPERATIONS

 ### 9.3 Adding New Card
 1. Extend CashflowDetailCard or CashflowSummaryCard
 2. Implement required methods and static metadata
 3. Register in CARD_REGISTRY
 4. Add to card grid layout

 ---

 ## 10. Success Metrics

 - ≥ 90% of analyst testers can answer "Is the project financeable at P90?" within 3 minutes
 - UI responds in < 500ms for percentile switching on typical datasets
 - Framework supports addition of new card without core changes
 - Multiplier effects are transparent and auditable in all visualizations
 - System handles 30-year projects with 20+ cost sources without performance degradation