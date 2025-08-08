# Audio Support Features

This document outlines the audio support features implemented in the chat interface.

## Overview

The chat interface now supports audio file attachments with full playback capabilities, including:

- Audio file upload and validation
- Audio playback controls within chat messages
- Message status indicators for processing states
- Enhanced attachment preview with audio icons

## Features

### 1. Audio File Upload

- **Supported Formats**: MP3, WAV, OGG, M4A, AAC, WebM
- **File Size Limit**: 50MB maximum
- **Validation**: Automatic format and size validation with user feedback
- **Upload Progress**: Visual indicators during file upload

### 2. Audio Player Component

The `AudioPlayer` component provides:

- **Play/Pause Controls**: Standard media controls
- **Progress Bar**: Clickable timeline for seeking
- **Volume Control**: Adjustable volume with mute toggle
- **Time Display**: Current time and total duration
- **Error Handling**: Graceful error display for failed loads

### 3. Message Status Indicators

The `MessageStatusIndicator` component shows:

- **Processing**: Loading spinner for active processing
- **Completed**: Check mark for finished operations
- **Error**: Warning icon for failed operations
- **Idle**: No indicator when no status applies

### 4. Enhanced Attachment Preview

- **Audio Icons**: Visual indicators for audio files
- **File Type Detection**: Automatic content type recognition
- **Preview Thumbnails**: Appropriate icons for different file types

## Components

### AudioPlayer

```tsx
<AudioPlayer
  src="https://example.com/audio.mp3"
  title="My Audio File"
  className="max-w-md"
/>
```

**Props:**
- `src`: Audio file URL
- `title`: Display name for the audio file
- `className`: Additional CSS classes

### MessageStatusIndicator

```tsx
<MessageStatusIndicator
  status="processing"
  message="Processing audio..."
  className="mt-2"
/>
```

**Props:**
- `status`: 'processing' | 'completed' | 'error' | 'idle'
- `message`: Custom status message
- `className`: Additional CSS classes

## Implementation Details

### File Validation

Audio files are validated on upload:

```typescript
const allowedAudioTypes = [
  'audio/mpeg',
  'audio/mp3', 
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/webm',
];
```

### Message Processing

Audio attachments are automatically detected and rendered as audio players:

```typescript
const audioAttachments = attachmentsFromMessage.filter(
  (attachment) => attachment.mediaType?.startsWith('audio/'),
);
```

### Status Detection

Message status is determined based on content and processing state:

```typescript
const getMessageStatus = (): MessageStatus => {
  if (isLoading) return 'processing';
  if (message.role === 'assistant' && message.parts.some(part => part.type === 'reasoning')) {
    return 'completed';
  }
  return 'idle';
};
```

## Testing

Comprehensive tests are included for:

- Audio file upload validation
- Audio player functionality
- Message status indicators
- File size and format restrictions

Run tests with:

```bash
npm run test:e2e
```

## Styling

Custom CSS is included for audio player sliders:

```css
.slider {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}
```

## Browser Support

- **Audio Formats**: Modern browsers support most audio formats
- **HTML5 Audio**: Uses native HTML5 audio element
- **Fallbacks**: Graceful degradation for unsupported formats

## Future Enhancements

Potential improvements:

- Audio waveform visualization
- Playback speed controls
- Audio transcription display
- Multiple audio track support
- Audio editing capabilities
