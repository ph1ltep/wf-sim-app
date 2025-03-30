// src/hooks/useCustomNavigate.js
import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { Modal } from 'antd';
import { useScenario } from '../contexts/ScenarioContext';

export const useCustomNavigate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasUnsavedChanges, saveScenario } = useScenario();
  
  const customNavigate = useCallback((to, options) => {
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
  
  return customNavigate;
};