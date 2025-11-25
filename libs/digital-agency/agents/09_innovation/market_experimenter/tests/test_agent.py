"""
Tests for Market Experimenter Agent
"""

import pytest
from ..agent import MarketExperimenterAgent


class TestMarketExperimenterAgent:
    """Test suite for MarketExperimenterAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = MarketExperimenterAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
