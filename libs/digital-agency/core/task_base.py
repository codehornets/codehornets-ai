"""
Base task class and task management.

Defines the task abstraction, status tracking, priority handling,
and result management for the agent system.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """Task execution status."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


class TaskPriority(str, Enum):
    """Task priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskResult(BaseModel):
    """Result of task execution."""

    task_id: str
    status: TaskStatus
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    agent_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def is_successful(self) -> bool:
        """Check if task completed successfully."""
        return self.status == TaskStatus.COMPLETED

    def get_duration(self) -> Optional[float]:
        """Get task duration in seconds."""
        if self.completed_at and self.started_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class TaskDependency(BaseModel):
    """Represents a dependency between tasks."""

    task_id: str
    dependency_type: str = "requires"  # requires, follows, blocks
    blocking: bool = True


class TaskBase(BaseModel):
    """
    Base class for all tasks in the system.

    Represents a unit of work that can be assigned to and executed by agents.
    """

    task_id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    domain: str
    task_type: str
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING

    # Assignment
    assigned_agent_id: Optional[str] = None
    assigned_at: Optional[datetime] = None

    # Execution
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timeout_seconds: Optional[int] = None
    max_retries: int = 3
    retry_count: int = 0

    # Input/Output
    input_data: Dict[str, Any] = Field(default_factory=dict)
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

    # Dependencies
    dependencies: List[TaskDependency] = Field(default_factory=list)
    parent_task_id: Optional[str] = None
    child_task_ids: List[str] = Field(default_factory=list)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic configuration."""

        use_enum_values = True

    def assign_to_agent(self, agent_id: str) -> None:
        """
        Assign task to an agent.

        Args:
            agent_id: ID of the agent to assign to
        """
        self.assigned_agent_id = agent_id
        self.assigned_at = datetime.utcnow()
        self.status = TaskStatus.ASSIGNED
        self.updated_at = datetime.utcnow()

    def start_execution(self) -> None:
        """Mark task as started."""
        self.status = TaskStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def complete(self, output_data: Optional[Dict[str, Any]] = None) -> TaskResult:
        """
        Mark task as completed.

        Args:
            output_data: Task output data

        Returns:
            TaskResult: Result object
        """
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.output_data = output_data
        self.updated_at = datetime.utcnow()

        return self._create_result()

    def fail(self, error_message: str) -> TaskResult:
        """
        Mark task as failed.

        Args:
            error_message: Error description

        Returns:
            TaskResult: Result object
        """
        self.status = TaskStatus.FAILED
        self.completed_at = datetime.utcnow()
        self.error_message = error_message
        self.updated_at = datetime.utcnow()

        return self._create_result()

    def cancel(self) -> None:
        """Cancel task execution."""
        self.status = TaskStatus.CANCELLED
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def timeout(self) -> TaskResult:
        """
        Mark task as timed out.

        Returns:
            TaskResult: Result object
        """
        self.status = TaskStatus.TIMEOUT
        self.completed_at = datetime.utcnow()
        self.error_message = "Task execution timed out"
        self.updated_at = datetime.utcnow()

        return self._create_result()

    def should_retry(self) -> bool:
        """
        Check if task should be retried.

        Returns:
            bool: True if task should be retried
        """
        return (
            self.status == TaskStatus.FAILED
            and self.retry_count < self.max_retries
        )

    def retry(self) -> None:
        """Prepare task for retry."""
        self.retry_count += 1
        self.status = TaskStatus.PENDING
        self.assigned_agent_id = None
        self.started_at = None
        self.completed_at = None
        self.error_message = None
        self.updated_at = datetime.utcnow()

    def add_dependency(
        self,
        task_id: str,
        dependency_type: str = "requires",
        blocking: bool = True,
    ) -> None:
        """
        Add a task dependency.

        Args:
            task_id: ID of dependent task
            dependency_type: Type of dependency
            blocking: Whether dependency is blocking
        """
        dependency = TaskDependency(
            task_id=task_id,
            dependency_type=dependency_type,
            blocking=blocking,
        )
        self.dependencies.append(dependency)
        self.updated_at = datetime.utcnow()

    def has_blocking_dependencies(self) -> bool:
        """
        Check if task has blocking dependencies.

        Returns:
            bool: True if there are blocking dependencies
        """
        return any(dep.blocking for dep in self.dependencies)

    def get_elapsed_time(self) -> Optional[float]:
        """
        Get elapsed execution time in seconds.

        Returns:
            Optional[float]: Elapsed time or None if not started
        """
        if not self.started_at:
            return None

        end_time = self.completed_at or datetime.utcnow()
        return (end_time - self.started_at).total_seconds()

    def is_terminal_state(self) -> bool:
        """
        Check if task is in a terminal state.

        Returns:
            bool: True if task is completed, failed, cancelled, or timed out
        """
        return self.status in [
            TaskStatus.COMPLETED,
            TaskStatus.FAILED,
            TaskStatus.CANCELLED,
            TaskStatus.TIMEOUT,
        ]

    def _create_result(self) -> TaskResult:
        """Create task result object."""
        return TaskResult(
            task_id=self.task_id,
            status=self.status,
            output=self.output_data,
            error=self.error_message,
            started_at=self.started_at or datetime.utcnow(),
            completed_at=self.completed_at,
            agent_id=self.assigned_agent_id,
            metadata=self.metadata,
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert task to dictionary.

        Returns:
            Dict: Task as dictionary
        """
        return self.model_dump()

    def __repr__(self) -> str:
        """String representation of task."""
        return (
            f"<TaskBase(id={self.task_id}, name={self.name}, "
            f"status={self.status}, priority={self.priority})>"
        )
