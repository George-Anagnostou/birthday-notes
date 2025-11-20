import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getResetTime, RateLimitType, RATE_LIMITS } from './rate-limit';
import { logger } from './logger';

/**
 * Extract client identifier from request
 *
 * Uses X-Forwarded-For header (Vercel provides this) or falls back to IP
 * Handles IPv6 properly
 */
export function getClientIdentifier(request: NextRequest): string {
  // Vercel provides the actual client IP in x-forwarded-for
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // May contain multiple IPs (client, proxy1, proxy2, ...)
    // Use the first one (actual client)
    const ip = forwardedFor.split(',')[0].trim();
    return ip;
  }

  // Fallback to x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Last resort: use a placeholder (shouldn't happen on Vercel)
  // In local development, this will group all requests together
  return 'unknown-ip';
}

/**
 * Create rate limit exceeded response
 */
function createRateLimitResponse(
  type: RateLimitType,
  resetTimestamp: number,
  remaining: number,
  limit: number
): NextResponse {
  const config = RATE_LIMITS[type];
  const resetTime = getResetTime(resetTimestamp);

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded for ${config.description}. Please try again in ${resetTime}.`,
      retryAfter: Math.ceil((resetTimestamp - Date.now()) / 1000), // seconds
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTimestamp.toString(),
        'Retry-After': Math.ceil((resetTimestamp - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to successful response
 */
function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  return response;
}

/**
 * Rate limit middleware wrapper for API route handlers
 *
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   'AUTH_VERIFY'
 * );
 * ```
 *
 * @param handler - Next.js API route handler
 * @param limitType - Type of rate limit to apply
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limitType: RateLimitType
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get client identifier
      const identifier = getClientIdentifier(request);

      // Check rate limit
      const result = await checkRateLimit(identifier, limitType);

      // If rate limit exceeded, return 429
      if (!result.success) {
        logger.warn(
          `Rate limit exceeded for ${limitType} from ${identifier} (limit: ${result.limit})`
        );
        return createRateLimitResponse(limitType, result.reset, result.remaining, result.limit);
      }

      // Log if getting close to limit (< 20% remaining)
      const percentRemaining = (result.remaining / result.limit) * 100;
      if (percentRemaining < 20 && percentRemaining > 0) {
        logger.info(
          `Rate limit warning for ${limitType} from ${identifier}: ${result.remaining}/${result.limit} remaining`
        );
      }

      // Execute the actual handler
      const response = await handler(request);

      // Add rate limit headers to response
      return addRateLimitHeaders(response, result.limit, result.remaining, result.reset);
    } catch (error: unknown) {
      // If rate limiting fails, log error but don't block the request
      // This ensures rate limiter failures don't break the API
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Rate limit check failed for ${limitType}: ${message}`);
      logger.warn('Allowing request through despite rate limit check failure');

      // Execute handler without rate limiting
      return await handler(request);
    }
  };
}

/**
 * Alternative: Check rate limit manually within handler
 *
 * Use this if you need more control over the rate limit logic
 *
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await checkRateLimitForRequest(request, 'AUTH_VERIFY');
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Your handler logic
 *   const response = NextResponse.json({ success: true });
 *   return rateLimitResult.addHeaders(response);
 * }
 * ```
 */
export async function checkRateLimitForRequest(
  request: NextRequest,
  limitType: RateLimitType
): Promise<{
  success: boolean;
  response?: NextResponse;
  addHeaders: (response: NextResponse) => NextResponse;
}> {
  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, limitType);

  if (!result.success) {
    logger.warn(
      `Rate limit exceeded for ${limitType} from ${identifier} (limit: ${result.limit})`
    );
    return {
      success: false,
      response: createRateLimitResponse(limitType, result.reset, result.remaining, result.limit),
      addHeaders: (r) => r, // No-op
    };
  }

  return {
    success: true,
    addHeaders: (response: NextResponse) =>
      addRateLimitHeaders(response, result.limit, result.remaining, result.reset),
  };
}
