// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { SimulationProvider } from './context/SimulationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <SimulationProvider>
    <App />
  </SimulationProvider>
);
