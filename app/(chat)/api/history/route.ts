import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import {
  getChatsByUserId,
  getChatsByUserIdWithAudioContext,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');
  const includeAudioContext =
    searchParams.get('include_audio_context') === 'true';

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // Use the new function with audio context support
  const chats = await getChatsByUserIdWithAudioContext({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
    includeAudioContext,
  });

  return Response.json(chats);
}
