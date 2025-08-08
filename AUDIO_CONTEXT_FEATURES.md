# Audio Context-Aware Chat Functionality

This document outlines the implementation of context-aware chat functionality for audio files, enabling intelligent conversations about audio content.

## Overview

The audio context system provides:

- **Audio File Processing**: Automatic transcription and analysis of uploaded audio files
- **Context Maintenance**: Persistent audio context across chat messages
- **Intelligent Responses**: AI-generated responses that reference audio content
- **Multi-Audio Support**: Handling multiple audio files in a single conversation
- **Rich Metadata**: Topics, sentiment, keywords, and summaries

## Features

### 1. Audio Context Creation

When audio files are uploaded, the system automatically:

- Creates an audio context record in the database
- Processes the audio file for transcription (mock implementation)
- Generates metadata including topics, sentiment, and keywords
- Links the audio context to the chat session

### 2. Context-Aware Response Generation

The AI assistant:

- Analyzes all available audio contexts for the chat
- Generates responses that reference specific audio content
- Maintains context across multiple messages
- Provides insights about audio content

### 3. Audio Context Display

The UI displays:

- Audio file information (name, duration)
- Generated topics and sentiment
- Expandable transcriptions
- Context summaries

### 4. Multi-Audio Support

The system supports:

- Multiple audio files in a single chat
- Cross-referencing between audio files
- Comparative analysis of audio content

## Database Schema

### AudioContext Table

```sql
CREATE TABLE "AudioContext" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "audioFileId" uuid NOT NULL,
  "audioFileName" text NOT NULL,
  "audioFileUrl" text NOT NULL,
  "audioFileType" varchar(50) NOT NULL,
  "audioFileSize" integer,
  "audioDuration" integer,
  "audioTranscription" text,
  "audioMetadata" json,
  "contextSummary" text,
  "createdAt" timestamp NOT NULL,
  "updatedAt" timestamp NOT NULL
);
```

### AudioContextMessage Table

```sql
CREATE TABLE "AudioContextMessage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "audioContextId" uuid NOT NULL REFERENCES "AudioContext"("id"),
  "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
  "timestamp" integer,
  "contextType" varchar NOT NULL CHECK (contextType IN ('reference', 'analysis', 'question', 'response')),
  "contextData" json,
  "createdAt" timestamp NOT NULL
);
```

## API Endpoints

### POST /api/chat

Enhanced to process audio files and generate context-aware responses.

**Request Body:**
```json
{
  "id": "chat-uuid",
  "message": {
    "id": "message-uuid",
    "role": "user",
    "parts": [
      {
        "type": "text",
        "text": "What is this audio about?"
      },
      {
        "type": "file",
        "mediaType": "audio/mpeg",
        "name": "podcast.mp3",
        "url": "https://example.com/audio.mp3"
      }
    ]
  },
  "selectedChatModel": "chat-model",
  "selectedVisibilityType": "private"
}
```

### GET /api/chat/{id}/audio-contexts

Retrieves audio contexts for a specific chat.

**Response:**
```json
{
  "audioContexts": [
    {
      "id": "context-uuid",
      "audioFileName": "podcast.mp3",
      "audioFileUrl": "https://example.com/audio.mp3",
      "audioDuration": 1800,
      "audioTranscription": "This is a podcast about...",
      "contextSummary": "A discussion about technology trends",
      "audioMetadata": {
        "topics": ["technology", "innovation"],
        "sentiment": "positive",
        "keywords": ["AI", "future"]
      }
    }
  ]
}
```

## Components

### AudioContextDisplay

Displays audio context information in the chat interface.

**Props:**
```typescript
interface AudioContextDisplayProps {
  audioContexts: Array<{
    id: string;
    audioFileName: string;
    audioFileUrl: string;
    audioDuration?: number;
    audioTranscription?: string;
    contextSummary?: string;
    audioMetadata?: any;
  }>;
  className?: string;
}
```

### AudioContextService

Service for managing audio context operations.

**Key Methods:**
- `createAudioContext()`: Creates new audio context
- `processAudioContext()`: Processes audio file for transcription and metadata
- `generateAudioAwareResponse()`: Generates intelligent responses based on audio context
- `linkMessageToAudioContext()`: Links messages to audio contexts

## Usage Examples

### Basic Audio Context Creation

```typescript
import { createAudioContext, processAudioContext } from '@/lib/services/audio-context-service';

// Create audio context
const audioContext = await createAudioContext({
  chatId: 'chat-uuid',
  audioFile: {
    id: 'file-uuid',
    name: 'podcast.mp3',
    url: 'https://example.com/audio.mp3',
    type: 'audio/mpeg',
    size: 1024000,
    duration: 1800
  }
});

// Process the audio context
await processAudioContext({
  audioContextId: audioContext.id,
  audioFileUrl: 'https://example.com/audio.mp3'
});
```

### Generating Audio-Aware Responses

```typescript
import { generateAudioAwareResponse } from '@/lib/services/audio-context-service';

const response = await generateAudioAwareResponse({
  userMessage: "What did they say about AI?",
  audioContexts: [audioContext],
  chatHistory: previousMessages
});
```

### Displaying Audio Context

```tsx
import { AudioContextDisplay } from '@/components/audio-context-display';

<AudioContextDisplay 
  audioContexts={audioContexts}
  className="mb-4"
/>
```

## Testing

Comprehensive tests are included for:

- Audio context creation and processing
- Context-aware response generation
- Multi-audio file handling
- UI component functionality

Run tests with:

```bash
npm run test:e2e
```

## Configuration

### Environment Variables

No additional environment variables are required for the basic implementation. For production use with real speech-to-text services, you would need:

- `OPENAI_API_KEY`: For OpenAI Whisper transcription
- `GOOGLE_CLOUD_CREDENTIALS`: For Google Speech-to-Text
- `AZURE_SPEECH_KEY`: For Azure Speech Services

### Audio File Support

Supported audio formats:
- MP3 (audio/mpeg, audio/mp3)
- WAV (audio/wav)
- OGG (audio/ogg)
- M4A (audio/m4a)
- AAC (audio/aac)
- WebM (audio/webm)

Maximum file size: 50MB

## Future Enhancements

### Planned Features

1. **Real Speech-to-Text Integration**
   - OpenAI Whisper API integration
   - Google Speech-to-Text support
   - Azure Speech Services integration

2. **Advanced Audio Analysis**
   - Speaker identification
   - Emotion detection
   - Music genre classification
   - Background noise analysis

3. **Enhanced Context Features**
   - Audio timestamp linking
   - Cross-reference between audio files
   - Audio search and filtering
   - Audio bookmarking

4. **UI Improvements**
   - Audio waveform visualization
   - Interactive audio timeline
   - Audio annotation tools
   - Audio comparison views

### Technical Improvements

1. **Performance Optimization**
   - Audio processing queue
   - Caching of processed audio data
   - Streaming audio processing

2. **Scalability**
   - Distributed audio processing
   - Audio storage optimization
   - CDN integration for audio files

3. **Security**
   - Audio file encryption
   - Access control for audio contexts
   - Audit logging for audio operations

## Troubleshooting

### Common Issues

1. **Audio Context Not Created**
   - Check file upload success
   - Verify audio format support
   - Check database connection

2. **Transcription Not Generated**
   - Verify audio file accessibility
   - Check processing service status
   - Review error logs

3. **Context-Aware Responses Not Working**
   - Verify audio context exists
   - Check AI model availability
   - Review system prompts

### Debug Information

Enable debug logging by setting:

```typescript
console.log('Audio Context Debug:', {
  audioContexts,
  userMessage,
  chatHistory
});
```

## Contributing

When contributing to audio context functionality:

1. Follow the existing code structure
2. Add comprehensive tests
3. Update documentation
4. Consider performance implications
5. Test with various audio formats

## License

This audio context functionality is part of the main project license.
