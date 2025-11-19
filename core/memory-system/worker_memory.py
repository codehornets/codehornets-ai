"""
Worker Memory Systems

Specialized memory implementations for each worker agent:
- Marie (Dance Teaching)
- Anga (Software Development)
- Fabien (Marketing)
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from .episodic import EpisodicMemory
from .semantic import SemanticMemory
from .persistence import MemoryPersistence

logger = logging.getLogger(__name__)


class WorkerMemory:
    """Base class for worker memory systems."""

    def __init__(
        self,
        worker_name: str,
        episodic_capacity: int = 50,
        memory_dir: Optional[str] = None
    ):
        """
        Initialize worker memory.

        Args:
            worker_name: Name of the worker
            episodic_capacity: Maximum episodes to store
            memory_dir: Directory for persistent storage
        """
        self.worker_name = worker_name
        self.episodic = EpisodicMemory(capacity=episodic_capacity)
        self.semantic = SemanticMemory()
        self.memory_dir = memory_dir

        if memory_dir:
            self.load()

    def store_task_execution(
        self,
        task_description: str,
        approach: str,
        outcome: str,
        success: bool,
        execution_time: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Store task execution experience.

        Args:
            task_description: Description of the task
            approach: Approach/strategy used
            outcome: Result description
            success: Whether task was successful
            execution_time: Time taken (seconds)
            metadata: Additional context
        """
        episode_metadata = metadata or {}
        episode_metadata.update({
            'worker': self.worker_name,
            'success': success,
            'execution_time': execution_time
        })

        self.episodic.store(
            state=task_description,
            action=approach,
            outcome=outcome,
            metadata=episode_metadata
        )

        # Learn patterns
        task_type = self._categorize_task(task_description)
        self.semantic.record_pattern(
            context=task_type,
            action=approach,
            success=success
        )

        logger.info(
            f"{self.worker_name}: Stored task execution "
            f"({task_type}, success={success})"
        )

    def get_similar_experiences(
        self,
        task_description: str,
        k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve similar past task executions.

        Args:
            task_description: Current task
            k: Number of similar experiences to return

        Returns:
            List of similar episodes
        """
        return self.episodic.retrieve_similar(task_description, k=k)

    def recommend_approach(self, task_description: str) -> Dict[str, Any]:
        """
        Recommend approach based on historical success.

        Args:
            task_description: Task to find approach for

        Returns:
            Recommendation dictionary
        """
        task_type = self._categorize_task(task_description)
        best_approach = self.semantic.get_best_action(task_type)

        similar = self.get_similar_experiences(task_description, k=3)

        return {
            'task_type': task_type,
            'recommended_approach': best_approach,
            'similar_cases': [
                {
                    'action': ep['action'],
                    'success': ep['metadata'].get('success', False)
                }
                for ep in similar
            ],
            'confidence': self._calculate_confidence(task_type)
        }

    def _categorize_task(self, task: str) -> str:
        """
        Categorize task (override in subclasses).

        Args:
            task: Task description

        Returns:
            Task category
        """
        return 'general'

    def _calculate_confidence(self, category: str) -> float:
        """Calculate confidence in recommendation."""
        stats = self.semantic.get_action_statistics(category)
        if not stats:
            return 0.0

        total = sum(s['total'] for s in stats.values())
        return min(1.0, total / 10.0)

    def save(self) -> None:
        """Save memory to disk."""
        if not self.memory_dir:
            return

        MemoryPersistence.save_all(
            self.episodic,
            self.semantic,
            self.memory_dir,
            format='json'
        )
        logger.info(f"Saved {self.worker_name} memory to {self.memory_dir}")

    def load(self) -> None:
        """Load memory from disk."""
        if not self.memory_dir:
            return

        try:
            self.episodic, self.semantic = MemoryPersistence.load_all(
                self.memory_dir,
                format='json'
            )
            logger.info(f"Loaded {self.worker_name} memory from {self.memory_dir}")
        except Exception as e:
            logger.warning(f"Could not load {self.worker_name} memory: {e}")


class MarieMemory(WorkerMemory):
    """Memory system for Marie (Dance Teaching Expert)."""

    def __init__(self, memory_dir: Optional[str] = None):
        super().__init__('marie', memory_dir=memory_dir)

    def remember_student(
        self,
        student_name: str,
        assessment: Dict[str, Any]
    ) -> None:
        """
        Remember student evaluation and progress.

        Args:
            student_name: Student's name
            assessment: Assessment details (technique, flexibility, etc.)
        """
        self.episodic.store(
            state=f"evaluating_{student_name}",
            action="assessment",
            outcome=f"scores: {assessment}",
            metadata={
                'student': student_name,
                'assessment': assessment
            }
        )

        # Update student preferences
        for skill, score in assessment.items():
            self.semantic.update_preference(
                f"student_{student_name}_{skill}",
                score,
                weight=1.0
            )

        logger.info(f"Marie: Remembered assessment for {student_name}")

    def get_student_history(self, student_name: str) -> List[Dict[str, Any]]:
        """Get all past evaluations for a student."""
        return self.episodic.search_by_metadata(student=student_name)

    def recommend_exercises(
        self,
        student_name: str
    ) -> Dict[str, Any]:
        """
        Recommend exercises based on student's history.

        Args:
            student_name: Student's name

        Returns:
            Exercise recommendations
        """
        # Get student's skill levels
        skills = ['technique', 'flexibility', 'strength', 'musicality']
        skill_levels = {
            skill: self.semantic.get_preference(f"student_{student_name}_{skill}")
            for skill in skills
        }

        # Find weakest areas
        weak_areas = [
            skill for skill, level in skill_levels.items()
            if level < 7.0  # Threshold for improvement
        ]

        return {
            'student': student_name,
            'skill_levels': skill_levels,
            'focus_areas': weak_areas,
            'past_assessments': len(self.get_student_history(student_name))
        }

    def _categorize_task(self, task: str) -> str:
        """Categorize dance-related tasks."""
        task_lower = task.lower()

        if 'evaluat' in task_lower or 'assess' in task_lower:
            return 'student_evaluation'
        elif 'choreograph' in task_lower:
            return 'choreography'
        elif 'recital' in task_lower or 'performance' in task_lower:
            return 'recital_preparation'
        elif 'exercise' in task_lower or 'training' in task_lower:
            return 'exercise_recommendation'

        return 'general_dance'


class AngaMemory(WorkerMemory):
    """Memory system for Anga (Software Development Expert)."""

    def __init__(self, memory_dir: Optional[str] = None):
        super().__init__('anga', memory_dir=memory_dir)

    def remember_code_issue(
        self,
        file_path: str,
        issue_type: str,
        severity: str,
        fixed: bool = False
    ) -> None:
        """
        Remember code issue found during review.

        Args:
            file_path: Path to file with issue
            issue_type: Type of issue (sql_injection, xss, etc.)
            severity: Severity level
            fixed: Whether issue was fixed
        """
        self.episodic.store(
            state=f"reviewing_{file_path}",
            action=f"found_{issue_type}",
            outcome=f"severity={severity}, fixed={fixed}",
            metadata={
                'file': file_path,
                'issue_type': issue_type,
                'severity': severity,
                'fixed': fixed
            }
        )

        # Track issue patterns by file type
        file_type = self._get_file_type(file_path)
        self.semantic.record_pattern(
            context=f"filetype_{file_type}",
            action=issue_type,
            success=fixed
        )

        logger.info(f"Anga: Remembered {issue_type} in {file_path}")

    def get_high_risk_areas(self) -> List[Dict[str, Any]]:
        """
        Identify code areas with frequent issues.

        Returns:
            List of high-risk areas
        """
        # Count issues per file
        file_issues: Dict[str, int] = {}

        for episode in self.episodic.episodes:
            file_path = episode['metadata'].get('file')
            if file_path:
                file_issues[file_path] = file_issues.get(file_path, 0) + 1

        # Sort by issue count
        sorted_files = sorted(
            file_issues.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return [
            {'file': file, 'issue_count': count}
            for file, count in sorted_files[:10]
        ]

    def suggest_review_focus(self) -> Dict[str, Any]:
        """
        Suggest areas to focus on based on historical patterns.

        Returns:
            Review focus suggestions
        """
        high_risk = self.get_high_risk_areas()

        # Find most common issue types
        issue_counts: Dict[str, int] = {}
        for ep in self.episodic.episodes:
            issue = ep['metadata'].get('issue_type')
            if issue:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1

        return {
            'high_risk_files': high_risk[:5],
            'common_issues': sorted(
                issue_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        }

    def _categorize_task(self, task: str) -> str:
        """Categorize coding tasks."""
        task_lower = task.lower()

        if 'review' in task_lower or 'audit' in task_lower:
            return 'code_review'
        elif 'security' in task_lower or 'vulnerab' in task_lower:
            return 'security_review'
        elif 'performance' in task_lower or 'optim' in task_lower:
            return 'performance_optimization'
        elif 'test' in task_lower:
            return 'testing'
        elif 'refactor' in task_lower:
            return 'refactoring'

        return 'general_coding'

    def _get_file_type(self, file_path: str) -> str:
        """Extract file type from path."""
        if '.' in file_path:
            return file_path.split('.')[-1]
        return 'unknown'


class FabienMemory(WorkerMemory):
    """Memory system for Fabien (Marketing Expert)."""

    def __init__(self, memory_dir: Optional[str] = None):
        super().__init__('fabien', memory_dir=memory_dir)

    def remember_campaign(
        self,
        campaign_type: str,
        metrics: Dict[str, float],
        success: bool
    ) -> None:
        """
        Remember campaign execution and results.

        Args:
            campaign_type: Type of campaign
            metrics: Performance metrics (engagement_rate, etc.)
            success: Whether campaign met goals
        """
        self.episodic.store(
            state=f"campaign_{campaign_type}",
            action="executed",
            outcome=f"metrics: {metrics}",
            metadata={
                'campaign_type': campaign_type,
                'metrics': metrics,
                'success': success
            }
        )

        # Learn successful campaign patterns
        self.semantic.record_pattern(
            context=campaign_type,
            action='social_media',
            success=success
        )

        # Update preference for this campaign type
        engagement = metrics.get('engagement_rate', 0)
        self.semantic.update_preference(
            f"campaign_{campaign_type}_effectiveness",
            engagement,
            weight=1.0
        )

        logger.info(f"Fabien: Remembered {campaign_type} campaign (success={success})")

    def recommend_campaign_type(self) -> Dict[str, Any]:
        """
        Recommend campaign type based on historical success.

        Returns:
            Campaign recommendation
        """
        # Get best performing campaign type
        best_type = self.semantic.get_best_action('campaign')

        # Get effectiveness scores
        campaign_types = ['social_media', 'email', 'content', 'event', 'influencer']
        effectiveness = {
            ctype: self.semantic.get_preference(f"campaign_{ctype}_effectiveness")
            for ctype in campaign_types
        }

        return {
            'recommended_type': best_type,
            'effectiveness_scores': effectiveness,
            'past_campaigns': len(self.episodic)
        }

    def get_audience_insights(self) -> Dict[str, Any]:
        """
        Get insights about what resonates with audience.

        Returns:
            Audience insights
        """
        successful_campaigns = [
            ep for ep in self.episodic.episodes
            if ep['metadata'].get('success', False)
        ]

        if not successful_campaigns:
            return {'insights': 'Insufficient data'}

        # Analyze successful campaign patterns
        campaign_types = [
            ep['metadata'].get('campaign_type')
            for ep in successful_campaigns
        ]

        return {
            'successful_campaign_count': len(successful_campaigns),
            'most_successful_type': max(set(campaign_types), key=campaign_types.count),
            'total_campaigns': len(self.episodic)
        }

    def _categorize_task(self, task: str) -> str:
        """Categorize marketing tasks."""
        task_lower = task.lower()

        if 'campaign' in task_lower:
            return 'campaign_creation'
        elif 'social' in task_lower or 'post' in task_lower:
            return 'social_media'
        elif 'content' in task_lower:
            return 'content_creation'
        elif 'brand' in task_lower:
            return 'branding'
        elif 'audience' in task_lower or 'target' in task_lower:
            return 'audience_analysis'

        return 'general_marketing'
