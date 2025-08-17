// import { generateDummyPassword } from './db/utils';

// Environment check functions that work in Edge Runtime
function getNodeEnv(): string {
  try {
    return process.env.NODE_ENV || 'development';
  } catch {
    return 'development';
  }
}

function getEnvVar(key: string): string | undefined {
  try {
    return process.env[key];
  } catch {
    return undefined;
  }
}

export const isProductionEnvironment = getNodeEnv() === 'production';
export const isDevelopmentEnvironment = getNodeEnv() === 'development';
export const isTestEnvironment = Boolean(
  getEnvVar('PLAYWRIGHT_TEST_BASE_URL') ||
    getEnvVar('PLAYWRIGHT') ||
    getEnvVar('CI_PLAYWRIGHT'),
);

// Admin and authentication modes
export const isAdminMode = getEnvVar('ADMIN_MODE') === 'true';
export const skipAuth = getEnvVar('SKIP_AUTH') === 'true';
export const allowGuest = getEnvVar('ALLOW_GUEST') === 'true';

export const guestRegex = /^guest-\d+$/;

// Use a fixed dummy password for consistency
export const DUMMY_PASSWORD = 'dummy-salt:dummy-hash';
