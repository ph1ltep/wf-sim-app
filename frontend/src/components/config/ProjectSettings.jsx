// src/components/config/ProjectSettings.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Form, InputNumber, Card, Button, Row, Col, Statistic, Tooltip, 
         Divider, Select, message, Space } from 'antd';
import { InfoCircleOutlined, GlobalOutlined, LoadingOutlined, DollarOutlined } from '@ant-design/icons';
import { useSimulation } from '../../contexts/SimulationContext';
import { getAllLocations } from '../../api/locations';

const { Title } = Typography;
const { Option } = Select;

// Currency options - comprehensive list of major world currencies
const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'HKD', label: 'Hong Kong Dollar (HKD)' },
  { value: 'NZD', label: 'New Zealand Dollar (NZD)' },
  { value: 'SEK', label: 'Swedish Krona (SEK)' },
  { value: 'KRW', label: 'South Korean Won (KRW)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  { value: 'NOK', label: 'Norwegian Krone (NOK)' },
  { value: 'MXN', label: 'Mexican Peso (MXN)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'RUB', label: 'Russian Ruble (RUB)' },
  { value: 'ZAR', label: 'South African Rand (ZAR)' },
  { value: 'TRY', label: 'Turkish Lira (TRY)' },
  { value: 'BRL', label: 'Brazilian Real (BRL)' },
];

// Table styling for component quantities
const tableStyle = {
  header: {
    backgroundColor: '#f0f2f5',
    padding: '12px 10px',
    textAlign: 'left',
    borderBottom: '1px solid #e8e8e8',
    fontSize: '14px',
    fontWeight: '500'
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid #e8e8e8',
    fontSize: '14px'
  },
  cellRight: {
    padding: '8px 10px',
    borderBottom: '1px solid #e8e8e8',
    fontSize: '14px',
    textAlign: 'right',
    fontWeight: '500'
  }
};

const ProjectSettings = () => {
  const { parameters, updateModuleParameters } = useSimulation();
  const [form] = Form.useForm();
  const [calculatedValues, setCalculatedValues] = useState({
    totalMW: 0,
    grossAEP: 0,
    netAEP: 0
  });
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Track which fields are from location defaults
  const [fieldsFromLocations, setFieldsFromLocations] = useState({
    capacityFactor: false,
    currency: false,
    foreignCurrency: false,
    exchangeRate: false
  });

  // Fetch available locations when component mounts
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await getAllLocations();
        
        if (response.success && response.data) {
          setLocations(response.data);
        } else {
          message.error('Failed to load location data');
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        message.error('Failed to load location data');
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchLocations();
  }, []);

  // Calculate project metrics and component quantities
  const calculateDerivedValues = (values) => {
    const numWTGs = values.numWTGs || 0;
    const mwPerWTG = values.mwPerWTG || 0;
    const capacityFactor = values.capacityFactor || 0;
    const curtailmentLosses = values.curtailmentLosses || 0;
    const electricalLosses = values.electricalLosses || 0;
    const wtgPlatformType = values.wtgPlatformType || 'geared';
    
    const totalMW = numWTGs * mwPerWTG;
    // Gross AEP = Total MW * Capacity Factor * Hours in a year
    const grossAEP = totalMW * (capacityFactor / 100) * 8760;
    
    // Net AEP after losses:
    // First apply curtailment losses
    const afterCurtailment = grossAEP * (1 - curtailmentLosses / 100);
    // Then apply electrical losses
    const netAEP = afterCurtailment * (1 - electricalLosses / 100);
    
    // Calculate major component quantities
    const componentQuantities = {
      blades: numWTGs * 3, // 3 blades per turbine
      bladeBearings: numWTGs * 3, // One bearing per blade
      transformers: numWTGs,
      // Different components based on platform type
      gearboxes: wtgPlatformType === 'geared' ? numWTGs : 0,
      generators: numWTGs,
      converters: numWTGs,
      mainBearings: numWTGs, // For both types, but different specifications
      yawSystems: numWTGs,
    };
    
    const updatedValues = {
      totalMW: totalMW,
      grossAEP: grossAEP,
      netAEP: netAEP,
      componentQuantities: componentQuantities
    };
    
    setCalculatedValues(updatedValues);
    
    // Save calculated values to the parameters
    updateModuleParameters('projectMetrics', updatedValues);
  };

  // Calculate initial values
  useEffect(() => {
    if (parameters && parameters.general) {
      calculateDerivedValues(parameters.general);
    }
  }, [parameters?.general]);

  const handleValuesChange = (changedValues, allValues) => {
    // Recalculate derived values
    calculateDerivedValues(allValues);
    
    // Check if any field loaded from locations was changed
    if (changedValues.capacityFactor && fieldsFromLocations.capacityFactor) {
      setFieldsFromLocations(prev => ({ ...prev, capacityFactor: false }));
    }
    
    if (changedValues.currency && fieldsFromLocations.currency) {
      setFieldsFromLocations(prev => ({ ...prev, currency: false }));
    }
    
    if (changedValues.foreignCurrency && fieldsFromLocations.foreignCurrency) {
      setFieldsFromLocations(prev => ({ ...prev, foreignCurrency: false }));
    }
    
    if (changedValues.exchangeRate && fieldsFromLocations.exchangeRate) {
      setFieldsFromLocations(prev => ({ ...prev, exchangeRate: false }));
    }
    
    // Check if currency related fields were changed
    const currencyFields = ['currency', 'foreignCurrency', 'exchangeRate'];
    const hasCurrencyChanges = Object.keys(changedValues).some(key => currencyFields.includes(key));
    
    // Create a copy of general parameters without currency fields
    const generalParams = { ...allValues };
    currencyFields.forEach(field => delete generalParams[field]);
    
    // Always update general parameters without currency fields
    updateModuleParameters('general', generalParams);
    
    // Handle currency field changes or ensure they persist in scenario parameters
    const scenarioParams = { 
      ...parameters.scenario || {},
      currency: allValues.currency,
      foreignCurrency: allValues.foreignCurrency,
      exchangeRate: allValues.exchangeRate
    };
    
    // Update scenario parameters with currency info
    updateModuleParameters('scenario', scenarioParams);
  };

  const handleReset = () => {
    form.resetFields();
    
    // Recalculate with reset values
    const values = form.getFieldsValue();
    calculateDerivedValues(values);
    
    // Reset location fields
    setFieldsFromLocations({
      capacityFactor: false,
      currency: false,
      foreignCurrency: false,
      exchangeRate: false
    });
    
    // Update general parameters (without currency)
    const generalParams = { ...values };
    delete generalParams.currency;
    delete generalParams.foreignCurrency;
    delete generalParams.exchangeRate;
    updateModuleParameters('general', generalParams);
    
    // Update scenario parameters with currency information
    const scenarioParams = { 
      ...parameters.scenario || {},
      currency: values.currency,
      foreignCurrency: values.foreignCurrency,
      exchangeRate: values.exchangeRate
    };
    updateModuleParameters('scenario', scenarioParams);
  };

  const handleLocationChange = (locationId) => {
    setSelectedLocation(locationId);
  };

  const handleLoadLocationDefaults = () => {
    if (!selectedLocation) {
      message.warning('Please select a location first');
      return;
    }

    // Find the selected location
    const locationData = locations.find(loc => loc._id === selectedLocation);
    
    if (!locationData) {
      message.error('Selected location not found');
      return;
    }

    // Update form values with location defaults
    const formValues = form.getFieldsValue();
    
    // Update capacity factor
    formValues.capacityFactor = locationData.capacityFactor;
    
    // Update currency information
    formValues.currency = locationData.currency;
    formValues.foreignCurrency = locationData.foreignCurrency;
    formValues.exchangeRate = locationData.exchangeRate;
    
    // Update the form with these values
    form.setFieldsValue(formValues);
    
    // Update the general parameters (without currency)
    const generalParams = { ...formValues };
    delete generalParams.currency;
    delete generalParams.foreignCurrency;
    delete generalParams.exchangeRate;
    updateModuleParameters('general', generalParams);
    
    // Recalculate derived values
    calculateDerivedValues(generalParams);

    // Update revenue module values with location defaults
    if (parameters.revenue) {
      const revenueParams = { ...parameters.revenue };
      
      // Update electricity price
      if (revenueParams.electricityPrice) {
        revenueParams.electricityPrice.value = locationData.energyPrice;
      }
      
      // Update module parameters
      updateModuleParameters('revenue', revenueParams);
    }

    // Update cost module values with location defaults (inflation rate for escalation)
    if (parameters.cost) {
      const costParams = { ...parameters.cost };
      
      // Update escalation rate to match inflation rate
      costParams.escalationRate = locationData.inflationRate;
      
      // Update module parameters
      updateModuleParameters('cost', costParams);
    }

    // Update the scenario with currency information and location
    const scenarioParams = { 
      ...parameters.scenario || {},
      location: locationData.countryCode,
      currency: locationData.currency,
      foreignCurrency: locationData.foreignCurrency,
      exchangeRate: locationData.exchangeRate
    };
    
    updateModuleParameters('scenario', scenarioParams);
    
    // Mark fields as being from location defaults
    setFieldsFromLocations({
      capacityFactor: true,
      currency: true,
      foreignCurrency: true,
      exchangeRate: true
    });

    message.success(`Loaded defaults for ${locationData.country}`);
  };

  if (!parameters || !parameters.general) {
    return <div>Loading parameters...</div>;
  }
  
  // Get currency settings from scenario parameters or use defaults
  const currencySettings = parameters.scenario || {};

  return (
    <div>
      <Title level={2}>Project Specifics</Title>
      <p>Configure the basic parameters for your wind farm project.</p>

      <Card 
        title={
          <span>
            <GlobalOutlined style={{ marginRight: 8 }} />
            Location Selection
          </span>
        } 
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col span={18}>
            <Select 
              placeholder="Select a location to load defaults"
              style={{ width: '100%' }}
              onChange={handleLocationChange}
              loading={loadingLocations}
              disabled={loadingLocations || locations.length === 0}
            >
              {locations.map(location => (
                <Option key={location._id} value={location._id}>
                  {location.country} ({location.countryCode.toUpperCase()}) - {location.currency}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Button 
              type="primary" 
              onClick={handleLoadLocationDefaults}
              disabled={!selectedLocation || loadingLocations}
              loading={loadingLocations}
            >
              Load Defaults
            </Button>
          </Col>
        </Row>
        <p style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.45)' }}>
          Loading a location will override capacity factor, electricity price, inflation rate, 
          local currency, foreign currency, and exchange rate settings with country-specific defaults.
        </p>
      </Card>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ...parameters.general,
          wtgPlatformType: parameters.general.wtgPlatformType || 'geared',
          currency: currencySettings.currency || 'USD',
          foreignCurrency: currencySettings.foreignCurrency || 'EUR',
          exchangeRate: currencySettings.exchangeRate || 1.0
        }}
        onValuesChange={handleValuesChange}
      >
        <Card title="Project Timeline" style={{ marginBottom: 24 }}>
          <Form.Item
            label="Project Life (Years)"
            name="projectLife"
            rules={[{ required: true, message: 'Please input project life!' }]}
            tooltip="The total operational lifetime of the wind farm project"
          >
            <InputNumber min={1} max={50} />
          </Form.Item>
        </Card>

        <Card title="Currency Settings" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label={
                  <span>
                    Local Currency
                    {fieldsFromLocations.currency && 
                      <Tooltip title="Value from location defaults">
                        <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                      </Tooltip>
                    }
                  </span>
                }
                name="currency"
                rules={[{ required: true, message: 'Please select local currency' }]}
              >
                <Select placeholder="Select local currency">
                  {currencies.map(currency => (
                    <Option key={currency.value} value={currency.value}>{currency.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={
                  <span>
                    Foreign Currency
                    {fieldsFromLocations.foreignCurrency && 
                      <Tooltip title="Value from location defaults">
                        <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                      </Tooltip>
                    }
                  </span>
                }
                name="foreignCurrency"
                rules={[{ required: true, message: 'Please select foreign currency' }]}
              >
                <Select placeholder="Select foreign currency">
                  {currencies.map(currency => (
                    <Option key={currency.value} value={currency.value}>{currency.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={
                  <span>
                    Foreign/Local Exchange Rate
                    {fieldsFromLocations.exchangeRate && 
                      <Tooltip title="Value from location defaults">
                        <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                      </Tooltip>
                    }
                  </span>
                }
                name="exchangeRate"
                rules={[{ required: true, message: 'Please enter exchange rate' }]}
                tooltip="Enter rate as: 1 foreign currency = ? local currency"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Wind Farm Specifications" style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label="Number of WTGs"
                name="numWTGs"
                rules={[{ required: true, message: 'Please input number of wind turbines!' }]}
                tooltip="Number of wind turbine generators in the project"
              >
                <InputNumber min={1} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Megawatts per WTG"
                name="mwPerWTG"
                rules={[{ required: true, message: 'Please input MW per turbine!' }]}
                tooltip="Nameplate capacity of each wind turbine in megawatts"
              >
                <InputNumber min={0.1} step={0.1} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="WTG Platform Type"
                name="wtgPlatformType"
                rules={[{ required: true, message: 'Please select WTG platform type!' }]}
                tooltip="Type of wind turbine generator platform"
              >
                <Select placeholder="Select WTG platform type">
                  <Option value="geared">Geared</Option>
                  <Option value="direct-drive">Direct Drive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label={
                  <span>
                    Capacity Factor (%)
                    {fieldsFromLocations.capacityFactor && 
                      <Tooltip title="Value from location defaults">
                        <GlobalOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                      </Tooltip>
                    }
                  </span>
                }
                name="capacityFactor"
                rules={[{ required: true, message: 'Please input capacity factor!' }]}
                tooltip="Expected capacity factor as a percentage of nameplate capacity"
              >
                <InputNumber 
                  min={1} 
                  max={60} 
                  step={0.5} 
                  precision={1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
            <Col span={16}></Col>
          </Row>
          
          <Divider orientation="left">Energy Losses</Divider>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Curtailment Losses (%)
                    <Tooltip title="Energy losses due to grid curtailment or operational restrictions">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                name="curtailmentLosses"
                initialValue={0}
              >
                <InputNumber 
                  min={0} 
                  max={30} 
                  step={0.5} 
                  precision={1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <span>
                    Electrical Losses (%)
                    <Tooltip title="Energy losses in electrical systems, transformers, and transmission">
                      <InfoCircleOutlined style={{ marginLeft: 8 }} />
                    </Tooltip>
                  </span>
                }
                name="electricalLosses"
                initialValue={0}
              >
                <InputNumber 
                  min={0} 
                  max={15} 
                  step={0.5} 
                  precision={1}
                  formatter={value => `${value}%`}
                  parser={value => value.replace('%', '')}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Calculated Project Metrics">
          <Row gutter={24}>
            <Col span={8}>
              <Statistic
                title="Total Project Capacity"
                value={calculatedValues.totalMW}
                precision={2}
                suffix="MW"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Estimated AEP (Gross)"
                value={calculatedValues.grossAEP}
                precision={0}
                formatter={value => `${(value / 1000).toFixed(2)} GWh`}
              />
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                ({calculatedValues.grossAEP.toLocaleString()} MWh)
              </div>
            </Col>
            <Col span={8}>
              <Statistic
                title="Estimated AEP (Net)"
                value={calculatedValues.netAEP}
                precision={0}
                formatter={value => `${(value / 1000).toFixed(2)} GWh`}
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                ({calculatedValues.netAEP.toLocaleString()} MWh)
              </div>
            </Col>
          </Row>
          
          <Divider orientation="left">Major Component Quantities</Divider>
          
          <table className="component-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={tableStyle.header}>Component</th>
                <th style={tableStyle.header}>Quantity</th>
                <th style={tableStyle.header}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tableStyle.cell}>Blades</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.blades || 0}</td>
                <td style={tableStyle.cell}>3 per turbine</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Blade Bearings</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.bladeBearings || 0}</td>
                <td style={tableStyle.cell}>1 per blade</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Transformers</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.transformers || 0}</td>
                <td style={tableStyle.cell}>1 per turbine</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Gearboxes</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.gearboxes || 0}</td>
                <td style={tableStyle.cell}>Only for geared turbines</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Generators</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.generators || 0}</td>
                <td style={tableStyle.cell}>1 per turbine</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Converters</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.converters || 0}</td>
                <td style={tableStyle.cell}>1 per turbine</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Main Bearings/Shaft</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.mainBearings || 0}</td>
                <td style={tableStyle.cell}>1 per turbine (different type for geared/direct drive)</td>
              </tr>
              <tr>
                <td style={tableStyle.cell}>Yaw Systems</td>
                <td style={tableStyle.cellRight}>{calculatedValues.componentQuantities?.yawSystems || 0}</td>
                <td style={tableStyle.cell}>1 per turbine</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Row justify="end" style={{ marginTop: 16 }}>
          <Col>
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default ProjectSettings;