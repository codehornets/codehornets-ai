"""
Tests for Discovery Specialist Agent
"""

import pytest
from ..agent import DiscoverySpecialistAgent


class TestDiscoverySpecialistAgent:
    """Test suite for Discovery Specialist Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = DiscoverySpecialistAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Discovery Specialist"
        assert self.agent.role == "Discovery & Requirements Specialist"

    def test_schedule_discovery(self):
        """Test discovery session scheduling."""
        availability = ["2024-01-15 10:00", "2024-01-15 14:00"]
        result = self.agent.schedule_discovery("lead_123", availability)
        assert "lead_id" in result
        assert "scheduled" in result
        assert result["lead_id"] == "lead_123"

    def test_conduct_discovery(self):
        """Test discovery session execution."""
        responses = {
            "current_state": "Manual processes",
            "challenges": "Time consuming, error-prone",
        }
        result = self.agent.conduct_discovery("lead_123", responses)
        assert "lead_id" in result
        assert "session_complete" in result

    def test_identify_pain_points(self):
        """Test pain point identification."""
        session_data = {
            "responses": {
                "challenges": "Manual data entry, frequent errors"
            }
        }
        pain_points = self.agent.identify_pain_points(session_data)
        assert isinstance(pain_points, list)

    def test_document_requirements(self):
        """Test requirements documentation."""
        requirements = {
            "must_have": ["automation", "integration"],
            "nice_to_have": ["analytics"],
        }
        result = self.agent.document_requirements("lead_123", requirements)
        assert result["documented"] is True

    def test_prepare_summary(self):
        """Test summary preparation."""
        result = self.agent.prepare_summary("lead_123")
        assert "lead_id" in result
        assert "summary" in result
        assert "ready_for_demo" in result
