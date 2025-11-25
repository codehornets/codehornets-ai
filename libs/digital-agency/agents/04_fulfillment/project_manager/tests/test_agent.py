"""Tests for Project Manager Agent"""

import pytest
from ..agent import ProjectManagerAgent


class TestProjectManagerAgent:
    """Test suite for Project Manager Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = ProjectManagerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Project Manager"
        assert self.agent.role == "Project Management Specialist"

    def test_create_project_plan(self):
        """Test project plan creation."""
        requirements = {"deliverables": ["website", "app"], "timeline": "3 months"}
        result = self.agent.create_project_plan("proj_123", requirements)
        assert "plan_created" in result
        assert "milestones" in result

    def test_allocate_resources(self):
        """Test resource allocation."""
        requirements = {"skills": ["design", "development"], "hours": 200}
        result = self.agent.allocate_resources("proj_123", requirements)
        assert "team_assigned" in result
        assert "resources" in result

    def test_track_progress(self):
        """Test progress tracking."""
        result = self.agent.track_progress("proj_123")
        assert "completion_percentage" in result
        assert "on_track" in result
        assert "blockers" in result

    def test_manage_risks(self):
        """Test risk management."""
        risks = [{"type": "timeline", "impact": "high"}]
        result = self.agent.manage_risks("proj_123", risks)
        assert "risks_tracked" in result
        assert result["risks_tracked"] == 1

    def test_update_timeline(self):
        """Test timeline updates."""
        changes = {"delay_days": 5, "reason": "client feedback"}
        result = self.agent.update_timeline("proj_123", changes)
        assert "timeline_updated" in result
