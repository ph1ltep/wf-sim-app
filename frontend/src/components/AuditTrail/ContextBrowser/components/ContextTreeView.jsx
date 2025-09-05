// src/components/AuditTrail/ContextBrowser/components/ContextTreeView.jsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
 * @param {boolean} props.loading - Loading state
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onNodeSelect - Node selection handler
 * @param {string} props.selectedNodeKey - Currently selected node key
 * @param {Function} props.isCurrentMatch - Function to check if node is current search match
 * @param {Object} props.originalData - Original scenario data for lazy loading
 */
const ContextTreeView = ({
  treeData,
  onValueUpdate,
  expandedKeys,
  onExpand,
  matchedPaths = new Set(),
  loading = false,
  loadingProgress,
  searchQuery = '',
  onNodeSelect,
  selectedNodeKey,
  isCurrentMatch,
  originalData
}) => {
  const [selectedKeys, setSelectedKeys] = useState(selectedNodeKey ? [selectedNodeKey] : []);
  const [editingKey, setEditingKey] = useState(null);
  const [expandedTreeData, setExpandedTreeData] = useState(treeData);
  
  // Enhanced lazy loading with proactive loading for search navigation
  const loadNodeChildren = useCallback((nodeKey, forceLoad = false) => {
    if (!originalData) return false;

    // Find the node in expanded tree data
    const findNode = (nodes, targetKey) => {
      if (!Array.isArray(nodes)) return null;
      
      for (const node of nodes) {
        if (node.key === targetKey) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children, targetKey);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(expandedTreeData, nodeKey);
    if (!node) return false;

    // Check if we need to load children
    const needsLoading = forceLoad || 
      (node.children && node.children.length === 1 && node.children[0].isPlaceholder);
    
    if (needsLoading) {
      // Navigate to the data using the path
      const pathParts = nodeKey.split('.');
      let currentData = originalData;
      
      // Follow the path in the original data
      for (const part of pathParts) {
        if (currentData && typeof currentData === 'object' && currentData.hasOwnProperty(part)) {
          currentData = currentData[part];
        } else {
          currentData = null;
          break;
        }
      }
      
      if (currentData && typeof currentData === 'object') {
        // Import convertToTreeData function
        const { convertToTreeData } = require('../utils/contextUtils');
        const newChildren = convertToTreeData(currentData, nodeKey, 0, 0); // No depth limit
        
        // Update the tree data with real children
        setExpandedTreeData(prevData => {
          const updateNodeChildren = (nodes) => {
            if (!Array.isArray(nodes)) return nodes;
            
            return nodes.map(n => {
              if (n.key === nodeKey) {
                return { ...n, children: newChildren };
              }
              if (n.children) {
                return { ...n, children: updateNodeChildren(n.children) };
              }
              return n;
            });
          };
          return updateNodeChildren(prevData);
        });
        
        return true;
      }
    }
    
    return false;
  }, [originalData, expandedTreeData]);

  // Handle expanding nodes with lazy loading
  const handleExpand = useCallback((expandedKeysArray, { expanded, node }) => {
    const newExpandedKeys = new Set(expandedKeysArray);
    
    // If expanding, try to load children
    if (expanded) {
      loadNodeChildren(node.key);
    }
    
    onExpand(newExpandedKeys);
  }, [loadNodeChildren, onExpand]);

  // Handle double-click toggle expand/collapse
  const handleToggleExpand = useCallback((nodeKey) => {
    const isExpanded = expandedKeys.has(nodeKey);
    const newExpandedKeys = new Set(expandedKeys);
    
    if (isExpanded) {
      newExpandedKeys.delete(nodeKey);
    } else {
      newExpandedKeys.add(nodeKey);
    }
    
    onExpand(newExpandedKeys);
  }, [expandedKeys, onExpand]);
  
  // Handle node selection
  const handleSelect = useCallback((selectedKeysArray) => {
    setSelectedKeys(selectedKeysArray);
    const newSelectedKey = selectedKeysArray[0] || null;
    if (onNodeSelect) {
      onNodeSelect(newSelectedKey);
    }
  }, [onNodeSelect]);
  
  // Smart update of expanded tree data - preserve loaded nodes
  useEffect(() => {
    if (!treeData || treeData.length === 0) {
      setExpandedTreeData([]);
      return;
    }

    // If we have existing expanded data, merge intelligently
    if (expandedTreeData && expandedTreeData.length > 0) {
      const mergeTreeNodes = (newNodes, existingNodes) => {
        if (!Array.isArray(newNodes) || !Array.isArray(existingNodes)) {
          return newNodes;
        }
        
        const existingMap = new Map(existingNodes.map(node => [node.key, node]));
        
        return newNodes.map(newNode => {
          const existing = existingMap.get(newNode.key);
          
          // If we don't have an existing node, use the new one
          if (!existing) {
            return newNode;
          }
          
          // If existing node has loaded children (not placeholders), preserve and recursively merge them
          if (existing.children && existing.children.length > 0 && 
              !(existing.children.length === 1 && existing.children[0].isPlaceholder)) {
            
            // If new node also has children, recursively merge them
            const mergedChildren = newNode.children ? 
              mergeTreeNodes(newNode.children, existing.children) :
              existing.children;
              
            return {
              ...newNode, // Use new node data (for updated values)
              children: mergedChildren // Keep merged children
            };
          }
          
          // If existing node doesn't have loaded children, use new node as-is
          return newNode;
        });
      };
      
      setExpandedTreeData(mergeTreeNodes(treeData, expandedTreeData));
    } else {
      // First load - use new tree data
      setExpandedTreeData(treeData);
    }
  }, [treeData]); // Note: removed expandedTreeData from dependencies to avoid infinite loops

  // Simplified: load children for expanded nodes when needed
  useEffect(() => {
    // Only load children when a node is explicitly expanded through user interaction
    // This prevents over-eager loading that can cause issues
  }, []);

  // Sync selected keys with external selection
  useEffect(() => {
    setSelectedKeys(selectedNodeKey ? [selectedNodeKey] : []);
  }, [selectedNodeKey]);
  
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
  
  // Transform tree data for display (no filtering - show all nodes)
  const processedTreeData = useMemo(() => {
    if (!expandedTreeData || expandedTreeData.length === 0) return [];
    
    const processNode = (node) => {
      const processedNode = {
        ...node,
        title: (
          <ContextTreeNode
            node={node}
            isEditing={editingKey === node.key}
            isMatched={matchedPaths.has(node.key)}
            isCurrentMatch={isCurrentMatch ? isCurrentMatch(node.key) : false}
            onEdit={handleEditStart}
            onSave={handleValueSave}
            onSelect={(selectedNode) => handleSelect([selectedNode.key])}
            isSelected={selectedKeys.includes(node.key)}
            onToggleExpand={handleToggleExpand}
          />
        ),
        key: node.key,
        children: node.children ? 
          node.children.map(processNode) : 
          undefined
      };
      
      return processedNode;
    };
    
    return expandedTreeData.map(processNode);
  }, [
    expandedTreeData, 
    editingKey, 
    matchedPaths, 
    selectedKeys,
    handleEditStart,
    handleValueSave,
    handleSelect,
    isCurrentMatch,
    handleToggleExpand
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
  
  // Note: No need to handle "no search results" since we no longer filter the tree
  // Search now highlights and navigates to matches while keeping all nodes visible
  
  return (
    <div style={{ width: '100%' }}>
      {/* Search results summary with performance info */}
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
            {matchedPaths.size} matches in {processedTreeData.length} nodes
            {processedTreeData.length > 5000 && (
              <span style={{ color: '#1890ff', marginLeft: '8px' }}>
                (Large dataset - optimized search active)
              </span>
            )}
          </Text>
        </div>
      )}
      
      {/* Tree component with compact styling and performance optimizations */}
      <div style={{
        height: processedTreeData.length > 3000 ? '400px' : 'auto',
        overflow: processedTreeData.length > 3000 ? 'auto' : 'visible'
      }}>
        <Tree
          treeData={processedTreeData}
          expandedKeys={Array.from(expandedKeys)}
          onExpand={handleExpand}
          selectedKeys={selectedKeys}
          onSelect={handleSelect}
          showIcon={false}
          showLine={false}
          blockNode={true}
          className={styles.compactTree}
          // Enable virtual scrolling for very large datasets
          virtual={processedTreeData.length > 5000}
          height={processedTreeData.length > 5000 ? 400 : undefined}
        />
      </div>
      
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