"""
Shared Cross-Agent Memory System

Enables multiple agents to share learnings, user preferences, and project context.
Acts as a common knowledge base accessible by orchestrator and all workers.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from .episodic import EpisodicMemory
from .semantic import SemanticMemory
from .persistence import MemoryPersistence

logger = logging.getLogger(__name__)


class SharedMemory:
    """
    Shared memory accessible by all agents.
    Stores user preferences, project context, and cross-agent learnings.
    """

    def __init__(self, memory_dir: Optional[str] = None):
        """
        Initialize shared memory.

        Args:
            memory_dir: Directory for persistent storage
        """
        # Project history shared across all agents
        self.project_context = EpisodicMemory(capacity=200)

        # User preferences accessible by all
        self.user_preferences = SemanticMemory()

        # Cross-agent learnings
        self.agent_insights = SemanticMemory()

        self.memory_dir = memory_dir

        if memory_dir:
            self.load()

    def update_user_preference(
        self,
        preference_key: str,
        value: float,
        source_agent: str,
        weight: float = 1.0
    ) -> None:
        """
        Update user preference (accessible by all agents).

        Args:
            preference_key: Preference identifier
            value: Preference value
            source_agent: Agent that observed this preference
            weight: Importance weight
        """
        self.user_preferences.update_preference(
            preference_key,
            value,
            weight=weight
        )

        # Track which agent contributed this
        self.agent_insights.record_pattern(
            context=preference_key,
            action=source_agent,
            success=True
        )

        logger.info(
            f"Shared: {source_agent} updated preference '{preference_key}' = {value:.2f}"
        )

    def get_user_preference(self, preference_key: str) -> float:
        """
        Get user preference value.

        Args:
            preference_key: Preference to retrieve

        Returns:
            Preference value (0.0 if not set)
        """
        return self.user_preferences.get_preference(preference_key)

    def get_all_user_preferences(self) -> Dict[str, float]:
        """Get all user preferences."""
        return dict(self.user_preferences.preferences)

    def store_project_event(
        self,
        event_type: str,
        description: str,
        agent: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Store significant project event in shared history.

        Args:
            event_type: Type of event (task_completed, decision_made, etc.)
            description: Event description
            agent: Agent that generated this event
            metadata: Additional context
        """
        event_metadata = metadata or {}
        event_metadata.update({
            'event_type': event_type,
            'agent': agent
        })

        self.project_context.store(
            state=event_type,
            action=agent,
            outcome=description,
            metadata=event_metadata
        )

        logger.info(f"Shared: Stored project event '{event_type}' from {agent}")

    def get_project_history(
        self,
        query: Optional[str] = None,
        event_type: Optional[str] = None,
        agent: Optional[str] = None,
        k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Retrieve project history with optional filters.

        Args:
            query: Search query for similar events
            event_type: Filter by event type
            agent: Filter by agent
            k: Number of events to return

        Returns:
            List of project events
        """
        if query:
            # Similarity search
            events = self.project_context.retrieve_similar(query, k=k)
        else:
            # Recent events
            events = self.project_context.get_recent(k)

        # Apply filters
        if event_type:
            events = [
                e for e in events
                if e['metadata'].get('event_type') == event_type
            ]

        if agent:
            events = [
                e for e in events
                if e['metadata'].get('agent') == agent
            ]

        return events

    def share_learning(
        self,
        learning_type: str,
        insight: str,
        source_agent: str,
        applicable_to: List[str],
        confidence: float = 1.0
    ) -> None:
        """
        Share a learning that other agents can benefit from.

        Args:
            learning_type: Type of learning
            insight: The learning/insight
            source_agent: Agent that generated this learning
            applicable_to: List of agents this applies to
            confidence: Confidence in this learning (0-1)
        """
        # Store as project event
        self.store_project_event(
            event_type='shared_learning',
            description=insight,
            agent=source_agent,
            metadata={
                'learning_type': learning_type,
                'applicable_to': applicable_to,
                'confidence': confidence
            }
        )

        # Update semantic patterns
        for target_agent in applicable_to:
            self.agent_insights.record_pattern(
                context=f"{learning_type}_{target_agent}",
                action=source_agent,
                success=True
            )

        logger.info(
            f"Shared: {source_agent} shared learning for {applicable_to}"
        )

    def get_applicable_learnings(
        self,
        agent_name: str,
        learning_type: Optional[str] = None,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get learnings applicable to a specific agent.

        Args:
            agent_name: Agent requesting learnings
            learning_type: Optional filter by learning type
            k: Number of learnings to return

        Returns:
            List of applicable learnings
        """
        # Find all shared learnings
        all_learnings = self.get_project_history(
            event_type='shared_learning',
            k=50
        )

        # Filter to those applicable to this agent
        applicable = [
            learning for learning in all_learnings
            if agent_name in learning['metadata'].get('applicable_to', [])
        ]

        # Further filter by type if specified
        if learning_type:
            applicable = [
                l for l in applicable
                if l['metadata'].get('learning_type') == learning_type
            ]

        # Sort by confidence
        applicable.sort(
            key=lambda x: x['metadata'].get('confidence', 0),
            reverse=True
        )

        return applicable[:k]

    def record_collaboration(
        self,
        agents: List[str],
        task_description: str,
        success: bool,
        insights: Optional[str] = None
    ) -> None:
        """
        Record successful (or unsuccessful) collaboration between agents.

        Args:
            agents: List of agents involved
            task_description: What they collaborated on
            success: Whether collaboration was successful
            insights: Lessons learned
        """
        self.store_project_event(
            event_type='collaboration',
            description=task_description,
            agent='_'.join(agents),
            metadata={
                'agents': agents,
                'success': success,
                'insights': insights
            }
        )

        # Record collaboration pattern
        agents_key = '_'.join(sorted(agents))
        self.agent_insights.record_pattern(
            context='collaboration',
            action=agents_key,
            success=success
        )

    def get_collaboration_patterns(self) -> Dict[str, Any]:
        """
        Get patterns about which agents work well together.

        Returns:
            Collaboration statistics
        """
        stats = self.agent_insights.get_action_statistics('collaboration')

        # Sort by success rate
        sorted_combos = sorted(
            stats.items(),
            key=lambda x: x[1]['rate'],
            reverse=True
        )

        return {
            'successful_combinations': [
                {
                    'agents': combo.split('_'),
                    'success_rate': info['rate'],
                    'total_collaborations': info['total']
                }
                for combo, info in sorted_combos[:5]
            ]
        }

    def get_insights_summary(self) -> Dict[str, Any]:
        """
        Get summary of all shared insights.

        Returns:
            Summary dictionary
        """
        return {
            'user_preferences_count': len(self.user_preferences.preferences),
            'project_events_count': len(self.project_context),
            'shared_learnings_count': len([
                e for e in self.project_context.episodes
                if e['metadata'].get('event_type') == 'shared_learning'
            ]),
            'collaborations_count': len([
                e for e in self.project_context.episodes
                if e['metadata'].get('event_type') == 'collaboration'
            ]),
            'top_preferences': self.user_preferences.get_top_preferences(5)
        }

    def save(self) -> None:
        """Save shared memory to disk."""
        if not self.memory_dir:
            logger.warning("No memory_dir set, cannot save shared memory")
            return

        try:
            # Save project context
            MemoryPersistence.save_episodic(
                self.project_context,
                f"{self.memory_dir}/project_context.json",
                format='json'
            )

            # Save user preferences
            MemoryPersistence.save_semantic(
                self.user_preferences,
                f"{self.memory_dir}/user_preferences.json",
                format='json'
            )

            # Save agent insights
            MemoryPersistence.save_semantic(
                self.agent_insights,
                f"{self.memory_dir}/agent_insights.json",
                format='json'
            )

            logger.info(f"Saved shared memory to {self.memory_dir}")
        except Exception as e:
            logger.error(f"Error saving shared memory: {e}")

    def load(self) -> None:
        """Load shared memory from disk."""
        if not self.memory_dir:
            return

        try:
            # Load project context
            self.project_context = MemoryPersistence.load_episodic(
                f"{self.memory_dir}/project_context.json",
                format='json'
            )

            # Load user preferences
            self.user_preferences = MemoryPersistence.load_semantic(
                f"{self.memory_dir}/user_preferences.json",
                format='json'
            )

            # Load agent insights
            self.agent_insights = MemoryPersistence.load_semantic(
                f"{self.memory_dir}/agent_insights.json",
                format='json'
            )

            logger.info(f"Loaded shared memory from {self.memory_dir}")
        except Exception as e:
            logger.warning(f"Could not load shared memory: {e}")

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"SharedMemory("
            f"events={len(self.project_context)}, "
            f"preferences={len(self.user_preferences.preferences)})"
        )
