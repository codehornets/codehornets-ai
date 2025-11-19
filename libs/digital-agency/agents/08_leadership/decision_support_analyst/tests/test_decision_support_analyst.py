"""Tests for Decision Support Analyst Agent."""
import pytest
from ..agent import DecisionSupportAnalystAgent

class TestDecisionSupportAnalystAgent:
    @pytest.fixture
    def agent(self):
        return DecisionSupportAnalystAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "Decision Support Analyst Agent"

    @pytest.mark.asyncio
    async def test_analyze_data(self, agent):
        result = await agent.analyze_data({})
        assert 'insights' in result
