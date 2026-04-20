/**
 * Rate limiting utilities for Supabase Edge Functions
 * Implements in-memory rate limiting using token bucket algorithm
 */

interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  reason: string;
}

interface RateLimitStore {
  [key: string]: number[];
}

export class RateLimiter {
  private requests: RateLimitStore = {};
  private lastCleanup = Date.now();
  private cleanupInterval = 300000; // 5 minutes

  constructor(
    private requestsPerMinute = 60,
    private requestsPerHour = 1000,
    private burstSize = 10
  ) {}

  private getKey(identifier: string): string {
    // Create a simple hash-like key (not cryptographically secure, but sufficient for rate limiting)
    return identifier.substring(0, 32);
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      const cutoff = now - 3600000; // Remove requests older than 1 hour

      for (const key in this.requests) {
        this.requests[key] = this.requests[key].filter(ts => ts > cutoff);
        if (this.requests[key].length === 0) {
          delete this.requests[key];
        }
      }

      this.lastCleanup = now;
    }
  }

  checkRateLimit(identifier: string, window: 'minute' | 'hour' = 'minute'): RateLimitInfo {
    const key = this.getKey(identifier);
    const now = Date.now();

    // Initialize request list for new key
    if (!this.requests[key]) {
      this.requests[key] = [];
    }

    // Cleanup old requests periodically
    this.cleanupOldRequests();

    // Get appropriate limits
    const maxRequests = window === 'minute' ? this.requestsPerMinute : this.requestsPerHour;
    const windowMs = window === 'minute' ? 60000 : 3600000;

    // Filter requests within the time window
    const windowStart = now - windowMs;
    const recentRequests = this.requests[key].filter(ts => ts > windowStart);

    // Check burst limit first
    if (recentRequests.length >= this.burstSize) {
      const veryRecent = recentRequests.filter(ts => ts > now - 5000);
      if (veryRecent.length >= this.burstSize) {
        return {
          allowed: false,
          limit: maxRequests,
          remaining: 0,
          resetTime: recentRequests[0] + windowMs,
          reason: 'burst_limit_exceeded'
        };
      }
    }

    // Check rate limit
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: recentRequests[0] + windowMs,
        reason: `${window}_limit_exceeded`
      };
    }

    // Add current request timestamp
    this.requests[key].push(now);

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - recentRequests.length - 1,
      resetTime: now + windowMs,
      reason: 'ok'
    };
  }
}

// Pre-configured limiters for different use cases
export const STRICT_LIMITER = new RateLimiter(20, 500, 5); // For expensive operations
export const STANDARD_LIMITER = new RateLimiter(60, 1000, 10); // For standard API endpoints
export const LENIENT_LIMITER = new RateLimiter(120, 2000, 20); // For lightweight operations

/**
 * Extract client IP address from request headers
 */
export function extractClientIp(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('X-Real-IP');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier (Edge Functions don't always expose client IP)
  return 'unknown';
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(limitInfo: RateLimitInfo): Headers {
  const headers = new Headers();
  headers.append('X-RateLimit-Limit', limitInfo.limit.toString());
  headers.append('X-RateLimit-Remaining', limitInfo.remaining.toString());
  headers.append('X-RateLimit-Reset', limitInfo.resetTime.toString());
  headers.append('Retry-After', Math.ceil((limitInfo.resetTime - Date.now()) / 1000).toString());
  return headers;
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(limitInfo: RateLimitInfo): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      limit: limitInfo.limit,
      resetTime: limitInfo.resetTime,
      reason: limitInfo.reason
    }),
    {
      status: 429,
      headers: {
        ...Object.fromEntries(createRateLimitHeaders(limitInfo)),
        'Content-Type': 'application/json'
      }
    }
  );
}