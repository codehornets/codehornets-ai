"""Tests for Vision Architect Agent."""
import pytest
from ..agent import VisionArchitectAgent

class TestVisionArchitectAgent:
    @pytest.fixture
    def agent(self):
        return VisionArchitectAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "Vision Architect Agent"

    @pytest.mark.asyncio
    async def test_craft_vision(self, agent):
        result = await agent.craft_vision({})
        assert 'vision' in result
