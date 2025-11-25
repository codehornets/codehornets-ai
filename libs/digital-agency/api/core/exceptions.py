"""
Custom exceptions for agent operations.
"""


class AgentError(Exception):
    """Base exception for all agent-related errors."""
    pass


class AgentNotFoundError(AgentError):
    """Agent not found in the specified domain."""

    def __init__(self, domain: str, agent_name: str):
        self.domain = domain
        self.agent_name = agent_name
        super().__init__(f"Agent '{agent_name}' not found in domain '{domain}'")


class AgentExecutionError(AgentError):
    """Error during agent execution."""

    def __init__(self, agent_name: str, message: str, original_error: Exception = None):
        self.agent_name = agent_name
        self.original_error = original_error
        super().__init__(f"Execution error in agent '{agent_name}': {message}")


class AgentValidationError(AgentError):
    """Input validation error for agent."""

    def __init__(self, agent_name: str, validation_errors: list):
        self.agent_name = agent_name
        self.validation_errors = validation_errors
        super().__init__(f"Validation failed for agent '{agent_name}': {validation_errors}")


class AgentTimeoutError(AgentError):
    """Agent execution timeout."""

    def __init__(self, agent_name: str, timeout: int):
        self.agent_name = agent_name
        self.timeout = timeout
        super().__init__(f"Agent '{agent_name}' execution timed out after {timeout} seconds")


class AgentLoadError(AgentError):
    """Error loading agent module."""

    def __init__(self, domain: str, agent_name: str, message: str):
        self.domain = domain
        self.agent_name = agent_name
        super().__init__(f"Failed to load agent '{agent_name}' from domain '{domain}': {message}")
