/**
 * Database configuration utility
 * Automatically selects the correct Postgres and Blob credentials based on environment
 *
 * Development: Uses *_DEV environment variables
 * Production: Uses standard environment variables (auto-injected by Vercel)
 */

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getPostgresUrl(): string {
  const isDev = isDevelopment();

  if (isDev) {
    const devUrl = process.env.POSTGRES_URL_DEV;
    if (!devUrl) {
      console.warn('⚠️  POSTGRES_URL_DEV not found. Falling back to POSTGRES_URL.');
      return process.env.POSTGRES_URL || '';
    }
    return devUrl;
  }

  // Production uses the standard POSTGRES_URL (auto-injected by Vercel)
  return process.env.POSTGRES_URL || '';
}

export function getBlobToken(): string {
  const isDev = isDevelopment();

  if (isDev) {
    const devToken = process.env.BLOB_READ_WRITE_TOKEN_DEV;
    if (!devToken) {
      console.warn('⚠️  BLOB_READ_WRITE_TOKEN_DEV not found. Falling back to BLOB_READ_WRITE_TOKEN.');
      return process.env.BLOB_READ_WRITE_TOKEN || '';
    }
    return devToken;
  }

  // Production uses the standard token (auto-injected by Vercel)
  return process.env.BLOB_READ_WRITE_TOKEN || '';
}

export function getEnvironmentInfo() {
  const isDev = isDevelopment();
  return {
    environment: isDev ? 'development' : 'production',
    postgresUrl: getPostgresUrl() ? '✅ Connected' : '❌ Not configured',
    blobToken: getBlobToken() ? '✅ Connected' : '❌ Not configured',
  };
}
