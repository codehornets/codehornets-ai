"""
Pydantic schemas for task-related API operations.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime


class TaskBase(BaseModel):
    """Base task schema with common fields."""
    agent_id: str = Field(..., description="ID of agent to execute task")
    type: str = Field(..., description="Task type")
    description: str = Field(..., description="Task description")
    input_data: Optional[Dict[str, Any]] = Field(default={}, description="Input data for task")
    priority: Optional[str] = Field(default="medium", description="Task priority (low, medium, high, urgent)")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    execute_immediately: Optional[bool] = Field(default=False, description="Execute task immediately")


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""
    agent_id: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class TaskResponse(TaskBase):
    """Schema for task response."""
    task_id: str = Field(..., description="Unique task identifier")
    status: str = Field(..., description="Task status (pending, running, completed, failed, cancelled)")
    result: Optional[Dict[str, Any]] = Field(None, description="Task result data")
    error: Optional[str] = Field(None, description="Error message if task failed")
    created_at: str = Field(..., description="ISO timestamp of creation")
    updated_at: str = Field(..., description="ISO timestamp of last update")
    started_at: Optional[str] = Field(None, description="ISO timestamp when task started")
    completed_at: Optional[str] = Field(None, description="ISO timestamp when task completed")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "task_1_1234567890",
                "agent_id": "agent_1_1234567890",
                "type": "campaign_creation",
                "description": "Create marketing campaign for new product launch",
                "input_data": {
                    "product_name": "Widget Pro",
                    "target_audience": "Tech professionals"
                },
                "priority": "high",
                "status": "completed",
                "result": {
                    "success": True,
                    "campaign_id": "camp_123",
                    "output": "Campaign created successfully"
                },
                "error": None,
                "created_at": "2025-01-15T10:00:00Z",
                "updated_at": "2025-01-15T10:05:00Z",
                "started_at": "2025-01-15T10:01:00Z",
                "completed_at": "2025-01-15T10:05:00Z",
                "metadata": {}
            }
        }


class TaskStatus(BaseModel):
    """Schema for task status response."""
    task_id: str
    status: str
    message: Optional[str] = None


class TaskListResponse(BaseModel):
    """Schema for paginated task list response."""
    tasks: List[TaskResponse]
    total: int = Field(..., description="Total number of tasks")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum number of records returned")
