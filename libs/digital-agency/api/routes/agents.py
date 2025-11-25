"""
Agent execution and discovery API routes.
"""

from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List, Optional
import logging
import time
import json

from api.schemas.agent_execution_schemas import (
    AgentExecuteRequest,
    AgentExecuteResponse,
    AgentInfo,
    AgentListResponse,
    DomainListResponse,
    AgentStreamEvent,
    AsyncTaskResponse
)
from api.core import AgentExecutor, AgentDiscovery
from api.core.exceptions import (
    AgentNotFoundError,
    AgentExecutionError,
    AgentValidationError,
    AgentTimeoutError
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize agent executor and discovery
agent_discovery = AgentDiscovery()
agent_executor = AgentExecutor(discovery=agent_discovery)



@router.get("/", response_model=AgentListResponse)
async def list_all_agents(
    capability: Optional[str] = Query(None, description="Filter by capability"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    name_contains: Optional[str] = Query(None, description="Filter by name substring")
):
    """
    List all available agents with optional filtering.

    This endpoint discovers and returns all agents from the agents directory.
    Agents are dynamically discovered based on the file system structure.
    """
    try:
        # Discover agents
        if capability or domain or name_contains:
            agents_metadata = agent_discovery.search_agents(
                capability=capability,
                domain=domain,
                name_contains=name_contains
            )
        else:
            agents_metadata = agent_discovery.list_all_agents()

        # Convert to response format
        agents = [
            AgentInfo(
                domain=agent.domain,
                agent_name=agent.agent_name,
                name=agent.name,
                version=agent.version,
                description=agent.description,
                capabilities=agent.capabilities,
                parameters=agent.parameters,
                integrations=agent.integrations,
                agent_path=agent.agent_path,
                config_path=agent.config_path
            )
            for agent in agents_metadata
        ]

        return AgentListResponse(
            agents=agents,
            total=len(agents),
            domain=domain
        )

    except Exception as e:
        logger.error(f"Error listing agents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")


@router.get("/domains", response_model=DomainListResponse)
async def list_domains():
    """
    List all available agent domains.

    Returns all domains that contain at least one agent.
    """
    try:
        domains = agent_discovery.list_domains()
        return DomainListResponse(
            domains=domains,
            total=len(domains)
        )

    except Exception as e:
        logger.error(f"Error listing domains: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list domains: {str(e)}")


@router.get("/{domain}", response_model=AgentListResponse)
async def list_domain_agents(
    domain: str = Path(..., description="Domain name (e.g., 'offer', 'marketing')")
):
    """
    List all agents in a specific domain.

    Example domains: offer, marketing, sales, fulfillment, feedback_loop, etc.
    """
    try:
        agents_metadata = agent_discovery.list_agents_in_domain(domain)

        if not agents_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"Domain '{domain}' not found or has no agents"
            )

        agents = [
            AgentInfo(
                domain=agent.domain,
                agent_name=agent.agent_name,
                name=agent.name,
                version=agent.version,
                description=agent.description,
                capabilities=agent.capabilities,
                parameters=agent.parameters,
                integrations=agent.integrations,
                agent_path=agent.agent_path,
                config_path=agent.config_path
            )
            for agent in agents_metadata
        ]

        return AgentListResponse(
            agents=agents,
            total=len(agents),
            domain=domain
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing agents for domain {domain}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")


@router.get("/{domain}/{agent_name}", response_model=AgentInfo)
async def get_agent_info(
    domain: str = Path(..., description="Domain name"),
    agent_name: str = Path(..., description="Agent name")
):
    """
    Get detailed information about a specific agent.

    Returns agent metadata, capabilities, and available methods.
    """
    try:
        info = agent_executor.get_agent_info(domain, agent_name)
        return AgentInfo(**info)

    except AgentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting agent info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get agent info: {str(e)}")


@router.post("/{domain}/{agent_name}/execute", response_model=AgentExecuteResponse)
async def execute_agent(
    domain: str = Path(..., description="Domain name"),
    agent_name: str = Path(..., description="Agent name"),
    request: AgentExecuteRequest = None
):
    """
    Execute an agent with input data.

    This endpoint loads the agent dynamically and executes it with the provided input.
    Returns the execution result including output, logs, and metrics.

    Example:
    ```
    POST /agents/offer/proposal_writer/execute
    {
      "input_data": {
        "client_info": {"name": "Acme Corp", "industry": "Technology"},
        "service_package": {"name": "Digital Transformation", "pricing": {"total": 50000}}
      },
      "timeout": 300
    }
    ```
    """
    try:
        result = await agent_executor.execute(
            domain=domain,
            agent_name=agent_name,
            input_data=request.input_data,
            config=request.config,
            timeout=request.timeout
        )

        return AgentExecuteResponse(**result)

    except AgentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AgentValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AgentTimeoutError as e:
        raise HTTPException(status_code=504, detail=str(e))
    except Exception as e:
        logger.error(f"Error executing agent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


@router.post("/{domain}/{agent_name}/stream")
async def stream_execute_agent(
    domain: str = Path(..., description="Domain name"),
    agent_name: str = Path(..., description="Agent name"),
    request: AgentExecuteRequest = None
):
    """
    Execute an agent with real-time streaming progress via Server-Sent Events.

    Returns a stream of events showing execution progress, logs, and results.

    Event types:
    - start: Execution started
    - log: Log message
    - progress: Progress update with percentage
    - result: Final result
    - complete: Execution completed
    - error: Error occurred

    Example response stream:
    ```
    event: start
    data: {"agent": "proposal_writer", "domain": "offer"}

    event: log
    data: {"message": "Agent loaded: ProposalWriterAgent"}

    event: progress
    data: {"status": "executing", "progress": 50}

    event: result
    data: {"success": true, "output": {...}}
    ```
    """

    async def event_generator():
        try:
            async for event in agent_executor.stream_execute(
                domain=domain,
                agent_name=agent_name,
                input_data=request.input_data,
                config=request.config,
                timeout=request.timeout
            ):
                # Format as Server-Sent Event
                yield f"event: {event['event']}\n"
                yield f"data: {json.dumps(event['data'])}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            error_event = {
                "event": "error",
                "data": {"type": "stream_error", "message": str(e)}
            }
            yield f"event: error\n"
            yield f"data: {json.dumps(error_event['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/{domain}/{agent_name}/async", response_model=AsyncTaskResponse)
async def async_execute_agent(
    domain: str = Path(..., description="Domain name"),
    agent_name: str = Path(..., description="Agent name"),
    request: AgentExecuteRequest = None,
    background_tasks: BackgroundTasks = None
):
    """
    Execute an agent asynchronously using Celery.

    Returns a task_id that can be used to poll for results via /tasks/{task_id}/status

    This is useful for long-running agents or when you need to queue execution.

    Example:
    ```
    POST /agents/offer/proposal_writer/async
    {
      "input_data": {...}
    }

    Response:
    {
      "task_id": "abc123-def456",
      "status": "PENDING",
      "agent": "offer/proposal_writer",
      "created_at": 1234567890.123
    }
    ```
    """
    try:
        from celery_app import app as celery_app

        # Submit task to Celery
        task = celery_app.send_task(
            'api.tasks.execute_agent_task',
            args=[domain, agent_name, request.input_data, request.config, request.timeout]
        )

        return AsyncTaskResponse(
            task_id=task.id,
            status="PENDING",
            agent=f"{domain}/{agent_name}",
            created_at=time.time()
        )

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Async execution not available (Celery not configured)"
        )
    except Exception as e:
        logger.error(f"Error creating async task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create async task: {str(e)}")


@router.delete("/{domain}/{agent_name}/cache", status_code=204)
async def clear_agent_cache(
    domain: str = Path(..., description="Domain name"),
    agent_name: str = Path(..., description="Agent name")
):
    """
    Clear cached agent instance.

    Forces the agent to be reloaded on next execution.
    Useful during development or after updating agent code.
    """
    try:
        agent_executor.clear_cache(domain=domain, agent_name=agent_name)
        return None

    except Exception as e:
        logger.error(f"Error clearing cache: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")
