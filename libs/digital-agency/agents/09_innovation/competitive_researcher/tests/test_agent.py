"""
Tests for Competitive Researcher Agent
"""

import pytest
from ..agent import CompetitiveResearcherAgent


class TestCompetitiveResearcherAgent:
    """Test suite for CompetitiveResearcherAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = CompetitiveResearcherAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
