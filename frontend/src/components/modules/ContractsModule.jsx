// src/components/modules/ContractsModule.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Alert, Spin, Card, Tag, Tooltip, Button, Select, Space, Table, Modal, Form, Input, InputNumber, Checkbox } from 'antd';
import { ContractOutlined, InfoCircleOutlined, ReloadOutlined, ExclamationCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useScenario } from '../../contexts/ScenarioContext';
import useOEMScopes from '../../hooks/useOEMScopes';
import OEMScopeTag from '../config/oemScopes/OEMScopeTag';
import { renderScopeTags } from '../../utils/oemScopeUtils';

// Import context field components
import {
  FormSection,
  FormRow,
  FormCol,
  TextField,
  NumberField,
  SelectField,
  CheckboxField,
  EditableTable
} from '../contextFields';

const { Title, Text } = Typography;
const { Option } = Select;

const ContractsModule = () => {
  // Base path for contracts in the context
  const contractsPath = ['settings', 'modules', 'contracts', 'oemContracts'];
  
  // Get scenario context and OEM scopes
  const { scenarioData, getValueByPath, updateByPath } = useScenario();
  const { oemScopes, loading: loadingScopes, fetchScopes } = useOEMScopes();
  
  // Current project life for year range
  const projectLife = getValueByPath(['settings', 'general', 'projectLife'], 20);
  
  // Local state
  const [selectedContract, setSelectedContract] = useState(null);
  
  // Get contracts from context or initialize empty array
  const contracts = getValueByPath(contractsPath, []);

  // Get scope options for dropdown
  const scopeOptions = oemScopes.map(scope => ({
    value: scope.key,
    label: scope.name,
    scope: scope
  }));

  // Create an array of year options for the dropdown
  const yearOptions = Array.from({ length: projectLife }, (_, i) => ({
    value: i + 1,
    label: `Year ${i + 1}`
  }));

  // Refresh scopes
  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

  // Define columns for the contracts table
  const contractColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: 'OEM Scope',
      key: 'oemScopeId',
      width: '30%',
      render: (_, record) => {
        // Find the associated scope
        const scope = oemScopes.find(s => s.key === record.oemScopeId);
        
        if (!scope) {
          return <Tag color="error">Scope not found</Tag>;
        }
        
        // Render tags for the scope features
        const tags = renderScopeTags(scope, OEMScopeTag);
        
        return (
          <Space size={[0, 4]} wrap>
            <Text strong>{scope.name}</Text>
            <br />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {tags.map(tag => (
                <Tooltip key={tag.id} title={tag.content}>
                  <OEMScopeTag color={tag.color}>
                    {tag.content}
                  </OEMScopeTag>
                </Tooltip>
              ))}
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Years',
      dataIndex: 'years',
      key: 'years',
      width: '25%',
      render: (years) => {
        if (!years || years.length === 0) {
          return <Text type="secondary">No years assigned</Text>;
        }
        
        // Sort years for display
        const sortedYears = [...years].sort((a, b) => a - b);
        
        // Format consecutive years as ranges
        const ranges = [];
        let rangeStart = sortedYears[0];
        let rangeEnd = rangeStart;
        
        for (let i = 1; i < sortedYears.length; i++) {
          if (sortedYears[i] === rangeEnd + 1) {
            rangeEnd = sortedYears[i];
          } else {
            ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
            rangeStart = rangeEnd = sortedYears[i];
          }
        }
        
        ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
        
        return (
          <Space wrap>
            {ranges.map((range, index) => (
              <Tag key={index} color="blue">Year {range}</Tag>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Fee',
      key: 'fee',
      width: '25%',
      render: (_, record) => {
        const currency = getValueByPath(['settings', 'project', 'currency', 'local'], 'USD');
        return (
          <div>
            {record.fixedFee ? (
              <>
                <Tag color="green">
                  {record.fixedFee.toLocaleString()} {currency}
                  {record.isPerTurbine ? '/turbine' : ''}
                </Tag>
                {record.isPerTurbine && (
                  <Tooltip title="This fee is applied per turbine">
                    <InfoCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                )}
              </>
            ) : (
              <Text type="secondary">No fee defined</Text>
            )}
          </div>
        );
      }
    }
  ];

// ContractsTable component handles add/edit/delete of contracts
const ContractsTable = ({ 
  contracts,
  columns, 
  oemScopes, 
  yearOptions, 
  projectLife, 
  path, 
  updateByPath, 
  getValueByPath 
}) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [editingContractIndex, setEditingContractIndex] = useState(null);

  // Handle adding new contract
  const handleAdd = () => {
    form.resetFields();
    setEditingContract(null);
    setEditingContractIndex(null);
    setModalVisible(true);
  };

  // Handle editing existing contract
  const handleEdit = (record, index) => {
    form.setFieldsValue(record);
    setEditingContract(record);
    setEditingContractIndex(index);
    setModalVisible(true);
  };

  // Handle deleting contract
  const handleDelete = (index) => {
    const newContracts = [...contracts];
    newContracts.splice(index, 1);
    updateByPath(path, newContracts);
  };

  // Handle saving the form
  const handleSave = () => {
    form.validateFields().then(values => {
      const newContracts = [...contracts];
      
      // Find the OEM scope name if it wasn't set in the onChange
      if (!values.oemScopeName) {
        const scope = oemScopes.find(s => s.key === values.oemScopeId);
        values.oemScopeName = scope?.name || '';
      }

      // Generate an ID for new contracts
      if (editingContractIndex === null) {
        values.id = `contract_${Date.now()}`;
        newContracts.push(values);
      } else {
        newContracts[editingContractIndex] = {
          ...newContracts[editingContractIndex],
          ...values
        };
      }
      
      updateByPath(path, newContracts);
      setModalVisible(false);
    });
  };
  
  // Add actions column if not already present
  const tableColumns = columns.find(col => col.key === 'actions') ? 
    columns : 
    [
      ...columns, 
      {
        title: 'Actions',
        key: 'actions',
        width: 120,
        render: (_, record, index) => (
          <Space>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record, index)}
            />
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(index)}
            />
          </Space>
        )
      }
    ];

  // Expandable row renderer
  const expandedRowRender = (record) => {
    // Find the associated scope
    const scope = oemScopes.find(s => s.key === record.oemScopeId);
    if (!scope) return <Typography.Text>No scope details available</Typography.Text>;
    
    return (
      <Card size="small" title="Contract Details" bordered={false}>
        <p><strong>Contract Name:</strong> {record.name}</p>
        <p><strong>OEM Scope:</strong> {scope.name}</p>
        <p><strong>Fixed Fee:</strong> {record.fixedFee?.toLocaleString() || 'N/A'} {getValueByPath(['settings', 'project', 'currency', 'local'], 'USD')} {record.isPerTurbine ? 'per turbine' : 'total'}</p>
        <p><strong>Active Years:</strong> {record.years?.join(', ') || 'None'}</p>
      </Card>
    );
  };

  // Render contract form for the modal
  const renderContractForm = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="Contract Name"
        rules={[{ required: true, message: 'Please enter a contract name' }]}
      >
        <Input placeholder="e.g., OEM Full Service Contract" />
      </Form.Item>
      
      <Form.Item
        name="oemScopeId"
        label="OEM Scope"
        rules={[{ required: true, message: 'Please select an OEM scope' }]}
      >
        <Select 
          placeholder="Select an OEM scope" 
          style={{ width: '100%' }}
          onChange={(value, option) => {
            // When OEM scope is selected, also set the scope name
            if (option) {
              form.setFieldsValue({ 
                oemScopeName: option.children
              });
            }
          }}
        >
          {oemScopes.map(scope => (
            <Select.Option key={scope.key} value={scope.key}>
              {scope.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item name="oemScopeName" hidden>
        <Input />
      </Form.Item>
      
      <Form.Item
        name="fixedFee"
        label="Fixed Fee"
      >
        <InputNumber
          min={0}
          step={1000}
          style={{ width: '100%' }}
          formatter={value => value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '$0'}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      </Form.Item>
      
      <Form.Item 
        name="isPerTurbine" 
        valuePropName="checked"
      >
        <Checkbox>Fee is per turbine</Checkbox>
      </Form.Item>
      
      <Form.Item
        name="years"
        label="Contract Years"
      >
        <Select
          mode="multiple"
          placeholder="Select years"
          style={{ width: '100%' }}
        >
          {yearOptions.map(year => (
            <Select.Option key={year.value} value={year.value}>
              {year.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
        >
          Add Contract
        </Button>
      </div>
      
      <Table 
        dataSource={contracts} 
        columns={tableColumns}
        rowKey="id"
        expandable={{ expandedRowRender }}
        pagination={false}
      />

      <Modal
        title={editingContract ? "Edit Contract" : "Add Contract"}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        destroyOnClose={true}
      >
        {renderContractForm()}
      </Modal>
    </>
  );
};

  // Check if there's an active scenario
  if (!scenarioData) {
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
      <Title level={2}>OEM Contracts</Title>
      <p>Configure OEM maintenance contracts for your wind farm scenario.</p>

      {loadingScopes ? (
        <Spin tip="Loading OEM scopes...">
          <div style={{ minHeight: 200 }} />
        </Spin>
      ) : (
        <>
          {oemScopes.length === 0 ? (
            <Alert
              message="No OEM Scopes Defined"
              description={
                <div>
                  <p>You need to define OEM scopes before you can create contracts.</p>
                  <Button
                    type="primary"
                    onClick={() => window.location.href = '/config/general/oemscopes'}
                  >
                    Go to OEM Scopes
                  </Button>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          ) : (
            <div>
              <FormSection title="Contracts Configuration" 
                extra={
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchScopes}
                    loading={loadingScopes}
                  >
                    Refresh Scopes
                  </Button>
                }
              >
                <Alert
                  message="Contract Assignment"
                  description="Contracts define which OEM service scope applies in each year of the project. You can assign different contracts to different years to model changing O&M strategies over time."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <ContractsTable 
                  contracts={contracts}
                  columns={contractColumns}
                  oemScopes={oemScopes}
                  yearOptions={yearOptions}
                  projectLife={projectLife}
                  path={contractsPath}
                  updateByPath={updateByPath}
                  getValueByPath={getValueByPath}
                />
              </FormSection>
              
              <FormSection title="Contract Coverage Visualization">
                <p>The table below shows which contracts are applied to each project year.</p>
                
                {contracts.length > 0 ? (
                  <Table
                    dataSource={Array.from({ length: projectLife }, (_, i) => ({
                      key: i + 1,
                      year: i + 1,
                      contracts: contracts.filter(c => c.years && c.years.includes(i + 1))
                    }))}
                    columns={[
                      {
                        title: 'Project Year',
                        dataIndex: 'year',
                        key: 'year',
                        width: '15%',
                        render: year => <Tag color="blue">Year {year}</Tag>
                      },
                      {
                        title: 'Applied Contracts',
                        dataIndex: 'contracts',
                        key: 'contracts',
                        render: (contracts) => {
                          if (!contracts || contracts.length === 0) {
                            return (
                              <Space>
                                <Tag color="red">No Contract</Tag>
                                <Tooltip title="No OEM service contract defined for this year">
                                  <ExclamationCircleOutlined style={{ color: 'red' }} />
                                </Tooltip>
                              </Space>
                            );
                          }
                          
                          return (
                            <Space wrap>
                              {contracts.map(contract => {
                                const scope = oemScopes.find(s => s.key === contract.oemScopeId);
                                return (
                                  <Tag key={contract.id} color="green">
                                    {contract.name} ({scope?.name || 'Unknown Scope'})
                                  </Tag>
                                );
                              })}
                            </Space>
                          );
                        }
                      }
                    ]}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Alert
                    message="No Contracts Defined"
                    description="Add contracts above to see the coverage visualization."
                    type="info"
                    showIcon
                  />
                )}
              </FormSection>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractsModule;