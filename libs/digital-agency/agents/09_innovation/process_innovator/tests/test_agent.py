"""
Tests for Process Innovator Agent
"""

import pytest
from ..agent import ProcessInnovatorAgent


class TestProcessInnovatorAgent:
    """Test suite for ProcessInnovatorAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = ProcessInnovatorAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
