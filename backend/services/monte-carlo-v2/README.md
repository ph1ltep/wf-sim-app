

# Monte Carlo V2 Simulation Engine Documentation

## Overview

The Monte Carlo V2 simulation engine is a sophisticated tool designed for financial and wind energy project simulations. This document provides a comprehensive guide to understanding the engine's architecture, interfaces, and usage patterns to facilitate proper integration with frontend applications.

## Table of Contents

1. [Engine Architecture](#engine-architecture)
2. [Available Distributions](#available-distributions)
3. [API Interface](#api-interface)
4. [Request/Response Patterns](#requestresponse-patterns)
5. [Simulation Results Structure](#simulation-results-structure)
6. [Working with Time Series Data](#working-with-time-series-data)
7. [Examples](#examples)
8. [Best Practices](#best-practices)
9. [Future Updates Prompt](#future-updates-prompt)

## Engine Architecture

The Monte Carlo V2 engine is built with a modular design, encapsulating different components:

- **Engine Core**: Manages iterations, random number seeding, and orchestration of the simulation
- **Distribution Factories**: Create statistical distributions based on type and parameters
- **Result Processors**: Format raw simulation results into standardized output structures
- **Validation Layer**: Validates inputs and outputs against schema definitions

The engine uses distributions to generate random samples based on specified parameters. These samples are then processed through various modules (revenue, cost, financing, risk) to simulate possible outcomes over the project lifetime.

## Available Distributions

The following distribution types are supported:

| Distribution | Description | Key Parameters |
|--------------|-------------|----------------|
| Normal | Bell curve | `mean`, `stdDev` |
| Lognormal | Skewed right | `mean`, `sigma` |
| Triangular | Three-point | `min`, `mode`, `max` |
| Uniform | Equal probability | `min`, `max` |
| Weibull | Failure analysis | `scale`, `shape` |
| Exponential | Time between events | `lambda` |
| Poisson | Discrete events | `lambda` |
| Fixed | Constant value | `value` |
| Kaimal | Wind turbulence | `meanWindSpeed`, `turbulenceIntensity`, `roughnessLength`, `kaimalScale`, `hubHeight` |
| GBM | Geometric Brownian Motion | `value` (initial), `drift`, `volatility`, `timeStep` |

Each distribution can operate in time series mode, where parameters may vary over time.

## API Interface

The Monte Carlo V2 engine is exposed through backend endpoints that allow running simulations, validating parameters, and retrieving distribution metadata. For detailed endpoint documentation, including request/response schemas and examples, refer to [simulationRoutes.md](../routes/simulationRoutes.md).

## Request/Response Patterns

### Simulation Request Pattern

1. **Define Distributions**: Specify one or more distributions with their parameters
2. **Configure Settings**: Set iterations, seed, years, and percentiles
3. **Submit Request**: Send to one of the simulation endpoints
4. **Process Response**: Handle the standardized response format

### Response Format

Responses follow the `SimResponseSchema`:

```javascript
{
  "success": true, // Boolean indicating success/failure
  "data": {
    "success": true,
    "simulationInfo": [
      {
        "distribution": {
          // Original distribution configuration
          "type": "Normal",
          "parameters": { "mean": 1000, "stdDev": 100 }
        },
        "iterations": 10000, // Number of iterations run
        "seed": 42, // Seed used
        "years": 20, // Years simulated
        "timeElapsed": 235, // Simulation time in milliseconds
        "results": [
          {
            "name": "distribution_1", // Distribution name/ID
            "percentile": {
              "value": 50,
              "description": "primary"
            },
            "data": [
              { "year": 1, "value": 1002.3 },
              { "year": 2, "value": 998.7 }
              // ... additional years
            ]
          }
          // ... results for other percentiles
        ],
        "errors": [] // Any errors for this distribution
      }
      // ... info for other distributions
    ]
  }
}
```

## Simulation Results Structure

The results section of the response contains:

1. **Percentile-Based Data**: For each requested percentile (e.g., P10, P50, P90), a time series of values
2. **Annual Data**: Values for each year of the project lifetime
3. **Metrics**: Summary statistics calculated across all iterations

Understanding the structure:

- Each distribution produces its own set of results
- Results are organized by percentiles (P10, P25, P50, P75, P90)
- Each percentile contains a time series of data points
- The time series represents annual values over the project lifetime

### Key Result Properties

- `name`: Identifier for the distribution or result set
- `percentile`: Object containing the percentile information
- `data`: Array of year-value pairs with the simulation results

## Working with Time Series Data

The engine supports time-varying parameters through its time series mode:

1. **Enabling Time Series Mode**: Set `timeSeriesMode: true` in the distribution configuration
2. **Time-Varying Parameters**: Instead of a single value, provide an array of year-value pairs:

```javascript
{
  "type": "Normal",
  "timeSeriesMode": true,
  "parameters": {
    "mean": [
      { "year": 1, "value": 1000 },
      { "year": 2, "value": 1050 },
      { "year": 3, "value": 1100 }
    ],
    "stdDev": 100
  }
}
```

This allows modeling changing conditions over the project lifetime, such as:
- Increasing electricity prices
- Degrading equipment performance
- Changing operational parameters

## Examples

### Basic Distribution Simulation

```javascript
// Request
{
  "distributions": [
    {
      "id": "energy_production",
      "type": "Normal",
      "parameters": {
        "mean": 1000,
        "stdDev": 100
      }
    }
  ],
  "simulationSettings": {
    "iterations": 10000,
    "seed": 42,
    "years": 20
  }
}

// Response (simplified)
{
  "success": true,
  "data": {
    "simulationInfo": [
      {
        "distribution": { /* original distribution */ },
        "results": [
          {
            "name": "energy_production",
            "percentile": { "value": 50, "description": "primary" },
            "data": [
              { "year": 1, "value": 998.2 },
              { "year": 2, "value": 1003.5 }
              // ... more years
            ]
          }
          // ... more percentiles
        ]
      }
    ]
  }
}
```

### Multiple Distributions

```javascript
// Request
{
  "distributions": [
    {
      "id": "energy_production",
      "type": "Normal",
      "parameters": {
        "mean": 1000,
        "stdDev": 100
      }
    },
    {
      "id": "electricity_price",
      "type": "GBM",
      "parameters": {
        "value": 50,
        "drift": 0.03,
        "volatility": 0.15,
        "timeStep": 1
      }
    }
  ],
  "simulationSettings": {
    "iterations": 10000,
    "seed": 42,
    "years": 20
  }
}
```

### Time Series Parameters

```javascript
// Request
{
  "distributions": [
    {
      "id": "degrading_production",
      "type": "Normal",
      "timeSeriesMode": "true",
      "parameters": {
        "mean": [
          { "year": 1, "value": 1000 },
          { "year": 5, "value": 950 },
          { "year": 10, "value": 900 },
          { "year": 20, "value": 800 }
        ],
        "stdDev": 50
      }
    }
  ],
  "simulationSettings": {
    "iterations": 10000,
    "seed": 42,
    "years": 20
  }
}
```

## Best Practices

1. **Use Descriptive IDs**: Assign meaningful IDs to distributions for easier tracking and reference
2. **Limit Iterations Appropriately**: Start with lower iterations (1,000-5,000) for testing, increasing to 10,000+ for final runs
3. **Set Fixed Seeds**: Use consistent random seeds for reproducible results during development
4. **Error Handling**: Always check the `success` flag and `errors` array in responses
5. **Percentile Selection**: Choose percentiles that match your risk assessment needs:
   - P50 (median): Expected case
   - P90 (conservative): Used for financing and risk assessment
   - P10 (optimistic): Used for upside potential analysis
6. **Parameter Validation**: Use the `/validate` endpoint to check parameter validity before running full simulations
7. **Data Visualization**: Plot results across multiple percentiles to show the range of possible outcomes

### Frontend Implementation Tips

1. **Progress Indicators**: Monte Carlo simulations can take time; implement loading indicators
2. **Caching Results**: Store simulation results to avoid re-running identical simulations
3. **Interactive Visualization**: Allow users to toggle between different percentiles in charts
4. **Parameter Exploration**: Implement controls for adjusting distribution parameters and comparing results
5. **Sensitivity Analysis**: Provide ways to run multiple simulations with varying parameters to identify key drivers

## Future Updates Prompt

To keep this document accurate, use the following prompt to regenerate the `readme.md`:

```
I have updated the Monte Carlo V2 simulation engine code in `backend/services/monte-carlo-v2` or related files. Please regenerate the `readme.md` in `backend/services/monte-carlo-v2` with the following structure and details:

- **Title**: Monte Carlo V2 Simulation Engine Documentation
- **Sections**: 
  - Overview: Describe the engine’s purpose for financial and wind energy simulations.
  - Table of Contents: List all sections with links.
  - Engine Architecture: Explain the modular design (Engine Core, Distribution Factories, Result Processors, Validation Layer).
  - Available Distributions: Table of distribution types, descriptions, and key parameters (Normal, Lognormal, etc.).
  - API Interface: Reference `backend/routes/simulationRoutes.md` for endpoint details, avoiding inline endpoint descriptions.
  - Request/Response Patterns: Describe simulation request steps and `SimResponseSchema` structure.
  - Simulation Results Structure: Explain percentile-based data, annual data, and metrics.
  - Working with Time Series Data: Detail `timeSeriesMode` and year-value parameter arrays.
  - Examples: Provide simplified request/response JSON for basic, multiple, and time-series simulations.
  - Best Practices: List guidelines for IDs, iterations, seeds, error handling, percentiles, validation, and visualization, including frontend tips.
  - Future Updates Prompt: Include this prompt for consistency.
- **Formatting**: 
  - Use concise, technical language suitable for developers.
  - Ensure only Markdown output lines start with  (explanations or other content use normal lines).
  - Link to `backend/routes/simulationRoutes.md` in the API Interface section.
- **Content**: 
  - Retain the modular architecture focus and practical integration guidance.
  - Update only the API Interface section to reference `simulationRoutes.md` unless other changes are specified.
  - Preserve existing examples and best practices unless updates are provided.

Focus on accuracy, clarity, and maintaining the document as a comprehensive guide for integrating the Monte Carlo V2 engine with frontend applications.
```

