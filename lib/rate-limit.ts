import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logger } from './logger';

/**
 * Rate Limit Configuration
 *
 * Defines limits for different endpoint types
 */
export const RATE_LIMITS = {
  // Critical: Primary brute force target
  AUTH_VERIFY: {
    requests: 5,
    window: '15 m', // 15 minutes
    description: 'Access code verification',
  },
  // High: Note submission
  NOTE_SUBMIT: {
    requests: 10,
    window: '1 m', // 1 minute
    description: 'Note submission',
  },
  // Medium: Admin note viewing
  NOTE_VIEW: {
    requests: 20,
    window: '1 m', // 1 minute
    description: 'Note viewing (admin)',
  },
  // Medium: Resource-intensive PDF generation
  CLOUD_PRINT: {
    requests: 3,
    window: '1 h', // 1 hour
    description: 'PDF generation',
  },
  // Low: Config check
  CLOUD_PRINT_CONFIG: {
    requests: 10,
    window: '1 m', // 1 minute
    description: 'Cloud print config check',
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Result from rate limit check
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in milliseconds
  pending?: Promise<unknown>;
}

/**
 * In-memory rate limiter for development and fallback
 *
 * Uses Map to track requests per identifier
 * Includes automatic cleanup to prevent memory leaks
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.requests.entries()) {
      if (value.resetAt <= now) {
        this.requests.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  async limit(identifier: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const key = identifier;
    const existing = this.requests.get(key);

    // If no existing record or window expired, start fresh
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.requests.set(key, { count: 1, resetAt });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetAt,
      };
    }

    // Within window, check if limit exceeded
    if (existing.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: existing.resetAt,
      };
    }

    // Increment count
    existing.count++;
    this.requests.set(key, existing);

    return {
      success: true,
      limit,
      remaining: limit - existing.count,
      reset: existing.resetAt,
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * Parse window string (e.g., "15 m", "1 h") to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*([smhd])$/);
  if (!match) {
    throw new Error(`Invalid window format: ${window}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Redis-based rate limiter for production
 */
class RedisRateLimiter {
  private limiters: Map<string, Ratelimit> = new Map();
  private redis: Redis;

  constructor(redisUrl: string, redisToken: string) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  }

  private getLimiter(type: RateLimitType): Ratelimit {
    const cached = this.limiters.get(type);
    if (cached) return cached;

    const config = RATE_LIMITS[type];
    const windowMs = parseWindow(config.window);

    const limiter = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(config.requests, `${windowMs} ms`),
      analytics: true,
      prefix: `ratelimit:${type}`,
    });

    this.limiters.set(type, limiter);
    return limiter;
  }

  async limit(identifier: string, type: RateLimitType): Promise<RateLimitResult> {
    const limiter = this.getLimiter(type);
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      pending: result.pending,
    };
  }
}

/**
 * Singleton instances
 */
let inMemoryLimiter: InMemoryRateLimiter | null = null;
let redisLimiter: RedisRateLimiter | null = null;
let limiterMode: 'redis' | 'memory' | null = null;

/**
 * Initialize and get rate limiter
 *
 * Attempts to use Redis in production, falls back to in-memory
 */
function getRateLimiter(): { mode: 'redis' | 'memory'; limiter: RedisRateLimiter | InMemoryRateLimiter } {
  // Return cached instance if available
  if (limiterMode === 'redis' && redisLimiter) {
    return { mode: 'redis', limiter: redisLimiter };
  }
  if (limiterMode === 'memory' && inMemoryLimiter) {
    return { mode: 'memory', limiter: inMemoryLimiter };
  }

  // Try to initialize Redis if credentials available
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      redisLimiter = new RedisRateLimiter(redisUrl, redisToken);
      limiterMode = 'redis';
      logger.info('✅ Rate limiting: Using Upstash Redis (production mode)');
      return { mode: 'redis', limiter: redisLimiter };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`⚠️  Failed to initialize Redis rate limiter: ${message}`);
      logger.warn('Falling back to in-memory rate limiting');
    }
  } else {
    logger.info('📝 Rate limiting: Using in-memory limiter (development mode)');
  }

  // Fall back to in-memory
  if (!inMemoryLimiter) {
    inMemoryLimiter = new InMemoryRateLimiter();
  }
  limiterMode = 'memory';
  return { mode: 'memory', limiter: inMemoryLimiter };
}

/**
 * Check rate limit for a given identifier and limit type
 *
 * @param identifier - Unique identifier (usually IP address)
 * @param type - Type of rate limit to apply
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const { mode, limiter } = getRateLimiter();

  if (mode === 'redis') {
    return await (limiter as RedisRateLimiter).limit(identifier, type);
  } else {
    const config = RATE_LIMITS[type];
    const windowMs = parseWindow(config.window);
    const key = `${type}:${identifier}`;
    return await (limiter as InMemoryRateLimiter).limit(key, config.requests, windowMs);
  }
}

/**
 * Get human-readable time until reset
 */
export function getResetTime(resetTimestamp: number): string {
  const now = Date.now();
  const diff = resetTimestamp - now;

  if (diff <= 0) return 'now';

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

/**
 * Cleanup function for tests and graceful shutdown
 */
export function destroyRateLimiter() {
  if (inMemoryLimiter) {
    inMemoryLimiter.destroy();
    inMemoryLimiter = null;
  }
  redisLimiter = null;
  limiterMode = null;
}
