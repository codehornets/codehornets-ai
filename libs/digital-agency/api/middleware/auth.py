"""
Authentication middleware for API requests.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
import os
from datetime import datetime
from typing import List, Optional
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ISSUER = os.getenv("JWT_ISSUER", "ornomedia-api")
AUDIENCE = os.getenv("JWT_AUDIENCE", "ornomedia-clients")


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware for authenticating API requests.
    """

    # Public paths that don't require authentication
    PUBLIC_PATHS = [
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/v1/health",
        "/api/v1/health/detailed",
        "/api/v1/ready",
        "/api/v1/live"
    ]

    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate authentication.
        """
        # Skip authentication for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        # Skip authentication for OPTIONS requests (CORS)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Get authorization header
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            logger.warning(f"Missing authorization header for {request.url.path}")
            return JSONResponse(
                status_code=401,
                content={"error": "Missing authorization header"}
            )

        # Validate token format
        if not auth_header.startswith("Bearer "):
            logger.warning(f"Invalid authorization format for {request.url.path}")
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid authorization format"}
            )

        token = auth_header[7:]  # Remove "Bearer " prefix

        # Validate token
        if not self.validate_token(token):
            logger.warning(f"Invalid token for {request.url.path}")
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid or expired token"}
            )

        # Add user context to request state
        request.state.user = self.get_user_from_token(token)

        # Continue processing request
        response = await call_next(request)
        return response

    def validate_token(self, token: str) -> bool:
        """
        Validate authentication token.

        Args:
            token: Bearer token

        Returns:
            bool: True if valid, False otherwise
        """
        try:
            # Decode and verify JWT token
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                issuer=ISSUER,
                audience=AUDIENCE,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_iss": True,
                    "verify_aud": True,
                }
            )

            # Validate required claims
            required_claims = ["user_id", "exp", "iat"]
            for claim in required_claims:
                if claim not in payload:
                    logger.warning(f"Missing required claim: {claim}")
                    return False

            # Additional validation: check if token is not expired (double-check)
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                exp_datetime = datetime.fromtimestamp(exp_timestamp)
                if exp_datetime < datetime.utcnow():
                    logger.warning("Token has expired")
                    return False

            return True

        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return False
        except jwt.JWTClaimsError as e:
            logger.warning(f"Invalid claims: {str(e)}")
            return False
        except JWTError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return False

    def get_user_from_token(self, token: str) -> dict:
        """
        Extract user information from token.

        Args:
            token: Validated bearer token

        Returns:
            dict: User information
        """
        try:
            # Decode JWT payload (no verification needed as token is already validated)
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                options={"verify_signature": False}  # Already verified in validate_token
            )

            # Extract user claims
            user_id = payload.get("user_id")
            username = payload.get("username", "unknown")
            email = payload.get("email", "")
            roles = payload.get("roles", [])

            # Build user object with permissions
            user_data = {
                "user_id": user_id,
                "username": username,
                "email": email,
                "roles": roles,
                "permissions": self._get_user_permissions(user_id)
            }

            logger.info(f"User authenticated: {user_id} ({email})")
            return user_data

        except Exception as e:
            logger.error(f"Error extracting user from token: {str(e)}")
            # Return minimal user data on error
            return {
                "user_id": "unknown",
                "username": "unknown",
                "email": "",
                "roles": [],
                "permissions": []
            }

    def _get_user_permissions(self, user_id: str) -> List[str]:
        """
        Get user permissions from database or cache.

        Args:
            user_id: User identifier

        Returns:
            List[str]: List of permissions

        TODO: Implement database query to fetch actual user permissions
        For now, returns default permissions based on roles.
        """
        # Default permissions for all authenticated users
        default_permissions = ["read", "write"]

        # TODO: Replace with actual database query
        # Example:
        # user = await db.query(User).filter(User.id == user_id).first()
        # return user.permissions if user else default_permissions

        return default_permissions
