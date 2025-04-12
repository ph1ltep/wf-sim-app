# Location API Routes

This document, `locationRoutes.md`, outlines the API routes defined in `locationRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `locationController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### GET /api/locations

**Description**: Retrieves all location default settings, sorted by country.

**Controller Function**: `getAllLocations`

**Input Schema**: None (no query parameters or request body).

**Example Input**: None

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: Array of `LocationDefaultsSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: Array of `LocationDefaultsSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": Array of LocationDefaultsSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to fetch locations",
  "statusCode": 500,
  "errors": []
}
```

### GET /api/locations/:id

**Description**: Retrieves a location’s default settings by its ID.

**Controller Function**: `getLocationById`

**Input Schema**: None (uses URL parameter `id`).
- `id`: String (required, MongoDB ObjectID).

**Example Input**: URL parameter `id="1234567890"`

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: `LocationDefaultsSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `LocationDefaultsSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Location retrieved successfully",
  "data": LocationDefaultsSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Location not found",
  "statusCode": 404,
  "errors": []
}
```

### POST /api/locations

**Description**: Creates a new location with specified default settings, validated by middleware.

**Controller Function**: `createLocation`

**Input Schema**: `LocationDefaultsSchema`
- `country`: String (required).
- `countryCode`: String (required).
- `inflationRate`: Number (required, default 2.0).
- `capacityFactor`: Number (required, default 35).
- `energyPrice`: Number (required, default 50).
- `currency`: String (required, default `'USD'`).
- `foreignCurrency`: String (required, default `'EUR'`).
- `exchangeRate`: Number (required, default 1.0).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).

**Example Input**:
```json
{
  "country": String,
  "countryCode": String,
  "inflationRate": Number,
  "capacityFactor": Number,
  "energyPrice": Number,
  "currency": String,
  "foreignCurrency": String,
  "exchangeRate": Number
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
  "message": "Location created successfully",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Validation error: Country is required",
  "statusCode": 400,
  "errors": ["Country is required"]
}
```

### PUT /api/locations/:id

**Description**: Updates an existing location’s default settings by its ID, validated by middleware.

**Controller Function**: `updateLocation`

**Input Schema**: `LocationDefaultsSchema`
- `country`: String (required).
- `countryCode`: String (required).
- `inflationRate`: Number (required, default 2.0).
- `capacityFactor`: Number (required, default 35).
- `energyPrice`: Number (required, default 50).
- `currency`: String (required, default `'USD'`).
- `foreignCurrency`: String (required, default `'EUR'`).
- `exchangeRate`: Number (required, default 1.0).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).
- `id`: String (required, MongoDB ObjectID, via URL parameter).

**Example Input**:
```json
{
  "country": String,
  "countryCode": String,
  "inflationRate": Number,
  "capacityFactor": Number,
  "energyPrice": Number,
  "currency": String,
  "foreignCurrency": String,
  "exchangeRate": Number
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
  "message": "Location updated successfully",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:01:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Location not found",
  "statusCode": 404,
  "errors": []
}
```

### DELETE /api/locations/:id

**Description**: Deletes a location by its ID.

**Controller Function**: `deleteLocation`

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
  "message": "Location deleted successfully",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Location not found",
  "statusCode": 404,
  "errors": []
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the location API routes in `backend/routes/locationRoutes.js` and/or the controller functions in `backend/controllers/locationController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/locationRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/locationDefaults.js` or query parameters), listing top-level properties (e.g., `country`, `countryCode`) and referencing nested Yup schemas for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `locationDefaults.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, etc.) and the schema type of the `data` field.
- Include example input (query parameters or request body) and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"country": String`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with # (other lines, like explanations, are normal).
- Name the file `locationRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```
