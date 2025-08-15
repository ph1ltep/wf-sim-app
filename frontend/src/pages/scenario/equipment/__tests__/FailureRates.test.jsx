/**
 * FailureRates Component Tests
 * Tests for the component failure rates UI functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { message } from 'antd';

import FailureRates from '../FailureRates';

// Mock the ScenarioContext
const mockGetValueByPath = jest.fn();
const mockUpdateByPath = jest.fn();

jest.mock('contexts/ScenarioContext', () => ({
    useScenario: () => ({
        getValueByPath: mockGetValueByPath,
        updateByPath: mockUpdateByPath
    })
}));

// Mock EditableTable
jest.mock('components/tables/EditableTable', () => {
    return function MockEditableTable({ path, formFields }) {
        return (
            <div data-testid="editable-table" data-path={path}>
                <div data-testid="form-fields-count">{formFields?.props?.children?.length || 0}</div>
            </div>
        );
    };
});

// Mock Antd components
jest.mock('antd', () => ({
    ...jest.requireActual('antd'),
    message: {
        success: jest.fn(),
        error: jest.fn()
    }
}));

// Mock DistributionFieldV3 to avoid Plotly issues
jest.mock('components/distributionFields/DistributionFieldV3', () => {
    return function MockDistributionFieldV3({ path, label }) {
        return <div data-testid="distribution-field-v3" data-path={path}>{label}</div>;
    };
});

// Mock ContextField
jest.mock('components/contextFields/ContextField', () => {
    return function MockContextField({ path, label }) {
        return <div data-testid="context-field" data-path={path}>{label}</div>;
    };
});

// Mock ComponentFailureModal
jest.mock('../ComponentFailureModal', () => {
    return function MockComponentFailureModal({ visible, componentName, onClose }) {
        return visible ? (
            <div data-testid="component-failure-modal">
                Modal for {componentName}
                <button onClick={onClose}>Close</button>
            </div>
        ) : null;
    };
});

// Mock FailureRateSummaryCard
jest.mock('components/cards/FailureRateSummaryCard', () => {
    return function MockFailureRateSummaryCard() {
        return <div data-testid="failure-rate-summary-card">Summary Card</div>;
    };
});


describe('FailureRates Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Default mock return values - array structure
        mockGetValueByPath.mockReturnValue({
            enabled: false,
            components: [
                { id: 'gearbox', name: 'Gearbox', enabled: false, failureRate: { parameters: { lambda: 0.025 } } },
                { id: 'generator', name: 'Generator', enabled: false, failureRate: { parameters: { lambda: 0.02 } } }
            ]
        });
        
        mockUpdateByPath.mockResolvedValue(true);
    });

    test('renders failure rates page with EditableTable', () => {
        render(<FailureRates />);
        
        expect(screen.getByText('Component Failure Rates')).toBeInTheDocument();
        expect(screen.getByText('Configure failure rates and cost modeling for major wind turbine components')).toBeInTheDocument();
        
        // Check that EditableTable is rendered with correct path
        const editableTable = screen.getByTestId('editable-table');
        expect(editableTable).toBeInTheDocument();
        expect(editableTable).toHaveAttribute('data-path', 'settings.project.equipment.failureRates.components');
    });

    test('displays global configuration card', () => {
        render(<FailureRates />);
        
        expect(screen.getByText('Global Configuration')).toBeInTheDocument();
        expect(screen.getByText('Component failure modeling:')).toBeInTheDocument();
        expect(screen.getAllByText('Disabled')[0]).toBeInTheDocument(); // Use getAllByText for multiple matches
        expect(screen.getByText('Active components:')).toBeInTheDocument();
    });

    test('shows enabled state when global toggle is on', () => {
        mockGetValueByPath.mockReturnValue({
            enabled: true,
            components: [
                { id: 'gearbox', name: 'Gearbox', enabled: true, failureRate: { parameters: { lambda: 0.025 } } }
            ]
        });

        render(<FailureRates />);
        
        expect(screen.getAllByText('Enabled')[0]).toBeInTheDocument(); // Use getAllByText for multiple matches
        expect(screen.getByText('1 of 1')).toBeInTheDocument();
    });

    test('handles global toggle change', async () => {
        render(<FailureRates />);
        
        const globalToggle = screen.getByRole('switch');
        fireEvent.click(globalToggle);

        await waitFor(() => {
            expect(mockUpdateByPath).toHaveBeenCalledWith(
                'settings.project.equipment.failureRates.enabled', 
                true
            );
        });

        expect(message.success).toHaveBeenCalledWith('Component failure modeling enabled');
    });

    test('renders EditableTable with proper configuration', () => {
        render(<FailureRates />);
        
        // Verify EditableTable is present
        const editableTable = screen.getByTestId('editable-table');
        expect(editableTable).toBeInTheDocument();
        
        // Verify it points to the correct path
        expect(editableTable).toHaveAttribute('data-path', 'settings.project.equipment.failureRates.components');
    });

    test('displays editable table and summary card', () => {
        render(<FailureRates />);
        
        expect(screen.getByTestId('editable-table')).toBeInTheDocument();
        expect(screen.getByTestId('failure-rate-summary-card')).toBeInTheDocument();
    });

    test('renders with array data structure', () => {
        mockGetValueByPath.mockReturnValue({
            enabled: false,
            components: [
                { 
                    id: 'gearbox',
                    name: 'Gearbox',
                    enabled: true, 
                    failureRate: { parameters: { lambda: 0.025 } } 
                }
            ]
        });

        render(<FailureRates />);
        
        // Verify EditableTable is present with array data
        expect(screen.getByTestId('editable-table')).toBeInTheDocument();
    });

    test('handles error states gracefully', async () => {
        mockUpdateByPath.mockRejectedValue(new Error('Update failed'));
        
        render(<FailureRates />);
        
        const globalToggle = screen.getByRole('switch');
        fireEvent.click(globalToggle);

        await waitFor(() => {
            expect(message.error).toHaveBeenCalledWith('Failed to update global setting: Update failed');
        });
    });

    test('displays correct component counts', () => {
        mockGetValueByPath.mockReturnValue({
            enabled: true,
            components: [
                { id: 'gearbox', name: 'Gearbox', enabled: true, failureRate: { parameters: { lambda: 0.025 } } },
                { id: 'generator', name: 'Generator', enabled: true, failureRate: { parameters: { lambda: 0.02 } } },
                { id: 'mainBearing', name: 'Main Bearing', enabled: false, failureRate: { parameters: { lambda: 0.018 } } }
            ]
        });

        render(<FailureRates />);
        
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });
});