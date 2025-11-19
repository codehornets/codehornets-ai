"""
Orchestrator Memory System

Manages memory for the orchestrator agent to learn task delegation patterns,
track worker performance, and improve orchestration decisions over time.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from .episodic import EpisodicMemory
from .semantic import SemanticMemory
from .persistence import MemoryPersistence

logger = logging.getLogger(__name__)


class OrchestratorMemory:
    """
    Memory system for orchestrator agent.
    Learns optimal task delegation patterns and worker selection strategies.
    """

    def __init__(
        self,
        episodic_capacity: int = 100,
        memory_dir: Optional[str] = None
    ):
        """
        Initialize orchestrator memory.

        Args:
            episodic_capacity: Maximum episodes to store
            memory_dir: Directory for persistent storage
        """
        self.episodic = EpisodicMemory(capacity=episodic_capacity)
        self.semantic = SemanticMemory()
        self.memory_dir = memory_dir

        # Load from disk if available
        if memory_dir:
            self.load()

    def store_delegation(
        self,
        user_request: str,
        workers_assigned: List[str],
        task_description: str,
        success: bool,
        execution_time: Optional[float] = None,
        user_satisfaction: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Store a delegation decision and its outcome.

        Args:
            user_request: Original user request
            workers_assigned: List of workers assigned
            task_description: Description of delegated task
            success: Whether delegation was successful
            execution_time: Time taken to complete (seconds)
            user_satisfaction: User satisfaction score (0-1)
            metadata: Additional context
        """
        # Create comprehensive state description
        state = f"request: {user_request}"

        # Create action description
        workers_str = ", ".join(workers_assigned)
        action = f"assigned_to: {workers_str}"

        # Create outcome description
        outcome_parts = [f"success: {success}"]
        if execution_time:
            outcome_parts.append(f"time: {execution_time:.1f}s")
        if user_satisfaction:
            outcome_parts.append(f"satisfaction: {user_satisfaction:.2f}")
        outcome = " | ".join(outcome_parts)

        # Store in episodic memory
        episode_metadata = metadata or {}
        episode_metadata.update({
            'workers': workers_assigned,
            'success': success,
            'execution_time': execution_time,
            'user_satisfaction': user_satisfaction
        })

        self.episodic.store(
            state=state,
            action=action,
            outcome=outcome,
            metadata=episode_metadata
        )

        # Extract task category for semantic learning
        task_category = self._categorize_request(user_request)

        # Record pattern in semantic memory
        self.semantic.record_pattern(
            context=task_category,
            action=workers_str,
            success=success
        )

        # Update worker performance preferences
        for worker in workers_assigned:
            performance_score = 1.0 if success else 0.0
            if user_satisfaction:
                performance_score = user_satisfaction

            self.semantic.update_preference(
                f"worker_{worker}_performance",
                performance_score,
                weight=1.0
            )

        logger.info(
            f"Stored delegation: {task_category} -> {workers_str} "
            f"(success={success})"
        )

    def plan_delegation(
        self,
        user_request: str,
        available_workers: List[str]
    ) -> Dict[str, Any]:
        """
        Plan optimal task delegation based on historical patterns.

        Args:
            user_request: Current user request
            available_workers: List of available workers

        Returns:
            Dictionary with recommended workers and reasoning
        """
        # Categorize the request
        task_category = self._categorize_request(user_request)

        # Get best-performing worker combination from history
        best_workers = self.semantic.get_best_action(task_category)

        # Retrieve similar past cases
        similar_episodes = self.episodic.retrieve_similar(
            f"request: {user_request}",
            k=3
        )

        # Get worker performance scores
        worker_scores = {
            worker: self.semantic.get_preference(f"worker_{worker}_performance")
            for worker in available_workers
        }

        # Generate recommendation
        recommendation = {
            'category': task_category,
            'recommended_workers': self._parse_workers(best_workers) if best_workers else [],
            'worker_scores': worker_scores,
            'similar_cases': [
                {
                    'workers': ep['metadata'].get('workers', []),
                    'success': ep['metadata'].get('success', False),
                    'timestamp': ep['timestamp']
                }
                for ep in similar_episodes
            ],
            'confidence': self._calculate_confidence(task_category)
        }

        return recommendation

    def get_worker_statistics(self, worker: str) -> Dict[str, Any]:
        """
        Get detailed statistics for a specific worker.

        Args:
            worker: Worker name

        Returns:
            Statistics dictionary
        """
        # Get episodes involving this worker
        worker_episodes = [
            ep for ep in self.episodic.episodes
            if worker in ep['metadata'].get('workers', [])
        ]

        if not worker_episodes:
            return {
                'total_tasks': 0,
                'success_rate': 0.0,
                'avg_satisfaction': 0.0,
                'performance_score': 0.0
            }

        total = len(worker_episodes)
        successes = sum(
            1 for ep in worker_episodes
            if ep['metadata'].get('success', False)
        )

        satisfactions = [
            ep['metadata'].get('user_satisfaction', 0)
            for ep in worker_episodes
            if ep['metadata'].get('user_satisfaction') is not None
        ]

        return {
            'total_tasks': total,
            'success_rate': successes / total,
            'avg_satisfaction': sum(satisfactions) / len(satisfactions) if satisfactions else 0.0,
            'performance_score': self.semantic.get_preference(f"worker_{worker}_performance"),
            'recent_tasks': len([ep for ep in self.episodic.get_recent(10) if worker in ep['metadata'].get('workers', [])])
        }

    def _categorize_request(self, request: str) -> str:
        """
        Categorize user request into task type.

        Args:
            request: User request text

        Returns:
            Task category string
        """
        request_lower = request.lower()

        # Dance-related keywords
        if any(word in request_lower for word in [
            'dance', 'student', 'evaluation', 'choreography', 'recital',
            'ballet', 'jazz', 'hip-hop', 'flexibility', 'technique'
        ]):
            return 'dance'

        # Code-related keywords
        if any(word in request_lower for word in [
            'code', 'review', 'bug', 'test', 'api', 'function',
            'database', 'security', 'performance', 'refactor'
        ]):
            return 'coding'

        # Marketing-related keywords
        if any(word in request_lower for word in [
            'marketing', 'campaign', 'social', 'content', 'brand',
            'audience', 'promotion', 'engagement', 'post'
        ]):
            return 'marketing'

        # Multi-domain tasks
        if any(word in request_lower for word in ['all', 'everything', 'comprehensive']):
            return 'multi_domain'

        return 'general'

    def _parse_workers(self, workers_str: str) -> List[str]:
        """Parse comma-separated worker string into list."""
        if not workers_str:
            return []
        return [w.strip() for w in workers_str.split(',')]

    def _calculate_confidence(self, category: str) -> float:
        """
        Calculate confidence in recommendation based on available data.

        Args:
            category: Task category

        Returns:
            Confidence score (0-1)
        """
        stats = self.semantic.get_action_statistics(category)

        if not stats:
            return 0.0

        # Confidence based on total samples
        total_samples = sum(s['total'] for s in stats.values())

        # More samples = higher confidence (asymptotic to 1.0)
        confidence = min(1.0, total_samples / 20.0)

        return confidence

    def get_delegation_insights(self) -> Dict[str, Any]:
        """
        Get insights about delegation patterns.

        Returns:
            Dictionary with insights
        """
        return {
            'total_delegations': len(self.episodic),
            'categories': list(self.semantic.patterns.keys()),
            'top_preferences': self.semantic.get_top_preferences(10),
            'recent_success_rate': self._get_recent_success_rate()
        }

    def _get_recent_success_rate(self, n: int = 10) -> float:
        """Calculate success rate of recent delegations."""
        recent = self.episodic.get_recent(n)

        if not recent:
            return 0.0

        successes = sum(
            1 for ep in recent
            if ep['metadata'].get('success', False)
        )

        return successes / len(recent)

    def save(self) -> None:
        """Save memory to disk."""
        if not self.memory_dir:
            logger.warning("No memory_dir set, cannot save")
            return

        MemoryPersistence.save_all(
            self.episodic,
            self.semantic,
            self.memory_dir,
            format='json'
        )
        logger.info(f"Saved orchestrator memory to {self.memory_dir}")

    def load(self) -> None:
        """Load memory from disk."""
        if not self.memory_dir:
            return

        try:
            self.episodic, self.semantic = MemoryPersistence.load_all(
                self.memory_dir,
                format='json'
            )
            logger.info(f"Loaded orchestrator memory from {self.memory_dir}")
        except Exception as e:
            logger.warning(f"Could not load memory: {e}")

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"OrchestratorMemory("
            f"episodes={len(self.episodic)}, "
            f"patterns={len(self.semantic.patterns)})"
        )
