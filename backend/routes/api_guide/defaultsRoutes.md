# Defaults API Routes

This document, `defaultsRoutes.md`, outlines the API route defined in `defaultsRoutes.js`, detailing its usage, input/output schemas, and response formats. It serves as an interface guide for the `defaultsController.js` function, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### GET /api/defaults

**Description**: Retrieves default parameter values for creating a new scenario, with an optional query parameter to specify the wind turbine platform type.

**Controller Function**: `getDefaults`

**Input Schema**: None (uses query parameter `platform`)
- `platform`: String (optional, defaults to `'geared'`). Must be `'geared'` or `'direct-drive'` per `ScenarioSchema.settings.project.windFarm.wtgPlatformType`.

**Example Input**:
```json
{
  "platform": "geared"
}
```

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
  "message": "Default settings retrieved successfully",
  "data": {
    "name": "New Scenario",
    "description": "Default configuration scenario",
    "settings": SettingsSchema,
    "simulation": {
      "inputSim": InputSimSchema,
      "outputSim": OutputSimSchema
    },
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
  "error": "Failed to retrieve default settings",
  "statusCode": 500,
  "errors": [],
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the defaults API route in `backend/routes/defaultsRoutes.js` and/or the controller function in `backend/controllers/defaultsController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/defaultsRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/scenario.js` or query parameters), listing top-level properties (e.g., `platform`) and referencing nested Yup schemas (e.g., `settings: SettingsSchema`) for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `scenario.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, etc.) and the schema type of the `data` field.
- Include example input (query parameters or request body) and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"settings": SettingsSchema`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with four characters of "%" at the beginning of every new line (other lines, like explanations, are normal).
- Name the file `defaultsRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```
