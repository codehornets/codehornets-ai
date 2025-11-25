"""
Tests for AgentExecutor.
"""

import pytest
import asyncio
from pathlib import Path

from api.core import AgentExecutor, AgentDiscovery
from api.core.exceptions import AgentNotFoundError, AgentValidationError


@pytest.fixture
def executor():
    """Create an AgentExecutor instance."""
    discovery = AgentDiscovery()
    return AgentExecutor(discovery=discovery)


@pytest.fixture
def discovery():
    """Create an AgentDiscovery instance."""
    return AgentDiscovery()


class TestAgentDiscovery:
    """Tests for AgentDiscovery class."""

    def test_discover_agents(self, discovery):
        """Test agent discovery."""
        catalog = discovery.discover_agents()
        assert isinstance(catalog, dict)
        # Should discover at least one domain
        assert len(catalog) > 0

    def test_list_domains(self, discovery):
        """Test listing domains."""
        domains = discovery.list_domains()
        assert isinstance(domains, list)
        # Should have at least 'offer' domain
        assert any('offer' in d for d in domains)

    def test_list_all_agents(self, discovery):
        """Test listing all agents."""
        agents = discovery.list_all_agents()
        assert isinstance(agents, list)
        # Should discover at least the proposal_writer agent
        assert any(agent.agent_name == 'proposal_writer' for agent in agents)

    def test_search_agents_by_capability(self, discovery):
        """Test searching agents by capability."""
        agents = discovery.search_agents(capability='proposal_creation')
        assert isinstance(agents, list)
        # Should find proposal_writer which has this capability
        if agents:
            assert any(agent.agent_name == 'proposal_writer' for agent in agents)

    def test_get_agent_metadata(self, discovery):
        """Test getting specific agent metadata."""
        metadata = discovery.get_agent_metadata('offer', 'proposal_writer')
        if metadata:
            assert metadata.domain == 'offer'
            assert metadata.agent_name == 'proposal_writer'
            assert metadata.name == 'Proposal Writer'
            assert isinstance(metadata.capabilities, list)


class TestAgentExecutor:
    """Tests for AgentExecutor class."""

    def test_load_agent_success(self, executor):
        """Test successful agent loading."""
        try:
            agent = executor.load_agent('offer', 'proposal_writer')
            assert agent is not None
            assert hasattr(agent, 'create_proposal') or hasattr(agent, 'execute') or hasattr(agent, 'run')
        except AgentNotFoundError:
            pytest.skip("proposal_writer agent not available")

    def test_load_agent_not_found(self, executor):
        """Test loading non-existent agent."""
        with pytest.raises(AgentNotFoundError):
            executor.load_agent('nonexistent', 'fake_agent')

    def test_load_agent_caching(self, executor):
        """Test agent caching."""
        try:
            # Load agent first time
            agent1 = executor.load_agent('offer', 'proposal_writer', use_cache=True)

            # Load again with cache
            agent2 = executor.load_agent('offer', 'proposal_writer', use_cache=True)

            # Should be same instance
            assert agent1 is agent2

            # Load without cache
            agent3 = executor.load_agent('offer', 'proposal_writer', use_cache=False)

            # Should be different instance
            assert agent1 is not agent3
        except AgentNotFoundError:
            pytest.skip("proposal_writer agent not available")

    @pytest.mark.asyncio
    async def test_execute_agent_success(self, executor):
        """Test successful agent execution."""
        try:
            input_data = {
                "client_info": {
                    "name": "Test Corp",
                    "industry": "Technology"
                },
                "service_package": {
                    "name": "Test Service",
                    "pricing": {"total": 10000}
                }
            }

            result = await executor.execute(
                domain='offer',
                agent_name='proposal_writer',
                input_data=input_data,
                timeout=60
            )

            assert result is not None
            assert 'success' in result
            assert 'output' in result
            assert 'logs' in result
            assert 'metrics' in result
        except AgentNotFoundError:
            pytest.skip("proposal_writer agent not available")

    @pytest.mark.asyncio
    async def test_execute_agent_timeout(self, executor):
        """Test agent execution timeout."""
        # This test would require a slow agent
        pytest.skip("Requires slow agent implementation")

    def test_get_agent_info(self, executor):
        """Test getting agent info."""
        try:
            info = executor.get_agent_info('offer', 'proposal_writer')

            assert info is not None
            assert info['domain'] == 'offer'
            assert info['agent_name'] == 'proposal_writer'
            assert 'capabilities' in info
            assert 'methods' in info or 'description' in info
        except AgentNotFoundError:
            pytest.skip("proposal_writer agent not available")

    def test_clear_cache(self, executor):
        """Test cache clearing."""
        try:
            # Load agent to populate cache
            executor.load_agent('offer', 'proposal_writer', use_cache=True)

            # Clear specific agent cache
            executor.clear_cache(domain='offer', agent_name='proposal_writer')

            # Clear all cache
            executor.clear_cache()
        except AgentNotFoundError:
            pytest.skip("proposal_writer agent not available")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
