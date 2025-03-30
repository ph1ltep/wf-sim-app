// src/components/common/NavigationGuard.jsx
import React, { useEffect } from 'react';
import { Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useScenario } from '../../contexts/ScenarioContext';

const NavigationGuard = ({ children }) => {
  const { hasUnsavedChanges, saveScenario } = useScenario();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    console.log('Navigation Guard mounted, unsaved changes:', hasUnsavedChanges);
    
    // Handle browser navigation events (back/forward buttons, refresh)
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        console.log('Preventing unload due to unsaved changes');
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  // This useEffect is for debugging purposes
  useEffect(() => {
    console.log('Location changed to:', location.pathname);
  }, [location]);

  return children;
};

export default NavigationGuard;