"""
Unit tests for API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_health_check(self, client):
        """Test basic health check."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_detailed_health_check(self, client):
        """Test detailed health check."""
        response = client.get("/api/v1/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert "components" in data
        assert "system" in data

    def test_readiness_check(self, client):
        """Test readiness probe."""
        response = client.get("/api/v1/ready")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_liveness_check(self, client):
        """Test liveness probe."""
        response = client.get("/api/v1/live")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "alive"


class TestAgentEndpoints:
    """Test agent management endpoints."""

    def test_list_agents_unauthorized(self, client):
        """Test listing agents without auth."""
        response = client.get("/api/v1/agents/")
        assert response.status_code == 401

    def test_list_agents_authorized(self, client):
        """Test listing agents with auth."""
        headers = {"Authorization": "Bearer test-token"}
        response = client.get("/api/v1/agents/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert "total" in data

    def test_create_agent(self, client):
        """Test creating a new agent."""
        headers = {"Authorization": "Bearer test-token"}
        agent_data = {
            "name": "Test Agent",
            "domain": "test",
            "role": "Testing",
            "capabilities": ["test"]
        }
        response = client.post("/api/v1/agents/", json=agent_data, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Agent"
        assert "agent_id" in data


class TestTaskEndpoints:
    """Test task management endpoints."""

    def test_list_tasks(self, client):
        """Test listing tasks."""
        headers = {"Authorization": "Bearer test-token"}
        response = client.get("/api/v1/tasks/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data

    def test_create_task(self, client):
        """Test creating a task."""
        headers = {"Authorization": "Bearer test-token"}
        task_data = {
            "agent_id": "agent_123",
            "type": "test",
            "description": "Test task"
        }
        response = client.post("/api/v1/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "pending"


class TestWebhookEndpoints:
    """Test webhook endpoints."""

    def test_workflow_completed_webhook(self, client):
        """Test workflow completion webhook."""
        webhook_data = {
            "workflow_id": "wf_123",
            "status": "completed"
        }
        response = client.post("/api/v1/webhooks/workflow/completed", json=webhook_data)
        assert response.status_code == 200
        data = response.json()
        assert data["received"] is True

    def test_task_status_webhook(self, client):
        """Test task status webhook."""
        webhook_data = {
            "task_id": "task_123",
            "status": "completed"
        }
        response = client.post("/api/v1/webhooks/task/status", json=webhook_data)
        assert response.status_code == 200
