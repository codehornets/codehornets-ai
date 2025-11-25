"""
Celery task status and management API routes.
"""

from fastapi import APIRouter, HTTPException, Path
import logging

from api.schemas.agent_execution_schemas import TaskStatusResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{task_id}/status", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str = Path(..., description="Celery task ID")
):
    """
    Get the status of an asynchronous task.

    Returns task status including:
    - PENDING: Task is waiting to be executed
    - STARTED: Task has been started
    - SUCCESS: Task completed successfully
    - FAILURE: Task failed
    - RETRY: Task is being retried

    Example:
    ```
    GET /tasks/abc123-def456/status

    Response:
    {
      "task_id": "abc123-def456",
      "status": "SUCCESS",
      "result": {"success": true, "output": {...}},
      "error": null
    }
    ```
    """
    try:
        from celery_app import app as celery_app
        from celery.result import AsyncResult

        task = AsyncResult(task_id, app=celery_app)

        response = {
            "task_id": task_id,
            "status": task.state,
            "result": None,
            "error": None,
            "progress": None
        }

        if task.state == 'PENDING':
            response["progress"] = {"status": "waiting", "message": "Task is queued"}

        elif task.state == 'STARTED':
            response["progress"] = task.info if task.info else {"status": "started"}

        elif task.state == 'SUCCESS':
            response["result"] = task.result
            response["completed_at"] = task.date_done.timestamp() if task.date_done else None

        elif task.state == 'FAILURE':
            response["error"] = str(task.info)
            response["completed_at"] = task.date_done.timestamp() if task.date_done else None

        elif task.state == 'RETRY':
            response["progress"] = {"status": "retrying", "message": "Task is being retried"}

        return TaskStatusResponse(**response)

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Task status not available (Celery not configured)"
        )
    except Exception as e:
        logger.error(f"Error getting task status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")


@router.post("/{task_id}/cancel", status_code=204)
async def cancel_task(
    task_id: str = Path(..., description="Celery task ID")
):
    """
    Cancel a running or pending Celery task.

    Note: This sends a revoke signal. The task may have already started execution.
    """
    try:
        from celery_app import app as celery_app

        celery_app.control.revoke(task_id, terminate=True)
        logger.info(f"Task {task_id} cancellation requested")
        return None

    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="Task cancellation not available (Celery not configured)"
        )
    except Exception as e:
        logger.error(f"Error cancelling task: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")
