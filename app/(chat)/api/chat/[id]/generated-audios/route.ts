import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getGeneratedAudiosForChat } from '@/lib/services/generated-audio-service';
import {
  withErrorHandling,
  createAuthErrorHandler,
  createValidationErrorHandler,
} from '@/lib/error-handling/api-middleware';
import { handleSDKError } from '@/lib/error-handling';

// Enhanced GET handler with error handling
const getGeneratedAudiosHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }

  const { id: chatId } = await params;
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  const generatedAudios = await getGeneratedAudiosForChat(chatId);

  return NextResponse.json({
    success: true,
    generatedAudios,
  });
};

// Export the wrapped handler with error handling
export const GET = withErrorHandling<{ id: string }>(
  getGeneratedAudiosHandler,
  {
    customErrorHandler: (error, context) => {
      if (
        error instanceof Error &&
        error.message === 'Authentication required'
      ) {
        return createAuthErrorHandler()(error, context);
      }
      if (error instanceof Error && error.message === 'Chat ID is required') {
        return createValidationErrorHandler('chatId')(error, context);
      }
      return undefined; // Use default error handling
    },
  },
);
