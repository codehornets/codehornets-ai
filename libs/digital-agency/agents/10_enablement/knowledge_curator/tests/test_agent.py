"""
Tests for Knowledge Curator Agent
"""

import pytest
from ..agent import KnowledgeCuratorAgent


class TestKnowledgeCuratorAgent:
    """Test suite for KnowledgeCuratorAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = KnowledgeCuratorAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
