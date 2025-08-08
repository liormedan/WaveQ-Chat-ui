import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  createGeneratedAudioRequest,
  linkGeneratedAudioToMessage,
} from '@/lib/services/generated-audio-service';
import { saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      chatId,
      originalAudioId,
      originalAudioName,
      originalAudioUrl,
      processingType,
      targetFormat,
      qualitySettings,
    } = body;

    // Validate required fields
    if (
      !chatId ||
      !originalAudioId ||
      !originalAudioName ||
      !originalAudioUrl ||
      !processingType
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate processing type
    const validProcessingTypes = [
      'enhancement',
      'transcription',
      'translation',
      'noise-reduction',
      'format-conversion',
    ];
    if (!validProcessingTypes.includes(processingType)) {
      return NextResponse.json(
        { error: 'Invalid processing type' },
        { status: 400 },
      );
    }

    // Create the generated audio request
    const result = await createGeneratedAudioRequest({
      chatId,
      originalAudioId,
      originalAudioName,
      originalAudioUrl,
      processingType,
      targetFormat,
      qualitySettings,
    });

    // Create a message to show the generation request
    const messageId = generateUUID();
    const message = {
      chatId,
      id: messageId,
      role: 'assistant' as const,
      parts: [
        {
          type: 'text' as const,
          text: `I'm processing your audio file "${originalAudioName}" with ${processingType} processing. This will take about 1-2 minutes.`,
        },
      ],
      attachments: [],
      createdAt: new Date(),
    };

    await saveMessages({ messages: [message] });

    // Link the generated audio to the message
    await linkGeneratedAudioToMessage({
      generatedAudioId: result.id,
      messageId,
      messageType: 'generation-request',
      metadata: {
        processingType,
        targetFormat,
        qualitySettings,
      },
    });

    return NextResponse.json({
      success: true,
      generatedAudioId: result.id,
      statusId: result.statusId,
      messageId,
      generatedAudioName: result.generatedAudioName,
      generatedAudioUrl: result.generatedAudioUrl,
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 },
    );
  }
}
