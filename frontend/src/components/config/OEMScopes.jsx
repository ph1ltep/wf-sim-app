// src/components/config/OEMScopes.jsx
import React from 'react';
import { Typography, Card, Alert, Button } from 'antd';
import { ToolOutlined, ReloadOutlined } from '@ant-design/icons';

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
  // Use the custom hook for OEM scopes data management
  const { 
    oemScopes, 
    loading, 
    error,
    fetchScopes,
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
  
  // Header extra content with refresh button
  const headerExtra = (
    <Button 
      icon={<ReloadOutlined />} 
      onClick={fetchScopes}
      loading={loading}
    >
      Refresh
    </Button>
  );

  return (
    <div>
      <Title level={2}>OEM Scope Definitions</Title>
      <p>Manage OEM scope definitions for wind farm maintenance contracts.</p>
      
      {error && (
        <Alert
          message="Error Loading OEM Scopes"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      
      <Card 
        title={
          <span>
            <ToolOutlined style={{ marginRight: 8 }} />
            OEM Scope Definitions
          </span>
        }
        extra={headerExtra}
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
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `Total ${total} OEM scopes`
          }}
          addActions={true}
          expandable={{
            expandedRowRender: (record) => <OEMScopeDetails record={record} />,
          }}
        />
      </Card>
    </div>
  );
};

export default OEMScopes;