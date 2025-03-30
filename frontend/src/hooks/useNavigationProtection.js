// src/hooks/useNavigationProtection.js
import { useEffect, useCallback } from 'react';
import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { useScenario } from '../contexts/ScenarioContext';

// This hook returns a protected version of the navigate function
export const useNavigate = () => {
  const navigate = useRouterNavigate();
  const location = useLocation();
  const { hasUnsavedChanges, saveScenario } = useScenario();
  
  const protectedNavigate = useCallback((to, options) => {
    // Check if this is a navigation to a different path and we have unsaved changes
    if (hasUnsavedChanges && typeof to === 'string' && to !== location.pathname) {
      Modal.confirm({
        title: 'Unsaved Changes',
        content: 'You have unsaved changes. What would you like to do?',
        okText: 'Save & Continue',
        cancelText: 'Discard Changes',
        onOk: async () => {
          await saveScenario();
          navigate(to, options);
        },
        onCancel: () => {
          navigate(to, options);
        },
      });
    } else {
      // Otherwise proceed normally
      navigate(to, options);
    }
  }, [navigate, hasUnsavedChanges, location.pathname, saveScenario]);
  
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
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
};