"""
Data transformation utilities.

Provides utilities for transforming, normalizing, and validating data
between different formats and schemas.
"""

from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
import re

from core.logger import get_logger


class DataTransformer:
    """
    Data transformation utilities.

    Provides methods for transforming data between formats,
    normalizing values, and applying custom transformations.
    """

    def __init__(self):
        """Initialize data transformer."""
        self.logger = get_logger("data_transformer")

    def transform(
        self,
        data: Any,
        schema: Dict[str, Any],
        strict: bool = False,
    ) -> Dict[str, Any]:
        """
        Transform data according to schema.

        Args:
            data: Input data
            schema: Transformation schema
            strict: Raise error on missing fields

        Returns:
            Dict: Transformed data
        """
        if not isinstance(data, dict):
            raise ValueError("Input data must be a dictionary")

        result = {}

        for field, config in schema.items():
            if isinstance(config, str):
                # Simple field mapping
                source_field = config
                if source_field in data:
                    result[field] = data[source_field]
                elif strict:
                    raise KeyError(f"Required field not found: {source_field}")

            elif isinstance(config, dict):
                # Complex transformation
                source = config.get("source")
                transform_func = config.get("transform")
                default = config.get("default")
                required = config.get("required", False)

                # Get source value
                value = self._get_nested_value(data, source) if source else None

                # Apply transformation
                if transform_func and callable(transform_func):
                    try:
                        value = transform_func(value)
                    except Exception as e:
                        self.logger.warning(f"Transformation failed for {field}: {e}")
                        value = default

                # Handle missing values
                if value is None:
                    if required and strict:
                        raise KeyError(f"Required field not found: {field}")
                    value = default

                result[field] = value

        return result

    def normalize(
        self,
        data: Dict[str, Any],
        normalization_rules: Dict[str, str],
    ) -> Dict[str, Any]:
        """
        Normalize data values.

        Args:
            data: Input data
            normalization_rules: Rules for normalization

        Returns:
            Dict: Normalized data
        """
        result = {}

        for field, value in data.items():
            rule = normalization_rules.get(field, "none")

            if rule == "lowercase":
                result[field] = str(value).lower() if value else value
            elif rule == "uppercase":
                result[field] = str(value).upper() if value else value
            elif rule == "title":
                result[field] = str(value).title() if value else value
            elif rule == "strip":
                result[field] = str(value).strip() if value else value
            elif rule == "email":
                result[field] = self._normalize_email(value)
            elif rule == "phone":
                result[field] = self._normalize_phone(value)
            elif rule == "url":
                result[field] = self._normalize_url(value)
            else:
                result[field] = value

        return result

    def flatten(
        self,
        data: Dict[str, Any],
        parent_key: str = "",
        separator: str = ".",
    ) -> Dict[str, Any]:
        """
        Flatten nested dictionary.

        Args:
            data: Nested dictionary
            parent_key: Parent key prefix
            separator: Key separator

        Returns:
            Dict: Flattened dictionary
        """
        items = []

        for key, value in data.items():
            new_key = f"{parent_key}{separator}{key}" if parent_key else key

            if isinstance(value, dict):
                items.extend(
                    self.flatten(value, new_key, separator=separator).items()
                )
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict):
                        items.extend(
                            self.flatten(
                                item, f"{new_key}[{i}]", separator=separator
                            ).items()
                        )
                    else:
                        items.append((f"{new_key}[{i}]", item))
            else:
                items.append((new_key, value))

        return dict(items)

    def unflatten(
        self,
        data: Dict[str, Any],
        separator: str = ".",
    ) -> Dict[str, Any]:
        """
        Unflatten dictionary to nested structure.

        Args:
            data: Flattened dictionary
            separator: Key separator

        Returns:
            Dict: Nested dictionary
        """
        result = {}

        for key, value in data.items():
            parts = key.split(separator)
            current = result

            for part in parts[:-1]:
                # Handle array notation
                if "[" in part:
                    base_key, index = part.split("[")
                    index = int(index.rstrip("]"))

                    if base_key not in current:
                        current[base_key] = []

                    while len(current[base_key]) <= index:
                        current[base_key].append({})

                    current = current[base_key][index]
                else:
                    if part not in current:
                        current[part] = {}
                    current = current[part]

            # Set final value
            final_key = parts[-1]
            if "[" in final_key:
                base_key, index = final_key.split("[")
                index = int(index.rstrip("]"))

                if base_key not in current:
                    current[base_key] = []

                while len(current[base_key]) <= index:
                    current[base_key].append(None)

                current[base_key][index] = value
            else:
                current[final_key] = value

        return result

    def _get_nested_value(
        self,
        data: Dict[str, Any],
        path: str,
        separator: str = ".",
    ) -> Any:
        """Get value from nested dictionary using dot notation."""
        keys = path.split(separator)
        value = data

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None

        return value

    def _normalize_email(self, email: Optional[str]) -> Optional[str]:
        """Normalize email address."""
        if not email:
            return None
        return email.lower().strip()

    def _normalize_phone(self, phone: Optional[str]) -> Optional[str]:
        """Normalize phone number."""
        if not phone:
            return None
        # Remove all non-digit characters
        return re.sub(r'\D', '', str(phone))

    def _normalize_url(self, url: Optional[str]) -> Optional[str]:
        """Normalize URL."""
        if not url:
            return None

        url = url.strip()

        # Add protocol if missing
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        return url.lower()


# Convenience functions

def transform_data(
    data: Any,
    schema: Dict[str, Any],
    strict: bool = False,
) -> Dict[str, Any]:
    """
    Transform data according to schema (convenience function).

    Args:
        data: Input data
        schema: Transformation schema
        strict: Raise error on missing fields

    Returns:
        Dict: Transformed data
    """
    transformer = DataTransformer()
    return transformer.transform(data, schema, strict)


def normalize_data(
    data: Dict[str, Any],
    normalization_rules: Dict[str, str],
) -> Dict[str, Any]:
    """
    Normalize data values (convenience function).

    Args:
        data: Input data
        normalization_rules: Rules for normalization

    Returns:
        Dict: Normalized data
    """
    transformer = DataTransformer()
    return transformer.normalize(data, normalization_rules)
