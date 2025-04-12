# Monte Carlo Simulation API Routes

This document, `simulationRoutes.md`, outlines the API routes defined in `distributionRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `distributionController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity.

## Routes

### POST /api/simulation/simulate

**Description**: Runs a Monte Carlo simulation for one or more distributions, returning results for specified percentiles over a time horizon.

**Controller Function**: `simulateDistributions`

**Input Schema**: `SimRequestSchema`
- `distributions`: Array of `DistributionTypeSchema` (min 1).
- `simulationSettings`: `SimSettingsSchema`.

**Example Input**:
```json
{
    "distributions": [DistributionTypeSchema],
    "simulationSettings": SimSettingsSchema
}
```

**Output Schema**: `SimulationResponseSchema`
- `success`: Boolean.
- `data`: Object with `success` (boolean), `simulationInfo` (array of `SimulationInfoSchema`), `timeElapsed` (number).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'simulation'`

**Data Schema**: `{ success: boolean, simulationInfo: Array<SimulationInfoSchema>, timeElapsed: number }`

**Example Success Response**:
```json
{
    "success": true,
    "message": "Simulation completed successfully",
    "data": {
        "success": true,
        "simulationInfo": [SimulationInfoSchema],
        "timeElapsed": 100
    },
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Simulation failed: Invalid distribution type",
    "statusCode": 500,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### GET /api/simulation/info

**Description**: Retrieves metadata for all registered distribution types.

**Controller Function**: `getDistributionsInfo`

**Input Schema**: None (no request body).

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean.
- `data`: Object (metadata keyed by distribution type, no specific schema).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: Object (arbitrary metadata)

**Example Success Response**:
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { "normal": {}, "lognormal": {} },
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
    "success": false,
    "error": "Failed to get distributions info: Internal error",
    "statusCode": 500,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### POST /api/simulation/validate

**Description**: Validates the parameters of a distribution configuration.

**Controller Function**: `validateDistribution`

**Input Schema**: `DistributionTypeSchema`
- `type`: String.
- `timeSeriesMode`: Boolean (optional).
- `parameters`: `DistributionParametersSchema`.

**Example Input**:
```json
DistributionTypeSchema
```

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean.
- `data`: `ValidationResponseSchema`.
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
    "success": false,
    "error": "Validation failed: Invalid parameters",
    "statusCode": 400,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

### POST /api/simulation/fit

**Description**: Fits a distribution to a set of data points, returning fitted parameters.

**Controller Function**: `fitDistribution`

**Input Schema**: `FitDistributionSchema`
- `distribution`: `DistributionTypeSchema`.
- `dataPoints`: Array of `DataPointSchema`.

**Example Input**:
```json
{
    "distribution": DistributionTypeSchema,
    "dataPoints": [DataPointSchema]
}
```

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean.
- `data`: `DistributionParametersSchema`.
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
    "success": false,
    "error": "Fitting failed: Invalid data points",
    "statusCode": 500,
    "errors": [],
    "timestamp": "2025-04-11T12:00:00.000Z"
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the Monte Carlo simulation API routes in `backend/routes/distributionRoutes.js` and/or the controller functions in `backend/controllers/distributionController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/simulationRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/distribution.js`) for request bodies, if any.
- Specify the output schema (from `schemas/yup/response.js` or `distribution.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'simulation'`, etc.) and the schema type of the `data` field.
- Include example input and output JSON, referencing Yup schemas (e.g., `DistributionTypeSchema`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure each line of the response starts with %%%%.
- Name the file `simulationRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```