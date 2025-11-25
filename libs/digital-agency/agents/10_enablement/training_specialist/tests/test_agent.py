"""
Tests for Training Specialist Agent
"""

import pytest
from ..agent import TrainingSpecialistAgent


class TestTrainingSpecialistAgent:
    """Test suite for TrainingSpecialistAgent"""

    def setup_method(self):
        """Set up test fixtures"""
        self.agent = TrainingSpecialistAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly"""
        assert self.agent.agent_id is not None
        assert self.agent.name is not None
        assert self.agent.role is not None
