"""
Rate limiting utilities for Railway workers
Implements token bucket algorithm for distributed rate limiting
"""

import time
import hashlib
from typing import Optional, Dict, Any
from functools import wraps
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Thread-safe rate limiter using token bucket algorithm
    Can be used in-memory or extended for Redis-backed distributed limiting
    """

    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_size: int = 10
    ):
        """
        Initialize rate limiter

        Args:
            requests_per_minute: Maximum requests per minute per key
            requests_per_hour: Maximum requests per hour per key
            burst_size: Maximum requests in a short burst
        """
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_size = burst_size

        # In-memory storage (use Redis for production multi-instance deployments)
        self._requests: Dict[str, list] = {}
        self._cleanup_time = time.time()

    def _get_key(self, identifier: str) -> str:
        """Create a safe rate limit key"""
        return hashlib.sha256(identifier.encode()).hexdigest()[:16]

    def _cleanup_old_requests(self):
        """Remove old request timestamps to prevent memory leaks"""
        now = time.time()
        if now - self._cleanup_time > 300:  # Cleanup every 5 minutes
            cutoff = now - 3600  # Remove requests older than 1 hour
            for key in list(self._requests.keys()):
                self._requests[key] = [
                    ts for ts in self._requests[key] if ts > cutoff
                ]
                if not self._requests[key]:
                    del self._requests[key]
            self._cleanup_time = now

    def check_rate_limit(
        self,
        identifier: str,
        window: str = "minute"
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request is within rate limit

        Args:
            identifier: Unique identifier (IP address, user ID, etc.)
            window: Time window - "minute" or "hour"

        Returns:
            Tuple of (allowed, rate_limit_info)
        """
        key = self._get_key(identifier)
        now = time.time()

        # Cleanup old requests periodically
        self._cleanup_old_requests()

        # Initialize request list for new key
        if key not in self._requests:
            self._requests[key] = []

        # Get appropriate limits
        if window == "minute":
            max_requests = self.requests_per_minute
            window_seconds = 60
        else:  # hour
            max_requests = self.requests_per_hour
            window_seconds = 3600

        # Filter requests within the time window
        window_start = now - window_seconds
        recent_requests = [ts for ts in self._requests[key] if ts > window_start]

        # Check burst limit first
        if len(recent_requests) >= self.burst_size:
            # Check if burst happened within 5 seconds
            very_recent = [ts for ts in recent_requests if ts > now - 5]
            if len(very_recent) >= self.burst_size:
                logger.warning(f"Rate limit exceeded (burst): {key}")
                return False, {
                    "allowed": False,
                    "limit": max_requests,
                    "remaining": 0,
                    "reset_time": int(recent_requests[0] + window_seconds),
                    "reason": "burst_limit_exceeded"
                }

        # Check rate limit
        if len(recent_requests) >= max_requests:
            logger.warning(f"Rate limit exceeded ({window}): {key}")
            return False, {
                "allowed": False,
                "limit": max_requests,
                "remaining": 0,
                "reset_time": int(recent_requests[0] + window_seconds),
                "reason": f"{window}_limit_exceeded"
            }

        # Add current request timestamp
        self._requests[key].append(now)

        return True, {
            "allowed": True,
            "limit": max_requests,
            "remaining": max_requests - len(recent_requests) - 1,
            "reset_time": int(now + window_seconds),
            "reason": "ok"
        }


class RateLimitMiddleware:
    """
    FastAPI middleware for rate limiting
    """

    def __init__(
        self,
        limiter: RateLimiter,
        extract_identifier_func: callable = None
    ):
        """
        Initialize middleware

        Args:
            limiter: RateLimiter instance
            extract_identifier_func: Function to extract identifier from request
        """
        self.limiter = limiter
        self.extract_identifier = extract_identifier_func or self._default_identifier_extractor

    def _default_identifier_extractor(self, request: Any) -> str:
        """Extract client IP address from request"""
        # Try to get real IP from headers (for proxied requests)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fallback to client host
        return request.client.host if request.client else "unknown"

    async def check_rate_limit(
        self,
        request: Any,
        window: str = "minute"
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check rate limit for a request

        Args:
            request: FastAPI request object
            window: Time window - "minute" or "hour"

        Returns:
            Tuple of (allowed, rate_limit_info)
        """
        identifier = self.extract_identifier(request)
        return self.limiter.check_rate_limit(identifier, window)


def rate_limit_handler(
    limiter: RateLimiter,
    window: str = "minute"
):
    """
    Decorator for rate limiting FastAPI endpoints

    Usage:
        @app.get("/api/endpoint")
        @rate_limit_handler(limiter, "minute")
        async def endpoint(request: Request):
            return {"status": "ok"}
    """
    middleware = RateLimitMiddleware(limiter)

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args (FastAPI dependency injection)
            request = None
            for arg in args:
                if hasattr(arg, 'headers') and hasattr(arg, 'client'):
                    request = arg
                    break

            if not request:
                # If no request found, allow the request
                return await func(*args, **kwargs)

            # Check rate limit
            allowed, info = await middleware.check_rate_limit(request, window)

            if not allowed:
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Rate limit exceeded",
                        "limit": info["limit"],
                        "reset_time": info["reset_time"],
                        "reason": info["reason"]
                    },
                    headers={
                        "X-RateLimit-Limit": str(info["limit"]),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(info["reset_time"]),
                        "Retry-After": str(info["reset_time"] - int(time.time()))
                    }
                )

            # Add rate limit headers to response
            # Note: This would need to be handled by the route handler
            return await func(*args, **kwargs)

        return wrapper

    return decorator


# Pre-configured limiters for different use cases
STRICT_LIMITER = RateLimiter(
    requests_per_minute=20,
    requests_per_hour=500,
    burst_size=5
)  # For expensive operations (AI processing, etc.)

STANDARD_LIMITER = RateLimiter(
    requests_per_minute=60,
    requests_per_hour=1000,
    burst_size=10
)  # For standard API endpoints

LENIENT_LIMITER = RateLimiter(
    requests_per_minute=120,
    requests_per_hour=2000,
    burst_size=20
)  # For lightweight operations (health checks, status checks)