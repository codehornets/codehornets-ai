"""
Tests for Culture Builder Agent
"""

import pytest
from ..agent import CultureBuilderAgent


class TestCultureBuilderAgent:
    """Test suite for CultureBuilderAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = CultureBuilderAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
