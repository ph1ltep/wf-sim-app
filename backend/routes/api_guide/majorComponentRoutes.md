# Major Component API Routes

This document, `majorComponentRoutes.md`, outlines the API routes defined in `majorComponentRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `majorComponentController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### GET /api/components

**Description**: Retrieves all major component configurations, optionally filtered by platform type, sorted by name.

**Controller Function**: `getAllComponents`

**Input Schema**: None (uses query parameter `platform`).
- `platform`: String (optional, one of `['geared', 'direct-drive']`).

**Example Input**:
```json
{
  "platform": "geared"
}
```

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: Array of `MajorComponentSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: Array of `MajorComponentSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Components retrieved successfully",
  "data": Array of MajorComponentSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to fetch components",
  "statusCode": 500,
  "errors": []
}
```

### GET /api/components/:id

**Description**: Retrieves a major component configuration by its ID.

**Controller Function**: `getComponentById`

**Input Schema**: None (uses URL parameter `id`).
- `id`: String (required, MongoDB ObjectID).

**Example Input**: URL parameter `id="1234567890"`

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: `MajorComponentSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `MajorComponentSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Component retrieved successfully",
  "data": MajorComponentSchema,
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Component not found",
  "statusCode": 404,
  "errors": []
}
```

### POST /api/components

**Description**: Creates a new major component configuration, validated by middleware.

**Controller Function**: `createComponent`

**Input Schema**: `MajorComponentSchema`
- `name`: String (required).
- `description`: String (optional).
- `appliesTo`: Object (optional, default `{ geared: true, directDrive: true }`).
  - `geared`: Boolean (optional, default `true`).
  - `directDrive`: Boolean (optional, default `true`).
- `quantityPerWTG`: Number (required, default 1).
- `defaultFailureRate`: Number (optional, default 0.01).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).

**Example Input**:
```json
{
  "name": String,
  "description": String,
  "appliesTo": { geared: Boolean, directDrive: Boolean },
  "quantityPerWTG": Number,
  "defaultFailureRate": Number
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
  "message": "Component created successfully",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Validation error: Name is required",
  "statusCode": 400,
  "errors": ["Name is required"]
}
```

### PUT /api/components/:id

**Description**: Updates an existing major component configuration by its ID, validated by middleware.

**Controller Function**: `updateComponent`

**Input Schema**: `MajorComponentSchema`
- `name`: String (required).
- `description`: String (optional).
- `appliesTo`: Object (optional, default `{ geared: true, directDrive: true }`).
  - `geared`: Boolean (optional, default `true`).
  - `directDrive`: Boolean (optional, default `true`).
- `quantityPerWTG`: Number (required, default 1).
- `defaultFailureRate`: Number (optional, default 0.01).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).
- `id`: String (required, MongoDB ObjectID, via URL parameter).

**Example Input**:
```json
{
  "name": String,
  "description": String,
  "appliesTo": { geared: Boolean, directDrive: Boolean },
  "quantityPerWTG": Number,
  "defaultFailureRate": Number
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
  "message": "Component updated successfully",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:01:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Component not found",
  "statusCode": 404,
  "errors": []
}
```

### DELETE /api/components/:id

**Description**: Deletes a major component configuration by its ID.

**Controller Function**: `deleteComponent`

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
  "message": "Component deleted successfully",
  "data": { _id: string, createdAt: date, updatedAt: date },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Component not found",
  "statusCode": 404,
  "errors": []
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the major component API routes in `backend/routes/majorComponentRoutes.js` and/or the controller functions in `backend/controllers/majorComponentController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/majorComponentRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/majorComponent.js` or query parameters), listing top-level properties (e.g., `name`, `appliesTo`) and referencing nested Yup schemas for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `majorComponent.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, etc.) and the schema type of the `data` field.
- Include example input (query parameters or request body) and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"name": String`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with # (other lines, like explanations, are normal).
- Name the file `majorComponentRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```
