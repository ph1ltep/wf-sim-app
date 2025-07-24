// frontend/src/hooks/useCubeMetrics.js
import { useMemo, useCallback } from 'react';
import { useCube } from '../contexts/CubeContext';
import { METRICS_REGISTRY } from '../utils/cube/metrics/registry';
import { getCategoryColorScheme } from '../utils/charts/colors';
import { get } from 'lodash';
import { col } from 'jstat';

/**
 * Hook for cube metrics operations with MetricsTable integration
 */
export const useCubeMetrics = () => {
    const { metricsData, getCubeStatus, getPercentileData } = useCube();
    const cubeStatus = getCubeStatus(); // Get cube status for monitoring
    const percentileInfo = getPercentileData(); // Get percentile info for configuration

    /**
     * Get metric data with same interface as CubeContext.getMetric
     * @param {Object} filters - Filter parameters
     * @returns {Object} Metrics data
     */
    const getMetric = useCallback((filters) => {
        if (!metricsData?.length) return {};

        const {
            metricId,
            metricIds,
            percentile,
            metadataFilters
        } = filters;

        // Validation
        if (!metricId && !metricIds && percentile === undefined) {
            console.warn('getMetric: Must provide metricId, metricIds, or percentile parameter');
            return {};
        }

        // Pre-compute metadata filter function
        let metadataFilterFn = null;
        if (metadataFilters) {
            const filterEntries = Object.entries(metadataFilters);
            if (filterEntries.length > 0) {
                metadataFilterFn = (metadata) => filterEntries.every(([key, value]) => metadata[key] === value);
            }
        }

        // Mode 1: Single metric, all percentiles
        if (metricId && percentile === undefined) {
            const metric = metricsData.find(m => m.id === metricId);
            if (!metric || (metadataFilterFn && !metadataFilterFn(metric.metadata))) return {};

            const result = {};
            const percentileMetrics = metric.percentileMetrics;
            const metadata = metric.metadata;

            for (let i = 0; i < percentileMetrics.length; i++) {
                const pm = percentileMetrics[i];
                result[pm.percentile.value] = {
                    value: pm.value,
                    stats: pm.stats,
                    metadata
                };
            }
            return result;
        }

        // Mode 2: Single percentile, all metrics
        if (percentile !== undefined && !metricId && !metricIds) {
            const result = {};

            for (let i = 0; i < metricsData.length; i++) {
                const metric = metricsData[i];

                if (metadataFilterFn && !metadataFilterFn(metric.metadata)) continue;

                const percentileMetrics = metric.percentileMetrics;
                let percentileResult = null;

                for (let j = 0; j < percentileMetrics.length; j++) {
                    if (percentileMetrics[j].percentile.value === percentile) {
                        percentileResult = percentileMetrics[j];
                        break;
                    }
                }

                if (percentileResult) {
                    result[metric.id] = {
                        value: percentileResult.value,
                        stats: percentileResult.stats,
                        metadata: metric.metadata
                    };
                }
            }
            return result;
        }

        // Mode 3: Single metric + single percentile
        if (metricId && percentile !== undefined) {
            const metric = metricsData.find(m => m.id === metricId);
            if (!metric || (metadataFilterFn && !metadataFilterFn(metric.metadata))) return {};

            const percentileMetrics = metric.percentileMetrics;
            for (let i = 0; i < percentileMetrics.length; i++) {
                if (percentileMetrics[i].percentile.value === percentile) {
                    return {
                        [metric.id]: {
                            value: percentileMetrics[i].value,
                            stats: percentileMetrics[i].stats,
                            metadata: metric.metadata
                        }
                    };
                }
            }
            return {};
        }

        // Mode 4: Multiple metrics + single percentile
        if (metricIds && percentile !== undefined) {
            const metricIdSet = new Set(metricIds);
            const result = {};

            for (let i = 0; i < metricsData.length; i++) {
                const metric = metricsData[i];

                if (!metricIdSet.has(metric.id)) continue;
                if (metadataFilterFn && !metadataFilterFn(metric.metadata)) continue;

                const percentileMetrics = metric.percentileMetrics;
                for (let j = 0; j < percentileMetrics.length; j++) {
                    if (percentileMetrics[j].percentile.value === percentile) {
                        result[metric.id] = {
                            value: percentileMetrics[j].value,
                            stats: percentileMetrics[j].stats,
                            metadata: metric.metadata
                        };
                        break;
                    }
                }
            }
            return result;
        }

        // Mode 5: Multiple metrics, all percentiles
        if (metricIds && percentile === undefined) {
            const metricIdSet = new Set(metricIds);
            const result = {};

            for (let i = 0; i < metricsData.length; i++) {
                const metric = metricsData[i];

                if (!metricIdSet.has(metric.id)) continue;
                if (metadataFilterFn && !metadataFilterFn(metric.metadata)) continue;

                const metricData = {};
                const percentileMetrics = metric.percentileMetrics;
                const metadata = metric.metadata;

                for (let j = 0; j < percentileMetrics.length; j++) {
                    const pm = percentileMetrics[j];
                    metricData[pm.percentile.value] = {
                        value: pm.value,
                        stats: pm.stats,
                        metadata
                    };
                }

                result[metric.id] = metricData;
            }
            return result;
        }

        return {};
    }, [metricsData]);

    /**
     * Helper to get nested value using dot notation
     * @param {Object} obj - Object to extract from
     * @param {string} path - Dot notation path (e.g., 'stats.stdev')
     * @returns {any} Extracted value
     */
    const getNestedValue = (obj, path) => {
        return get(obj, path);
    };

    const prepareMetricsTable = useCallback(({ metricIds = [], percentileInfo, rowConfig = null, colConfig = null, }) => {
        const errors = [];
        const primaryPercentile = percentileInfo?.primary || 50; // Default to 50 if not set
        const selectedPercentile = percentileInfo?.selected;
        const percentiles = (percentileInfo.strategy == 'perSource') ? [...percentileInfo?.available, 0] : percentileInfo?.available


        // Validation
        if (!Array.isArray(metricIds) || metricIds.length === 0) {
            errors.push('metricIds must be a non-empty array');
            return { data: [], config: { columns: [] }, errors };
        }

        if (!Array.isArray(percentiles)) {
            errors.push('percentiles must be an array');
            return { data: [], config: { columns: [] }, errors };
        }

        if (percentiles.length === 0) {
            return {
                data: [],
                config: {
                    columns: [{
                        key: 'label',
                        title: 'Metric',
                        fixed: 'left',
                        width: 140
                    }],
                    showHeader: true,
                    size: 'small'
                },
                errors: ['No percentiles provided - showing only label column']
            };
        }

        // Get cube data for all requested metrics
        const cubeData = getMetric({ metricIds });

        // FIXED: Add missing validMetricIds filtering
        const validMetricIds = metricIds.filter(id => {
            const exists = cubeData[id] && typeof cubeData[id] === 'object' && Object.keys(cubeData[id]).length > 0;
            if (!exists) {
                errors.push(`Metric '${id}' not found in cube data`);
            }
            return exists;
        });

        if (validMetricIds.length === 0) {
            errors.push('No valid metrics found in cube data');
            return { data: [], config: { columns: [] }, errors };
        }

        const categoryColors = getCategoryColorScheme();
        const data = [];

        validMetricIds.forEach(metricId => {
            // Handle multiple rows from same metric (like dscrMetrics with different valueFields)
            const matchingRowConfigs = rowConfig?.rows?.filter(r => r.metricId === metricId) || [null];

            matchingRowConfigs.forEach((rowConfigEntry, index) => {
                // Skip if rowConfig is provided but this metric isn't in it
                if (rowConfig?.rows && !rowConfigEntry) {
                    return;
                }

                // Get metric registry entry
                const registryEntry = METRICS_REGISTRY.metrics.find(m => m.id === metricId);
                if (!registryEntry) {
                    errors.push(`Registry entry not found for metric '${metricId}'`);
                    return;
                }

                const metadata = registryEntry.metadata;
                const metricCubeData = cubeData[metricId];

                // Create unique row key for multiple rows from same metric
                const rowKey = rowConfigEntry ?
                    `${metricId}_${index}` : metricId;

                // Create base row object
                const row = {
                    key: rowKey,
                    metricId: metricId,
                    thresholds: null
                };

                // Configure row based on rowConfig or registry
                if (rowConfigEntry) {
                    // Use provided rowConfig
                    row.label = rowConfigEntry.label;
                    row.valueField = rowConfigEntry.valueField || 'value';

                    // Handle tags: undefined = auto-generate, [] = no tags, array = use provided
                    if (rowConfigEntry.tags === undefined) {
                        // Auto-generate from registry
                        if (metadata.visualGroup) {
                            const color = categoryColors[metadata.visualGroup] || 'blue';
                            row.tags = [{
                                text: metadata.visualGroup,
                                color: color
                            }];
                        } else {
                            row.tags = [];
                        }
                    } else {
                        // Use explicitly provided tags (including empty array)
                        row.tags = rowConfigEntry.tags;
                    }

                    // Handle formatter: use provided or fall back to registry
                    row.formatter = rowConfigEntry.formatter || metadata.formatter || null;

                    // KEEP provided tooltip (superior to registry)
                    row.tooltip = rowConfigEntry.tooltip || {
                        title: metadata.name || metricId,
                        content: metadata.description || null,
                        icon: 'InfoCircleOutlined'
                    };
                } else {
                    // Auto-generate everything from registry
                    row.label = metadata.name || metricId;
                    row.valueField = 'value';
                    row.formatter = metadata.formatter || null;
                    row.tooltip = {
                        title: metadata.name || metricId,
                        content: metadata.description || null,
                        icon: 'InfoCircleOutlined'
                    };

                    // Auto-generate tags from visualGroup
                    if (metadata.visualGroup) {
                        const color = categoryColors[metadata.visualGroup] || 'blue';
                        row.tags = [{
                            text: metadata.visualGroup,
                            color: color
                        }];
                    } else {
                        row.tags = [];
                    }
                }

                // Add percentile data columns
                percentiles.forEach(percentile => {
                    const percentileData = metricCubeData[percentile];

                    if (percentileData && typeof percentileData === 'object') {
                        row[`P${percentile}`] = {
                            ...percentileData, // { value, metadata, stats }
                            _extractedField: row.valueField, // Store which field to extract
                            _formatter: row.formatter // Store formatter for this cell
                        };
                    } else {
                        row[`P${percentile}`] = {
                            value: null,
                            metadata: {},
                            stats: {},
                            _extractedField: row.valueField,
                            _formatter: row.formatter
                        };
                    }
                });

                data.push(row);
            });
        });

        // Generate column configuration 
        const config = {
            showHeader: colConfig?.showHeader ?? true,
            size: colConfig?.size || 'small',
            showRowLabels: rowConfig?.showRowLabels ?? true,
            onColumnSelect: colConfig?.onColumnSelect || null,
            selectedColumn: selectedPercentile ? `P${selectedPercentile}` : colConfig?.selectedColumn || null,
            primaryPercentile: `P${colConfig?.primaryPercentile || primaryPercentile || null}`,
            columns: []
        };

        // Add percentile columns with explicit configuration
        percentiles.forEach(percentile => {
            const columnKey = `P${percentile}`;

            // Find matching colConfig entry
            const colConfigEntry = colConfig?.columns?.find(c => c.key === columnKey);

            // Skip if colConfig is restrictive and this column isn't included
            if (colConfig?.columns && !colConfigEntry) {
                return;
            }

            const columnConfig = {
                key: columnKey,
                label: colConfigEntry?.label || columnKey,
                align: 'center',
                width: colConfigEntry?.width || 80, // ENSURE width is applied
                clickable: colConfigEntry?.selectable || false,
                selectable: colConfigEntry?.selectable || false,
                primary: colConfigEntry?.primary || (percentile === primaryPercentile),
                marker: colConfigEntry?.marker || null
            };

            config.columns.push(columnConfig);
        });

        return { data, config, errors };
    }, [getMetric, percentileInfo]);


    return {
        getMetric,
        prepareMetricsTable, // Now part of the hook
        cubeStatus,
        percentileInfo,
        // Convenience flags
        isLoading: cubeStatus.isLoading,
        hasError: !!cubeStatus.error,
        isReady: !cubeStatus.isLoading && !cubeStatus.error && cubeStatus.metricsDataCount > 0
    };
};

