# ContextForm Documentation

## Quick Start

ContextForm integrates Ant Design forms with application context state, providing form isolation, batch updates, and automatic metric calculations.

```jsx
<ContextForm path={['settings', 'project']} affectedMetrics={['totalMW']}>
  <TextField path="name" label="Project Name" required />
  <NumberField path="capacity" label="Capacity (MW)" />
</ContextForm>
```

## Core Features

- **Form Isolation** - Changes stay in form state until submission
- **Path-based Integration** - Automatic mapping to context paths
- **Batch Updates** - Single context update on submission
- **Automatic Metrics** - Calculate metrics using all form values
- **Validation Integration** - Built-in error handling and display
- **Unsaved Changes Detection** - Warns before losing changes

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `path` | `string[]` \| `string` | **Required** | Base context path for the form |
| `onSubmit` | `(values) => void` | - | Success callback with form values |
| `onCancel` | `() => void` | - | Cancel callback |
| `affectedMetrics` | `string[]` | `null` | Metrics to calculate on submit |
| `submitText` | `string` | `"Save"` | Submit button text |
| `cancelText` | `string` | `"Cancel"` | Cancel button text |
| `showActions` | `boolean` | `true` | Show action buttons |
| `confirmOnCancel` | `boolean` | `true` | Confirm when cancelling unsaved changes |

All other props are passed to Ant Design's Form component.

### Ref Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `validateContextFields()` | `Promise<boolean>` | Validates all form fields |
| `resetToInitial()` | `void` | Resets to original context values |
| `hasUnsavedChanges()` | `boolean` | Checks for unsaved changes |

## Path Handling

Form fields use paths relative to the form's base path:

```jsx
<ContextForm path={['settings', 'project']}>
  <TextField path="name" />           {/* → ['settings', 'project', 'name'] */}
  <TextField path="contact.email" />  {/* → ['settings', 'project', 'contact', 'email'] */}
</ContextForm>
```

## Metrics Integration

### Form-Level Metrics (Recommended)
Calculate metrics using all form values on submission:

```jsx
<ContextForm 
  path={['settings', 'financing']}
  affectedMetrics={['wacc', 'debtToEquityRatio']}
>
  <NumberField path="debtRatio" label="Debt Ratio" />
  <NumberField path="costOfEquity" label="Cost of Equity" />
  <NumberField path="costOfDebt" label="Cost of Debt" />
</ContextForm>
```

**Benefits:**
- Accurate calculations with complete form state
- Better performance (single calculation)
- Consistent user experience

### Field-Level vs Form-Level
```jsx
// ❌ Don't mix - causes conflicts
<ContextForm affectedMetrics={['wacc']}>
  <NumberField path="debtRatio" affectedMetrics={['wacc']} />
</ContextForm>

// ✅ Choose one approach
<ContextForm affectedMetrics={['wacc']}>  {/* Form-level */}
  <NumberField path="debtRatio" />
</ContextForm>

// ✅ Or field-level for immediate feedback
<ContextForm>
  <NumberField path="debtRatio" affectedMetrics={['wacc']} />
</ContextForm>
```

## Form Lifecycle

1. **Initialization** - Load values from context path
2. **Editing** - Changes isolated in form state
3. **Submission** - Validate and batch-update context
4. **Metrics** - Calculate if `affectedMetrics` specified
5. **Success** - Update context, reset form, show success message
6. **Errors** - Display validation errors in Alert component

## Common Patterns

### Modal Form
```jsx
<Modal title="Edit Settings" open={visible} footer={null}>
  <ContextForm
    path={['settings', 'project']}
    onSubmit={() => setVisible(false)}
    onCancel={() => setVisible(false)}
  >
    <TextField path="name" label="Name" required />
  </ContextForm>
</Modal>
```

### Custom Actions
```jsx
<ContextForm path={['settings', 'project']} showActions={false}>
  <TextField path="name" label="Name" />
  
  <Form.Item>
    <Space>
      <Button onClick={onBack}>Back</Button>
      <Button type="primary" htmlType="submit">Save & Continue</Button>
    </Space>
  </Form.Item>
</ContextForm>
```

### Complex Layout
```jsx
<ContextForm 
  path={['settings', 'financing']}
  layout="horizontal"
  labelCol={{ span: 6 }}
  affectedMetrics={['wacc']}
>
  <FormSection title="Debt Structure">
    <ResponsiveFieldRow layout="twoColumn">
      <NumberField path="debtRatio" label="Debt Ratio" required />
      <NumberField path="costOfDebt" label="Cost of Debt" />
    </ResponsiveFieldRow>
  </FormSection>
</ContextForm>
```

## Validation & Error Handling

- **Form Validation** - Ant Design field rules and required props
- **Context Validation** - Yup schemas via `updateByPath`
- **Error Display** - Alert component with dismissible error list
- **Auto-clearing** - Errors clear when user starts editing

## Performance Features

- **Form Isolation** - No context updates during editing
- **Batch Updates** - Single `updateByPath` call on submit
- **Smart Re-initialization** - Only when path changes
- **Efficient Change Detection** - Simple JSON comparison

## Migration Guide

### From Direct Context Fields

**Before:**
```jsx
<TextField path={['settings', 'project', 'name']} label="Name" />
<NumberField 
  path={['settings', 'project', 'capacity']} 
  affectedMetrics={['totalMW']}
/>
```

**After:**
```jsx
<ContextForm path={['settings', 'project']} affectedMetrics={['totalMW']}>
  <TextField path="name" label="Name" />
  <NumberField path="capacity" />
</ContextForm>
```

## Best Practices

1. **Logical Grouping** - Use meaningful base paths for related data
2. **Form-Level Metrics** - Prefer form-level over field-level for complex calculations  
3. **Focused Forms** - One ContextForm per logical entity
4. **User Feedback** - Keep `confirmOnCancel` enabled for better UX
5. **Error Handling** - Let ContextForm handle validation display
6. **Performance** - Leverage form isolation for smooth editing experience

## Development Tools

Enable debug borders during development:
```bash
REACT_APP_DEBUG_FORM_BORDERS=true npm start
```