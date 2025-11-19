"""Tests for Delivery Coordinator Agent"""

import pytest
from ..agent import DeliveryCoordinatorAgent


class TestDeliveryCoordinatorAgent:
    """Test suite for Delivery Coordinator Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = DeliveryCoordinatorAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Delivery Coordinator"
        assert self.agent.role == "Delivery & Handoff Specialist"

    def test_prepare_delivery_package(self):
        """Test delivery package preparation."""
        result = self.agent.prepare_delivery_package("proj_123")
        assert "package_id" in result
        assert "ready" in result
        assert "contents" in result

    def test_schedule_delivery(self):
        """Test delivery scheduling."""
        result = self.agent.schedule_delivery("proj_123", "2024-01-15")
        assert "scheduled" in result
        assert "delivery_date" in result

    def test_conduct_training(self):
        """Test training conduction."""
        attendees = ["user1@example.com", "user2@example.com"]
        result = self.agent.conduct_training("proj_123", attendees)
        assert "training_complete" in result
        assert result["attendees"] == attendees

    def test_prepare_documentation(self):
        """Test documentation preparation."""
        result = self.agent.prepare_documentation("proj_123")
        assert "documentation_ready" in result
        assert "documents" in result

    def test_complete_handoff(self):
        """Test handoff completion."""
        result = self.agent.complete_handoff("proj_123")
        assert "handoff_complete" in result
        assert result["project_id"] == "proj_123"
