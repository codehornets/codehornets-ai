"""
Database module.

Provides database models, connections, and migration support
for the digital agency platform.
"""

from .models import Base, Agent, Task, Workflow, Contact, Deal, Campaign
from .connection import Database, get_database, init_database

__all__ = [
    "Base",
    "Agent",
    "Task",
    "Workflow",
    "Contact",
    "Deal",
    "Campaign",
    "Database",
    "get_database",
    "init_database",
]
