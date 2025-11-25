"""Tests for Bug Tracker Agent."""

import pytest
from ..agent import BugTrackerAgent


class TestBugTrackerAgent:
    """Test suite for Bug Tracker Agent."""

    @pytest.fixture
    def agent(self):
        """Create agent instance for testing."""
        return BugTrackerAgent()

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly."""
        assert agent.name == "Bug Tracker Agent"
        assert agent.role == "bug_tracker"

    @pytest.mark.asyncio
    async def test_create_bug_report(self, agent):
        """Test bug report creation."""
        bug_data = {
            'title': 'Application crash on login',
            'severity': 'high',
            'description': 'App crashes when user enters credentials'
        }
        bug = await agent.create_bug_report(bug_data)
        assert 'id' in bug
        assert bug['status'] == 'open'

    @pytest.mark.asyncio
    async def test_categorize_bug(self, agent):
        """Test bug categorization."""
        result = await agent.categorize_bug('BUG-001')
        assert 'category' in result

    @pytest.mark.asyncio
    async def test_prioritize_bugs(self, agent):
        """Test bug prioritization."""
        bugs = await agent.prioritize_bugs()
        assert isinstance(bugs, list)
