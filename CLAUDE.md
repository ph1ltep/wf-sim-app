# CLAUDE.md - Wind Finance Simulator

## Project Overview
Wind farm financial modeling platform with React + Antd frontend, Express backend, and Monte Carlo simulation engine.

## Task Delegation Strategy

### Parallel Sub-Agent Coordination
**Multiple agents can work together simultaneously** for optimal results:

**Feature Development Pipeline:**
- **frontend-feature-architect** → **api-data-architect** → **frontend-master-engineer**
- **wind-finance-risk-analyst** provides domain expertise throughout
- **documentation-manager** updates docs after significant changes

### Agent Specializations

**IMPORTANT** Dynamically call any sub-agent deemed necessary or significantly helpful for the task at hand. Call sub-agents in PARALLEL when possible.

**frontend-master-engineer**: React implementation
- Collaborate with **wind-finance-risk-analyst** for statistical algorithms
- Coordinate with **api-data-architect** for optimal data structures
- Partner with **documentation-manager** for component documentation

**frontend-feature-architect**: Feature planning & architecture  
- Work with **api-data-architect** to design data structures
- Consult **wind-finance-risk-analyst** for critical data requirements
- Plan feature breakdown and component hierarchies

**api-data-architect**: Data structures & API design
- Design Yup schemas and API endpoints
- Collaborate with **wind-finance-risk-analyst** for financial data models
- Support **frontend-master-engineer** with optimal data patterns

**wind-finance-risk-analyst**: Domain expertise
- Provide risk algorithms and statistical methods
- Guide financial model requirements across all agents
- Review data structures for industry compliance

**documentation-manager**: Documentation maintenance
- **Always called after significant feature changes**
- Updates README, API docs, and component documentation
- Maintains consistency across all documentation

## Core Architecture

### Stack
- **Frontend**: React 19 + Antd + Plotly + React Router
- **Backend**: Express + MongoDB + Monte Carlo engine
- **State**: ScenarioContext (data) + CubeContext (analytics)
- **Validation**: Yup schemas → auto-generate Mongoose

### Critical Data Flow
```javascript
// 1. User Input → ScenarioContext
const { updateByPath } = useScenario();
await updateByPath('settings.financial.discountRate', 0.08);

// 2. ScenarioContext → CubeContext → Analytics
const { getData } = useCube();
const metrics = getData({ sourceId: 'npv', percentile: 50 });

// 3. Auto-sync Components
<ContextField path="settings.revenue.electricityPrice" fieldType="distribution" />
```

## Essential Patterns

### Component Standards
- **Max 200 lines** per component
- **Props typing** with PropTypes/defaults
- **useMemo** for expensive computations
- **Antd components** (Card, Form, Table, etc.)

### API Integration
```javascript
// Standard error handling
try {
  const response = await api.post('/endpoint', data);
  if (!response.data.success) throw new Error(response.data.error);
  return response.data.data;
} catch (error) {
  message.error(error.message);
  throw error;
}
```

### Key Components
- **ContextField** - Auto-sync form inputs
- **DistributionFieldV3** - Monte Carlo parameters  
- **CashflowTimelineCard** - Financial projections
- **FinanceabilityCard** - Key metrics display

## Development Workflow

### Commands
```bash
cd frontend && npm start        # React dev server
cd backend && npm run dev       # API + Monte Carlo
cd backend && npm run seed:locations  # Database setup
```

### Testing & Quality
```bash
cd frontend && npm test         # React testing
cd frontend && npm run build    # Production build
```

## Critical Rules

1. **Edit existing files first** - avoid new file creation
2. **Yup schemas drive everything** - validation + Mongoose generation
3. **Context-first state management** - minimize local state
4. **Fail fast validation** - explicit error boundaries
5. **Antd design system** - consistent UI patterns
6. **Distribution-aware inputs** - support uncertainty modeling
7. **Git commits** - MUST follow rules at @.claude/references/git-conventional-commits.md