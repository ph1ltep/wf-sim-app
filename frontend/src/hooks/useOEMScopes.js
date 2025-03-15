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
      
      // Restructure the form data to match the API expectations
      const data = restructureFormData(formData);
      
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
      
      // Restructure the form data to match the API expectations
      const data = restructureFormData(formData);
      
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
      
      // Restructure the form data to match the API expectations
      const data = restructureFormData(formData);
      
      // Since the backend name generator may not be updated yet, let's create a client-side
      // implementation that follows the new schema while we wait for backend updates
      const generateLocalName = (data) => {
        const parts = [];
        
        // Preventive Maintenance
        if (data.preventiveMaintenance) parts.push('PM');
        if (data.bladeInspections) parts.push('BI');
        
        // Remote Support
        if (data.remoteMonitoring) parts.push('RM');
        if (data.remoteTechnicalSupport) parts.push('RTS');
        
        // Site Personnel
        if (data.siteManagement) parts.push('SM');
        
        // Handle technician percentage correctly
        const techPercent = data.technicianPercent;
        if (techPercent !== undefined && techPercent > 0) {
          if (techPercent === 100) {
            parts.push('FT'); // Full Technicians
          } else {
            parts.push(`T${techPercent}`); // Technicians with percentage
          }
        }
        
        // Corrective Maintenance
        if (data.correctiveMinor) parts.push('CMin');
        if (data.bladeIntegrityManagement) parts.push('BIM');
        
        if (data.correctiveMajor) {
          const majorParts = [];
          if (data.correctiveMajorDetails.crane) majorParts.push('C');
          if (data.correctiveMajorDetails.tooling) majorParts.push('T');
          if (data.correctiveMajorDetails.manpower) majorParts.push('M');
          if (data.correctiveMajorDetails.parts) majorParts.push('P');
          
          if (majorParts.length > 0) {
            parts.push(`CMaj(${majorParts.join('')})`);
          } else {
            parts.push('CMaj');
          }
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
    const restructured = {
      ...formData,
      // Structure the correctiveMajorDetails
      correctiveMajorDetails: {
        crane: formData['correctiveMajorDetails.crane'] || false,
        tooling: formData['correctiveMajorDetails.tooling'] || false,
        manpower: formData['correctiveMajorDetails.manpower'] || false,
        parts: formData['correctiveMajorDetails.parts'] || false
      },
      // Ensure site personnel fields are properly set
      siteManagement: formData.siteManagement || false,
      technicianPercent: formData.technicianPercent !== undefined ? parseInt(formData.technicianPercent) : 100,
      // Remove old blade properties if they exist
      blade: undefined,
      bladeLEP: undefined
    };
    
    // Ensure technicianPercent is a number
    if (isNaN(restructured.technicianPercent)) {
      restructured.technicianPercent = 0;
    }
    
    // Remove the flattened correctiveMajorDetails properties
    delete restructured['correctiveMajorDetails.crane'];
    delete restructured['correctiveMajorDetails.tooling'];
    delete restructured['correctiveMajorDetails.manpower'];
    delete restructured['correctiveMajorDetails.parts'];
    
    console.log('Restructured data:', restructured); // Log to verify site personnel data
    
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