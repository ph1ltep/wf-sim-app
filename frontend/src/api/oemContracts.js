// src/api/oemContracts.js
import api from './index';

// OEM contracts are now stored within scenario settings, so we shouldn't
// have separate API endpoints for them. Instead, we work with scenario data.

// This function is just for backward compatibility
export const getAllOEMContracts = async () => {
  console.log("Note: OEM contracts are now stored within scenario settings");
  return { success: true, data: [] };
};

// For any actual contract operations, we should use the scenario API