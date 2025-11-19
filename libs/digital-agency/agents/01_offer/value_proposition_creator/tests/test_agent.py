"""Tests for Value Proposition Creator Agent"""

import pytest
from ..agent import ValuePropositionCreatorAgent


class TestValuePropositionCreatorAgent:
    def setup_method(self):
        self.agent = ValuePropositionCreatorAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "value_proposition_creator_001"
        assert self.agent.name == "Value Proposition Creator"

    def test_create_value_proposition(self):
        result = self.agent.create_value_proposition(
            service_id="svc_001",
            target_audience="small_businesses",
            key_benefits=["increase_traffic", "save_time"]
        )
        assert "vp_id" in result
        assert result["target_audience"] == "small_businesses"
