"""
Tests for Recruiting Specialist Agent
"""

import pytest
from ..agent import RecruitingSpecialistAgent


class TestRecruitingSpecialistAgent:
    """Test suite for RecruitingSpecialistAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = RecruitingSpecialistAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
