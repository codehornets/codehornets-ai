"""
Rate limiting middleware for API requests.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting API requests.

    Implements a simple sliding window rate limiter.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        """
        Initialize rate limiter.

        Args:
            app: FastAPI application
            requests_per_minute: Maximum requests per minute per client
        """
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_history = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        """
        Process request and enforce rate limits.
        """
        # Get client identifier (IP address or user ID)
        client_id = self.get_client_id(request)

        # Check rate limit
        if not self.is_allowed(client_id):
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Maximum {self.requests_per_minute} requests per minute allowed"
                },
                headers={
                    "Retry-After": "60"
                }
            )

        # Record request
        self.record_request(client_id)

        # Continue processing request
        response = await call_next(request)

        # Add rate limit headers
        remaining = self.get_remaining_requests(client_id)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(self.get_reset_time())

        return response

    def get_client_id(self, request: Request) -> str:
        """
        Get unique client identifier.

        Args:
            request: HTTP request

        Returns:
            str: Client identifier
        """
        # Try to get user ID from request state (set by auth middleware)
        if hasattr(request.state, "user"):
            return request.state.user.get("user_id", "anonymous")

        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        return request.client.host if request.client else "unknown"

    def is_allowed(self, client_id: str) -> bool:
        """
        Check if client is allowed to make request.

        Args:
            client_id: Client identifier

        Returns:
            bool: True if allowed, False if rate limited
        """
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=1)

        # Clean up old requests
        self.request_history[client_id] = [
            timestamp for timestamp in self.request_history[client_id]
            if timestamp > window_start
        ]

        # Check if within rate limit
        return len(self.request_history[client_id]) < self.requests_per_minute

    def record_request(self, client_id: str):
        """
        Record a new request for client.

        Args:
            client_id: Client identifier
        """
        self.request_history[client_id].append(datetime.utcnow())

    def get_remaining_requests(self, client_id: str) -> int:
        """
        Get remaining requests for client in current window.

        Args:
            client_id: Client identifier

        Returns:
            int: Number of remaining requests
        """
        current_count = len(self.request_history[client_id])
        return max(0, self.requests_per_minute - current_count)

    def get_reset_time(self) -> int:
        """
        Get timestamp when rate limit window resets.

        Returns:
            int: Unix timestamp
        """
        reset_time = datetime.utcnow() + timedelta(minutes=1)
        return int(reset_time.timestamp())
