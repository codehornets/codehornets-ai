"""Tests for Proposal Writer Agent"""

import pytest
from ..agent import ProposalWriterAgent


class TestProposalWriterAgent:
    def setup_method(self):
        self.agent = ProposalWriterAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "proposal_writer_001"
        assert self.agent.name == "Proposal Writer"

    def test_create_proposal(self):
        result = self.agent.create_proposal(
            client_info={"name": "Test Client"},
            service_package={"name": "SEO Package"}
        )
        assert "proposal_id" in result
        assert result["status"] == "draft"
