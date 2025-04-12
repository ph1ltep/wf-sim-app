# OEM Scope API Routes

This document, `oemScopeRoutes.md`, outlines the API routes defined in `oemScopeRoutes.js`, detailing their usage, input/output schemas, and response formats. It serves as an interface guide for the `oemScopeController.js` functions, specifying the `formatSuccess` type, data schema, and `formatError` structure. Examples reference Yup schemas for brevity, showing top-level properties with nested schema references.

## Routes

### GET /api/oemscopes

**Description**: Retrieves all OEM scope configurations, sorted by name.

**Controller Function**: `getAllOEMScopes`

**Input Schema**: None (no query parameters or request body).

**Example Input**: None

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: Array of `OEMScopeSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: Array of `OEMScopeSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "OEM scopes retrieved successfully",
  "data": [
    {
      "name": String,
      "isDefault": Boolean,
      "preventiveMaintenance": Boolean,
      "bladeInspections": Boolean,
      "blade": Boolean,
      "bladeLEP": Boolean,
      "remoteMonitoring": Boolean,
      "remoteTechnicalSupport": Boolean,
      "sitePersonnel": String,
      "siteManagement": Boolean,
      "technicianPercent": Number,
      "correctiveMinor": Boolean,
      "correctiveMajor": Boolean,
      "correctiveMajorDetails": CorrectiveMajorSchema,
      "bladeIntegrityManagement": Boolean,
      "craneCoverage": Boolean,
      "craneEventCap": Number,
      "craneFinancialCap": Number,
      "majorEventCap": Number,
      "majorFinancialCap": Number,
      "createdAt": Date,
      "updatedAt": Date
    }
  ],
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to fetch OEM scopes",
  "statusCode": 500,
  "errors": []
}
```

### GET /api/oemscopes/:id

**Description**: Retrieves an OEM scope configuration by its ID.

**Controller Function**: `getOEMScopeById`

**Input Schema**: None (uses URL parameter `id`).
- `id`: String (required, MongoDB ObjectID).

**Example Input**: URL parameter `id="1234567890"`

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: `OEMScopeSchema` (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `OEMScopeSchema`

**Example Success Response**:
```json
{
  "success": true,
  "message": "OEM scope retrieved successfully",
  "data": {
    "name": String,
    "isDefault": Boolean,
    "preventiveMaintenance": Boolean,
    "bladeInspections": Boolean,
    "blade": Boolean,
    "bladeLEP": Boolean,
    "remoteMonitoring": Boolean,
    "remoteTechnicalSupport": Boolean,
    "sitePersonnel": String,
    "siteManagement": Boolean,
    "technicianPercent": Number,
    "correctiveMinor": Boolean,
    "correctiveMajor": Boolean,
    "correctiveMajorDetails": CorrectiveMajorSchema,
    "bladeIntegrityManagement": Boolean,
    "craneCoverage": Boolean,
    "craneEventCap": Number,
    "craneFinancialCap": Number,
    "majorEventCap": Number,
    "majorFinancialCap": Number,
    "createdAt": Date,
    "updatedAt": Date
  },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "OEM scope not found",
  "statusCode": 404,
  "errors": []
}
```

### POST /api/oemscopes

**Description**: Creates a new OEM scope configuration, validated by middleware.

**Controller Function**: `createOEMScope`

**Input Schema**: `OEMScopeSchema`
- `name`: String (required).
- `isDefault`: Boolean (optional, default `false`).
- `preventiveMaintenance`: Boolean (optional, default `false`).
- `bladeInspections`: Boolean (optional, default `false`).
- `blade`: Boolean (optional, default `false`).
- `bladeLEP`: Boolean (optional, default `false`).
- `remoteMonitoring`: Boolean (optional, default `false`).
- `remoteTechnicalSupport`: Boolean (optional, default `false`).
- `sitePersonnel`: String (optional, default `'none'`, one of `['none', 'partial', 'full']`).
- `siteManagement`: Boolean (optional, default `false`).
- `technicianPercent`: Number (optional, default 100).
- `correctiveMinor`: Boolean (optional, default `false`).
- `correctiveMajor`: Boolean (optional, default `false`).
- `correctiveMajorDetails`: `CorrectiveMajorSchema` (optional, default `{}`).
- `bladeIntegrityManagement`: Boolean (optional, default `false`).
- `craneCoverage`: Boolean (optional, default `false`).
- `craneEventCap`: Number (optional, default 0).
- `craneFinancialCap`: Number (optional, default 0).
- `majorEventCap`: Number (optional, default 0).
- `majorFinancialCap`: Number (optional, default 0).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).

**Example Input**:
```json
{
  "name": String,
  "isDefault": Boolean,
  "preventiveMaintenance": Boolean,
  "bladeInspections": Boolean,
  "blade": Boolean,
  "bladeLEP": Boolean,
  "remoteMonitoring": Boolean,
  "remoteTechnicalSupport": Boolean,
  "sitePersonnel": String,
  "siteManagement": Boolean,
  "technicianPercent": Number,
  "correctiveMinor": Boolean,
  "correctiveMajor": Boolean,
  "correctiveMajorDetails": CorrectiveMajorSchema,
  "bladeIntegrityManagement": Boolean,
  "craneCoverage": Boolean,
  "craneEventCap": Number,
  "craneFinancialCap": Number,
  "majorEventCap": Number,
  "majorFinancialCap": Number
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
  "message": "OEM scope created successfully",
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
  "error": "Validation error: Name is required",
  "statusCode": 400,
  "errors": ["Name is required"]
}
```

### POST /api/oemscopes/generate-name

**Description**: Generates a name for an OEM scope based on provided selections.

**Controller Function**: `generateName`

**Input Schema**: `OEMScopeSchema`
- `name`: String (required).
- `isDefault`: Boolean (optional, default `false`).
- `preventiveMaintenance`: Boolean (optional, default `false`).
- `bladeInspections`: Boolean (optional, default `false`).
- `blade`: Boolean (optional, default `false`).
- `bladeLEP`: Boolean (optional, default `false`).
- `remoteMonitoring`: Boolean (optional, default `false`).
- `remoteTechnicalSupport`: Boolean (optional, default `false`).
- `sitePersonnel`: String (optional, default `'none'`, one of `['none', 'partial', 'full']`).
- `siteManagement`: Boolean (optional, default `false`).
- `technicianPercent`: Number (optional, default 100).
- `correctiveMinor`: Boolean (optional, default `false`).
- `correctiveMajor`: Boolean (optional, default `false`).
- `correctiveMajorDetails`: `CorrectiveMajorSchema` (optional, default `{}`).
- `bladeIntegrityManagement`: Boolean (optional, default `false`).
- `craneCoverage`: Boolean (optional, default `false`).
- `craneEventCap`: Number (optional, default 0).
- `craneFinancialCap`: Number (optional, default 0).
- `majorEventCap`: Number (optional, default 0).
- `majorFinancialCap`: Number (optional, default 0).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).

**Example Input**:
```json
{
  "name": String,
  "isDefault": Boolean,
  "preventiveMaintenance": Boolean,
  "bladeInspections": Boolean,
  "blade": Boolean,
  "bladeLEP": Boolean,
  "remoteMonitoring": Boolean,
  "remoteTechnicalSupport": Boolean,
  "sitePersonnel": String,
  "siteManagement": Boolean,
  "technicianPercent": Number,
  "correctiveMinor": Boolean,
  "correctiveMajor": Boolean,
  "correctiveMajorDetails": CorrectiveMajorSchema,
  "bladeIntegrityManagement": Boolean,
  "craneCoverage": Boolean,
  "craneEventCap": Number,
  "craneFinancialCap": Number,
  "majorEventCap": Number,
  "majorFinancialCap": Number
}
```

**Output Schema**: `SuccessResponseSchema`
- `success`: Boolean (required).
- `data`: Object with `name` (string) (required).
- `message`: String.
- `timestamp`: Date.

**formatSuccess Type**: `'default'`

**Data Schema**: `{ name: string }`

**Example Success Response**:
```json
{
  "success": true,
  "message": "Name generated successfully",
  "data": {
    "name": String
  },
  "timestamp": "2025-04-11T12:00:00.000Z"
}
```

**formatError Example**:
```json
{
  "error": "Failed to generate name",
  "statusCode": 500,
  "errors": []
}
```

### PUT /api/oemscopes/:id

**Description**: Updates an existing OEM scope configuration by its ID, validated by middleware.

**Controller Function**: `updateOEMScope`

**Input Schema**: `OEMScopeSchema`
- `name`: String (required).
- `isDefault`: Boolean (optional, default `false`).
- `preventiveMaintenance`: Boolean (optional, default `false`).
- `bladeInspections`: Boolean (optional, default `false`).
- `blade`: Boolean (optional, default `false`).
- `bladeLEP`: Boolean (optional, default `false`).
- `remoteMonitoring`: Boolean (optional, default `false`).
- `remoteTechnicalSupport`: Boolean (optional, default `false`).
- `sitePersonnel`: String (optional, default `'none'`, one of `['none', 'partial', 'full']`).
- `siteManagement`: Boolean (optional, default `false`).
- `technicianPercent`: Number (optional, default 100).
- `correctiveMinor`: Boolean (optional, default `false`).
- `correctiveMajor`: Boolean (optional, default `false`).
- `correctiveMajorDetails`: `CorrectiveMajorSchema` (optional, default `{}`).
- `bladeIntegrityManagement`: Boolean (optional, default `false`).
- `craneCoverage`: Boolean (optional, default `false`).
- `craneEventCap`: Number (optional, default 0).
- `craneFinancialCap`: Number (optional, default 0).
- `majorEventCap`: Number (optional, default 0).
- `majorFinancialCap`: Number (optional, default 0).
- `createdAt`: Date (optional, defaults to current date).
- `updatedAt`: Date (optional, defaults to current date).
- `id`: String (required, MongoDB ObjectID, via URL parameter).

**Example Input**:
```json
{
  "name": String,
  "isDefault": Boolean,
  "preventiveMaintenance": Boolean,
  "bladeInspections": Boolean,
  "blade": Boolean,
  "bladeLEP": Boolean,
  "remoteMonitoring": Boolean,
  "remoteTechnicalSupport": Boolean,
  "sitePersonnel": String,
  "siteManagement": Boolean,
  "technicianPercent": Number,
  "correctiveMinor": Boolean,
  "correctiveMajor": Boolean,
  "correctiveMajorDetails": CorrectiveMajorSchema,
  "bladeIntegrityManagement": Boolean,
  "craneCoverage": Boolean,
  "craneEventCap": Number,
  "craneFinancialCap": Number,
  "majorEventCap": Number,
  "majorFinancialCap": Number
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
  "message": "OEM scope updated successfully",
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
  "error": "OEM scope not found",
  "statusCode": 404,
  "errors": []
}
```

### DELETE /api/oemscopes/:id

**Description**: Deletes an OEM scope configuration by its ID.

**Controller Function**: `deleteOEMScope`

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
  "message": "OEM scope deleted successfully",
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
  "error": "OEM scope not found",
  "statusCode": 404,
  "errors": []
}
```

## Future Updates Prompt

To keep this document accurate, use the following prompt to rescan the routes and controllers:

```
I have updated the OEM scope API routes in `backend/routes/oemScopeRoutes.js` and/or the controller functions in `backend/controllers/oemScopeController.js`. Please rescan these files and update the Markdown documentation in `backend/routes/oemScopeRoutes.md`. The document should:

- List all routes with their HTTP method, path, and corresponding controller function.
- Provide a concise description of each route’s purpose.
- Specify the input schema (from `schemas/yup/oemScope.js` or query parameters), listing top-level properties (e.g., `name`, `isDefault`) and referencing nested Yup schemas (e.g., `correctiveMajorDetails: CorrectiveMajorSchema`) for clarity. Ensure required vs. optional fields are accurately described per the schema.
- Specify the output schema (from `schemas/yup/response.js` or `oemScope.js`) for success responses.
- Indicate the `formatSuccess` type (`'default'`, `'crud'`, `'list'`, etc.) and the schema type of the `data` field.
- Include example input (query parameters or request body) and output JSON, showing top-level properties and referencing Yup schemas (e.g., `"name": String`) instead of full data values for brevity.
- Provide a `formatError` example with structure `{ success: false, error: string, statusCode: number, errors: Array<string>, timestamp: Date }`.
- Maintain a consistent format with sections for each route and a "Future Updates Prompt" at the end.
- Ensure only Markdown output lines start with # (other lines, like explanations, are normal).
- Name the file `oemScopeRoutes.md`.

Focus on accuracy, conciseness, and clarity, serving as an interface guide for the controller. If schemas or response formats have changed, reflect those updates precisely, ensuring top-level schema properties are listed with nested schema references for all input and output examples, and schema requirements (required vs. optional) are strictly followed.
```
