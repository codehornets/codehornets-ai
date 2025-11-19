"""
Pydantic schemas for agent-related API operations.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class AgentBase(BaseModel):
    """Base agent schema with common fields."""
    name: str = Field(..., description="Agent name")
    domain: str = Field(..., description="Agent domain (offer, marketing, sales, etc.)")
    role: str = Field(..., description="Agent role/responsibility")
    capabilities: List[str] = Field(default=[], description="List of agent capabilities")
    model: Optional[str] = Field(default="gpt-4", description="LLM model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0, description="Model temperature")
    tools: Optional[List[str]] = Field(default=[], description="Available tools for agent")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")


class AgentCreate(AgentBase):
    """Schema for creating a new agent."""
    pass


class AgentUpdate(BaseModel):
    """Schema for updating an existing agent."""
    name: Optional[str] = None
    role: Optional[str] = None
    capabilities: Optional[List[str]] = None
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    tools: Optional[List[str]] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AgentResponse(AgentBase):
    """Schema for agent response."""
    agent_id: str = Field(..., description="Unique agent identifier")
    status: str = Field(..., description="Agent status (active, inactive, error)")
    created_at: str = Field(..., description="ISO timestamp of creation")
    updated_at: str = Field(..., description="ISO timestamp of last update")

    class Config:
        json_schema_extra = {
            "example": {
                "agent_id": "agent_1_1234567890",
                "name": "Marketing Campaign Creator",
                "domain": "marketing",
                "role": "Create and optimize marketing campaigns",
                "capabilities": ["campaign_creation", "audience_targeting", "content_generation"],
                "model": "gpt-4",
                "temperature": 0.7,
                "tools": ["web_search", "image_generation"],
                "status": "active",
                "created_at": "2025-01-15T10:00:00Z",
                "updated_at": "2025-01-15T10:00:00Z",
                "metadata": {}
            }
        }


class AgentStatus(BaseModel):
    """Schema for agent status response."""
    agent_id: str
    status: str
    message: Optional[str] = None


class AgentListResponse(BaseModel):
    """Schema for paginated agent list response."""
    agents: List[AgentResponse]
    total: int = Field(..., description="Total number of agents")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum number of records returned")
