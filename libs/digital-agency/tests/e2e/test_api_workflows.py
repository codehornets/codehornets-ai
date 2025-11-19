"""
End-to-end tests for API and workflow integration.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create authorization headers."""
    return {"Authorization": "Bearer test-token"}


class TestEndToEndScenarios:
    """End-to-end test scenarios."""

    def test_agent_lifecycle(self, client, auth_headers):
        """Test complete agent lifecycle: create, use, update, delete."""

        # Create agent
        agent_data = {
            "name": "E2E Test Agent",
            "domain": "test",
            "role": "End-to-end testing",
            "capabilities": ["testing", "validation"]
        }

        create_response = client.post(
            "/api/v1/agents/",
            json=agent_data,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        agent = create_response.json()
        agent_id = agent["agent_id"]

        # Get agent
        get_response = client.get(
            f"/api/v1/agents/{agent_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200

        # Update agent
        update_data = {"status": "inactive"}
        update_response = client.put(
            f"/api/v1/agents/{agent_id}",
            json=update_data,
            headers=auth_headers
        )
        assert update_response.status_code == 200

        # Delete agent
        delete_response = client.delete(
            f"/api/v1/agents/{agent_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 204

    def test_task_execution_flow(self, client, auth_headers):
        """Test complete task execution flow."""

        # Create agent first
        agent_data = {
            "name": "Task Test Agent",
            "domain": "test",
            "role": "Task execution",
            "capabilities": ["task_execution"]
        }

        agent_response = client.post(
            "/api/v1/agents/",
            json=agent_data,
            headers=auth_headers
        )
        agent_id = agent_response.json()["agent_id"]

        # Create task
        task_data = {
            "agent_id": agent_id,
            "type": "test_task",
            "description": "E2E test task",
            "priority": "high"
        }

        task_response = client.post(
            "/api/v1/tasks/",
            json=task_data,
            headers=auth_headers
        )
        assert task_response.status_code == 201
        task = task_response.json()
        task_id = task["task_id"]

        # Get task status
        status_response = client.get(
            f"/api/v1/tasks/{task_id}",
            headers=auth_headers
        )
        assert status_response.status_code == 200

        # Execute task
        execute_response = client.post(
            f"/api/v1/tasks/{task_id}/execute",
            headers=auth_headers
        )
        assert execute_response.status_code == 200

    def test_webhook_integration(self, client):
        """Test webhook integration flow."""

        # Send workflow completion webhook
        webhook_data = {
            "workflow_id": "e2e_wf_123",
            "status": "completed",
            "data": {
                "result": "success"
            }
        }

        response = client.post(
            "/api/v1/webhooks/workflow/completed",
            json=webhook_data
        )
        assert response.status_code == 200
        assert response.json()["received"] is True

    def test_health_monitoring(self, client):
        """Test complete health monitoring flow."""

        # Check basic health
        health_response = client.get("/api/v1/health")
        assert health_response.status_code == 200

        # Check detailed health
        detailed_response = client.get("/api/v1/health/detailed")
        assert detailed_response.status_code == 200
        detailed = detailed_response.json()
        assert "components" in detailed

        # Check readiness
        ready_response = client.get("/api/v1/ready")
        assert ready_response.status_code == 200

        # Check liveness
        live_response = client.get("/api/v1/live")
        assert live_response.status_code == 200
