# Adding New Distributions

This guide explains how to add new distribution types to the Monte Carlo V2 engine.

## Overview

The Monte Carlo V2 engine uses an object-oriented, modular approach to distributions. Adding a new distribution is as simple as creating a new file that extends the base `DistributionGenerator` class and implements the required methods.

## Steps to Add a New Distribution

1. Create a new file in the `/distributions` directory, named after your distribution (e.g., `triangular.js`).
2. Extend the `DistributionGenerator` base class.
3. Implement all required methods.
4. The new distribution will be auto-discovered and registered automatically.

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
    // Extract values from data points
    const values = dataPoints.map(dp => dp.value);
    
    // Calculate parameter estimates
    
    return {
      param1: estimatedParam1,
      param2: estimatedParam2
    };
  }
}

module.exports = MyDistribution;
```

## Required Methods

Each distribution must implement the following methods:

### `initialize(parameters)`
- Set up any internal state needed for generating values.
- Return an object with the initial state.

### `generate(year, random)`
- Generate a random value from the distribution.
- Use `this.getParameterValue(name, year, defaultValue)` to get parameter values, which automatically handles time series.
- The `random()` function provides a seeded random value between 0 and 1.

### `static validate(parameters)`
- Validate the parameters provided to the distribution.
- Return an object with `isValid` flag and `errors` array.

### `static getMetadata()`
- Provide metadata about the distribution for documentation.
- Include name, description, parameters, and usage examples.

### `static fitCurve(dataPoints)`
- Fit the distribution parameters to a set of data points.
- Return an object with the estimated parameters.

## Optional Methods

### `updateYear(year)`
- Update any internal state when moving to a new year.
- Useful for distributions with time dependencies.

## Auto-Discovery

The distribution registry automatically discovers and registers any JavaScript file in the `/distributions` directory that:
1. Is not `index.js` or `distributionBase.js`
2. Exports a class that extends `DistributionGenerator`

You do not need to manually register your distribution - just create the file and it will be available.

## Testing Your Distribution

You can test your new distribution with the following code:

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
```