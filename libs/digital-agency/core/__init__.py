"""
Core framework for multi-agent orchestration.

This module provides the foundational classes and utilities for building,
managing, and coordinating AI agents in the Digital Agency platform.

Key components:
- AgentBase: Base class for all agents with lifecycle management
- TaskBase: Base class for task definitions
- Orchestrator: Coordinates agent execution and workflows
- Communication: Inter-agent messaging system
- StateManager: Manages agent and task state
- Logger: Centralized logging infrastructure
"""

from .agent_base import AgentBase, AgentStatus, AgentCapability
from .task_base import TaskBase, TaskStatus, TaskPriority, TaskResult
from .orchestrator import Orchestrator, WorkflowEngine
from .communication import MessageBus, Message, MessageType
from .state_manager import StateManager, AgentState, TaskState
from .logger import setup_logger, get_logger, log_agent_action

__all__ = [
    "AgentBase",
    "AgentStatus",
    "AgentCapability",
    "TaskBase",
    "TaskStatus",
    "TaskPriority",
    "TaskResult",
    "Orchestrator",
    "WorkflowEngine",
    "MessageBus",
    "Message",
    "MessageType",
    "StateManager",
    "AgentState",
    "TaskState",
    "setup_logger",
    "get_logger",
    "log_agent_action",
]
