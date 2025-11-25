"""
Data validation utilities.

Provides validators for common data types including email, URL,
phone numbers, and JSON schema validation.
"""

import re
from typing import Any, Dict, Optional
from urllib.parse import urlparse

import jsonschema
from pydantic import BaseModel, EmailStr, HttpUrl

from core.logger import get_logger


class ValidationResult(BaseModel):
    """Result of validation."""

    is_valid: bool
    errors: list[str] = []
    normalized_value: Optional[Any] = None


class Validator:
    """
    Data validation utilities.

    Provides methods for validating common data types and formats.
    """

    def __init__(self):
        """Initialize validator."""
        self.logger = get_logger("validator")

    @staticmethod
    def validate_email(email: str) -> ValidationResult:
        """
        Validate email address.

        Args:
            email: Email address to validate

        Returns:
            ValidationResult: Validation result
        """
        if not email:
            return ValidationResult(
                is_valid=False,
                errors=["Email is required"],
            )

        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if re.match(email_pattern, email):
            return ValidationResult(
                is_valid=True,
                normalized_value=email.lower().strip(),
            )
        else:
            return ValidationResult(
                is_valid=False,
                errors=["Invalid email format"],
            )

    @staticmethod
    def validate_url(url: str) -> ValidationResult:
        """
        Validate URL.

        Args:
            url: URL to validate

        Returns:
            ValidationResult: Validation result
        """
        if not url:
            return ValidationResult(
                is_valid=False,
                errors=["URL is required"],
            )

        try:
            result = urlparse(url)
            if all([result.scheme, result.netloc]):
                return ValidationResult(
                    is_valid=True,
                    normalized_value=url.strip(),
                )
            else:
                return ValidationResult(
                    is_valid=False,
                    errors=["Invalid URL format"],
                )
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                errors=[f"URL validation failed: {str(e)}"],
            )

    @staticmethod
    def validate_phone(phone: str, country_code: str = "US") -> ValidationResult:
        """
        Validate phone number.

        Args:
            phone: Phone number to validate
            country_code: Country code (default: US)

        Returns:
            ValidationResult: Validation result
        """
        if not phone:
            return ValidationResult(
                is_valid=False,
                errors=["Phone number is required"],
            )

        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)

        # US phone number validation (10 digits)
        if country_code == "US":
            if len(digits) == 10:
                formatted = f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
                return ValidationResult(
                    is_valid=True,
                    normalized_value=formatted,
                )
            elif len(digits) == 11 and digits[0] == "1":
                # Handle +1 country code
                formatted = f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
                return ValidationResult(
                    is_valid=True,
                    normalized_value=formatted,
                )
            else:
                return ValidationResult(
                    is_valid=False,
                    errors=["Invalid US phone number (must be 10 digits)"],
                )

        # International format (basic validation)
        if len(digits) >= 7:
            return ValidationResult(
                is_valid=True,
                normalized_value=f"+{digits}",
            )

        return ValidationResult(
            is_valid=False,
            errors=["Invalid phone number format"],
        )

    @staticmethod
    def validate_json_schema(data: Any, schema: Dict[str, Any]) -> ValidationResult:
        """
        Validate data against JSON schema.

        Args:
            data: Data to validate
            schema: JSON schema

        Returns:
            ValidationResult: Validation result
        """
        try:
            jsonschema.validate(instance=data, schema=schema)
            return ValidationResult(
                is_valid=True,
                normalized_value=data,
            )
        except jsonschema.ValidationError as e:
            return ValidationResult(
                is_valid=False,
                errors=[str(e.message)],
            )
        except jsonschema.SchemaError as e:
            return ValidationResult(
                is_valid=False,
                errors=[f"Invalid schema: {str(e.message)}"],
            )

    @staticmethod
    def validate_required_fields(
        data: Dict[str, Any],
        required_fields: list[str],
    ) -> ValidationResult:
        """
        Validate that required fields are present.

        Args:
            data: Data dictionary
            required_fields: List of required field names

        Returns:
            ValidationResult: Validation result
        """
        missing_fields = [
            field for field in required_fields if field not in data or data[field] is None
        ]

        if missing_fields:
            return ValidationResult(
                is_valid=False,
                errors=[f"Missing required fields: {', '.join(missing_fields)}"],
            )

        return ValidationResult(is_valid=True, normalized_value=data)

    @staticmethod
    def validate_string_length(
        value: str,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
    ) -> ValidationResult:
        """
        Validate string length.

        Args:
            value: String value
            min_length: Minimum length
            max_length: Maximum length

        Returns:
            ValidationResult: Validation result
        """
        if not isinstance(value, str):
            return ValidationResult(
                is_valid=False,
                errors=["Value must be a string"],
            )

        length = len(value)
        errors = []

        if min_length is not None and length < min_length:
            errors.append(f"String must be at least {min_length} characters")

        if max_length is not None and length > max_length:
            errors.append(f"String must be at most {max_length} characters")

        if errors:
            return ValidationResult(is_valid=False, errors=errors)

        return ValidationResult(is_valid=True, normalized_value=value)


# Convenience functions

def validate_email(email: str) -> ValidationResult:
    """Validate email (convenience function)."""
    return Validator.validate_email(email)


def validate_url(url: str) -> ValidationResult:
    """Validate URL (convenience function)."""
    return Validator.validate_url(url)


def validate_phone(phone: str, country_code: str = "US") -> ValidationResult:
    """Validate phone number (convenience function)."""
    return Validator.validate_phone(phone, country_code)


def validate_json_schema(data: Any, schema: Dict[str, Any]) -> ValidationResult:
    """Validate JSON schema (convenience function)."""
    return Validator.validate_json_schema(data, schema)
