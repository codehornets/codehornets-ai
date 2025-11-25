"""Tests for User Training Coordinator Agent."""
import pytest
from ..agent import UserTrainingCoordinatorAgent

class TestUserTrainingCoordinatorAgent:
    @pytest.fixture
    def agent(self):
        return UserTrainingCoordinatorAgent()

    def test_agent_initialization(self, agent):
        assert agent.name == "User Training Coordinator Agent"
        assert agent.role == "user_training_coordinator"

    @pytest.mark.asyncio
    async def test_create_training_program(self, agent):
        program = await agent.create_training_program({'name': 'Onboarding', 'modules': []})
        assert 'id' in program
        assert program['status'] == 'draft'
