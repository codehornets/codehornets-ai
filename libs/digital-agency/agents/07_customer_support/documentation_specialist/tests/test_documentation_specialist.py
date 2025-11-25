"""Tests for Documentation Specialist Agent."""

import pytest
from ..agent import DocumentationSpecialistAgent


class TestDocumentationSpecialistAgent:
    """Test suite for Documentation Specialist Agent."""

    @pytest.fixture
    def agent(self):
        """Create agent instance for testing."""
        return DocumentationSpecialistAgent()

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly."""
        assert agent.name == "Documentation Specialist Agent"
        assert agent.role == "documentation_specialist"

    @pytest.mark.asyncio
    async def test_create_documentation(self, agent):
        """Test documentation creation."""
        doc = await agent.create_documentation('API Guide', 'user_guide')
        assert 'id' in doc
        assert doc['status'] == 'draft'

    @pytest.mark.asyncio
    async def test_update_knowledge_base(self, agent):
        """Test knowledge base update."""
        result = await agent.update_knowledge_base('KB-001', {'content': 'updated'})
        assert result['status'] == 'updated'

    @pytest.mark.asyncio
    async def test_generate_tutorial(self, agent):
        """Test tutorial generation."""
        tutorial = await agent.generate_tutorial('New Feature')
        assert isinstance(tutorial, str)
        assert len(tutorial) > 0
