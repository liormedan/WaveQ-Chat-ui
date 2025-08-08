import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import {
  getChatById,
  getMessagesByChatId,
  getAudioContextsByChatId,
  getGeneratedAudiosByChatId,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { convertToUIMessages } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const { searchParams } = request.nextUrl;

  const includeAudio = searchParams.get('include_audio') !== 'false';
  const includeGeneratedAudio =
    searchParams.get('include_generated_audio') !== 'false';
  const archiveName =
    searchParams.get('name') ||
    `archive-${chatId}-${new Date().toISOString().split('T')[0]}`;

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get chat and verify permissions
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return new ChatSDKError('not_found:chat', 'Chat not found').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('unauthorized:chat', 'Access denied').toResponse();
  }

  try {
    // Get all conversation data
    const messages = await getMessagesByChatId({ id: chatId });
    const uiMessages = convertToUIMessages(messages);

    // Get audio contexts if requested
    let audioContexts: any[] = [];
    if (includeAudio) {
      audioContexts = await getAudioContextsByChatId({ chatId });
    }

    // Get generated audio files if requested
    let generatedAudios: any[] = [];
    if (includeGeneratedAudio) {
      generatedAudios = await getGeneratedAudiosByChatId({ chatId });
    }

    // Create comprehensive archive
    const archiveData = {
      archive: {
        name: archiveName,
        chatId: chat.id,
        originalTitle: chat.title,
        archivedAt: new Date().toISOString(),
        archivedBy: session.user.id,
        version: '1.0',
      },
      chat: {
        id: chat.id,
        title: chat.title,
        visibility: chat.visibility,
        createdAt: chat.createdAt,
      },
      messages: uiMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.parts,
        metadata: message.metadata,
      })),
      audioContexts: audioContexts.map((context) => ({
        audioFileName: context.audioFileName,
        audioFileUrl: context.audioFileUrl,
        audioFileType: context.audioFileType,
        audioFileSize: context.audioFileSize,
        audioDuration: context.audioDuration,
        audioTranscription: context.audioTranscription,
        contextSummary: context.contextSummary,
        audioMetadata: context.audioMetadata,
        createdAt: context.createdAt,
        updatedAt: context.updatedAt,
      })),
      generatedAudios: generatedAudios.map((audio) => ({
        originalAudioName: audio.originalAudioName,
        originalAudioUrl: audio.originalAudioUrl,
        generatedAudioName: audio.generatedAudioName,
        generatedAudioUrl: audio.generatedAudioUrl,
        processingType: audio.processingType,
        processingSteps: audio.processingSteps,
        totalProcessingTime: audio.totalProcessingTime,
        qualityMetrics: audio.qualityMetrics,
        metadata: audio.metadata,
        createdAt: audio.createdAt,
        updatedAt: audio.updatedAt,
      })),
    };

    // Add archive metadata after creating the base data
    const finalArchiveData = {
      ...archiveData,
      archiveMetadata: {
        totalMessages: uiMessages.length,
        totalAudioFiles: audioContexts.length,
        totalGeneratedAudios: generatedAudios.length,
        archiveSize: JSON.stringify(archiveData).length,
        includesAudio: includeAudio,
        includesGeneratedAudio: includeGeneratedAudio,
      },
    };

    // Return the archive as JSON
    return Response.json(finalArchiveData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${archiveName}.json"`,
      },
    });
  } catch (error) {
    console.error('Archive error:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to archive conversation',
    ).toResponse();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get chat and verify permissions
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return new ChatSDKError('not_found:chat', 'Chat not found').toResponse();
  }

  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('unauthorized:chat', 'Access denied').toResponse();
  }

  try {
    // Get archive statistics
    const messages = await getMessagesByChatId({ id: chatId });
    const audioContexts = await getAudioContextsByChatId({ chatId });
    const generatedAudios = await getGeneratedAudiosByChatId({ chatId });

    const archiveStats = {
      chatId,
      title: chat.title,
      messageCount: messages.length,
      audioFileCount: audioContexts.length,
      generatedAudioCount: generatedAudios.length,
      totalSize: {
        messages: JSON.stringify(messages).length,
        audioContexts: JSON.stringify(audioContexts).length,
        generatedAudios: JSON.stringify(generatedAudios).length,
      },
      lastUpdated: chat.createdAt,
    };

    return Response.json(archiveStats);
  } catch (error) {
    console.error('Archive stats error:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to get archive statistics',
    ).toResponse();
  }
}
