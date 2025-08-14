# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wind Farm Simulation Application (wf-sim-app) - A full-stack risk analysis and visualization tool for wind energy projects featuring Monte Carlo simulations, financial modeling, and sensitivity analysis.

**Architecture**: MERN stack with React frontend and Node.js/Express backend
- **Frontend**: React 19 + Ant Design UI + React Router + Plotly.js for visualizations
- **Backend**: Express.js + MongoDB with Mongoose + Monte Carlo simulation engine
- **Validation**: Yup schemas shared between frontend and backend

## Development Commands

### Backend (from `/backend` directory)
- `npm start` - Production server
- `npm run dev` - Development server with nodemon hot reload
- `npm run seed:locations` - Seed location data in database

### Frontend (from `/frontend` directory) 
- `npm start` - Development server (uses react-app-rewired)
- `npm run build` - Production build
- `npm test` - Run tests

### Root Level
No test scripts configured. Tests should be run from individual frontend/backend directories.

## Key Architecture Patterns

### Data Flow & State Management
- **ScenarioContext**: Manages scenario data, CRUD operations, and validation using Immer for immutable updates
- **CubeContext**: Handles computed data (sources, metrics, sensitivity analysis) with sequential refresh stages
- Data flows: Raw scenario → Source computation → Metrics computation → Sensitivity analysis
- Both contexts use similar refresh patterns with controlled sequential execution

### Validation System
- **Source of Truth**: Yup schemas in `/schemas/yup/` directory
- **Frontend**: Real-time field validation + object validation before submission
- **Backend**: Middleware validation using same Yup schemas
- **Database**: Mongoose schemas auto-generated from Yup schemas in `/schemas/mongoose/`

### Monte Carlo Simulation Engine
- **Location**: `backend/services/monte-carlo-v2/`
- **Features**: 11 distribution types (Normal, Lognormal, Weibull, GBM, etc.), time-series support, percentile analysis
- **API**: Exposed via `/api/simulation` endpoints with comprehensive request/response schemas
- **Documentation**: Detailed usage guide in `backend/services/monte-carlo-v2/README.md`

## Database Structure

**MongoDB** with Mongoose ODM:
- **Scenarios**: Complete project configurations with settings and simulation data
- **Locations**: Wind farm location defaults with currencies and regional data
- **OEM Scopes**: Original equipment manufacturer responsibility matrices
- **Major Components**: Equipment specifications and failure models

## Critical Development Patterns

### Context Usage
```javascript
// ScenarioContext - Data management
const { updateByPath, getValueByPath } = useScenario();
await updateByPath('settings.financial.discountRate', 0.08);

// CubeContext - Computed data access
const { getData, getMetric, refreshCubeData } = useCube();
const energyData = getData({ sourceId: 'energyRevenue', percentile: 50 });
```

### API Response Format
All API responses follow consistent structure:
```javascript
{
  "success": true|false,
  "data": {...},      // On success
  "error": "message", // On failure
  "errors": [...]     // Validation errors array
}
```

### Cube Data Processing
Sequential refresh stages: `initialization → dependencies → sources → metrics → sensitivity → complete`
- Each stage validates dependencies before proceeding
- Uses registry pattern for extensible source/metric definitions
- Percentile-based data organization for risk analysis

## File Organization

### Frontend Structure
- `/src/pages/` - Route components organized by feature area (config, scenario, analyses, simulations)
- `/src/components/` - Reusable UI components (cards, charts, forms, tables)
- `/src/contexts/` - React contexts for state management
- `/src/utils/` - Utility functions organized by domain (cube, charts, validation)
- `/src/api/` - API client modules matching backend endpoints

### Backend Structure  
- `/controllers/` - Request handlers for each resource type
- `/routes/` - Express router definitions with inline API documentation
- `/services/` - Business logic including Monte Carlo simulation engine
- `/middlewares/` - Cross-cutting concerns (error handling, validation)
- `/utils/` - Shared utilities (validation, response formatting)

## Environment Configuration

- **Backend**: Uses `.env` for MongoDB connection, CORS origins, port configuration
- **Frontend**: Uses `.env` for API base URL and router basename
- **Development**: Supports loading default scenarios via `REACT_APP_DEFAULT_SCENARIO` env var

## Common Development Tasks

### Adding New Distributions
1. Create distribution class in `backend/services/monte-carlo-v2/distributions/`
2. Register in `backend/services/monte-carlo-v2/distributions/index.js`
3. Add to frontend distribution registry in `frontend/src/utils/distributions/`

### Adding New Validation
1. Update Yup schema in `/schemas/yup/`
2. Regenerate Mongoose schema in `/schemas/mongoose/` using `yupToMongoose`
3. Frontend automatically uses updated validation via shared schema imports

### Adding Cube Data Sources
1. Create transformer in `frontend/src/utils/cube/sources/transformers/`
2. Register source in `CASHFLOW_SOURCE_REGISTRY`
3. Update percentile handling if source supports multiple percentiles

### Database Operations
Connect to MongoDB using connection string in backend `.env`. Use Mongoose models in `/schemas/mongoose/` for data operations.

## Feature Implementation System Guidelines

### Feature Implementation Priority Rules
- IMMEDIATE EXECUTION: Launch parallel Tasks immediately upon feature requests
- NO CLARIFICATION: Skip asking what type of implementation unless absolutely critical
- PARALLEL BY DEFAULT: Always use 7-parallel-Task method for efficiency

### Parallel Feature Implementation Workflow
1. **Component**: Create main component file
2. **Styles**: Create component styles/CSS
3. **Tests**: Create test files  
4. **Types**: Create type definitions
5. **Hooks**: Create custom hooks/utilities
6. **Integration**: Update routing, imports, exports
7. **Remaining**: Update package.json, documentation, configuration files
8. **Review and Validation**: Coordinate integration, run tests, verify build, check for conflicts

### Context Optimization Rules
- Strip out all comments when reading code files for analysis
- Each task handles ONLY specified files or file types
- Task 7 combines small config/doc updates to prevent over-splitting

### Feature Implementation Guidelines
- **CRITICAL**: Make MINIMAL CHANGES to existing patterns and structures
- **CRITICAL**: Preserve existing naming conventions and file organization
- Follow project's established architecture and component patterns
- Use existing utility functions and avoid duplicating functionality