"""
Health check and status API routes.
"""

from fastapi import APIRouter
from datetime import datetime
import platform
import sys

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Basic health check endpoint.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "digital-agency-api"
    }


@router.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with system information.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "digital-agency-api",
        "version": "1.0.0",
        "system": {
            "python_version": sys.version,
            "platform": platform.platform(),
            "processor": platform.processor()
        },
        "components": {
            "api": "healthy",
            "database": "healthy",  # Replace with actual check
            "cache": "healthy",  # Replace with actual check
            "agents": "healthy"  # Replace with actual check
        }
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes.
    """
    # Add checks for dependencies (database, cache, etc.)
    dependencies_ready = True

    if dependencies_ready:
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        return {
            "status": "not_ready",
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/live")
async def liveness_check():
    """
    Liveness check for Kubernetes.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }
