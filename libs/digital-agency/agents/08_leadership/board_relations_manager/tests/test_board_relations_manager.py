"""Tests for Board Relations Manager Agent."""
import pytest
from ..agent import BoardRelationsManagerAgent

class TestBoardRelationsManagerAgent:
    @pytest.fixture
    def agent(self):
        return BoardRelationsManagerAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "Board Relations Manager Agent"

    @pytest.mark.asyncio
    async def test_prepare_board_report(self, agent):
        result = await agent.prepare_board_report('Q1-2025')
        assert 'report' in result
