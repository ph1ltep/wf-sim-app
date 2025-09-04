// src/components/AuditTrail/ContextBrowser/index.jsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Drawer, Typography, Space, message, Alert, Divider } from 'antd';
import { BugOutlined, DatabaseOutlined, CloseOutlined } from '@ant-design/icons';
import { useScenario } from '../../../contexts/ScenarioContext';
import { useContextTree } from './hooks/useContextTree';
import { useContextSearch } from './hooks/useContextSearch';
import SearchBar from './components/SearchBar';
import ContextTreeView from './components/ContextTreeView';
import { useDebouncedCallback } from 'use-debounce';

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
  
  // Process scenario data into tree structure
  const { treeData, flattenedData, treeStats, hasData } = useContextTree(scenarioData);
  
  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    isNodeMatched,
    isNodeVisible,
    hasActiveSearch
  } = useContextSearch(flattenedData);
  
  // Debounced search to improve performance
  const debouncedSetSearchQuery = useDebouncedCallback(
    (query) => setSearchQuery(query),
    300
  );
  
  // Handle search change
  const handleSearchChange = useCallback((query) => {
    debouncedSetSearchQuery(query);
  }, [debouncedSetSearchQuery]);
  
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
  
  // Auto-expand search results
  useEffect(() => {
    if (hasActiveSearch && searchResults.expandedKeys.size > 0) {
      setExpandedKeys(new Set([...expandedKeys, ...searchResults.expandedKeys]));
    }
  }, [searchResults.expandedKeys, hasActiveSearch]); // eslint-disable-line react-hooks/exhaustive-deps
  
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
          gap: '16px', 
          fontSize: '12px', 
          color: '#666',
          paddingBottom: '8px'
        }}>
          <span>
            <DatabaseOutlined style={{ marginRight: '4px' }} />
            {treeStats.totalNodes} nodes
          </span>
          
          {Object.entries(treeStats.types).map(([type, count]) => (
            <span key={type}>
              {count} {type}
            </span>
          ))}
        </div>
      )}
      
      <Divider style={{ margin: '8px 0' }} />
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
        
        {/* Search bar */}
        {hasData && (
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClear={clearSearch}
            hasResults={searchResults.hasResults}
            resultCount={searchResults.results.length}
          />
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
              isNodeVisible={isNodeVisible}
              loading={loading}
              searchQuery={searchQuery}
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
    </Drawer>
  );
};

export default ContextBrowser;