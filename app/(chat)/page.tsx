import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

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
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('ADMIN MODE - Continuing without session');
      // Admin mode - continue without session
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
      redirect('/login');
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
