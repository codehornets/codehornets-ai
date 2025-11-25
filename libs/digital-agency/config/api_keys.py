"""
API key management with encryption and secure storage.

Provides utilities for managing, encrypting, and rotating API keys
used by various integrations and services.
"""

import base64
import os
from typing import Dict, Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from functools import lru_cache

from .settings import get_settings


class APIKeyManager:
    """
    Manages API keys with encryption and secure storage.

    Provides methods to encrypt, decrypt, store, and retrieve API keys
    for various third-party integrations.
    """

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize API key manager.

        Args:
            encryption_key: Base64-encoded encryption key. If None, uses settings.
        """
        settings = get_settings()
        self.encryption_key = encryption_key or settings.encryption_key
        self._cipher = self._initialize_cipher()
        self._keys_cache: Dict[str, str] = {}

    def _initialize_cipher(self) -> Fernet:
        """
        Initialize Fernet cipher for encryption/decryption.

        Returns:
            Fernet: Initialized cipher instance
        """
        try:
            # If key is already base64-encoded Fernet key
            return Fernet(self.encryption_key.encode())
        except Exception:
            # Derive key from password using PBKDF2
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"digital-agency-salt",  # In production, use unique salt per installation
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.encryption_key.encode()))
            return Fernet(key)

    def encrypt_key(self, api_key: str) -> str:
        """
        Encrypt an API key.

        Args:
            api_key: Plain text API key

        Returns:
            str: Base64-encoded encrypted API key
        """
        encrypted = self._cipher.encrypt(api_key.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt_key(self, encrypted_key: str) -> str:
        """
        Decrypt an encrypted API key.

        Args:
            encrypted_key: Base64-encoded encrypted API key

        Returns:
            str: Plain text API key
        """
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
        decrypted = self._cipher.decrypt(encrypted_bytes)
        return decrypted.decode()

    def get_key(self, service_name: str) -> Optional[str]:
        """
        Get API key for a specific service.

        Args:
            service_name: Name of the service (e.g., 'anthropic', 'hubspot')

        Returns:
            Optional[str]: API key if available, None otherwise
        """
        # Check cache first
        if service_name in self._keys_cache:
            return self._keys_cache[service_name]

        # Load from settings
        settings = get_settings()
        key_mapping = {
            "anthropic": settings.anthropic_api_key,
            "hubspot": settings.hubspot_api_key,
            "google": settings.google_api_key,
            "sendgrid": settings.sendgrid_api_key,
            "slack": settings.slack_bot_token,
        }

        key = key_mapping.get(service_name)
        if key:
            self._keys_cache[service_name] = key
        return key

    def set_key(self, service_name: str, api_key: str, encrypt: bool = False) -> None:
        """
        Set API key for a specific service.

        Args:
            service_name: Name of the service
            api_key: API key to store
            encrypt: Whether to encrypt the key before storage
        """
        if encrypt:
            api_key = self.encrypt_key(api_key)
        self._keys_cache[service_name] = api_key

    def rotate_key(
        self, service_name: str, new_key: str, encrypt: bool = False
    ) -> None:
        """
        Rotate API key for a service.

        Args:
            service_name: Name of the service
            new_key: New API key
            encrypt: Whether to encrypt the new key
        """
        old_key = self.get_key(service_name)
        if old_key:
            # Log rotation for audit trail
            print(f"Rotating API key for service: {service_name}")

        self.set_key(service_name, new_key, encrypt=encrypt)

    def validate_key(self, service_name: str) -> bool:
        """
        Validate that an API key exists for a service.

        Args:
            service_name: Name of the service

        Returns:
            bool: True if key exists and is non-empty
        """
        key = self.get_key(service_name)
        return key is not None and len(key) > 0

    def get_all_configured_services(self) -> list[str]:
        """
        Get list of all services with configured API keys.

        Returns:
            list[str]: List of service names
        """
        settings = get_settings()
        configured = []

        service_checks = {
            "anthropic": settings.anthropic_api_key,
            "hubspot": settings.hubspot_api_key,
            "google": settings.google_api_key,
            "sendgrid": settings.sendgrid_api_key,
            "slack": settings.slack_bot_token,
        }

        for service, key in service_checks.items():
            if key:
                configured.append(service)

        return configured

    def mask_key(self, api_key: str, visible_chars: int = 4) -> str:
        """
        Mask an API key for safe logging/display.

        Args:
            api_key: API key to mask
            visible_chars: Number of characters to show at the end

        Returns:
            str: Masked API key (e.g., '****abcd')
        """
        if not api_key or len(api_key) <= visible_chars:
            return "****"

        return "*" * (len(api_key) - visible_chars) + api_key[-visible_chars:]

    @staticmethod
    def generate_encryption_key() -> str:
        """
        Generate a new Fernet encryption key.

        Returns:
            str: Base64-encoded encryption key
        """
        return Fernet.generate_key().decode()


@lru_cache()
def get_api_key_manager() -> APIKeyManager:
    """
    Get cached API key manager instance.

    Returns:
        APIKeyManager: Singleton instance
    """
    return APIKeyManager()
