import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import {
  getChatById,
  getMessagesByChatId,
  getAudioContextsByChatId,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { convertToUIMessages } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: chatId } = await params;
  const { searchParams } = request.nextUrl;

  const includeAudio = searchParams.get('include_audio') === 'true';
  const format = searchParams.get('format') || 'json';
  const includeAttachments =
    searchParams.get('include_attachments') !== 'false';

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
    // Get messages
    const messages = await getMessagesByChatId({ id: chatId });
    const uiMessages = convertToUIMessages(messages);

    // Get audio contexts if requested
    let audioContexts = [];
    if (includeAudio) {
      audioContexts = await getAudioContextsByChatId({ chatId });
    }

    // Prepare export data
    const exportData = {
      chat: {
        id: chat.id,
        title: chat.title,
        visibility: chat.visibility,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
      messages: uiMessages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.parts,
        metadata: message.metadata,
      })),
      audioContexts: includeAudio
        ? audioContexts.map((context: any) => ({
            audioFileName: context.audioFileName,
            audioFileUrl: context.audioFileUrl,
            audioFileType: context.audioFileType,
            audioDuration: context.audioDuration,
            audioTranscription: context.audioTranscription,
            contextSummary: context.contextSummary,
            audioMetadata: context.audioMetadata,
          }))
        : [],
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.id,
        format,
        includeAudio,
        includeAttachments,
        totalMessages: uiMessages.length,
        totalAudioFiles: audioContexts.length,
      },
    };

    // Return based on format
    if (format === 'json') {
      return Response.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="chat-${chatId}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else if (format === 'txt') {
      const textContent = generateTextExport(exportData);
      return new Response(textContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="chat-${chatId}-${new Date().toISOString().split('T')[0]}.txt"`,
        },
      });
    } else if (format === 'markdown') {
      const markdownContent = generateMarkdownExport(exportData);
      return new Response(markdownContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="chat-${chatId}-${new Date().toISOString().split('T')[0]}.md"`,
        },
      });
    } else {
      return new ChatSDKError(
        'bad_request:api',
        'Unsupported format',
      ).toResponse();
    }
  } catch (error) {
    console.error('Export error:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to export conversation',
    ).toResponse();
  }
}

function generateTextExport(data: any): string {
  let content = `Chat Export: ${data.chat.title}\n`;
  content += `Created: ${new Date(data.chat.createdAt).toLocaleString()}\n`;
  content += `Total Messages: ${data.exportMetadata.totalMessages}\n`;
  content += `Total Audio Files: ${data.exportMetadata.totalAudioFiles}\n`;
  content += `\n${'='.repeat(50)}\n\n`;

  // Add audio context information
  if (data.audioContexts.length > 0) {
    content += `AUDIO FILES:\n`;
    content += `${'='.repeat(20)}\n`;
    data.audioContexts.forEach((audio: any, index: number) => {
      content += `${index + 1}. ${audio.audioFileName}\n`;
      content += `   Type: ${audio.audioFileType}\n`;
      if (audio.audioDuration) {
        content += `   Duration: ${formatDuration(audio.audioDuration)}\n`;
      }
      if (audio.contextSummary) {
        content += `   Summary: ${audio.contextSummary}\n`;
      }
      if (audio.audioTranscription) {
        content += `   Transcription: ${audio.audioTranscription}\n`;
      }
      content += '\n';
    });
    content += '\n';
  }

  // Add messages
  content += `CONVERSATION:\n`;
  content += `${'='.repeat(20)}\n\n`;

  data.messages.forEach((message: any) => {
    const timestamp = message.metadata?.createdAt || '';
    const role = message.role.toUpperCase();
    content += `[${timestamp}] ${role}:\n`;

    // Extract text content from message parts
    const textContent = extractTextFromParts(message.content);
    content += `${textContent}\n\n`;
  });

  return content;
}

function generateMarkdownExport(data: any): string {
  let content = `# Chat Export: ${data.chat.title}\n\n`;
  content += `**Created:** ${new Date(data.chat.createdAt).toLocaleString()}\n`;
  content += `**Total Messages:** ${data.exportMetadata.totalMessages}\n`;
  content += `**Total Audio Files:** ${data.exportMetadata.totalAudioFiles}\n\n`;

  // Add audio context information
  if (data.audioContexts.length > 0) {
    content += `## Audio Files\n\n`;
    data.audioContexts.forEach((audio: any, index: number) => {
      content += `### ${index + 1}. ${audio.audioFileName}\n\n`;
      content += `- **Type:** ${audio.audioFileType}\n`;
      if (audio.audioDuration) {
        content += `- **Duration:** ${formatDuration(audio.audioDuration)}\n`;
      }
      if (audio.contextSummary) {
        content += `- **Summary:** ${audio.contextSummary}\n`;
      }
      if (audio.audioTranscription) {
        content += `- **Transcription:** ${audio.audioTranscription}\n`;
      }
      content += '\n';
    });
    content += '\n';
  }

  // Add messages
  content += `## Conversation\n\n`;

  data.messages.forEach((message: any) => {
    const timestamp = message.metadata?.createdAt || '';
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    content += `### ${role} - ${timestamp}\n\n`;

    // Extract text content from message parts
    const textContent = extractTextFromParts(message.content);
    content += `${textContent}\n\n`;
  });

  return content;
}

function extractTextFromParts(parts: any[]): string {
  if (!Array.isArray(parts)) return '';

  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(' ');
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
