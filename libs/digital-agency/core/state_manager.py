"""
State management for agents and tasks.

Provides persistence and state management capabilities for agents,
tasks, and workflows with support for Redis-based caching.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field
import redis.asyncio as redis
import json

from .logger import get_logger
from config.settings import get_settings


class AgentState(BaseModel):
    """Represents persisted agent state."""

    agent_id: str
    status: str
    current_tasks: List[str] = Field(default_factory=list)
    completed_tasks: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TaskState(BaseModel):
    """Represents persisted task state."""

    task_id: str
    status: str
    assigned_agent_id: Optional[str] = None
    progress: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WorkflowState(BaseModel):
    """Represents persisted workflow state."""

    workflow_id: str
    status: str
    tasks: List[str] = Field(default_factory=list)
    completed_tasks: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StateManager:
    """
    Manages state persistence for agents, tasks, and workflows.

    Uses Redis for fast state access and persistence with optional
    database backup for long-term storage.
    """

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """
        Initialize state manager.

        Args:
            redis_client: Optional Redis client instance
        """
        self.logger = get_logger("state_manager")
        self.settings = get_settings()

        self.redis_client = redis_client
        self._redis_connected = False

        # Key prefixes
        self.agent_prefix = "agent:state:"
        self.task_prefix = "task:state:"
        self.workflow_prefix = "workflow:state:"

        # TTL settings (in seconds)
        self.agent_state_ttl = 86400  # 24 hours
        self.task_state_ttl = 604800  # 7 days
        self.workflow_state_ttl = 2592000  # 30 days

    async def connect(self) -> None:
        """Connect to Redis."""
        if not self.redis_client:
            try:
                self.redis_client = await redis.from_url(
                    self.settings.redis_url,
                    password=self.settings.redis_password,
                    db=self.settings.redis_db,
                    decode_responses=True,
                )
                self._redis_connected = True
                self.logger.info("Connected to Redis for state management")
            except Exception as e:
                self.logger.error(f"Failed to connect to Redis: {e}")
                self._redis_connected = False

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.redis_client and self._redis_connected:
            await self.redis_client.close()
            self._redis_connected = False
            self.logger.info("Disconnected from Redis")

    # Agent State Management

    async def save_agent_state(self, state: AgentState) -> None:
        """
        Save agent state.

        Args:
            state: Agent state to save
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.agent_prefix}{state.agent_id}"
            data = state.model_dump_json()

            await self.redis_client.setex(
                key,
                self.agent_state_ttl,
                data,
            )

            self.logger.debug(f"Saved agent state: {state.agent_id}")

        except Exception as e:
            self.logger.error(f"Failed to save agent state: {e}")

    async def get_agent_state(self, agent_id: str) -> Optional[AgentState]:
        """
        Get agent state.

        Args:
            agent_id: Agent ID

        Returns:
            Optional[AgentState]: Agent state if exists
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.agent_prefix}{agent_id}"
            data = await self.redis_client.get(key)

            if data:
                return AgentState.model_validate_json(data)

            return None

        except Exception as e:
            self.logger.error(f"Failed to get agent state: {e}")
            return None

    async def delete_agent_state(self, agent_id: str) -> None:
        """
        Delete agent state.

        Args:
            agent_id: Agent ID
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.agent_prefix}{agent_id}"
            await self.redis_client.delete(key)

            self.logger.debug(f"Deleted agent state: {agent_id}")

        except Exception as e:
            self.logger.error(f"Failed to delete agent state: {e}")

    # Task State Management

    async def save_task_state(self, state: TaskState) -> None:
        """
        Save task state.

        Args:
            state: Task state to save
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.task_prefix}{state.task_id}"
            data = state.model_dump_json()

            await self.redis_client.setex(
                key,
                self.task_state_ttl,
                data,
            )

            self.logger.debug(f"Saved task state: {state.task_id}")

        except Exception as e:
            self.logger.error(f"Failed to save task state: {e}")

    async def get_task_state(self, task_id: str) -> Optional[TaskState]:
        """
        Get task state.

        Args:
            task_id: Task ID

        Returns:
            Optional[TaskState]: Task state if exists
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.task_prefix}{task_id}"
            data = await self.redis_client.get(key)

            if data:
                return TaskState.model_validate_json(data)

            return None

        except Exception as e:
            self.logger.error(f"Failed to get task state: {e}")
            return None

    async def delete_task_state(self, task_id: str) -> None:
        """
        Delete task state.

        Args:
            task_id: Task ID
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.task_prefix}{task_id}"
            await self.redis_client.delete(key)

            self.logger.debug(f"Deleted task state: {task_id}")

        except Exception as e:
            self.logger.error(f"Failed to delete task state: {e}")

    # Workflow State Management

    async def save_workflow_state(self, state: WorkflowState) -> None:
        """
        Save workflow state.

        Args:
            state: Workflow state to save
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.workflow_prefix}{state.workflow_id}"
            data = state.model_dump_json()

            await self.redis_client.setex(
                key,
                self.workflow_state_ttl,
                data,
            )

            self.logger.debug(f"Saved workflow state: {state.workflow_id}")

        except Exception as e:
            self.logger.error(f"Failed to save workflow state: {e}")

    async def get_workflow_state(self, workflow_id: str) -> Optional[WorkflowState]:
        """
        Get workflow state.

        Args:
            workflow_id: Workflow ID

        Returns:
            Optional[WorkflowState]: Workflow state if exists
        """
        try:
            if not self._redis_connected:
                await self.connect()

            key = f"{self.workflow_prefix}{workflow_id}"
            data = await self.redis_client.get(key)

            if data:
                return WorkflowState.model_validate_json(data)

            return None

        except Exception as e:
            self.logger.error(f"Failed to get workflow state: {e}")
            return None

    async def get_all_agent_states(self) -> List[AgentState]:
        """
        Get all agent states.

        Returns:
            List[AgentState]: List of all agent states
        """
        try:
            if not self._redis_connected:
                await self.connect()

            pattern = f"{self.agent_prefix}*"
            keys = await self.redis_client.keys(pattern)

            states = []
            for key in keys:
                data = await self.redis_client.get(key)
                if data:
                    states.append(AgentState.model_validate_json(data))

            return states

        except Exception as e:
            self.logger.error(f"Failed to get all agent states: {e}")
            return []

    async def clear_all_states(self) -> None:
        """Clear all stored states."""
        try:
            if not self._redis_connected:
                await self.connect()

            patterns = [
                f"{self.agent_prefix}*",
                f"{self.task_prefix}*",
                f"{self.workflow_prefix}*",
            ]

            for pattern in patterns:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)

            self.logger.info("Cleared all stored states")

        except Exception as e:
            self.logger.error(f"Failed to clear states: {e}")
