// frontend/src/components/AuditTrail/ContextBrowser/demo/ValidationDemo.jsx

/**
 * @fileoverview Demo component for testing the recursive validation system.
 * This is a development/testing component that demonstrates the validation API
 * and can be used to verify the implementation works correctly.
 */

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Progress, 
  Statistic, 
  Row, 
  Col, 
  Alert, 
  Typography,
  Space,
  Divider,
  Switch,
  InputNumber,
  Tag,
  Collapse
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ClearOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';

import { useRecursiveValidation } from '../hooks/useRecursiveValidation';
import { ValidationPresets } from '../validation';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * Demo component for testing recursive validation
 */
export const ValidationDemo = ({ className = '', style = {} }) => {
  const [preset, setPreset] = useState('default');
  const [customConfig, setCustomConfig] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Get the current preset configuration
  const currentConfig = {
    ...ValidationPresets[preset],
    ...customConfig
  };
  
  // Initialize validation hook
  const validation = useRecursiveValidation({
    ...currentConfig,
    onValidationStart: ({ validationId, totalNodes }) => {
      console.log(`ValidationDemo: Started validation ${validationId} with ${totalNodes} nodes`);
    },
    onValidationComplete: ({ validationId, results }) => {
      console.log(`ValidationDemo: Completed validation ${validationId}:`, results.summary);
    },
    onValidationError: (error) => {
      console.error('ValidationDemo: Validation error:', error);
    },
    onProgressUpdate: (progress) => {
      console.debug('ValidationDemo: Progress update:', progress);
    }
  });
  
  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handleStart = async () => {
    const success = await validation.startValidation();
    if (!success) {
      console.warn('ValidationDemo: Failed to start validation');
    }
  };
  
  const handlePause = () => {
    validation.pauseValidation();
  };
  
  const handleResume = () => {
    validation.resumeValidation();
  };
  
  const handleCancel = () => {
    validation.cancelValidation();
  };
  
  const handleClear = () => {
    validation.clearValidation();
  };
  
  const handleClearCache = () => {
    validation.clearCache();
  };
  
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    setCustomConfig({}); // Reset custom config when changing presets
  };
  
  const handleConfigChange = (key, value) => {
    setCustomConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // ============================================================================
  // Render Helpers
  // ============================================================================
  
  const renderControlButtons = () => (
    <Space size="middle">
      <Button
        type="primary"
        icon={<PlayCircleOutlined />}
        onClick={handleStart}
        disabled={!validation.canStart}
        loading={validation.isValidating && !validation.isPaused}
      >
        Start
      </Button>
      
      {validation.canPause && (
        <Button
          icon={<PauseCircleOutlined />}
          onClick={handlePause}
        >
          Pause
        </Button>
      )}
      
      {validation.canResume && (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleResume}
        >
          Resume
        </Button>
      )}
      
      <Button
        danger
        onClick={handleCancel}
        disabled={!validation.canCancel}
      >
        Cancel
      </Button>
      
      <Button
        icon={<ClearOutlined />}
        onClick={handleClear}
        disabled={!validation.hasResults && !validation.isValidating}
      >
        Clear
      </Button>
    </Space>
  );
  
  const renderStatus = () => {
    if (!validation.hasScenarioData) {
      return <Alert message="No scenario data available" type="warning" showIcon />;
    }
    
    if (validation.isContextLoading) {
      return <Alert message="Loading scenario data..." type="info" showIcon />;
    }
    
    if (validation.hasError) {
      return <Alert message={`Error: ${validation.state.error}`} type="error" showIcon />;
    }
    
    if (validation.isValidating) {
      const status = validation.isPaused ? 'Paused' : 'Running';
      return <Alert message={`Validation ${status}`} type="info" showIcon />;
    }
    
    if (validation.isCompleted) {
      return <Alert message="Validation completed successfully" type="success" showIcon />;
    }
    
    return <Alert message="Ready to start validation" type="info" showIcon />;
  };
  
  const renderProgress = () => {
    if (!validation.isValidating && !validation.isCompleted) {
      return null;
    }
    
    return (
      <Card size="small" title="Progress">
        <Progress
          percent={validation.progress.percentComplete}
          status={validation.isPaused ? 'active' : 'normal'}
          showInfo
        />
        
        <Row gutter={[16, 8]} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic
              title="Total Nodes"
              value={validation.progress.totalNodes}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Processed"
              value={validation.progress.processedNodes}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Valid"
              value={validation.progress.validNodes}
              valueStyle={{ fontSize: '14px', color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Invalid"
              value={validation.progress.invalidNodes}
              valueStyle={{ fontSize: '14px', color: '#ff4d4f' }}
            />
          </Col>
        </Row>
        
        {validation.progress.estimatedTimeRemaining && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Estimated time remaining: {Math.round(validation.progress.estimatedTimeRemaining / 1000)}s
          </Text>
        )}
      </Card>
    );
  };
  
  const renderResults = () => {
    if (!validation.hasResults) {
      return null;
    }
    
    return (
      <Card size="small" title="Results Summary">
        <Row gutter={[16, 8]}>
          <Col span={6}>
            <Statistic
              title="Total Results"
              value={validation.resultCounts.total}
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Valid"
              value={validation.resultCounts.valid}
              valueStyle={{ fontSize: '16px', color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Invalid"
              value={validation.resultCounts.invalid}
              valueStyle={{ fontSize: '16px', color: '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Warnings"
              value={validation.resultCounts.warnings}
              valueStyle={{ fontSize: '16px', color: '#faad14' }}
            />
          </Col>
        </Row>
        
        {validation.results.summary && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Processing Time: </Text>
            <Text>{Math.round(validation.results.summary.processingTime)}ms</Text>
            
            <br />
            
            <Text strong>Cache Hit Rate: </Text>
            <Text>{Math.round(validation.results.summary.cacheHitRate * 100) / 100}%</Text>
            
            <br />
            
            <Text strong>Max Depth: </Text>
            <Text>{validation.results.summary.maxDepth}</Text>
          </div>
        )}
      </Card>
    );
  };
  
  const renderConfiguration = () => (
    <Card 
      size="small" 
      title="Configuration" 
      extra={
        <Switch
          checked={showAdvanced}
          onChange={setShowAdvanced}
          checkedChildren="Advanced"
          unCheckedChildren="Basic"
        />
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Preset: </Text>
        <Space>
          {Object.keys(ValidationPresets).map(presetKey => (
            <Tag
              key={presetKey}
              color={preset === presetKey ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => handlePresetChange(presetKey)}
            >
              {presetKey}
            </Tag>
          ))}
        </Space>
      </div>
      
      {showAdvanced && (
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Text>Batch Size:</Text>
            <InputNumber
              value={currentConfig.batchSize}
              onChange={value => handleConfigChange('batchSize', value)}
              min={1}
              max={500}
              style={{ width: '100%', marginTop: 4 }}
            />
          </Col>
          <Col span={8}>
            <Text>Max Depth:</Text>
            <InputNumber
              value={currentConfig.maxDepth}
              onChange={value => handleConfigChange('maxDepth', value)}
              min={1}
              max={50}
              style={{ width: '100%', marginTop: 4 }}
            />
          </Col>
          <Col span={8}>
            <Text>Batch Delay (ms):</Text>
            <InputNumber
              value={currentConfig.batchDelayMs}
              onChange={value => handleConfigChange('batchDelayMs', value)}
              min={0}
              max={1000}
              style={{ width: '100%', marginTop: 4 }}
            />
          </Col>
        </Row>
      )}
    </Card>
  );
  
  const renderCacheStats = () => {
    const cacheStats = validation.getCacheStats();
    
    if (!cacheStats) {
      return null;
    }
    
    return (
      <Card size="small" title="Cache Statistics">
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Statistic
              title="Hit Rate"
              value={cacheStats.hitRate}
              suffix="%"
              precision={2}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Size"
              value={`${cacheStats.currentSize}/${cacheStats.maxSize}`}
              valueStyle={{ fontSize: '14px' }}
            />
          </Col>
          <Col span={8}>
            <Button size="small" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </Col>
        </Row>
      </Card>
    );
  };
  
  // ============================================================================
  // Main Render
  // ============================================================================
  
  return (
    <div className={className} style={style}>
      <Card
        title={
          <Space>
            <BarChartOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Recursive Validation Demo
            </Title>
          </Space>
        }
        extra={<SettingOutlined />}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Status */}
          {renderStatus()}
          
          {/* Controls */}
          <div>
            <Title level={5}>Controls</Title>
            {renderControlButtons()}
          </div>
          
          {/* Progress */}
          {renderProgress()}
          
          {/* Results */}
          {renderResults()}
          
          <Divider />
          
          {/* Configuration */}
          <Collapse>
            <Panel header="Configuration" key="config">
              {renderConfiguration()}
            </Panel>
            <Panel header="Cache Statistics" key="cache">
              {renderCacheStats()}
            </Panel>
          </Collapse>
          
          {/* Info */}
          <Alert
            message="Development Component"
            description={
              <div>
                <Paragraph style={{ margin: 0 }}>
                  This demo component tests the recursive validation system. 
                  It validates the entire scenario data tree using the Context Browser's 
                  validation infrastructure.
                </Paragraph>
                <Paragraph style={{ margin: '8px 0 0 0' }}>
                  <Text strong>Note:</Text> This component is for development and testing purposes only.
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />
        </Space>
      </Card>
    </div>
  );
};

export default ValidationDemo;