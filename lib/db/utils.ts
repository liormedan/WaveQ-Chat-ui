import { generateId } from 'ai';
// import { genSaltSync, hashSync } from 'bcrypt-ts';

// Simple hash function that works in Edge Runtime
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export function generateHashedPassword(password: string) {
  // const salt = genSaltSync(10);
  // const hash = hashSync(password, salt);
  
  // Simple hash for Edge Runtime compatibility
  const salt = Math.random().toString(36).substring(2, 15);
  const hash = simpleHash(password + salt);
  
  return `${salt}:${hash}`;
}

export function generateDummyPassword() {
  const password = generateId();
  const hashedPassword = generateHashedPassword(password);

  return hashedPassword;
}
