"""
Tests for Performance Developer Agent
"""

import pytest
from ..agent import PerformanceDeveloperAgent


class TestPerformanceDeveloperAgent:
    """Test suite for PerformanceDeveloperAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = PerformanceDeveloperAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
