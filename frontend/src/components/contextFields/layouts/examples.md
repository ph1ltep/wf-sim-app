# Context Field Layout Examples

## Basic Layout Components

### FormSection
```jsx
<FormSection title="Project Settings" extra={<Button>Reset</Button>}>
  <TextField path="name" label="Project Name" />
  <NumberField path="capacity" label="Capacity (MW)" />
</FormSection>
```

### FormRow and FormCol
```jsx
<FormRow gutter={[16, 16]}>
  <FormCol span={12}>
    <TextField path="firstName" label="First Name" />
  </FormCol>
  <FormCol span={12}>
    <TextField path="lastName" label="Last Name" />
  </FormCol>
</FormRow>
```

## Responsive Layouts

### ResponsiveFieldRow
```jsx
{/* Two columns on medium+ screens, single column on small screens */}
<ResponsiveFieldRow layout="twoColumn">
  <TextField path="email" label="Email" />
  <TextField path="phone" label="Phone" />
  <TextField path="address" label="Address" />
  <TextField path="city" label="City" />
</ResponsiveFieldRow>

{/* Auto-sizing columns */}
<ResponsiveFieldRow layout="auto">
  <TextField path="code" label="Code" />
  <TextField path="description" label="Description" />
  <ButtonField>Search</ButtonField>
</ResponsiveFieldRow>
```

### Custom Responsive Layout
```jsx
<FormRow gutter={[16, 16]}>
  <FormCol xs={24} sm={24} md={16} lg={18} xl={20}>
    <TextField path="description" label="Long Description" />
  </FormCol>
  <FormCol xs={24} sm={24} md={8} lg={6} xl={4}>
    <NumberField path="priority" label="Priority" />
  </FormCol>
</FormRow>
```

## Compact and Inline Layouts

### CompactFieldGroup (Space.Compact)
```jsx
{/* Compact horizontal layout - no gaps between fields */}
<CompactFieldGroup>
  <SelectField path="countryCode" options={countryCodes} />
  <TextField path="phoneNumber" label="Phone Number" />
</CompactFieldGroup>

{/* Compact vertical layout */}
<CompactFieldGroup direction="vertical">
  <TextField path="street" label="Street" />
  <TextField path="unit" label="Unit" />
</CompactFieldGroup>
```

### FieldGroup (Space)
```jsx
{/* Grouped fields with consistent spacing */}
<FieldGroup direction="horizontal" size="middle">
  <TextField path="startDate" label="Start Date" />
  <TextField path="endDate" label="End Date" />
  <ButtonField>Apply Range</ButtonField>
</FieldGroup>

{/* Vertical field group */}
<FieldGroup direction="vertical" size="small">
  <CheckboxField path="option1" label="Enable Feature A" />
  <CheckboxField path="option2" label="Enable Feature B" />
  <CheckboxField path="option3" label="Enable Feature C" />
</FieldGroup>
```

### InlineFieldGroup (Flex)
```jsx
{/* Flexible inline layout that wraps */}
<InlineFieldGroup size="small" align="center">
  <TextField path="search" label="Search" />
  <SelectField path="category" label="Category" options={categories} />
  <ButtonField>Filter</ButtonField>
  <ButtonField>Clear</ButtonField>
</InlineFieldGroup>
```

## Card Layouts

### FieldCard
```jsx
<FieldCard title="Contact Information" size="small">
  <ResponsiveFieldRow layout="twoColumn">
    <TextField path="email" label="Email" />
    <TextField path="phone" label="Phone" />
  </ResponsiveFieldRow>
</FieldCard>

<FieldCard 
  title="Advanced Settings" 
  extra={<Button size="small">Reset</Button>}
  bordered={false}
>
  <FieldGroup direction="vertical">
    <CheckboxField path="enableLogging" label="Enable Logging" />
    <CheckboxField path="enableCache" label="Enable Cache" />
  </FieldGroup>
</FieldCard>
```

### FormSection with Card
```jsx
<FormSection title="Project Configuration" bordered size="small">
  <ResponsiveFieldRow layout="twoColumn">
    <TextField path="name" label="Project Name" />
    <NumberField path="capacity" label="Capacity (MW)" />
  </ResponsiveFieldRow>
  <FormDivider />
  <ResponsiveFieldRow layout="threeColumn">
    <SelectField path="turbineModel" label="Turbine Model" options={models} />
    <NumberField path="turbineCount" label="Number of Turbines" />
    <NumberField path="hubHeight" label="Hub Height (m)" />
  </ResponsiveFieldRow>
</FormSection>
```

## Complex Layout Examples

### Mixed Layout Form
```jsx
<Form layout="vertical">
  <FormSection title="Basic Information">
    <ResponsiveFieldRow layout="twoColumn">
      <TextField path="name" label="Name" required />
      <TextField path="email" label="Email" required />
    </ResponsiveFieldRow>
    
    <FormRow gutter={[16, 16]}>
      <FormCol xs={24} sm={24} md={16}>
        <TextField path="address" label="Address" />
      </FormCol>
      <FormCol xs={24} sm={12} md={4}>
        <TextField path="zip" label="ZIP" />
      </FormCol>
      <FormCol xs={24} sm={12} md={4}>
        <SelectField path="country" label="Country" options={countries} />
      </FormCol>
    </FormRow>
  </FormSection>
  
  <FormDivider />
  
  <FormSection title="Preferences" bordered>
    <FieldGroup direction="vertical" size="middle">
      <InlineFieldGroup>
        <CheckboxField path="notifications" label="Email Notifications" />
        <CheckboxField path="newsletter" label="Newsletter" />
      </InlineFieldGroup>
      
      <CompactFieldGroup>
        <SelectField path="language" label="Language" options={languages} />
        <SelectField path="timezone" label="Timezone" options={timezones} />
      </CompactFieldGroup>
    </FieldGroup>
  </FormSection>
</Form>
```

## Migration from CompactFieldGroup

### Before (Old CompactFieldGroup)
```jsx
// Old approach - no longer available
<CompactFieldGroup spacing="tight">
  <Field1 />
  <Field2 />
</CompactFieldGroup>
```

### After (New Ant Design Patterns)
```jsx
// Compact with no spacing
<CompactFieldGroup>
  <Field1 />
  <Field2 />
</CompactFieldGroup>

// Compact with small spacing
<FieldGroup direction="horizontal" size="small">
  <Field1 />
  <Field2 />
</FieldGroup>

// Responsive layout
<ResponsiveFieldRow layout="twoColumn">
  <Field1 />
  <Field2 />
</ResponsiveFieldRow>

// Custom responsive
<FormRow gutter={[8, 8]}>
  <FormCol xs={24} sm={12}><Field1 /></FormCol>
  <FormCol xs={24} sm={12}><Field2 /></FormCol>
</FormRow>
```

## Best Practices

1. **Use ResponsiveFieldRow for common layouts** - It handles responsive breakpoints automatically
2. **Use CompactFieldGroup for truly compact layouts** - When you need no spacing between fields
3. **Use FieldGroup for related fields** - When fields are logically grouped
4. **Use FormRow/FormCol for custom layouts** - When you need precise control over responsive behavior
5. **Use FieldCard for section organization** - When you want visual separation between form sections
6. **Consider mobile-first design** - Start with xs breakpoint and work up
7. **Test with debug borders** - Set REACT_APP_DEBUG_FORM_BORDERS=true to visualize layout

## Debug Mode

Set `REACT_APP_DEBUG_FORM_BORDERS=true` in your environment to see layout boundaries:

```bash
REACT_APP_DEBUG_FORM_BORDERS=true npm start
```

This will show colored borders around all layout components to help with debugging responsive behavior.