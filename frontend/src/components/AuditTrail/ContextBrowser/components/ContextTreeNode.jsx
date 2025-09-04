// src/components/AuditTrail/ContextBrowser/components/ContextTreeNode.jsx

import React, { memo, useMemo } from 'react';
import { Space, Typography, Tag, Tooltip } from 'antd';
import { 
  FolderOutlined, 
  FileOutlined,
  DatabaseOutlined,
  NumberOutlined,
  FontSizeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import ValueEditor from './ValueEditor';

const { Text } = Typography;

/**
 * Individual tree node component with editing capabilities
 * @param {Object} props - Component props
 * @param {Object} props.node - Tree node data
 * @param {boolean} props.isEditing - Whether node is in edit mode
 * @param {boolean} props.isMatched - Whether node matches search
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onSave - Save handler
 * @param {Function} props.onSelect - Selection handler
 * @param {boolean} props.isSelected - Whether node is selected
 */
const ContextTreeNode = memo(({
  node,
  isEditing = false,
  isMatched = false,
  onEdit,
  onSave,
  onSelect,
  isSelected = false
}) => {
  // Get appropriate icon for node type
  const getTypeIcon = (type, isLeaf) => {
    if (!isLeaf) {
      return <FolderOutlined style={{ color: '#1890ff' }} />;
    }
    
    switch (type) {
      case 'string':
        return <FontSizeOutlined style={{ color: '#52c41a' }} />;
      case 'number':
        return <NumberOutlined style={{ color: '#1890ff' }} />;
      case 'boolean':
        return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
      case 'object':
        return <DatabaseOutlined style={{ color: '#fa8c16' }} />;
      case 'array':
        return <DatabaseOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <FileOutlined style={{ color: '#8c8c8c' }} />;
    }
  };
  
  // Format the node title with type information inline
  const titleElement = useMemo(() => {
    const isArrayIndex = /^\[\d+\]$/.test(node.title);
    const displayTitle = isArrayIndex ? node.title : node.title;
    
    return (
      <Space 
        size={4}
        style={{ 
          width: '100%',
          backgroundColor: isMatched ? 'rgba(255, 235, 59, 0.2)' : 'transparent',
          padding: isMatched ? '1px 3px' : '0',
          borderRadius: '3px',
          alignItems: 'center'
        }}
      >
        {getTypeIcon(node.type, node.isLeaf)}
        
        <Text 
          strong={!node.isLeaf}
          style={{ 
            color: isArrayIndex ? '#1890ff' : 'inherit',
            fontSize: '13px'
          }}
        >
          {displayTitle}
        </Text>
        
        <Tag 
          size="small" 
          color={getTypeColor(node.type)}
          style={{ 
            fontSize: '9px', 
            lineHeight: '14px',
            margin: 0,
            padding: '0 4px',
            height: '16px'
          }}
        >
          {node.type}
        </Tag>
        
        {/* Show preview info inline for objects/arrays */}
        {!node.isLeaf && node.preview && (
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '10px',
              marginLeft: '4px'
            }}
          >
            {node.preview}
          </Text>
        )}
        
        {/* Show path as tooltip */}
        <Tooltip title={`Path: ${node.path}`} placement="right">
          <Text 
            type="secondary" 
            style={{ 
              fontSize: '9px',
              fontFamily: 'Monaco, Consolas, monospace',
              opacity: 0.6
            }}
          >
            [{node.path.split('.').length}]
          </Text>
        </Tooltip>
      </Space>
    );
  }, [node, isMatched]);
  
  // Format node value - only show for leaf nodes or when editing
  const valueElement = useMemo(() => {
    // Don't show value section for non-leaf nodes (preview is now inline)
    if (!node.isLeaf) {
      return null;
    }
    
    if (isEditing) {
      return (
        <ValueEditor
          path={node.path}
          value={node.value}
          type={node.type}
          onSave={onSave}
          disabled={false}
        />
      );
    }
    
    return (
      <div 
        onClick={() => onEdit?.(node)}
        style={{ 
          cursor: 'pointer',
          padding: '1px 3px',
          borderRadius: '2px',
          border: '1px solid transparent',
          transition: 'all 0.2s',
          display: 'inline-block'
        }}
        onMouseEnter={(e) => {
          e.target.style.border = '1px solid #d9d9d9';
        }}
        onMouseLeave={(e) => {
          e.target.style.border = '1px solid transparent';
        }}
      >
        <ValueEditor
          path={node.path}
          value={node.value}
          type={node.type}
          onSave={onSave}
          disabled={true}
        />
      </div>
    );
  }, [node, isEditing, onEdit, onSave]);
  
  return (
    <div 
      style={{
        width: '100%',
        padding: '2px 0',
        borderLeft: isSelected ? '2px solid #1890ff' : '2px solid transparent',
        paddingLeft: isSelected ? '6px' : '8px',
        backgroundColor: isSelected ? 'rgba(24, 144, 255, 0.04)' : 'transparent',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onClick={() => onSelect?.(node)}
    >
      {/* Title with inline type info and preview */}
      {titleElement}
      
      {/* Value section - only for leaf nodes and more compact */}
      {valueElement && (
        <div style={{ paddingLeft: '16px', marginTop: '2px' }}>
          {valueElement}
        </div>
      )}
    </div>
  );
});

// Helper function to get color for type tag
const getTypeColor = (type) => {
  switch (type) {
    case 'string':
      return 'green';
    case 'number':
      return 'blue';
    case 'boolean':
      return 'purple';
    case 'object':
      return 'orange';
    case 'array':
      return 'magenta';
    case 'null':
      return 'default';
    case 'undefined':
      return 'default';
    default:
      return 'default';
  }
};

ContextTreeNode.displayName = 'ContextTreeNode';

export default ContextTreeNode;