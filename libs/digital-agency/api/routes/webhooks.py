"""
Webhook API routes for external integrations.
"""

from fastapi import APIRouter, HTTPException, Header, Request
from typing import Optional
from datetime import datetime
import hmac
import hashlib
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify webhook signature using HMAC-SHA256.
    """
    expected_signature = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, f"sha256={expected_signature}")


@router.post("/workflow/completed")
async def workflow_completed_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
):
    """
    Handle workflow completion webhooks.
    """
    body = await request.body()
    data = await request.json()

    # Verify signature if provided
    if x_webhook_signature:
        webhook_secret = "your-webhook-secret"  # Load from config
        if not verify_webhook_signature(body, x_webhook_signature, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")

    workflow_id = data.get('workflow_id')
    status = data.get('status')

    logger.info(f"Workflow {workflow_id} completed with status: {status}")

    # Process webhook data
    # Add your webhook processing logic here

    return {
        "received": True,
        "workflow_id": workflow_id,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/task/status")
async def task_status_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
):
    """
    Handle task status change webhooks.
    """
    body = await request.body()
    data = await request.json()

    # Verify signature if provided
    if x_webhook_signature:
        webhook_secret = "your-webhook-secret"  # Load from config
        if not verify_webhook_signature(body, x_webhook_signature, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")

    task_id = data.get('task_id')
    status = data.get('status')

    logger.info(f"Task {task_id} status changed to: {status}")

    # Process webhook data
    # Add your webhook processing logic here

    return {
        "received": True,
        "task_id": task_id,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/agent/event")
async def agent_event_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
):
    """
    Handle agent event webhooks.
    """
    body = await request.body()
    data = await request.json()

    # Verify signature if provided
    if x_webhook_signature:
        webhook_secret = "your-webhook-secret"  # Load from config
        if not verify_webhook_signature(body, x_webhook_signature, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")

    agent_id = data.get('agent_id')
    event_type = data.get('event_type')

    logger.info(f"Agent {agent_id} event: {event_type}")

    # Process webhook data
    # Add your webhook processing logic here

    return {
        "received": True,
        "agent_id": agent_id,
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/external/integration")
async def external_integration_webhook(
    request: Request,
    x_webhook_signature: Optional[str] = Header(None)
):
    """
    Handle webhooks from external integrations.
    """
    body = await request.body()
    data = await request.json()

    # Verify signature if provided
    if x_webhook_signature:
        webhook_secret = "your-webhook-secret"  # Load from config
        if not verify_webhook_signature(body, x_webhook_signature, webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid signature")

    integration_source = data.get('source')
    event_data = data.get('data')

    logger.info(f"External webhook received from: {integration_source}")

    # Process webhook data based on source
    # Add your integration-specific logic here

    return {
        "received": True,
        "source": integration_source,
        "timestamp": datetime.utcnow().isoformat()
    }
