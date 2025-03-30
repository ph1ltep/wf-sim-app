// src/hooks/useNavigationProtection.js
import { useEffect, useCallback } from 'react';
import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { useScenario } from '../contexts/ScenarioContext';

// This hook returns a protected version of the navigate function
export const useNavigate = () => {
  const originalNavigate = useRouterNavigate();
  const location = useLocation();
  const { hasUnsavedChanges, saveScenario } = useScenario();
  
  // Create a protected navigate function that shows confirmation when needed
  const protectedNavigate = useCallback((to, options) => {
    console.log("Navigation requested to:", to);
    console.log("Current path:", location.pathname);
    console.log("Has unsaved changes:", hasUnsavedChanges);
    
    // Check if this is a navigation to a different path and we have unsaved changes
    if (hasUnsavedChanges && typeof to === 'string' && to !== location.pathname) {
      console.log("Showing navigation confirmation modal");
      
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes that will be lost if you navigate away. What would you like to do?',
        okText: 'Save & Continue',
        cancelText: 'Discard Changes',
        onOk: async () => {
          console.log("User chose to save changes");
          try {
            const result = await saveScenario();
            console.log("Save result:", result);
            originalNavigate(to, options);
          } catch (error) {
            console.error("Error saving scenario:", error);
          }
        },
        onCancel: () => {
          console.log("User chose to discard changes");
          originalNavigate(to, options);
        },
      });
    } else {
      // Otherwise proceed normally
      console.log("Proceeding with navigation normally");
      originalNavigate(to, options);
    }
  }, [originalNavigate, hasUnsavedChanges, location.pathname, saveScenario]);
  
  return protectedNavigate;
};

// This hook protects against browser navigation and can be used in any component
export const useBeforeUnloadProtection = () => {
  const { hasUnsavedChanges } = useScenario();
  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        // Standard browser unsaved changes warning (doesn't allow custom message in most browsers)
        e.preventDefault();
        e.returnValue = 'You have unsaved changes that will be lost if you leave.';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
};