"""
Task management API routes.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Optional
from datetime import datetime

from api.schemas.task_schemas import (
    TaskResponse,
    TaskCreate,
    TaskUpdate,
    TaskStatus,
    TaskListResponse
)

router = APIRouter()


# In-memory storage for demo (replace with database)
tasks_db = {}


@router.get("/", response_model=TaskListResponse)
async def list_tasks(
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
):
    """
    List all tasks with optional filtering and pagination.
    """
    tasks = list(tasks_db.values())

    # Apply filters
    if agent_id:
        tasks = [t for t in tasks if t.get('agent_id') == agent_id]

    if status:
        tasks = [t for t in tasks if t.get('status') == status]

    if priority:
        tasks = [t for t in tasks if t.get('priority') == priority]

    # Apply pagination
    total = len(tasks)
    tasks = tasks[skip:skip + limit]

    return {
        "tasks": tasks,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """
    Get a specific task by ID.
    """
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    return tasks_db[task_id]


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(task: TaskCreate, background_tasks: BackgroundTasks):
    """
    Create a new task.
    """
    task_id = f"task_{len(tasks_db) + 1}_{int(datetime.utcnow().timestamp())}"

    new_task = {
        "task_id": task_id,
        "agent_id": task.agent_id,
        "type": task.type,
        "description": task.description,
        "input_data": task.input_data or {},
        "priority": task.priority or "medium",
        "status": "pending",
        "result": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "completed_at": None,
        "metadata": task.metadata or {}
    }

    tasks_db[task_id] = new_task

    # Optionally process task in background
    if task.execute_immediately:
        background_tasks.add_task(execute_task_async, task_id)

    return new_task


async def execute_task_async(task_id: str):
    """
    Execute task asynchronously (placeholder implementation).
    """
    import asyncio

    if task_id not in tasks_db:
        return

    task = tasks_db[task_id]
    task["status"] = "running"
    task["started_at"] = datetime.utcnow().isoformat()
    task["updated_at"] = datetime.utcnow().isoformat()

    try:
        # Simulate task execution
        await asyncio.sleep(2)

        # Mock result
        task["status"] = "completed"
        task["result"] = {
            "success": True,
            "output": "Task completed successfully",
            "data": {}
        }
        task["completed_at"] = datetime.utcnow().isoformat()
        task["updated_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        task["status"] = "failed"
        task["error"] = str(e)
        task["completed_at"] = datetime.utcnow().isoformat()
        task["updated_at"] = datetime.utcnow().isoformat()


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate):
    """
    Update an existing task.
    """
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    task = tasks_db[task_id]

    # Update fields if provided
    update_data = task_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            task[field] = value

    task["updated_at"] = datetime.utcnow().isoformat()
    tasks_db[task_id] = task

    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str):
    """
    Delete a task.
    """
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    # Only allow deletion of completed or failed tasks
    if tasks_db[task_id]["status"] in ["running", "pending"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete running or pending task"
        )

    del tasks_db[task_id]
    return None


@router.post("/{task_id}/execute", response_model=TaskStatus)
async def execute_task(task_id: str, background_tasks: BackgroundTasks):
    """
    Execute a pending task.
    """
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    task = tasks_db[task_id]

    if task["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Task is not in pending state (current: {task['status']})"
        )

    # Execute task in background
    background_tasks.add_task(execute_task_async, task_id)

    return {
        "task_id": task_id,
        "status": "running",
        "message": "Task execution started"
    }


@router.post("/{task_id}/cancel", response_model=TaskStatus)
async def cancel_task(task_id: str):
    """
    Cancel a running task.
    """
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    task = tasks_db[task_id]

    if task["status"] not in ["pending", "running"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel task in {task['status']} state"
        )

    task["status"] = "cancelled"
    task["updated_at"] = datetime.utcnow().isoformat()
    task["completed_at"] = datetime.utcnow().isoformat()

    return {
        "task_id": task_id,
        "status": "cancelled",
        "message": "Task cancelled successfully"
    }


@router.post("/{task_id}/retry", response_model=TaskResponse)
async def retry_task(task_id: str, background_tasks: BackgroundTasks):
    """
    Retry a failed task.
    """
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")

    task = tasks_db[task_id]

    if task["status"] != "failed":
        raise HTTPException(
            status_code=400,
            detail=f"Only failed tasks can be retried (current: {task['status']})"
        )

    # Reset task state
    task["status"] = "pending"
    task["result"] = None
    task["error"] = None
    task["started_at"] = None
    task["completed_at"] = None
    task["updated_at"] = datetime.utcnow().isoformat()

    # Execute task in background
    background_tasks.add_task(execute_task_async, task_id)

    return task
