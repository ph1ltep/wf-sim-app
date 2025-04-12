# Simulation API Routes

This document, `simulationRoutes.md`, outlines the API routes defined in `simulationRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `simulationController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### POST /api/simulations/run

**Description**: Runs a simulation of one or more distributions using the Monte Carlo engine, validated by middleware.

**Controller Function**: `simulateDistributions`

**Input Schema**: `SimRequestSchema`
- (Specific fields not provided, assumed to include simulation parameters validated by middleware).

**Example Input**:
```json
{
  "distributions": SimRequestSchema
}
```

**Output Schema**: `SimulationResponseSchema`
- `success`: Boolean (required).
- `data`: Object with `success` (boolean), `simulationInfo` (array), `timeElapsed` (number).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'simulation'`

**Data Schema**: `{ success: boolean, simulationInfo: array, timeElapsed: number }`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Simulation completed successfully",
  "data": { success: boolean, simulationInfo: array, timeElapsed: number },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Simulation failed",
  "statusCode": 500,
  "errors": []
}
```

### GET /api/simulations/distributions

**Description**: Retrieves metadata for all registered distributions.

**Controller Function**: `getDistributionsInfo`

**Input Schema**: None (no query parameters or request body).

**Example Input**: None

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: Array of distribution metadata objects (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: Array of distribution metadata objects

**Example Success Response**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": Array of distribution metadata,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to get distributions info",
  "statusCode": 500,
  "errors": []
}
```

### POST /api/simulations/validate

**Description**: Validates distribution parameters against their schema.

**Controller Function**: `validateDistribution`

**Input Schema**: `DistributionTypeSchema`
- `type`: String (required).
- `parameters`: Object (required, varies by distribution type).
- `timeSeriesMode`: Boolean (optional).

**Example Input**:
```json
{
  "type": String,
  "parameters": Object,
  "timeSeriesMode": Boolean
}
```

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: `ValidationResponseSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `ValidationResponseSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Validation successful",
  "data": ValidationResponseSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Validation failed",
  "statusCode": 400,
  "errors": []
}
```

### POST /api/simulations/fit

**Description**: Fits a distribution to provided data points, validated by middleware.

**Controller Function**: `fitDistribution`

**Input Schema**: `FitDistributionSchema`
- `distribution`: `DistributionTypeSchema` (required).
- `dataPoints`: Array of `DataPointSchema` (required).

**Example Input**:
```json
{
  "distribution": DistributionTypeSchema,
  "dataPoints": Array of DataPointSchema
}
```

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: `DistributionParametersSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `DistributionParametersSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Distribution fitted successfully",
  "data": DistributionParametersSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Fitting failed",
  "statusCode": 400,
  "errors": []
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the simulation API routes in `backend/routes/simulationRoutes.js` and/or the controller functions in `backend/controllers/simulationController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/simulationRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/distribution.js` or query parameters), listing top-level properties (e.g., `type`, `parameters`) and referencing nested Yup schemas for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `distribution.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, `'simulation'`, etc.) and the schema type of the `data` field.
- Include example input (query parameters or request body) and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"type": String`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with # (other lines, like explanations, are normal).
- Name the file `simulationRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```
