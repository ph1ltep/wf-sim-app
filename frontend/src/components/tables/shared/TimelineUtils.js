// src/components/tables/shared/TimelineUtils.js - Timeline marker utilities

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
 * Create timeline-aware year column with marker styling
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
                    <div style={{
                        fontWeight: 600,
                        fontSize: '13px',
                        color: marker.color,
                        backgroundColor: `${marker.color}15`,
                        padding: '6px 5px',
                        textAlign: 'center',
                        borderRadius: '4px',
                        margin: '2px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <span>{formatProjectYear(year)}</span>
                        {marker.tag && (
                            <div style={{
                                fontSize: '10px',
                                lineHeight: '16px',
                                margin: 0,
                                padding: '0 5px',
                                fontWeight: 600,
                                backgroundColor: marker.color,
                                color: 'white',
                                borderRadius: '2px'
                            }}>
                                {marker.tag}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                <div style={{ fontWeight: 500, padding: '4px 0' }}>
                    {formatProjectYear(year)}
                </div>
            );
        }
    };
};

/**
 * Apply timeline markers to column headers
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
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px'
                        }}>
                            <span style={{
                                fontWeight: marker ? 600 : 500,
                                color: marker ? marker.color : '#262626'
                            }}>
                                {formatProjectYear(year)}
                            </span>
                            {marker && (
                                <div style={{
                                    fontSize: '9px',
                                    lineHeight: '14px',
                                    margin: 0,
                                    padding: '0 4px',
                                    fontWeight: 500,
                                    backgroundColor: marker.color,
                                    color: 'white',
                                    borderRadius: '2px'
                                }}>
                                    {marker.tag}
                                </div>
                            )}
                        </div>
                    ),
                    className: marker ? 'timeline-marker-column' : '',
                    onHeaderCell: () => ({
                        style: marker ? {
                            backgroundColor: `${marker.color}15`,
                            borderColor: `${marker.color}40`,
                            borderWidth: '2px'
                        } : {}
                    }),
                    onCell: () => ({
                        style: marker ? {
                            backgroundColor: `${marker.color}08`,
                            borderLeft: '0px',
                            borderRight: '0px'
                        } : {}
                    })
                };
            }
        }

        return columnConfig;
    });
};