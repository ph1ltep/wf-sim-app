// src/components/modules/Contracts/ContractFormHookForm.jsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { InputNumber, Select, Switch, Space, Button, Form, Input } from 'antd';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';

// Validation schema
const contractSchema = yup.object({
  name: yup.string().required('Contract name is required'),
  years: yup.array().of(yup.number()).min(1, 'Select at least one year'),
  fixedFee: yup.number().required('Fixed fee is required').min(0, 'Fixed fee must be positive'),
  isPerTurbine: yup.boolean(),
  oemScopeId: yup.string().required('OEM scope is required')
}).required();

const ContractForm = ({ 
  defaultValues = {},
  oemScopes = [],
  onSubmit,
  onCancel,
  isLoading = false,
  formType = 'add'
}) => {
  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch 
  } = useForm({
    resolver: yupResolver(contractSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      years: defaultValues?.years || [1, 2, 3, 4, 5],
      fixedFee: defaultValues?.fixedFee || 100000,
      isPerTurbine: defaultValues?.isPerTurbine !== undefined ? defaultValues.isPerTurbine : true,
      oemScopeId: defaultValues?.oemScopeId || undefined
    }
  });

  // Watch the years field to enable the add year range button
  const years = watch('years') || [];

  // Add a year range to the years field
  const addYearRange = () => {
    // Find the max year if it exists
    let nextYear = 1;
    if (years.length > 0) {
      nextYear = Math.max(...years) + 1;
    }
    
    // Add the next 5 years
    const newYears = [...years];
    for (let i = 0; i < 5; i++) {
      if (!newYears.includes(nextYear + i)) {
        newYears.push(nextYear + i);
      }
    }
    
    // Sort years
    newYears.sort((a, b) => a - b);
    setValue('years', newYears);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ marginBottom: 16 }}>
        <Form.Item 
          label="Contract Name" 
          validateStatus={errors.name ? 'error' : ''} 
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => <Input {...field} placeholder="e.g., Basic OEM Contract (Years 1-5)" />}
          />
        </Form.Item>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Form.Item 
          label="Years Covered" 
          validateStatus={errors.years ? 'error' : ''} 
          help={errors.years?.message}
        >
          <Controller
            name="years"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                mode="multiple"
                placeholder="Select years covered by contract"
                style={{ width: '100%' }}
                options={Array.from({ length: 30 }, (_, i) => ({ 
                  label: `Year ${i + 1}`, 
                  value: i + 1 
                }))}
              />
            )}
          />
        </Form.Item>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button 
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addYearRange}
        >
          Add 5 Year Range
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex' }}>
        <div style={{ flex: 3, marginRight: 16 }}>
          <Form.Item 
            label="Fixed Fee" 
            validateStatus={errors.fixedFee ? 'error' : ''} 
            help={errors.fixedFee?.message}
          >
            <Controller
              name="fixedFee"
              control={control}
              render={({ field }) => (
                <InputNumber 
                  {...field}
                  min={0} 
                  step={1000} 
                  style={{ width: '100%' }}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              )}
            />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item label="Per Turbine">
            <Controller
              name="isPerTurbine"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch 
                  checked={value} 
                  onChange={onChange}
                />
              )}
            />
          </Form.Item>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Form.Item 
          label="OEM Scope" 
          validateStatus={errors.oemScopeId ? 'error' : ''} 
          help={errors.oemScopeId?.message}
        >
          <Controller
            name="oemScopeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select an OEM scope"
                optionFilterProp="children"
                showSearch
                style={{ width: '100%' }}
              >
                {oemScopes.map(scope => (
                  <Select.Option key={scope.id} value={scope.id}>{scope.name}</Select.Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>
      </div>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {formType === 'add' ? 'Add Contract' : 'Update Contract'}
          </Button>
        </Space>
      </div>
    </form>
  );
};

export default ContractForm;