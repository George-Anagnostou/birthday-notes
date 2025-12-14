/**
 * Database configuration utility
 * Automatically selects the correct Postgres and Blob credentials based on environment
 *
 * Development: Uses *_DEV environment variables
 * Production: Uses standard environment variables (auto-injected by Vercel)
 */

import { logger } from './logger';

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function getPostgresUrl(): string {
  const isDev = isDevelopment();

  if (isDev) {
    const devUrl = process.env.POSTGRES_URL_DEV;
    if (!devUrl) {
      logger.warn('⚠️  POSTGRES_URL_DEV not found. Falling back to POSTGRES_URL.');
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
    // Check both naming conventions: new (BLOB_DEV_*) and old (BLOB_*_DEV)
    const devToken =
      process.env.BLOB_DEV_READ_WRITE_TOKEN ||
      process.env.BLOB_READ_WRITE_TOKEN_DEV;

    if (!devToken) {
      logger.warn('⚠️  Development blob token not found. Checked: BLOB_DEV_READ_WRITE_TOKEN, BLOB_READ_WRITE_TOKEN_DEV');
      logger.warn('⚠️  Falling back to BLOB_READ_WRITE_TOKEN or BLOB_PROD_READ_WRITE_TOKEN');
      return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_PROD_READ_WRITE_TOKEN || '';
    }
    return devToken;
  }

  // Production: Check both naming conventions: new (BLOB_PROD_*) and old (BLOB_READ_WRITE_TOKEN)
  const prodToken =
    process.env.BLOB_PROD_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN;

  if (!prodToken) {
    logger.error('⚠️  Production blob token not found. Checked: BLOB_PROD_READ_WRITE_TOKEN, BLOB_READ_WRITE_TOKEN');
  }

  return prodToken || '';
}

export function getCloudPrintUrl(): string {
  const isDev = isDevelopment();

  if (isDev) {
    const devUrl = process.env.CLOUD_PRINT_SERVICE_URL_DEV;
    if (!devUrl) {
      logger.warn('⚠️  CLOUD_PRINT_SERVICE_URL_DEV not found. Falling back to CLOUD_PRINT_SERVICE_URL.');
      return process.env.CLOUD_PRINT_SERVICE_URL || '';
    }
    return devUrl;
  }

  // Production uses the standard URL
  return process.env.CLOUD_PRINT_SERVICE_URL || '';
}

export function getEnvironmentInfo() {
  const isDev = isDevelopment();

  // Detailed blob token check
  const blobTokenStatus = getBlobToken() ? '✅ Connected' : '❌ Not configured';
  const blobTokenDetails = {
    BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_PROD_READ_WRITE_TOKEN: !!process.env.BLOB_PROD_READ_WRITE_TOKEN,
    BLOB_DEV_READ_WRITE_TOKEN: !!process.env.BLOB_DEV_READ_WRITE_TOKEN,
    BLOB_READ_WRITE_TOKEN_DEV: !!process.env.BLOB_READ_WRITE_TOKEN_DEV,
  };

  return {
    environment: isDev ? 'development' : 'production',
    postgresUrl: getPostgresUrl() ? '✅ Connected' : '❌ Not configured',
    blobToken: blobTokenStatus,
    blobTokenDetails,
    cloudPrintUrl: getCloudPrintUrl() ? '✅ Connected' : '❌ Not configured',
  };
}
