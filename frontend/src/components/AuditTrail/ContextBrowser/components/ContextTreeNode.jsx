// src/components/AuditTrail/ContextBrowser/components/ContextTreeNode.jsx

import React, { memo, useMemo, useState, useCallback } from 'react';
import { Typography, Tooltip } from 'antd';
import { 
  FolderOutlined, 
  FileOutlined,
  DatabaseOutlined,
  NumberOutlined,
  FontSizeOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import ValueEditor from './ValueEditor';

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
  onToggleExpand
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

  // Schema functionality removed - was not useful in tooltip form

  // Single line format for both leaf and non-leaf nodes
  const titleElement = useMemo(() => {
    const isArrayIndex = /^\[\d+\]$/.test(node.title);
    const displayTitle = isArrayIndex ? node.title : node.title;
    const typeStyle = getTypeStyle(node.type, node.isLeaf);
    
    // Use array color for array indices
    const finalTypeStyle = isArrayIndex ? 
      { ...typeStyle, color: '#722ed1' } : 
      typeStyle;
    
    // For leaf nodes, show everything in one line: icon title = value
    if (node.isLeaf && !isEditing) {
      return (
        // Tooltip disabled for now - not useful as it shows same info as on screen
        <div
          style={{ 
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isCurrentMatch ? 'rgba(24, 144, 255, 0.3)' : 
                           isMatched ? 'rgba(255, 235, 59, 0.2)' : 'transparent',
            padding: (isMatched || isCurrentMatch) ? '1px 3px' : '1px',
            borderRadius: '3px',
            border: isCurrentMatch ? '1px solid #1890ff' : 'none',
            cursor: 'pointer'
          }}
          onClick={() => onEdit?.(node)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!node.isLeaf && onToggleExpand) {
              onToggleExpand(node.key);
            }
          }}
        >
          {getTypeIcon(node.type, node.isLeaf, node.title)}
          <Text style={finalTypeStyle}>{displayTitle}</Text>
          {node.type === 'array' && (
            <Text style={{ color: '#722ed1', fontSize: '10px', marginLeft: '2px' }}>
              {'{}'}
            </Text>
          )}
          <Text type="secondary" style={{ fontSize: '11px' }}>{'='}</Text>
          <Text style={{ ...typeStyle, flex: 1, fontSize: '11px' }}>
            {formatValueForDisplay(node.value, node.type)}
          </Text>
        </div>
      );
    }
    
    // For non-leaf nodes, show: icon title (preview)
    return (
      // Tooltip disabled for now - not useful as it shows same info as on screen
      <div
        style={{ 
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: isCurrentMatch ? 'rgba(24, 144, 255, 0.3)' : 
                         isMatched ? 'rgba(255, 235, 59, 0.2)' : 'transparent',
          padding: (isMatched || isCurrentMatch) ? '1px 3px' : '1px',
          borderRadius: '3px',
          border: isCurrentMatch ? '1px solid #1890ff' : 'none',
          cursor: 'pointer'
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!node.isLeaf && onToggleExpand) {
            onToggleExpand(node.key);
          }
        }}
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
            style={{ fontSize: '10px', marginLeft: '4px' }}
          >
            {node.preview}
          </Text>
        )}
      </div>
    );
  }, [node, isMatched, isCurrentMatch, isEditing, onEdit, onToggleExpand]);
  
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