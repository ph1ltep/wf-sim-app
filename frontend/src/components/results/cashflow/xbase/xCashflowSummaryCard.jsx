// src/components/results/cashflow/base/CashflowSummaryCard.js - Base class for summary cards
import React from 'react';
import { Card, Empty, Alert, Spin, Statistic, Row, Col } from 'antd';

/**
 * Base class for cashflow summary cards (financeability, KPIs)
 * Provides common functionality for high-level financial summaries
 */
export class CashflowSummaryCard {
    constructor(cashflowData, selectedPercentiles) {
        this.cashflowData = cashflowData;
        this.selectedPercentiles = selectedPercentiles;
    }

    // ===== STATIC METADATA METHODS (Must be implemented by subclasses) =====

    /**
     * Get required aggregations for this card type
     * @returns {Array<string>} Array of aggregation names ('totalCosts', 'totalRevenue', 'netCashflow')
     */
    static getRequiredAggregations() {
        return ['netCashflow'];
    }

    /**
     * Get required finance metrics for this card type
     * @returns {Array<string>} Array of metric names ('dscr', 'irr', 'npv', 'llcr')
     */
    static getRequiredFinanceMetrics() {
        return [];
    }

    /**
     * Get card type identifier
     * @returns {string} Card type ('summary' for this base class)
     */
    static getCardType() {
        return 'summary';
    }

    /**
     * Get display name for this card
     * @returns {string} Human-readable card name
     */
    static getDisplayName() {
        throw new Error('getDisplayName() must be implemented by subclass');
    }

    /**
     * Get description of what this card shows
     * @returns {string} Card description
     */
    static getDescription() {
        throw new Error('getDescription() must be implemented by subclass');
    }

    /**
     * Get default grid properties for responsive layout
     * @returns {Object} Ant Design Col props
     */
    static getDefaultGridProps() {
        return { xs: 24, sm: 24, md: 12, lg: 8, xl: 8, xxl: 8 };
    }

    // ===== INSTANCE METHODS =====

    /**
     * Get aggregation metadata and summary statistics
     * @returns {Object} Aggregation analysis
     */
    getAggregationMetadata() {
        if (!this.cashflowData || !this.cashflowData.aggregations) {
            return { totalItems: 0, aggregations: [], hasAggregations: false };
        }

        const { aggregations } = this.cashflowData;
        const aggregationSummary = [];

        Object.entries(aggregations).forEach(([key, aggregation]) => {
            const summary = {
                name: key,
                hasPercentileData: aggregation.percentileData && aggregation.percentileData.size > 0,
                hasFixedData: aggregation.fixedData && aggregation.fixedData.length > 0,
                percentileCount: aggregation.percentileData ? aggregation.percentileData.size : 0,
                fixedDataPoints: aggregation.fixedData ? aggregation.fixedData.length : 0
            };

            // Calculate basic statistics for primary percentile
            if (summary.hasPercentileData) {
                const primaryPercentile = this.getCurrentPercentile();
                const data = aggregation.percentileData.get(primaryPercentile);

                if (data && data.length > 0) {
                    const values = data.map(d => d.value);
                    summary.statistics = {
                        total: values.reduce((sum, val) => sum + val, 0),
                        average: values.reduce((sum, val) => sum + val, 0) / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        dataPoints: values.length
                    };
                }
            }

            aggregationSummary.push(summary);
        });

        return {
            totalItems: aggregationSummary.length,
            aggregations: aggregationSummary,
            hasAggregations: aggregationSummary.length > 0
        };
    }

    /**
     * Get finance metrics summary
     * @returns {Object} Finance metrics analysis
     */
    getFinanceMetricsSummary() {
        if (!this.cashflowData || !this.cashflowData.financeMetrics) {
            return { totalMetrics: 0, metrics: [], hasMetrics: false };
        }

        const { financeMetrics } = this.cashflowData;
        const metricsSummary = [];

        Object.entries(financeMetrics).forEach(([key, metricData]) => {
            const summary = {
                name: key,
                hasData: false,
                dataType: 'unknown'
            };

            if (metricData instanceof Map && metricData.size > 0) {
                summary.hasData = true;
                summary.percentileCount = metricData.size;

                // Determine data type based on first entry
                const firstEntry = metricData.values().next().value;
                if (Array.isArray(firstEntry)) {
                    summary.dataType = 'timeSeries';
                    summary.dataPoints = firstEntry.length;
                } else if (typeof firstEntry === 'number') {
                    summary.dataType = 'scalar';
                } else {
                    summary.dataType = 'complex';
                }

                // Get value for current percentile
                const currentPercentile = this.getCurrentPercentile();
                summary.currentValue = metricData.get(currentPercentile);
            }

            metricsSummary.push(summary);
        });

        return {
            totalMetrics: metricsSummary.length,
            metrics: metricsSummary,
            hasMetrics: metricsSummary.some(m => m.hasData)
        };
    }

    /**
     * Get current percentile based on strategy
     * @returns {number} Current percentile value
     */
    getCurrentPercentile() {
        if (!this.selectedPercentiles) return 50;

        if (this.selectedPercentiles.strategy === 'unified') {
            return this.selectedPercentiles.unified;
        }

        // For summary cards, use unified percentile as default
        return this.selectedPercentiles.unified || 50;
    }

    /**
     * Get percentile range data for confidence intervals
     * @param {string} metricName - Finance metric name
     * @param {Array<number>} percentiles - Percentiles to include (e.g., [10, 50, 90])
     * @returns {Object} Percentile range data
     */
    getPercentileRange(metricName, percentiles = [10, 50, 90]) {
        if (!this.cashflowData?.financeMetrics?.[metricName]) {
            return null;
        }

        const metricData = this.cashflowData.financeMetrics[metricName];
        const rangeData = {};

        percentiles.forEach(percentile => {
            if (metricData.has(percentile)) {
                rangeData[`P${percentile}`] = metricData.get(percentile);
            }
        });

        return Object.keys(rangeData).length > 0 ? rangeData : null;
    }

    /**
     * Validate that required data is available
     * @returns {Object} Validation result {isValid, errors, warnings}
     */
    validateData() {
        const errors = [];
        const warnings = [];

        // Check if cashflow data exists
        if (!this.cashflowData) {
            errors.push('No cashflow data available');
            return { isValid: false, errors, warnings };
        }

        // Check required aggregations
        const requiredAggregations = this.constructor.getRequiredAggregations();
        const availableAggregations = Object.keys(this.cashflowData.aggregations || {});
        const missingAggregations = requiredAggregations.filter(agg => !availableAggregations.includes(agg));

        if (missingAggregations.length > 0) {
            errors.push(`Missing required aggregations: ${missingAggregations.join(', ')}`);
        }

        // Check required finance metrics
        const requiredMetrics = this.constructor.getRequiredFinanceMetrics();
        const availableMetrics = Object.keys(this.cashflowData.financeMetrics || {});
        const missingMetrics = requiredMetrics.filter(metric => !availableMetrics.includes(metric));

        if (missingMetrics.length > 0) {
            errors.push(`Missing required finance metrics: ${missingMetrics.join(', ')}`);
        }

        // Check percentile selection
        if (!this.selectedPercentiles) {
            warnings.push('No percentile selection provided');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Create a standard KPI statistic component
     * @param {Object} config - KPI configuration
     * @returns {React.Element} Statistic component
     */
    createKPIStatistic(config) {
        const {
            title,
            value,
            precision = 2,
            prefix,
            suffix,
            valueStyle = {},
            loading = false
        } = config;

        return (
            <Statistic
                title={title}
                value={value}
                precision={precision}
                prefix={prefix}
                suffix={suffix}
                valueStyle={valueStyle}
                loading={loading}
            />
        );
    }

    /**
     * Create a KPI grid layout
     * @param {Array} kpis - Array of KPI configurations
     * @param {Object} gridProps - Grid layout properties
     * @returns {React.Element} KPI grid component
     */
    createKPIGrid(kpis, gridProps = {}) {
        const defaultGridProps = { gutter: [16, 16], ...gridProps };
        const defaultColProps = { xs: 24, sm: 12, md: 8, lg: 6 };

        return (
            <Row {...defaultGridProps}>
                {kpis.map((kpi, index) => (
                    <Col key={index} {...(kpi.colProps || defaultColProps)}>
                        {this.createKPIStatistic(kpi)}
                    </Col>
                ))}
            </Row>
        );
    }

    /**
     * Render method - must be implemented by subclasses
     * @param {Object} props - Additional props from parent component
     * @returns {React.Element} Rendered card component
     */
    render(props = {}) {
        throw new Error('render() must be implemented by subclass');
    }

    /**
     * Create a standard error card for data validation failures
     * @param {Object} validation - Validation result
     * @param {Object} cardProps - Additional card properties
     * @returns {React.Element} Error card component
     */
    renderErrorCard(validation, cardProps = {}) {
        const { errors, warnings } = validation;

        return (
            <Card
                title={this.constructor.getDisplayName()}
                variant="outlined"
                {...cardProps}
            >
                {errors.length > 0 && (
                    <Alert
                        message="Data Validation Errors"
                        description={
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {errors.map((error, i) => <li key={i}>{error}</li>)}
                            </ul>
                        }
                        type="error"
                        showIcon
                        style={{ marginBottom: warnings.length > 0 ? 16 : 0 }}
                    />
                )}

                {warnings.length > 0 && (
                    <Alert
                        message="Data Warnings"
                        description={
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                            </ul>
                        }
                        type="warning"
                        showIcon
                    />
                )}
            </Card>
        );
    }

    /**
     * Create a standard loading card
     * @param {Object} cardProps - Additional card properties
     * @returns {React.Element} Loading card component
     */
    renderLoadingCard(cardProps = {}) {
        return (
            <Card
                title={this.constructor.getDisplayName()}
                variant="outlined"
                {...cardProps}
            >
                <Spin tip="Loading financial metrics..." style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '200px'
                }} />
            </Card>
        );
    }

    /**
     * Create a standard empty data card
     * @param {Object} cardProps - Additional card properties
     * @returns {React.Element} Empty card component
     */
    renderEmptyCard(cardProps = {}) {
        return (
            <Card
                title={this.constructor.getDisplayName()}
                variant="outlined"
                {...cardProps}
            >
                <Empty
                    description="No financial data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }
}