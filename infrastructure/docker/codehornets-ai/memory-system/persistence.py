"""
Memory Persistence System

Handles saving and loading memory systems to/from disk using
both JSON (human-readable) and pickle (efficient) formats.
"""

import json
import pickle
from pathlib import Path
from typing import Union, Any
import logging

from .episodic import EpisodicMemory
from .semantic import SemanticMemory


logger = logging.getLogger(__name__)


class MemoryPersistence:
    """Handles saving and loading memory systems."""

    @staticmethod
    def save_episodic(
        memory: EpisodicMemory,
        filepath: Union[str, Path],
        format: str = 'json'
    ) -> None:
        """
        Save episodic memory to disk.

        Args:
            memory: EpisodicMemory instance to save
            filepath: Path to save file
            format: 'json' or 'pickle'
        """
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        data = memory.to_dict()

        if format == 'json':
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        elif format == 'pickle':
            with open(filepath, 'wb') as f:
                pickle.dump(data, f)
        else:
            raise ValueError(f"Unsupported format: {format}")

        logger.info(f"Saved episodic memory to {filepath} ({format})")

    @staticmethod
    def load_episodic(
        filepath: Union[str, Path],
        format: str = 'json'
    ) -> EpisodicMemory:
        """
        Load episodic memory from disk.

        Args:
            filepath: Path to load from
            format: 'json' or 'pickle'

        Returns:
            Loaded EpisodicMemory instance
        """
        filepath = Path(filepath)

        if not filepath.exists():
            logger.warning(f"Memory file not found: {filepath}, creating new")
            return EpisodicMemory()

        if format == 'json':
            with open(filepath, 'r') as f:
                data = json.load(f)
        elif format == 'pickle':
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
        else:
            raise ValueError(f"Unsupported format: {format}")

        memory = EpisodicMemory.from_dict(data)
        logger.info(f"Loaded episodic memory from {filepath} ({len(memory)} episodes)")
        return memory

    @staticmethod
    def save_semantic(
        memory: SemanticMemory,
        filepath: Union[str, Path],
        format: str = 'json'
    ) -> None:
        """
        Save semantic memory to disk.

        Args:
            memory: SemanticMemory instance to save
            filepath: Path to save file
            format: 'json' or 'pickle'
        """
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        data = memory.to_dict()

        if format == 'json':
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        elif format == 'pickle':
            with open(filepath, 'wb') as f:
                pickle.dump(data, f)
        else:
            raise ValueError(f"Unsupported format: {format}")

        logger.info(f"Saved semantic memory to {filepath} ({format})")

    @staticmethod
    def load_semantic(
        filepath: Union[str, Path],
        format: str = 'json'
    ) -> SemanticMemory:
        """
        Load semantic memory from disk.

        Args:
            filepath: Path to load from
            format: 'json' or 'pickle'

        Returns:
            Loaded SemanticMemory instance
        """
        filepath = Path(filepath)

        if not filepath.exists():
            logger.warning(f"Memory file not found: {filepath}, creating new")
            return SemanticMemory()

        if format == 'json':
            with open(filepath, 'r') as f:
                data = json.load(f)
        elif format == 'pickle':
            with open(filepath, 'rb') as f:
                data = pickle.load(f)
        else:
            raise ValueError(f"Unsupported format: {format}")

        memory = SemanticMemory.from_dict(data)
        logger.info(f"Loaded semantic memory from {filepath}")
        return memory

    @staticmethod
    def save_all(
        episodic: EpisodicMemory,
        semantic: SemanticMemory,
        directory: Union[str, Path],
        format: str = 'json'
    ) -> None:
        """
        Save both episodic and semantic memories.

        Args:
            episodic: EpisodicMemory instance
            semantic: SemanticMemory instance
            directory: Directory to save to
            format: 'json' or 'pickle'
        """
        directory = Path(directory)
        directory.mkdir(parents=True, exist_ok=True)

        ext = 'json' if format == 'json' else 'pkl'

        MemoryPersistence.save_episodic(
            episodic,
            directory / f'episodic.{ext}',
            format
        )
        MemoryPersistence.save_semantic(
            semantic,
            directory / f'semantic.{ext}',
            format
        )

    @staticmethod
    def load_all(
        directory: Union[str, Path],
        format: str = 'json'
    ) -> tuple[EpisodicMemory, SemanticMemory]:
        """
        Load both episodic and semantic memories.

        Args:
            directory: Directory to load from
            format: 'json' or 'pickle'

        Returns:
            Tuple of (EpisodicMemory, SemanticMemory)
        """
        directory = Path(directory)
        ext = 'json' if format == 'json' else 'pkl'

        episodic = MemoryPersistence.load_episodic(
            directory / f'episodic.{ext}',
            format
        )
        semantic = MemoryPersistence.load_semantic(
            directory / f'semantic.{ext}',
            format
        )

        return episodic, semantic
