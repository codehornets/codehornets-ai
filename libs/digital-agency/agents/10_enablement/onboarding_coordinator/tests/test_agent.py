"""
Tests for Onboarding Coordinator Agent
"""

import pytest
from ..agent import OnboardingCoordinatorAgent


class TestOnboardingCoordinatorAgent:
    """Test suite for OnboardingCoordinatorAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = OnboardingCoordinatorAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
