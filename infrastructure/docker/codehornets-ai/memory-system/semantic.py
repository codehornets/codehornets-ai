"""
Semantic Memory System for Memory-Powered Agents

Generalizes patterns and preferences from multiple experiences.
Tracks success rates, learns optimal strategies, and maintains user preferences.
"""

from collections import defaultdict
from typing import Dict, List, Tuple, Any, Optional


class SemanticMemory:
    """
    Stores generalized knowledge, patterns, and preferences.
    Learns from multiple experiences to identify what works best.
    """

    def __init__(self):
        """Initialize semantic memory with empty structures."""
        # User/system preferences with exponential moving average
        self.preferences: Dict[str, float] = defaultdict(float)

        # Pattern storage: context -> [(action, success)]
        self.patterns: Dict[str, List[Tuple[str, bool]]] = defaultdict(list)

        # Success rate tracking: {context_action: {success: N, total: N}}
        self.success_rates: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {'success': 0, 'total': 0}
        )

    def update_preference(
        self,
        key: str,
        value: float,
        weight: float = 1.0,
        decay: float = 0.9
    ) -> None:
        """
        Update a preference using exponential moving average.

        Args:
            key: Preference identifier
            value: New value to incorporate
            weight: Importance weight (higher = more influence)
            decay: Decay factor for old value (0.9 = keep 90% of old)
        """
        current = self.preferences[key]
        self.preferences[key] = decay * current + (1 - decay) * weight * value

    def record_pattern(
        self,
        context: str,
        action: str,
        success: bool
    ) -> None:
        """
        Record an action pattern and its outcome.

        Args:
            context: Situational context (e.g., "task_type:code_review")
            action: Action taken (e.g., "assigned_to_anga")
            success: Whether the action was successful
        """
        # Store in pattern history
        self.patterns[context].append((action, success))

        # Update success rate tracking
        pattern_key = f"{context}_{action}"
        self.success_rates[pattern_key]['total'] += 1
        if success:
            self.success_rates[pattern_key]['success'] += 1

    def get_best_action(
        self,
        context: str,
        min_samples: int = 1
    ) -> Optional[str]:
        """
        Get the best performing action for a given context.

        Args:
            context: Context to find best action for
            min_samples: Minimum number of samples required

        Returns:
            Best action or None if insufficient data
        """
        if context not in self.patterns:
            return None

        # Calculate success rates per action
        action_scores: Dict[str, Dict[str, int]] = defaultdict(
            lambda: {'success': 0, 'total': 0}
        )

        for action, success in self.patterns[context]:
            action_scores[action]['total'] += 1
            if success:
                action_scores[action]['success'] += 1

        # Filter by minimum samples and calculate rates
        valid_actions = [
            (action, stats['success'] / max(stats['total'], 1))
            for action, stats in action_scores.items()
            if stats['total'] >= min_samples
        ]

        if not valid_actions:
            return None

        # Return action with highest success rate
        best_action, _ = max(valid_actions, key=lambda x: x[1])
        return best_action

    def get_success_rate(self, context: str, action: str) -> float:
        """
        Get success rate for a specific context-action pair.

        Args:
            context: Context identifier
            action: Action identifier

        Returns:
            Success rate (0.0 to 1.0) or 0.0 if no data
        """
        pattern_key = f"{context}_{action}"
        stats = self.success_rates[pattern_key]

        if stats['total'] == 0:
            return 0.0

        return stats['success'] / stats['total']

    def get_preference(self, key: str) -> float:
        """
        Get current preference value.

        Args:
            key: Preference identifier

        Returns:
            Preference value (default 0.0)
        """
        return self.preferences.get(key, 0.0)

    def get_top_preferences(self, n: int = 5) -> List[Tuple[str, float]]:
        """
        Get top N preferences by value.

        Args:
            n: Number of preferences to return

        Returns:
            List of (key, value) tuples sorted by value
        """
        sorted_prefs = sorted(
            self.preferences.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_prefs[:n]

    def get_action_statistics(
        self,
        context: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get detailed statistics for all actions in a context.

        Args:
            context: Context to analyze

        Returns:
            Dictionary of action -> statistics
        """
        if context not in self.patterns:
            return {}

        stats = defaultdict(lambda: {'success': 0, 'total': 0, 'rate': 0.0})

        for action, success in self.patterns[context]:
            stats[action]['total'] += 1
            if success:
                stats[action]['success'] += 1

        # Calculate rates
        for action in stats:
            total = stats[action]['total']
            stats[action]['rate'] = stats[action]['success'] / max(total, 1)

        return dict(stats)

    def learn_from_episodes(
        self,
        episodes: List[Dict[str, Any]],
        context_extractor: callable,
        success_evaluator: callable
    ) -> None:
        """
        Learn patterns from a list of episodes.

        Args:
            episodes: List of episode dictionaries
            context_extractor: Function to extract context from episode
            success_evaluator: Function to determine if episode was successful
        """
        for episode in episodes:
            context = context_extractor(episode)
            action = episode.get('action', '')
            success = success_evaluator(episode)

            self.record_pattern(context, action, success)

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialize memory to dictionary for persistence.

        Returns:
            Dictionary representation of memory
        """
        return {
            'preferences': dict(self.preferences),
            'patterns': {k: list(v) for k, v in self.patterns.items()},
            'success_rates': dict(self.success_rates)
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SemanticMemory':
        """
        Deserialize memory from dictionary.

        Args:
            data: Dictionary representation

        Returns:
            SemanticMemory instance
        """
        memory = cls()
        memory.preferences = defaultdict(float, data.get('preferences', {}))

        patterns_data = data.get('patterns', {})
        memory.patterns = defaultdict(
            list,
            {k: [tuple(item) for item in v] for k, v in patterns_data.items()}
        )

        success_data = data.get('success_rates', {})
        memory.success_rates = defaultdict(
            lambda: {'success': 0, 'total': 0},
            success_data
        )

        return memory

    def clear(self) -> None:
        """Clear all stored patterns and preferences."""
        self.preferences.clear()
        self.patterns.clear()
        self.success_rates.clear()

    def __repr__(self) -> str:
        """String representation of memory."""
        return (
            f"SemanticMemory("
            f"preferences={len(self.preferences)}, "
            f"contexts={len(self.patterns)}, "
            f"patterns={sum(len(v) for v in self.patterns.values())})"
        )
