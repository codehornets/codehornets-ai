"""
Prompt templates and system prompts module.

Provides reusable prompt templates and system prompts for agents
across all domains.
"""

from .templates import PromptTemplate, PromptRegistry, get_prompt
from .system_prompts import (
    SystemPromptBuilder,
    get_system_prompt,
    AGENT_ROLE_PROMPTS,
    TASK_TYPE_PROMPTS,
)

__all__ = [
    "PromptTemplate",
    "PromptRegistry",
    "get_prompt",
    "SystemPromptBuilder",
    "get_system_prompt",
    "AGENT_ROLE_PROMPTS",
    "TASK_TYPE_PROMPTS",
]
