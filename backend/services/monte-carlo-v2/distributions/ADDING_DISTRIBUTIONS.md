The `ADDING_DISTRIBUTIONS.md` document needs to be updated to reflect the addition of the formula provider methods (`getMeanFormula`, `getStdDevFormula`, `getMinFormula`, `getMaxFormula`, `getSkewnessFormula`, `getKurtosisFormula`) introduced in the `DistributionGenerator` class to support analytical statistics calculations. These methods allow distributions to provide analytical formulas for statistics, reducing the need for overriding the entire `calculateStatistics` method. Additionally, the document should be updated to list all current distribution types (`normal`, `lognormal`, `triangular`, `uniform`, `weibull`, `exponential`, `poisson`, `fixed`, `kaimal`, `gbm`, `gamma`) and clarify any outdated information about the interface or auto-discovery process.

Below is the revised `ADDING_DISTRIBUTIONS.md`, incorporating these changes and ensuring accuracy with the current state of the Monte Carlo V2 engine.

---


# Adding New Distributions

This guide explains how to add new distribution types to the Monte Carlo V2 engine.

## Overview

The Monte Carlo V2 engine uses an object-oriented, modular approach to distributions. Adding a new distribution involves creating a new file that extends the base `DistributionGenerator` class and implements the required methods. Distributions can also provide analytical formulas for statistics (mean, standard deviation, min, max, skewness, kurtosis) to optimize performance and accuracy, reducing the need for full method overrides.

## Current Distribution Types

The engine currently supports the following distribution types:
- `normal`: Gaussian distribution with mean and standard deviation.
- `lognormal`: Distribution for variables whose logarithm is normally distributed.
- `triangular`: Bounded distribution with min, mode, and max parameters.
- `uniform`: Equal probability over a range with min and max parameters.
- `weibull`: Used in reliability engineering with scale and shape parameters.
- `exponential`: Models time between events with a rate parameter.
- `poisson`: Discrete distribution for counting events with a rate parameter.
- `fixed`: Returns a constant value.
- `kaimal`: Models wind turbulence using a normal approximation with mean wind speed and turbulence intensity.
- `gbm`: Geometric Brownian Motion for stochastic processes (e.g., stock prices).
- `gamma`: Generalizes exponential distribution with shape and scale parameters.

## Steps to Add a New Distribution

1. Create a new file in the `backend/services/monte-carlo-v2/distributions` directory, named after your distribution (e.g., `myDistribution.js`).
2. Extend the `DistributionGenerator` base class.
3. Implement all required methods: `initialize`, `generate`, `validate`, `getMetadata`, and `fitCurve`.
4. Optionally override formula provider methods (`getMeanFormula`, `getStdDevFormula`, etc.) to provide analytical statistics calculations.
5. The new distribution will be auto-discovered and registered automatically.

## Example

Here's a template for creating a new distribution:

```javascript
// backend/services/monte-carlo-v2/distributions/myDistribution.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

class MyDistribution extends DistributionGenerator {
  // Initialize any state needed for the distribution
  initialize(parameters) {
    return {}; // Return initial state
  }

  // Generate a random value from the distribution
  generate(year, random) {
    const param1 = this.getParameterValue('param1', year, 0);
    const param2 = this.getParameterValue('param2', year, 1);
    
    // Your distribution generation logic here
    // 'random()' provides a seeded random value between 0 and 1
    return someCalculatedValue;
  }

  // Validate distribution parameters
  static validate(parameters) {
    const errors = [];
    
    // Check required parameters
    if (!validation.isValidParameter(parameters.param1)) {
      errors.push("Parameter 1 must be a number or a valid time series");
    }
    
    // Add any other validation rules
    if (!validation.isValidParameter(parameters.param2)) {
      errors.push("Parameter 2 must be a number or a valid time series");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Provide metadata about the distribution
  static getMetadata() {
    return {
      name: "My Distribution",
      description: "Description of the distribution and its uses",
      parameters: [
        {
          name: "param1",
          description: "Description of parameter 1",
          required: true,
          type: "number or time series",
          constraints: "any constraints"
        },
        {
          name: "param2",
          description: "Description of parameter 2",
          required: true,
          type: "number or time series",
          constraints: "any constraints"
        }
      ],
      examples: [
        {
          description: "Example 1",
          parameters: { param1: 10, param2: 5 }
        }
      ]
    };
  }

  // Fit the distribution to data points
  static fitCurve(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) {
      throw new Error("Data points are required for curve fitting");
    }
    
    // Your curve fitting logic here
    const values = dataPoints.map(dp => dp.value);
    const estimatedParam1 = calculateParam1(values); // Example
    const estimatedParam2 = calculateParam2(values); // Example
    
    return {
      param1: estimatedParam1,
      param2: estimatedParam2
    };
  }

  // Optional: Provide analytical formulas for statistics
  getMeanFormula() {
    return (params, year) => {
      const param1 = this.getParameterValue('param1', year, 0);
      return param1; // Example analytical mean
    };
  }

  getStdDevFormula() {
    return (params, year) => {
      const param2 = this.getParameterValue('param2', year, 1);
      return param2; // Example analytical stdDev
    };
  }

  getMinFormula() {
    return () => 0; // Example: Non-negative distribution
  }
}

module.exports = MyDistribution;
```

## Required Methods

Each distribution must implement the following methods:

### `initialize(parameters)`
- Set up any internal state needed for generating values.
- Return an object with the initial state.
- Example: Initialize variables or precompute values based on `parameters`.

### `generate(year, random)`
- Generate a random value from the distribution.
- Use `this.getParameterValue(name, year, defaultValue)` to access parameters, which supports both static and time-series values (e.g., `[{ year, value }, ...]`).
- The `random()` function provides a seeded random value between 0 and 1.
- Example: For a normal distribution, use Box-Muller transform with mean and stdDev parameters.

### `static validate(parameters)`
- Validate the provided parameters.
- Return an object with `isValid` (boolean) and `errors` (array of strings).
- Example: Check that parameters are numbers or valid time series and meet constraints (e.g., positive values).

### `static getMetadata()`
- Provide metadata for documentation and user interfaces.
- Return an object with `name`, `description`, `parameters` (array of parameter definitions), and `examples` (array of example parameter sets).
- Example: Describe parameters like `scale` or `shape` for Weibull, including constraints and defaults.

### `static fitCurve(dataPoints)`
- Fit the distribution parameters to a set of data points.
- Input `dataPoints` is an array of `{ year, value }` objects.
- Return an object with estimated parameters.
- Example: For a normal distribution, compute the mean and standard deviation from `dataPoints`.

## Optional Methods

### `updateYear(year)`
- Update internal state when moving to a new year.
- Useful for distributions with time-dependent behavior (e.g., GBM).
- Default implementation is a no-op.

### Formula Provider Methods
To optimize statistics calculation (mean, standard deviation, min, max, skewness, kurtosis), override these methods to provide analytical formulas. Each returns either a function `(parameters, year) => number|null` or `null` (for numerical fallback):

- `getMeanFormula()`: Analytical formula for the mean.
- `getStdDevFormula()`: Analytical formula for the standard deviation.
- `getMinFormula()`: Analytical formula for the minimum value.
- `getMaxFormula()`: Analytical formula for the maximum value.
- `getSkewnessFormula()`: Analytical formula for skewness.
- `getKurtosisFormula()`: Analytical formula for kurtosis (excess kurtosis).

**Example** (for a uniform distribution):
```javascript
getMeanFormula() {
  return (params, year) => {
    const min = this.getParameterValue('min', year, 0);
    const max = this.getParameterValue('max', year, 1);
    return (min + max) / 2;
  };
}
getMinFormula() {
  return (params, year) => this.getParameterValue('min', year, 0);
}
getSkewnessFormula() {
  return () => 0; // Uniform distribution is symmetric
}
```

If not overridden, these methods return `null`, and `calculateStatistics` uses numerical computation based on running statistics from the simulation.

### `calculateStatistics(runningStatsByYear, years)`
- Override only if the distribution requires custom statistics calculation beyond analytical formulas and numerical fallback.
- Input: `runningStatsByYear` (array of `{ count, sum, m2, m3, m4, min, max }` per year), `years` (number of years).
- Output: Object with arrays of `DataPointSchema` objects (`{ year: number, value: number|null }`) for `mean`, `stdDev`, `min`, `max`, `skewness`, `kurtosis`.
- Rarely needed, as formula providers typically suffice.

## Auto-Discovery

The distribution registry automatically discovers and registers any JavaScript file in the `backend/services/monte-carlo-v2/distributions` directory that:
1. Is not `index.js` or `distributionBase.js`.
2. Exports a class that extends `DistributionGenerator`.

No manual registration is required—create the file, and the distribution will be available for use.

## Testing Your Distribution

Test your new distribution using the Monte Carlo V2 service:

```javascript
const monteCarloV2 = require('./services/monte-carlo-v2');

// Check if your distribution is registered
const types = monteCarloV2.getRegisteredDistributionTypes();
console.log('Registered types:', types);

// Validate parameters
const validation = monteCarloV2.validateParameters('myDistribution', {
  param1: 10,
  param2: 5
});
console.log('Validation result:', validation);

// Run a simulation
const result = await monteCarloV2.simulateDistribution({
  type: 'myDistribution',
  parameters: {
    param1: 10,
    param2: 5
  }
}, {
  iterations: 1000,
  years: 20,
  percentiles: [{ value: 50, description: 'primary' }]
});
console.log('Simulation result:', result);

// Verify statistics
console.log('Statistics:', result.simulationInfo[0].statistics);
```

**Testing Tips**:
- **Validation**: Ensure `validate` catches invalid parameters (e.g., negative values, missing parameters).
- **Generation**: Verify `generate` produces expected values using known seeds.
- **Statistics**: Check that analytical formulas (from formula providers) match expected values, and numerical fallbacks (e.g., max, skewness) are reasonable.
- **Time-Series**: Test with time-series parameters (e.g., `param1: [{ year: 1, value: 10 }, { year: 2, value: 12 }]`).
- **Edge Cases**: Test with zero iterations, single year, or extreme parameters.

## Best Practices

1. **Parameter Naming**: Use consistent names (e.g., `value` for mean, `scale` for scaling factors) to align with existing distributions.
2. **Validation**: Implement thorough checks in `validate` to prevent invalid simulations (e.g., ensure positive values for scale parameters).
3. **Formula Providers**: Provide analytical formulas for as many statistics as possible to improve accuracy and performance. Use numerical fallback for complex statistics (e.g., skewness for GBM).
4. **Documentation**: Include detailed `getMetadata` with clear parameter descriptions, constraints, and realistic examples.
5. **Error Handling**: Return `null` in formula providers for invalid parameters, and handle edge cases in `generate` and `fitCurve`.
6. **Testing**: Validate analytical formulas against theoretical values and numerical statistics against sample data.

## Example: Adding a Triangular Distribution

```javascript
// backend/services/monte-carlo-v2/distributions/triangular.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

class TriangularDistribution extends DistributionGenerator {
  initialize(parameters) {
    return {};
  }

  generate(year, random) {
    const min = this.getParameterValue('min', year, 0);
    const mode = this.getParameterValue('mode', year, 0.5);
    const max = this.getParameterValue('max', year, 1);
    
    const u = random();
    const fc = (mode - min) / (max - min);
    
    if (u < fc) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    }
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }

  static validate(parameters) {
    const errors = [];
    
    if (!validation.isValidParameter(parameters.min)) {
      errors.push("Minimum parameter must be a number or a valid time series");
    }
    if (!validation.isValidParameter(parameters.mode)) {
      errors.push("Mode parameter must be a number or a valid time series");
    }
    if (!validation.isValidParameter(parameters.max)) {
      errors.push("Maximum parameter must be a number or a valid time series");
    }
    
    if (typeof parameters.min === 'number' && typeof parameters.mode === 'number' && typeof parameters.max === 'number') {
      if (parameters.min > parameters.mode || parameters.mode > parameters.max) {
        errors.push("Must satisfy min <= mode <= max");
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }

  static getMetadata() {
    return {
      name: "Triangular Distribution",
      description: "Bounded distribution with minimum, mode, and maximum values",
      parameters: [
        {
          name: "min",
          description: "Minimum value",
          required: true,
          type: "number or time series",
          constraints: "must be less than or equal to mode"
        },
        {
          name: "mode",
          description: "Most likely value",
          required: true,
          type: "number or time series",
          constraints: "must be between min and max"
        },
        {
          name: "max",
          description: "Maximum value",
          required: true,
          type: "number or time series",
          constraints: "must be greater than or equal to mode"
        }
      ],
      examples: [
        {
          description: "Symmetric triangular distribution",
          parameters: { min: 0, mode: 0.5, max: 1 }
        },
        {
          description: "Skewed triangular distribution",
          parameters: { min: 0, mode: 0.2, max: 1 }
        }
      ]
    };
  }

  static fitCurve(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) {
      throw new Error("Data points are required for curve fitting");
    }
    const values = dataPoints.map(dp => dp.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const mode = 3 * mean - min - max; // Approximate mode
    return { min, mode: Math.max(min, Math.min(max, mode)), max };
  }

  getMeanFormula() {
    return (params, year) => {
      const min = this.getParameterValue('min', year, 0);
      const mode = this.getParameterValue('mode', year, 0.5);
      const max = this.getParameterValue('max', year, 1);
      return (min + mode + max) / 3;
    };
  }

  getStdDevFormula() {
    return (params, year) => {
      const min = this.getParameterValue('min', year, 0);
      const mode = this.getParameterValue('mode', year, 0.5);
      const max = this.getParameterValue('max', year, 1);
      return Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);
    };
  }

  getMinFormula() {
    return (params, year) => this.getParameterValue('min', year, 0);
  }

  getMaxFormula() {
    return (params, year) => this.getParameterValue('max', year, 1);
  }

  getSkewnessFormula() {
    return (params, year) => {
      const min = this.getParameterValue('min', year, 0);
      const mode = this.getParameterValue('mode', year, 0.5);
      const max = this.getParameterValue('max', year, 1);
      const denom = 5 * Math.pow(min * min + mode * mode + max * max - min * mode - min * max - mode * max, 1.5);
      return denom !== 0 ? (Math.sqrt(2) * (min + max - 2 * mode) * (max - min)) / denom : 0;
    };
  }
}

module.exports = TriangularDistribution;
```



---

### Explanation of Changes
The updated `ADDING_DISTRIBUTIONS.md` reflects the following changes and improvements:

1. **Added Formula Provider Methods**:
   - Included a new section under "Optional Methods" describing the formula provider methods (`getMeanFormula`, `getStdDevFormula`, `getMinFormula`, `getMaxFormula`, `getSkewnessFormula`, `getKurtosisFormula`).
   - Explained their purpose (providing analytical formulas for statistics), return types (function or `null`), and usage (with examples for a uniform distribution).
   - Clarified that these methods reduce the need to override `calculateStatistics`, with numerical fallback for `null` providers.

2. **Updated Current Distribution Types**:
   - Listed all 11 supported distributions: `normal`, `lognormal`, `triangular`, `uniform`, `weibull`, `exponential`, `poisson`, `fixed`, `kaimal`, `gbm`, `gamma`.
   - Provided brief descriptions to align with their implementations (e.g., Kaimal as wind turbulence model, GBM for stochastic processes).

3. **Updated Example Template**:
   - Modified the example `MyDistribution` to include sample formula provider overrides (`getMeanFormula`, `getStdDevFormula`, `getMinFormula`), demonstrating how to implement analytical statistics.
   - Kept the example generic to avoid distribution-specific assumptions.

4. **Clarified `calculateStatistics`**:
   - Added `calculateStatistics` as an optional method, noting it’s rarely needed due to formula providers.
   - Explained its input (`runningStatsByYear`, `years`) and output (statistics object with `DataPointSchema` arrays).

5. **Enhanced Testing Section**:
   - Added a step to verify statistics output, including analytical formulas and numerical fallbacks.
   - Included tips for testing time-series parameters, edge cases, and schema compliance.

6. **Best Practices**:
   - Added recommendations for using formula providers to optimize performance and accuracy.
   - Emphasized consistent parameter naming and thorough validation.
   - Encouraged detailed `getMetadata` for user-facing documentation.

7. **Example Distribution**:
   - Replaced the generic example with a complete `TriangularDistribution` implementation, showcasing all required methods and formula providers for mean, stdDev, min, max, and skewness.
   - Demonstrated practical validation (e.g., `min <= mode <= max`) and curve fitting.

8. **Auto-Discovery Confirmation**:
   - Retained the auto-discovery section, as it remains accurate.
   - Clarified that the registry scans the `distributions` directory for valid classes.

---

### Additional Updates
- **Outdated Information**: The original document was mostly accurate but lacked mention of the formula provider methods and the full list of distribution types. These have been addressed.
- **Interface Accuracy**: The interface description now includes all methods (`initialize`, `generate`, `validate`, `getMetadata`, `fitCurve`, formula providers, `updateYear`, `calculateStatistics`) and their roles.
- **Consistency**: Ensured terminology aligns with the codebase (e.g., `DataPointSchema`, `SimulationInfoSchema`) and reflects the Kaimal implementation.

---

### Notes
- **Kaimal Integration**: The document now implicitly supports Kaimal through the formula provider approach, as its overrides (`getMeanFormula`, `getStdDevFormula`, `getMinFormula`) follow the same pattern as other distributions.
- **Extensibility**: The formula provider approach makes adding new distributions straightforward, as developers only need to implement analytical formulas for supported statistics, with numerical fallback for others.
- **Testing Emphasis**: The testing section now highlights the importance of verifying both analytical and numerical statistics, especially for distributions like Kaimal with partial analytical formulas.

If you need further refinements or additional sections (e.g., specific parameter guidelines for each distribution), let me know!