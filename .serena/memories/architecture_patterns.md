# Architecture Patterns and Design Guidelines

## Data Flow Architecture
- **Sequential Processing**: Raw scenario → Source computation → Metrics computation → Sensitivity analysis
- **Context-Based State Management**: ScenarioContext for data, CubeContext for computed results
- **Immutable Updates**: Uses Immer for state modifications

## Context Patterns

### ScenarioContext
- **Purpose**: Manages scenario data, CRUD operations, and validation
- **Key Methods**: `updateByPath()`, `getValueByPath()`
- **Pattern**: Immer for immutable updates
- **Usage**: `const { updateByPath, getValueByPath } = useScenario();`

### CubeContext  
- **Purpose**: Handles computed data (sources, metrics, sensitivity analysis)
- **Key Methods**: `getData()`, `getMetric()`, `refreshCubeData()`
- **Pattern**: Sequential refresh stages with dependency validation
- **Usage**: `const { getData, getMetric, refreshCubeData } = useCube();`

## Validation System Architecture
- **Single Source of Truth**: Yup schemas in `/schemas/yup/`
- **Frontend**: Real-time field validation + object validation before submission
- **Backend**: Middleware validation using same Yup schemas  
- **Database**: Auto-generated Mongoose schemas from Yup using `yupToMongoose`

## Monte Carlo Simulation Engine
- **Location**: `backend/services/monte-carlo-v2/`
- **Modular Design**: Engine Core, Distribution Factories, Result Processors, Validation Layer
- **Features**: 11 distribution types, time-series support, percentile analysis
- **API**: Exposed via `/api/simulation` endpoints

## Cube Data Processing
- **Refresh Stages**: initialization → dependencies → sources → metrics → sensitivity → complete
- **Registry Pattern**: Extensible source/metric definitions in `CASHFLOW_SOURCE_REGISTRY`
- **Percentile Organization**: Risk analysis data organized by percentiles (P10, P50, P90)

## Component Organization
- **Pages**: Route components organized by feature area (`/src/pages/`)
- **Components**: Reusable UI components (`/src/components/`)
- **Utilities**: Domain-organized utilities (`/src/utils/cube/`, `/src/utils/charts/`)
- **API Clients**: Modules matching backend endpoints (`/src/api/`)

## Backend Architecture
- **Controllers**: Request handlers for each resource type
- **Routes**: Express router definitions with inline API documentation
- **Services**: Business logic including Monte Carlo simulation engine
- **Middlewares**: Cross-cutting concerns (error handling, validation)

## Critical Design Patterns
- **Error Handling**: Consistent API response format across all endpoints
- **Dependency Management**: Sequential execution with dependency validation
- **Extensibility**: Registry patterns for distributions and data sources
- **Separation of Concerns**: Clear boundaries between data, computation, and presentation