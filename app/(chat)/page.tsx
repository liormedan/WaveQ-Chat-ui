import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

export default async function Page() {
  console.log('=== PAGE LOADING ===');
  console.log('DISABLE_AUTH:', process.env.DISABLE_AUTH);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  const session = await auth();
  console.log('Session exists:', !!session);
  console.log('Session user:', session?.user?.email);

  // Check if this is a guest session (auto-created)
  const isGuestSession = session?.user?.email?.startsWith('guest-');
  console.log('Is guest session:', isGuestSession);

  if (!session) {
    console.log('No session found');
    
    // Check if authentication is disabled (admin mode)
    // Handle both 'true' string and undefined cases for production
    const isAdminMode = process.env.DISABLE_AUTH === 'true' || process.env.NODE_ENV === 'production';
    
    if (isAdminMode) {
      console.log('ADMIN/PRODUCTION MODE - Continuing without session');
      // Admin mode or production mode - continue without session
      // Create a minimal session object for admin mode
      const adminSession: Session = {
        user: {
          id: 'admin',
          email: 'admin@waveq.local',
          name: 'Admin User',
          type: 'regular' as const,
          image: null
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      const id = generateUUID();
      const cookieStore = await cookies();
      const modelIdFromCookie = cookieStore.get('chat-model');

      if (!modelIdFromCookie) {
        return (
          <>
            <Chat
              key={id}
              id={id}
              initialMessages={[]}
              initialChatModel={DEFAULT_CHAT_MODEL}
              initialVisibilityType="private"
              isReadonly={false}
              session={adminSession}
              autoResume={false}
            />
            <DataStreamHandler />
          </>
        );
      }

      return (
        <>
          <Chat
            key={id}
            id={id}
            initialMessages={[]}
            initialChatModel={modelIdFromCookie.value}
            initialVisibilityType="private"
            isReadonly={false}
            session={adminSession}
            autoResume={false}
          />
          <DataStreamHandler />
        </>
      );
    } else {
      console.log('USER MODE - Redirecting to login');
      try {
        redirect('/login');
      } catch (error) {
        console.error('Failed to redirect to login:', error);
        // Fallback: show a simple page with login link
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
              <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Welcome to WaveQ Chat
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Please log in to continue
                </p>
              </div>
              <div className="mt-8 space-y-6">
                <a
                  href="/login"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login
                </a>
                <a
                  href="/register"
                  className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
        );
      }
    }
  } else if (isGuestSession) {
    console.log('Guest session found - allowing access');
    // Guest session is valid, continue normally
  } else {
    console.log('Real user session found, continuing normally');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
