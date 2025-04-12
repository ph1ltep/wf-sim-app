# Scenario API Routes

This document, `scenarioRoutes.md`, outlines the API routes defined in `scenarioRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `scenarioController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### POST /api/scenarios

**Description**: Creates a new scenario with specified settings and simulation configurations, optionally using default settings.

**Controller Function**: `createScenario`

**Input Schema**: `ScenarioSchema`
- `name`: String (required).
- `description`: String (optional).
- `settings`: `SettingsSchema` (optional, defaults to `{}`).
- `simulation`: Object with `inputSim` (`InputSimSchema`) and `outputSim` (`OutputSimSchema`) (optional, defaults to `{}`).

**Example Input**:
```json
{
    "name": String,
    "description": String,
    "settings": SettingsSchema,
    "simulation": {
        "inputSim": InputSimSchema,
        "outputSim": OutputSimSchema
    }
}
```

**Output Schema**: `CrudResponseSchema`
- `success`: Boolean.
- `data`: Object with `_id` (string), `createdAt` (date), `updatedAt` (date).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'crud'`

**Data Schema**: `{ _id: string, createdAt: date, updatedAt: date }`

**Example Success Response**:
```json
{
    "success": true,
    "message": "Scenario created successfully",
    "data": {
        "_id": "1234567890",
        "createdAt": "2025-04-11T12:00:00.000Z",
        "updatedAt": "2025-04-11T12:00:00.000Z"
    },
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Failed to create scenario: Missing name",
    "statusCode": 400,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### GET /api/scenarios/list

**Description**: Lists all scenarios with pagination and search support.

**Controller Function**: `listScenarios`

**Input Schema**: None (uses query parameters `page`, `limit`, `search`).

**Output Schema**: `ListResponseSchema`
- `success`: Boolean.
- `data`: Object with `pagination` (`PaginationSchema`), `items` (array of `ScenarioListingSchema`), `count` (number).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'list'`

**Data Schema**: `{ pagination: PaginationSchema, items: Array<ScenarioListingSchema>, count: number }`

**Example Success Response**:
```json
{
    "success": true,
    "message": "Scenarios retrieved successfully",
    "data": {
        "pagination": PaginationSchema,
        "items": [ScenarioListingSchema],
        "count": 10
    },
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Failed to list scenarios: Invalid query parameters",
    "statusCode": 400,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### GET /api/scenarios/:id

**Description**: Retrieves a scenario by its ID.

**Controller Function**: `getScenarioById`

**Input Schema**: None (uses URL parameter `id`).

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean.
- `data`: `ScenarioSchema`.
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `ScenarioSchema`

**Example Success Response**:
```json
{
    "success": true,
    "message": "Retrieved scenario: Example Scenario (ID: 1234567890)",
    "data": ScenarioSchema,
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Scenario not found",
    "statusCode": 404,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### PUT /api/scenarios/:id

**Description**: Updates an existing scenario by its ID.

**Controller Function**: `updateScenario`

**Input Schema**: `ScenarioSchema`
- `name`: String (required).
- `description`: String (optional).
- `settings`: `SettingsSchema` (optional, defaults to `{}`).
- `simulation`: Object with `inputSim` (`InputSimSchema`) and `outputSim` (`OutputSimSchema`) (optional, defaults to `{}`).

**Example Input**:
```json
{
    "name": String,
    "description": String,
    "settings": SettingsSchema,
    "simulation": {
        "inputSim": InputSimSchema,
        "outputSim": OutputSimSchema
    }
}
```

**Output Schema**: `CrudResponseSchema`
- `success`: Boolean.
- `data`: Object with `_id` (string), `createdAt` (date), `updatedAt` (date).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'crud'`

**Data Schema**: `{ _id: string, createdAt: date, updatedAt: date }`

**Example Success Response**:
```json
{
    "success": true,
    "message": "Scenario updated successfully: Example Scenario (ID: 1234567890)",
    "data": {
        "_id": "1234567890",
        "createdAt": "2025-04-11T12:00:00.000Z",
        "updatedAt": "2025-04-11T12:01:00.000Z"
    },
    "timestamp": "2025-04-11T12:01:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Failed to update scenario: Missing name",
    "statusCode": 400,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### DELETE /api/scenarios/:id

**Description**: Deletes a scenario by its ID.

**Controller Function**: `deleteScenario`

**Input Schema**: None (uses URL parameter `id`).

**Output Schema**: `CrudResponseSchema`
- `success`: Boolean.
- `data`: Object with `_id` (string), `createdAt` (date), `updatedAt` (date).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'crud'`

**Data Schema**: `{ _id: string, createdAt: date, updatedAt: date }`

**Example Success Response**:
```json
{
    "success": true,
    "message": "Scenario deleted: Example Scenario (ID: 1234567890)",
    "data": {
        "_id": "1234567890",
        "createdAt": "2025-04-11T12:00:00.000Z",
        "updatedAt": "2025-04-11T12:00:00.000Z"
    },
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Scenario not found",
    "statusCode": 404,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the scenario API routes in `backend/routes/scenarioRoutes.js` and/or the controller functions in `backend/controllers/scenarioController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/scenarioRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/scenario.js` or `distribution.js`) for request bodies, if any, listing top-level properties (e.g., `name`, `settings`) and referencing nested Yup schemas (e.g., `settings: SettingsSchema`) for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `scenario.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, etc.) and the schema type of the `data` field.
- Include example input and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"settings": SettingsSchema`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with  (other lines, like explanations, are normal).
- Name the file `scenarioRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```
