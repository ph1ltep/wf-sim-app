// src/components/inputs/CostInputs.jsx
import React, { useEffect, useState } from 'react';
import { Typography, Form, InputNumber, Select, Card, Divider, Tabs, Button } from 'antd';
import { InfoCircleOutlined, ToolOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';
import { useNavigate } from 'react-router-dom';
import { getAllOEMContracts } from '../../api/oemContracts';

const { Title } = Typography;
const { Option } = Select;

const CostInputs = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [oemContracts, setOEMContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Only render if parameters are loaded
  if (!parameters || !parameters.cost) {
    return <div>Loading parameters...</div>;
  }

  const costParams = parameters.cost;

  // Fetch OEM contracts on component mount
  useEffect(() => {
    const fetchOEMContracts = async () => {
      try {
        setLoadingContracts(true);
        const response = await getAllOEMContracts();
        
        if (response.success && response.data) {
          setOEMContracts(response.data);
        }
      } catch (error) {
        console.error('Error fetching OEM contracts:', error);
      } finally {
        setLoadingContracts(false);
      }
    };
    
    fetchOEMContracts();
  }, []);

  const handleValuesChange = (changedValues, allValues) => {
    // Only update if we have actual changed values
    if (Object.keys(changedValues).length > 0) {
      updateModuleParameters('cost', allValues);
    }
  };

  // Navigate to OEM Contracts page
  const goToOEMContracts = () => {
    navigate('/config/scenario/oemcontracts');
  };

  // Define tabs items
  const tabItems = [
    {
      key: 'routine',
      label: 'Routine O&M',
      children: (
        <Card title="Base O&M Costs">
          <Form.Item
            label="Annual Base O&M Cost (USD/year)"
            name="annualBaseOM"
            rules={[{ required: true, message: 'Please input annual base O&M cost!' }]}
          >
            <InputNumber 
              min={0} 
              step={100000} 
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            label="O&M Cost Escalation Rate (%/year)"
            name="escalationRate"
            rules={[{ required: true, message: 'Please input escalation rate!' }]}
          >
            <InputNumber 
              min={0} 
              max={10} 
              step={0.1} 
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            label="Escalation Distribution"
            name="escalationDistribution"
            tooltip="Distribution type for the escalation rate uncertainty"
          >
            <Select>
              <Option value="Normal">Normal</Option>
              <Option value="Lognormal">Lognormal</Option>
              <Option value="Triangular">Triangular</Option>
              <Option value="Uniform">Uniform</Option>
            </Select>
          </Form.Item>
        </Card>
      )
    },
    {
      key: 'oem',
      label: 'OEM Contract',
      children: (
        <Card 
          title={
            <span>
              <ToolOutlined style={{ marginRight: 8 }} />
              OEM Contract Settings
            </span>
          }
          extra={
            <Button type="primary" onClick={goToOEMContracts}>
              Manage OEM Contracts
            </Button>
          }
        >
          <p>Select an OEM contract to use for this scenario. OEM contracts define scope and cost during the warranty period.</p>
          
          <Form.Item
            label="OEM Contract"
            name="oemContractId"
            tooltip="Selected OEM contract for this scenario"
          >
            <Select 
              placeholder="Select an OEM contract" 
              loading={loadingContracts}
              allowClear
            >
              {oemContracts.map(contract => (
                <Option key={contract._id} value={contract._id}>
                  {contract.name} - {contract.fixedFee.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}{contract.isPerTurbine ? '/WTG' : ''}/year
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Divider dashed />
          
          <p style={{ fontStyle: 'italic', color: 'rgba(0, 0, 0, 0.45)' }}>
            To create or edit OEM contracts, click the "Manage OEM Contracts" button above.
          </p>
        </Card>
      )
    },
    {
      key: 'failures',
      label: 'Failures',
      children: (
        <Card title="Failure Events">
          <Form.Item
            label="Failure Event Probability (%/year)"
            name="failureEventProbability"
            tooltip="Annual probability of a failure event occurring"
          >
            <InputNumber 
              min={0} 
              max={100} 
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            label="Failure Event Cost (USD per event)"
            name="failureEventCost"
            tooltip="Average cost of each failure event"
          >
            <InputNumber 
              min={0} 
              step={10000} 
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Card>
      )
    },
    {
      key: 'major',
      label: 'Major Repairs',
      children: (
        <Card title="Major Repairs / Overhauls">
          <p>Configure deterministic or probabilistic major cost events (e.g., blade or gearbox replacements).</p>
          
          {/* This would be implemented with a dynamic form for adding major repair events */}
          <p>This feature will be implemented in a future version.</p>
        </Card>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Cost Module Configuration</Title>
      <p>Configure the cost parameters for the wind farm simulation.</p>

      <Form
        form={form}
        layout="vertical"
        initialValues={costParams}
        onValuesChange={handleValuesChange}
      >
        <Tabs defaultActiveKey="routine" items={tabItems} />
      </Form>
    </div>
  );
};

export default CostInputs;