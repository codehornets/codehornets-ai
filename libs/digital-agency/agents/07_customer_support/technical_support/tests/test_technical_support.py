"""Tests for Technical Support Agent."""

import pytest
from ..agent import TechnicalSupportAgent


class TestTechnicalSupportAgent:
    """Test suite for Technical Support Agent."""

    @pytest.fixture
    def agent(self):
        """Create agent instance for testing."""
        return TechnicalSupportAgent()

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly."""
        assert agent.name == "Technical Support Agent"
        assert agent.role == "technical_support"

    @pytest.mark.asyncio
    async def test_diagnose_issue(self, agent):
        """Test issue diagnosis."""
        issue_data = {
            'description': 'Application crashes on startup',
            'environment': 'production',
            'logs': 'Error: NullPointerException'
        }
        result = await agent.diagnose_issue(issue_data)
        assert result['status'] == 'analyzed'
        assert 'severity' in result

    @pytest.mark.asyncio
    async def test_troubleshoot(self, agent):
        """Test troubleshooting guidance."""
        problem = "Database connection timeout"
        context = {'environment': 'production'}
        steps = await agent.troubleshoot(problem, context)
        assert isinstance(steps, list)
        assert len(steps) > 0

    @pytest.mark.asyncio
    async def test_analyze_logs(self, agent):
        """Test log analysis."""
        log_data = "ERROR: Connection failed\nWARNING: Retry attempt 3"
        result = await agent.analyze_logs(log_data)
        assert 'errors_found' in result

    def test_get_status(self, agent):
        """Test agent status retrieval."""
        status = agent.get_status()
        assert status['agent'] == "Technical Support Agent"
        assert 'active_tickets' in status
