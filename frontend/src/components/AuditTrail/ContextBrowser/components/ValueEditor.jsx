// src/components/AuditTrail/ContextBrowser/components/ValueEditor.jsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input, Select, Button, Space, Typography, message, Tooltip } from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined, 
  CheckOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { formatValueForEdit, parseEditedValue } from '../utils/contextUtils';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * Inline value editor component
 * @param {Object} props - Component props
 * @param {string} props.path - Path of the value being edited
 * @param {any} props.value - Current value
 * @param {string} props.type - Value type
 * @param {Function} props.onSave - Save handler function
 * @param {boolean} props.disabled - Whether editing is disabled
 */
const ValueEditor = ({
  path,
  value,
  type,
  onSave,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef(null);
  
  // Initialize edit value when editing starts
  const startEditing = useCallback(() => {
    if (disabled) return;
    
    setIsEditing(true);
    setEditValue(formatValueForEdit(value, type));
    setHasError(false);
  }, [value, type, disabled]);
  
  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setHasError(false);
  }, []);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setHasError(false);
      
      // Parse the edited value
      const parsedValue = parseEditedValue(editValue, type);
      
      if (parsedValue === null && editValue.trim() !== '' && type !== 'string') {
        setHasError(true);
        message.error(`Invalid ${type} value: ${editValue}`);
        return;
      }
      
      // Call save handler
      const success = await onSave(path, parsedValue);
      
      if (success) {
        setIsEditing(false);
        setEditValue('');
        message.success('Value updated successfully');
      } else {
        setHasError(true);
      }
      
    } catch (error) {
      console.error('Error saving value:', error);
      setHasError(true);
      message.error('Failed to save value');
    } finally {
      setIsLoading(false);
    }
  }, [editValue, type, path, onSave, isLoading]);
  
  // Handle key events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [handleSave, cancelEditing]);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'string' && inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);
  
  // Render different input types based on value type
  const renderEditor = () => {
    if (type === 'boolean') {
      return (
        <Select
          ref={inputRef}
          value={editValue}
          onChange={setEditValue}
          style={{ width: '100px' }}
          size="small"
        >
          <Option value="true">true</Option>
          <Option value="false">false</Option>
        </Select>
      );
    }
    
    if (type === 'object' || type === 'array') {
      return (
        <TextArea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Enter valid JSON for ${type}`}
          autoSize={{ minRows: 3, maxRows: 10 }}
          style={{
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px'
          }}
          status={hasError ? 'error' : ''}
        />
      );
    }
    
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Enter ${type} value`}
        size="small"
        type={type === 'number' ? 'number' : 'text'}
        style={{
          fontFamily: type === 'string' ? 'inherit' : 'Monaco, Consolas, monospace',
          fontSize: type === 'string' ? 'inherit' : '12px'
        }}
        status={hasError ? 'error' : ''}
      />
    );
  };
  
  if (!isEditing) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        minHeight: '24px'
      }}>
        <Text
          style={{
            flex: 1,
            fontFamily: ['object', 'array', 'number'].includes(type) ? 
                       'Monaco, Consolas, monospace' : 'inherit',
            fontSize: ['object', 'array', 'number'].includes(type) ? '12px' : 'inherit',
            color: value === null || value === undefined ? '#bfbfbf' : 'inherit'
          }}
          ellipsis={{ tooltip: true }}
        >
          {formatValueForEdit(value, type)}
        </Text>
        
        {!disabled && (
          <Tooltip title="Edit value (Click to edit)">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={startEditing}
              style={{
                padding: '2px 4px',
                height: '20px',
                width: '20px',
                opacity: 0.7
              }}
            />
          </Tooltip>
        )}
      </div>
    );
  }
  
  return (
    <div style={{ width: '100%' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {renderEditor()}
        
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={isLoading}
            disabled={!editValue.trim() && type !== 'string'}
          >
            Save
          </Button>
          
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={cancelEditing}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {hasError && (
            <Tooltip title="Validation error - check the value format">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
        
        {/* Help text */}
        <Text type="secondary" style={{ fontSize: '10px' }}>
          {type === 'object' || type === 'array' 
            ? 'Enter valid JSON. Press Enter to save, Esc to cancel.'
            : 'Press Enter to save, Esc to cancel.'
          }
        </Text>
      </Space>
    </div>
  );
};

export default ValueEditor;