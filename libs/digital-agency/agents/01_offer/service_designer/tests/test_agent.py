"""Tests for Service Designer Agent"""

import pytest
from ..agent import ServiceDesignerAgent


class TestServiceDesignerAgent:
    def setup_method(self):
        self.agent = ServiceDesignerAgent()

    def test_agent_initialization(self):
        assert self.agent.agent_id == "service_designer_001"
        assert self.agent.name == "Service Designer"

    def test_design_service_package(self):
        result = self.agent.design_service_package(
            service_name="SEO Package",
            target_audience="small_businesses",
            objectives=["increase_traffic", "improve_rankings"]
        )
        assert result["name"] == "SEO Package"
        assert "deliverables" in result
