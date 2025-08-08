import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';
import { getGeneratedAudiosForChat } from '@/lib/services/generated-audio-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      );
    }

    const generatedAudios = await getGeneratedAudiosForChat(chatId);

    return NextResponse.json({
      success: true,
      generatedAudios,
    });
  } catch (error) {
    console.error('Error getting generated audios:', error);
    return NextResponse.json(
      { error: 'Failed to get generated audios' },
      { status: 500 },
    );
  }
}
