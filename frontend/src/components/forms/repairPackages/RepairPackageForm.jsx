// frontend/src/components/forms/repairPackages/RepairPackageForm.jsx
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Switch, Collapse } from 'antd';
// TODO: Replace TextArea with proper distribution field component when available

// Import Context Field Layout components for visual consistency
import {
  FormSection,
  ResponsiveFieldRow
} from 'components/contextFields';

const { Option } = Select;
const { TextArea } = Input;

// Repair package categories
const REPAIR_PACKAGE_CATEGORIES = [
  { value: 'major', label: 'Major (Heavy lift, major components)' },
  { value: 'medium', label: 'Medium (Medium complexity)' },
  { value: 'minor', label: 'Minor (Light mechanical)' },
  { value: 'electronic', label: 'Electronic (No crane required)' },
  { value: 'blade', label: 'Blade (Blade work package)' }
];

// Crane types
const CRANE_TYPES = [
  { value: 'none', label: 'No Crane Required' },
  { value: 'mobile', label: 'Mobile Crane' },
  { value: 'crawler', label: 'Crawler Crane (Heavy lift)' },
  { value: 'tower', label: 'Tower Crane (Blade work)' },
  { value: 'special', label: 'Special Equipment' }
];


/**
 * Component for repair package form input fields
 * @param {Object} form - Antd form instance
 * @param {Object} initialValues - Initial form values
 * @returns {JSX.Element} RepairPackageForm component
 */
const RepairPackageForm = ({ form, initialValues = {} }) => {
  // Set form values when initialValues changes
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      form.setFieldsValue({
        ...initialValues,
        // Ensure nested objects are properly set
        costs: {
          material: { perEventEUR: 0, perDayEUR: 0, ...initialValues.costs?.material },
          labor: { perEventEUR: 0, perDayEUR: 0, ...initialValues.costs?.labor },
          tooling: { perEventEUR: 0, perDayEUR: 0, ...initialValues.costs?.tooling },
          crane: { perEventEUR: 0, perDayEUR: 0, ...initialValues.costs?.crane },
          other: { perEventEUR: 0, perDayEUR: 0, ...initialValues.costs?.other },
          ...initialValues.costs
        },
        baseDurationDays: initialValues.baseDurationDays || 1,
        crane: {
          type: 'none',
          minimumDays: 0,
          ...initialValues.crane
        },
        appliesTo: {
          componentCategories: [],
          ...initialValues.appliesTo
        }
      });
    } else {
      // Set default values for new entries
      form.setFieldsValue({
        costs: {
          material: { perEventEUR: 0, perDayEUR: 0 },
          labor: { perEventEUR: 0, perDayEUR: 0 },
          tooling: { perEventEUR: 0, perDayEUR: 0 },
          crane: { perEventEUR: 0, perDayEUR: 0 },
          other: { perEventEUR: 0, perDayEUR: 0 }
        },
        baseDurationDays: 1,
        crane: {
          type: 'none',
          minimumDays: 0
        },
        appliesTo: {
          componentCategories: []
        },
        isDefault: false,
        isActive: true
      });
    }
  }, [form, initialValues]);

  // Watch cost values to determine which sections should be expanded
  const costValues = Form.useWatch('costs', form) || {};
  const craneValues = Form.useWatch('crane', form) || {};

  // Helper to determine if a cost category should be expanded
  const shouldExpandCategory = (category) => {
    const categoryData = costValues[category];
    if (!categoryData) return false;
    return (categoryData.perEventEUR > 0) || (categoryData.perDayEUR > 0);
  };

  // Determine which panels should be expanded by default
  const getDefaultExpandedPanels = () => {
    const expanded = [];
    ['material', 'labor', 'tooling', 'crane', 'other'].forEach(category => {
      if (shouldExpandCategory(category)) {
        expanded.push(category);
      }
    });
    // Also expand crane if it has type other than 'none'
    if (craneValues.type && craneValues.type !== 'none') {
      if (!expanded.includes('crane')) expanded.push('crane');
    }
    return expanded;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      scrollToFirstError
    >
      <FormSection title="Basic Information" level={5}>
        <ResponsiveFieldRow layout="oneColumn">
          <Form.Item
            name="name"
            label="Repair Package Name"
            rules={[
              { required: true, message: 'Please enter repair package name' },
              { max: 100, message: 'Name must not exceed 100 characters' }
            ]}
          >
            <Input placeholder="e.g., Gearbox Replacement - Heavy Lift" />
          </Form.Item>
        </ResponsiveFieldRow>

        <ResponsiveFieldRow layout="oneColumn">
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please enter description' },
              { max: 500, message: 'Description must not exceed 500 characters' }
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder="Detailed description of the repair package including scope and requirements"
            />
          </Form.Item>
        </ResponsiveFieldRow>

        <ResponsiveFieldRow layout="twoColumn">
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select repair category">
              {REPAIR_PACKAGE_CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="baseDurationDays"
            label="Base Duration (Days)"
            rules={[
              { required: true, message: 'Please enter base duration' },
              { type: 'number', min: 0, max: 365, message: 'Duration must be between 0 and 365 days' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={365}
              step={1}
              placeholder="1"
            />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>

      <FormSection title="Cost Categories" level={5}>
        <Collapse
          defaultActiveKey={getDefaultExpandedPanels()}
          items={[
            {
              key: 'material',
              label: 'Material Costs',
              children: (
                <ResponsiveFieldRow layout="twoColumn">
                  <Form.Item
                    name={['costs', 'material', 'perEventEUR']}
                    label="Per-Event Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1000}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name={['costs', 'material', 'perDayEUR']}
                    label="Per-Day Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                </ResponsiveFieldRow>
              )
            },
            {
              key: 'labor',
              label: 'Labor Costs',
              children: (
                <ResponsiveFieldRow layout="twoColumn">
                  <Form.Item
                    name={['costs', 'labor', 'perEventEUR']}
                    label="Per-Event Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1000}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name={['costs', 'labor', 'perDayEUR']}
                    label="Per-Day Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                </ResponsiveFieldRow>
              )
            },
            {
              key: 'tooling',
              label: 'Tooling Costs',
              children: (
                <ResponsiveFieldRow layout="twoColumn">
                  <Form.Item
                    name={['costs', 'tooling', 'perEventEUR']}
                    label="Per-Event Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1000}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name={['costs', 'tooling', 'perDayEUR']}
                    label="Per-Day Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                </ResponsiveFieldRow>
              )
            },
            {
              key: 'crane',
              label: 'Crane Costs & Configuration',
              children: (
                <div>
                  <ResponsiveFieldRow layout="twoColumn">
                    <Form.Item
                      name={['costs', 'crane', 'perEventEUR']}
                      label="Per-Event Cost (EUR)"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={1000}
                        formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/€\s?|(,*)/g, '')}
                        placeholder="0"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      name={['costs', 'crane', 'perDayEUR']}
                      label="Per-Day Cost (EUR)"
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        step={100}
                        formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/€\s?|(,*)/g, '')}
                        placeholder="0"
                      />
                    </Form.Item>
                  </ResponsiveFieldRow>
                  
                  <ResponsiveFieldRow layout="twoColumn">
                    <Form.Item
                      name={['crane', 'type']}
                      label="Crane Type"
                    >
                      <Select placeholder="Select crane type">
                        {CRANE_TYPES.map(type => (
                          <Option key={type.value} value={type.value}>
                            {type.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name={['crane', 'minimumDays']}
                      label="Minimum Crane Days"
                      rules={[
                        { type: 'number', min: 0, max: 365, message: 'Days must be between 0 and 365' }
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        max={365}
                        step={1}
                        placeholder="0"
                      />
                    </Form.Item>
                  </ResponsiveFieldRow>
                </div>
              )
            },
            {
              key: 'other',
              label: 'Other Costs',
              children: (
                <ResponsiveFieldRow layout="twoColumn">
                  <Form.Item
                    name={['costs', 'other', 'perEventEUR']}
                    label="Per-Event Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1000}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name={['costs', 'other', 'perDayEUR']}
                    label="Per-Day Cost (EUR)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={100}
                      formatter={value => `€ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/€\s?|(,*)/g, '')}
                      placeholder="0"
                    />
                  </Form.Item>
                </ResponsiveFieldRow>
              )
            }
          ]}
        />
      </FormSection>


      <FormSection title="Applicability" level={5}>
        <ResponsiveFieldRow layout="oneColumn">
          <Form.Item
            name={['appliesTo', 'componentCategories']}
            label="Component Categories"
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Enter component categories (e.g., gearbox, generator)"
              tokenSeparators={[',']}
            />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>

      <FormSection title="Status" level={5}>
        <ResponsiveFieldRow layout="twoColumn">
          <Form.Item
            name="isDefault"
            label="Default Package"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </ResponsiveFieldRow>
      </FormSection>
    </Form>
  );
};

export default RepairPackageForm;