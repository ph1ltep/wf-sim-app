# Frontend Patterns

## ScenarioContext (Data State)
```javascript
const { updateByPath, getValueByPath } = useScenario();
await updateByPath('settings.financial.discountRate', 0.08);
const rate = getValueByPath('settings.financial.discountRate', 0.05);
```

## CubeContext (Computed Data) 
```javascript
const { getData, refreshCubeData } = useCube();
const energyData = getData({ sourceId: 'energyRevenue', percentile: 50 });
await refreshCubeData('sources');
```

## ContextField (Auto-sync inputs)
```javascript
<ContextField 
  path="settings.financial.discountRate"
  fieldType="number"
  label="Discount Rate (%)"
/>

<ContextField
  path="settings.revenue.electricityPrice"
  fieldType="distribution"
  distributionTypes={['normal', 'lognormal']}
/>
```

## Component Pattern
```javascript
const MyComponent = ({ title = "Default" }) => {
  const { updateByPath } = useScenario();
  const { getData } = useCube();
  
  const data = useMemo(() => getData({ sourceId: 'revenue' }), [getData]);
  
  return <Card title={title}>{/* UI */}</Card>;
};
```

## Key Components

### Data Display
- **CashflowTimelineCard** - Financial timeline
- **FinanceabilityCard** - Financial metrics  
- **DistributionCard** - Monte Carlo config
- **DriverExplorerCard** - Sensitivity analysis

### Input Components
- **ContextForm** - Form wrapper with validation
- **DistributionFieldV3** - Distribution parameters
- **InlineEditTable** - Editable data tables

## API Pattern
```javascript
try {
  const response = await api.post('/scenarios', data);
  return response.data.success ? response.data.data : throw new Error(response.data.error);
} catch (error) {
  message.error(error.message);
}
```

## Cube Transformers
```javascript
// Source transformer
const revenueTransformer = (scenarioData, { percentile = 50 }) => ({
  id: 'energyRevenue',
  data: computeAnnualRevenue(scenarioData, percentile)
});

// Metrics transformer
const npvTransformer = (sourcesData, scenarioData) => ({
  id: 'npv',
  value: calculateNPV(sourcesData, scenarioData.settings.financial.discountRate)
});
```