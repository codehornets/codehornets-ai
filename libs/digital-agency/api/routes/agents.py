"""
Agent management API routes.
"""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Optional
from datetime import datetime

from api.schemas.agent_schemas import (
    AgentResponse,
    AgentCreate,
    AgentUpdate,
    AgentStatus,
    AgentListResponse
)

router = APIRouter()


# In-memory storage for demo (replace with database)
agents_db = {}


@router.get("/", response_model=AgentListResponse)
async def list_agents(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    status: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
):
    """
    List all agents with optional filtering and pagination.
    """
    agents = list(agents_db.values())

    # Apply filters
    if domain:
        agents = [a for a in agents if a.get('domain') == domain]

    if status:
        agents = [a for a in agents if a.get('status') == status]

    # Apply pagination
    total = len(agents)
    agents = agents[skip:skip + limit]

    return {
        "agents": agents,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str = Path(..., description="Agent ID")
):
    """
    Get a specific agent by ID.
    """
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    return agents_db[agent_id]


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(agent: AgentCreate):
    """
    Create a new agent.
    """
    agent_id = f"agent_{len(agents_db) + 1}_{int(datetime.utcnow().timestamp())}"

    new_agent = {
        "agent_id": agent_id,
        "name": agent.name,
        "domain": agent.domain,
        "role": agent.role,
        "capabilities": agent.capabilities,
        "model": agent.model or "gpt-4",
        "temperature": agent.temperature or 0.7,
        "tools": agent.tools or [],
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "metadata": agent.metadata or {}
    }

    agents_db[agent_id] = new_agent
    return new_agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_update: AgentUpdate
):
    """
    Update an existing agent.
    """
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    agent = agents_db[agent_id]

    # Update fields if provided
    update_data = agent_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            agent[field] = value

    agent["updated_at"] = datetime.utcnow().isoformat()
    agents_db[agent_id] = agent

    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str):
    """
    Delete an agent.
    """
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    del agents_db[agent_id]
    return None


@router.post("/{agent_id}/activate", response_model=AgentStatus)
async def activate_agent(agent_id: str):
    """
    Activate an agent.
    """
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    agents_db[agent_id]["status"] = "active"
    agents_db[agent_id]["updated_at"] = datetime.utcnow().isoformat()

    return {
        "agent_id": agent_id,
        "status": "active",
        "message": "Agent activated successfully"
    }


@router.post("/{agent_id}/deactivate", response_model=AgentStatus)
async def deactivate_agent(agent_id: str):
    """
    Deactivate an agent.
    """
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    agents_db[agent_id]["status"] = "inactive"
    agents_db[agent_id]["updated_at"] = datetime.utcnow().isoformat()

    return {
        "agent_id": agent_id,
        "status": "inactive",
        "message": "Agent deactivated successfully"
    }


@router.get("/{agent_id}/metrics")
async def get_agent_metrics(agent_id: str):
    """
    Get performance metrics for an agent.
    """
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    # Mock metrics (replace with actual metrics from monitoring system)
    return {
        "agent_id": agent_id,
        "metrics": {
            "total_tasks": 42,
            "completed_tasks": 38,
            "failed_tasks": 2,
            "pending_tasks": 2,
            "success_rate": 0.95,
            "avg_completion_time": 125.5,
            "total_tokens_used": 15420,
            "last_active": datetime.utcnow().isoformat()
        }
    }
