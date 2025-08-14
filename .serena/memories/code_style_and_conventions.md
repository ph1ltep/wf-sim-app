# Code Style and Conventions

## JavaScript/React Conventions
- **Files**: Use `.jsx` extension for React components, `.js` for utilities
- **Components**: PascalCase naming (e.g., `ScenarioContext.jsx`)
- **Functions**: camelCase naming
- **Constants**: UPPER_SNAKE_CASE for constants

## Project Structure Conventions
- **Frontend**: Components organized by feature area (`/src/pages/`, `/src/components/`)
- **Backend**: Clean separation of concerns (`/controllers/`, `/routes/`, `/services/`)
- **Schemas**: Shared validation with Yup as source of truth in `/schemas/yup/`

## Validation Patterns
- **Source of Truth**: Yup schemas in `/schemas/yup/` directory
- **Frontend**: Real-time field validation + object validation before submission
- **Backend**: Middleware validation using same Yup schemas
- **Database**: Mongoose schemas auto-generated from Yup schemas

## Context Patterns
- **ScenarioContext**: Manages scenario data, CRUD operations using Immer for immutable updates
- **CubeContext**: Handles computed data with sequential refresh stages
- Both contexts use similar refresh patterns with controlled sequential execution

## API Response Format
All API responses follow consistent structure:
```javascript
{
  "success": true|false,
  "data": {...},      // On success
  "error": "message", // On failure  
  "errors": [...]     // Validation errors array
}
```

## File Organization
- **Frontend**: `/src/pages/` for routes, `/src/components/` for reusable UI, `/src/contexts/` for state management
- **Backend**: `/controllers/` for request handlers, `/routes/` for Express routers, `/services/` for business logic
- **Shared**: `/schemas/` for validation schemas used by both frontend and backend

## Linting and Formatting
- **ESLint**: Configured in frontend with `react-app` and `react-app/jest` extends
- **No Prettier**: No Prettier configuration found in project
- **No additional linting**: No custom ESLint or formatting rules beyond React defaults