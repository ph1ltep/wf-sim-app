// src/components/tables/inline/EditableCell.jsx - Reusable editable cell component
import React from 'react';
import { InputNumber, Input } from 'antd';

/**
 * Get appropriate Ant Design component based on field type
 * @param {string} fieldType - Field type ('currency', 'number', 'percentage', etc.)
 * @returns {React.Component} Ant Design component
 */
export const getComponentByType = (fieldType) => {
  switch (fieldType) {
    case 'currency':
    case 'number':
      return InputNumber;
    case 'percentage':
      return InputNumber;
    default:
      return Input;
  }
};

/**
 * Validate cell value based on field configuration
 * @param {any} value - Value to validate
 * @param {Object} fieldConfig - Field configuration with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateCellValue = (value, fieldConfig) => {
  if (value === null || value === undefined || value === '') {
    return null; // Allow empty values
  }
  
  if (fieldConfig.type === 'currency' || fieldConfig.type === 'number' || fieldConfig.type === 'percentage') {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      return 'Must be a number';
    }
    
    if (fieldConfig.validation) {
      if (fieldConfig.validation.min !== undefined && num < fieldConfig.validation.min) {
        return `Minimum value is ${fieldConfig.validation.min}`;
      }
      if (fieldConfig.validation.max !== undefined && num > fieldConfig.validation.max) {
        return `Maximum value is ${fieldConfig.validation.max}`;
      }
      if (fieldConfig.validation.precision !== undefined) {
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > fieldConfig.validation.precision) {
          return `Maximum ${fieldConfig.validation.precision} decimal places allowed`;
        }
      }
    }
  }
  
  return null;
};

/**
 * Navigate to a specific cell in the table
 * @param {HTMLTableElement} table - Table element
 * @param {number} rowIndex - Target row index (excluding header)
 * @param {number} cellIndex - Target cell index
 */
export const navigateToCell = (table, rowIndex, cellIndex) => {
  const targetRow = table.rows[rowIndex + 1]; // Add 1 for header row
  if (targetRow && targetRow.cells[cellIndex]) {
    const targetInput = targetRow.cells[cellIndex].querySelector('input');
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  }
};

/**
 * EditableCell - Reusable cell component for inline table editing
 * 
 * @param {any} value - Current cell value
 * @param {Function} onChange - Value change handler
 * @param {number} rowIndex - Row index for navigation
 * @param {number|string} year - Year/column identifier for navigation
 * @param {Object} fieldConfig - Field configuration with type and validation
 * @param {boolean} disabled - Whether cell is disabled
 * @param {Set} modifiedCells - Set of modified cell keys
 * @param {Map} validationErrors - Map of validation errors by cell key
 * @param {Function} onCellValidation - Validation handler
 * @param {Function} onCellModification - Modification tracking handler
 */
const EditableCell = ({ 
  value, 
  onChange, 
  rowIndex, 
  year, 
  fieldConfig, 
  disabled = false,
  modifiedCells = new Set(),
  validationErrors = new Map(),
  onCellValidation,
  onCellModification
}) => {
  const cellKey = `${rowIndex}-${year}`;
  const hasError = validationErrors.has(cellKey);
  const isModified = modifiedCells.has(cellKey);
  
  const handleChange = (newValue) => {
    // Mark as modified
    if (onCellModification) {
      onCellModification(cellKey);
    }
    
    // Validate
    const error = validateCellValue(newValue, fieldConfig);
    if (onCellValidation) {
      onCellValidation(cellKey, error);
    }
    
    // Update data
    onChange(newValue);
  };
  
  const handleKeyDown = (e) => {
    // Keyboard navigation
    const currentCell = e.target;
    const table = currentCell.closest('table');
    const currentRow = currentCell.closest('tr');
    const currentCellIndex = Array.from(currentRow.cells).indexOf(currentCell.closest('td'));
    const currentRowIndex = Array.from(table.rows).indexOf(currentRow) - 1; // Subtract header row
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateToCell(table, currentRowIndex - 1, currentCellIndex);
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateToCell(table, currentRowIndex + 1, currentCellIndex);
        break;
      case 'ArrowLeft':
        if (e.target.selectionStart === 0) {
          e.preventDefault();
          navigateToCell(table, currentRowIndex, currentCellIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (e.target.selectionStart === e.target.value.length) {
          e.preventDefault();
          navigateToCell(table, currentRowIndex, currentCellIndex + 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        navigateToCell(table, currentRowIndex + 1, currentCellIndex);
        break;
      case 'Escape':
        e.target.blur();
        break;
    }
  };
  
  const cellStyle = {
    backgroundColor: isModified 
      ? (hasError ? 'rgba(255, 77, 79, 0.1)' : 'rgba(24, 144, 255, 0.1)')
      : 'transparent',
    borderColor: hasError ? '#ff4d4f' : undefined,
    transition: 'all 0.2s',
    width: '100%'
  };
  
  const componentProps = {
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    disabled,
    size: 'small',
    style: cellStyle,
    placeholder: disabled ? '-' : '0'
  };
  
  // Add field-specific props
  if (fieldConfig.type === 'currency' || fieldConfig.type === 'number') {
    componentProps.min = fieldConfig.validation?.min;
    componentProps.max = fieldConfig.validation?.max;
    componentProps.precision = fieldConfig.validation?.precision;
    componentProps.step = fieldConfig.type === 'currency' ? 1000 : 
                          fieldConfig.type === 'percentage' ? 0.1 : 1;
    
    if (fieldConfig.type === 'currency') {
      componentProps.formatter = value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      componentProps.parser = value => value?.replace(/,/g, '');
    } else if (fieldConfig.type === 'percentage') {
      componentProps.formatter = value => `${value}%`;
      componentProps.parser = value => value?.replace('%', '');
    }
  }
  
  const Component = getComponentByType(fieldConfig.type);
  
  return (
    <div style={{ position: 'relative' }}>
      <Component {...componentProps} />
      {hasError && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          fontSize: '10px',
          color: '#ff4d4f',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          backgroundColor: 'white',
          padding: '2px 4px',
          border: '1px solid #ff4d4f',
          borderRadius: '2px'
        }}>
          {validationErrors.get(cellKey)}
        </div>
      )}
    </div>
  );
};

export default EditableCell;