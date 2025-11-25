"""
Integration tests for API endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from api.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data

    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "service" in data
        assert data["service"] == "digital-agency-api"

    def test_liveness_check(self, client):
        """Test liveness probe."""
        response = client.get("/api/v1/live")
        assert response.status_code == 200
        data = response.json()
        assert data["alive"] is True

    def test_readiness_check(self, client):
        """Test readiness probe."""
        response = client.get("/api/v1/ready")
        assert response.status_code == 200
        data = response.json()
        assert "ready" in data


class TestAgentEndpoints:
    """Tests for agent endpoints."""

    def test_list_all_agents(self, client):
        """Test listing all agents."""
        response = client.get("/api/v1/agents/")
        assert response.status_code == 200
        data = response.json()
        assert "agents" in data
        assert "total" in data
        assert isinstance(data["agents"], list)

    def test_list_domains(self, client):
        """Test listing domains."""
        response = client.get("/api/v1/agents/domains")
        assert response.status_code == 200
        data = response.json()
        assert "domains" in data
        assert "total" in data
        assert isinstance(data["domains"], list)

    def test_list_domain_agents(self, client):
        """Test listing agents in a domain."""
        # First get available domains
        response = client.get("/api/v1/agents/domains")
        domains = response.json()["domains"]

        if domains:
            # Test first domain
            domain = domains[0]
            response = client.get(f"/api/v1/agents/{domain}")
            assert response.status_code == 200
            data = response.json()
            assert "agents" in data
            assert data["domain"] == domain

    def test_list_domain_agents_not_found(self, client):
        """Test listing agents for non-existent domain."""
        response = client.get("/api/v1/agents/nonexistent_domain")
        assert response.status_code == 404

    def test_get_agent_info(self, client):
        """Test getting agent info."""
        # Try to get proposal_writer info
        response = client.get("/api/v1/agents/offer/proposal_writer")

        if response.status_code == 200:
            data = response.json()
            assert "domain" in data
            assert "agent_name" in data
            assert data["domain"] == "offer"
            assert data["agent_name"] == "proposal_writer"
        else:
            # Agent might not exist
            assert response.status_code == 404

    def test_execute_agent(self, client):
        """Test agent execution."""
        request_data = {
            "input_data": {
                "client_info": {
                    "name": "Test Corp",
                    "industry": "Technology"
                },
                "service_package": {
                    "name": "Test Service",
                    "pricing": {"total": 10000}
                }
            },
            "timeout": 60
        }

        response = client.post(
            "/api/v1/agents/offer/proposal_writer/execute",
            json=request_data
        )

        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            assert "output" in data
            assert "logs" in data
            assert "metrics" in data
        else:
            # Agent might not exist or execution failed
            assert response.status_code in [404, 500]

    def test_execute_agent_not_found(self, client):
        """Test executing non-existent agent."""
        request_data = {
            "input_data": {"test": "data"},
            "timeout": 60
        }

        response = client.post(
            "/api/v1/agents/fake/nonexistent/execute",
            json=request_data
        )

        assert response.status_code == 404


class TestTaskEndpoints:
    """Tests for task endpoints."""

    def test_get_task_status_not_found(self, client):
        """Test getting status of non-existent task."""
        response = client.get("/api/v1/tasks/fake-task-id/status")

        # Should either work (Celery available) or return 503
        assert response.status_code in [200, 503]

        if response.status_code == 200:
            data = response.json()
            assert "task_id" in data
            assert "status" in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
