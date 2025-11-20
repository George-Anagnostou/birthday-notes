import crypto from 'crypto';

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * Regular === or !== comparison can leak information through timing,
 * allowing attackers to guess passwords character by character.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // If lengths don't match, still do constant-time comparison
  // to avoid leaking length information
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  // If lengths differ, compare against a dummy buffer of the same length
  // to maintain constant time
  if (bufferA.length !== bufferB.length) {
    // Still do a comparison to prevent early return timing leak
    const dummyBuffer = Buffer.alloc(bufferA.length);
    crypto.timingSafeEqual(bufferA, dummyBuffer);
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Validate that a credential meets minimum security requirements
 *
 * @param credential - The credential to validate
 * @param minLength - Minimum required length (default: 8)
 * @returns true if valid, false otherwise
 */
export function isValidCredential(credential: string | null | undefined, minLength: number = 8): boolean {
  if (!credential || typeof credential !== 'string') {
    return false;
  }

  // Check minimum length
  if (credential.length < minLength) {
    return false;
  }

  // Ensure it's not just whitespace
  if (credential.trim().length === 0) {
    return false;
  }

  return true;
}
