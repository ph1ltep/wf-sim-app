// src/components/AuditTrail/ContextBrowser/components/SearchBar.jsx

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Input, Space, Typography, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Search bar component for context browser
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Search change handler
 * @param {Function} props.onClear - Clear search handler
 * @param {boolean} props.hasResults - Whether search has results
 * @param {number} props.resultCount - Number of search results
 */
const SearchBar = ({
  searchQuery,
  onSearchChange,
  onClear,
  hasResults,
  resultCount = 0
}) => {
  const inputRef = useRef(null);
  
  // Handle search input change - only store value, don't trigger search
  const [inputValue, setInputValue] = useState(searchQuery);
  
  const handleChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);
  
  // Handle Enter key to trigger search
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSearchChange(inputValue.trim());
    }
  }, [inputValue, onSearchChange]);
  
  // Handle clear search
  const handleClear = useCallback(() => {
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onClear]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setInputValue('');
      handleClear();
    }
  }, [handleClear]);
  
  // Update local input value when search query changes externally
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Input
        ref={inputRef}
        placeholder="Search paths, values, or types... (Press Enter to search)"
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        suffix={
          searchQuery && (
            <Tooltip title="Clear search (Esc)">
              <ClearOutlined
                style={{ 
                  color: '#bfbfbf', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                onClick={handleClear}
              />
            </Tooltip>
          )
        }
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPressEnter={handleKeyPress}
        allowClear={false} // We handle clear manually
        style={{
          borderRadius: '6px'
        }}
      />
      
      {/* Search results info */}
      {searchQuery && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#666',
          paddingLeft: '4px'
        }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {hasResults ? (
              <>
                <span style={{ color: '#52c41a', fontWeight: 500 }}>
                  {resultCount}
                </span>
                {' '}
                {resultCount === 1 ? 'match' : 'matches'} found
              </>
            ) : searchQuery.length >= 2 ? (
              <span style={{ color: '#fa8c16' }}>No matches found</span>
            ) : (
              <span style={{ color: '#bfbfbf' }}>Type 2+ characters to search</span>
            )}
          </Text>
          
          {searchQuery && (
            <Text type="secondary" style={{ fontSize: '10px' }}>
              Press Esc to clear
            </Text>
          )}
        </div>
      )}
    </Space>
  );
};

export default SearchBar;