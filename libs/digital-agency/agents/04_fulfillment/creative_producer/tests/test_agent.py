"""Tests for Creative Producer Agent"""

import pytest
from ..agent import CreativeProducerAgent


class TestCreativeProducerAgent:
    """Test suite for Creative Producer Agent."""

    def setup_method(self):
        """Set up test fixtures."""
        self.agent = CreativeProducerAgent()

    def test_agent_initialization(self):
        """Test agent initializes correctly."""
        assert self.agent.name == "Creative Producer"
        assert self.agent.role == "Creative Production Manager"

    def test_create_creative_brief(self):
        """Test brief creation."""
        requirements = {"objective": "Brand awareness", "assets": ["video", "graphics"]}
        result = self.agent.create_creative_brief("proj_123", requirements)
        assert "brief_id" in result

    def test_assign_creative_tasks(self):
        """Test task assignment."""
        team = ["designer_1", "writer_1"]
        result = self.agent.assign_creative_tasks("brief_123", team)
        assert "assigned" in result

    def test_manage_revisions(self):
        """Test revision management."""
        feedback = {"changes": ["update color", "resize logo"]}
        result = self.agent.manage_revisions("asset_123", feedback)
        assert "revision_number" in result

    def test_approve_creative(self):
        """Test creative approval."""
        result = self.agent.approve_creative("asset_123")
        assert "approved" in result
