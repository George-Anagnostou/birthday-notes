/**
 * Recipient configuration helpers
 *
 * Each deployment can be configured for a specific birthday recipient
 * via environment variables. This enables multi-tenant birthday sites
 * using the same codebase.
 */

import { logger } from './logger';

/**
 * Get the recipient ID for the current deployment
 * This is used to isolate notes per recipient in a shared database
 *
 * @returns recipient ID (e.g., "recipient1", "recipient2")
 * @throws Error if RECIPIENT_ID is not configured
 */
export function getRecipientId(): string {
  const recipientId = process.env.RECIPIENT_ID;

  if (!recipientId) {
    logger.error('RECIPIENT_ID environment variable is not set');
    throw new Error('Recipient not configured for this deployment');
  }

  return recipientId;
}

/**
 * Get the recipient's display name for the current deployment
 * This is shown in the UI (e.g., "Birthday wishes for Sarah")
 *
 * @returns recipient name or fallback if not configured
 */
export function getRecipientName(): string {
  return process.env.RECIPIENT_NAME || process.env.BIRTHDAY_NAME || 'Your Friend';
}

/**
 * Check if recipient configuration is valid
 *
 * @returns true if properly configured, false otherwise
 */
export function isRecipientConfigured(): boolean {
  return !!process.env.RECIPIENT_ID;
}
