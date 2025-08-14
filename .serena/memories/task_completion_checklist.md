# Task Completion Checklist

## When a Development Task is Completed

### 1. Code Quality Checks
- **Frontend**: Run `npm test` from `/frontend` directory to ensure tests pass
- **Backend**: No test script configured - manual verification required
- **Build Check**: Run `npm run build` from `/frontend` to verify production build works

### 2. Validation System Checks
- **Schema Updates**: If Yup schemas in `/schemas/yup/` were modified, ensure corresponding Mongoose schemas in `/schemas/mongoose/` are updated
- **Frontend Validation**: Test that form validation works correctly in UI
- **Backend Validation**: Verify API endpoints properly validate requests using middleware

### 3. Development Server Checks
- **Frontend**: Verify `npm start` works from `/frontend` directory
- **Backend**: Verify `npm run dev` works from `/backend` directory  
- **Database**: Ensure MongoDB connection is working if database changes were made

### 4. Context and State Management
- **ScenarioContext**: If scenario data structures changed, test CRUD operations and Immer updates
- **CubeContext**: If computed data changed, verify sequential refresh stages work correctly
- **Data Flow**: Test that data flows correctly: Raw scenario → Source computation → Metrics computation → Sensitivity analysis

### 5. Monte Carlo Simulation (if applicable)
- **Distributions**: If new distributions added, verify they're registered in both backend and frontend
- **API**: Test simulation endpoints in `/api/simulation` work correctly
- **Validation**: Use `/validate` endpoint to verify parameter validity

### 6. Git and Documentation
- **Commit Changes**: Use descriptive commit messages
- **CLAUDE.md**: Update if new development patterns or commands were introduced
- **No Documentation**: Do not create additional documentation files unless explicitly requested

## Commands to Run After Task Completion

```bash
# Frontend checks
cd frontend
npm test
npm run build
npm start  # Verify development server starts

# Backend checks  
cd ../backend
npm run dev  # Verify development server starts

# Database checks (if applicable)
npm run seed:locations  # If database schema changed
```

## Critical Verification Points
- **No Breaking Changes**: Ensure existing functionality still works
- **API Compatibility**: Verify frontend can still communicate with backend
- **Schema Alignment**: Yup and Mongoose schemas match
- **Context Integrity**: ScenarioContext and CubeContext work correctly