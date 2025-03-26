// src/hooks/forms/index.js
import { useFieldArray } from 'react-hook-form';

// Export the form hooks directly
export * from './useAppForm';
export * from './useScenarioForm';

// Export useFieldArray for array field handling
export { useFieldArray };