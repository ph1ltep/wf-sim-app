# Backend Patterns

## CRUD Routes (Standard)
```javascript
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validateMiddleware(Schema), create);
router.put('/:id', validateMiddleware(Schema), update);
router.delete('/:id', delete);
```

## Response Format (Always)
```javascript
const { formatSuccess, formatError } = require('../utils/responseFormatter');
return res.json(formatSuccess(data, 'message', 'crud'));
return res.status(400).json(formatError('message', 400, errors));
```

## Validation (Required)
```javascript
const { validateMiddleware } = require('../utils/validate');
router.post('/scenarios', validateMiddleware(ScenarioSchema), createScenario);
```

## Monte Carlo Engine
```javascript
const engine = monteCarloV2.createEngine(simRequest);
const results = await engine.run();

// Request format
{ distributions: [{ id, type, parameters }], simulationSettings: { iterations, seed, years } }
```

## Database Operations
```javascript
const Scenario = require('../schemas/mongoose/scenario');
const scenarios = await Scenario.find({}, 'name description');
const updated = await Scenario.findByIdAndUpdate(id, data, { new: true });
```

## Schema Pattern
```javascript
// Yup first → auto-generate Mongoose
const scenarioSchema = yupToMongoose(ScenarioSchema, {
  name: { unique: true, index: true }
});
```

## Error Handling
```javascript
try {
  const results = await engine.run();
  return formatSuccess(results, 'Simulation completed', 'simulation');
} catch (error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json(formatError('Invalid params', 400, [error.message]));
  }
  throw error;
}
```