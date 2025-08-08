import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { cleanupOldGeneratedAudio } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
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

    const body = await request.json();
    const { olderThanDays = 30, keepCount = 10, dryRun = false } = body;

    // Validate parameters
    if (olderThanDays < 1 || olderThanDays > 365) {
      return NextResponse.json(
        { error: 'olderThanDays must be between 1 and 365' },
        { status: 400 },
      );
    }

    if (keepCount < 1 || keepCount > 100) {
      return NextResponse.json(
        { error: 'keepCount must be between 1 and 100' },
        { status: 400 },
      );
    }

    if (dryRun) {
      // For dry run, we'll simulate the cleanup without actually deleting
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // Get files that would be deleted (simulation)
      const { getGeneratedAudiosByChatId } = await import('@/lib/db/queries');
      const allFiles = await getGeneratedAudiosByChatId({ chatId });

      const filesToDelete = allFiles
        .filter((file) => file.createdAt < cutoffDate)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, Math.max(0, allFiles.length - keepCount));

      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldDelete: {
          count: filesToDelete.length,
          files: filesToDelete.map((f) => ({
            id: f.id,
            name: f.generatedAudioName,
            createdAt: f.createdAt,
            size: f.metadata?.fileSize || 0,
          })),
        },
        parameters: {
          olderThanDays,
          keepCount,
        },
      });
    }

    // Perform actual cleanup
    const result = await cleanupOldGeneratedAudio({
      chatId,
      olderThanDays,
      keepCount,
    });

    return NextResponse.json({
      success: true,
      cleanup: result,
      parameters: {
        olderThanDays,
        keepCount,
      },
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup old files' },
      { status: 500 },
    );
  }
}
