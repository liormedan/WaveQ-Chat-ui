import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExecutionLogs } from '../execution-logs';

// Mock toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const mockLogs = [
    'Starting audio processing...',
    '[INFO] Loading audio file: test.wav',
    '[WARNING] Audio quality is low',
    '[ERROR] Failed to process segment 3',
    '[SUCCESS] Processing completed successfully'
];

describe('ExecutionLogs', () => {
    const mockOnCancel = jest.fn();
    const mockOnClear = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders execution logs with basic information', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText('Execution Logs')).toBeInTheDocument();
        expect(screen.getByText('Running')).toBeInTheDocument();
        expect(screen.getByText('5 log entries')).toBeInTheDocument();
    });

    it('displays logs with correct formatting', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText('Starting audio processing...')).toBeInTheDocument();
        expect(screen.getByText('Loading audio file: test.wav')).toBeInTheDocument();
        expect(screen.getByText('Audio quality is low')).toBeInTheDocument();
        expect(screen.getByText('Failed to process segment 3')).toBeInTheDocument();
        expect(screen.getByText('Processing completed successfully')).toBeInTheDocument();
    });

    it('shows different status badges correctly', () => {
        const { rerender } = render(
            <ExecutionLogs
                logs={mockLogs}
                status="pending"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );
        expect(screen.getByText('Pending')).toBeInTheDocument();

        rerender(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );
        expect(screen.getByText('Running')).toBeInTheDocument();

        rerender(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );
        expect(screen.getByText('Completed')).toBeInTheDocument();

        rerender(
            <ExecutionLogs
                logs={mockLogs}
                status="error"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );
        expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('shows progress bar when progress is provided', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                progress={75}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText('Progress')).toBeInTheDocument();
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('displays execution time information', () => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        const endTime = new Date('2024-01-01T10:05:30Z');

        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                startTime={startTime}
                endTime={endTime}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText(/Started:/)).toBeInTheDocument();
        expect(screen.getByText(/Ended:/)).toBeInTheDocument();
        expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });

    it('shows cancel button when status is running and canCancel is true', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                canCancel={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByTitle('Cancel execution')).toBeInTheDocument();
    });

    it('hides cancel button when status is not running', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                canCancel={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.queryByTitle('Cancel execution')).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                canCancel={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        const cancelButton = screen.getByTitle('Cancel execution');
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows clear button when canClear is true and logs exist', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                canClear={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByTitle('Clear logs')).toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                canClear={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        const clearButton = screen.getByTitle('Clear logs');
        fireEvent.click(clearButton);

        expect(mockOnClear).toHaveBeenCalled();
    });

    it('handles download logs functionality', () => {
        // Mock URL.createObjectURL and document methods
        global.URL.createObjectURL = jest.fn(() => 'mock-url');
        global.URL.revokeObjectURL = jest.fn();

        const mockLink = {
            href: '',
            download: '',
            click: jest.fn(),
        };
        jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
        jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        const downloadButton = screen.getByTitle('Download logs');
        fireEvent.click(downloadButton);

        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(mockLink.click).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('supports collapsible functionality', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                isCollapsible={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByTitle('Collapse')).toBeInTheDocument();
        expect(screen.getByText('Starting audio processing...')).toBeInTheDocument();

        // Click collapse button
        const collapseButton = screen.getByTitle('Collapse');
        fireEvent.click(collapseButton);

        expect(screen.getByTitle('Expand')).toBeInTheDocument();
        expect(screen.queryByText('Starting audio processing...')).not.toBeInTheDocument();
    });

    it('starts collapsed when defaultCollapsed is true', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="completed"
                isCollapsible={true}
                defaultCollapsed={true}
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByTitle('Expand')).toBeInTheDocument();
        expect(screen.queryByText('Starting audio processing...')).not.toBeInTheDocument();
    });

    it('shows empty state when no logs are available', () => {
        render(
            <ExecutionLogs
                logs={[]}
                status="pending"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText('Waiting for execution to start...')).toBeInTheDocument();
    });

    it('toggles auto-scroll functionality', () => {
        render(
            <ExecutionLogs
                logs={mockLogs}
                status="running"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText('Auto-scroll: ON')).toBeInTheDocument();

        const autoScrollButton = screen.getByText('Auto-scroll: ON');
        fireEvent.click(autoScrollButton);

        expect(screen.getByText('Auto-scroll: OFF')).toBeInTheDocument();
    });

    it('parses log levels correctly', () => {
        const logsWithLevels = [
            '[INFO] Information message',
            '[WARNING] Warning message',
            '[ERROR] Error message',
            '[SUCCESS] Success message'
        ];

        render(
            <ExecutionLogs
                logs={logsWithLevels}
                status="completed"
                onCancel={mockOnCancel}
                onClear={mockOnClear}
            />
        );

        expect(screen.getByText('[INFO]')).toBeInTheDocument();
        expect(screen.getByText('[WARNING]')).toBeInTheDocument();
        expect(screen.getByText('[ERROR]')).toBeInTheDocument();
        expect(screen.getByText('[SUCCESS]')).toBeInTheDocument();
    });
});