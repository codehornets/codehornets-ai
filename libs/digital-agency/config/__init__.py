"""
Configuration module for Digital Agency AI Platform.

This module provides centralized configuration management, including:
- Application settings and environment variables
- API key management with encryption
- Domain and agent registry definitions
- Database and service configurations
"""

from .settings import Settings, get_settings
from .api_keys import APIKeyManager, get_api_key_manager
# TODO: Implement domain and agent registries
# from .domains import DomainRegistry, get_domain_registry
# from .agents import AgentRegistry, get_agent_registry

__all__ = [
    "Settings",
    "get_settings",
    "APIKeyManager",
    "get_api_key_manager",
    # "DomainRegistry",
    # "get_domain_registry",
    # "AgentRegistry",
    # "get_agent_registry",
]
