import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import {
  getProcessingHistory,
  getProcessingStats,
  getProcessingPerformance,
  getStorageUsage,
} from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: chatId } = await params;
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const processingType = searchParams.get('processingType') || undefined;
    const status = searchParams.get('status') as
      | 'completed'
      | 'error'
      | 'processing'
      | undefined;
    const includeStats = searchParams.get('includeStats') === 'true';
    const includePerformance =
      searchParams.get('includePerformance') === 'true';
    const includeStorage = searchParams.get('includeStorage') === 'true';
    const timeRange =
      (searchParams.get('timeRange') as '7d' | '30d' | '90d') || '30d';

    // Parse date range if provided
    let dateRange: { start: Date; end: Date } | undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    // Get processing history
    const history = await getProcessingHistory({
      chatId,
      limit,
      offset,
      processingType,
      dateRange,
      status,
    });

    const response: any = {
      success: true,
      history: history.results,
      pagination: {
        totalCount: history.totalCount,
        hasMore: history.hasMore,
        limit,
        offset,
      },
    };

    // Include additional data if requested
    if (includeStats) {
      const stats = await getProcessingStats({ chatId });
      response.stats = stats;
    }

    if (includePerformance) {
      const performance = await getProcessingPerformance({ chatId, timeRange });
      response.performance = performance;
    }

    if (includeStorage) {
      const storage = await getStorageUsage({ chatId });
      response.storage = storage;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching processing history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processing history' },
      { status: 500 },
    );
  }
}
