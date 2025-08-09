import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getAudioContextsByChatId, getChatById } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Get the chat to check permissions
  const chat = await getChatById({ id });

  if (!chat) {
    return new ChatSDKError('not_found:chat', 'Chat not found').toResponse();
  }

  // Check if user has access to this chat
  if (chat.visibility === 'private' && chat.userId !== session.user.id) {
    return new ChatSDKError('unauthorized:chat', 'Access denied').toResponse();
  }

  try {
    const audioContexts = await getAudioContextsByChatId({ chatId: id });

    // Return only the necessary fields for efficiency
    const simplifiedContexts = audioContexts.map((context: any) => ({
      audioFileName: context.audioFileName,
      audioFileUrl: context.audioFileUrl,
      audioFileType: context.audioFileType,
      audioDuration: context.audioDuration,
      contextSummary: context.contextSummary,
      audioTranscription: context.audioTranscription,
    }));

    return Response.json(simplifiedContexts);
  } catch (error) {
    return new ChatSDKError(
      'bad_request:database',
      'Failed to get audio contexts',
    ).toResponse();
  }
}
