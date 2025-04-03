// src/components/config/OEMScopes.jsx
import React from 'react';
import { Typography, Card, Button } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

// Custom hook for OEM scopes data management
import useOEMScopes from '../../hooks/useOEMScopes';

// Component imports
import DatabaseTable from '../tables/DatabaseTable';
import OEMScopeForm from './oemScopes/OEMScopeForm';
import OEMScopeDetails from './oemScopes/OEMScopeDetails';
import OEMScopeTag from './oemScopes/OEMScopeTag';
import { oemScopeColumns } from '../tables/columns';
import { renderScopeTags } from '../../utils/oemScopeUtils';

const { Title } = Typography;

const OEMScopes = () => {
  // Use the custom hook for OEM scopes data and operations
  const { 
    oemScopes, 
    loading, 
    createScope,
    updateScope,
    deleteScope,
    generateName
  } = useOEMScopes();
  
  // Render the OEM scope form for create/edit
  const renderOEMScopeForm = (form, record) => {
    return (
      <OEMScopeForm
        form={form}
        initialValues={record || {}}
        onGenerateName={() => handleGenerateName(form)}
        generateNameLoading={loading}
      />
    );
  };
  
  // Handle generating a name based on form values
  const handleGenerateName = async (form) => {
    const values = form.getFieldsValue();
    const result = await generateName(values);
    if (result.success) {
      form.setFieldsValue({ name: result.name });
    }
  };
  
  // Custom tag renderer for OEM scope tags
  const tagRenderer = (tag) => (
    <OEMScopeTag 
      key={tag.id} 
      color={tag.color}
    >
      {tag.content}
    </OEMScopeTag>
  );
  
  // Custom render function for expandable rows
  const expandedRowRender = (record) => <OEMScopeDetails record={record} />;

  return (
    <div>
      <Title level={2}>OEM Scope Definitions</Title>
      <p>Manage OEM scope definitions for wind farm maintenance contracts.</p>
      
      <Card 
        title={
          <span>
            <ToolOutlined style={{ marginRight: 8 }} />
            OEM Scope Definitions
          </span>
        }
        style={{ marginBottom: 24 }}
      >
        <DatabaseTable
          columns={oemScopeColumns(tagRenderer)}
          dataSource={oemScopes}
          rowKey="key"
          loading={loading}
          entityName="OEM Scope"
          onCreate={createScope}
          onUpdate={updateScope}
          onDelete={deleteScope}
          renderForm={renderOEMScopeForm}
          pagination={{ pageSize: 10 }}
          addActions={true}
          expandable={{
            expandedRowRender,
          }}
        />
      </Card>
    </div>
  );
};

export default OEMScopes;