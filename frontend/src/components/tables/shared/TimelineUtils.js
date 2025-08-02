// src/components/tables/shared/TimelineUtils.js - Updated with consolidated timeline classes
import { formatProjectYear } from './FormatUtils';

/**
 * Check if a year matches any timeline marker
 * @param {number} year - Year to check
 * @param {Array} timelineMarkers - Array of timeline marker objects
 * @returns {Object|null} Matching marker or null
 */
export const getTimelineMarker = (year, timelineMarkers = []) => {
    return timelineMarkers.find(marker => marker.year === year) || null;
};

/**
 * Create timeline-aware year column with consolidated styling
 * @param {Object} options - Column options including timeline markers
 * @returns {Object} Enhanced year column configuration
 */
export const createTimelineYearColumn = (options = {}) => {
    const {
        width = 140,
        fixed = 'left',
        sortable = true,
        timelineMarkers = [],
        orientation = 'horizontal'
    } = options;

    return {
        title: 'Year',
        dataIndex: 'year',
        key: 'year',
        fixed,
        width,
        ...(sortable && { sorter: (a, b) => a.year - b.year }),
        render: (year, record) => {
            const marker = getTimelineMarker(year, timelineMarkers);

            if (marker) {
                return (
                    <div
                        className="timeline-cell"
                        style={{
                            '--marker-color': marker.color,
                            color: marker.color,
                            backgroundColor: `${marker.color}15`
                        }}
                    >
                        <span className="timeline-text">{formatProjectYear(year)}</span>
                        {marker.tag && (
                            <div className="cell-tag" style={{
                                backgroundColor: marker.color,
                                color: 'white'
                            }}>
                                {marker.tag}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div className="timeline-cell">
                    <span className="timeline-text">{formatProjectYear(year)}</span>
                </div>
            );
        }
    };
};

/**
 * Apply timeline markers to column headers - UPDATED with consolidated classes
 * @param {Array} dataColumns - Array of column configurations
 * @param {Array} timelineMarkers - Timeline markers for header styling
 * @param {Object} options - Additional options
 * @returns {Array} Enhanced column configurations with timeline styling
 */
export const applyTimelineMarkersToColumns = (dataColumns, timelineMarkers = [], options = {}) => {
    const { orientation = 'horizontal' } = options;

    return dataColumns.map(columnConfig => {
        if (orientation === 'horizontal' && columnConfig.key && columnConfig.key.startsWith('year-')) {
            const year = parseInt(columnConfig.key.replace('year-', ''));
            const marker = getTimelineMarker(year, timelineMarkers);

            if (marker) {
                return {
                    ...columnConfig,
                    title: (
                        <div className="timeline-header">
                            <span
                                className="timeline-text"
                                style={{
                                    fontWeight: 600,
                                    color: marker ? marker.color : '#262626'
                                }}
                            >
                                {formatProjectYear(year)}
                            </span>
                            {marker && (
                                <div className="cell-tag" style={{
                                    backgroundColor: marker.color,
                                    color: 'white'
                                }}>
                                    {marker.tag}
                                </div>
                            )}
                        </div>
                    ),
                    className: marker ? 'timeline-marker-column' : '',
                    onHeaderCell: () => ({
                        style: marker ? {
                            '--marker-color': marker.color,
                            backgroundColor: `${marker.color}15`,
                            borderColor: `${marker.color}40`,
                            borderWidth: '2px'
                        } : {}
                    }),
                    onCell: () => ({
                        style: marker ? {
                            '--marker-color': marker.color,
                            backgroundColor: `${marker.color}08`
                        } : {}
                    })
                };
            }
        }

        return columnConfig;
    });
};

/**
 * Generate timeline row classes for vertical orientation
 * @param {Object} record - Table row record
 * @param {string} orientation - Table orientation
 * @returns {string|undefined} CSS class string or undefined
 */
export const getTimelineRowClasses = (record, orientation = 'vertical') => {
    if (orientation !== 'vertical' || !record.timelineMarker) return undefined;

    const classes = ['timeline-marker-row'];
    const marker = record.timelineMarker;

    if (marker.tag) {
        classes.push(`timeline-marker-${marker.tag.toLowerCase().replace(/\s+/g, '-')}`);
    }
    if (marker.type) {
        classes.push(`marker-type-${marker.type}`);
    }
    if (marker.key) {
        classes.push(`marker-key-${marker.key}`);
    }

    return classes.join(' ');
};

/**
 * Generate timeline marker styles for data-driven color overrides
 * @param {Object} marker - Timeline marker object
 * @returns {Object} CSS style object
 */
export const getTimelineMarkerStyles = (marker) => {
    if (!marker || !marker.color) return {};

    return {
        '--marker-color': marker.color,
        backgroundColor: `${marker.color}08`,
        borderLeft: `3px solid ${marker.color}`
    };
};

/**
 * Enhanced timeline marker utilities for theme integration
 */
export const timelineUtils = {
    getTimelineMarker,
    createTimelineYearColumn,
    applyTimelineMarkersToColumns,
    getTimelineRowClasses,
    getTimelineMarkerStyles,

    /**
     * Check if a record should have timeline styling
     */
    hasTimelineMarker: (record) => {
        return record && record.timelineMarker && typeof record.timelineMarker === 'object';
    },

    /**
     * Get marker color with fallback
     */
    getMarkerColor: (marker, fallbackColor = '#1677ff') => {
        return marker && marker.color ? marker.color : fallbackColor;
    },

    /**
     * Format timeline marker tag for display
     */
    formatMarkerTag: (marker) => {
        if (!marker || !marker.tag) return '';
        return marker.tag.toUpperCase();
    }
};