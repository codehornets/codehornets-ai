"""
Tests for Pilot Program Manager Agent
"""

import pytest
from ..agent import PilotProgramManagerAgent


class TestPilotProgramManagerAgent:
    """Test suite for PilotProgramManagerAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = PilotProgramManagerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
