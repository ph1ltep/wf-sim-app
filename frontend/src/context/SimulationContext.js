// frontend/src/context/SimulationContext.js
import React, { createContext, useState } from 'react';

export const SimulationContext = createContext();

export const SimulationProvider = ({ children }) => {
  const [simulationData, setSimulationData] = useState({
    params: null,
    results: null,
  });

  return (
    <SimulationContext.Provider value={{ simulationData, setSimulationData }}>
      {children}
    </SimulationContext.Provider>
  );
};
