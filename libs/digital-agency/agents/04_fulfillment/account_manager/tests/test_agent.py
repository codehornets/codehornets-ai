"""Tests for Account Manager Agent"""

import pytest
from ..agent import AccountManagerAgent


class TestAccountManagerAgent:
    """Test suite for Account Manager Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = AccountManagerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Account Manager"
        assert self.agent.role == "Client Relationship Manager"

    def test_check_in_with_client(self):
        """Test client check-in."""
        result = self.agent.check_in_with_client("client_123")
        assert "satisfaction_score" in result
        assert "concerns" in result

    def test_handle_escalation(self):
        """Test escalation handling."""
        issue = {"type": "quality", "severity": "high"}
        result = self.agent.handle_escalation(issue)
        assert "resolved" in result

    def test_identify_upsell_opportunities(self):
        """Test opportunity identification."""
        opportunities = self.agent.identify_upsell_opportunities("client_123")
        assert isinstance(opportunities, list)

    def test_measure_satisfaction(self):
        """Test satisfaction measurement."""
        result = self.agent.measure_satisfaction("client_123")
        assert "csat_score" in result
        assert "nps_score" in result
