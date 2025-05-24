 # ContextField Component Documentation
 
 ## Overview
 
 The `ContextField` component is the foundation for all form fields in the application. It provides automatic integration with the application's context state, supporting both direct context updates and form-based editing with comprehensive validation.
 
 ## Core Concept
 
 ContextField operates in two distinct modes:
 
 - **Direct Mode**: Fields directly read from and write to the application context in real-time
 - **Form Mode**: Fields work within a `ContextForm`, batching updates and leveraging Ant Design's form validation
 
 ## Usage Modes
 
 ### Direct Mode
 
 Fields automatically connect to context paths and update immediately on change:
 
 ```jsx
 <ContextField
   path={['settings', 'project', 'name']}
   label="Project Name"
   component={Input}
   required
 />
 ```
 
 **Characteristics:**
 - Updates context immediately on every change
 - Custom validation runs before context updates
 - Visual validation feedback via `validateStatus` and `help` props
 - Invalid values are prevented from reaching the context
 
 ### Form Mode
 
 Fields work within `ContextForm` with batched updates and Ant Design validation:
 
 ```jsx
 <ContextForm path={['settings', 'project']}>
   <ContextField
     path="name"  // Relative to form base path
     label="Project Name"
     component={Input}
     required
   />
 </ContextForm>
 ```
 
 **Characteristics:**
 - Updates are isolated in form state until submission
 - Full Ant Design form validation and error handling
 - Custom validators are ignored (Ant Design handles everything)
 - Batch context update on form submission
 
 ## Props Reference
 
 ### Context-Specific Props
 
 | Prop | Type | Description |
 |------|------|-------------|
 | `path` | `string[]` or `string` | Path to the value in context state |
 | `component` | `React.Component` | Ant Design component to render (Input, Select, etc.) |
 | `transform` | `function` | Transform function for value processing |
 | `defaultValue` | `any` | Default value if context path doesn't exist |
 | `customValidator` | `function` | Custom validation function for direct mode |
 | `componentProps` | `object` | Props passed directly to the component |
 
 ### Form Integration Props
 
 | Prop | Type | Description |
 |------|------|-------------|
 | `formMode` | `boolean` | Whether field is in form mode (auto-set by ContextForm) |
 | `getValueOverride` | `function` | Value getter override (used by ContextForm) |
 | `updateValueOverride` | `function` | Value updater override (used by ContextForm) |
 | `name` | `string` or `array` | Ant Design Form.Item name (auto-set in form mode) |
 
 ### Standard Form.Item Props
 
 All Ant Design Form.Item props are supported:
 
 | Prop | Type | Description |
 |------|------|-------------|
 | `label` | `string` | Field label |
 | `tooltip` | `string` | Help tooltip |
 | `required` | `boolean` | Mark field as required |
 | `disabled` | `boolean` | Disable the field |
 | `rules` | `array` | Ant Design validation rules (form mode only) |
 | `validateStatus` | `string` | Validation status override |
 | `help` | `string` | Help text or error message |
 
 ## Validation System
 
 ### Direct Mode Validation
 
 1. **Required Field Check**: Built-in validation for required fields
 2. **Custom Validation**: Optional `customValidator` function
 3. **Context Protection**: Invalid values never reach the context
 
 ```jsx
 const emailValidator = (value) => {
   if (!value) return null; // Let required validation handle empty values
   
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(value)) {
     return 'Please enter a valid email address';
   }
   
   return null; // Validation passed
 };
 
 <ContextField
   path={['user', 'email']}
   label="Email Address"
   component={Input}
   required
   customValidator={emailValidator}
 />
 ```
 
 ### Form Mode Validation
 
 Uses standard Ant Design form validation via `rules` prop:
 
 ```jsx
 <ContextForm path={['user']}>
   <ContextField
     path="email"
     label="Email Address"
     component={Input}
     required
     rules={[
       { type: 'email', message: 'Please enter a valid email address' }
     ]}
   />
 </ContextForm>
 ```
 
 ## Custom Validator Function
 
 The `customValidator` prop accepts a function with the following signature:
 
 ```jsx
 customValidator(value) => string | null
 ```
 
 - **Parameters**: `value` - the current field value
 - **Returns**: Error message string if validation fails, `null` if validation passes
 - **Only used in direct mode** - ignored in form mode
 
 ### Custom Validator Examples
 
 **Email Validation:**
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
 />
 ```
 
 **URL Validation:**
 ```jsx
 const validateURL = (value) => {
   if (!value) return null;
   try {
     new URL(value);
     return null;
   } catch {
     return 'Please enter a valid URL';
   }
 };
 
 <ContextField
   path="website"
   component={Input}
   customValidator={validateURL}
 />
 ```
 
 **Range Validation:**
 ```jsx
 const validateRange = (value) => {
   if (value === null || value === undefined) return null;
   const num = Number(value);
   if (isNaN(num)) return 'Must be a number';
   if (num < 0 || num > 100) return 'Must be between 0 and 100';
   return null;
 };
 
 <ContextField
   path="percentage"
   component={InputNumber}
   customValidator={validateRange}
 />
 ```
 
 ## Available Field Components
 
 The following pre-built field components are available, all based on ContextField:
 
 ### Text Fields
 - `TextField` - Single-line text input
 - `TextAreaField` - Multi-line text input
 
 ### Numeric Fields
 - `NumberField` - Numeric input with formatting
 - `CurrencyField` - Currency input with formatting
 - `PercentageField` - Percentage input (0-100%)
 - `PercentileField` - Percentile input (P1-P99)
 
 ### Selection Fields
 - `SelectField` - Dropdown selection
 - `RadioGroupField` - Radio button group
 - `CheckboxField` - Single checkbox
 
 ### Other Fields
 - `SwitchField` - Toggle switch
 - `DateField` - Date picker
 - `SliderField` - Slider control
 
 ## Transform Function
 
 The `transform` prop allows you to modify values before they're processed:
 
 ```jsx
 <ContextField
   path="upperCaseName"
   component={Input}
   transform={(value) => value?.toUpperCase()}
 />
 
 // For complex event objects
 <ContextField
   path="isChecked"
   component={Checkbox}
   transform={(e) => e.target.checked}
 />
 ```
 
 ## Default Value Initialization
 
 When a context path doesn't exist, you can provide a default value:
 
 ```jsx
 <ContextField
   path={['settings', 'theme']}
   component={Select}
   defaultValue="light"
 >
   <Select.Option value="light">Light</Select.Option>
   <Select.Option value="dark">Dark</Select.Option>
 </ContextField>
 ```
 
 ## Component Props
 
 Pass props directly to the underlying Ant Design component:
 
 ```jsx
 <ContextField
   path="description"
   component={Input.TextArea}
   componentProps={{
     rows: 4,
     placeholder: "Enter description...",
     maxLength: 500,
     showCount: true
   }}
 />
 ```
 
 ## Debug Mode
 
 Enable visual debugging to see field boundaries:
 
 ```bash
 REACT_APP_DEBUG_FORM_BORDERS=true npm start
 ```
 
 This adds red dashed borders around all ContextField components.
 
 ## Best Practices
 
 1. **Use pre-built field components** when possible (TextField, NumberField, etc.)
 2. **Prefer form mode for complex forms** - better validation and user experience
 3. **Use direct mode for simple, immediate updates** - settings toggles, quick edits
 4. **Keep custom validators simple** - return string errors or null
 5. **Provide meaningful error messages** - include field context in messages
 6. **Use array notation for paths** - `['settings', 'project', 'name']` for better type safety
 7. **Handle edge cases in validators** - check for null/undefined values appropriately
 
 ## Error Handling
 
 ### Direct Mode
 - Validation errors shown via `help` prop with red styling
 - Invalid values prevented from reaching context
 - User can continue editing to fix errors
 
 ### Form Mode
 - Standard Ant Design form validation
 - Field-level error display
 - Form submission blocked until validation passes
 
 ## Performance Considerations
 
 - **Direct mode**: Updates context on every change - use for simple fields
 - **Form mode**: Batches updates - better for complex forms with many fields
 - **Custom validators**: Keep them lightweight - they run on every change in direct mode
 - **Transform functions**: Avoid expensive operations - they run on every change