# Scenario API Routes

This document, `scenarioRoutes.md`, outlines the API routes defined in `scenarioRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `scenarioController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### GET /api/scenarios

**Description**: Retrieves a paginated list of all scenarios with essential fields for listing, optionally filtered by search term, sorted by last updated.

**Controller Function**: `listScenarios`

**Input Schema**: None (uses query parameters for pagination and filtering).
- `page`: Number (optional, defaults to 1).
- `limit`: Number (optional, defaults to 100).
- `search`: String (optional, filters by `name` or `description`).

**Example Input**:
```json
{
  "page": 1,
  "limit": 100,
  "search": "wind"
}
```

**Output Schema**: `ListResponseSchema`
- `success`: Boolean (required).
- `data`: Object with `pagination` (total, page, limit, pages), `items` (array of `ScenarioListingSchema`), `count` (number).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'list'`

**Data Schema**: `{ pagination: { total: number, page: number, limit: number, pages: number }, items: Array of ScenarioListingSchema, count: number }`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Scenarios retrieved successfully",
  "data": {
    "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "pages": number
    },
    "items": Array of ScenarioListingSchema,
    "count": number
  },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to fetch scenarios",
  "statusCode": 500,
  "errors": []
}
```

### GET /api/scenarios/:id

**Description**: Retrieves a full scenario configuration by its ID.

**Controller Function**: `getScenarioById`

**Input Schema**: None (uses URL parameter `id`).
- `id`: String (required, MongoDB ObjectID).

**Example Input**: URL parameter `id="1234567890"`

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: `ScenarioSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `ScenarioSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Retrieved scenario: ScenarioName (ID: ScenarioID)",
  "data": ScenarioSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Scenario not found",
  "statusCode": 404,
  "errors": []
}
```

### POST /api/scenarios

**Description**: Creates a new scenario, either with complete settings or by extending default settings, validated by middleware.

**Controller Function**: `createScenario`

**Input Schema**: `ScenarioSchema`
- `name`: String (required, defaults to `'New Scenario'`).
- `description`: String (optional, defaults to `''`).
- `settings`: `SettingsSchema` (optional, extends defaults if partial, required if complete scenario).
- `simulation`: Object (optional, defaults to `{ inputSim: {}, outputSim: {} }`).
  - `inputSim`: `InputSimSchema` (optional).
  - `outputSim`: `OutputSimSchema` (optional).

**Example Input**:
```json
{
  "name": String,
  "description": String,
  "settings": SettingsSchema,
  "simulation": { inputSim: InputSimSchema, outputSim: OutputSimSchema }
}
```

**Output Schema**: `CrudResponseSchema`
- `success`: Boolean (required).
- `data`: Object with `_id` (string), `name` (string), `description` (string), `settings` (SettingsSchema), `simulation` (Object), `createdAt` (date).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'crud'`

**Data Schema**: `{ _id: string, name: string, description: string, settings: SettingsSchema, simulation: { inputSim: InputSimSchema, outputSim: OutputSimSchema }, createdAt: date }`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Scenario created successfully",
  "data": { _id: string, name: string, description: string, settings: SettingsSchema, simulation: { inputSim: InputSimSchema, outputSim: OutputSimSchema }, createdAt: date },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to create scenario",
  "statusCode": 500,
  "errors": []
}
```

### PUT /api/scenarios/:id

**Description**: Updates an existing scenario by its ID, validated by middleware.

**Controller Function**: `updateScenario`

**Input Schema**: `ScenarioSchema`
- `name`: String (required).
- `description`: String (optional).
- `settings`: `SettingsSchema` (optional).
- `simulation`: Object (optional).
  - `inputSim`: `InputSimSchema` (optional).
  - `outputSim`: `OutputSimSchema` (optional).
- `id`: String (required, MongoDB ObjectID, via URL parameter).

**Example Input**:
```json
{
  "name": String,
  "description": String,
  "settings": SettingsSchema,
  "simulation": { inputSim: InputSimSchema, outputSim: OutputSimSchema }
}
```

**Output Schema**: `CrudResponseSchema`
- `success`: Boolean (required).
- `data`: Object with `_id` (string), `createdAt` (date), `updatedAt` (date).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'crud'`

**Data Schema**: `{ _id: string, createdAt: date, updatedAt: date }`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Scenario updated successfully: ScenarioName (ID: ScenarioID)",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:01:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Scenario not found",
  "statusCode": 404,
  "errors": []
}
```

### DELETE /api/scenarios/:id

**Description**: Deletes a scenario by its ID.

**Controller Function**: `deleteScenario`

**Input Schema**: None (uses URL parameter `id`).
- `id`: String (required, MongoDB ObjectID).

**Example Input**: URL parameter `id="1234567890"`

**Output Schema**: `CrudResponseSchema`
- `success`: Boolean (required).
- `data`: Object with `_id` (string), `createdAt` (date), `updatedAt` (date).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'crud'`

**Data Schema**: `{ _id: string, createdAt: date, updatedAt: date }`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Scenario deleted: ScenarioName (ID: ScenarioID)",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Scenario not found",
  "statusCode": 404,
  "errors": []
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the scenario API routes in `backend/routes/scenarioRoutes.js` and/or the controller functions in `backend/controllers/scenarioController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/scenarioRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/scenario.js` or query parameters), listing top-level properties (e.g., `name`, `settings`) and referencing nested Yup schemas (e.g., `settings: SettingsSchema`) for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `scenario.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, etc.) and the schema type of the `data` field.
- Include example input (query parameters or request body) and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"settings": SettingsSchema`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with # (other lines, like explanations, are normal).
- Name the file `scenarioRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```

