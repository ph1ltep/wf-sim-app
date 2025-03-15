// src/hooks/useOEMScopes.js
import { useState, useEffect } from 'react';
import { message } from 'antd';
import { 
  getAllOEMScopes, 
  getOEMScopeById, 
  createOEMScope, 
  generateOEMScopeName,
  updateOEMScope, 
  deleteOEMScope 
} from '../api/oemScopes';

/**
 * Custom hook for managing OEM scopes data and operations
 */
const useOEMScopes = () => {
  const [oemScopes, setOEMScopes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateNameLoading, setGenerateNameLoading] = useState(false);
  
  // Fetch OEM scopes data
  const fetchOEMScopes = async () => {
    try {
      setLoading(true);
      const response = await getAllOEMScopes();
      
      // Transform data format - add key property for Table
      const transformedData = response.data.map(scope => ({
        key: scope._id,
        ...scope
      }));
      
      setOEMScopes(transformedData);
      return transformedData;
    } catch (error) {
      message.error('Failed to fetch OEM scopes');
      console.error('Error fetching OEM scopes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new OEM scope
  const createScope = async (formData) => {
    try {
      setLoading(true);
      console.log('Form data before restructuring:', formData);
      
      // Restructure the form data to match the API expectations
      const data = restructureFormData(formData);
      console.log('Data after restructuring:', data);
      
      const response = await createOEMScope(data);
      const newScope = {
        key: response.data._id,
        ...response.data
      };
      
      setOEMScopes(prevScopes => [...prevScopes, newScope]);
      message.success('OEM scope added successfully');
      return { success: true, data: newScope };
    } catch (error) {
      handleError(error, 'Failed to add OEM scope');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing OEM scope
  const updateScope = async (id, formData) => {
    try {
      setLoading(true);
      console.log('Form data before restructuring:', formData);
      
      // Restructure the form data to match the API expectations
      const data = restructureFormData(formData);
      console.log('Data after restructuring:', data);
      
      const response = await updateOEMScope(id, data);
      
      setOEMScopes(prevScopes => {
        const index = prevScopes.findIndex(scope => scope.key === id);
        if (index > -1) {
          const updatedScopes = [...prevScopes];
          updatedScopes[index] = {
            key: id,
            ...response.data
          };
          return updatedScopes;
        }
        return prevScopes;
      });
      
      message.success('OEM scope updated successfully');
      return { success: true };
    } catch (error) {
      handleError(error, 'Failed to update OEM scope');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Delete an OEM scope
  const deleteScope = async (id) => {
    try {
      setLoading(true);
      await deleteOEMScope(id);
      
      setOEMScopes(prevScopes => prevScopes.filter(scope => scope.key !== id));
      message.success('OEM scope deleted successfully');
      return { success: true };
    } catch (error) {
      message.error('Failed to delete OEM scope');
      console.error('Error deleting OEM scope:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Generate a name based on form data
  const generateName = async (formData) => {
    try {
      setGenerateNameLoading(true);
      console.log('Form data for name generation:', formData);
      
      // Restructure the form data to match the API expectations
      const data = restructureFormData(formData);
      
      // Since the backend name generator may not be updated yet, let's create a client-side
      // implementation that follows the new schema while we wait for backend updates
      const generateLocalName = (data) => {
        const parts = [];
        
        // Preventive Maintenance
        if (data.preventiveMaintenance === true) parts.push('PM');
        if (data.bladeInspections === true) parts.push('BI');
        
        // Remote Support
        if (data.remoteMonitoring === true) parts.push('RM');
        if (data.remoteTechnicalSupport === true) parts.push('RTS');
        
        // Site Personnel
        if (data.siteManagement === true) parts.push('SM');
        
        // Handle technician percentage correctly
        const techPercent = data.technicianPercent;
        if (typeof techPercent === 'number' && techPercent > 0) {
          if (techPercent === 100) {
            parts.push('FT'); // Full Technicians
          } else {
            parts.push(`T${techPercent}`); // Technicians with percentage
          }
        }
        
        // Corrective Maintenance
        if (data.correctiveMinor === true) parts.push('CMin');
        if (data.bladeIntegrityManagement === true) parts.push('BIM');
        
        // Crane Coverage (now independent)
        if (data.craneCoverage === true) {
          let cranePart = 'Crane';
          if (data.craneEventCap > 0 || data.craneFinancialCap > 0) {
            cranePart += 'Cap';
          }
          parts.push(cranePart);
        }
        
        if (data.correctiveMajor === true) {
          const majorParts = [];
          if (data.correctiveMajorDetails.tooling === true) majorParts.push('T');
          if (data.correctiveMajorDetails.manpower === true) majorParts.push('M');
          if (data.correctiveMajorDetails.parts === true) majorParts.push('P');
          
          let majorStr = 'CMaj';
          if (majorParts.length > 0) {
            majorStr += `(${majorParts.join('')})`;
          }
          
          if (data.majorEventCap > 0 || data.majorFinancialCap > 0) {
            majorStr += 'Cap';
          }
          
          parts.push(majorStr);
        }
        
        // If no parts selected, use a default name
        if (parts.length === 0) {
          return 'Basic-OEM-Scope';
        }
        
        return parts.join('-');
      };
      
      // Try to use the backend name generator first
      try {
        const response = await generateOEMScopeName(data);
        if (response.success && response.data && response.data.name) {
          message.success('Name generated successfully');
          return { success: true, name: response.data.name };
        }
      } catch (error) {
        console.warn('Backend name generator failed, using local generator:', error);
      }
      
      // Fall back to the local name generator if backend fails
      const localName = generateLocalName(data);
      message.success('Name generated successfully');
      return { success: true, name: localName };
      
    } catch (error) {
      message.error('Failed to generate name');
      console.error('Error generating name:', error);
      return { success: false, error };
    } finally {
      setGenerateNameLoading(false);
    }
  };
  
  // Helper function to handle API errors
  const handleError = (error, defaultMessage) => {
    if (error.response?.status === 400) {
      message.error(error.response?.data?.error || 'Validation failed. Please check your inputs.');
    } else {
      message.error(defaultMessage);
      console.error(defaultMessage, error);
    }
  };
  
  // Helper function to restructure form data for API
  const restructureFormData = (formData) => {
    // Create a clean copy without undefined values
    const restructured = {};
    
    // Copy all primitive values directly
    Object.keys(formData).forEach(key => {
      // Skip the nested correctiveMajorDetails for special handling
      if (!key.startsWith('correctiveMajorDetails.')) {
        restructured[key] = formData[key];
      }
    });
    
    // Handle technician percent properly
    restructured.technicianPercent = formData.technicianPercent !== undefined ? 
      parseInt(formData.technicianPercent) : 
      (formData.siteManagement ? 100 : 0);
    
    // Ensure technicianPercent is a valid number
    if (isNaN(restructured.technicianPercent)) {
      restructured.technicianPercent = 0;
    }
    
    // Handle boolean values properly - ensure they are true/false, not undefined
    const booleanFields = [
      'preventiveMaintenance', 'bladeInspections', 'remoteMonitoring', 
      'remoteTechnicalSupport', 'siteManagement', 'correctiveMinor',
      'bladeIntegrityManagement', 'correctiveMajor', 'craneCoverage'
    ];
    
    booleanFields.forEach(field => {
      restructured[field] = !!restructured[field];
    });
    
    // Handle cap values
    restructured.craneEventCap = formData.craneEventCap || 0;
    restructured.craneFinancialCap = formData.craneFinancialCap || 0;
    restructured.majorEventCap = formData.majorEventCap || 0;
    restructured.majorFinancialCap = formData.majorFinancialCap || 0;
    
    // Handle sitePersonnel for backend compatibility (if needed)
    // If the backend uses sitePersonnel enum instead of separate fields
    if (restructured.siteManagement) {
      // Map to 'full' or 'partial' based on technician percentage
      restructured.sitePersonnel = restructured.technicianPercent === 100 ? 'full' : 'partial';
    } else {
      restructured.sitePersonnel = 'none';
    }
    
    // Structure the correctiveMajorDetails properly
    restructured.correctiveMajorDetails = {
      tooling: !!formData['correctiveMajorDetails.tooling'],
      manpower: !!formData['correctiveMajorDetails.manpower'],
      parts: !!formData['correctiveMajorDetails.parts']
    };
    
    // Remove the flattened properties to avoid duplication
    delete restructured['correctiveMajorDetails.crane'];
    delete restructured['correctiveMajorDetails.tooling'];
    delete restructured['correctiveMajorDetails.manpower'];
    delete restructured['correctiveMajorDetails.parts'];
    
    return restructured;
  };
  
  // Initialize data on mount
  useEffect(() => {
    fetchOEMScopes();
  }, []);
  
  return {
    oemScopes,
    loading,
    generateNameLoading,
    fetchOEMScopes,
    createScope,
    updateScope,
    deleteScope,
    generateName
  };
};

export default useOEMScopes;