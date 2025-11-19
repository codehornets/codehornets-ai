"""
Shared utilities and integrations.

This module provides common utilities, client integrations, prompt templates,
and database access that are used across all domains and agents.

Modules:
- utils: Common utility functions
- integrations: Third-party API clients
- prompts: System prompts and templates
- database: Database models and connections
"""

from . import utils
from . import integrations
from . import prompts
from . import database

__all__ = ["utils", "integrations", "prompts", "database"]
