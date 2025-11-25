"""
Shared utilities module.

Provides common utility functions for API communication, file handling,
data transformation, and validation.
"""

from .api_client import APIClient, APIResponse, APIError
from .file_handler import FileHandler, FileType, save_file, read_file
from .data_transformer import DataTransformer, transform_data, normalize_data
from .validators import (
    Validator,
    validate_email,
    validate_url,
    validate_phone,
    validate_json_schema,
)

__all__ = [
    "APIClient",
    "APIResponse",
    "APIError",
    "FileHandler",
    "FileType",
    "save_file",
    "read_file",
    "DataTransformer",
    "transform_data",
    "normalize_data",
    "Validator",
    "validate_email",
    "validate_url",
    "validate_phone",
    "validate_json_schema",
]
