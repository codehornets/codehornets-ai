"""Tests for CEO Strategy Director Agent."""
import pytest
from ..agent import CEOStrategyDirectorAgent

class TestCEOStrategyDirectorAgent:
    @pytest.fixture
    def agent(self):
        return CEOStrategyDirectorAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "CEO Strategy Director Agent"
        assert agent.role == "ceo_strategy_director"

    @pytest.mark.asyncio
    async def test_develop_strategy(self, agent):
        strategy = await agent.develop_strategy({'objectives': ['growth'], 'timeline': '12 months'})
        assert 'id' in strategy
        assert strategy['status'] == 'draft'

    @pytest.mark.asyncio
    async def test_make_decision(self, agent):
        result = await agent.make_decision({'question': 'Should we expand to new market?'})
        assert 'recommendation' in result
