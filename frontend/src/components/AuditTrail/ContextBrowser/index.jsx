// src/components/AuditTrail/ContextBrowser/index.jsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Drawer, Typography, Space, message, Alert, Divider, Button, Tooltip, Modal, Spin, Breadcrumb } from 'antd';
import { 
  BugOutlined, 
  DatabaseOutlined, 
  CloseOutlined,
  ShrinkOutlined,
  FolderOutlined,
  FileOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useScenario } from '../../../contexts/ScenarioContext';
import { useContextTree } from './hooks/useContextTree';
import { useContextSearch } from './hooks/useContextSearch';
import SearchBar from './components/SearchBar';
import ContextTreeView from './components/ContextTreeView';
// Import validation utilities
import { ScenarioSchema } from 'schemas/yup/scenario';
import { validatePath } from '../../../utils/validate';
import { checkChildren } from './utils/simpleValidation';
import { 
  removeInvalidNodes, 
  resetNodesToDefaults 
} from './utils/recursiveValidation';
// Removed useDebouncedCallback - search now triggers on Enter only

const { Title, Text } = Typography;

/**
 * Main ContextBrowser component for debugging scenario context
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether drawer is visible
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Custom title for the drawer
 */
const ContextBrowser = ({
  visible = false,
  onClose,
  title = 'Context Browser'
}) => {
  const { scenarioData, updateByPath, getValueByPath, loading } = useScenario();
  const [expandedKeys, setExpandedKeys] = useState(new Set());
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);
  
  // Validation modal state
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  
  // Shallow validation state - stores validation status for tree nodes
  const [validationMap, setValidationMap] = useState(new Map());
  const [validatingOneLevel, setValidatingOneLevel] = useState(false);
  
  // Process scenario data into tree structure with performance optimization
  const { treeData, flattenedData, treeStats, hasData, isLoading, loadingProgress } = useContextTree(scenarioData);
  
  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    isNodeMatched,
    isCurrentMatch,
    getRequiredExpansions,
    hasActiveSearch,
    currentMatchIndex,
    goToNextMatch,
    goToPreviousMatch,
    totalMatches
  } = useContextSearch(flattenedData);
  
  // Handle search change - now only triggers on Enter
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  // Enhanced clear handler - clears both search and validation
  const handleClearAll = useCallback(() => {
    clearSearch();
    setValidationMap(new Map());
    message.success('Cleared search and validation results');
  }, [clearSearch]);

  // Reset All handler - clears everything but keeps expand/collapse state
  const handleResetAll = useCallback(() => {
    clearSearch();
    setValidationMap(new Map());
    setSelectedNodeKey(null);
    setValidationModalVisible(false);
    setValidationResult(null);
    message.success('Reset interface - cleared all highlights and selections');
  }, [clearSearch]);
  
  // Handle value updates through ScenarioContext
  const handleValueUpdate = useCallback(async (path, newValue) => {
    try {
      console.log('ContextBrowser: Updating path', path, 'with value', newValue);
      
      const result = await updateByPath(path, newValue);
      
      if (result.isValid) {
        message.success(`Updated ${path}`);
        return true;
      } else {
        const errorMsg = result.error || result.errors?.[0] || 'Validation failed';
        message.error(`Failed to update ${path}: ${errorMsg}`);
        return false;
      }
    } catch (error) {
      console.error('ContextBrowser: Error updating value:', error);
      message.error(`Error updating ${path}: ${error.message}`);
      return false;
    }
  }, [updateByPath]);

  // Collapse control handlers
  const handleCollapseAll = useCallback(() => {
    setExpandedKeys(new Set());
    message.success('Collapsed all branches');
  }, []);

  const handleCollapseHigherBranches = useCallback(() => {
    // Keep only expanded keys that are deeper than 2 levels
    const deepKeys = Array.from(expandedKeys).filter(key => 
      key.split('.').length > 2
    );
    setExpandedKeys(new Set(deepKeys));
    message.success('Collapsed higher-level branches');
  }, [expandedKeys]);

  const handleCollapseLowerBranches = useCallback(() => {
    // Keep only expanded keys that are 2 levels or less
    const shallowKeys = Array.from(expandedKeys).filter(key => 
      key.split('.').length <= 2
    );
    setExpandedKeys(new Set(shallowKeys));
    message.success('Collapsed lower-level branches');
  }, [expandedKeys]);

  // Handler for tree node selection
  const handleNodeSelect = useCallback((nodeKey) => {
    setSelectedNodeKey(nodeKey);
  }, []);

  // Handler for schema validation
  const handleValidateSelected = useCallback(async () => {
    if (!selectedNodeKey || !scenarioData) {
      message.warning('Please select an object to validate');
      return;
    }

    setValidationLoading(true);
    setValidationModalVisible(true);

    try {
      // Get the value at the selected path
      const selectedValue = getValueByPath(selectedNodeKey);
      
      // Get schema chain information
      const pathArray = selectedNodeKey.split('.');
      const schemaChain = [];
      let currentPath = '';
      
      for (let i = 0; i < pathArray.length; i++) {
        if (i > 0) currentPath += '.';
        currentPath += pathArray[i];
        
        try {
          const fieldSchema = require('yup').reach(ScenarioSchema, currentPath);
          schemaChain.push({
            path: currentPath,
            segment: pathArray[i],
            type: fieldSchema.type,
            required: fieldSchema.tests?.some(test => test.name === 'required') || false,
            nullable: fieldSchema.spec?.nullable || false
          });
        } catch (error) {
          // Schema not found for this path segment
          schemaChain.push({
            path: currentPath,
            segment: pathArray[i],
            type: 'unknown',
            note: 'Not defined in schema'
          });
        }
      }
      
      // Validate the path against the schema
      const result = await validatePath(ScenarioSchema, selectedNodeKey, selectedValue, scenarioData);
      
      setValidationResult({
        path: selectedNodeKey,
        value: selectedValue,
        result: result,
        schemaChain: schemaChain,
        timestamp: new Date().toLocaleTimeString()
      });
      
      // Show success/failure message
      if (result.isValid) {
        message.success(`Validation passed for ${selectedNodeKey}`);
      } else {
        message.error(`Validation failed for ${selectedNodeKey}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        path: selectedNodeKey,
        value: getValueByPath(selectedNodeKey),
        result: {
          isValid: false,
          errors: [error.message || 'Validation failed'],
          error: error.message || 'Validation failed'
        },
        timestamp: new Date().toLocaleTimeString()
      });
      message.error(`Error validating ${selectedNodeKey}: ${error.message}`);
    } finally {
      setValidationLoading(false);
    }
  }, [selectedNodeKey, scenarioData, getValueByPath]);

  // Close validation modal
  const handleCloseValidationModal = useCallback(() => {
    setValidationModalVisible(false);
    setValidationResult(null);
  }, []);

  // Handler for simple validation check (one level down)
  const handleShallowValidation = useCallback(async () => {
    if (!scenarioData) {
      message.warning('No context data available for validation');
      return;
    }

    const startPath = selectedNodeKey || ''; // Start from selected node or root
    const startLabel = startPath || 'root level';
    
    setValidatingOneLevel(true);
    
    try {
      const checkResults = await checkChildren(scenarioData, startPath, getValueByPath);
      
      // Convert results to validation map format for UI
      const newValidationMap = new Map();
      checkResults.forEach((result, path) => {
        newValidationMap.set(path, {
          isValid: result.status === 'SCHEMA_VALID',
          status: result.status,
          errors: result.errors || [],
          message: result.message,
          hasDefault: result.hasDefault,
          defaultValue: result.defaultValue,
          canRemove: result.canRemove,
          canReset: result.canReset
        });
      });
      
      // Merge with existing validation map
      setValidationMap(prevMap => {
        const mergedMap = new Map(prevMap);
        newValidationMap.forEach((value, key) => {
          mergedMap.set(key, value);
        });
        return mergedMap;
      });
      
      // Count results by category
      const schemaValid = Array.from(checkResults.values()).filter(v => v.status === 'SCHEMA_VALID').length;
      const schemaInvalid = Array.from(checkResults.values()).filter(v => v.status === 'SCHEMA_INVALID').length;
      const notInSchema = Array.from(checkResults.values()).filter(v => v.status === 'NOT_IN_SCHEMA').length;
      const totalChecked = schemaValid + schemaInvalid + notInSchema;
      
      if (totalChecked === 0) {
        message.info(`No children found at ${startLabel}`);
      } else {
        let statusParts = [];
        if (schemaValid > 0) statusParts.push(`${schemaValid} valid`);
        if (schemaInvalid > 0) statusParts.push(`${schemaInvalid} invalid`);
        if (notInSchema > 0) statusParts.push(`${notInSchema} not in schema`);
        
        const statusMessage = `Checked ${totalChecked} children at ${startLabel}: ${statusParts.join(', ')}`;
        
        if (schemaInvalid > 0 || notInSchema > 0) {
          message.warning(statusMessage + ' - issues found');
        } else {
          message.success(statusMessage + ' - all good');
        }
      }
      
    } catch (error) {
      console.error('Validation check error:', error);
      message.error(`Validation check failed: ${error.message}`);
    } finally {
      setValidatingOneLevel(false);
    }
  }, [selectedNodeKey, scenarioData, getValueByPath]);

  // Handler for removing current selected node
  const handleRemoveCurrentNode = useCallback(async () => {
    if (!selectedNodeKey) return;
    
    const confirmed = window.confirm(
      `Remove '${selectedNodeKey}' from context?\n\nThis cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const nodeInfo = validationMap.get(selectedNodeKey);
      const nodesToRemove = [{
        path: selectedNodeKey,
        value: getValueByPath(selectedNodeKey),
        errors: nodeInfo?.errors || []
      }];
      
      const removeResults = await removeInvalidNodes(nodesToRemove, updateByPath);
      
      if (removeResults.removed.length > 0) {
        message.success(`Removed ${selectedNodeKey}`);
        
        // Clear from validation map
        setValidationMap(prevMap => {
          const newMap = new Map(prevMap);
          newMap.delete(selectedNodeKey);
          return newMap;
        });
        
        // Close modal and clear selection
        setValidationModalVisible(false);
        setSelectedNodeKey(null);
      } else {
        message.error('Failed to remove node');
      }
      
    } catch (error) {
      console.error('Remove current node error:', error);
      message.error(`Failed to remove node: ${error.message}`);
    }
  }, [selectedNodeKey, validationMap, getValueByPath, updateByPath]);

  // Handler for resetting current selected node to default
  const handleResetCurrentNode = useCallback(async () => {
    if (!selectedNodeKey) return;
    
    const nodeInfo = validationMap.get(selectedNodeKey);
    if (!nodeInfo?.hasDefault) {
      message.warning('No default value available for this node');
      return;
    }
    
    const confirmed = window.confirm(
      `Reset '${selectedNodeKey}' to default value?\n\nCurrent: ${JSON.stringify(getValueByPath(selectedNodeKey))}\nDefault: ${JSON.stringify(nodeInfo.defaultValue)}\n\nThis cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const nodesToReset = [{
        path: selectedNodeKey,
        value: getValueByPath(selectedNodeKey),
        hasDefault: true,
        defaultValue: nodeInfo.defaultValue
      }];
      
      const resetResults = await resetNodesToDefaults(nodesToReset, updateByPath);
      
      if (resetResults.reset.length > 0) {
        message.success(`Reset ${selectedNodeKey} to default`);
        
        // Update validation map to show as valid now
        setValidationMap(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(selectedNodeKey, {
            ...nodeInfo,
            isValid: true,
            errors: []
          });
          return newMap;
        });
        
        // Re-validate the node to confirm
        setTimeout(() => handleValidateSelected(), 500);
      } else {
        message.error('Failed to reset node to default');
      }
      
    } catch (error) {
      console.error('Reset current node error:', error);
      message.error(`Failed to reset node: ${error.message}`);
    }
  }, [selectedNodeKey, validationMap, getValueByPath, updateByPath, handleValidateSelected]);

  // Handler for removing nodes directly from tree
  const handleRemoveNodeFromTree = useCallback(async (nodePath) => {
    const nodeInfo = validationMap.get(nodePath);
    if (!nodeInfo?.canRemove) {
      message.warning('This node cannot be removed');
      return;
    }

    const confirmed = window.confirm(
      `Remove '${nodePath}' from context?\n\nThis node is not defined in the schema and can be safely removed.\n\nThis cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const nodesToRemove = [{
        path: nodePath,
        value: getValueByPath(nodePath),
        errors: nodeInfo?.errors || []
      }];
      
      const removeResults = await removeInvalidNodes(nodesToRemove, updateByPath);
      
      if (removeResults.removed.length > 0) {
        message.success(`Removed ${nodePath}`);
        
        // Clear from validation map
        setValidationMap(prevMap => {
          const newMap = new Map(prevMap);
          newMap.delete(nodePath);
          return newMap;
        });
      } else {
        message.error('Failed to remove node');
      }
    } catch (error) {
      console.error('Error removing node:', error);
      message.error(`Failed to remove node: ${error.message}`);
    }
  }, [validationMap, getValueByPath, updateByPath]);

  // Handler for resetting nodes to default from tree
  const handleResetNodeFromTree = useCallback(async (nodePath) => {
    const nodeInfo = validationMap.get(nodePath);
    if (!nodeInfo?.hasDefault) {
      message.warning('No default value available for this node');
      return;
    }

    const confirmed = window.confirm(
      `Reset '${nodePath}' to default value?\n\nCurrent: ${JSON.stringify(getValueByPath(nodePath))}\nDefault: ${JSON.stringify(nodeInfo.defaultValue)}\n\nThis cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const nodesToReset = [{
        path: nodePath,
        value: getValueByPath(nodePath),
        defaultValue: nodeInfo.defaultValue,
        hasDefault: nodeInfo.hasDefault
      }];
      
      const resetResults = await resetNodesToDefaults(nodesToReset, updateByPath);
      
      if (resetResults.reset.length > 0) {
        message.success(`Reset ${nodePath} to default value`);
        
        // Re-validate this node after reset
        await handleShallowValidation();
      } else {
        message.error('Failed to reset node to default');
      }
    } catch (error) {
      console.error('Error resetting node:', error);
      message.error(`Failed to reset node: ${error.message}`);
    }
  }, [validationMap, getValueByPath, updateByPath, handleShallowValidation]);

  // Calculate statistics for selected subtree or entire tree
  const displayStats = useMemo(() => {
    if (!hasData || !flattenedData) return treeStats;
    
    if (!selectedNodeKey) {
      return treeStats; // Show full tree stats if nothing selected
    }

    // Find all nodes that are descendants of the selected node
    const selectedNodes = flattenedData.filter(node => 
      node.key === selectedNodeKey || node.key.startsWith(selectedNodeKey + '.')
    );

    // Calculate stats for selected subtree
    const subtreeStats = {
      totalNodes: selectedNodes.length,
      types: {}
    };

    selectedNodes.forEach(node => {
      if (node.type) {
        subtreeStats.types[node.type] = (subtreeStats.types[node.type] || 0) + 1;
      }
    });

    return subtreeStats;
  }, [hasData, flattenedData, treeStats, selectedNodeKey]);
  
  // Auto-expand and scroll to current search match
  useEffect(() => {
    if (hasActiveSearch && searchResults.currentMatch) {
      const currentMatchPath = searchResults.currentMatch.path;
      const requiredExpansions = getRequiredExpansions();
      
      if (requiredExpansions.size > 0) {
        // Expand all required parent paths at once
        setExpandedKeys(prev => new Set([...prev, ...requiredExpansions]));
      }
      
      // Auto-select the current match for better visibility
      setSelectedNodeKey(currentMatchPath);
      
      // Scroll to the selected node after a short delay to ensure it's rendered
      setTimeout(() => {
        const element = document.querySelector(`[data-node-key="${currentMatchPath}"]`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [hasActiveSearch, currentMatchIndex, searchResults.currentMatch, getRequiredExpansions]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Auto-expand root level on initial load
  useEffect(() => {
    if (hasData && expandedKeys.size === 0) {
      const rootKeys = treeData.map(node => node.key).slice(0, 3); // First 3 root items
      setExpandedKeys(new Set(rootKeys));
    }
  }, [hasData, treeData]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Calculate drawer width
  const drawerWidth = useMemo(() => {
    return Math.max(600, Math.min(800, window.innerWidth * 0.7));
  }, []);
  
  // Drawer header content
  const headerContent = (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <Space>
          <BugOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
        </Space>
        
        <CloseOutlined 
          style={{ cursor: 'pointer', color: '#666' }}
          onClick={onClose}
        />
      </div>
      
      {/* Stats */}
      {hasData && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '4px', 
          fontSize: '12px', 
          color: '#666',
          paddingBottom: '8px'
        }}>
          <div style={{ marginBottom: '4px', minHeight: '36px' }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#666',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Schema Path:</span>
              {selectedNodeKey && (
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => setSelectedNodeKey(null)}
                  style={{ 
                    fontSize: '10px', 
                    padding: '0 4px',
                    color: '#ff4d4f',
                    height: 'auto'
                  }}
                >
                  × Clear
                </Button>
              )}
            </div>
            {selectedNodeKey ? (
              <Breadcrumb
                separator="."
                style={{ fontSize: '11px' }}
                items={selectedNodeKey.split('.').map((segment, index, array) => ({
                  title: (
                    <span 
                      style={{ 
                        color: index === array.length - 1 ? '#1890ff' : '#666',
                        fontWeight: index === array.length - 1 ? 500 : 400,
                        fontSize: '11px'
                      }}
                    >
                      {segment}
                    </span>
                  )
                }))}
              />
            ) : (
              <div style={{ 
                fontSize: '11px', 
                color: '#999', 
                fontStyle: 'italic',
                padding: '2px 0'
              }}>
                Click on a tree node to see its path
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>
              <DatabaseOutlined style={{ marginRight: '4px' }} />
              {displayStats.totalNodes} nodes {selectedNodeKey ? '(in subtree)' : '(total)'}
            </span>
            
            {Object.entries(displayStats.types).map(([type, count]) => (
              <span key={type}>
                {count} {type}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Search bar - fixed at top for better visibility */}
      {hasData && (
        <div style={{ 
          padding: '8px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e8e8e8',
          marginTop: '8px'
        }}>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClear={handleClearAll}
            hasResults={searchResults.hasResults}
            resultCount={totalMatches}
            currentMatchIndex={currentMatchIndex}
            onNext={goToNextMatch}
            onPrevious={goToPreviousMatch}
          />
        </div>
      )}
    </Space>
  );
  
  return (
    <Drawer
      title={null}
      placement="right"
      width={drawerWidth}
      open={visible}
      onClose={onClose}
      bodyStyle={{ 
        padding: '16px',
        backgroundColor: '#fafafa'
      }}
      headerStyle={{ 
        padding: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}
      style={{
        zIndex: 1001 // Ensure it's above other modals
      }}
    >
      {headerContent}
      
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Error state */}
        {!loading && !hasData && (
          <Alert
            type="info"
            message="No Context Data"
            description="Scenario context is empty or not loaded. Initialize a scenario to explore its structure."
            showIcon
          />
        )}
        
        {/* Search bar moved to header for better visibility */}

        {/* Debug search state - remove in production */}
        {process.env.NODE_ENV === 'development' && searchQuery && (
          <div style={{ 
            fontSize: '10px', 
            color: '#666', 
            padding: '4px 8px',
            backgroundColor: '#f0f0f0',
            marginBottom: '8px'
          }}>
            Debug: {searchResults.matchedPaths.size} matched paths, Current: {searchResults.currentMatch?.path || 'none'}
          </div>
        )}

        {/* Collapse controls */}
        {hasData && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 12px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            border: '1px solid #e8e8e8'
          }}>
            <Text type="secondary" style={{ fontSize: '11px', fontWeight: 500 }}>
              Tree Controls:
            </Text>
            <Space size="small">
              <Tooltip title="Collapse all branches">
                <Button 
                  size="small" 
                  icon={<ShrinkOutlined />} 
                  onClick={handleCollapseAll}
                  type="text"
                  style={{ fontSize: '11px' }}
                >
                  All
                </Button>
              </Tooltip>
              <Tooltip title="Collapse higher-level branches (keep deep items)">
                <Button 
                  size="small" 
                  icon={<FolderOutlined />} 
                  onClick={handleCollapseHigherBranches}
                  type="text"
                  style={{ fontSize: '11px' }}
                >
                  Higher
                </Button>
              </Tooltip>
              <Tooltip title="Collapse lower-level branches (keep shallow items)">
                <Button 
                  size="small" 
                  icon={<FileOutlined />} 
                  onClick={handleCollapseLowerBranches}
                  type="text"
                  style={{ fontSize: '11px' }}
                >
                  Lower
                </Button>
              </Tooltip>
              
              <Divider type="vertical" style={{ margin: '0 8px', height: '16px' }} />
              
              <Tooltip title={selectedNodeKey ? `Validate selected object: ${selectedNodeKey}` : 'Select an object to validate'}>
                <Button 
                  size="small" 
                  icon={<SafetyOutlined />} 
                  onClick={handleValidateSelected}
                  type="text"
                  disabled={!selectedNodeKey}
                  style={{ 
                    fontSize: '11px',
                    color: selectedNodeKey ? '#52c41a' : undefined
                  }}
                >
                  Validate
                </Button>
              </Tooltip>
              
              <Tooltip title={selectedNodeKey ? `Check children of: ${selectedNodeKey}` : 'Check root level children'}>
                <Button 
                  size="small" 
                  icon={<ThunderboltOutlined />} 
                  onClick={handleShallowValidation}
                  type="text"
                  loading={validatingOneLevel}
                  style={{ 
                    fontSize: '11px',
                    color: '#1890ff'
                  }}
                >
                  Check Children
                </Button>
              </Tooltip>

              <Tooltip title="Reset all highlights and clear selections (keeps expand/collapse state)">
                <Button 
                  size="small" 
                  icon={<ClearOutlined />} 
                  onClick={handleResetAll}
                  type="text"
                  style={{ 
                    fontSize: '11px',
                    color: '#52c41a'
                  }}
                >
                  Reset All
                </Button>
              </Tooltip>
            </Space>
          </div>
        )}
        
        {/* Tree view */}
        {hasData && (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #d9d9d9',
            minHeight: '400px'
          }}>
            <ContextTreeView
              treeData={treeData}
              onValueUpdate={handleValueUpdate}
              expandedKeys={expandedKeys}
              onExpand={setExpandedKeys}
              matchedPaths={searchResults.matchedPaths}
              loading={loading || isLoading}
              loadingProgress={loadingProgress}
              searchQuery={searchQuery}
              onNodeSelect={handleNodeSelect}
              selectedNodeKey={selectedNodeKey}
              isCurrentMatch={isCurrentMatch}
              originalData={scenarioData}
              validationMap={validationMap}
              onRemoveNode={handleRemoveNodeFromTree}
              onResetNode={handleResetNodeFromTree}
            />
          </div>
        )}
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && hasData && (
          <details style={{ fontSize: '10px', color: '#999' }}>
            <summary>Debug Info</summary>
            <pre style={{ fontSize: '9px', marginTop: '8px' }}>
              {JSON.stringify({
                totalNodes: treeStats.totalNodes,
                types: treeStats.types,
                searchResults: searchResults.results.length,
                expandedKeys: expandedKeys.size
              }, null, 2)}
            </pre>
          </details>
        )}
      </Space>
      
      {/* Schema Validation Modal */}
      <Modal
        title={
          <Space>
            <SafetyOutlined style={{ color: validationResult?.result?.isValid ? '#52c41a' : '#ff4d4f' }} />
            Schema Validation Results
          </Space>
        }
        open={validationModalVisible}
        onCancel={handleCloseValidationModal}
        footer={[
          <Button key="close" onClick={handleCloseValidationModal}>
            Close
          </Button>,
          // Show cleanup options based on validation status
          validationMap.get(selectedNodeKey)?.canRemove && (
            <Button 
              key="remove" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveCurrentNode()}
            >
              Remove (Not in Schema)
            </Button>
          ),
          validationMap.get(selectedNodeKey)?.canReset && (
            <Button 
              key="reset" 
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => handleResetCurrentNode()}
            >
              Reset to Default
            </Button>
          )
        ]}
        width={600}
        style={{ top: 50 }}
      >
        {validationLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Validating against schema..." />
          </div>
        ) : validationResult ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Validation Summary */}
            <div style={{ 
              padding: '12px',
              backgroundColor: validationResult.result.isValid ? '#f6ffed' : '#fff2f0',
              border: `1px solid ${validationResult.result.isValid ? '#b7eb8f' : '#ffccc7'}`,
              borderRadius: '6px'
            }}>
              <Space>
                {validationResult.result.isValid ? (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                ) : (
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                )}
                <Text strong style={{ 
                  color: validationResult.result.isValid ? '#389e0d' : '#cf1322' 
                }}>
                  {validationResult.result.isValid ? 'Validation Passed' : 'Validation Failed'}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {validationResult.timestamp}
                </Text>
              </Space>
            </div>
            
            {/* Path and Schema Chain */}
            <div>
              <Text strong>Path:</Text>
              <div style={{ 
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '12px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginTop: '4px'
              }}>
                {validationResult.path}
              </div>
            </div>
            
            {/* Schema Object Chain */}
            {validationResult.schemaChain && (
              <div>
                <Text strong>Schema Chain (Dot Notation):</Text>
                <div style={{ 
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '12px',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}>
                  {validationResult.schemaChain.map((segment, index, array) => (
                    <div key={index} style={{ marginBottom: '2px' }}>
                      <span style={{ color: segment.note ? '#d46b08' : '#389e0d' }}>
                        {segment.path}
                      </span>
                      {' → '}
                      <span style={{ color: '#666', fontSize: '11px' }}>
                        {segment.note || `${segment.type}${segment.required ? ' (required)' : ''}${segment.nullable ? ' (nullable)' : ''}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Text strong>Value:</Text>
              <div style={{ 
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '12px',
                padding: '8px',
                backgroundColor: '#1e1e1e',
                borderRadius: '4px',
                marginTop: '4px',
                maxHeight: '200px',
                overflow: 'auto',
                color: '#d4d4d4'
              }}>
                <pre 
                  style={{ margin: 0 }}
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify(validationResult.value, null, 2)
                      .replace(/(".*?")/g, '<span style="color: #ce9178">$1</span>')  // strings
                      .replace(/(\b\d+\.?\d*\b)/g, '<span style="color: #b5cea8">$1</span>')  // numbers
                      .replace(/(\btrue\b|\bfalse\b)/g, '<span style="color: #569cd6">$1</span>')  // booleans
                      .replace(/(\bnull\b)/g, '<span style="color: #569cd6">$1</span>')  // null
                      .replace(/([{}[\],])/g, '<span style="color: #ffffff">$1</span>')  // brackets/braces
                  }}
                />
              </div>
            </div>
            
            {/* Validation Details */}
            {validationResult.result.details && (
              <div>
                <Text strong>Validation Details:</Text>
                <div style={{ 
                  fontSize: '12px',
                  padding: '8px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}>
                  <div><Text type="secondary">Method:</Text> {validationResult.result.details.method}</div>
                  {validationResult.result.details.defaultValue !== undefined && (
                    <div><Text type="secondary">Default:</Text> {JSON.stringify(validationResult.result.details.defaultValue)}</div>
                  )}
                  <div><Text type="secondary">Applied:</Text> {validationResult.result.details.applied ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
            
            {/* Error Messages */}
            {!validationResult.result.isValid && validationResult.result.errors && validationResult.result.errors.length > 0 && (
              <div>
                <Text strong style={{ color: '#ff4d4f' }}>Validation Errors:</Text>
                <div style={{ marginTop: '4px' }}>
                  {validationResult.result.errors.map((error, index) => (
                    <div key={index} style={{ 
                      padding: '8px',
                      backgroundColor: '#fff2f0',
                      border: '1px solid #ffccc7',
                      borderRadius: '4px',
                      marginBottom: index < validationResult.result.errors.length - 1 ? '8px' : '0'
                    }}>
                      <Text style={{ color: '#cf1322', fontSize: '12px' }}>{error}</Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Space>
        ) : null}
      </Modal>
    </Drawer>
  );
};

export default ContextBrowser;