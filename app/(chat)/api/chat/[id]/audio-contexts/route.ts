import { auth } from '@/app/(auth)/auth';
import { getChatAudioContexts } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const { id } = params;

    // Get audio contexts for this chat
    const audioContexts = await getChatAudioContexts({ chatId: id });

    return Response.json({
      audioContexts,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Error fetching audio contexts:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
