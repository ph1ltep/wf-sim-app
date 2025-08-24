# Configuration/Defaults Pages Pattern Analysis

## File Structure Analysis

### Current Configuration/Defaults Pages
- **Location**: `/frontend/src/pages/config/defaults/Locations.jsx`
- **OMScopes**: `/frontend/src/pages/config/defaults/OMScopes.jsx`

### Navigation Structure
```javascript
// In App.js routing:
<Route path="config/defaults">
  <Route path="locations" element={<Locations />} />
  <Route path="omscopes" element={<OMScopes />} />
  <Route index element={<Navigate to="/config/defaults/locations" replace />} />
</Route>

// In Sider.jsx navigation menu:
{
  key: 'config-defaults',
  icon: <DatabaseOutlined />,
  label: 'Defaults',
  children: [
    {
      key: '/config/defaults/locations',
      icon: <GlobalOutlined />,
      label: 'Locations'
    },
    {
      key: '/config/defaults/omscopes',
      icon: <ToolOutlined />,
      label: 'O&M Scopes'
    }
  ]
}
```

## Component Architecture Pattern

### 1. Main Page Component Structure
**File**: `pages/config/defaults/[EntityName].jsx`

**Key patterns:**
- Uses `useState` hooks for modal visibility, form type ('add'/'edit'), current record
- Uses custom hook for data management: `use[EntityName]s()`
- Imports form components and column definitions
- Standard import pattern:
```javascript
import React, { useState } from 'react';
import { Typography, Form, Card, Button, Modal, Table } from 'antd';
import { PlusOutlined, [IconName] } from '@ant-design/icons';
import use[EntityName]s from 'hooks/use[EntityName]s';
import [EntityName]Form from 'components/forms/[entityname]/[EntityName]Form';
import { get[EntityName]Columns } from 'components/forms/[entityname]/[entityname]Columns';
```

**UI Structure:**
1. Title and description
2. Card with:
   - Icon and title in card header
   - "Add [Entity]" button in card extra
   - Table with data, columns, pagination, loading state
3. Modal for add/edit operations

### 2. Custom Hook Pattern
**File**: `hooks/use[EntityName]s.js`

**Standard structure:**
- State management: `data[], loading, error, [generateNameLoading]`
- CRUD operations: `create[Entity], update[Entity], delete[Entity], fetch[Entity]s`
- Data transformation: Adds `key: item._id` for Antd Table
- Error handling: Antd message.error/success notifications
- Auto-fetching: `useEffect` calls `fetch` on mount
- Schema integration: Uses `applyFormValuesToSchema()` for OEMScopes

**Key patterns:**
- Uses `useCallback` for all async functions
- Returns object with all state and operations
- Standard error handling with try/catch and user messages
- Transforms API response data for UI consumption

### 3. Form Component Pattern  
**File**: `components/forms/[entityname]/[EntityName]Form.jsx`

**Standard structure:**
- Uses `Form.useForm()` hook passed as prop
- `useEffect` to populate `initialValues` when provided
- Form layout: `vertical` layout
- Form sections using `FormSection, ResponsiveFieldRow, FormRow, FormCol` from contextFields
- Validation rules on each Form.Item
- Uses Antd input components: `Input, InputNumber, Select`

**Key features:**
- Consistent styling with contextFields layout components
- Form validation using Antd rules
- Responsive layout with grid system
- Dynamic addon text (e.g., currency symbols)

### 4. Column Configuration Pattern
**File**: `components/forms/[entityname]/[entityname]Columns.js`

**Standard structure:**
- Export function: `get[EntityName]Columns(handleEdit, handleDelete)`
- Column definitions with: `title, dataIndex, key, render, sorter`
- Actions column with Edit/Delete buttons using `Space, Button, Popconfirm`
- Special icon columns using `createIconColumn` for complex data visualization
- Data formatting in render functions

### 5. API Integration Pattern
**Files**: `api/[entityname].js`

**Standard CRUD operations:**
```javascript
export const getAll[EntityName]s = async () => api.get('/[entity-endpoint]');
export const get[EntityName]ById = async (id) => api.get(`/[entity-endpoint]/${id}`);
export const create[EntityName] = async (data) => api.post('/[entity-endpoint]', data);
export const update[EntityName] = async (id, data) => api.put(`/[entity-endpoint]/${id}`, data);
export const delete[EntityName] = async (id) => api.delete(`/[entity-endpoint]/${id}`);
```

## RepairPackage Backend Infrastructure

### Existing Backend Components:
1. **Yup Schema**: `schemas/yup/repairPackage.js` - Complete validation schema
2. **Mongoose Schema**: `schemas/mongoose/repairPackage.js` - Database model
3. **Controller**: `backend/controllers/repairPackageController.js` - Full CRUD + clone operations
4. **Routes**: `backend/routes/repairPackageRoutes.js` - RESTful API endpoints
5. **Seeding**: `backend/scripts/seedRepairPackages.js` - Default data

### API Endpoints Available:
- `GET /api/repair-packages` - Get all (with filters)
- `GET /api/repair-packages/:id` - Get by ID
- `GET /api/repair-packages/category/:category` - Get by category
- `POST /api/repair-packages` - Create new
- `PUT /api/repair-packages/:id` - Update
- `DELETE /api/repair-packages/:id` - Delete
- `POST /api/repair-packages/:id/clone` - Clone existing

### RepairPackage Data Structure:
```javascript
{
  name: String,
  description: String,
  category: 'major'|'medium'|'minor'|'electronic'|'blade',
  costs: {
    componentCostEUR: Number,
    craneMobilizationEUR: Number,
    craneDailyRateEUR: Number,
    specialistLaborEUR: Number
  },
  crane: {
    required: Boolean,
    type: 'none'|'mobile'|'crawler'|'tower'|'special',
    minimumDays: Number,
    baseDurationDays: Number
  },
  complexity: {
    component: DistributionTypeSchema,
    repair: DistributionTypeSchema
  },
  baseEscalationRate: Number,
  appliesTo: {
    componentCategories: Array,
    turbineTypes: Array,
    powerRangeKW: { min: Number, max: Number }
  },
  isDefault: Boolean,
  isActive: Boolean
}
```

## Required Frontend Components to Create

### Missing Components for RepairPackages:
1. **Main Page**: `pages/config/defaults/RepairPackages.jsx`
2. **API Client**: `api/repairPackages.js`
3. **Custom Hook**: `hooks/useRepairPackages.js`
4. **Form Component**: `components/forms/repairPackages/RepairPackageForm.jsx`
5. **Column Config**: `components/forms/repairPackages/repairPackageColumns.js`
6. **Constants**: `components/forms/repairPackages/repairPackageConstants.js`

### Navigation Updates Required:
1. Add route in `App.js` 
2. Add menu item in `Sider.jsx`

## Implementation Checklist

### Phase 1: Basic Structure
- [ ] Create API client following locations.js pattern
- [ ] Create custom hook following useLocations.js pattern
- [ ] Create main page component following Locations.jsx pattern
- [ ] Create form component following LocationForm.jsx pattern
- [ ] Create column configuration following locationColumns.js pattern
- [ ] Add navigation routing and menu items

### Phase 2: RepairPackage-Specific Features
- [ ] Distribution field integration for complexity
- [ ] Category-based filtering and grouping
- [ ] Clone functionality in UI
- [ ] Advanced table features (expandable rows for details)
- [ ] Cost visualization (icon columns)

### Phase 3: Integration
- [ ] Link with component failure rates system
- [ ] Validation integration with existing schemas
- [ ] User experience optimization (loading states, error handling)

## Key Design Decisions

1. **Form Layout**: Use contextFields components for consistency
2. **Data Management**: Follow useLocations hook pattern exactly
3. **Error Handling**: Use Antd message system consistently
4. **Table Features**: Include expandable rows like OMScopes for complex data
5. **Icon Strategy**: Use ToolOutlined for repair/maintenance theme
6. **Schema Integration**: Use applyFormValuesToSchema like OMScopes pattern