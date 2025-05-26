// src/components/modules/ContractsModule.jsx
import React, { useEffect } from 'react';
import { Typography, Alert, Spin, Card, Tag, Tooltip, Button, Space, Table } from 'antd';
import {
  FileTextOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
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
  CurrencyField,
  PercentageField,
  FormDivider,
  FieldCard
} from '../contextFields';
import EditableTable from '../../components/tables/EditableTable';

// Import column utilities
import {
  createTextColumn,
  createCustomTagsColumn,
  createCurrencyColumn,
  createIconColumn
} from '../tables/columns';

// Import the cards
import { ContractScopeCard, ContractEditorCard } from '../cards';

const { Title, Text } = Typography;

const ContractsModule = () => {
  // Base path for contracts in the context
  const contractsPath = ['settings', 'modules', 'contracts', 'oemContracts'];

  // Get scenario context and OEM scopes
  const { scenarioData, getValueByPath, updateByPath } = useScenario();
  const { oemScopes, loading: loadingScopes, fetchScopes } = useOEMScopes();

  // Current project life for year range
  const projectLife = getValueByPath(['settings', 'general', 'projectLife'], 20);

  // Get contracts from context or initialize empty array
  const contracts = getValueByPath(contractsPath, []);

  // Get currency
  const currency = getValueByPath(['settings', 'project', 'currency', 'local'], 'USD');

  // Get number of WTGs for contract scope visualization
  const numWTGs = getValueByPath(['settings', 'project', 'windFarm', 'numWTGs'], 20);

  // Refresh scopes
  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

  // Define columns for the contracts table
  const contractColumns = [
    // Name column
    createTextColumn('name', 'Name', {
      width: '20%',
      sorter: true,
    }),

    // OEM Scope column using createCustomTagsColumn
    createCustomTagsColumn('oemScopeId', 'OEM Scope',
      (tag, index) => (
        <Tooltip key={tag.id} title={tag.content}>
          <OEMScopeTag color={tag.color}>
            {tag.content}
          </OEMScopeTag>
        </Tooltip>
      ),
      {
        width: '25%',
        getTagsFromRecord: (record) => {
          // Find the associated scope
          const scope = oemScopes.find(s => s.key === record.oemScopeId);
          if (!scope) return [];

          // Return tags based on scope features
          return renderScopeTags(scope);
        },
        render: (_, record) => {
          // Find the associated scope
          const scope = oemScopes.find(s => s.key === record.oemScopeId);

          if (!scope) {
            return <Tag color="error">Scope not found</Tag>;
          }

          // Generate tags from scope features
          const tags = renderScopeTags(scope);

          return (
            <Space size={[0, 4]} wrap direction="vertical">
              <Text strong>{scope.name}</Text>
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
      }
    ),

    // Years column
    {
      title: 'Years',
      dataIndex: 'years',
      key: 'years',
      width: '20%',
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

    // Enhanced fee column showing time series information
    {
      title: 'Fee',
      dataIndex: 'fixedFee',
      key: 'fixedFee',
      width: '15%',
      render: (value, record) => {
        const timeSeries = record.fixedFeeTimeSeries || [];
        const hasTimeSeries = timeSeries.length > 0;
        
        return (
          <div>
            <div style={{ fontWeight: 500 }}>
              {currency}{(value || 0).toLocaleString()}
            </div>
            {hasTimeSeries && (
              <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                {timeSeries.length} year schedule
              </div>
            )}
            {record.isPerTurbine && (
              <div style={{ fontSize: '10px', color: '#1890ff' }}>
                per turbine
              </div>
            )}
          </div>
        );
      }
    },

    // Icon column for additional indicators
    createIconColumn('', [
      {
        key: 'isPerTurbine',
        icon: <DollarCircleOutlined />,
        tooltip: 'Fee is applied per turbine',
        color: '#52c41a'  // Green
      },
      {
        key: record => record.escalation?.useMin,
        icon: <ArrowDownOutlined />,
        tooltip: record => `Minimum escalation limit: ${record.escalation?.minValue}%`,
        color: '#1890ff' // Blue
      },
      {
        key: record => record.escalation?.useMax,
        icon: <ArrowUpOutlined />,
        tooltip: record => `Maximum escalation limit: ${record.escalation?.maxValue}%`,
        color: '#faad14' // Gold
      }
    ], {
      width: 100
    })
  ];

  // Define form fields for the contracts form
  const contractFormFields = [
    <TextField
      key="name"
      path="name"
      label="Contract Name"
      placeholder="e.g., OEM Full Service Contract"
      required
    />,

    <SelectField
      key="oemScopeId"
      path="oemScopeId"
      label="OEM Scope"
      placeholder="Select an OEM scope"
      options={oemScopes.map(scope => ({
        value: scope.key,
        label: scope.name
      }))}
      required
    />,

    <CurrencyField
      key="fixedFee"
      path="fixedFee"
      label="Base Fixed Fee"
      tooltip="This will be used as the default value for all years when creating the fee schedule"
      min={0}
      step={1000}
      currencyOverride={currency}
    />,

    <CheckboxField
      key="isPerTurbine"
      path="isPerTurbine"
      label="Fee is applied per turbine"
    />,

    <SelectField
      key="years"
      path="years"
      label="Contract Years"
      mode="multiple"
      placeholder="Select years"
      options={Array.from({ length: projectLife }, (_, i) => ({
        value: i + 1,
        label: `Year ${i + 1}`
      }))}
    />,

    <CheckboxField
      key="escalation.useMin"
      path={['escalation', 'useMin']}
      label="Use min limit"
    />,
    
    <PercentageField
      key="escalation.minValue"
      path={['escalation', 'minValue']}
      label="Min %"
      min={-20}
      max={0}
      step={0.1}
    />,
    
    <CheckboxField
      key="escalation.useMax"
      path={['escalation', 'useMax']}
      label="Use max limit"
    />,
    
    <PercentageField
      key="escalation.maxValue"
      path={['escalation', 'maxValue']}
      label="Max %"
      min={0}
      max={20}
      step={0.1}
    />
  ];

  // Calculate average of time series values for expanded row display
  const calculateTimeSeriesAverage = (timeSeries) => {
    if (!timeSeries || timeSeries.length === 0) return 0;
    
    const values = timeSeries
      .map(dp => parseFloat(dp.value))
      .filter(val => !isNaN(val));
    
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
  };

  // Expandable row renderer for contract details
  const expandedRowRender = (record) => {
    // Find the associated scope
    const scope = oemScopes.find(s => s.key === record.oemScopeId);
    const timeSeries = record.fixedFeeTimeSeries || [];
    
    if (!scope) return <Typography.Text>No scope details available</Typography.Text>;

    return (
      <Card size="small" title="Contract Details" bordered={false}>
        <p><strong>Contract Name:</strong> {record.name}</p>
        <p><strong>OEM Scope:</strong> {scope.name}</p>
        <p><strong>Base Fee:</strong> {currency}{(record.fixedFee || 0).toLocaleString()} {record.isPerTurbine ? 'per turbine' : 'total'}</p>
        <p><strong>Active Years:</strong> {record.years?.join(', ') || 'None'}</p>

        {/* Enhanced fee schedule information */}
        {timeSeries.length > 0 && (
          <div>
            <p><strong>Fee Schedule:</strong></p>
            <div style={{ marginLeft: '16px' }}>
              <p>• {timeSeries.length} years with custom fees</p>
              <p>• Range: {currency}{Math.min(...timeSeries.map(ts => ts.value)).toLocaleString()} - {currency}{Math.max(...timeSeries.map(ts => ts.value)).toLocaleString()}</p>
              <p>• Average: {currency}{calculateTimeSeriesAverage(timeSeries).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Escalation details */}
        {(record.escalation?.useMin || record.escalation?.useMax) && (
          <div>
            <p><strong>Escalation Limits:</strong></p>
            {record.escalation?.useMin && (
              <p>- Minimum: {record.escalation.minValue}%</p>
            )}
            {record.escalation?.useMax && (
              <p>- Maximum: {record.escalation.maxValue}%</p>
            )}
          </div>
        )}
      </Card>
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
              {/* Contract Configuration Table */}
              <FieldCard title="Contracts Configuration"
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
                <EditableTable
                  columns={contractColumns}
                  path={contractsPath}
                  formFields={contractFormFields}
                  keyField="id"
                  itemName="Contract"
                  expandedRowRender={expandedRowRender}
                  formLayout="horizontal"
                  formCompact={true}
                  formResponsive={true}
                />
              </FieldCard>

              {/* Contract Fee Schedule Editor */}
              <FormDivider margin="default" />
              <ContractEditorCard
                path={contractsPath}
                projectLife={projectLife}
                currency={currency}
                affectedMetrics={['contractCosts']}
              />

              {/* Contract Scope Analysis */}
              <FormDivider margin="default" />
              <ContractScopeCard
                oemContracts={contracts}
                projectLife={projectLife}
                numWTGs={numWTGs}
                currency={currency}
                title="Contract Fee Heatmap"
                icon={<FileTextOutlined />}
                height={Math.max(300, contracts.length * 60 + 150)}
                showMetadata={true}
                loading={loadingScopes}
              />

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractsModule;