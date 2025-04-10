# Schemas README

This directory contains Yup schemas (`/yup`) and Mongoose schemas (`/mongoose`) for data validation and persistence. Below are instructions for using Yup schemas in the frontend and backend, along with tips for aligning them with Mongoose schemas.

## Frontend Usage

Yup schemas are used to validate data in React components, either for individual form fields or entire objects before submission.

### Validating Form Fields

Use `validateField` from `frontend/src/utils/validate.js` to validate individual fields in real-time.

```javascript
import { validateField } from '../utils/validate';
import ScenarioSchema from '../../../schemas/yup/scenario';

const MyForm = () => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    const validationError = await validateField(ScenarioSchema, 'name', newValue);
    setError(validationError);
  };

  return (
    <div>
      <input value={value} onChange={handleChange} />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
};
```

- **Purpose**: Provides immediate feedback as users type.
- **Elegance**: Keeps validation logic reusable and separate from component logic.

### Validating Entire Objects

Use `validate` from `frontend/src/utils/validate.js` (if added) or Yup’s `validate` method directly to check a full object before submission.

```javascript
import ScenarioSchema from '../../../schemas/yup/scenario';

const submitForm = async (formData) => {
  try {
    await ScenarioSchema.validate(formData, { abortEarly: false });
    // Proceed with submission (e.g., API call)
    console.log('Valid data:', formData);
  } catch (error) {
    console.error('Validation errors:', error.errors);
  }
};

submitForm({ name: 'Test Scenario', description: 'Test' });
```

- **Purpose**: Ensures the entire object is valid before committing to a broader context (e.g., API request).
- **Elegance**: Single validation call with detailed error reporting.

## Backend Usage

Yup schemas can be used directly in controllers or as middleware in Express routes.

### Direct Validation in Controllers

Use `validate` from `backend/utils/validate.js` to check `req.body` in a controller.

```javascript
const validate = require('../utils/validate');
const { ScenarioSchema } = require('../../schemas/yup/scenario');

const createScenario = async (req, res) => {
  const result = await validate(ScenarioSchema, req.body);
  if (!result.isValid) {
    return res.status(400).json({ message: 'Validation error', details: result.errors });
  }
  // Proceed with logic (e.g., save to DB)
  res.status(201).json({ message: 'Scenario created' });
};
```

- **Purpose**: Fine-grained control within the controller.
- **Elegance**: Explicit validation with custom error handling.

### Middleware Validation

Use `validateMiddleware` from `backend/utils/validate.js` in route definitions.

```javascript
const { validateMiddleware } = require('../utils/validate');
const { SimRequestSchema } = require('../../schemas/yup/distributionSchemas');
const { simulateDistributions } = require('../controllers/distributionController');

router.post('/simulate', validateMiddleware(SimRequestSchema), simulateDistributions);
```

- **Purpose**: Validates `req.body` before the controller, rejecting invalid requests early.
- **Elegance**: Reusable across routes, separates validation from business logic.

## Aligning Mongoose Schemas with Yup

Mongoose schemas in `/mongoose` are auto-generated from Yup schemas using `yupToMongoose` in `generator.js`. To keep them aligned:

1. **Define Yup First**: Write Yup schemas in `/yup` as the source of truth, specifying all constraints (e.g., `required`, `min`, `default`).

   ```javascript
   const ScenarioSchema = Yup.object().shape({
     name: Yup.string().required('Name is required'),
     description: Yup.string(),
   });
   ```

2. **Generate Mongoose**: Use `yupToMongoose` in `/mongoose` files, adding DB-specific overrides (e.g., `unique`, `trim`).

   ```javascript
   const ScenarioSchema = yupToMongoose(ScenarioSchemaYup, {
     name: { type: String, required: true, unique: true, trim: true },
   });
   ```

3. **Sync Updates**: When updating a Yup schema (e.g., adding a field), regenerate the Mongoose schema and adjust overrides if needed.

   - **Example**: Add `status: Yup.string().default('active')` to Yup, then update Mongoose with `status: { type: String, default: 'active' }`.

4. **Check Defaults**: Ensure Yup defaults match Mongoose defaults, using functions (e.g., `() => new Date()`) where applicable.

5. **Test Both**: Validate sample data with Yup and save it via Mongoose to catch discrepancies early.

- **Why Align?**: Prevents validation mismatches (e.g., Yup allows data Mongoose rejects).
- **Tip**: Keep Yup and Mongoose schemas in the same file or directory for easy comparison.

## Notes

- **Pathing**: Adjust import paths based on your project structure (e.g., `../../../schemas/yup/scenario`).
- **Extensions**: Add custom Yup validations (e.g., regex) if needed, but mirror them in Mongoose where possible.
- **Errors**: Both frontend and backend return detailed error arrays for user-friendly feedback.

This setup ensures consistent validation across your stack while leveraging Yup’s power and Mongoose’s DB enforcement.
```