// src/components/AuditTrail/ContextBrowser/components/SearchBar.jsx

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Input, Space, Typography, Tooltip, Button } from 'antd';
import { SearchOutlined, ClearOutlined, UpOutlined, DownOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Search bar component for context browser
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onSearchChange - Search change handler
 * @param {Function} props.onClear - Clear search handler
 * @param {boolean} props.hasResults - Whether search has results
 * @param {number} props.resultCount - Number of search results
 * @param {number} props.currentMatchIndex - Current match index (0-based)
 * @param {Function} props.onNext - Go to next match
 * @param {Function} props.onPrevious - Go to previous match
 */
const SearchBar = ({
  searchQuery,
  onSearchChange,
  onClear,
  hasResults,
  resultCount = 0,
  currentMatchIndex = 0,
  onNext,
  onPrevious
}) => {
  const inputRef = useRef(null);
  
  // Handle search input change - store value, trigger search on Enter only
  const [inputValue, setInputValue] = useState(searchQuery);
  
  const handleChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);
  
  // Handle Enter to search and navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (hasResults && searchQuery) {
        // Navigate if we already have results
        if (e.shiftKey) {
          onPrevious?.();
        } else {
          onNext?.();
        }
      } else {
        // Trigger new search
        if (inputValue.trim()) {
          onSearchChange(inputValue.trim());
        }
      }
    }
    if (e.key === 'F3' && hasResults) {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevious?.();
      } else {
        onNext?.();
      }
    }
  }, [hasResults, onNext, onPrevious, onSearchChange, inputValue, searchQuery]);
  
  // Handle clear search
  const handleClear = useCallback(() => {
    setInputValue('');
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onClear]);
  
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px'
      }}>
        <Input
          ref={inputRef}
          placeholder="Search paths, values, types... (Press Enter to search)"
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          suffix={
            (searchQuery || inputValue) && (
              <Tooltip title="Clear search">
                <ClearOutlined
                  style={{ 
                    color: '#ff4d4f', 
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
          allowClear={false}
          style={{
            borderRadius: '6px',
            flex: 1
          }}
        />
        
        {/* Navigation controls */}
        {hasResults && (
          <Space size={0}>
            <Tooltip title="Previous match (Shift+Enter, Shift+F3)">
              <Button
                size="small"
                type="text"
                icon={<UpOutlined />}
                onClick={onPrevious}
                disabled={resultCount === 0}
                style={{ 
                  fontSize: '11px',
                  width: '24px',
                  height: '24px'
                }}
              />
            </Tooltip>
            <Tooltip title="Next match (Enter, F3)">
              <Button
                size="small"
                type="text"
                icon={<DownOutlined />}
                onClick={onNext}
                disabled={resultCount === 0}
                style={{ 
                  fontSize: '11px',
                  width: '24px',
                  height: '24px'
                }}
              />
            </Tooltip>
          </Space>
        )}
      </div>
      
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
                <span style={{ color: '#1890ff', fontWeight: 500 }}>
                  {currentMatchIndex + 1} of {resultCount}
                </span>
                {' '}
                {resultCount === 1 ? 'match' : 'matches'}
                <span style={{ color: '#52c41a', marginLeft: '8px', fontSize: '10px' }}>
                  (Auto-expanding to show match)
                </span>
              </>
            ) : searchQuery.length >= 1 ? (
              <span style={{ color: '#fa8c16' }}>No matches found</span>
            ) : (
              <span style={{ color: '#bfbfbf' }}>Press Enter to search</span>
            )}
          </Text>
          
          {hasResults && (
            <Text type="secondary" style={{ fontSize: '10px' }}>
              Enter/F3 for next • Shift+Enter/F3 for previous
            </Text>
          )}
        </div>
      )}
    </Space>
  );
};

export default SearchBar;