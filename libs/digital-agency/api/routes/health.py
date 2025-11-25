"""
Health check and system status endpoints.
"""

from fastapi import APIRouter
from datetime import datetime
from typing import Dict, Any
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Comprehensive health check endpoint.

    Returns system status, component health, and diagnostics.
    """
    from api.core import AgentDiscovery

    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "digital-agency-api",
        "version": "1.0.0",
        "components": {}
    }

    # Check agent discovery
    try:
        discovery = AgentDiscovery()
        discovery.discover_agents()
        domains = discovery.list_domains()
        total_agents = sum(len(agents) for agents in discovery.agents_catalog.values())

        health_status["components"]["agent_discovery"] = {
            "status": "healthy",
            "domains": len(domains),
            "total_agents": total_agents
        }
    except Exception as e:
        logger.error(f"Agent discovery health check failed: {e}")
        health_status["components"]["agent_discovery"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"

    # Check Celery
    try:
        from celery_app import app as celery_app
        celery_inspect = celery_app.control.inspect()
        active_workers = celery_inspect.active()

        health_status["components"]["celery"] = {
            "status": "healthy" if active_workers else "degraded",
            "workers": len(active_workers) if active_workers else 0
        }
    except Exception as e:
        logger.warning(f"Celery health check failed: {e}")
        health_status["components"]["celery"] = {
            "status": "unavailable",
            "error": "Celery not configured or not running"
        }

    # Check Redis
    try:
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            health_status["components"]["redis"] = {
                "status": "configured",
                "url": redis_url.split('@')[-1] if '@' in redis_url else 'localhost'
            }
        else:
            health_status["components"]["redis"] = {
                "status": "not_configured"
            }
    except Exception as e:
        health_status["components"]["redis"] = {
            "status": "error",
            "error": str(e)
        }

    return health_status


@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.

    Returns 200 if service is ready to accept traffic.
    """
    from api.core import AgentDiscovery

    try:
        # Check if we can discover agents
        discovery = AgentDiscovery()
        discovery.discover_agents()

        return {
            "ready": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return {
            "ready": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.

    Returns 200 if service is alive (doesn't check dependencies).
    """
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/detailed")
async def detailed_health() -> Dict[str, Any]:
    """
    Detailed health check with metrics and diagnostics.

    Includes system info, component versions, and performance metrics.
    """
    import platform
    import sys

    health = await health_check()

    health["system"] = {
        "platform": platform.platform(),
        "python_version": sys.version,
        "architecture": platform.machine()
    }

    health["environment"] = {
        "redis_configured": bool(os.getenv('REDIS_URL')),
        "celery_broker": os.getenv('CELERY_BROKER_URL', 'not configured').split('@')[-1] if os.getenv('CELERY_BROKER_URL') else 'not configured'
    }

    return health
