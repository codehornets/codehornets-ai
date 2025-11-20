"""
Task Master AI Memory Integration

Integrates memory system with Task Master AI for learning from
task execution patterns and suggesting optimal approaches.
"""

from typing import Dict, List, Optional, Any
import logging

from .semantic import SemanticMemory
from .episodic import EpisodicMemory
from .persistence import MemoryPersistence

logger = logging.getLogger(__name__)


class TaskMasterMemory:
    """
    Memory system for Task Master AI integration.
    Learns from task execution patterns to suggest better approaches.
    """

    def __init__(self, memory_dir: Optional[str] = None):
        """
        Initialize Task Master memory.

        Args:
            memory_dir: Directory for persistent storage
        """
        self.episodic = EpisodicMemory(capacity=100)
        self.semantic = SemanticMemory()
        self.memory_dir = memory_dir

        if memory_dir:
            self.load()

    def record_task_execution(
        self,
        task_id: str,
        task_description: str,
        task_category: str,
        approach_used: str,
        success: bool,
        execution_time: Optional[float] = None,
        complexity: Optional[str] = None,
        notes: Optional[str] = None
    ) -> None:
        """
        Record task execution and outcome.

        Args:
            task_id: Task Master task ID
            task_description: Task description
            task_category: Category/type of task
            approach_used: Implementation approach
            success: Whether task completed successfully
            execution_time: Time taken (seconds)
            complexity: Complexity level (low/medium/high)
            notes: Additional notes or learnings
        """
        # Store episode
        self.episodic.store(
            state=task_description,
            action=approach_used,
            outcome=f"success={success}",
            metadata={
                'task_id': task_id,
                'category': task_category,
                'success': success,
                'execution_time': execution_time,
                'complexity': complexity,
                'notes': notes
            }
        )

        # Record pattern
        self.semantic.record_pattern(
            context=task_category,
            action=approach_used,
            success=success
        )

        # Update approach preference if successful
        if success:
            self.semantic.update_preference(
                f"approach_{task_category}_{approach_used}",
                1.0,
                weight=1.5  # Higher weight for successes
            )

        logger.info(
            f"TaskMaster: Recorded {task_id} "
            f"({task_category}, approach={approach_used}, success={success})"
        )

    def suggest_approach(
        self,
        task_description: str,
        task_category: str
    ) -> Dict[str, Any]:
        """
        Suggest optimal approach based on historical patterns.

        Args:
            task_description: Description of new task
            task_category: Task category

        Returns:
            Suggestion dictionary
        """
        # Get best approach for this category
        best_approach = self.semantic.get_best_action(task_category)

        # Find similar past tasks
        similar_tasks = self.episodic.retrieve_similar(
            task_description,
            k=5
        )

        # Get approach statistics for this category
        approach_stats = self.semantic.get_action_statistics(task_category)

        # Calculate confidence
        confidence = self._calculate_confidence(task_category)

        return {
            'recommended_approach': best_approach,
            'confidence': confidence,
            'similar_tasks': [
                {
                    'task_id': task['metadata'].get('task_id'),
                    'approach': task['action'],
                    'success': task['metadata'].get('success'),
                    'notes': task['metadata'].get('notes')
                }
                for task in similar_tasks
            ],
            'approach_statistics': approach_stats
        }

    def get_category_insights(self, category: str) -> Dict[str, Any]:
        """
        Get insights about a task category.

        Args:
            category: Task category

        Returns:
            Insights dictionary
        """
        # Get all tasks in this category
        category_tasks = [
            ep for ep in self.episodic.episodes
            if ep['metadata'].get('category') == category
        ]

        if not category_tasks:
            return {'message': f'No data for category: {category}'}

        # Calculate statistics
        total = len(category_tasks)
        successes = sum(
            1 for task in category_tasks
            if task['metadata'].get('success', False)
        )

        execution_times = [
            task['metadata'].get('execution_time')
            for task in category_tasks
            if task['metadata'].get('execution_time') is not None
        ]

        avg_time = sum(execution_times) / len(execution_times) if execution_times else None

        # Get approach breakdown
        approaches = {}
        for task in category_tasks:
            approach = task['action']
            if approach not in approaches:
                approaches[approach] = {'total': 0, 'successes': 0}
            approaches[approach]['total'] += 1
            if task['metadata'].get('success'):
                approaches[approach]['successes'] += 1

        # Calculate success rates per approach
        for approach in approaches:
            total_attempts = approaches[approach]['total']
            approaches[approach]['success_rate'] = (
                approaches[approach]['successes'] / total_attempts
            )

        return {
            'category': category,
            'total_tasks': total,
            'success_rate': successes / total,
            'avg_execution_time': avg_time,
            'approaches': approaches,
            'most_successful_approach': max(
                approaches.items(),
                key=lambda x: x[1]['success_rate']
            )[0] if approaches else None
        }

    def get_complexity_patterns(self) -> Dict[str, Any]:
        """
        Analyze patterns related to task complexity.

        Returns:
            Complexity analysis
        """
        # Group tasks by complexity
        by_complexity = {'low': [], 'medium': [], 'high': []}

        for ep in self.episodic.episodes:
            complexity = ep['metadata'].get('complexity')
            if complexity in by_complexity:
                by_complexity[complexity].append(ep)

        # Calculate statistics for each complexity level
        stats = {}
        for level, tasks in by_complexity.items():
            if not tasks:
                continue

            successes = sum(
                1 for task in tasks
                if task['metadata'].get('success', False)
            )

            times = [
                task['metadata'].get('execution_time')
                for task in tasks
                if task['metadata'].get('execution_time') is not None
            ]

            stats[level] = {
                'total_tasks': len(tasks),
                'success_rate': successes / len(tasks),
                'avg_time': sum(times) / len(times) if times else None
            }

        return stats

    def identify_improvement_areas(self) -> List[Dict[str, Any]]:
        """
        Identify areas where task execution could improve.

        Returns:
            List of improvement suggestions
        """
        improvements = []

        # Find categories with low success rates
        categories = set(
            ep['metadata'].get('category')
            for ep in self.episodic.episodes
            if ep['metadata'].get('category')
        )

        for category in categories:
            insights = self.get_category_insights(category)

            if insights.get('success_rate', 1.0) < 0.7:  # Less than 70% success
                improvements.append({
                    'area': category,
                    'current_success_rate': insights['success_rate'],
                    'total_attempts': insights['total_tasks'],
                    'recommendation': f"Review approach for {category} tasks"
                })

        # Find approaches that consistently fail
        for context, patterns in self.semantic.patterns.items():
            approach_failures = {}
            for action, success in patterns:
                if action not in approach_failures:
                    approach_failures[action] = {'total': 0, 'failures': 0}
                approach_failures[action]['total'] += 1
                if not success:
                    approach_failures[action]['failures'] += 1

            for approach, stats in approach_failures.items():
                if stats['total'] >= 3 and stats['failures'] / stats['total'] > 0.5:
                    improvements.append({
                        'area': context,
                        'problematic_approach': approach,
                        'failure_rate': stats['failures'] / stats['total'],
                        'recommendation': f"Avoid '{approach}' for {context}"
                    })

        return improvements

    def _calculate_confidence(self, category: str) -> float:
        """Calculate confidence in recommendations."""
        stats = self.semantic.get_action_statistics(category)

        if not stats:
            return 0.0

        total_samples = sum(s['total'] for s in stats.values())

        # Confidence increases with more data (asymptotic to 1.0)
        confidence = min(1.0, total_samples / 15.0)

        return confidence

    def get_learning_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive learning summary.

        Returns:
            Summary of all learnings
        """
        categories = set(
            ep['metadata'].get('category')
            for ep in self.episodic.episodes
            if ep['metadata'].get('category')
        )

        return {
            'total_tasks_tracked': len(self.episodic),
            'categories': list(categories),
            'category_count': len(categories),
            'improvement_areas': self.identify_improvement_areas(),
            'complexity_patterns': self.get_complexity_patterns()
        }

    def save(self) -> None:
        """Save Task Master memory to disk."""
        if not self.memory_dir:
            return

        MemoryPersistence.save_all(
            self.episodic,
            self.semantic,
            self.memory_dir,
            format='json'
        )
        logger.info(f"Saved TaskMaster memory to {self.memory_dir}")

    def load(self) -> None:
        """Load Task Master memory from disk."""
        if not self.memory_dir:
            return

        try:
            self.episodic, self.semantic = MemoryPersistence.load_all(
                self.memory_dir,
                format='json'
            )
            logger.info(f"Loaded TaskMaster memory from {self.memory_dir}")
        except Exception as e:
            logger.warning(f"Could not load TaskMaster memory: {e}")

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"TaskMasterMemory("
            f"tasks={len(self.episodic)}, "
            f"patterns={len(self.semantic.patterns)})"
        )
