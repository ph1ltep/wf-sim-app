// src/components/AuditTrail/ContextBrowser/components/ContextTreeNode.jsx

import React, { memo, useMemo, useState, useCallback } from 'react';
import { Typography, Tooltip, Button, Space } from 'antd';
import { 
  FolderOutlined, 
  FileOutlined,
  DatabaseOutlined,
  NumberOutlined,
  FontSizeOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import ValueEditor from './ValueEditor';
import styles from './ContextTreeNode.module.css';

// Schema utilities removed - no longer needed for tooltip functionality

const { Text } = Typography;

/**
 * Individual tree node component with editing capabilities
 * @param {Object} props - Component props
 * @param {Object} props.node - Tree node data
 * @param {boolean} props.isEditing - Whether node is in edit mode
 * @param {boolean} props.isMatched - Whether node matches search
 * @param {boolean} props.isCurrentMatch - Whether node is current search match
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onSelect - Selection handler
 * @param {boolean} props.isSelected - Whether node is selected
 * @param {Function} props.onToggleExpand - Toggle expand/collapse handler
 * @param {Object} props.validationInfo - Validation information for this node
 * @param {Function} props.onRemoveNode - Handler for removing invalid nodes
 * @param {Function} props.onResetNode - Handler for resetting nodes to default values
 */
const ContextTreeNode = memo(({
  node,
  isEditing = false,
  isMatched = false,
  isCurrentMatch = false,
  onEdit,
  onSave,
  onSelect,
  isSelected = false,
  onToggleExpand,
  validationInfo = null,
  onRemoveNode,
  onResetNode
}) => {
  // Schema info functionality removed - tooltip was not useful
  // Get appropriate icon for node type (with array index handling)
  const getTypeIcon = (type, isLeaf, nodeTitle) => {
    // Check if this is an array index like [0], [1], etc.
    const isArrayIndex = /^\[\d+\]$/.test(nodeTitle || '');
    
    if (!isLeaf) {
      // For non-leaf nodes, use array color if it's an array index
      const color = isArrayIndex ? '#722ed1' : '#1890ff';
      return <FolderOutlined style={{ color }} />;
    }
    
    // For array indices, use purple color regardless of type
    if (isArrayIndex) {
      return <DatabaseOutlined style={{ color: '#722ed1' }} />;
    }
    
    switch (type) {
      case 'string':
        return <FontSizeOutlined style={{ color: '#52c41a' }} />;
      case 'number':
        return <NumberOutlined style={{ color: '#1890ff' }} />;
      case 'boolean':
        return <CheckCircleOutlined style={{ color: '#13c2c2' }} />;
      case 'object':
        return <DatabaseOutlined style={{ color: '#fa8c16' }} />;
      case 'array':
        return <DatabaseOutlined style={{ color: '#722ed1' }} />;
      default:
        return <FileOutlined style={{ color: '#8c8c8c' }} />;
    }
  };
  
  // Get type-specific styling
  const getTypeStyle = (type, isLeaf) => {
    const baseStyle = {
      fontSize: '12px',
      fontFamily: isLeaf ? 'Monaco, Consolas, monospace' : 'inherit'
    };
    
    if (!isLeaf) return { ...baseStyle, fontWeight: 500 };
    
    switch (type) {
      case 'string':
        return { ...baseStyle, color: '#52c41a' };
      case 'number':
        return { ...baseStyle, color: '#1890ff' };
      case 'boolean':
        return { ...baseStyle, color: '#13c2c2' };
      case 'object':
        return { ...baseStyle, color: '#fa8c16' };
      case 'array':
        return { ...baseStyle, color: '#722ed1' };
      default:
        return { ...baseStyle, color: '#8c8c8c' };
    }
  };

  // Helper function to format values for inline display
  const formatValueForDisplay = (value, type) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (type === 'string') return `"${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}"`;
    if (type === 'boolean') return String(value);
    if (type === 'number') return String(value);
    return String(value).substring(0, 30);
  };

  // Remove hover state - using always-visible Antd pattern instead

  // Helper function to get validation styling and indicator
  const getValidationStyling = () => {
    if (!validationInfo) return { indicator: null, backgroundStyle: {}, actionButtons: null };
    
    const { status, message, canRemove, canReset, hasDefault } = validationInfo;
    
    const baseBackgroundStyle = {
      padding: '2px 4px 2px 6px', /* Reduce right padding to give more space */
      borderRadius: '4px',
      border: '1px solid',
      margin: '0 2px 0 0', /* Small right margin to prevent edge contact */
      maxWidth: 'calc(100% - 6px)', /* Account for margins and prevent overflow */
      overflow: 'hidden',
      boxSizing: 'border-box'
    };

    // Always-visible action buttons using Antd patterns - no hover required
    const getActionButtons = () => {
      // Show buttons for validation issues - always visible, Antd-style
      const shouldShowActions = !isEditing && 
                               (status === 'SCHEMA_INVALID' || status === 'NOT_IN_SCHEMA');
      
      if (!shouldShowActions) return null;
      
      const buttons = [];
      
      // Remove button for items not in schema
      if (status === 'NOT_IN_SCHEMA' && canRemove && onRemoveNode) {
        buttons.push(
          <Tooltip key="remove" title="Remove (not in schema)" placement="top">
            <Button 
              size="small" 
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveNode(node.path);
              }}
              style={{ 
                fontSize: '11px', 
                height: '22px', 
                minWidth: '22px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Tooltip>
        );
      }

      // Remove button for failed validation items
      if (status === 'SCHEMA_INVALID' && canRemove && onRemoveNode) {
        buttons.push(
          <Tooltip key="remove-invalid" title="Remove (validation failed)" placement="top">
            <Button 
              size="small" 
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveNode(node.path);
              }}
              style={{ 
                fontSize: '11px', 
                height: '22px', 
                minWidth: '22px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </Tooltip>
        );
      }
      
      // Reset button for items with defaults (show for both valid and invalid)
      if ((canReset || hasDefault) && onResetNode) {
        buttons.push(
          <Tooltip key="reset" title="Reset to default value" placement="top">
            <Button 
              size="small" 
              type="text"
              icon={<ReloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onResetNode(node.path);
              }}
              style={{ 
                fontSize: '11px', 
                height: '22px', 
                minWidth: '22px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1890ff'
              }}
            />
          </Tooltip>
        );
      }
      
      return buttons.length > 0 ? (
        <Space 
          size="small"
          style={{ 
            marginLeft: '4px',
            flexShrink: 0 /* Prevent buttons from shrinking */
          }}
        >
          {buttons}
        </Space>
      ) : null;
    };
    
    switch (status) {
      case 'SCHEMA_VALID':
        return {
          indicator: (
            <Tooltip title="Valid according to schema" placement="top">
              <CheckCircleOutlined 
                style={{ 
                  color: '#52c41a', 
                  fontSize: '14px',
                  marginLeft: '6px',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }} 
              />
            </Tooltip>
          ),
          backgroundStyle: {
            ...baseBackgroundStyle,
            backgroundColor: 'rgba(82, 196, 26, 0.08)',
            borderColor: 'rgba(82, 196, 26, 0.2)'
          },
          actionButtons: getActionButtons()
        };
        
      case 'SCHEMA_INVALID':
        return {
          indicator: (
            <Tooltip 
              title={`Schema validation failed: ${message}`}
              placement="top"
            >
              <CloseCircleOutlined 
                style={{ 
                  color: '#ff4d4f', 
                  fontSize: '14px',
                  marginLeft: '6px',
                  flexShrink: 0,
                  animation: 'pulse 2s infinite'
                }} 
              />
            </Tooltip>
          ),
          backgroundStyle: {
            ...baseBackgroundStyle,
            backgroundColor: 'rgba(255, 77, 79, 0.08)',
            borderColor: 'rgba(255, 77, 79, 0.2)'
          },
          actionButtons: getActionButtons()
        };
        
      case 'NOT_IN_SCHEMA':
        return {
          indicator: (
            <Tooltip 
              title="Not defined in schema"
              placement="top"
            >
              <WarningOutlined 
                style={{ 
                  color: '#fa8c16', 
                  fontSize: '14px',
                  marginLeft: '6px',
                  flexShrink: 0,
                  animation: 'pulse 2.5s infinite'
                }} 
              />
            </Tooltip>
          ),
          backgroundStyle: {
            ...baseBackgroundStyle,
            backgroundColor: 'rgba(250, 140, 22, 0.08)',
            borderColor: 'rgba(250, 140, 22, 0.2)'
          },
          actionButtons: getActionButtons()
        };
        
      default:
        return { indicator: null, backgroundStyle: {}, actionButtons: null };
    }
  };

  // Schema functionality removed - was not useful in tooltip form

  // Single line format for both leaf and non-leaf nodes
  const titleElement = useMemo(() => {
    const { indicator: validationIndicator, backgroundStyle: validationBackground, actionButtons } = getValidationStyling();
    const isArrayIndex = /^\[\d+\]$/.test(node.title);
    const displayTitle = isArrayIndex ? node.title : node.title;
    const typeStyle = getTypeStyle(node.type, node.isLeaf);
    
    // Use array color for array indices
    const finalTypeStyle = isArrayIndex ? 
      { ...typeStyle, color: '#722ed1' } : 
      typeStyle;
    
    // For leaf nodes, show everything in one line: icon title = value
    if (node.isLeaf && !isEditing) {
      const combinedBackgroundStyle = {
        // Validation highlighting takes precedence over search highlighting
        ...(validationInfo ? validationBackground : {
          backgroundColor: isCurrentMatch ? 'rgba(24, 144, 255, 0.2)' : 
                         isMatched ? 'rgba(255, 235, 59, 0.15)' : 'transparent',
          borderRadius: '4px',
          border: isCurrentMatch ? '1px solid #1890ff' : 
                  isMatched ? '1px solid rgba(255, 235, 59, 0.4)' : '1px solid transparent'
        })
      };
      
      return (
        <div className={styles.nodeContent} style={combinedBackgroundStyle}>
          <div
            onClick={() => onEdit?.(node)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!node.isLeaf && onToggleExpand) {
                onToggleExpand(node.key);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, cursor: 'pointer' }}
          >
            {getTypeIcon(node.type, node.isLeaf, node.title)}
            <Text style={finalTypeStyle}>{displayTitle}</Text>
            {node.type === 'array' && (
              <Text style={{ color: '#722ed1', fontSize: '10px', marginLeft: '2px' }}>
                {'{}'}
              </Text>
            )}
            <Text type="secondary" style={{ fontSize: '11px', flexShrink: 0, margin: '0 4px' }}>{'='}</Text>
            <Text style={{ 
              ...typeStyle, 
              flex: 1, 
              fontSize: '11px', 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              maxWidth: '200px' /* Limit value text width to make room for validation elements */
            }}>
              {formatValueForDisplay(node.value, node.type)}
            </Text>
            {validationIndicator}
          </div>
          {actionButtons}
        </div>
      );
    }
    
    // For non-leaf nodes, show: icon title (preview)  
    const combinedBackgroundStyle = {
      // Validation highlighting takes precedence over search highlighting
      ...(validationInfo ? validationBackground : {
        backgroundColor: isCurrentMatch ? 'rgba(24, 144, 255, 0.2)' : 
                       isMatched ? 'rgba(255, 235, 59, 0.15)' : 'transparent',
        borderRadius: '4px',
        border: isCurrentMatch ? '1px solid #1890ff' : 
                isMatched ? '1px solid rgba(255, 235, 59, 0.4)' : '1px solid transparent'
      })
    };
    
    return (
      <div className={styles.nodeContent} style={combinedBackgroundStyle}>
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!node.isLeaf && onToggleExpand) {
              onToggleExpand(node.key);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, cursor: 'pointer' }}
        >
          {getTypeIcon(node.type, node.isLeaf, node.title)}
          <Text style={typeStyle}>{displayTitle}</Text>
          {node.type === 'array' && (
            <Text style={{ color: '#722ed1', fontSize: '10px', marginLeft: '2px' }}>
              {'{}'}
            </Text>
          )}
          {node.preview && (
            <Text 
              type="secondary" 
              style={{ fontSize: '10px', marginLeft: '4px', flex: 1 }}
            >
              {node.preview}
            </Text>
          )}
          {validationIndicator}
        </div>
        {actionButtons}
      </div>
    );
  }, [node, isMatched, isCurrentMatch, isEditing, onEdit, onToggleExpand, validationInfo, onRemoveNode, onResetNode]);
  
  // Format node value - only show when editing (since leaf values are now inline)
  const valueElement = useMemo(() => {
    if (!isEditing) return null;
    
    return (
      <div style={{ paddingLeft: '16px', marginTop: '2px' }}>
        <ValueEditor
          path={node.path}
          value={node.value}
          type={node.type}
          onSave={onSave}
          disabled={false}
        />
      </div>
    );
  }, [node, isEditing, onSave]);
  
  return (
    <div 
      data-node-key={node.key}
      style={{
        width: '100%',
        padding: '1px 0',
        borderLeft: isSelected ? '2px solid #1890ff' : '2px solid transparent',
        paddingLeft: isSelected ? '4px' : '6px',
        backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.04)' : 'transparent',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onClick={() => onSelect?.(node)}
    >
      {/* Single line title with value for leaf nodes, expandable info for non-leaf */}
      {titleElement}
      
      {/* Edit section - only shows when editing */}
      {valueElement}
    </div>
  );
});

// Note: getTypeColor function removed - now using direct color styling in getTypeStyle

ContextTreeNode.displayName = 'ContextTreeNode';

export default ContextTreeNode;