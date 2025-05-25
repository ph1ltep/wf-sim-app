# Context Field Layout Components Reference

## Overview

The layout components provide a consistent, responsive design system for organizing form fields with automatic metric calculation support. All components support debug borders via REACT_APP_DEBUG_FORM_BORDERS=true and can integrate with the automatic metrics system.

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
Replaces
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

## Automatic Metrics Integration

Layout components work seamlessly with the automatic metrics system through field-level affectedMetrics declarations:

### Field-Level Metric Declarations
```jsx
<FormSection title="Wind Farm Configuration">
  <ResponsiveFieldRow layout="threeColumn">
    <NumberField 
      path={['settings', 'project', 'windFarm', 'numWTGs']}
      label="Number of WTGs"
      affectedMetrics={['totalMW', 'grossAEP', 'netAEP', 'componentQuantities']}
    />
    <NumberField 
      path={['settings', 'project', 'windFarm', 'mwPerWTG']}
      label="MW per WTG"
      affectedMetrics={['totalMW', 'grossAEP', 'netAEP']}
    />
    <SelectField 
      path={['settings', 'project', 'windFarm', 'wtgPlatformType']}
      label="Platform Type"
      affectedMetrics={['componentQuantities']}
    />
  </ResponsiveFieldRow>
</FormSection>
```

### Organized Metric Groups
```jsx
<FormSection title="Financing Parameters">
  <CompactFieldGroup direction="vertical" size="middle">
    <PercentageField
      path={['settings', 'modules', 'financing', 'debtRatio']}
      label="Debt Ratio"
      affectedMetrics={['wacc', 'debtToEquityRatio']}
    />
    <PercentageField
      path={['settings', 'modules', 'financing', 'costOfEquity']}
      label="Cost of Equity"
      affectedMetrics={['wacc']}
    />
    <PercentageField
      path={['settings', 'modules', 'financing', 'effectiveTaxRate']}
      label="Tax Rate"
      affectedMetrics={['wacc']}
    />
  </CompactFieldGroup>
</FormSection>
```

### Mixed Metric Dependencies
```jsx
<FormSection title="Project Parameters">
  <ResponsiveFieldRow layout="twoColumn">
    {/* Wind farm metrics */}
    <NumberField 
      path={['settings', 'project', 'windFarm', 'capacityFactor']}
      label="Capacity Factor"
      affectedMetrics={['grossAEP', 'netAEP']}
    />
    {/* Financing metrics */}
    <PercentageField
      path={['settings', 'modules', 'financing', 'debtRatio']}
      label="Debt Ratio"
      affectedMetrics={['wacc']}
    />
  </ResponsiveFieldRow>
</FormSection>
```

## Component Hierarchy & Nesting Rules

FormSection (root organization)
```
├── ResponsiveFieldRow (quick layouts)
│   └── [form fields with affectedMetrics]
├── FormRow (manual grid control)
│   └── FormCol
│       ├── FieldGroup (related field grouping)
│       ├── CompactFieldGroup (connected inputs)  
│       ├── InlineFieldGroup (mixed content)
│       └── [form fields with affectedMetrics]
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

## Common Layout Patterns with Metrics

### WACC Calculation Section
```jsx 
<FormSection title="WACC Parameters">
  <ResponsiveFieldRow layout="twoColumn">
    <PercentageField
      path={['settings', 'modules', 'financing', 'debtRatio']}
      label="Debt Ratio"
      affectedMetrics={['wacc', 'debtToEquityRatio']}
    />
    <PercentageField
      path={['settings', 'modules', 'financing', 'costOfEquity']}
      label="Cost of Equity"
      affectedMetrics={['wacc']}
    />
  </ResponsiveFieldRow>
  
  <ResponsiveFieldRow layout="twoColumn">
    <PercentageField
      path={['settings', 'modules', 'financing', 'costOfOperationalDebt']}
      label="Cost of Debt"
      affectedMetrics={['wacc']}
    />
    <PercentageField
      path={['settings', 'modules', 'financing', 'effectiveTaxRate']}
      label="Tax Rate"
      affectedMetrics={['wacc']}
    />
  </ResponsiveFieldRow>
</FormSection>
```

### Project Capacity Configuration
```jsx 
<FormSection title="Wind Farm Specifications">
  <ResponsiveFieldRow layout="threeColumn"> 
    <NumberField 
      path={['settings', 'project', 'windFarm', 'numWTGs']}
      label="Number of WTGs"
      affectedMetrics={['totalMW', 'grossAEP', 'netAEP', 'componentQuantities']}
    />
    <NumberField 
      path={['settings', 'project', 'windFarm', 'mwPerWTG']}
      label="MW per WTG"
      affectedMetrics={['totalMW', 'grossAEP', 'netAEP']}
    />
    <SelectField 
      path={['settings', 'project', 'windFarm', 'wtgPlatformType']}
      label="Platform Type"
      options={platformOptions}
      affectedMetrics={['componentQuantities']}
    />
  </ResponsiveFieldRow>
</FormSection>
```

### Energy Production Factors
```jsx
<FormSection title="Energy Production">
  <ResponsiveFieldRow layout="oneColumn">
    <NumberField 
      path={['settings', 'project', 'windFarm', 'capacityFactor']}
      label="Capacity Factor (%)"
      affectedMetrics={['grossAEP', 'netAEP']}
    />
  </ResponsiveFieldRow>
  
  <ResponsiveFieldRow layout="twoColumn">
    <PercentageField
      path={['settings', 'project', 'windFarm', 'curtailmentLosses']}
      label="Curtailment Losses"
      affectedMetrics={['netAEP']}
    />
    <PercentageField
      path={['settings', 'project', 'windFarm', 'electricalLosses']}
      label="Electrical Losses"
      affectedMetrics={['netAEP']}
    />
  </ResponsiveFieldRow>
</FormSection>
```

### Compact Financial Parameters
```jsx
<FieldCard title="Financial Rates" size="small">
  <CompactFieldGroup direction="vertical" size="middle">
    <PercentageField
      path={['settings', 'modules', 'financing', 'costOfConstructionDebt']}
      label="Construction Debt Rate"
      precision={2}
    />
    <PercentageField
      path={['settings', 'modules', 'financing', 'costOfOperationalDebt']}
      label="Operational Debt Rate"
      affectedMetrics={['wacc']}
      precision={2}
    />
    <PercentageField
      path={['settings', 'modules', 'financing', 'costOfEquity']}
      label="Cost of Equity"
      affectedMetrics={['wacc']}
      precision={2}
    />
  </CompactFieldGroup>
</FieldCard>
```

### Form Mode with Layout Organization
```jsx
<ContextForm 
  path={['settings', 'modules', 'financing']}
  affectedMetrics={['wacc', 'debtToEquityRatio']}
>
  <FormSection title="Debt Parameters">
    <ResponsiveFieldRow layout="twoColumn">
      <PercentageField path="debtRatio" label="Debt Ratio" />
      <PercentageField path="costOfOperationalDebt" label="Cost of Debt" />
    </ResponsiveFieldRow>
  </FormSection>
  
  <FormDivider margin="default" />
  
  <FormSection title="Equity & Tax">
    <ResponsiveFieldRow layout="twoColumn">
      <PercentageField path="costOfEquity" label="Cost of Equity" />
      <PercentageField path="effectiveTaxRate" label="Tax Rate" />
    </ResponsiveFieldRow>
  </FormSection>
</ContextForm>
```

## Best Practices with Metrics

1. Group related metrics - Use FormSection to organize fields that affect the same metrics
2. Use appropriate layouts - ResponsiveFieldRow for most cases, custom FormRow/FormCol for special needs
3. Declare metrics consistently - Field-level for immediate feedback, form-level for batch calculations
4. Test responsive behavior - Always verify layouts work on mobile devices with metric calculations
5. Enable debug borders during development - Set REACT_APP_DEBUG_FORM_BORDERS=true
6. Consider metric performance - Group fields that affect expensive calculations
7. Provide visual feedback - Use cards or sections to highlight metric-affecting areas