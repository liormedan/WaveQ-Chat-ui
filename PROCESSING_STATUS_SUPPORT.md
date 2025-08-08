# Processing Status Indicators

This document outlines the processing status indicators functionality implemented for long-running operations in the chat interface.

## Overview

The processing status system provides real-time status updates, progress bars, estimated completion times, and cancellation controls for long-running operations such as:

- Audio file processing and transcription
- AI response generation
- File uploads
- Data analysis operations

## Features

### 1. Real-time Status Updates

- **Live Progress Tracking**: Real-time updates of processing steps and overall progress
- **Status Indicators**: Visual indicators for pending, running, completed, error, and cancelled states
- **Step-by-step Progress**: Individual step progress with detailed status information
- **Time Tracking**: Elapsed time and estimated completion time display

### 2. Progress Bars and Visual Indicators

- **Overall Progress Bar**: Shows completion percentage for entire operation
- **Step Progress Bars**: Individual progress bars for each processing step
- **Status Badges**: Color-coded badges indicating current status
- **Animated Indicators**: Smooth animations for loading states and transitions

### 3. Cancellation Controls

- **Cancel Operations**: User-initiated cancellation of running operations
- **Retry Failed Operations**: Retry functionality for failed processing steps
- **Pause/Resume**: Pause and resume capabilities for supported operations
- **Bulk Operations**: Cancel all active operations with a single click

### 4. Estimated Completion Times

- **Smart Time Estimation**: Calculates remaining time based on progress and historical data
- **Step Duration Tracking**: Records actual duration of completed steps
- **Time Formatting**: Human-readable time formats (seconds, minutes, hours)
- **Progress-based Estimates**: Dynamic time estimates that update as processing progresses

## Components

### ProcessingProgress

The main component for displaying processing status:

```tsx
<ProcessingProgress
  steps={processingSteps}
  overallProgress={75}
  status="running"
  estimatedTimeRemaining={120}
  canCancel={true}
  canRetry={false}
  onCancel={handleCancel}
  onRetry={handleRetry}
  title="Audio Processing"
  description="Processing audio file for transcription"
/>
```

**Props:**
- `steps`: Array of processing steps with individual status and progress
- `overallProgress`: Overall completion percentage (0-100)
- `status`: Current status ('pending', 'running', 'completed', 'error', 'cancelled')
- `estimatedTimeRemaining`: Estimated time remaining in seconds
- `canCancel`: Whether the operation can be cancelled
- `canRetry`: Whether failed operations can be retried
- `onCancel`: Callback for cancellation
- `onRetry`: Callback for retry
- `title`: Display title for the processing operation
- `description`: Optional description text

### ProcessingStatusPanel

A floating panel that displays all active processing operations:

```tsx
<ProcessingStatusPanel
  autoHide={true}
  autoHideDelay={10000}
  showCompleted={false}
  maxHeight="400px"
/>
```

**Props:**
- `autoHide`: Whether to automatically hide completed operations
- `autoHideDelay`: Delay before hiding completed operations (milliseconds)
- `showCompleted`: Whether to show completed operations
- `maxHeight`: Maximum height for the panel
- `className`: Additional CSS classes

## Services

### ProcessingStatusService

Core service for managing processing status:

```typescript
// Create a new processing status
const statusId = processingStatusService.createStatus({
  type: 'audio-processing',
  steps: processingSteps,
  canCancel: true,
  canRetry: true,
  canPause: false,
  metadata: { audioFileName: 'audio.mp3' },
});

// Update status
processingStatusService.updateStatus(statusId, {
  id: statusId,
  status: 'running',
  overallProgress: 50,
});

// Update specific step
processingStatusService.updateStep(statusId, stepId, {
  status: 'completed',
  progress: 100,
});

// Cancel processing
processingStatusService.cancelProcessing(statusId);

// Retry processing
processingStatusService.retryProcessing(statusId);
```

### Helper Functions

Pre-configured status creators for common operations:

```typescript
// Create audio processing status
const audioStatusId = createAudioProcessingStatus('audio.mp3');

// Create AI response status
const aiStatusId = createAIResponseStatus('text-message');
```

## Hooks

### useProcessingStatus

React hook for subscribing to processing status updates:

```typescript
const { status, isLoading, error, cancel, retry } = useProcessingStatus({
  id: 'status-id',
  autoSubscribe: true,
});
```

### useActiveProcessingStatuses

Hook to get all active processing statuses:

```typescript
const activeStatuses = useActiveProcessingStatuses();
```

## Integration Examples

### Audio Processing Integration

```typescript
// In audio context service
export async function processAudioContext({
  audioContextId,
  audioFileUrl,
  audioFileName,
}: {
  audioContextId: string;
  audioFileUrl: string;
  audioFileName?: string;
}) {
  // Create processing status
  const statusId = processingStatusService.createStatus({
    type: 'audio-processing',
    steps: [
      { id: 'step-1', name: 'Upload audio file', status: 'completed' },
      { id: 'step-2', name: 'Validate audio format', status: 'completed' },
      { id: 'step-3', name: 'Transcribe audio content', status: 'pending' },
      { id: 'step-4', name: 'Analyze audio features', status: 'pending' },
      { id: 'step-5', name: 'Generate context summary', status: 'pending' },
    ],
    canCancel: true,
    canRetry: true,
    canPause: false,
    metadata: { audioFileName },
  });

  try {
    // Update status to running
    processingStatusService.updateStatus(statusId, { 
      id: statusId, 
      status: 'running' 
    });

    // Process each step with status updates
    const steps = processingStatusService.getStatus(statusId)?.steps || [];
    
    // Step 1: Transcribe
    const transcriptionStepId = steps[2]?.id;
    if (transcriptionStepId) {
      processingStatusService.updateStep(statusId, transcriptionStepId, { 
        status: 'running' 
      });
    }
    const transcription = await generateTranscription(audioFileUrl);
    if (transcriptionStepId) {
      processingStatusService.updateStep(statusId, transcriptionStepId, { 
        status: 'completed', 
        progress: 100 
      });
    }

    // Continue with other steps...
    
    // Mark as completed
    processingStatusService.updateStatus(statusId, { 
      id: statusId, 
      status: 'completed', 
      overallProgress: 100 
    });
  } catch (error) {
    // Handle errors
    processingStatusService.updateStatus(statusId, { 
      id: statusId, 
      status: 'error', 
      error: error.message 
    });
  }
}
```

### AI Response Integration

```typescript
// In chat API
export async function generateAIResponse(message: string) {
  const statusId = createAIResponseStatus('text-message');
  
  try {
    // Update steps as AI processing progresses
    processingStatusService.updateStep(statusId, stepId, { 
      status: 'running' 
    });
    
    const response = await aiModel.generate(message);
    
    processingStatusService.updateStep(statusId, stepId, { 
      status: 'completed' 
    });
    
    processingStatusService.updateStatus(statusId, { 
      id: statusId, 
      status: 'completed' 
    });
    
    return response;
  } catch (error) {
    processingStatusService.updateStatus(statusId, { 
      id: statusId, 
      status: 'error', 
      error: error.message 
    });
    throw error;
  }
}
```

## UI Integration

### Chat Component Integration

```tsx
// In chat component
export function Chat({ id, ...props }) {
  return (
    <>
      {/* Main chat interface */}
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader />
        <Messages />
        <MultimodalInput />
      </div>

      {/* Processing status panel */}
      <ProcessingStatusPanel 
        autoHide={true}
        autoHideDelay={10000}
        showCompleted={false}
      />
    </>
  );
}
```

## Status Types

### ProcessingStepStatus

```typescript
type ProcessingStepStatus = 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
```

### ProcessingStatus

```typescript
interface ProcessingStatus {
  id: string;
  type: 'audio-processing' | 'ai-response' | 'file-upload' | 'transcription' | 'analysis';
  status: ProcessingStepStatus;
  steps: ProcessingStep[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
  canCancel: boolean;
  canRetry: boolean;
  canPause: boolean;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: Record<string, any>;
}
```

## Testing

### E2E Tests

Comprehensive test coverage for all processing status features:

```typescript
// Test processing status panel display
test('should display processing status panel when audio processing starts', async ({ page }) => {
  // Upload audio file
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('[data-testid="file-upload-button"]');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('tests/fixtures/sample-audio.mp3');

  // Verify panel appears
  await expect(page.locator('[data-testid="processing-progress"]')).toBeVisible();
  await expect(page.locator('text=Processing Tasks')).toBeVisible();
});

// Test cancellation
test('should allow cancellation of processing', async ({ page }) => {
  // Mock processing status
  await page.addInitScript(() => {
    window.mockProcessingStatus = {
      id: 'test-status',
      type: 'audio-processing',
      status: 'running',
      steps: [{ id: 'step-1', name: 'Upload audio file', status: 'completed' }],
      overallProgress: 50,
      canCancel: true,
      canRetry: false,
      canPause: false,
      startTime: new Date(),
    };
  });

  // Trigger processing
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('audio-processing-start', { 
      detail: window.mockProcessingStatus 
    }));
  });

  // Cancel processing
  await page.click('text=Cancel');
  await expect(page.locator('text=Cancelled')).toBeVisible();
});
```

## Configuration

### Environment Variables

```bash
# Processing status configuration
PROCESSING_STATUS_AUTO_HIDE=true
PROCESSING_STATUS_AUTO_HIDE_DELAY=10000
PROCESSING_STATUS_SHOW_COMPLETED=false
PROCESSING_STATUS_MAX_HEIGHT=400px
```

### Component Configuration

```typescript
// Default configuration
const defaultConfig = {
  autoHide: true,
  autoHideDelay: 10000, // 10 seconds
  showCompleted: false,
  maxHeight: '400px',
};
```

## Performance Considerations

### Memory Management

- Automatic cleanup of completed statuses older than 24 hours
- Efficient subscription management with automatic unsubscription
- Minimal re-renders through optimized state updates

### Real-time Updates

- Efficient event-driven updates using custom events
- Debounced updates to prevent excessive re-renders
- Optimized progress calculations

## Error Handling

### Graceful Degradation

- Fallback to basic loading indicators if processing status fails
- Error boundaries for processing status components
- Graceful handling of network failures

### Error Recovery

- Automatic retry mechanisms for failed operations
- User-initiated retry for failed processing steps
- Clear error messages with actionable feedback

## Future Enhancements

### Planned Features

1. **WebSocket Integration**: Real-time updates via WebSocket for better performance
2. **Persistent Storage**: Save processing status to database for recovery
3. **Advanced Analytics**: Processing time analytics and optimization suggestions
4. **Custom Workflows**: User-defined processing workflows
5. **Batch Operations**: Process multiple files with unified status tracking

### Performance Optimizations

1. **Virtual Scrolling**: Handle large numbers of processing tasks efficiently
2. **Lazy Loading**: Load processing details on demand
3. **Caching**: Cache processing status for better performance
4. **Background Processing**: Move heavy processing to background threads

## Troubleshooting

### Common Issues

1. **Status Not Updating**: Check subscription management and event handling
2. **Memory Leaks**: Ensure proper cleanup of subscriptions and timers
3. **UI Not Responsive**: Verify debouncing and optimization settings
4. **Cancellation Not Working**: Check permission settings and event propagation

### Debug Tools

```typescript
// Enable debug logging
processingStatusService.enableDebugLogging();

// Get all active statuses
const activeStatuses = processingStatusService.getActiveStatuses();

// Manual cleanup
processingStatusService.cleanup(1); // Clean up statuses older than 1 hour
```

## Contributing

### Development Guidelines

1. **Type Safety**: Maintain strict TypeScript typing
2. **Testing**: Add comprehensive tests for new features
3. **Documentation**: Update documentation for API changes
4. **Performance**: Monitor performance impact of changes

### Code Style

- Follow existing component patterns
- Use consistent naming conventions
- Maintain accessibility standards
- Follow React best practices

## License

This processing status system is part of the chat application and follows the same license terms.
