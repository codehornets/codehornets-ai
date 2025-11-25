"""Tests for Objection Handler Agent"""

import pytest
from ..agent import ObjectionHandlerAgent


class TestObjectionHandlerAgent:
    """Test suite for Objection Handler Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = ObjectionHandlerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Objection Handler"
        assert self.agent.role == "Objection Handling Specialist"

    def test_identify_objection(self):
        """Test objection identification."""
        statement = "This seems too expensive for our budget"
        result = self.agent.identify_objection(statement)
        assert "objection_type" in result
        assert "severity" in result
        assert "category" in result

    def test_respond_to_objection(self):
        """Test objection response generation."""
        objection = {"type": "price", "statement": "too expensive"}
        result = self.agent.respond_to_objection(objection)
        assert "strategy" in result
        assert "response" in result
        assert "supporting_evidence" in result

    def test_track_objections(self):
        """Test objection tracking."""
        objections = self.agent.track_objections("lead_123")
        assert isinstance(objections, list)

    def test_escalate_objection(self):
        """Test objection escalation."""
        result = self.agent.escalate_objection("obj_123", "complex_technical")
        assert result["escalated"] is True
        assert "assigned_to" in result
