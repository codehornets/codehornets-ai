"""Tests for Demo Presenter Agent"""

import pytest
from ..agent import DemoPresenterAgent


class TestDemoPresenterAgent:
    """Test suite for Demo Presenter Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = DemoPresenterAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Demo Presenter"
        assert self.agent.role == "Product Demo Specialist"

    def test_prepare_demo(self):
        """Test demo preparation."""
        requirements = {"must_have": ["automation"], "pain_points": ["manual work"]}
        result = self.agent.prepare_demo("lead_123", requirements)
        assert result["demo_prepared"] is True
        assert "scenarios" in result

    def test_deliver_demo(self):
        """Test demo delivery."""
        demo_plan = {"scenarios": ["scenario1", "scenario2"]}
        result = self.agent.deliver_demo("lead_123", demo_plan)
        assert result["demo_delivered"] is True
        assert "engagement_score" in result

    def test_collect_feedback(self):
        """Test feedback collection."""
        result = self.agent.collect_feedback("lead_123")
        assert "feedback" in result
        assert "concerns" in result

    def test_schedule_follow_up(self):
        """Test follow-up scheduling."""
        next_steps = ["send proposal", "technical deep dive"]
        result = self.agent.schedule_follow_up("lead_123", next_steps)
        assert "follow_up_scheduled" in result
        assert result["next_steps"] == next_steps
