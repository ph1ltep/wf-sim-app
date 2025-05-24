# Context Forms Guide

## Overview

The `ContextForm` component integrates Ant Design's Form with the application's context state, providing a seamless way to edit context data with form isolation, validation, and user-friendly interactions.

## Core Features

- **Form Isolation**: Changes are kept in form state until submission - no context pollution during editing
- **Path-based Integration**: Automatically maps form fields to context paths
- **Batch Updates**: Single context update on form submission for optimal performance
- **Validation Integration**: Uses existing `updateByPath` validation with simple error display
- **Unsaved Changes Detection**: Tracks and warns about unsaved changes
- **Ant Design Integration**: Full compatibility with Ant Design Form features

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
| `path` | `string[]` or `string` | Required | Base path in the context for this form |
| `onSubmit` | `Function` | - | Callback when form is submitted successfully |
| `onCancel` | `Function` | - | Callback when form is cancelled |
| `children` | `React.ReactNode` | - | Form field components |
| `submitText` | `string` | "Save" | Text for submit button |
| `cancelText` | `string` | "Cancel" | Text for cancel button |
| `showActions` | `boolean` | `true` | Whether to show action buttons |
| `confirmOnCancel` | `boolean` | `true` | Whether to show confirmation when cancelling with unsaved changes |
| `...formProps` | `Object` | - | All other props are passed to Ant Design Form |

## Form Lifecycle

1. **Initialization**: Form loads initial values from context path
2. **Editing**: All changes stay in form state (context unchanged)
3. **Submission**: Form validates and batch-updates context via `updateByPath`
4. **Success**: Context is updated, form state resets, success message shown
5. **Validation Errors**: Errors from `updateByPath` are displayed in Alert component
6. **Cancel**: Form resets to original context values (with confirmation if unsaved changes)

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

- **Form Validation**: Uses Ant Design's built-in field validation (required, rules, etc.)
- **Context Validation**: Performed on submission via `updateByPath` using existing Yup schemas
- **Error Display**: Validation errors shown in dismissible Alert component above form
- **Error Clearing**: Errors automatically clear when user starts editing

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

### Complex Form with Layout
```jsx
<ContextForm path={['settings', 'project']}>
  <FormSection title="Basic Information">
    <ResponsiveFieldRow layout="twoColumn">
      <TextField path="name" label="Project Name" required />
      <TextField path="code" label="Project Code" />
    </ResponsiveFieldRow>
    
    <TextAreaField 
      path="description" 
      label="Description" 
      rows={4} 
    />
  </FormSection>
  
  <FormDivider />
  
  <FormSection title="Technical Details">
    <FormRow gutter={[16, 16]}>
      <FormCol span={8}>
        <NumberField path="capacity" label="Capacity (MW)" />
      </FormCol>
      <FormCol span={8}>
        <NumberField path="turbineCount" label="Turbines" />
      </FormCol>
      <FormCol span={8}>
        <NumberField path="hubHeight" label="Hub Height (m)" />
      </FormCol>
    </FormRow>
  </FormSection>
</ContextForm>
```

### Form with Custom Actions
```jsx
<ContextForm 
  path={['settings', 'project']}
  showActions={false}
  onSubmit={(values) => {
    console.log('Project saved:', values);
    // Custom success handling
  }}
>
  <TextField path="name" label="Project Name" required />
  <NumberField path="capacity" label="Capacity (MW)" />
  
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

### Form with External Control
```jsx
const MyComponent = () => {
  const formRef = useRef();
  
  const handleExternalSave = async () => {
    // Access form methods
    const validation = await formRef.current.validateContextFields();
    if (validation.isValid) {
      // Handle external save logic
    }
  };
  
  return (
    <ContextForm 
      ref={formRef}
      path={['settings', 'project']}
    >
      <TextField path="name" label="Project Name" />
      <Button onClick={handleExternalSave}>
        External Save
      </Button>
    </ContextForm>
  );
};
```

## Form Methods

When using a ref, ContextForm exposes additional methods:

| Method | Description |
|--------|-------------|
| `validateContextFields()` | Validates all form fields |
| `resetToInitial()` | Resets form to initial context values |
| `getInitialValues()` | Returns the original context values |
| `hasUnsavedChanges()` | Returns true if form has unsaved changes |

## Error Handling

ContextForm handles errors gracefully:

- **Validation Errors**: Shown in Alert component with list of specific errors
- **Network Errors**: Handled with generic error message
- **Context Errors**: Errors from `updateByPath` are displayed to user
- **Form Errors**: Ant Design validation errors shown on individual fields

## Best Practices

1. **Use meaningful base paths** - Choose paths that represent logical data groupings
2. **Keep forms focused** - One ContextForm per logical data entity
3. **Leverage layout components** - Use FormSection,
3. **Leverage layout components** - Use FormSection, ResponsiveFieldRow, etc. for better organization
4. **Handle callbacks appropriately** - Use onSubmit for navigation, onCancel for cleanup
5. **Provide user feedback** - Success messages are shown automatically
6. **Use confirmation dialogs** - Leave confirmOnCancel enabled for better UX
7. **Test with debug borders** - Use REACT_APP_DEBUG_FORM_BORDERS=true during development

## Common Patterns

### Modal Form
```jsx
const [modalVisible, setModalVisible] = useState(false);

<Modal
  title="Edit Project"
  open={modalVisible}
  footer={null}
  onCancel={() => setModalVisible(false)}
>
  <ContextForm
    path={['settings', 'project']}
    onSubmit={() => setModalVisible(false)}
    onCancel={() => setModalVisible(false)}
  >
    <TextField path="name" label="Project Name" required />
    <NumberField path="capacity" label="Capacity (MW)" />
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
        <NumberField path="capacity" label="Capacity (MW)" required />
        <NumberField path="turbines" label="Number of Turbines" required />
      </>
    )}
  </ContextForm>
);
```

### Nested Object Editing
```jsx
<ContextForm path={['project', 'contact']}>
  <FormSection title="Contact Information">
    <ResponsiveFieldRow layout="twoColumn">
      <TextField path="name" label="Contact Name" required />
      <TextField path="title" label="Title" />
    </ResponsiveFieldRow>
    
    <ResponsiveFieldRow layout="twoColumn">
      <TextField path="email" label="Email" required />
      <TextField path="phone" label="Phone" />
    </ResponsiveFieldRow>
    
    <FormSection title="Address" bordered>
      <TextField path="address.street" label="Street" />
      <ResponsiveFieldRow layout="threeColumn">
        <TextField path="address.city" label="City" />
        <TextField path="address.state" label="State" />
        <TextField path="address.zip" label="ZIP" />
      </ResponsiveFieldRow>
    </FormSection>
  </FormSection>
</ContextForm>
```

## Performance Considerations

- **Form Isolation**: No context updates during editing = no unnecessary re-renders
- **Batch Updates**: Single `updateByPath` call on submission
- **Efficient Comparison**: Simple JSON stringify for change detection
- **Minimal State**: Only tracks essential form state (loading, errors, changes)
- **Smart Re-initialization**: Only reinitializes when path changes

## Troubleshooting

### Form not initializing
```jsx
// ✅ Correct: Use array path
<ContextForm path={['settings', 'project']}>

// ❌ Incorrect: Missing path
<ContextForm>
```

### Fields not updating context
```jsx
// ✅ Correct: Fields work automatically in ContextForm
<ContextForm path={['settings', 'project']}>
  <TextField path="name" />
</ContextForm>

// ❌ Incorrect: Don't manually set formMode
<ContextForm path={['settings', 'project']}>
  <TextField path="name" formMode={false} />
</ContextForm>
```

### Validation not working
```jsx
// ✅ Correct: Let ContextForm handle validation
<ContextForm path={['settings', 'project']}>
  <TextField path="name" required />
</ContextForm>

// ❌ Incorrect: Don't override form submission
<ContextForm path={['settings', 'project']} onFinish={customHandler}>
```

### Path resolution issues
```jsx
// ✅ Correct: Relative paths in ContextForm
<ContextForm path={['settings', 'project']}>
  <TextField path="name" />           {/* Resolves to ['settings', 'project', 'name'] */}
  <TextField path="contact.email" />  {/* Resolves to ['settings', 'project', 'contact', 'email'] */}
</ContextForm>

// ❌ Incorrect: Absolute paths in ContextForm
<ContextForm path={['settings', 'project']}>
  <TextField path={['settings', 'project', 'name']} />  {/* Double path! */}
</ContextForm>
```

## Migration from Direct Context Fields

If you have existing direct context field usage and want to add form capabilities:

### Before (Direct Context)
```jsx
<FormSection title="Project Settings">
  <TextField path={['settings', 'project', 'name']} label="Name" />
  <NumberField path={['settings', 'project', 'capacity']} label="Capacity" />
</FormSection>
```

### After (With ContextForm)
```jsx
<ContextForm path={['settings', 'project']}>
  <FormSection title="Project Settings">
    <TextField path="name" label="Name" />
    <NumberField path="capacity" label="Capacity" />
  </FormSection>
</ContextForm>
```

## Debug Mode

Enable form debugging to visualize layout and structure:

```bash
REACT_APP_DEBUG_FORM_BORDERS=true npm start
```

This shows:
- **Blue dashed border**: ContextForm boundary
- **Red dashed border**: Individual ContextField boundaries
- **Green dashed border**: FormSection boundaries
- **Orange dashed border**: FormRow boundaries
- **Purple dashed border**: FormCol boundaries