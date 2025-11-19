"""
Base agent class with lifecycle management.

Provides the foundational Agent class that all domain-specific agents inherit from,
including initialization, execution, state management, and communication capabilities.
"""

import asyncio
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from pydantic import BaseModel, Field

from .logger import get_logger
from .communication import MessageBus, Message, MessageType
from .state_manager import StateManager, AgentState


class AgentStatus(str, Enum):
    """Agent execution status."""

    INITIALIZING = "initializing"
    IDLE = "idle"
    BUSY = "busy"
    WAITING = "waiting"
    ERROR = "error"
    STOPPED = "stopped"


class AgentCapability(BaseModel):
    """Represents a specific capability of an agent."""

    name: str
    description: str
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    estimated_duration_seconds: Optional[int] = None


class AgentConfig(BaseModel):
    """Configuration for an agent instance."""

    agent_id: str
    name: str
    domain: str
    type: str
    description: str
    capabilities: List[str] = Field(default_factory=list)
    model: str = "claude-sonnet-4-5-20250929"
    temperature: float = 0.7
    max_tokens: int = 4096
    system_prompt_template: Optional[str] = None
    tools: List[str] = Field(default_factory=list)
    max_concurrent_tasks: int = 5
    timeout_seconds: int = 300


class AgentBase(ABC):
    """
    Base class for all AI agents.

    Provides core functionality for agent lifecycle management, task execution,
    communication, and state persistence.
    """

    def __init__(
        self,
        config: AgentConfig,
        message_bus: Optional[MessageBus] = None,
        state_manager: Optional[StateManager] = None,
    ):
        """
        Initialize agent.

        Args:
            config: Agent configuration
            message_bus: Message bus for inter-agent communication
            state_manager: State manager for persistence
        """
        self.config = config
        self.agent_id = config.agent_id
        self.name = config.name
        self.domain = config.domain

        self.message_bus = message_bus or MessageBus()
        self.state_manager = state_manager or StateManager()
        self.logger = get_logger(f"agent.{self.agent_id}")

        self.status = AgentStatus.INITIALIZING
        self.current_tasks: Set[str] = set()
        self.completed_tasks: List[str] = []
        self.capabilities: Dict[str, AgentCapability] = {}

        self._initialized = False
        self._shutdown_event = asyncio.Event()

    async def initialize(self) -> None:
        """
        Initialize the agent.

        Performs setup operations including capability registration,
        state restoration, and message bus subscription.
        """
        try:
            self.logger.info(f"Initializing agent: {self.name}")

            # Register capabilities
            await self._register_capabilities()

            # Restore state if exists
            await self._restore_state()

            # Subscribe to message bus
            await self._subscribe_to_messages()

            # Perform custom initialization
            await self._custom_initialize()

            self.status = AgentStatus.IDLE
            self._initialized = True

            self.logger.info(f"Agent initialized successfully: {self.name}")

        except Exception as e:
            self.logger.error(f"Failed to initialize agent: {e}")
            self.status = AgentStatus.ERROR
            raise

    @abstractmethod
    async def _custom_initialize(self) -> None:
        """
        Custom initialization logic for specific agent types.

        Override this method to implement agent-specific initialization.
        """
        pass

    @abstractmethod
    async def execute_task(self, task: "TaskBase") -> "TaskResult":
        """
        Execute a task.

        Args:
            task: Task to execute

        Returns:
            TaskResult: Result of task execution
        """
        pass

    async def process_message(self, message: Message) -> None:
        """
        Process incoming message.

        Args:
            message: Message to process
        """
        self.logger.debug(f"Received message: {message.type} from {message.sender_id}")

        if message.type == MessageType.TASK_ASSIGNMENT:
            await self._handle_task_assignment(message)
        elif message.type == MessageType.TASK_CANCELLATION:
            await self._handle_task_cancellation(message)
        elif message.type == MessageType.STATUS_REQUEST:
            await self._handle_status_request(message)
        elif message.type == MessageType.SHUTDOWN:
            await self.shutdown()
        else:
            await self._handle_custom_message(message)

    async def _handle_task_assignment(self, message: Message) -> None:
        """Handle task assignment message."""
        task_data = message.payload.get("task")
        if task_data:
            self.logger.info(f"Task assigned: {task_data.get('task_id')}")
            # Task execution would be handled by orchestrator

    async def _handle_task_cancellation(self, message: Message) -> None:
        """Handle task cancellation message."""
        task_id = message.payload.get("task_id")
        if task_id in self.current_tasks:
            self.logger.info(f"Cancelling task: {task_id}")
            self.current_tasks.remove(task_id)

    async def _handle_status_request(self, message: Message) -> None:
        """Handle status request message."""
        status_data = self.get_status()
        response = Message(
            message_id=str(uuid4()),
            type=MessageType.STATUS_RESPONSE,
            sender_id=self.agent_id,
            receiver_id=message.sender_id,
            payload=status_data,
        )
        await self.message_bus.publish(response)

    @abstractmethod
    async def _handle_custom_message(self, message: Message) -> None:
        """
        Handle custom message types.

        Override this method to handle agent-specific message types.
        """
        pass

    def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status.

        Returns:
            Dict containing agent status information
        """
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "domain": self.domain,
            "status": self.status.value,
            "current_tasks": len(self.current_tasks),
            "completed_tasks": len(self.completed_tasks),
            "capabilities": list(self.capabilities.keys()),
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _register_capabilities(self) -> None:
        """Register agent capabilities."""
        # This would be implemented based on agent configuration
        self.logger.debug(f"Registering capabilities for {self.name}")

    async def _restore_state(self) -> None:
        """Restore agent state from persistence."""
        state = await self.state_manager.get_agent_state(self.agent_id)
        if state:
            self.logger.info(f"Restoring state for agent: {self.agent_id}")
            # Restore relevant state information

    async def _subscribe_to_messages(self) -> None:
        """Subscribe to relevant message topics."""
        topics = [
            f"agent.{self.agent_id}",
            f"domain.{self.domain}",
            "broadcast",
        ]
        for topic in topics:
            await self.message_bus.subscribe(topic, self.process_message)

    async def save_state(self) -> None:
        """Save current agent state."""
        state = AgentState(
            agent_id=self.agent_id,
            status=self.status.value,
            current_tasks=list(self.current_tasks),
            completed_tasks=self.completed_tasks,
            metadata=self.get_status(),
        )
        await self.state_manager.save_agent_state(state)

    async def shutdown(self) -> None:
        """
        Shutdown the agent gracefully.

        Completes current tasks, saves state, and unsubscribes from messages.
        """
        self.logger.info(f"Shutting down agent: {self.name}")
        self.status = AgentStatus.STOPPED

        # Wait for current tasks to complete
        if self.current_tasks:
            self.logger.info(f"Waiting for {len(self.current_tasks)} tasks to complete")
            # Implementation would wait for task completion

        # Save state
        await self.save_state()

        # Unsubscribe from messages
        # Implementation would unsubscribe from message bus

        self._shutdown_event.set()
        self.logger.info(f"Agent shutdown complete: {self.name}")

    def __repr__(self) -> str:
        """String representation of agent."""
        return f"<{self.__class__.__name__}(id={self.agent_id}, name={self.name}, status={self.status})>"
