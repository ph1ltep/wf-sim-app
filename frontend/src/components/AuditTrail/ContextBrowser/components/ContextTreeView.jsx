// src/components/AuditTrail/ContextBrowser/components/ContextTreeView.jsx

import React, { useState, useCallback, useMemo } from 'react';
import { Tree, Empty, Spin, Alert, Typography } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import ContextTreeNode from './ContextTreeNode';
import styles from './ContextTreeView.module.css';

const { Text } = Typography;

/**
 * Tree view component for browsing context data
 * @param {Object} props - Component props
 * @param {Array} props.treeData - Tree structure data
 * @param {Function} props.onValueUpdate - Value update handler
 * @param {Set} props.expandedKeys - Set of expanded node keys
 * @param {Function} props.onExpand - Expand handler
 * @param {Set} props.matchedPaths - Set of paths that match search
 * @param {Function} props.isNodeVisible - Function to check if node is visible
 * @param {boolean} props.loading - Loading state
 * @param {string} props.searchQuery - Current search query
 */
const ContextTreeView = ({
  treeData,
  onValueUpdate,
  expandedKeys,
  onExpand,
  matchedPaths = new Set(),
  isNodeVisible,
  loading = false,
  searchQuery = ''
}) => {
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  
  // Handle node selection
  const handleSelect = useCallback((selectedKeysArray) => {
    setSelectedKeys(selectedKeysArray);
  }, []);
  
  // Handle editing start
  const handleEditStart = useCallback((node) => {
    if (node.isLeaf) {
      setEditingKey(node.key);
    }
  }, []);
  
  // Handle value save
  const handleValueSave = useCallback(async (path, newValue) => {
    try {
      const success = await onValueUpdate(path, newValue);
      if (success) {
        setEditingKey(null);
      }
      return success;
    } catch (error) {
      console.error('Error saving value:', error);
      return false;
    }
  }, [onValueUpdate]);
  
  // Filter and transform tree data for display
  const processedTreeData = useMemo(() => {
    if (!treeData || treeData.length === 0) return [];
    
    const processNode = (node) => {
      // Check if this node should be visible
      if (searchQuery && !isNodeVisible?.(node, treeData)) {
        return null;
      }
      
      const processedNode = {
        ...node,
        title: (
          <ContextTreeNode
            node={node}
            isEditing={editingKey === node.key}
            isMatched={matchedPaths.has(node.key)}
            onEdit={handleEditStart}
            onSave={handleValueSave}
            onSelect={(selectedNode) => handleSelect([selectedNode.key])}
            isSelected={selectedKeys.includes(node.key)}
          />
        ),
        key: node.key,
        children: node.children ? 
          node.children.map(processNode).filter(Boolean) : 
          undefined
      };
      
      return processedNode;
    };
    
    return treeData.map(processNode).filter(Boolean);
  }, [
    treeData, 
    searchQuery, 
    isNodeVisible, 
    editingKey, 
    matchedPaths, 
    selectedKeys,
    handleEditStart,
    handleValueSave,
    handleSelect
  ]);
  
  // Handle loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <Spin size="large" tip="Loading context data..." />
      </div>
    );
  }
  
  // Handle empty state
  if (!treeData || treeData.length === 0) {
    return (
      <Empty
        image={<DatabaseOutlined style={{ fontSize: '48px', color: '#bfbfbf' }} />}
        description="No context data available"
        style={{ padding: '40px 20px' }}
      />
    );
  }
  
  // Handle no search results
  if (searchQuery && processedTreeData.length === 0) {
    return (
      <Empty
        description={
          <div>
            <Text type="secondary">No matches found for</Text>
            <br />
            <Text code style={{ backgroundColor: '#f5f5f5' }}>"{searchQuery}"</Text>
          </div>
        }
        style={{ padding: '40px 20px' }}
      />
    );
  }
  
  return (
    <div style={{ width: '100%' }}>
      {/* Search results summary */}
      {searchQuery && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '4px',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#666'
        }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {matchedPaths.size} matches in {processedTreeData.length} visible nodes
          </Text>
        </div>
      )}
      
      {/* Tree component with compact styling */}
      <Tree
        treeData={processedTreeData}
        expandedKeys={Array.from(expandedKeys)}
        onExpand={(expandedKeysArray) => {
          onExpand(new Set(expandedKeysArray));
        }}
        selectedKeys={selectedKeys}
        onSelect={handleSelect}
        showIcon={false}
        showLine={false}
        blockNode={true}
        className={styles.compactTree}
      />
      
      {/* Help text at bottom */}
      <div style={{ 
        padding: '12px',
        borderTop: '1px solid #f0f0f0',
        marginTop: '12px',
        backgroundColor: '#fafafa',
        borderRadius: '4px'
      }}>
        <Text type="secondary" style={{ fontSize: '10px' }}>
          <strong>Tips:</strong> Click leaf values to edit • Use search to find paths • 
          Expand/collapse with arrow keys • Press Esc to cancel edits
        </Text>
      </div>
    </div>
  );
};

export default ContextTreeView;