"""Tests for Performance Manager Agent."""
import pytest
from ..agent import PerformanceManagerAgent

class TestPerformanceManagerAgent:
    @pytest.fixture
    def agent(self):
        return PerformanceManagerAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "Performance Manager Agent"

    @pytest.mark.asyncio
    async def test_track_kpis(self, agent):
        result = await agent.track_kpis(['revenue', 'customer_satisfaction'])
        assert 'kpis' in result
