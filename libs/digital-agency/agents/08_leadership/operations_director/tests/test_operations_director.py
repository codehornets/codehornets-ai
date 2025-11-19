"""Tests for Operations Director Agent."""
import pytest
from ..agent import OperationsDirectorAgent

class TestOperationsDirectorAgent:
    @pytest.fixture
    def agent(self):
        return OperationsDirectorAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "Operations Director Agent"
        assert agent.role == "operations_director"

    @pytest.mark.asyncio
    async def test_optimize_operations(self, agent):
        result = await agent.optimize_operations({})
        assert 'status' in result
