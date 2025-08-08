import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessingProgress } from '../processing-progress';

// Mock toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockSteps = [
    {
        id: 'step-1',
        name: 'Load audio file',
        status: 'completed' as const,
        progress: 100,
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T10:00:30Z'),
    },
    {
        id: 'step-2',
        name: 'Analyze audio features',
        status: 'running' as const,
        progress: 65,
        startTime: new Date('2024-01-01T10:00:30Z'),
    },
    {
        id: 'step-3',
        name: 'Generate output',
        status: 'pending' as const,
    },
    {
        id: 'step-4',
        name: 'Save results',
        status: 'error' as const,
        error: 'Failed to save file',
        startTime: new Date('2024-01-01T10:01:00Z'),
        endTime: new Date('2024-01-01T10:01:15Z'),
    },
];

describe('ProcessingProgress', () => {
    const mockOnCancel = jest.fn();
    const mockOnRetry = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders processing progress with basic information', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Processing Progress')).toBeInTheDocument();
        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('45% (1/4 steps)')).toBeInTheDocument();
    });

    it('displays overall progress correctly', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={75}
                status="running"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Overall Progress')).toBeInTheDocument();
        expect(screen.getByText('75% (1/4 steps)')).toBeInTheDocument();
    });

    it('shows different status badges correctly', () => {
        const { rerender } = render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={0}
                status="pending"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();

        rerender(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={50}
                status="running"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText('Running')).toBeInTheDocument();

        rerender(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={100}
                status="completed"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText('Completed')).toBeInTheDocument();

        rerender(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={25}
                status="error"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('displays processing steps when showSteps is true', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                showSteps={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Processing Steps')).toBeInTheDocument();
        expect(screen.getByText('1. Load audio file')).toBeInTheDocument();
        expect(screen.getByText('2. Analyze audio features')).toBeInTheDocument();
        expect(screen.getByText('3. Generate output')).toBeInTheDocument();
        expect(screen.getByText('4. Save results')).toBeInTheDocument();
    });

    it('hides processing steps when showSteps is false', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                showSteps={false}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.queryByText('Processing Steps')).not.toBeInTheDocument();
    });

    it('shows step status icons correctly', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                showSteps={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        // Check for status badges
        expect(screen.getByText('completed')).toBeInTheDocument();
        expect(screen.getByText('running')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('error')).toBeInTheDocument();
    });

    it('displays step progress for running steps', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                showSteps={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('displays error messages for failed steps', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                showSteps={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Error: Failed to save file')).toBeInTheDocument();
    });

    it('displays step duration when available', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                showSteps={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Duration: 30s')).toBeInTheDocument();
        expect(screen.getByText('Duration: 15s')).toBeInTheDocument();
    });

    it('shows estimated time remaining when provided', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                estimatedTimeRemaining={120}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText(/Remaining: ~2m 0s/)).toBeInTheDocument();
    });

    it('shows cancel button when status is running and canCancel is true', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                canCancel={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('hides cancel button when status is not running', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={100}
                status="completed"
                canCancel={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('shows retry button when status is error and canRetry is true', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={25}
                status="error"
                canRetry={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={45}
                status="running"
                canCancel={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onRetry when retry button is clicked', () => {
        render(
            <ProcessingProgress
                steps={mockSteps}
                overallProgress={25}
                status="error"
                canRetry={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);

        expect(mockOnRetry).toHaveBeenCalled();
    });

    it('shows appropriate status messages', () => {
        const { rerender } = render(
            <ProcessingProgress
                steps={[]}
                overallProgress={0}
                status="pending"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText('Waiting for processing to start...')).toBeInTheDocument();

        rerender(
            <ProcessingProgress
                steps={[]}
                overallProgress={50}
                status="running"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText('Processing in progress...')).toBeInTheDocument();

        rerender(
            <ProcessingProgress
                steps={[]}
                overallProgress={100}
                status="completed"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText(/Processing completed successfully/)).toBeInTheDocument();

        rerender(
            <ProcessingProgress
                steps={[]}
                overallProgress={25}
                status="error"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );
        expect(screen.getByText(/Processing failed/)).toBeInTheDocument();
    });

    it('formats time correctly', () => {
        const stepsWithLongDuration = [
            {
                id: 'step-1',
                name: 'Long running task',
                status: 'completed' as const,
                startTime: new Date('2024-01-01T10:00:00Z'),
                endTime: new Date('2024-01-01T11:30:45Z'), // 1h 30m 45s
            },
        ];

        render(
            <ProcessingProgress
                steps={stepsWithLongDuration}
                overallProgress={100}
                status="completed"
                showSteps={true}
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('Duration: 1h 30m')).toBeInTheDocument();
    });

    it('handles empty steps array', () => {
        render(
            <ProcessingProgress
                steps={[]}
                overallProgress={0}
                status="pending"
                onCancel={mockOnCancel}
                onRetry={mockOnRetry}
            />
        );

        expect(screen.getByText('0% (0/0 steps)')).toBeInTheDocument();
        expect(screen.queryByText('Processing Steps')).not.toBeInTheDocument();
    });
});