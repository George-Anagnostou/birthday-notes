/**
 * Fetch utilities with timeout and error handling
 */

/**
 * Custom error for timeout scenarios
 */
export class FetchTimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} timed out after ${timeout}ms`);
    this.name = 'FetchTimeoutError';
  }
}

/**
 * Fetch with automatic timeout
 *
 * Prevents requests from hanging indefinitely by aborting after a specified timeout.
 * Properly cleans up resources to prevent memory leaks.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options (will be merged with abort signal)
 * @param timeout - Timeout in milliseconds (default: 30000ms = 30 seconds)
 * @returns Promise resolving to Response
 * @throws {FetchTimeoutError} If request exceeds timeout
 * @throws {Error} For other fetch errors
 *
 * @example
 * ```typescript
 * try {
 *   const response = await fetchWithTimeout('https://api.example.com/data', {}, 10000);
 *   const data = await response.json();
 * } catch (error) {
 *   if (error instanceof FetchTimeoutError) {
 *     console.error('Request timed out');
 *   } else {
 *     console.error('Request failed', error);
 *   }
 * }
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 30000
): Promise<Response> {
  // Create abort controller for timeout
  const controller = new AbortController();

  // Set timeout to abort the request
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    // Merge abort signal with provided options
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Clear timeout on success
    clearTimeout(timeoutId);

    return response;
  } catch (error: unknown) {
    // Clean up timeout
    clearTimeout(timeoutId);

    // Check if error is due to abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(url, timeout);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Fetch with timeout and automatic retry
 *
 * Retries failed requests with exponential backoff.
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param timeout - Timeout per attempt in milliseconds
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to Response
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('https://api.example.com/data', {}, 5000, 2);
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  timeout: number = 30000,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // If response is not ok, throw to trigger retry
      if (!response.ok && attempt < maxRetries) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}
