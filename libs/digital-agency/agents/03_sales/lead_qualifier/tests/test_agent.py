"""
Tests for Lead Qualifier Agent
"""

import pytest
from ..agent import LeadQualifierAgent


class TestLeadQualifierAgent:
    """Test suite for Lead Qualifier Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = LeadQualifierAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Lead Qualifier"
        assert self.agent.role == "Lead Qualification Specialist"
        assert self.agent.qualification_threshold == 70

    def test_qualify_lead(self):
        """Test lead qualification."""
        lead_data = {
            "id": "lead_123",
            "company": "Test Corp",
            "contact": "John Doe",
        }
        result = self.agent.qualify_lead(lead_data)
        assert "lead_id" in result
        assert "qualified" in result
        assert "score" in result

    def test_score_lead(self):
        """Test lead scoring."""
        criteria = {
            "budget": 80,
            "authority": 70,
            "need": 90,
            "timeline": 60,
        }
        score = self.agent.score_lead(criteria)
        assert isinstance(score, int)
        assert 0 <= score <= 100

    def test_route_lead_qualified(self):
        """Test routing for qualified leads."""
        destination = self.agent.route_lead("lead_123", 85)
        assert destination == "discovery_specialist"

    def test_route_lead_unqualified(self):
        """Test routing for unqualified leads."""
        destination = self.agent.route_lead("lead_456", 45)
        assert destination == "nurture_campaign"

    def test_batch_qualify(self):
        """Test batch lead qualification."""
        leads = [
            {"id": "lead_1", "company": "Corp A"},
            {"id": "lead_2", "company": "Corp B"},
        ]
        results = self.agent.batch_qualify(leads)
        assert len(results) == 2
        assert all("lead_id" in r for r in results)
