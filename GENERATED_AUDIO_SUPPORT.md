# Generated Audio Support

This document outlines the generated audio functionality implemented for processing and displaying generated audio files in the chat interface.

## Overview

The generated audio system provides:

- **Audio Processing**: Various types of audio processing (enhancement, noise reduction, transcription, etc.)
- **Real-time Processing Status**: Live updates during audio generation with progress indicators
- **Quality Metrics**: Detailed quality analysis including SNR, clarity, and fidelity scores
- **Comparison View**: Side-by-side comparison between original and processed audio
- **Download Options**: Multiple format options for downloading generated audio files
- **Technical Metadata**: Comprehensive technical details about the generated audio

## Features

### 1. Audio Processing Types

The system supports multiple processing types:

- **Enhancement**: General audio quality improvement
- **Noise Reduction**: Background noise removal
- **Transcription**: Speech-to-text conversion
- **Translation**: Audio translation between languages
- **Format Conversion**: Converting between audio formats

### 2. Processing Status Integration

Generated audio processing integrates with the existing processing status system:

- Real-time progress updates
- Step-by-step processing details
- Estimated completion times
- Cancellation and retry capabilities

### 3. Quality Metrics

Each generated audio includes quality metrics:

- **Signal-to-Noise Ratio (SNR)**: Audio quality measurement in dB
- **Clarity Score**: Subjective clarity rating (1-10)
- **Fidelity Score**: Audio fidelity preservation rating (1-10)

### 4. Comparison Features

Users can compare original and processed audio:

- Side-by-side audio players
- Visual comparison indicators
- Quality improvement metrics

## Components

### GeneratedAudioDisplay

The main component for displaying generated audio files with full functionality.

```tsx
<GeneratedAudioDisplay
  generatedAudio={generatedAudioFile}
  onDownload={(audioId, format) => {
    // Handle download
  }}
  onCompare={(originalId, generatedId) => {
    // Handle comparison
  }}
/>
```

**Props:**
- `generatedAudio`: GeneratedAudioFile object with all processing details
- `onDownload`: Callback for download functionality
- `onCompare`: Callback for comparison functionality
- `className`: Additional CSS classes

### Features:
- **Expandable Details**: Click info button to show processing details
- **Comparison View**: Click compare button to show original vs processed
- **Download Options**: Multiple format selection with download button
- **Quality Metrics**: Color-coded quality indicators
- **Technical Metadata**: Format, bitrate, sample rate, channels

## Database Schema

### GeneratedAudio Table

```sql
CREATE TABLE "GeneratedAudio" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "originalAudioId" uuid NOT NULL,
  "originalAudioName" text NOT NULL,
  "originalAudioUrl" text NOT NULL,
  "generatedAudioName" text NOT NULL,
  "generatedAudioUrl" text NOT NULL,
  "processingType" varchar NOT NULL CHECK (processingType IN ('enhancement', 'transcription', 'translation', 'noise-reduction', 'format-conversion')),
  "processingSteps" json NOT NULL,
  "totalProcessingTime" integer NOT NULL,
  "qualityMetrics" json,
  "metadata" json NOT NULL,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL
);
```

### GeneratedAudioMessage Table

```sql
CREATE TABLE "GeneratedAudioMessage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "generatedAudioId" uuid NOT NULL REFERENCES "GeneratedAudio"("id"),
  "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
  "messageType" varchar NOT NULL CHECK (messageType IN ('generation-request', 'generation-complete', 'download-request')),
  "metadata" json,
  "createdAt" timestamp NOT NULL
);
```

## API Endpoints

### POST /api/audio/generate

Creates a new audio generation request.

**Request Body:**
```json
{
  "chatId": "chat-uuid",
  "originalAudioId": "audio-uuid",
  "originalAudioName": "original_audio.mp3",
  "originalAudioUrl": "https://example.com/audio.mp3",
  "processingType": "enhancement",
  "targetFormat": "mp3",
  "qualitySettings": {
    "bitrate": 128,
    "sampleRate": 44100,
    "channels": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "generatedAudioId": "generated-audio-uuid",
  "statusId": "processing-status-uuid",
  "messageId": "message-uuid",
  "generatedAudioName": "original_audio_enhancement_1234567890.mp3",
  "generatedAudioUrl": "https://example.com/generated.mp3"
}
```

### GET /api/chat/{id}/generated-audios

Retrieves all generated audios for a specific chat.

**Response:**
```json
{
  "success": true,
  "generatedAudios": [
    {
      "id": "generated-audio-uuid",
      "originalAudioId": "original-audio-uuid",
      "originalAudioName": "original_audio.mp3",
      "originalAudioUrl": "https://example.com/original.mp3",
      "generatedAudioName": "original_audio_enhancement_1234567890.mp3",
      "generatedAudioUrl": "https://example.com/generated.mp3",
      "processingDetails": {
        "processingType": "enhancement",
        "processingSteps": [...],
        "totalProcessingTime": 80,
        "qualityMetrics": {
          "signalToNoiseRatio": 42.5,
          "clarityScore": 8.7,
          "fidelityScore": 9.1
        }
      },
      "metadata": {
        "format": "mp3",
        "bitrate": 128,
        "sampleRate": 44100,
        "channels": 2,
        "duration": 180,
        "fileSize": 2500000
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Services

### GeneratedAudioService

The main service for handling generated audio operations.

**Key Functions:**

- `createGeneratedAudioRequest()`: Creates a new audio generation request
- `getGeneratedAudiosForChat()`: Retrieves all generated audios for a chat
- `getGeneratedAudio()`: Gets a specific generated audio by ID
- `linkGeneratedAudioToMessage()`: Links generated audio to chat messages

**Processing Types:**
- `enhancement`: General audio quality improvement
- `noise-reduction`: Background noise removal
- `transcription`: Speech-to-text conversion
- `translation`: Audio translation
- `format-conversion`: Format conversion

## Hooks

### useGeneratedAudios

React hook for fetching and managing generated audio files.

```tsx
const { generatedAudios, isLoading, error, refetch } = useGeneratedAudios({ chatId });
```

**Returns:**
- `generatedAudios`: Array of GeneratedAudioFile objects
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Function to refetch data

## Integration

### Message Component Integration

Generated audio displays are automatically shown in assistant messages when generated audios are available for the chat.

```tsx
// In components/message.tsx
{message.role === 'assistant' && generatedAudios.length > 0 && (
  <div className="space-y-3">
    {generatedAudios.map((generatedAudio) => (
      <GeneratedAudioDisplay
        key={generatedAudio.id}
        generatedAudio={generatedAudio}
        onDownload={(audioId, format) => {
          // Handle download
        }}
        onCompare={(originalId, generatedId) => {
          // Handle comparison
        }}
      />
    ))}
  </div>
)}
```

## Processing Status Integration

Generated audio processing integrates with the ProcessingStatusService:

```tsx
// Create processing status
const statusId = processingStatusService.createStatus({
  type: 'audio-generation',
  steps: [
    { id: generateUUID(), name: 'Analyze original audio', status: 'pending', estimatedDuration: 10 },
    { id: generateUUID(), name: 'Apply processing algorithm', status: 'pending', estimatedDuration: 45 },
    { id: generateUUID(), name: 'Generate output file', status: 'pending', estimatedDuration: 15 },
    { id: generateUUID(), name: 'Quality validation', status: 'pending', estimatedDuration: 10 },
  ],
  canCancel: true,
  canRetry: true,
  canPause: false,
  metadata: { originalAudioName, processingType },
});
```

## Quality Metrics

### Signal-to-Noise Ratio (SNR)
- **Range**: 0-60 dB
- **Good**: 30-50 dB
- **Excellent**: 50+ dB

### Clarity Score
- **Range**: 1-10
- **Good**: 7-8
- **Excellent**: 8-10

### Fidelity Score
- **Range**: 1-10
- **Good**: 7-8
- **Excellent**: 8-10

## Testing

### E2E Tests

Comprehensive Playwright tests cover:

- Display of generated audio components
- Processing details expansion
- Quality metrics display
- Comparison view functionality
- Download options
- Technical metadata display
- Multiple generated audios handling

### Test Coverage

- Component rendering and interactions
- API endpoint functionality
- Database operations
- Processing status integration
- Quality metrics calculation
- Download and comparison features

## Configuration

### Environment Variables

No additional environment variables are required beyond the existing database configuration.

### Database Migration

Run the database migration to create the new tables:

```bash
npm run db:generate
npm run db:migrate
```

## Performance Considerations

### Processing Optimization

- Background processing to avoid blocking the UI
- Real-time status updates via ProcessingStatusService
- Efficient database queries with proper indexing

### Memory Management

- Lazy loading of generated audio details
- Efficient state management in React components
- Proper cleanup of processing status subscriptions

## Error Handling

### Common Errors

- **Processing Failure**: Automatic retry with exponential backoff
- **Database Errors**: Graceful fallback with user notification
- **Network Errors**: Retry mechanism with user feedback

### Error Recovery

- Automatic retry for failed processing
- Manual retry options for user-initiated recovery
- Fallback to basic audio display if processing fails

## Future Enhancements

### Planned Features

- **Batch Processing**: Process multiple audio files simultaneously
- **Advanced Quality Metrics**: More sophisticated audio analysis
- **Custom Processing Algorithms**: User-defined processing parameters
- **Audio Visualization**: Waveform and spectrogram displays
- **Cloud Storage Integration**: Direct upload to cloud storage

### Performance Improvements

- **Streaming Processing**: Real-time audio processing
- **Caching**: Cache processed audio files
- **Compression**: Optimize file sizes for faster downloads

## Troubleshooting

### Common Issues

1. **Generated audio not displaying**
   - Check database connection
   - Verify API endpoint responses
   - Ensure proper chat ID in requests

2. **Processing status not updating**
   - Check ProcessingStatusService integration
   - Verify WebSocket connections
   - Check browser console for errors

3. **Download not working**
   - Verify file permissions
   - Check network connectivity
   - Ensure proper file format support

### Debug Information

Enable debug logging by setting:

```typescript
// In development
console.log('Generated audio debug:', generatedAudio);
```

## Contributing

### Development Setup

1. Install dependencies
2. Set up database connection
3. Run database migrations
4. Start development server

### Code Style

- Follow existing TypeScript patterns
- Use proper error handling
- Include comprehensive tests
- Document new features

### Testing Guidelines

- Write unit tests for new functions
- Include E2E tests for UI components
- Test error scenarios
- Verify performance impact

## License

This functionality is part of the main project and follows the same licensing terms.
