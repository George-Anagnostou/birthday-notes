/**
 * Logger utility with environment-based log levels
 *
 * Log levels (in order of severity):
 * - error: Always logged (critical errors)
 * - warn: Logged in development and production
 * - info: Logged in development and production
 * - debug: Only logged in development
 *
 * In production, only error, warn, and info messages are shown.
 * In development, all log levels are shown.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV !== 'production';

class Logger {
  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug(...args: any[]): void {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  }

  /**
   * Info-level logging (all environments)
   * Use for general informational messages
   */
  info(...args: any[]): void {
    console.log('[INFO]', ...args);
  }

  /**
   * Warning-level logging (all environments)
   * Use for warning messages that don't prevent operation
   */
  warn(...args: any[]): void {
    console.warn('[WARN]', ...args);
  }

  /**
   * Error-level logging (all environments)
   * Use for error messages and exceptions
   */
  error(...args: any[]): void {
    console.error('[ERROR]', ...args);
  }
}

// Export singleton instance
export const logger = new Logger();
