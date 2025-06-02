// src/components/results/cashflow/base/CashflowDetailCard.js - Base class for detail cards
import React from 'react';
import { Card, Empty, Alert, Spin } from 'antd';

/**
 * Base class for cashflow detail cards (timeline, driver analysis, table)
 * Provides common functionality and interface contracts for detail-level analysis
 */
export class CashflowDetailCard {
    constructor(cashflowData, selectedPercentiles, focusedLineItems = []) {
        this.cashflowData = cashflowData;
        this.selectedPercentiles = selectedPercentiles;
        this.focusedLineItems = focusedLineItems;
    }

    // ===== STATIC METADATA METHODS (Must be implemented by subclasses) =====

    /**
     * Get required line items for this card type
     * @returns {Array<string>} Array of line item IDs or ['all'] for all items
     */
    static getRequiredLineItems() {
        throw new Error('getRequiredLineItems() must be implemented by subclass');
    }

    /**
     * Get required multipliers for this card type
     * @returns {Array<string>} Array of multiplier IDs or [] for none
     */
    static getRequiredMultipliers() {
        return [];
    }

    /**
     * Get card type identifier
     * @returns {string} Card type ('detail' for this base class)
     */
    static getCardType() {
        return 'detail';
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
        return { xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 };
    }

    // ===== INSTANCE METHODS =====

    /**
     * Get filtered data based on focused line items
     * @returns {Array} Filtered line items
     */
    getFilteredData() {
        if (!this.cashflowData || !this.cashflowData.lineItems) {
            return [];
        }

        // If no focused items or 'all' specified, return all items
        if (this.focusedLineItems.length === 0 || this.focusedLineItems.includes('all')) {
            return this.cashflowData.lineItems;
        }

        // Filter to only focused line items
        return this.cashflowData.lineItems.filter(item =>
            this.focusedLineItems.includes(item.id)
        );
    }

    /**
     * Get multiplier metadata for transparency
     * @returns {Object} Multiplier usage summary
     */
    getMultiplierMetadata() {
        const filteredData = this.getFilteredData();
        const multiplierUsage = new Map();

        filteredData.forEach(item => {
            item.appliedMultipliers?.forEach(multiplier => {
                if (!multiplierUsage.has(multiplier.id)) {
                    multiplierUsage.set(multiplier.id, {
                        id: multiplier.id,
                        operation: multiplier.operation,
                        usedByItems: [],
                        totalApplications: 0
                    });
                }

                const usage = multiplierUsage.get(multiplier.id);
                usage.usedByItems.push(item.id);
                usage.totalApplications += 1;
            });
        });

        return {
            totalMultipliers: multiplierUsage.size,
            multipliers: Array.from(multiplierUsage.values()),
            hasMultiplierEffects: multiplierUsage.size > 0
        };
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

        // Check required line items
        const requiredLineItems = this.constructor.getRequiredLineItems();
        if (requiredLineItems.includes('all')) {
            if (!this.cashflowData.lineItems || this.cashflowData.lineItems.length === 0) {
                errors.push('No line items available');
            }
        } else {
            const availableLineItemIds = this.cashflowData.lineItems?.map(item => item.id) || [];
            const missingLineItems = requiredLineItems.filter(id => !availableLineItemIds.includes(id));

            if (missingLineItems.length > 0) {
                errors.push(`Missing required line items: ${missingLineItems.join(', ')}`);
            }
        }

        // Check required multipliers
        const requiredMultipliers = this.constructor.getRequiredMultipliers();
        if (requiredMultipliers.length > 0) {
            const multiplierMetadata = this.getMultiplierMetadata();
            const availableMultiplierIds = multiplierMetadata.multipliers.map(m => m.id);
            const missingMultipliers = requiredMultipliers.filter(id => !availableMultiplierIds.includes(id));

            if (missingMultipliers.length > 0) {
                warnings.push(`Missing expected multipliers: ${missingMultipliers.join(', ')}`);
            }
        }

        // Check percentile data availability
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
     * Get current percentile for a specific source
     * @param {string} sourceId - Source identifier
     * @returns {number} Selected percentile value
     */
    getPercentileForSource(sourceId) {
        if (!this.selectedPercentiles) return 50;

        if (this.selectedPercentiles.strategy === 'unified') {
            return this.selectedPercentiles.unified;
        } else if (this.selectedPercentiles.strategy === 'perSource') {
            return this.selectedPercentiles.perSource[sourceId] || 50;
        }

        return 50;
    }

    /**
     * Get data for a specific percentile and line item
     * @param {string} lineItemId - Line item identifier
     * @param {number} percentile - Percentile value
     * @returns {Array} Data points for the specified percentile
     */
    getPercentileDataForLineItem(lineItemId, percentile) {
        const lineItem = this.cashflowData?.lineItems?.find(item => item.id === lineItemId);
        if (!lineItem) return [];

        if (lineItem.hasPercentileVariation && lineItem.percentileData.has(percentile)) {
            return lineItem.percentileData.get(percentile);
        } else if (!lineItem.hasPercentileVariation) {
            return lineItem.fixedData;
        }

        return [];
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
                <Spin tip="Loading cashflow data..." style={{
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
                    description="No cashflow data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }
}