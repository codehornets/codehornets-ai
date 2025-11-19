"""Tests for Competitor Analyst Agent"""

import pytest
from ..agent import CompetitorAnalystAgent


class TestCompetitorAnalystAgent:
    def setup_method(self):
        self.agent = CompetitorAnalystAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "competitor_analyst_001"
        assert self.agent.name == "Competitor Analyst"

    def test_analyze_competitor(self):
        result = self.agent.analyze_competitor("Test Competitor")
        assert result["name"] == "Test Competitor"
        assert "strengths" in result
