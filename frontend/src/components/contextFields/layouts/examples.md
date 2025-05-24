# Context Field Layout Components Reference

## Overview

The layout components provide a consistent, responsive design system for organizing form fields. All components support debug borders via REACT_APP_DEBUG_FORM_BORDERS=true.

## Core Layout Components

### FormSection
Purpose: Top-level content organization with optional titles and actions
Replaces: Manual div containers with titles
Nesting: Root level or within other FormSections

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| title | string | - | Section title |
| level | number | 1-6 / 4 | Title heading level |
| extra | ReactNode | - | Additional content (buttons, etc.) |
| bordered | boolean | true/false / false | Wrap in Card component |
| size | string | default, small / default | Card size when bordered |
| style | object | - | Custom CSS styles |

### FormRow
Purpose: Horizontal field arrangement with grid control
Replaces: Ant Design Row component
Nesting: Inside FormSection, FieldCard; contains FormCol

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| gutter | number/array | Any / [16, 16] | Spacing between columns [horizontal, vertical] |
| align | string | top, middle, bottom / top | Vertical alignment |
| justify | string | start, end, center, space-around, space-between / start | Horizontal alignment |
| wrap | boolean | true/false / true | Allow column wrapping |

### FormCol
Purpose: Individual column within a row with responsive breakpoints
Replaces: Ant Design Col component
Nesting: Inside FormRow only; contains form fields

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| span | number | 1-24 / 24 | Column width (24 = full width) |
| xs | number/object | 1-24 or {span, offset} | Extra small devices (<576px) |
| sm | number/object | 1-24 or {span, offset} | Small devices (≥576px) |
| md | number/object | 1-24 or {span, offset} | Medium devices (≥768px) |
| lg | number/object | 1-24 or {span, offset} | Large devices (≥992px) |
| xl | number/object | 1-24 or {span, offset} | Extra large devices (≥1200px) |
| xxl | number/object | 1-24 or {span, offset} | Extra extra large devices (≥1600px) |
| flex | string/number | CSS flex values | Flex layout |
| offset | number | 0-23 | Column offset |

## Convenience Layout Components

### ResponsiveFieldRow
Purpose: Quick responsive layouts without manual breakpoint management
Replaces: FormRow + FormCol combinations for common patterns
Nesting: Inside FormSection, FieldCard; contains form fields directly

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| layout | string | oneColumn, twoColumn, threeColumn, fourColumn, auto / twoColumn | Predefined responsive layout |
| gutter | number/array | Any / [16, 16] | Spacing between columns |

Layout Breakpoints:
- oneColumn: 24 span at all sizes
- twoColumn: 24/24/12/12/12/12 (xs/sm/md/lg/xl/xxl)
- threeColumn: 24/24/12/8/8/8
- fourColumn: 24/12/12/6/6/6
- auto: 24/auto/auto/auto/auto/auto

## Specialized Field Grouping Components

### FieldGroup
Purpose: Vertical or horizontal grouping of related fields with consistent spacing
Replaces: Manual spacing between related form fields
Nesting: Inside FormSection, FieldCard, FormCol; contains form fields

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| direction | string | vertical, horizontal / vertical | Layout direction |
| size | string/number | small, middle, large, or px value / middle | Spacing between items |
| align | string | start, end, center, baseline | Cross-axis alignment |
| wrap | boolean | true/false / true | Allow wrapping |
| split | ReactNode | - | Separator element between items |

### CompactFieldGroup
Purpose: Fields that should be visually connected with no spacing (like input groups)
Replaces: Ant Design Space.Compact or manual CSS for connected inputs
Nesting: Inside FormSection, FieldCard, FormCol; contains form fields

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| direction | string | horizontal, vertical / horizontal | Layout direction |
| size | string | small, middle, large / small | Spacing size |

### InlineFieldGroup
Purpose: Flexible inline layout for mixed content (fields + buttons)
Replaces: Manual flexbox layouts for toolbars or action rows
Nesting: Inside FormSection, FieldCard, FormCol; contains fields and other elements

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| size | string/number | small, middle, large, or px value / small | Gap between items |
| align | string | stretch, start, end, center, baseline / center | Cross-axis alignment |

## Visual Organization Components

### FieldCard
Purpose: Visually distinct section with card styling and optional header.
Replaces: FormSection when you need visual separation/emphasis
Nesting: Inside FormSection or at root level; contains other layout components

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| title | string | - | Card title |
| extra | ReactNode | - | Additional content in card header |
| size | string | default, small / default | Card size |
| bordered | boolean | true/false / true | Show card border |

### FormDivider
Purpose: Visual separation between form sections
Replaces: Ant Design Divider with consistent margins
Nesting: Inside FormSection, FieldCard; standalone element

| Prop | Type | Options/Default | Description |
|------|------|-----------------|-------------|
| margin | string | small, default, large, none / default | Vertical margin (8px/16px/32px/0px) |
| orientation | string | left, right, center / left | Text alignment |
| orientationMargin | string/number | CSS margin values | Distance between line and text |
| dashed | boolean | true/false / false | Dashed line style |
| plain | boolean | true/false / false | Plain text style |

## Component Hierarchy & Nesting Rules


FormSection (root organization)
```
├── ResponsiveFieldRow (quick layouts)
│   └── [form fields directly]
├── FormRow (manual grid control)
│   └── FormCol
│       ├── FieldGroup (related field grouping)
│       ├── CompactFieldGroup (connected inputs)  
│       ├── InlineFieldGroup (mixed content)
│       └── [form fields]
├── FieldCard (visual emphasis)
│   └── [any layout components + fields]
└── FormDivider (separation)
```

## When to Use Each Component

| Component | Use When | Don't Use When |
|-----------|----------|----------------|
| FormSection | Top-level organization, logical grouping | Simple single-field layouts |
| ResponsiveFieldRow | Common 2-4 column layouts | Complex custom responsive needs |
| FormRow/FormCol | Custom responsive behavior needed | Simple equal-width columns |
| FieldGroup | Related checkboxes, radio buttons, similar fields | Unrelated fields, complex layouts |
| CompactFieldGroup | Country code + phone, prefix + input | Regular field spacing needed |
| InlineFieldGroup | Search bars, toolbars, action rows | Vertical field organization |
| FieldCard | Distinct sections, optional/advanced settings | Basic content organization |

## Common Layout Patterns

### FormSection
Basic section with title and content organization:
```jsx 
<FormSection title="Project Settings" extra={<Button>Reset</Button>}> 
  <TextField path="name" label="Project Name" />
  <NumberField path="capacity" label="Capacity (MW)" /> 
</FormSection>

```

### FormRow and FormCol
Manual grid control with responsive breakpoints:
```jsx 
<FormRow gutter={[16, 16]}> 
  <FormCol xs={24} sm={12} md={8}> 
    <TextField path="firstName" label="First Name" /> 
  </FormCol>
  <FormCol xs={24} sm={12} md={8}> 
    <TextField path="lastName" label="Last Name" /> 
  </FormCol>
  <FormCol xs={24} sm={24} md={8}>
    <TextField path="email" label="Email" /> 
  </FormCol> 
</FormRow> 
```

### ResponsiveFieldRow
Preset responsive layouts for common patterns:
```jsx 
<ResponsiveFieldRow layout="twoColumn"> 
  <TextField path="firstName" label="First Name" /> 
  <TextField path="lastName" label="Last Name" /> 
</ResponsiveFieldRow>
```

### CompactFieldGroup
No spacing between fields (connected inputs):
```jsx 
<CompactFieldGroup> 
  <SelectField path="countryCode" options={countryCodes} /> 
  <TextField path="phoneNumber" label="Phone Number" /> 
</CompactFieldGroup>
```

### FieldGroup
Consistent spacing between related fields:
```jsx
<FieldGroup direction="vertical" size="middle"> 
  <CheckboxField path="option1" label="Enable Feature A" /> 
  <CheckboxField path="option2" label="Enable Feature B" /> 
  <CheckboxField path="option3" label="Enable Feature C" /> 
</FieldGroup>
```

### InlineFieldGroup
Flexible inline layout that wraps:
```jsx 
<InlineFieldGroup size="small" align="center"> 
  <TextField path="search" label="Search" /> 
  <SelectField path="category" options={categories} /> 
  <Button>Filter</Button> 
  <Button>Clear</Button> 
</InlineFieldGroup>
```

### FieldCard
Card-based section grouping:
```jsx
<FieldCard title="Contact Information" size="small">
  <ResponsiveFieldRow layout="twoColumn">
    <TextField path="email" label="Email" />
    <TextField path="phone" label="Phone" />
  </ResponsiveFieldRow>
</FieldCard>
```

### FormDivider
Section separation with different margin options:
```jsx
<FormDivider margin="large" orientation="left">Advanced Settings</FormDivider>
```

## Complex Layout Example

Here's a comprehensive example showing proper nesting and component usage:

```jsx
<Form layout="vertical">
  {/* Root organization */}
  <FormSection title="Project Configuration">
    {/* Quick responsive layout for basic info */}
    <ResponsiveFieldRow layout="twoColumn">
      <TextField path="name" label="Project Name" required />
      <TextField path="code" label="Project Code" />
    </ResponsiveFieldRow>
    
    <TextAreaField path="description" label="Description" rows={3} />
    
    {/* Visual separation */}
    <FormDivider margin="default" orientation="left">Location & Contact</FormDivider>
    
    {/* Custom responsive layout for complex address */}
    <FormRow gutter={[16, 16]}>
      <FormCol xs={24} sm={24} md={16}>
        <TextField path="address" label="Address" />
      </FormCol>
      <FormCol xs={24} sm={12} md={4}>
        <TextField path="zip" label="ZIP" />
      </FormCol>
      <FormCol xs={24} sm={12} md={4}>
        <SelectField path="country" options={countries} />
      </FormCol>
    </FormRow>
    
    {/* Connected input group */}
    <CompactFieldGroup>
      <SelectField path="countryCode" options={countryCodes} style={{ width: 100 }} />
      <TextField path="phoneNumber" label="Phone Number" />
    </CompactFieldGroup>
  </FormSection>
  
  {/* Another root section */}
  <FormSection title="Technical Specifications">
    <ResponsiveFieldRow layout="threeColumn">
      <NumberField path="capacity" label="Capacity (MW)" />
      <NumberField path="turbineCount" label="Number of Turbines" />
      <NumberField path="hubHeight" label="Hub Height (m)" />
    </ResponsiveFieldRow>
    
    <FormDivider margin="small" />
    
    {/* Grouped related checkboxes */}
    <FieldGroup direction="vertical" size="small">
      <CheckboxField path="features.monitoring" label="Remote Monitoring" />
      <CheckboxField path="features.predictive" label="Predictive Maintenance" />
      <CheckboxField path="features.scada" label="SCADA Integration" />
    </FieldGroup>
  </FormSection>
  
  {/* Visually distinct card section */}
  <FieldCard 
    title="Financial Settings" 
    extra={<Button size="small">Calculate</Button>}
    size="small"
  >
    <ResponsiveFieldRow layout="twoColumn">
      <CurrencyField path="budget" label="Project Budget" />
      <PercentageField path="contingency" label="Contingency %" />
    </ResponsiveFieldRow>
    
    {/* Inline toolbar with mixed content */}
    <InlineFieldGroup align="center" style={{ marginTop: 16 }}>
      <TextField path="discountRate" label="Discount Rate" style={{ width: 120 }} />
      <Button type="primary">Run Analysis</Button>
      <Button>Reset</Button>
    </InlineFieldGroup>
  </FieldCard>
</Form>
```

## Best Practices

1. Start with FormSection - Use for top-level organization
2. Use ResponsiveFieldRow for common layouts - Saves manual breakpoint management
3. Use FormRow/FormCol for complex responsive needs - When presets don't fit
4. Group related fields with FieldGroup - Maintains logical and visual relationships
5. Use CompactFieldGroup sparingly - Only for truly connected inputs
6. Use FieldCard for emphasis - When sections need visual distinction
7. Test responsive behavior - Always verify layouts work on mobile devices
8. Enable debug borders during development - Set REACT_APP_DEBUG_FORM_BORDERS=true