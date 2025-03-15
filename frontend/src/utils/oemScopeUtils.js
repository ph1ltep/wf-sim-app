// src/utils/oemScopeUtils.js
import React from 'react';

/**
 * Format currency to display with $ sign and commas
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value) return '';
  return `$${value.toLocaleString()}`;
};

/**
 * Generate detailed tooltip content for an OEM scope tag
 * @param {string} tag - Tag identifier
 * @param {Object} scope - OEM scope object
 * @returns {JSX.Element} Tooltip content
 */
export const getTagTooltip = (tag, scope) => {
  switch(tag) {
    case 'PM':
      return (
        <div>
          <div><strong>Preventive Maintenance</strong></div>
          <div>Regular scheduled maintenance activities to keep turbines operating efficiently</div>
          <div>Frequency: According to manufacturer recommendations</div>
        </div>
      );
    case 'BI':
      return (
        <div>
          <div><strong>Blade Inspections</strong></div>
          <div>Regular inspections of turbine blades for damage and wear</div>
          <div>Typically includes visual inspections and non-destructive testing</div>
        </div>
      );
    case 'RM':
      return (
        <div>
          <div><strong>Remote Monitoring</strong></div>
          <div>24/7 SCADA monitoring of turbine performance and status</div>
          <div>Includes alerts and notifications for issues</div>
        </div>
      );
    case 'RTS':
      return (
        <div>
          <div><strong>Remote Technical Support</strong></div>
          <div>Technical support provided remotely</div>
          <div>Includes troubleshooting and guidance for on-site technicians</div>
        </div>
      );
    case 'SM':
      return (
        <div>
          <div><strong>Site Management</strong></div>
          <div>Overall management of site operations</div>
          <div>Includes coordination of maintenance activities and reporting</div>
        </div>
      );
    case 'Tech':
      return (
        <div>
          <div><strong>Technicians</strong></div>
          <div>On-site technicians for maintenance and repairs</div>
          <div>Coverage: {scope.technicianPercent}% of required staffing</div>
          <div>{scope.technicianPercent === 100 ? 'Full staffing provided' : 'Partial staffing - may require additional personnel'}</div>
        </div>
      );
    case 'Minor':
      return (
        <div>
          <div><strong>Minor Components</strong></div>
          <div>Repair and replacement of minor turbine components</div>
          <div>Typically includes electrical components, sensors, and small mechanical parts</div>
        </div>
      );
    case 'BIM':
      return (
        <div>
          <div><strong>Blade Integrity Management</strong></div>
          <div>Comprehensive program for monitoring and maintaining blade condition</div>
          <div>Includes inspections, repairs, and preventive actions</div>
        </div>
      );
    case 'Crane':
      return (
        <div>
          <div><strong>Crane Coverage</strong></div>
          <div>Provision of cranes for major component replacements</div>
          {scope.craneEventCap > 0 && (
            <div><strong>Event Cap:</strong> {scope.craneEventCap} events per year</div>
          )}
          {scope.craneFinancialCap > 0 && (
            <div><strong>Financial Cap:</strong> {formatCurrency(scope.craneFinancialCap)} per year</div>
          )}
          {scope.craneEventCap === 0 && scope.craneFinancialCap === 0 && (
            <div><strong>No capping</strong> - Unlimited crane service events</div>
          )}
        </div>
      );
    case 'Major':
      const parts = [];
      if (scope.correctiveMajorDetails?.tooling) parts.push('Tooling');
      if (scope.correctiveMajorDetails?.manpower) parts.push('Manpower');
      if (scope.correctiveMajorDetails?.parts) parts.push('Parts');
      
      return (
        <div>
          <div><strong>Major Components</strong></div>
          <div>Repair and replacement of major turbine components</div>
          {parts.length > 0 && (
            <div>
              <strong>Coverage includes:</strong>
              <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                {parts.map(part => <li key={part}>{part}</li>)}
              </ul>
            </div>
          )}
          {scope.majorEventCap > 0 && (
            <div><strong>Event Cap:</strong> {scope.majorEventCap} events per year</div>
          )}
          {scope.majorFinancialCap > 0 && (
            <div><strong>Financial Cap:</strong> {formatCurrency(scope.majorFinancialCap)} per year</div>
          )}
          {scope.majorEventCap === 0 && scope.majorFinancialCap === 0 && parts.length > 0 && (
            <div><strong>No capping</strong> - Unlimited major component replacements</div>
          )}
        </div>
      );
    default:
      return <div>{tag}</div>;
  }
};

/**
 * Create a tooltipped tag component
 * @param {string} tag - Tag type (PM, BI, etc.)
 * @param {Object} scope - The scope object containing tag properties
 * @param {Object} tagProps - Props to pass to the tag (color, etc.)
 * @param {string} children - Tag content
 * @returns {JSX.Element} Tag with tooltip
 */
export const createTooltippedTag = (tag, scope, TagComponent, tagProps, children) => {
  return (
    <div style={{ display: 'inline-block' }}>
      <TagComponent {...tagProps}>{children}</TagComponent>
    </div>
  );
};

/**
 * Render OEM scope tags with tooltips
 * @param {Object} scope - OEM scope object
 * @param {Component} TagComponent - Tag component to use
 * @returns {Array} Array of tooltipped tag components
 */
export const renderScopeTags = (scope, TagComponent) => {
  if (!scope) return [];
  
  const tags = [];
  
  // Preventive Maintenance
  if (scope.preventiveMaintenance === true) {
    tags.push({
      id: 'pm',
      tag: 'PM',
      color: '#52c41a',
      content: 'PM'
    });
  }
  
  if (scope.bladeInspections === true) {
    tags.push({
      id: 'bi',
      tag: 'BI',
      color: '#1890ff',
      content: 'BI'
    });
  }
  
  // Remote Support
  if (scope.remoteMonitoring === true) {
    tags.push({
      id: 'rm',
      tag: 'RM',
      color: '#13c2c2',
      content: 'RM'
    });
  }
  
  if (scope.remoteTechnicalSupport === true) {
    tags.push({
      id: 'rts',
      tag: 'RTS',
      color: '#096dd9',
      content: 'RTS'
    });
  }
  
  // Site Personnel
  if (scope.siteManagement === true) {
    tags.push({
      id: 'sm',
      tag: 'SM',
      color: '#fa8c16',
      content: 'SM'
    });
  }
  
  if (typeof scope.technicianPercent === 'number' && scope.technicianPercent > 0) {
    tags.push({
      id: 'tech',
      tag: 'Tech',
      color: '#faad14',
      content: `Tech: ${scope.technicianPercent}%`
    });
  }
  
  // Corrective Maintenance
  if (scope.correctiveMinor === true) {
    tags.push({
      id: 'minor',
      tag: 'Minor',
      color: '#eb2f96',
      content: 'Minor'
    });
  }
  
  if (scope.bladeIntegrityManagement === true) {
    tags.push({
      id: 'bim',
      tag: 'BIM',
      color: '#722ed1',
      content: 'BIM'
    });
  }
  
  // Crane Coverage
  if (scope.craneCoverage === true) {
    const craneContent = `Crane${(scope.craneEventCap > 0 || scope.craneFinancialCap > 0) ? ' (Capped)' : ''}`;
    tags.push({
      id: 'crane',
      tag: 'Crane',
      color: '#ff7a45',
      content: craneContent
    });
  }
  
  // Major Components
  if (scope.correctiveMajor === true) {
    let majorContent = 'Major';
    
    // Add details for components
    if (scope.correctiveMajorDetails) {
      const components = [
        scope.correctiveMajorDetails.tooling === true ? 'T' : '',
        scope.correctiveMajorDetails.manpower === true ? 'M' : '',
        scope.correctiveMajorDetails.parts === true ? 'P' : ''
      ].filter(Boolean);
      
      if (components.length > 0) {
        majorContent += ` (${components.join('')})`;
      }
    }
    
    // Add capping indicator
    if (scope.majorEventCap > 0 || scope.majorFinancialCap > 0) {
      if (scope.correctiveMajorDetails && 
          [
            scope.correctiveMajorDetails.tooling === true ? 'T' : '',
            scope.correctiveMajorDetails.manpower === true ? 'M' : '',
            scope.correctiveMajorDetails.parts === true ? 'P' : ''
          ].filter(Boolean).length > 0) {
        majorContent += " Capped";
      } else {
        majorContent += " (Capped)";
      }
    }
    
    tags.push({
      id: 'major',
      tag: 'Major',
      color: '#f5222d',
      content: majorContent
    });
  }
  
  return tags;
};