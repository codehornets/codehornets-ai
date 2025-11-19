"""
Tests for Tool Evaluator Agent
"""

import pytest
from ..agent import ToolEvaluatorAgent


class TestToolEvaluatorAgent:
    """Test suite for ToolEvaluatorAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = ToolEvaluatorAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
