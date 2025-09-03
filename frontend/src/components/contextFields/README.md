# ContextField & ContextForm Quick Reference

## Quick Start

### Direct Mode (Immediate Updates)
```jsx
<ContextField
  path={['settings', 'project', 'name']}
  component={Input}
  label="Project Name"
  required
/>
```

### Form Mode (Batched Updates)
```jsx
<ContextForm path={['settings', 'project']}>
  <ContextField
    path="name"  // Relative to form base path
    component={Input}
    label="Project Name"
    required
  />
  <Button htmlType="submit">Save</Button>
</ContextForm>
```

## When to Use What

| Use Case | Mode | Why |
|----------|------|-----|
| Settings toggles, sliders | Direct | Immediate feedback needed |
| Single field edits | Direct | Simple, quick updates |
| Complex forms, validation | Form | Better UX, batched updates |
| Multi-field dependencies | Form | Validation across fields |

## Essential Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string[]` or `string` | ✓ | Context path or relative path in forms |
| `component` | `React.Component` | ✓ | Ant Design component (Input, Select, etc.) |
| `label` | `string` | | Field label |
| `required` | `boolean` | | Mark as required |
| `customValidator` | `function` | | Validation (direct mode only) |
| `rules` | `array` | | Ant Design rules (form mode only) |

## Available Components

| Component | Purpose | Example |
|-----------|---------|---------|
| `TextField` | Text input | Name, description |
| `NumberField` | Numeric input | Age, quantity |
| `CurrencyField` | Money values | Price, budget |
| `PercentageField` | 0-100% values | Interest rate |
| `SelectField` | Dropdown | Categories, options |
| `SwitchField` | Toggle | Enable/disable |
| `DateField` | Date picker | Dates |

## Making Components ContextForm-Compatible

### Required Implementation

Your component must detect and handle `formMode` and integrate with ContextForm's child detection:

```jsx
import React from 'react';

const MyCustomField = ({ 
  formMode,
  getValueOverride, 
  updateValueOverride,
  name,
  ...props 
}) => {
  // 1. CRITICAL: Check if in form mode
  if (formMode) {
    // In form mode - use Ant Design Form.Item with name prop
    return (
      <Form.Item name={name} {...formItemProps}>
        <MyAntdComponent {...componentProps} />
      </Form.Item>
    );
  }

  // 2. Direct mode - handle context updates yourself
  const value = getValueOverride ? getValueOverride() : getContextValue();
  const updateValue = updateValueOverride || updateContextValue;

  return (
    <Form.Item {...formItemProps}>
      <MyAntdComponent 
        value={value}
        onChange={updateValue}
        {...componentProps}
      />
    </Form.Item>
  );
};

export default MyCustomField;
```

### Child Detection Mechanism

ContextForm finds compatible children using this logic:

1. **Props Check**: Component must accept `formMode`, `getValueOverride`, `updateValueOverride`, and `name` props
2. **React.cloneElement**: ContextForm clones children and injects these props
3. **Recursive Search**: Searches through component tree to find ContextField-compatible components

### Complete Implementation Example

```jsx
import React from 'react';
import { Form, Input } from 'antd';
import { useScenario } from '../context/ScenarioContext';

const CustomTextField = ({
  path,
  label,
  required,
  formMode,
  getValueOverride,
  updateValueOverride,
  name,
  customValidator,
  ...restProps
}) => {
  const { getByPath, updateByPath } = useScenario();
  
  // Form mode implementation
  if (formMode) {
    return (
      <Form.Item
        name={name}
        label={label}
        required={required}
        {...restProps}
      >
        <Input />
      </Form.Item>
    );
  }

  // Direct mode implementation
  const value = getValueOverride ? getValueOverride() : getByPath(path);
  const [error, setError] = useState(null);

  const handleChange = async (e) => {
    const newValue = e.target.value;
    
    // Custom validation
    if (customValidator) {
      const validationError = customValidator(newValue);
      setError(validationError);
      if (validationError) return;
    }

    // Update context
    if (updateValueOverride) {
      updateValueOverride(newValue);
    } else {
      await updateByPath(path, newValue);
    }
  };

  return (
    <Form.Item
      label={label}
      required={required}
      validateStatus={error ? 'error' : ''}
      help={error}
    >
      <Input
        value={value || ''}
        onChange={handleChange}
      />
    </Form.Item>
  );
};

export default CustomTextField;
```

### Integration Checklist

- [ ] Component accepts `formMode` prop
- [ ] Component accepts `getValueOverride` and `updateValueOverride` props
- [ ] Component accepts `name` prop for Ant Design forms
- [ ] Form mode returns `Form.Item` with `name` prop
- [ ] Direct mode handles context integration
- [ ] Props are properly forwarded to Ant Design components

## Common Patterns

### Custom Validation (Direct Mode)
```jsx
const validateEmail = (value) => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : 'Invalid email format';
};

<ContextField
  path="email"
  component={Input}
  customValidator={validateEmail}
  required
/>
```

### Complex Form with Validation
```jsx
<ContextForm 
  path={['settings', 'project']}
  onFinish={() => message.success('Saved!')}
>
  <ContextField
    path="name"
    component={Input}
    label="Project Name"
    required
    rules={[{ min: 3, message: 'Minimum 3 characters' }]}
  />
  
  <ContextField
    path="budget"
    component={NumberField}
    label="Budget"
    required
    rules={[{ type: 'number', min: 0 }]}
  />
  
  <Button htmlType="submit">Save Project</Button>
</ContextForm>
```

### Transform Values
```jsx
<ContextField
  path="upperCaseName"
  component={Input}
  transform={(value) => value?.toUpperCase()}
/>
```

## Debug Mode

```bash
REACT_APP_DEBUG_FORM_BORDERS=true npm start
```
Adds red borders around all ContextField components for debugging.