"""
File handling utilities.

Provides utilities for reading, writing, and managing files with
support for various formats and cloud storage.
"""

import os
import json
import csv
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import aiofiles

from core.logger import get_logger


class FileType(str, Enum):
    """Supported file types."""

    JSON = "json"
    CSV = "csv"
    TEXT = "text"
    YAML = "yaml"
    XML = "xml"
    BINARY = "binary"


class FileHandler:
    """
    File handling utilities.

    Provides methods for reading and writing files with support
    for various formats.
    """

    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize file handler.

        Args:
            base_path: Base directory for file operations
        """
        self.base_path = Path(base_path) if base_path else Path.cwd()
        self.logger = get_logger("file_handler")

    def resolve_path(self, file_path: Union[str, Path]) -> Path:
        """
        Resolve file path relative to base path.

        Args:
            file_path: File path

        Returns:
            Path: Resolved absolute path
        """
        path = Path(file_path)
        if not path.is_absolute():
            path = self.base_path / path
        return path

    async def read_file(
        self,
        file_path: Union[str, Path],
        file_type: Optional[FileType] = None,
        encoding: str = "utf-8",
    ) -> Any:
        """
        Read file content.

        Args:
            file_path: Path to file
            file_type: File type (auto-detected if None)
            encoding: File encoding

        Returns:
            Any: File content
        """
        path = self.resolve_path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        # Auto-detect file type
        if file_type is None:
            file_type = self._detect_file_type(path)

        self.logger.debug(f"Reading {file_type} file: {path}")

        try:
            if file_type == FileType.JSON:
                async with aiofiles.open(path, "r", encoding=encoding) as f:
                    content = await f.read()
                    return json.loads(content)

            elif file_type == FileType.CSV:
                rows = []
                async with aiofiles.open(path, "r", encoding=encoding) as f:
                    content = await f.read()
                    reader = csv.DictReader(content.splitlines())
                    for row in reader:
                        rows.append(dict(row))
                return rows

            elif file_type == FileType.TEXT:
                async with aiofiles.open(path, "r", encoding=encoding) as f:
                    return await f.read()

            elif file_type == FileType.BINARY:
                async with aiofiles.open(path, "rb") as f:
                    return await f.read()

            else:
                async with aiofiles.open(path, "r", encoding=encoding) as f:
                    return await f.read()

        except Exception as e:
            self.logger.error(f"Failed to read file {path}: {e}")
            raise

    async def write_file(
        self,
        file_path: Union[str, Path],
        content: Any,
        file_type: Optional[FileType] = None,
        encoding: str = "utf-8",
        create_dirs: bool = True,
    ) -> Path:
        """
        Write content to file.

        Args:
            file_path: Path to file
            content: Content to write
            file_type: File type (auto-detected if None)
            encoding: File encoding
            create_dirs: Create parent directories if they don't exist

        Returns:
            Path: Path to written file
        """
        path = self.resolve_path(file_path)

        # Create directories
        if create_dirs:
            path.parent.mkdir(parents=True, exist_ok=True)

        # Auto-detect file type
        if file_type is None:
            file_type = self._detect_file_type(path)

        self.logger.debug(f"Writing {file_type} file: {path}")

        try:
            if file_type == FileType.JSON:
                async with aiofiles.open(path, "w", encoding=encoding) as f:
                    await f.write(json.dumps(content, indent=2))

            elif file_type == FileType.CSV:
                if not content:
                    raise ValueError("Cannot write empty CSV")

                # Get fieldnames from first item
                fieldnames = list(content[0].keys())

                async with aiofiles.open(path, "w", encoding=encoding, newline="") as f:
                    writer_content = []
                    writer_content.append(",".join(fieldnames))
                    for row in content:
                        writer_content.append(",".join(str(row.get(f, "")) for f in fieldnames))
                    await f.write("\n".join(writer_content))

            elif file_type == FileType.TEXT:
                async with aiofiles.open(path, "w", encoding=encoding) as f:
                    await f.write(str(content))

            elif file_type == FileType.BINARY:
                async with aiofiles.open(path, "wb") as f:
                    await f.write(content)

            else:
                async with aiofiles.open(path, "w", encoding=encoding) as f:
                    await f.write(str(content))

            self.logger.info(f"File written successfully: {path}")
            return path

        except Exception as e:
            self.logger.error(f"Failed to write file {path}: {e}")
            raise

    async def delete_file(self, file_path: Union[str, Path]) -> None:
        """
        Delete a file.

        Args:
            file_path: Path to file
        """
        path = self.resolve_path(file_path)

        if path.exists():
            path.unlink()
            self.logger.info(f"File deleted: {path}")
        else:
            self.logger.warning(f"File not found for deletion: {path}")

    def _detect_file_type(self, path: Path) -> FileType:
        """
        Detect file type from extension.

        Args:
            path: File path

        Returns:
            FileType: Detected file type
        """
        extension = path.suffix.lower()

        type_map = {
            ".json": FileType.JSON,
            ".csv": FileType.CSV,
            ".txt": FileType.TEXT,
            ".yaml": FileType.YAML,
            ".yml": FileType.YAML,
            ".xml": FileType.XML,
        }

        return type_map.get(extension, FileType.TEXT)

    async def list_files(
        self,
        directory: Optional[Union[str, Path]] = None,
        pattern: str = "*",
        recursive: bool = False,
    ) -> List[Path]:
        """
        List files in directory.

        Args:
            directory: Directory path (defaults to base_path)
            pattern: Glob pattern
            recursive: Search recursively

        Returns:
            List[Path]: List of file paths
        """
        dir_path = self.resolve_path(directory) if directory else self.base_path

        if recursive:
            files = list(dir_path.rglob(pattern))
        else:
            files = list(dir_path.glob(pattern))

        return [f for f in files if f.is_file()]


# Convenience functions

async def read_file(
    file_path: Union[str, Path],
    file_type: Optional[FileType] = None,
) -> Any:
    """
    Read file content (convenience function).

    Args:
        file_path: Path to file
        file_type: File type

    Returns:
        Any: File content
    """
    handler = FileHandler()
    return await handler.read_file(file_path, file_type)


async def save_file(
    file_path: Union[str, Path],
    content: Any,
    file_type: Optional[FileType] = None,
) -> Path:
    """
    Save content to file (convenience function).

    Args:
        file_path: Path to file
        content: Content to write
        file_type: File type

    Returns:
        Path: Path to saved file
    """
    handler = FileHandler()
    return await handler.write_file(file_path, content, file_type)
