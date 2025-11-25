"""
Pydantic schemas for agent execution operations.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime


class AgentExecuteRequest(BaseModel):
    """Request schema for agent execution."""
    input_data: Dict[str, Any] = Field(..., description="Input data for the agent")
    config: Optional[Dict[str, Any]] = Field(None, description="Optional configuration overrides")
    timeout: Optional[int] = Field(
        300,
        ge=1,
        le=3600,
        description="Execution timeout in seconds (1-3600)"
    )
    async_execution: bool = Field(
        False,
        description="Execute asynchronously via Celery"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "input_data": {
                    "client_info": {
                        "name": "Acme Corp",
                        "industry": "Technology"
                    },
                    "service_package": {
                        "name": "Digital Transformation",
                        "pricing": {"total": 50000}
                    }
                },
                "config": {
                    "temperature": 0.7
                },
                "timeout": 300,
                "async_execution": False
            }
        }


class AgentExecuteResponse(BaseModel):
    """Response schema for agent execution."""
    success: bool = Field(..., description="Whether execution was successful")
    output: Optional[Any] = Field(None, description="Agent output data")
    logs: List[str] = Field(default_factory=list, description="Execution logs")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Execution metrics")
    error: Optional[Dict[str, Any]] = Field(None, description="Error information if failed")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "output": {
                    "proposal_id": "prop_12345",
                    "sections": {},
                    "win_probability": 75.5
                },
                "logs": [
                    "Agent loaded: ProposalWriterAgent",
                    "Input data keys: ['client_info', 'service_package']",
                    "Execution completed in 2.45s"
                ],
                "metrics": {
                    "execution_time_seconds": 2.45,
                    "agent_name": "proposal_writer",
                    "domain": "offer",
                    "timestamp": 1234567890.123
                },
                "error": None
            }
        }


class AgentInfo(BaseModel):
    """Schema for agent information."""
    domain: str = Field(..., description="Agent domain")
    agent_name: str = Field(..., description="Agent identifier name")
    name: str = Field(..., description="Human-readable agent name")
    version: str = Field(..., description="Agent version")
    description: str = Field(..., description="Agent description")
    capabilities: List[str] = Field(default_factory=list, description="Agent capabilities")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Agent parameters")
    integrations: List[str] = Field(default_factory=list, description="Integration points")
    class_name: Optional[str] = Field(None, description="Python class name")
    methods: Optional[List[str]] = Field(None, description="Available methods")
    agent_path: Optional[str] = Field(None, description="File system path to agent")
    config_path: Optional[str] = Field(None, description="File system path to config")

    class Config:
        json_schema_extra = {
            "example": {
                "domain": "offer",
                "agent_name": "proposal_writer",
                "name": "Proposal Writer",
                "version": "0.1.0",
                "description": "Creates proposals, presentations, and sales materials",
                "capabilities": [
                    "proposal_creation",
                    "executive_summary_writing",
                    "case_study_development",
                    "presentation_design"
                ],
                "parameters": {
                    "writing_style": "professional_persuasive"
                },
                "integrations": [
                    "service_designer",
                    "pricing_strategist"
                ],
                "class_name": "ProposalWriterAgent",
                "methods": ["create_proposal", "generate_executive_summary"],
                "agent_path": "/path/to/agents/01_offer/proposal_writer/agent.py"
            }
        }


class AgentListResponse(BaseModel):
    """Response schema for agent listing."""
    agents: List[AgentInfo] = Field(..., description="List of agents")
    total: int = Field(..., description="Total number of agents")
    domain: Optional[str] = Field(None, description="Filtered domain (if applicable)")


class DomainListResponse(BaseModel):
    """Response schema for domain listing."""
    domains: List[str] = Field(..., description="List of available domains")
    total: int = Field(..., description="Total number of domains")


class AgentStreamEvent(BaseModel):
    """Schema for streaming event."""
    event: str = Field(..., description="Event type (start, log, progress, result, complete, error)")
    data: Dict[str, Any] = Field(..., description="Event data")

    class Config:
        json_schema_extra = {
            "example": {
                "event": "progress",
                "data": {
                    "status": "executing",
                    "progress": 50,
                    "message": "Processing request..."
                }
            }
        }


class AsyncTaskResponse(BaseModel):
    """Response schema for async task creation."""
    task_id: str = Field(..., description="Celery task ID")
    status: str = Field(..., description="Initial task status")
    agent: str = Field(..., description="Agent identifier")
    created_at: float = Field(..., description="Task creation timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "abc123-def456-ghi789",
                "status": "PENDING",
                "agent": "offer/proposal_writer",
                "created_at": 1234567890.123
            }
        }


class TaskStatusResponse(BaseModel):
    """Response schema for task status."""
    task_id: str = Field(..., description="Task ID")
    status: str = Field(..., description="Task status (PENDING, STARTED, SUCCESS, FAILURE, RETRY)")
    result: Optional[Any] = Field(None, description="Task result if completed")
    error: Optional[str] = Field(None, description="Error message if failed")
    progress: Optional[Dict[str, Any]] = Field(None, description="Progress information")
    created_at: Optional[float] = Field(None, description="Task creation time")
    started_at: Optional[float] = Field(None, description="Task start time")
    completed_at: Optional[float] = Field(None, description="Task completion time")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "abc123-def456-ghi789",
                "status": "SUCCESS",
                "result": {
                    "success": True,
                    "output": {"proposal_id": "prop_12345"}
                },
                "error": None,
                "completed_at": 1234567890.123
            }
        }
