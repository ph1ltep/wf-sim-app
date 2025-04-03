// src/components/modules/ContractsModule.jsx
import React, { useEffect, useState } from 'react';
import { Typography, Alert, Button, Space, Select, Tag, Tooltip, Empty } from 'antd';
import { PlusOutlined, ToolOutlined, CalendarOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import EditableTable from '../../components/tables/EditableTable';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  NumberField,
  CurrencyField,
  SelectField,
  SwitchField
} from '../contextFields';


const { Title, Text } = Typography;
const { Option } = Select;

const ContractsModule = () => {
  // Define base path for contracts module
  const basePath = ['settings', 'modules', 'contracts', 'oemContracts'];
  
  // Get scenario data and functions
  const { scenarioData, getValueByPath, getAllOEMScopes } = useScenario();
  
  // State for OEM scopes
  const [oemScopes, setOEMScopes] = useState([]);
  const [loadingScopes, setLoadingScopes] = useState(false);
  
  // Get project life for year options
  const projectLife = getValueByPath(['settings', 'general', 'projectLife'], 20);

  // Helper function to check if we have valid scenario
  const hasValidScenario = () => scenarioData && scenarioData.settings?.modules?.contracts;

  // Load OEM scopes
  useEffect(() => {
    const fetchOEMScopes = async () => {
      setLoadingScopes(true);
      try {
        const response = await getAllOEMScopes();
        if (response && response.success && response.data) {
          setOEMScopes(response.data);
        }
      } catch (error) {
        console.error('Error fetching OEM scopes:', error);
      } finally {
        setLoadingScopes(false);
      }
    };
    
    fetchOEMScopes();
  }, [getAllOEMScopes]);

  // Generate year options
  const yearOptions = Array.from({ length: projectLife }, (_, i) => ({
    value: i + 1,
    label: `Year ${i + 1}`
  }));

  // Define columns for the contracts table
  const contractColumns = [
    {
      title: 'Contract Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.oemScopeName}
          </Text>
        </Space>
      )
    },
    {
      title: 'Years Active',
      dataIndex: 'years',
      key: 'years',
      render: (years) => (
        <Space size={[0, 4]} wrap>
          {Array.isArray(years) && years.length > 0 ? (
            years.sort((a, b) => a - b).map(year => (
              <Tag key={year} color="blue">
                Year {year}
              </Tag>
            ))
          ) : (
            <Text type="secondary">No years assigned</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Fee Structure',
      key: 'fee',
      render: (_, record) => (
        <>
          <div>
            <Text strong>${record.fixedFee?.toLocaleString() || 0}</Text>
            {record.isPerTurbine && <Tag color="green" style={{ marginLeft: 8 }}>Per Turbine</Tag>}
          </div>
        </>
      )
    }
  ];

  // Define form fields for the contract form
  const contractFormFields = [
    <TextField
      path={['name']}
      label="Contract Name"
      required
    />,
    <SelectField
      path={['oemScopeId']}
      label="OEM Scope"
      tooltip="Select the OEM scope definition for this contract"
      options={oemScopes.map(scope => ({ value: scope._id, label: scope.name }))}
      loading={loadingScopes}
      required
    />,
    <SelectField
      path={['years']}
      label="Active Years"
      tooltip="Select the years this contract is active"
      mode="multiple"
      options={yearOptions}
      required
    />,
    <CurrencyField
      path={['fixedFee']}
      label="Fixed Fee"
      tooltip="Annual fixed fee for the contract"
      min={0}
      step={10000}
      required
    />,
    <SwitchField
      path={['isPerTurbine']}
      label="Fee is Per Turbine"
      tooltip="Whether the fee is applied per turbine or for the entire wind farm"
    />
  ];

  if (!hasValidScenario()) {
    return (
      <div>
        <Title level={2}>OEM Contracts</Title>
        <Alert 
          message="No Active Scenario" 
          description="Please create or load a scenario first." 
          type="warning" 
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>
        <ToolOutlined /> OEM Contracts
      </Title>
      <p>Configure operation and maintenance contracts and their time periods.</p>
      
      <FormSection 
        title="OEM Contract Configuration" 
        style={{ marginBottom: 24 }}
        extra={
          <Tooltip title="OEM scope definitions must be set up first">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              disabled={oemScopes.length === 0}
            >
              Add Contract
            </Button>
          </Tooltip>
        }
      >
        {oemScopes.length === 0 ? (
          <Alert
            message="No OEM Scopes Available"
            description="You need to define OEM scopes before creating contracts. Go to General Settings > OEM Scopes to create them."
            type="info"
            showIcon
          />
        ) : (
          <EditableTable
            columns={contractColumns}
            path={basePath}
            formFields={contractFormFields}
            keyField="id"
            itemName="OEM Contract"
            addButtonText="Add OEM Contract"
          />
        )}
        
        <Alert
          message="About OEM Contracts"
          description={
            <ul>
              <li>Each contract applies an OEM scope definition to specific project years</li>
              <li>Contracts can overlap, with later years taking precedence in case of conflicts</li>
              <li>OEM scope details are defined in General Settings/OEM Scopes</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </FormSection>
    </div>
  );
};

export default ContractsModule;