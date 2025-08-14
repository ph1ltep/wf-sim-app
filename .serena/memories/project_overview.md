# Wind Farm Simulation Application - Project Overview

## Purpose
Wind Farm Simulation Application (wf-sim-app) is a full-stack risk analysis and visualization tool for wind energy projects featuring Monte Carlo simulations, financial modeling, and sensitivity analysis.

## Tech Stack
- **Architecture**: MERN stack (MongoDB, Express.js, React, Node.js)
- **Frontend**: React 19 + Ant Design UI + React Router + Plotly.js for visualizations
- **Backend**: Express.js + MongoDB with Mongoose + Monte Carlo simulation engine
- **Validation**: Yup schemas shared between frontend and backend
- **Additional Libraries**: 
  - Frontend: Immer (immutable updates), Axios (HTTP), React Hook Form, Formik
  - Backend: jStat, mathjs, financial calculations, random number generation

## Key Features
- Monte Carlo simulation engine with 11 distribution types (Normal, Lognormal, Weibull, GBM, etc.)
- Time-series support and percentile analysis
- Financial modeling and sensitivity analysis
- Risk analysis and visualization tools
- Shared validation system using Yup schemas
- Real-time data validation and form handling

## Database
- **Primary**: MongoDB with Mongoose ODM
- **Collections**: Scenarios, Locations, OEM Scopes, Major Components
- **Schema Management**: Auto-generated Mongoose schemas from Yup schemas