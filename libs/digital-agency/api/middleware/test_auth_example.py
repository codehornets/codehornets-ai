"""
Example test file for JWT authentication middleware.

This demonstrates how to test the AuthMiddleware with various JWT scenarios.
Run with: pytest api/middleware/test_auth_example.py -v
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
import os

# Sample JWT configuration for testing
TEST_SECRET_KEY = "test-secret-key-for-jwt-testing"
TEST_ALGORITHM = "HS256"
TEST_ISSUER = "ornomedia-api"
TEST_AUDIENCE = "ornomedia-clients"


def create_test_token(
    user_id: str = "test_user_123",
    username: str = "testuser",
    email: str = "test@example.com",
    roles: list = None,
    expires_delta: timedelta = None,
    include_required_claims: bool = True
) -> str:
    """
    Create a test JWT token with specified claims.

    Args:
        user_id: User identifier
        username: Username
        email: User email
        roles: List of user roles
        expires_delta: Token expiration delta (default: 30 minutes)
        include_required_claims: Whether to include required claims

    Returns:
        str: JWT token
    """
    if roles is None:
        roles = ["user"]

    if expires_delta is None:
        expires_delta = timedelta(minutes=30)

    now = datetime.utcnow()
    expire = now + expires_delta

    payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "roles": roles,
        "iat": now,
        "exp": expire,
        "iss": TEST_ISSUER,
        "aud": TEST_AUDIENCE,
    }

    if not include_required_claims:
        # Remove required claims for testing validation
        payload.pop("user_id", None)

    token = jwt.encode(payload, TEST_SECRET_KEY, algorithm=TEST_ALGORITHM)
    return token


class TestJWTAuthentication:
    """Test cases for JWT authentication."""

    def test_valid_token_should_authenticate(self):
        """Test that a valid JWT token is accepted."""
        # Arrange
        token = create_test_token()

        # Act - In actual test, you would call the middleware
        # from auth import AuthMiddleware
        # middleware = AuthMiddleware()
        # result = middleware.validate_token(token)

        # Assert
        # assert result is True
        print(f"Valid token created: {token[:50]}...")

    def test_expired_token_should_reject(self):
        """Test that an expired JWT token is rejected."""
        # Arrange - Create token that expired 1 hour ago
        token = create_test_token(
            expires_delta=timedelta(hours=-1)
        )

        # Act & Assert
        # result = middleware.validate_token(token)
        # assert result is False
        print(f"Expired token created: {token[:50]}...")

    def test_invalid_signature_should_reject(self):
        """Test that a token with invalid signature is rejected."""
        # Arrange - Create token with different secret
        payload = {
            "user_id": "test_user",
            "exp": datetime.utcnow() + timedelta(minutes=30),
            "iat": datetime.utcnow(),
            "iss": TEST_ISSUER,
            "aud": TEST_AUDIENCE,
        }
        token = jwt.encode(payload, "wrong-secret-key", algorithm=TEST_ALGORITHM)

        # Act & Assert
        # result = middleware.validate_token(token)
        # assert result is False
        print(f"Invalid signature token: {token[:50]}...")

    def test_missing_required_claims_should_reject(self):
        """Test that a token missing required claims is rejected."""
        # Arrange
        token = create_test_token(include_required_claims=False)

        # Act & Assert
        # result = middleware.validate_token(token)
        # assert result is False
        print(f"Token missing claims: {token[:50]}...")

    def test_extract_user_from_valid_token(self):
        """Test extracting user information from valid token."""
        # Arrange
        token = create_test_token(
            user_id="user_456",
            username="johndoe",
            email="john@example.com",
            roles=["admin", "user"]
        )

        # Act - In actual test, you would call the middleware
        # user = middleware.get_user_from_token(token)

        # Assert
        # assert user["user_id"] == "user_456"
        # assert user["username"] == "johndoe"
        # assert user["email"] == "john@example.com"
        # assert "admin" in user["roles"]
        # assert "read" in user["permissions"]
        print(f"User extraction token: {token[:50]}...")

    def test_malformed_token_should_reject(self):
        """Test that a malformed token is rejected."""
        # Arrange
        malformed_tokens = [
            "not.a.jwt.token",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp",  # Truncated
            "completely-invalid-string",
            "",
        ]

        # Act & Assert
        for token in malformed_tokens:
            # result = middleware.validate_token(token)
            # assert result is False
            print(f"Malformed token: {token}")


class TestIntegrationWithFastAPI:
    """Integration tests with FastAPI request/response cycle."""

    def test_public_paths_skip_authentication(self):
        """Test that public paths don't require authentication."""
        public_paths = [
            "/",
            "/docs",
            "/api/v1/health",
        ]

        # In actual test with FastAPI TestClient:
        # from fastapi.testclient import TestClient
        # client = TestClient(app)
        # for path in public_paths:
        #     response = client.get(path)
        #     assert response.status_code != 401

        print(f"Public paths to test: {public_paths}")

    def test_protected_endpoint_without_token_returns_401(self):
        """Test that protected endpoints return 401 without token."""
        # In actual test:
        # response = client.get("/api/v1/protected-resource")
        # assert response.status_code == 401
        # assert "Missing authorization header" in response.json()["error"]

        print("Would test protected endpoint without token")

    def test_protected_endpoint_with_valid_token_succeeds(self):
        """Test that protected endpoints work with valid token."""
        # In actual test:
        # token = create_test_token()
        # headers = {"Authorization": f"Bearer {token}"}
        # response = client.get("/api/v1/protected-resource", headers=headers)
        # assert response.status_code == 200

        print("Would test protected endpoint with valid token")

    def test_user_context_available_in_request_state(self):
        """Test that user context is added to request.state."""
        # In actual test within endpoint:
        # @app.get("/api/v1/me")
        # async def get_current_user(request: Request):
        #     return request.state.user
        #
        # token = create_test_token()
        # headers = {"Authorization": f"Bearer {token}"}
        # response = client.get("/api/v1/me", headers=headers)
        # assert response.json()["user_id"] == "test_user_123"

        print("Would test user context in request state")


# Example: How to generate a valid token for manual testing
if __name__ == "__main__":
    print("\n" + "="*80)
    print("JWT AUTHENTICATION TEST TOKEN GENERATOR")
    print("="*80 + "\n")

    # Generate a valid token
    print("1. Valid Token (expires in 30 minutes):")
    valid_token = create_test_token()
    print(f"   {valid_token}\n")

    # Decode and display payload
    payload = jwt.decode(
        valid_token,
        TEST_SECRET_KEY,
        algorithms=[TEST_ALGORITHM],
        options={"verify_signature": False}
    )
    print("   Payload:")
    for key, value in payload.items():
        print(f"   - {key}: {value}")

    print("\n2. Admin Token:")
    admin_token = create_test_token(
        user_id="admin_001",
        username="admin",
        email="admin@example.com",
        roles=["admin", "user"]
    )
    print(f"   {admin_token}\n")

    print("\n3. Expired Token (for testing expiration):")
    expired_token = create_test_token(expires_delta=timedelta(hours=-1))
    print(f"   {expired_token}\n")

    print("\n" + "="*80)
    print("TESTING INSTRUCTIONS")
    print("="*80)
    print("""
To test the JWT authentication:

1. Set environment variables:
   export JWT_SECRET_KEY="test-secret-key-for-jwt-testing"
   export JWT_ISSUER="ornomedia-api"
   export JWT_AUDIENCE="ornomedia-clients"

2. Use curl to test endpoints:

   # Test public endpoint (should work without token):
   curl http://localhost:8000/api/v1/health

   # Test protected endpoint without token (should return 401):
   curl http://localhost:8000/api/v1/protected-resource

   # Test protected endpoint with valid token (should work):
   curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
        http://localhost:8000/api/v1/protected-resource

3. Run pytest tests:
   pytest api/middleware/test_auth_example.py -v

4. Check logs for authentication events:
   tail -f /var/log/digital-agency/app.log | grep -i "auth\|token"
""")
    print("="*80 + "\n")
