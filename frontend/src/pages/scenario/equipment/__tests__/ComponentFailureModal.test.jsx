/**
 * ComponentFailureModal Tests
 * Tests for the DistributionFieldV3 integration and modal functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { message } from 'antd';

import ComponentFailureModal from '../ComponentFailureModal';

// Mock the ScenarioContext
const mockUpdateByPath = jest.fn();

jest.mock('contexts/ScenarioContext', () => ({
    useScenario: () => ({
        updateByPath: mockUpdateByPath
    })
}));

// Mock DistributionFieldV3 to capture path and test interactions
const mockDistributionFieldProps = [];
jest.mock('components/distributionFields', () => ({
    DistributionFieldV3: function MockDistributionFieldV3(props) {
        mockDistributionFieldProps.push(props);
        return (
            <div data-testid="distribution-field-v3" data-path={JSON.stringify(props.path)}>
                <label>{props.label}</label>
                <div data-testid="distribution-type">{props.valueType}</div>
                {props.options && (
                    <select data-testid="distribution-options">
                        {props.options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )}
                <button 
                    data-testid="mock-change-distribution"
                    onClick={() => {
                        // Simulate changing distribution type
                        if (props.onChange) {
                            props.onChange({
                                type: 'normal',
                                parameters: { mean: 0.03, stdDev: 0.005, value: 0.03 }
                            });
                        }
                    }}
                >
                    Change to Normal
                </button>
            </div>
        );
    }
}));

// Mock Antd message
jest.mock('antd', () => ({
    ...jest.requireActual('antd'),
    message: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

describe('ComponentFailureModal', () => {
    const defaultProps = {
        visible: true,
        component: {
            id: 'gearbox',
            name: 'Gearbox',
            category: 'drivetrain',
            enabled: false
        },
        componentIndex: 0,
        onClose: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockDistributionFieldProps.length = 0;
        mockUpdateByPath.mockResolvedValue(true);
    });

    test('renders modal with component information', () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        expect(screen.getByText('Configure Gearbox Failure Rate')).toBeInTheDocument();
        expect(screen.getByText('Failure Rate')).toBeInTheDocument();
        expect(screen.getByText('Cost Components')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    test('renders DistributionFieldV3 with correct path for failure rate', () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        const distributionFields = screen.getAllByTestId('distribution-field-v3');
        expect(distributionFields.length).toBeGreaterThan(0);
        
        // Check if failure rate DistributionFieldV3 has correct path
        const failureRateField = distributionFields.find(field => 
            field.getAttribute('data-path')?.includes('failureRate')
        );
        expect(failureRateField).toBeInTheDocument();
        
        const path = JSON.parse(failureRateField.getAttribute('data-path'));
        expect(path).toEqual([
            'settings', 'project', 'equipment', 'failureRates', 'components', 0, 'failureRate'
        ]);
    });

    test('renders cost components with correct paths', () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        // Switch to Cost Components tab
        const costTab = screen.getByText('Cost Components');
        fireEvent.click(costTab);
        
        // Wait for tab content to load
        waitFor(() => {
            const distributionFields = screen.getAllByTestId('distribution-field-v3');
            expect(distributionFields.length).toBeGreaterThan(4); // Should have multiple cost fields
            
            // Check for specific cost component paths
            const componentReplacementField = distributionFields.find(field => 
                field.getAttribute('data-path')?.includes('componentReplacement')
            );
            expect(componentReplacementField).toBeInTheDocument();
            
            const craneMobilizationField = distributionFields.find(field => 
                field.getAttribute('data-path')?.includes('craneMobilization')
            );
            expect(craneMobilizationField).toBeInTheDocument();
        });
    });

    test('captures DistributionFieldV3 props correctly for failure rate', () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        // Find the failure rate distribution field props
        const failureRateProps = mockDistributionFieldProps.find(props => 
            props.path && props.path[props.path.length - 1] === 'failureRate'
        );
        
        expect(failureRateProps).toBeDefined();
        expect(failureRateProps.label).toBe('Annual Failure Rate');
        expect(failureRateProps.tooltip).toContain('Annual probability');
        expect(failureRateProps.valueType).toBe('percentage');
        expect(failureRateProps.options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ value: 'fixed', label: 'Fixed Rate' }),
                expect.objectContaining({ value: 'exponential', label: 'Constant Rate (Exponential)' }),
                expect.objectContaining({ value: 'weibull', label: 'Aging Effects (Weibull)' })
            ])
        );
    });

    test('handles Initialize Defaults button click', async () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        const initButton = screen.getByText('Initialize Defaults');
        fireEvent.click(initButton);

        await waitFor(() => {
            expect(mockUpdateByPath).toHaveBeenCalledWith(
                'settings.project.equipment.failureRates.components.0.failureRate',
                expect.objectContaining({
                    type: 'exponential',
                    parameters: expect.objectContaining({
                        lambda: 0.025,
                        value: 0.025
                    })
                })
            );
        });

        expect(message.success).toHaveBeenCalledWith('Component initialized with default values');
    });

    test('handles modal close', () => {
        const onClose = jest.fn();
        render(<ComponentFailureModal {...defaultProps} onClose={onClose} />);
        
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    test('displays component information in Advanced tab', () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        const advancedTab = screen.getByText('Advanced');
        fireEvent.click(advancedTab);

        expect(screen.getByText('Component Information')).toBeInTheDocument();
        expect(screen.getByText('Component:')).toBeInTheDocument();
        expect(screen.getByText('ID:')).toBeInTheDocument();
        expect(screen.getByText('Schema Path:')).toBeInTheDocument();
        expect(screen.getByText('gearbox')).toBeInTheDocument();
    });

    test('handles different component indices correctly', () => {
        const propsWithDifferentIndex = {
            ...defaultProps,
            componentIndex: 2,
            component: {
                id: 'generator',
                name: 'Generator',
                category: 'electrical'
            }
        };

        render(<ComponentFailureModal {...propsWithDifferentIndex} />);
        
        const distributionFields = screen.getAllByTestId('distribution-field-v3');
        const failureRateField = distributionFields.find(field => 
            field.getAttribute('data-path')?.includes('failureRate')
        );
        
        const path = JSON.parse(failureRateField.getAttribute('data-path'));
        expect(path[5]).toBe(2); // Component index should be 2
    });

    test('validates DistributionFieldV3 options for different distribution types', () => {
        render(<ComponentFailureModal {...defaultProps} />);
        
        const failureRateProps = mockDistributionFieldProps.find(props => 
            props.path && props.path[props.path.length - 1] === 'failureRate'
        );
        
        expect(failureRateProps.options).toHaveLength(5);
        expect(failureRateProps.options.map(opt => opt.value)).toEqual([
            'fixed', 'exponential', 'weibull', 'lognormal', 'normal'
        ]);
    });

    test('handles error in Initialize Defaults', async () => {
        const errorMessage = 'Network error';
        mockUpdateByPath.mockRejectedValue(new Error(errorMessage));

        render(<ComponentFailureModal {...defaultProps} />);
        
        const initButton = screen.getByText('Initialize Defaults');
        fireEvent.click(initButton);

        await waitFor(() => {
            expect(message.error).toHaveBeenCalledWith(
                `Failed to initialize component: ${errorMessage}`
            );
        });
    });
});