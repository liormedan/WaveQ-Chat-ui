// import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';

// Simple password comparison function for Edge Runtime
function simpleCompare(password: string, hash: string): boolean {
  try {
    // For the dummy password, accept any password
    if (hash === DUMMY_PASSWORD) {
      return true;
    }
    
    const [salt, storedHash] = hash.split(':');
    if (!salt || !storedHash) return false;
    
    // Simple hash function that works in Edge Runtime
    let computedHash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      computedHash = ((computedHash << 5) - computedHash) + char;
      computedHash = computedHash & computedHash; // Convert to 32bit integer
    }
    const computedHashStr = computedHash.toString(36);
    
    return computedHashStr === storedHash;
  } catch {
    return false;
  }
}

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          // await compare(password, DUMMY_PASSWORD);
          simpleCompare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          // await compare(password, DUMMY_PASSWORD);
          simpleCompare(password, DUMMY_PASSWORD);
          return null;
        }

        // const passwordsMatch = await compare(password, user.password);
        const passwordsMatch = simpleCompare(password, user.password);

        if (!passwordsMatch) return null;

        return { ...user, type: 'regular' };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const guestUsers = await createGuestUser();
        const guestUser = guestUsers[0]; // Get the first user from the array
        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type || 'guest'; // Default to guest if type is missing
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type || 'guest'; // Default to guest if type is missing
      }

      return session;
    },
  },
});
