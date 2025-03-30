// src/components/common/NavigationBlocker.jsx
import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

const NavigationBlocker = () => {
  const { hasUnsavedChanges, saveScenario } = useScenario();
  const navigate = useNavigate();
  const location = useLocation();

  // Store the original navigate function
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    // Keep a reference to the original navigate function
    const originalNavigate = navigate;
    
    // Override the navigate function
    const customNavigate = (to, options) => {
      // Only intercept navigation to different paths
      if (typeof to === 'string' && to !== location.pathname) {
        Modal.confirm({
          title: 'Unsaved Changes',
          content: 'You have unsaved changes. What would you like to do?',
          okText: 'Save & Continue',
          cancelText: 'Discard Changes',
          onOk: async () => {
            await saveScenario();
            originalNavigate(to, options);
          },
          onCancel: () => {
            originalNavigate(to, options);
          },
        });
        return;
      }
      
      // Otherwise proceed normally
      originalNavigate(to, options);
    };
    
    // Replace the navigate function
    navigate.original = originalNavigate;
    Object.keys(originalNavigate).forEach(key => {
      customNavigate[key] = originalNavigate[key];
    });
    
    // Apply the override (this is not a complete solution but demonstrates the approach)
    // In a real implementation, you would need to find a way to globally override the navigate function
    
    return () => {
      // Restore the original navigate function when component unmounts
      if (navigate.original) {
        navigate = navigate.original;
      }
    };
  }, [hasUnsavedChanges, location.pathname, navigate, saveScenario]);

  return null;
};

export default NavigationBlocker;