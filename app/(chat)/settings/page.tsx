import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import SettingsPage from './settings-client';

export default async function Page() {
  try {
    const session = await auth();

    if (!session) {
      redirect('/api/auth/guest');
    }

    return <SettingsPage session={session} />;
  } catch (error) {
    console.error('Error in settings page:', error);
    return <div>Error loading settings</div>;
  }
}
