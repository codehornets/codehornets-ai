"""Tests for Community Manager Agent."""
import pytest
from ..agent import CommunityManagerAgent

class TestCommunityManagerAgent:
    @pytest.fixture
    def agent(self):
        return CommunityManagerAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "Community Manager Agent"
        assert agent.role == "community_manager"

    @pytest.mark.asyncio
    async def test_moderate_content(self, agent):
        result = await agent.moderate_content('Test post content')
        assert 'approved' in result

    @pytest.mark.asyncio
    async def test_create_announcement(self, agent):
        result = await agent.create_announcement('Important update', ['forum', 'social'])
        assert result['status'] == 'posted'
