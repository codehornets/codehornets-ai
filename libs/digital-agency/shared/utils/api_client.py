"""
Generic API client for HTTP requests.

Provides a reusable HTTP client with retry logic, rate limiting,
and error handling for external API integrations.
"""

import asyncio
from typing import Any, Dict, Optional, Union
from datetime import datetime, timedelta
from collections import defaultdict

import httpx
from pydantic import BaseModel
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from core.logger import get_logger


class APIResponse(BaseModel):
    """Represents an API response."""

    status_code: int
    data: Any
    headers: Dict[str, str]
    elapsed_seconds: float
    cached: bool = False


class APIError(Exception):
    """Custom exception for API errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response_data: Optional[Any] = None,
    ):
        """
        Initialize API error.

        Args:
            message: Error message
            status_code: HTTP status code
            response_data: Response data
        """
        self.message = message
        self.status_code = status_code
        self.response_data = response_data
        super().__init__(self.message)


class RateLimiter:
    """Simple rate limiter for API requests."""

    def __init__(self, requests_per_minute: int = 60):
        """
        Initialize rate limiter.

        Args:
            requests_per_minute: Maximum requests per minute
        """
        self.requests_per_minute = requests_per_minute
        self.requests: list[datetime] = []

    async def acquire(self) -> None:
        """Wait if necessary to respect rate limits."""
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        # Remove old requests
        self.requests = [req for req in self.requests if req > cutoff]

        # Wait if at limit
        if len(self.requests) >= self.requests_per_minute:
            oldest = self.requests[0]
            wait_time = (oldest + timedelta(minutes=1) - now).total_seconds()
            if wait_time > 0:
                await asyncio.sleep(wait_time)

        self.requests.append(now)


class APIClient:
    """
    Generic API client with retry logic and rate limiting.

    Provides methods for making HTTP requests with automatic retries,
    rate limiting, and error handling.
    """

    def __init__(
        self,
        base_url: str,
        headers: Optional[Dict[str, str]] = None,
        timeout: float = 30.0,
        rate_limit: Optional[int] = None,
        max_retries: int = 3,
    ):
        """
        Initialize API client.

        Args:
            base_url: Base URL for API
            headers: Default headers
            timeout: Request timeout in seconds
            rate_limit: Requests per minute limit
            max_retries: Maximum retry attempts
        """
        self.base_url = base_url.rstrip("/")
        self.default_headers = headers or {}
        self.timeout = timeout
        self.max_retries = max_retries

        self.logger = get_logger(f"api_client.{base_url}")
        self.rate_limiter = RateLimiter(rate_limit) if rate_limit else None

        # HTTP client
        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers=self.default_headers,
        )

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(httpx.HTTPStatusError),
    )
    async def request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = None,
    ) -> APIResponse:
        """
        Make an HTTP request.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            endpoint: API endpoint
            params: Query parameters
            data: Form data
            json: JSON payload
            headers: Request headers
            timeout: Request timeout

        Returns:
            APIResponse: Response object

        Raises:
            APIError: On request failure
        """
        # Rate limiting
        if self.rate_limiter:
            await self.rate_limiter.acquire()

        # Build URL
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        # Merge headers
        request_headers = {**self.default_headers, **(headers or {})}

        # Make request
        start_time = datetime.utcnow()

        try:
            response = await self.client.request(
                method=method,
                url=url,
                params=params,
                data=data,
                json=json,
                headers=request_headers,
                timeout=timeout or self.timeout,
            )

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            # Log request
            self.logger.debug(
                f"{method} {url} - {response.status_code} ({elapsed:.2f}s)"
            )

            # Check for errors
            response.raise_for_status()

            # Parse response
            try:
                response_data = response.json()
            except Exception:
                response_data = response.text

            return APIResponse(
                status_code=response.status_code,
                data=response_data,
                headers=dict(response.headers),
                elapsed_seconds=elapsed,
            )

        except httpx.HTTPStatusError as e:
            self.logger.error(f"HTTP error: {e.response.status_code} - {e}")
            raise APIError(
                message=str(e),
                status_code=e.response.status_code,
                response_data=e.response.text,
            )

        except httpx.TimeoutException as e:
            self.logger.error(f"Request timeout: {url}")
            raise APIError(message="Request timeout", status_code=408)

        except Exception as e:
            self.logger.error(f"Request failed: {e}")
            raise APIError(message=str(e))

    async def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> APIResponse:
        """Make a GET request."""
        return await self.request("GET", endpoint, params=params, **kwargs)

    async def post(
        self,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> APIResponse:
        """Make a POST request."""
        return await self.request("POST", endpoint, json=json, data=data, **kwargs)

    async def put(
        self,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> APIResponse:
        """Make a PUT request."""
        return await self.request("PUT", endpoint, json=json, **kwargs)

    async def patch(
        self,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None,
        **kwargs,
    ) -> APIResponse:
        """Make a PATCH request."""
        return await self.request("PATCH", endpoint, json=json, **kwargs)

    async def delete(
        self,
        endpoint: str,
        **kwargs,
    ) -> APIResponse:
        """Make a DELETE request."""
        return await self.request("DELETE", endpoint, **kwargs)
