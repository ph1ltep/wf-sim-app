# Context Forms Guide

## Overview

The ContextForm component integrates Ant Design's Form with the application's context state, providing a seamless way to edit context data with form isolation, validation, user-friendly interactions, and automatic metric calculations.

## Core Features

- Form Isolation: Changes are kept in form state until submission - no context pollution during editing
- Path-based Integration: Automatically maps form fields to context paths
- Batch Updates: Single context update on form submission for optimal performance
- Automatic Metrics: Calculate and update metrics using all form field values on submission
- Validation Integration: Uses existing updateByPath validation with simple error display
- Unsaved Changes Detection: Tracks and warns about unsaved changes
- Ant Design Integration: Full compatibility with Ant Design Form features

## Basic Usage

```jsx
<ContextForm
  path={['settings', 'project']}
  onSubmit={(values) => console.log('Saved:', values)}
  onCancel={() => console.log('Cancelled')}
>
  <TextField path="name" label="Project Name" required />
  <NumberField path="capacity" label="Capacity (MW)" />
  <SelectField 
    path="status" 
    label="Status" 
    options={[
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]} 
  />
</ContextForm>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| path | string[] or string | Required | Base path in the context for this form |
| onSubmit | Function | - | Callback when form is submitted successfully |
| onCancel | Function | - | Callback when form is cancelled |
| children | React.ReactNode | - | Form field components |
| affectedMetrics | string[] | null | Array of metric names to calculate on form submission |
| submitText | string | "Save" | Text for submit button |
| cancelText | string | "Cancel" | Text for cancel button |
| showActions | boolean | true | Whether to show action buttons |
| confirmOnCancel | boolean | true | Whether to show confirmation when cancelling with unsaved changes |
| ...formProps | Object | - | All other props are passed to Ant Design Form |

## Automatic Metrics Integration

### Form-Level Metrics
ContextForm can automatically calculate metrics using all form field values when the form is submitted:

```jsx
<ContextForm 
  path={['settings', 'modules', 'financing']}
  affectedMetrics={['wacc', 'debtToEquityRatio']} // Calculated on submit
>
  <NumberField path="debtRatio" label="Debt Ratio" />
  <NumberField path="costOfEquity" label="Cost of Equity" />
  <NumberField path="costOfOperationalDebt" label="Cost of Debt" />
  <NumberField path="effectiveTaxRate" label="Tax Rate" />
</ContextForm>
```

How it works:
1. User edits form fields (metrics NOT calculated during editing)
2. User clicks Save button
3. Form validation runs first
4. If valid, metrics are calculated using ALL form field values
5. Single batch update: form data + calculated metrics
6. Context is updated atomically with consistent state

### Benefits of Form-Level Metrics
- Accurate calculations: Uses complete form state, not individual field changes
- Performance: Single calculation on submit, not on every field change
- Consistency: All related fields considered together
- User experience: No distracting recalculations during editing

### Combining with Field-Level Metrics
```jsx
// ❌ Don't mix - can cause inconsistent behavior
<ContextForm affectedMetrics={['wacc']}>
  <NumberField path="debtRatio" affectedMetrics={['wacc']} /> {/* Conflict! */}
</ContextForm>

// ✅ Choose one approach per form
<ContextForm affectedMetrics={['wacc']}> {/* Form-level */}
  <NumberField path="debtRatio" />
  <NumberField path="costOfEquity" />
</ContextForm>

// ✅ Or field-level for immediate feedback
<ContextForm>
  <NumberField path="debtRatio" affectedMetrics={['wacc']} />
  <NumberField path="costOfEquity" affectedMetrics={['wacc']} />
</ContextForm>
```

## Form Lifecycle

1. Initialization: Form loads initial values from context path
2. Editing: All changes stay in form state (context unchanged, metrics not calculated)
3. Submission: Form validates and batch-updates context via updateByPath
4. Metric Calculation: If affectedMetrics declared, calculated using all form values
5. Success: Context updated with form data + metrics, form state resets, success message shown
6. Validation Errors: Errors from updateByPath are displayed in Alert component
7. Cancel: Form resets to original context values (with confirmation if unsaved changes)

## Path Handling

ContextForm automatically handles path mapping:

```jsx
// Form base path
<ContextForm path={['settings', 'project']}>
  {/* Field path is relative to form base path */}
  <TextField path="name" />         {/* Actual path: ['settings', 'project', 'name'] */}
  <TextField path="description" />  {/* Actual path: ['settings', 'project', 'description'] */}
  
  {/* Nested paths work too */}
  <TextField path="contact.email" /> {/* Actual path: ['settings', 'project', 'contact', 'email'] */}
</ContextForm>
```

## Validation

- Form Validation: Uses Ant Design's built-in field validation (required, rules, etc.)
- Context Validation: Performed on submission via updateByPath using existing Yup schemas
- Error Display: Validation errors shown in dismissible Alert component above form
- Error Clearing: Errors automatically clear when user starts editing

## Layout Integration

ContextForm works seamlessly with all Ant Design Form layout features:

```jsx
<ContextForm 
  path={['settings', 'project']}
  layout="horizontal"
  labelCol={{ span: 6 }}
  wrapperCol={{ span: 18 }}
>
  <TextField path="name" label="Project Name" />
  <NumberField path="capacity" label="Capacity" />
</ContextForm>
```

## Advanced Examples

### Complex Form with Metrics
```jsx
<ContextForm 
  path={['settings', 'modules', 'financing']}
  affectedMetrics={['wacc', 'debtToEquityRatio']}
>
  <FormSection title="Debt Structure">
    <ResponsiveFieldRow layout="twoColumn">
      <NumberField path="debtRatio" label="Debt Ratio" required />
      <NumberField path="costOfOperationalDebt" label="Cost of Debt" />
    </ResponsiveFieldRow>
  </FormSection>
  
  <FormDivider />
  
  <FormSection title="Equity & Tax">
    <ResponsiveFieldRow layout="twoColumn">
      <NumberField path="costOfEquity" label="Cost of Equity" />
      <NumberField path="effectiveTaxRate" label="Tax Rate" />
    </ResponsiveFieldRow>
  </FormSection>
</ContextForm>
```

### Form with Custom Actions
```jsx
<ContextForm 
  path={['settings', 'project']}
  showActions={false}
  affectedMetrics={['totalMW', 'netAEP']}
  onSubmit={(values) => {
    console.log('Project saved:', values);
    // Custom success handling
  }}
>
  <TextField path="name" label="Project Name" required />
  <NumberField path="numWTGs" label="Number of WTGs" />
  
  {/* Custom action buttons */}
  <Form.Item style={{ marginTop: 24 }}>
    <Space>
      <Button onClick={() => window.history.back()}>
        Back
      </Button>
      <Button type="primary" htmlType="submit">
        Save Project
      </Button>
      <Button type="primary" htmlType="submit">
        Save & Continue
      </Button>
    </Space>
  </Form.Item>
</ContextForm>
```

### Modal Form with Metrics
```jsx
const [modalVisible, setModalVisible] = useState(false);

<Modal
  title="Edit Financing Parameters"
  open={modalVisible}
  footer={null}
  onCancel={() => setModalVisible(false)}
>
  <ContextForm
    path={['settings', 'modules', 'financing']}
    affectedMetrics={['wacc']}
    onSubmit={() => setModalVisible(false)}
    onCancel={() => setModalVisible(false)}
  >
    <NumberField path="debtRatio" label="Debt Ratio" required />
    <NumberField path="costOfEquity" label="Cost of Equity" required />
  </ContextForm>
</Modal>
```

### Wizard Step Form
```jsx
const WizardStep = ({ currentStep, onNext, onBack }) => (
  <ContextForm
    path={['wizard', `step${currentStep}`]}
    submitText="Next"
    cancelText="Back"
    affectedMetrics={currentStep === 2 ? ['totalMW', 'netAEP'] : null}
    onSubmit={onNext}
    onCancel={onBack}
  >
    {currentStep === 1 && (
      <>
        <TextField path="name" label="Project Name" required />
        <TextField path="location" label="Location" required />
      </>
    )}
    {currentStep === 2 && (
      <>
        <NumberField path="numWTGs" label="Number of WTGs" required />
        <NumberField path="mwPerWTG" label="MW per WTG" required />
      </>
    )}
  </ContextForm>
);
```

## Form Methods

When using a ref, ContextForm exposes additional methods:

| Method | Description |
|--------|-------------|
| validateContextFields() | Validates all form fields |
| resetToInitial() | Resets form to initial context values |
| getInitialValues() | Returns the original context values |
| hasUnsavedChanges() | Returns true if form has unsaved changes |

## Error Handling

ContextForm handles errors gracefully:

- Validation Errors: Shown in Alert component with list of specific errors
- Network Errors: Handled with generic error message
- Context Errors: Errors from updateByPath are displayed to user
- Form Errors: Ant Design validation errors shown on individual fields
- Metric Errors: Metric calculation errors logged but don't break form submission

## Performance Considerations

- Form Isolation: No context updates during editing = no unnecessary re-renders
- Batch Updates: Single updateByPath call on submission (form data + metrics)
- Efficient Comparison: Simple JSON stringify for change detection
- Minimal State: Only tracks essential form state (loading, errors, changes)
- Smart Re-initialization: Only reinitializes when path changes
- Metric Efficiency: Calculations only on form submission, not during editing

## Migration from Direct Context Fields

If you have existing direct context field usage and want to add form capabilities:

### Before (Direct Context)
```jsx
<FormSection title="Project Settings">
  <TextField path={['settings', 'project', 'name']} label="Name" />
  <NumberField 
    path={['settings', 'project', 'capacity']} 
    label="Capacity"
    affectedMetrics={['totalMW']}
  />
</FormSection>
```

### After (With ContextForm)
```jsx
<ContextForm 
  path={['settings', 'project']}
  affectedMetrics={['totalMW']}
>
  <FormSection title="Project Settings">
    <TextField path="name" label="Name" />
    <NumberField path="capacity" label="Capacity" />
  </FormSection>
</ContextForm>
```

## Best Practices

1. Use meaningful base paths - Choose paths that represent logical data groupings
2. Keep forms focused - One ContextForm per logical data entity
3. Declare metrics at form level - For complex interdependent calculations
4. Handle callbacks appropriately - Use onSubmit for navigation, onCancel for cleanup
5. Provide user feedback - Success messages are shown automatically
6. Use confirmation dialogs - Leave confirmOnCancel enabled for better UX
7. Test with debug borders - Use REACT_APP_DEBUG_FORM_BORDERS=true during development
8. Choose metric strategy - Form-level for batch calculations, field-level for immediate feedback