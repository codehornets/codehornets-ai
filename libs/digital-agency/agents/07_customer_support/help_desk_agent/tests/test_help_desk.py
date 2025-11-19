"""Tests for Help Desk Agent."""

import pytest
from ..agent import HelpDeskAgent


class TestHelpDeskAgent:
    """Test suite for Help Desk Agent."""

    @pytest.fixture
    def agent(self):
        """Create agent instance for testing."""
        return HelpDeskAgent()

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly."""
        assert agent.name == "Help Desk Agent"
        assert agent.role == "help_desk"

    @pytest.mark.asyncio
    async def test_create_ticket(self, agent):
        """Test ticket creation."""
        customer_data = {
            'name': 'John Doe',
            'email': 'john@example.com',
            'issue': 'Cannot login to account'
        }
        ticket = await agent.create_ticket(customer_data)
        assert 'ticket_id' in ticket
        assert ticket['status'] == 'open'

    @pytest.mark.asyncio
    async def test_route_ticket(self, agent):
        """Test ticket routing."""
        result = await agent.route_ticket('TKT-001', 'technical_support')
        assert result['status'] == 'routed'
        assert result['routed_to'] == 'technical_support'

    @pytest.mark.asyncio
    async def test_respond_to_inquiry(self, agent):
        """Test inquiry response."""
        response = await agent.respond_to_inquiry('How do I reset my password?')
        assert isinstance(response, str)
        assert len(response) > 0

    def test_get_queue_status(self, agent):
        """Test queue status retrieval."""
        status = agent.get_queue_status()
        assert status['agent'] == "Help Desk Agent"
        assert 'queue_length' in status
