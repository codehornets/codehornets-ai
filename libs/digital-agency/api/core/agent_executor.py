"""
Agent executor for loading and running agents dynamically.
"""

import importlib.util
import sys
import asyncio
import logging
import time
import inspect
from pathlib import Path
from typing import Any, Dict, Optional, AsyncGenerator
from contextlib import asynccontextmanager

from .agent_discovery import AgentDiscovery, AgentMetadata
from .exceptions import (
    AgentNotFoundError,
    AgentExecutionError,
    AgentValidationError,
    AgentTimeoutError,
    AgentLoadError
)

logger = logging.getLogger(__name__)


class AgentExecutor:
    """
    Dynamically loads and executes agents from the agents directory.

    Provides synchronous and streaming execution modes with timeout handling,
    input validation, and comprehensive error handling.
    """

    def __init__(self, discovery: Optional[AgentDiscovery] = None):
        """
        Initialize agent executor.

        Args:
            discovery: AgentDiscovery instance. Creates new one if not provided.
        """
        self.discovery = discovery or AgentDiscovery()
        self._agent_cache: Dict[str, Any] = {}
        logger.info("AgentExecutor initialized")

    def load_agent(self, domain: str, agent_name: str, use_cache: bool = True) -> Any:
        """
        Dynamically load an agent module and instantiate the agent class.

        Args:
            domain: Domain name (e.g., 'offer', 'marketing')
            agent_name: Agent name (e.g., 'proposal_writer')
            use_cache: Use cached agent instance if available

        Returns:
            Instantiated agent object

        Raises:
            AgentNotFoundError: If agent doesn't exist
            AgentLoadError: If agent module can't be loaded
        """
        cache_key = f"{domain}/{agent_name}"

        # Return cached agent if available
        if use_cache and cache_key in self._agent_cache:
            logger.debug(f"Using cached agent: {cache_key}")
            return self._agent_cache[cache_key]

        # Get agent metadata
        metadata = self.discovery.get_agent_metadata(domain, agent_name)
        if not metadata:
            raise AgentNotFoundError(domain, agent_name)

        try:
            # Load the module dynamically
            module_name = f"agent_{domain}_{agent_name}"
            spec = importlib.util.spec_from_file_location(module_name, metadata.agent_path)

            if spec is None or spec.loader is None:
                raise AgentLoadError(
                    domain,
                    agent_name,
                    f"Failed to create module spec from {metadata.agent_path}"
                )

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)

            # Find the agent class
            agent_class = self._find_agent_class(module, agent_name)

            if agent_class is None:
                raise AgentLoadError(
                    domain,
                    agent_name,
                    f"No suitable agent class found in {metadata.agent_path}"
                )

            # Instantiate the agent
            agent_instance = agent_class()

            # Cache the agent
            if use_cache:
                self._agent_cache[cache_key] = agent_instance

            logger.info(f"Successfully loaded agent: {cache_key}")
            return agent_instance

        except (AgentNotFoundError, AgentLoadError):
            raise
        except Exception as e:
            logger.error(f"Error loading agent {cache_key}: {e}", exc_info=True)
            raise AgentLoadError(domain, agent_name, str(e))

    async def execute(
        self,
        domain: str,
        agent_name: str,
        input_data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute an agent with input data.

        Args:
            domain: Domain name
            agent_name: Agent name
            input_data: Input data for agent execution
            config: Optional configuration overrides
            timeout: Execution timeout in seconds (default: 300)

        Returns:
            Execution result containing success, output, logs, metrics, and error

        Raises:
            AgentNotFoundError: If agent doesn't exist
            AgentExecutionError: If execution fails
            AgentTimeoutError: If execution times out
            AgentValidationError: If input validation fails
        """
        start_time = time.time()
        timeout = timeout or 300
        logs = []

        logger.info(f"Executing agent {domain}/{agent_name}")

        try:
            # Load agent
            agent = self.load_agent(domain, agent_name)

            # Validate input
            validation_errors = self.validate_input(agent, input_data)
            if validation_errors:
                raise AgentValidationError(agent_name, validation_errors)

            # Prepare execution
            logs.append(f"Agent loaded: {agent.__class__.__name__}")
            logs.append(f"Input data keys: {list(input_data.keys())}")

            # Execute with timeout
            try:
                output = await asyncio.wait_for(
                    self._execute_agent_method(agent, input_data, config),
                    timeout=timeout
                )
                success = True
                error = None

            except asyncio.TimeoutError:
                raise AgentTimeoutError(agent_name, timeout)

            execution_time = time.time() - start_time
            logs.append(f"Execution completed in {execution_time:.2f}s")

            # Build result
            result = {
                "success": success,
                "output": output,
                "logs": logs,
                "metrics": {
                    "execution_time_seconds": round(execution_time, 3),
                    "agent_name": agent_name,
                    "domain": domain,
                    "timestamp": time.time()
                },
                "error": error
            }

            logger.info(f"Agent execution completed successfully in {execution_time:.2f}s")
            return result

        except (AgentNotFoundError, AgentValidationError, AgentTimeoutError):
            raise
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Agent execution failed: {e}", exc_info=True)

            return {
                "success": False,
                "output": None,
                "logs": logs + [f"Error: {str(e)}"],
                "metrics": {
                    "execution_time_seconds": round(execution_time, 3),
                    "agent_name": agent_name,
                    "domain": domain,
                    "timestamp": time.time()
                },
                "error": {
                    "type": type(e).__name__,
                    "message": str(e),
                    "traceback": None  # Can add traceback in debug mode
                }
            }

    async def stream_execute(
        self,
        domain: str,
        agent_name: str,
        input_data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        timeout: Optional[int] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Execute agent with streaming progress updates via Server-Sent Events.

        Args:
            domain: Domain name
            agent_name: Agent name
            input_data: Input data for agent execution
            config: Optional configuration overrides
            timeout: Execution timeout in seconds

        Yields:
            Progress updates as dictionaries with event type and data

        Raises:
            AgentNotFoundError: If agent doesn't exist
            AgentExecutionError: If execution fails
            AgentTimeoutError: If execution times out
        """
        start_time = time.time()
        timeout = timeout or 300

        try:
            # Yield start event
            yield {
                "event": "start",
                "data": {
                    "agent": agent_name,
                    "domain": domain,
                    "timestamp": time.time()
                }
            }

            # Load agent
            agent = self.load_agent(domain, agent_name)

            yield {
                "event": "log",
                "data": {"message": f"Agent loaded: {agent.__class__.__name__}"}
            }

            # Validate input
            validation_errors = self.validate_input(agent, input_data)
            if validation_errors:
                yield {
                    "event": "error",
                    "data": {
                        "type": "validation_error",
                        "message": "Input validation failed",
                        "errors": validation_errors
                    }
                }
                return

            yield {
                "event": "log",
                "data": {"message": "Input validation passed"}
            }

            # Execute
            yield {
                "event": "progress",
                "data": {"status": "executing", "progress": 50}
            }

            try:
                output = await asyncio.wait_for(
                    self._execute_agent_method(agent, input_data, config),
                    timeout=timeout
                )

                execution_time = time.time() - start_time

                yield {
                    "event": "progress",
                    "data": {"status": "completed", "progress": 100}
                }

                yield {
                    "event": "result",
                    "data": {
                        "success": True,
                        "output": output,
                        "execution_time": round(execution_time, 3)
                    }
                }

                yield {
                    "event": "complete",
                    "data": {
                        "success": True,
                        "execution_time": round(execution_time, 3)
                    }
                }

            except asyncio.TimeoutError:
                yield {
                    "event": "error",
                    "data": {
                        "type": "timeout",
                        "message": f"Execution timed out after {timeout}s"
                    }
                }

        except Exception as e:
            logger.error(f"Stream execution error: {e}", exc_info=True)
            yield {
                "event": "error",
                "data": {
                    "type": type(e).__name__,
                    "message": str(e)
                }
            }

    def validate_input(self, agent: Any, input_data: Dict[str, Any]) -> list:
        """
        Validate input data for agent execution.

        Args:
            agent: Agent instance
            input_data: Input data to validate

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        # Check if agent has input schema or validation method
        if hasattr(agent, 'input_schema'):
            # Validate against schema
            try:
                schema = agent.input_schema
                # Simple schema validation (can be extended with pydantic)
                if isinstance(schema, dict):
                    required_fields = schema.get('required', [])
                    for field in required_fields:
                        if field not in input_data:
                            errors.append(f"Missing required field: {field}")
            except Exception as e:
                logger.warning(f"Schema validation failed: {e}")

        elif hasattr(agent, 'validate_input'):
            # Use agent's validation method
            try:
                validation_result = agent.validate_input(input_data)
                if isinstance(validation_result, list):
                    errors.extend(validation_result)
                elif validation_result is False:
                    errors.append("Input validation failed")
            except Exception as e:
                errors.append(f"Validation error: {str(e)}")

        return errors

    async def _execute_agent_method(
        self,
        agent: Any,
        input_data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None
    ) -> Any:
        """
        Execute the appropriate agent method based on available methods.

        Args:
            agent: Agent instance
            input_data: Input data
            config: Optional configuration

        Returns:
            Agent execution output
        """
        # Determine execution method
        if hasattr(agent, 'execute'):
            method = agent.execute
        elif hasattr(agent, 'run'):
            method = agent.run
        elif hasattr(agent, 'process'):
            method = agent.process
        else:
            # Try to find the first public method that's not __init__
            for name, method_obj in inspect.getmembers(agent, predicate=inspect.ismethod):
                if not name.startswith('_') and name not in ['validate_input']:
                    method = method_obj
                    break
            else:
                raise AgentExecutionError(
                    agent.__class__.__name__,
                    "No suitable execution method found (expected: execute, run, or process)"
                )

        # Execute the method
        if asyncio.iscoroutinefunction(method):
            # Async method
            if config:
                result = await method(input_data, config=config)
            else:
                result = await method(input_data)
        else:
            # Sync method - run in executor
            loop = asyncio.get_event_loop()
            if config:
                result = await loop.run_in_executor(None, lambda: method(input_data, config=config))
            else:
                result = await loop.run_in_executor(None, lambda: method(input_data))

        return result

    def _find_agent_class(self, module: Any, agent_name: str) -> Optional[type]:
        """
        Find the agent class in the loaded module.

        Looks for:
        1. Class with name matching CamelCase version of agent_name + 'Agent'
        2. Any class ending with 'Agent'
        3. First class that's not a base class

        Args:
            module: Loaded module
            agent_name: Agent name

        Returns:
            Agent class or None
        """
        # Convert agent_name to CamelCase (e.g., 'proposal_writer' -> 'ProposalWriterAgent')
        expected_class_name = ''.join(word.capitalize() for word in agent_name.split('_')) + 'Agent'

        # Try exact match first
        if hasattr(module, expected_class_name):
            return getattr(module, expected_class_name)

        # Try finding any class ending with 'Agent'
        for name in dir(module):
            if name.endswith('Agent') and not name.startswith('_'):
                obj = getattr(module, name)
                if inspect.isclass(obj):
                    return obj

        # Fallback: find first non-base class
        for name in dir(module):
            if not name.startswith('_'):
                obj = getattr(module, name)
                if inspect.isclass(obj) and name not in ['ABC', 'BaseModel', 'Enum']:
                    return obj

        return None

    def clear_cache(self, domain: Optional[str] = None, agent_name: Optional[str] = None):
        """
        Clear cached agent instances.

        Args:
            domain: Clear specific domain (optional)
            agent_name: Clear specific agent (requires domain)
        """
        if domain and agent_name:
            cache_key = f"{domain}/{agent_name}"
            if cache_key in self._agent_cache:
                del self._agent_cache[cache_key]
                logger.info(f"Cleared cache for {cache_key}")
        elif domain:
            keys_to_remove = [k for k in self._agent_cache.keys() if k.startswith(f"{domain}/")]
            for key in keys_to_remove:
                del self._agent_cache[key]
            logger.info(f"Cleared cache for domain {domain}: {len(keys_to_remove)} agents")
        else:
            count = len(self._agent_cache)
            self._agent_cache.clear()
            logger.info(f"Cleared all cached agents: {count} agents")

    def get_agent_info(self, domain: str, agent_name: str) -> Dict[str, Any]:
        """
        Get comprehensive information about an agent.

        Args:
            domain: Domain name
            agent_name: Agent name

        Returns:
            Agent information dictionary

        Raises:
            AgentNotFoundError: If agent doesn't exist
        """
        metadata = self.discovery.get_agent_metadata(domain, agent_name)
        if not metadata:
            raise AgentNotFoundError(domain, agent_name)

        # Try to load agent to get additional info
        try:
            agent = self.load_agent(domain, agent_name, use_cache=False)

            # Extract methods
            methods = [
                name for name, _ in inspect.getmembers(agent, predicate=inspect.ismethod)
                if not name.startswith('_')
            ]

            # Extract attributes
            attributes = {
                k: type(v).__name__ for k, v in vars(agent).items()
                if not k.startswith('_')
            }

            return {
                "domain": metadata.domain,
                "agent_name": metadata.agent_name,
                "name": metadata.name,
                "version": metadata.version,
                "description": metadata.description,
                "capabilities": metadata.capabilities,
                "parameters": metadata.parameters,
                "integrations": metadata.integrations,
                "class_name": agent.__class__.__name__,
                "methods": methods,
                "attributes": attributes,
                "agent_path": metadata.agent_path,
                "config_path": metadata.config_path
            }

        except Exception as e:
            logger.warning(f"Could not load agent for detailed info: {e}")
            return {
                "domain": metadata.domain,
                "agent_name": metadata.agent_name,
                "name": metadata.name,
                "version": metadata.version,
                "description": metadata.description,
                "capabilities": metadata.capabilities,
                "parameters": metadata.parameters,
                "integrations": metadata.integrations,
                "agent_path": metadata.agent_path,
                "config_path": metadata.config_path
            }
