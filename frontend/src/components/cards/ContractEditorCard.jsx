// src/components/cards/ContractFeeScheduleCard.jsx - Contract fee schedule editing card
import React, { useCallback } from 'react';
import { Card, Alert, message } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { InlineEditTable } from '../tables';

/**
 * Calculate average of time series values
 * @param {Array} timeSeries - Array of DataPointSchema objects
 * @returns {number} Average value
 */
const calculateTimeSeriesAverage = (timeSeries) => {
    if (!timeSeries || timeSeries.length === 0) return 0;

    const values = timeSeries
        .map(dp => parseFloat(dp.value))
        .filter(val => !isNaN(val));

    if (values.length === 0) return 0;

    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / values.length);
};

/**
 * ContractFeeScheduleCard - Card component for editing contract fee schedules
 * 
 * @param {Array} path - Path to the contracts array in context
 * @param {number} projectLife - Project duration in years
 * @param {string} currency - Currency code for display
 * @param {string} title - Card title
 * @param {React.ReactNode} icon - Card title icon
 * @param {Array} affectedMetrics - Metrics to recalculate on save
 * @param {Function} onSave - Custom save handler
 * @param {Function} onError - Custom error handler
 * @param {Object} cardProps - Additional props for Card component
 * @param {Object} tableProps - Additional props for InlineEditTable
 */
const ContractFeeScheduleCard = ({
    path,
    projectLife = 20,
    currency = 'USD',
    title = 'Annual Fee Schedule',
    icon = <DollarOutlined />,
    affectedMetrics = ['contractCosts'],
    onSave,
    onError,
    cardProps = {},
    tableProps = {},
}) => {
    // Handle contract before save - calculate fixedFee averages
    const handleContractBeforeSave = useCallback((updatedContracts) => {
        console.log('Processing contracts before save:', updatedContracts.length);

        // Calculate fixedFee averages from time series data
        const contractsWithAverages = updatedContracts.map(contract => {
            const fixedFeeTimeSeries = contract.fixedFeeTimeSeries || [];
            const averageFee = calculateTimeSeriesAverage(fixedFeeTimeSeries);

            console.log(`Contract ${contract.name}: ${fixedFeeTimeSeries.length} time series points, average: ${averageFee}`);

            return {
                ...contract,
                fixedFee: averageFee // Update the scalar fixedFee with calculated average
            };
        });

        // Call custom save handler if provided
        if (onSave) {
            return onSave(contractsWithAverages);
        }

        return contractsWithAverages;
    }, [onSave]);

    // Handle contract after save - show success/error messages
    const handleContractAfterSave = useCallback((result) => {
        if (result.isValid) {
            message.success('Contract fee schedule updated successfully');
        } else {
            message.error('Failed to save contract fee schedule');
            console.error('Save errors:', result.errors);

            // Call custom error handler if provided
            if (onError) {
                onError(result);
            }
        }
    }, [onError]);

    /**
     * Calculate summary (sum across time dimension)
     * Horizontal: sum all years for a contract row
     * Vertical: sum all contracts for a year row
     */
    const calculateSummary = useCallback((data, orientation, styleOptions) => {
        if (!data || typeof data !== 'object') return 0;

        return Object.values(data).reduce((sum, value) => {
            const numValue = parseFloat(value) || 0;
            return sum + numValue;
        }, 0);
    }, []);

    /**
     * Calculate totals (sum across data dimension)
     * Horizontal: sum all contracts for a year column
     * Vertical: sum all years for a contract column
     */
    const calculateTotals = useCallback((data, orientation, styleOptions) => {
        if (!data || typeof data !== 'object') return 0;

        return Object.values(data).reduce((sum, value) => {
            const numValue = parseFloat(value) || 0;
            return sum + numValue;
        }, 0);
    }, []);

    return (
        <Card
            title={
                <span>
                    {icon}
                    <span style={{ marginLeft: 8 }}>{title}</span>
                </span>
            }
            {...cardProps}
        >
            <Alert
                message="Year-by-Year Fee Configuration"
                description={
                    <div>
                        <p>Configure different fees for each year of each contract's duration. This allows for:</p>
                        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                            <li>Escalating fees over time</li>
                            <li>Discounted rates in early years</li>
                            <li>Different pricing strategies per contract</li>
                        </ul>
                        <p style={{ marginTop: '8px', marginBottom: 0 }}>
                            <strong>Note:</strong> The average of all years will be used as the contract's summary fixed fee.
                        </p>
                    </div>
                }
                type="info"
                style={{ marginBottom: 16 }}
                showIcon
            />

            <InlineEditTable
                path={path}
                dataFieldOptions={[
                    {
                        value: 'fixedFeeTimeSeries',
                        label: 'Annual Fees',
                        type: 'currency',
                        validation: {
                            min: 0,
                            // max: 50000000, 
                            precision: 0
                        },
                        defaultValueField: 'fixedFee',
                        defaultTimeSeriesField: 'years'
                    }
                ]}
                yearRange={{ min: 1, max: projectLife }}
                trimBlanks={true}
                onBeforeSave={handleContractBeforeSave}
                onAfterSave={handleContractAfterSave}
                affectedMetrics={affectedMetrics}
                showMetadata={true}
                orientation="horizontal"
                calcSummary={calculateSummary}  // Sum all years for each contract
                calcTotals={calculateTotals}
                styleOptions={{
                    header: true,
                    subHeader: true,
                    summary: true,
                    totals: true,
                    summaryLabel: 'Totals',
                    totalsLabel: 'Annual Totals',
                    cellFormatter: (value) => `$${value.toLocaleString()}`,
                    summaryFormatter: (value) => `$${value.toLocaleString()}`,
                    totalsFormatter: (value) => `$${value.toLocaleString()}`
                }}
                {...tableProps}
            />
        </Card>
    );
};

export default ContractFeeScheduleCard;