import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // For now, return empty array since we don't have audio contexts implemented yet
    return NextResponse.json({
      success: true,
      audioContexts: [],
    });
  } catch (error) {
    console.error('Error fetching audio contexts:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}