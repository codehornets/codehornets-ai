"""
Episodic Memory System for Memory-Powered Agents

Stores specific experiences (state, action, outcome, timestamp) and enables
retrieval of similar past episodes based on semantic similarity.
"""

import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
import hashlib


class EpisodicMemory:
    """
    Stores individual episodes/experiences with timestamp and context.
    Enables retrieval of similar past experiences for contextual decision-making.
    """

    def __init__(self, capacity: int = 100):
        """
        Initialize episodic memory with fixed capacity.

        Args:
            capacity: Maximum number of episodes to store (FIFO when exceeded)
        """
        self.capacity = capacity
        self.episodes: List[Dict[str, Any]] = []

    def store(
        self,
        state: str,
        action: str,
        outcome: str,
        timestamp: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Store a new episode in memory.

        Args:
            state: Description of the state/context
            action: Action taken
            outcome: Result of the action
            timestamp: ISO format timestamp (auto-generated if None)
            metadata: Additional context (worker, task_id, etc.)
        """
        if timestamp is None:
            timestamp = datetime.now().isoformat()

        episode = {
            'state': state,
            'action': action,
            'outcome': outcome,
            'timestamp': timestamp,
            'embedding': self._embed(state, action, outcome),
            'metadata': metadata or {}
        }

        self.episodes.append(episode)

        # Maintain capacity limit (FIFO)
        if len(self.episodes) > self.capacity:
            self.episodes.pop(0)

    def _embed(self, state: str, action: str, outcome: str) -> int:
        """
        Create simple embedding for similarity matching.
        Uses hash-based approach for speed (can be upgraded to vector embeddings).

        Args:
            state: State description
            action: Action description
            outcome: Outcome description

        Returns:
            Integer embedding (hash value)
        """
        text = f"{state} {action} {outcome}".lower()
        # Use consistent hash for reproducibility
        hash_obj = hashlib.md5(text.encode())
        return int(hash_obj.hexdigest(), 16) % 100000

    def retrieve_similar(
        self,
        query_state: str,
        k: int = 3,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve k most similar episodes to the query state.

        Args:
            query_state: State to find similar episodes for
            k: Number of similar episodes to return
            filter_metadata: Optional metadata filters (e.g., {'worker': 'marie'})

        Returns:
            List of k most similar episodes
        """
        if not self.episodes:
            return []

        # Apply metadata filter if provided
        episodes = self.episodes
        if filter_metadata:
            episodes = [
                ep for ep in episodes
                if all(ep['metadata'].get(k) == v for k, v in filter_metadata.items())
            ]

        if not episodes:
            return []

        query_emb = self._embed(query_state, "", "")

        # Calculate similarity scores (lower distance = more similar)
        scores = [
            (abs(ep['embedding'] - query_emb), ep)
            for ep in episodes
        ]

        # Sort by similarity and return top k
        scores.sort(key=lambda x: x[0])
        return [ep for _, ep in scores[:k]]

    def get_recent(self, n: int = 5) -> List[Dict[str, Any]]:
        """
        Get n most recent episodes.

        Args:
            n: Number of recent episodes to return

        Returns:
            List of n most recent episodes
        """
        return self.episodes[-n:] if len(self.episodes) >= n else self.episodes

    def search_by_action(self, action: str) -> List[Dict[str, Any]]:
        """
        Find all episodes where a specific action was taken.

        Args:
            action: Action to search for

        Returns:
            List of matching episodes
        """
        return [
            ep for ep in self.episodes
            if action.lower() in ep['action'].lower()
        ]

    def search_by_metadata(self, **kwargs) -> List[Dict[str, Any]]:
        """
        Search episodes by metadata fields.

        Args:
            **kwargs: Metadata key-value pairs to match

        Returns:
            List of matching episodes
        """
        return [
            ep for ep in self.episodes
            if all(ep['metadata'].get(k) == v for k, v in kwargs.items())
        ]

    def count(self) -> int:
        """Return total number of stored episodes."""
        return len(self.episodes)

    def clear(self) -> None:
        """Clear all stored episodes."""
        self.episodes.clear()

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize memory to dictionary for persistence.

        Returns:
            Dictionary representation of memory
        """
        return {
            'capacity': self.capacity,
            'episodes': self.episodes
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'EpisodicMemory':
        """
        Deserialize memory from dictionary.

        Args:
            data: Dictionary representation

        Returns:
            EpisodicMemory instance
        """
        memory = cls(capacity=data['capacity'])
        memory.episodes = data['episodes']
        return memory

    def __len__(self) -> int:
        """Return number of stored episodes."""
        return len(self.episodes)

    def __repr__(self) -> str:
        """String representation of memory."""
        return f"EpisodicMemory(capacity={self.capacity}, stored={len(self.episodes)})"
